/**
 * Generate print-ready QR PNGs for each guest.
 *
 * Usage:
 *   yarn qr:generate:local
 *
 * Output: qr-codes/{slug}.png — zip and send to your designer/printer.
 * Uses NEXT_PUBLIC_SITE_URL (production domain before print).
 */
import { config } from 'dotenv';
import fs from 'node:fs/promises';
import path from 'node:path';
import QRCode from 'qrcode';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

config({ path: '.env.local' });
config({ path: '.env' });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is not set');
}

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(
  /\/$/,
  '',
);

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString }),
});

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function main() {
  const outDir = path.join(process.cwd(), 'qr-codes');
  await fs.mkdir(outDir, { recursive: true });

  const people = await prisma.person.findMany({
    orderBy: { sortOrder: 'asc' },
  });

  if (people.length === 0) {
    console.error('No people found. Run the seed first.');
    process.exit(1);
  }

  console.log(`Generating ${people.length} QR codes → ${outDir}`);
  console.log(`Base URL: ${siteUrl}`);

  for (const person of people) {
    const url = `${siteUrl}/i/${person.inviteToken}`;
    const file = path.join(outDir, `${slugify(person.displayName)}.png`);
    await QRCode.toFile(file, url, {
      errorCorrectionLevel: 'H',
      type: 'png',
      width: 1024,
      margin: 2,
      color: {
        dark: '#141210',
        light: '#ffffff',
      },
    });
    console.log(`  • ${person.displayName} → ${path.basename(file)} (${url})`);
  }

  console.log('Done. Zip qr-codes/ for your printer.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
