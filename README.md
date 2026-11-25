# Chad & Nika Wedding

Invite-only site for our **engagement party** and **wedding**. Guests unlock with their phone number (or an invite-token link / QR), watch an envelope open, and see only the events they're invited to. No passwords, no OAuth, no SMS codes. Open each event by flipping its `open` flag in [`src/lib/events.ts`](./src/lib/events.ts).

See [WEDDING_WEBSITE_PLAN.md](./WEDDING_WEBSITE_PLAN.md) for product scope and [docs/DEPLOY.md](./docs/DEPLOY.md) for Supabase + Vercel + QR print notes.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind
- Prisma 7 → Supabase Postgres
- Signed httpOnly session cookie — phone unlock or `/i/{token}` sets the session
- [Motion](https://motion.dev) for the envelope reveal
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

**The real guest list is never committed** (this repo is public). Keep it at `prisma/guests.csv`, which is gitignored. Copy [`prisma/guests.example.csv`](./prisma/guests.example.csv) to start. The seed reads `GUESTS_CSV` if set, then `prisma/guests.csv`, then falls back to the example.

Columns are matched by header name:

| Column | |
|---|---|
| `Name` | Required. |
| `Phone` | What the guest types to unlock. US numbers in any format; international with a leading `+`. People sharing a number get a "who's holding the phone?" step. |
| `Events` | `engagement`, `wedding`, or `"engagement,wedding"`. Defaults to `wedding`. |
| `Timeline` | Places lived, for the wedding atlas (required for wedding guests). US entries use **state names**; international places use `Ukraine`, `Italy`, or `Singapore`. |
| `Household` | Shared labels group people for joint RSVPs and the envelope addressee. |
| `Address` | Mailing address. |

Event details (date, time, venue, open/closed) live in [`src/lib/events.ts`](./src/lib/events.ts).

Then re-seed (this **wipes** existing guests and RSVPs):

```bash
yarn prisma:seed:local   # or :remote
yarn qr:generate:local   # regenerate print QR PNGs
```

Stable dev invite URLs for the couple: `/i/dev-chad`, `/i/dev-nika`. To replay the envelope locally, clear `Invitation.openedAt` or use "Open the envelope again" on the home page.

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
