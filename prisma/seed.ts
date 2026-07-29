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

function profileImageUrl(displayName: string): string {
  if (displayName === 'Chad Mustard') return '/guests/chad.svg';
  if (displayName === 'Veronika Matsuk') return '/guests/nika.svg';
  return '/guests/placeholder.svg';
}

function parseCsv(content: string): { name: string; timeline: string[] }[] {
  const lines = content.trim().split(/\r?\n/);
  const header = lines.shift();
  if (header !== 'Name,Timeline') {
    throw new Error('Expected CSV header: Name,Timeline');
  }

  return lines
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      const comma = line.indexOf(',');
      if (comma === -1) throw new Error(`Invalid CSV line: ${line}`);
      const name = line.slice(0, comma).trim();
      let timelineRaw = line.slice(comma + 1).trim();
      if (timelineRaw.startsWith('"') && timelineRaw.endsWith('"')) {
        timelineRaw = timelineRaw.slice(1, -1);
      }
      const timeline = timelineRaw
        .split(',')
        .map((place) => place.trim())
        .filter(Boolean);
      if (timeline.length === 0) {
        throw new Error(`No timeline places for ${name}`);
      }
      return { name, timeline };
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

  for (const [index, guest] of guests.entries()) {
    const stays = buildStays(guest.timeline);

    const created = await prisma.person.create({
      data: {
        displayName: guest.name,
        profileImageUrl: profileImageUrl(guest.name),
        isCouple: COUPLE_NAMES.has(guest.name),
        sortOrder: index,
        inviteToken: DEV_TOKENS[guest.name],
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
