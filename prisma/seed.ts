import { config } from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';
import { resolvePlace } from '../src/lib/places';

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

function parseCsv(content: string): GuestRow[] {
  const lines = content.trim().split(/\r?\n/);
  const header = parseCsvLine(lines.shift() ?? '');
  if (
    header[0] !== 'Name' ||
    header[1] !== 'Timeline' ||
    header[2] !== 'Household' ||
    header[3] !== 'Address'
  ) {
    throw new Error('Expected CSV header: Name,Timeline,Household,Address');
  }

  return lines
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const [name, timelineRaw = '', household = '', address = ''] =
        parseCsvLine(line);
      if (!name) throw new Error(`Invalid CSV line: ${line}`);
      const timeline = timelineRaw
        .split(',')
        .map((place) => place.trim())
        .filter(Boolean);
      if (timeline.length === 0) {
        throw new Error(`No timeline places for ${name}`);
      }
      return {
        name,
        timeline,
        household,
        address,
      };
    });
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
  const csvPath = path.join(process.cwd(), 'prisma/guests.csv');
  const csv = fs.readFileSync(csvPath, 'utf8');
  const guests = parseCsv(csv);

  console.log(`Seeding ${guests.length} guests from prisma/guests.csv…`);

  await prisma.locationPhoto.deleteMany();
  await prisma.locationStay.deleteMany();
  await prisma.person.deleteMany();
  await prisma.household.deleteMany();

  const householdIds = new Map<string, string>();

  for (const guest of guests) {
    if (!guest.household) continue;
    if (householdIds.has(guest.household)) continue;

    const created = await prisma.household.create({
      data: {
        label: guest.household,
        address: guest.address || 'TBD',
      },
    });
    householdIds.set(guest.household, created.id);
    console.log(`  Household • ${created.label} — ${created.address}`);
  }

  for (const [index, guest] of guests.entries()) {
    const stays = buildStays(guest.timeline);
    const householdId = guest.household
      ? householdIds.get(guest.household)
      : undefined;

    const created = await prisma.person.create({
      data: {
        displayName: guest.name,
        profileImageUrl: profileImageUrl(guest.name),
        isCouple: COUPLE_NAMES.has(guest.name),
        sortOrder: index,
        inviteToken: DEV_TOKENS[guest.name],
        householdId: householdId ?? null,
        stays: { create: stays },
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

    console.log(`  • ${created.displayName} → /i/${created.inviteToken}`);
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
