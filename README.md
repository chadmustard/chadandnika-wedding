# Chad & Nika Wedding

Invite-only wedding website. Guests unlock with their full name (or an optional invite-token link). No passwords, no OAuth. Flip `SITE_OPEN` in `src/lib/site.ts` when ready for guests.

See [WEDDING_WEBSITE_PLAN.md](./WEDDING_WEBSITE_PLAN.md) for product scope and [docs/DEPLOY.md](./docs/DEPLOY.md) for Supabase + Vercel + QR print notes.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- Prisma 7 → Supabase Postgres
- Signed httpOnly session cookie — name unlock or `/i/{token}` sets the session
- Vercel hosting

Architecture mirrors [mustards-masters](../mustards-masters) (Prisma adapter, env split, yarn scripts) without Supabase Auth.

## Quick start

```bash
docker compose up -d
cp .env.example .env.local
yarn install
yarn prisma:migrate
yarn prisma:seed:local
yarn dev
```

Then open [http://localhost:3000/i/dev-chad](http://localhost:3000/i/dev-chad).

## Guest list & timelines

Edit [`prisma/guests.csv`](./prisma/guests.csv) — columns `Name,Timeline,Household,Address`. Shared `Household` labels group people for joint RSVP checkboxes. US timeline entries use **state names**; international places use `Ukraine`, `Italy`, or `Singapore`.

Then re-seed (this **wipes** existing guests and RSVPs):

```bash
yarn prisma:seed:local   # or :remote
yarn qr:generate:local   # regenerate print QR PNGs
```

Stable dev invite URLs for the couple: `/i/dev-chad`, `/i/dev-nika`.

## Scripts

| Script | Purpose |
|--------|---------|
| `yarn dev` | Next.js dev server |
| `yarn prisma:deploy:local` / `:remote` | Migrate using `.env.local` / `.env.supabase` |
| `yarn prisma:seed:local` / `:remote` | Seed guests + timelines |
| `yarn qr:generate:local` | Print-ready QR PNGs → `qr-codes/` |

## Sections

1. **Hero** — full-bleed composition, brand-first
2. **RSVP** — tied to invite session
3. **Registry** — honeymoon fund + Venmo
4. **Schedule** — TBD placeholder
5. **History** — US atlas + Singapore / Ukraine / Italy insets
