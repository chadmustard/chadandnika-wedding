import { config } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { resolvePlace } from '../src/lib/places';
import { normalizePhone } from '../src/lib/phone';
import { EVENTS, EVENT_ORDER, type EventSlug } from '../src/lib/events';

config({ path: '.env.local' });
config({ path: '.env' });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

const COUPLE_NAMES = new Set(['Chad Mustard', 'Veronika Matsuk']);

const DEV_TOKENS: Record<string, string> = {
  'Chad Mustard': 'dev-chad',
  'Veronika Matsuk': 'dev-nika',
};

type GuestRow = {
  name: string;
  phone: string | null;
  events: EventSlug[];
  timeline: string[];
  household: string;
  address: string;
};

function profileImageUrl(displayName: string): string {
  if (displayName === 'Chad Mustard') return '/guests/chad.svg';
  if (displayName === 'Veronika Matsuk') return '/guests/nika.svg';
  return '/guests/placeholder.svg';
}

/** Minimal CSV parser that respects double-quoted fields. */
function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === ',' && !inQuotes) {
      fields.push(current);
      current = '';
      continue;
    }
    current += ch;
  }
  fields.push(current);
  return fields.map((f) => f.trim());
}

const csvKeys = new Map(EVENT_ORDER.map((slug) => [EVENTS[slug].csvKey, slug]));

/**
 * Columns are matched by header name. Required: Name. Optional: Phone,
 * Events (comma-separated, default "wedding"), Timeline, Household, Address.
 */
function parseCsv(content: string): GuestRow[] {
  const lines = content.trim().split(/\r?\n/);
  const header = parseCsvLine(lines.shift() ?? '');
  const col = (name: string) => header.indexOf(name);
  if (col('Name') === -1) {
    throw new Error('CSV needs a Name column');
  }
  const get = (fields: string[], name: string) =>
    col(name) === -1 ? '' : (fields[col(name)] ?? '');
  const list = (value: string) =>
    value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean);

  return lines
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const fields = parseCsvLine(line);
      const name = get(fields, 'Name');
      if (!name) throw new Error(`Invalid CSV line: ${line}`);

      const phoneRaw = get(fields, 'Phone');
      const phone = phoneRaw ? normalizePhone(phoneRaw) : null;
      if (phoneRaw && !phone) {
        throw new Error(`Can't read phone number for ${name}: ${phoneRaw}`);
      }

      const eventsRaw = col('Events') === -1 ? 'wedding' : get(fields, 'Events');
      const events = list(eventsRaw).map((key) => {
        const slug = csvKeys.get(key.toLowerCase());
        if (!slug) throw new Error(`Unknown event "${key}" for ${name}`);
        return slug;
      });
      if (events.length === 0) {
        throw new Error(`${name} isn't invited to any event`);
      }

      const timeline = list(get(fields, 'Timeline'));
      if (events.includes('wedding') && timeline.length === 0) {
        throw new Error(`Wedding guest ${name} needs a Timeline for the atlas`);
      }

      return {
        name,
        phone,
        events,
        timeline,
        household: get(fields, 'Household'),
        address: get(fields, 'Address'),
      };
    });
}

/** GUESTS_CSV, else the real (gitignored) list, else the committed example. */
function guestCsvPath(): string {
  if (process.env.GUESTS_CSV) return path.resolve(process.env.GUESTS_CSV);
  const real = path.join(process.cwd(), 'prisma/guests.csv');
  if (fs.existsSync(real)) return real;
  return path.join(process.cwd(), 'prisma/guests.example.csv');
}

function buildStays(timeline: string[]) {
  return timeline.map((placeName, index) => {
    const place = resolvePlace(placeName);
    return {
      placeLabel: place.placeLabel,
      region: place.region,
      lat: place.lat,
      lng: place.lng,
      isCurrent: index === timeline.length - 1,
      sortOrder: index,
    };
  });
}

async function main() {
  const csvPath = guestCsvPath();
  const csv = fs.readFileSync(csvPath, 'utf8');
  const guests = parseCsv(csv);

  console.log(
    `Seeding ${guests.length} guests from ${path.relative(process.cwd(), csvPath)}…`,
  );

  await prisma.locationPhoto.deleteMany();
  await prisma.invitation.deleteMany();
  await prisma.gift.deleteMany();
  await prisma.locationStay.deleteMany();
  await prisma.person.deleteMany();
  await prisma.household.deleteMany();

  const householdIds = new Map<string, string>();

  // Everyone gets a household (a solo guest is a household of one): rooms and
  // gifts are tracked per household.
  const householdKey = (guest: GuestRow) => guest.household || `solo:${guest.name}`;
  for (const guest of guests) {
    const key = householdKey(guest);
    if (householdIds.has(key)) continue;

    const created = await prisma.household.create({
      data: {
        label: guest.household || guest.name,
        address: guest.address || 'TBD',
      },
    });
    householdIds.set(key, created.id);
    console.log(`  Household • ${created.label} — ${created.address}`);
  }

  for (const [index, guest] of guests.entries()) {
    const stays = buildStays(guest.timeline);
    const householdId = householdIds.get(householdKey(guest));

    const created = await prisma.person.create({
      data: {
        displayName: guest.name,
        profileImageUrl: profileImageUrl(guest.name),
        isCouple: COUPLE_NAMES.has(guest.name),
        sortOrder: index,
        inviteToken: DEV_TOKENS[guest.name],
        phone: guest.phone,
        householdId: householdId ?? null,
        stays: { create: stays },
        invitations: { create: guest.events.map((event) => ({ event })) },
      },
      include: { stays: true },
    });

    if (guest.name === 'Chad Mustard') {
      const virginia = created.stays.find((s) => s.placeLabel === 'Virginia');
      if (virginia) {
        await prisma.locationPhoto.create({
          data: {
            locationStayId: virginia.id,
            uploadedByPersonId: created.id,
            imageUrl: '/hero/placeholder.svg',
            caption: 'Allegedly formative years.',
          },
        });
      }
    }

    console.log(
      `  • ${created.displayName} [${guest.events.join(', ')}] → /i/${created.inviteToken}`,
    );
  }

  console.log('Done.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
