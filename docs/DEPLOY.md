# Deploy guide — Chad & Nika Wedding

Invite-only wedding site on **Vercel** + **Supabase Postgres** (Prisma). Guests unlock the site by scanning a per-guest QR on their physical invite — no Supabase Auth.

## 1. Local database

```bash
docker compose up -d
cp .env.example .env.local
# edit SESSION_SECRET
yarn install
yarn prisma:migrate   # or yarn prisma:deploy:local after first migration exists
yarn prisma:seed:local
yarn dev
```

Open `/gate`, then visit `/i/dev-chad` (seed token) or `/i/dev-bypass` when `ALLOW_DEV_BYPASS=true`.

## 2. Supabase project

1. Create a project at [supabase.com](https://supabase.com).
2. **Project Settings → Database** — copy connection strings:
   - `DATABASE_URL` — **Transaction pooler** (often port **6543**, `?pgbouncer=true`)
   - `DIRECT_URL` — **Session pooler** (port **5432**, IPv4-friendly for migrations)
3. Copy [`.env.supabase.example`](../.env.supabase.example) → `.env.supabase` and fill values.
4. Apply schema + seed:

```bash
yarn prisma:deploy:remote
yarn prisma:seed:remote
```

No Supabase Auth keys are required for v1.

## 3. Vercel

1. Import this GitHub repo into Vercel (Next.js detected at repo root).
2. Set environment variables for Production / Preview:

| Name | Notes |
|------|--------|
| `DATABASE_URL` | Supabase pooled URI |
| `DIRECT_URL` | Supabase session/direct URI |
| `SESSION_SECRET` | Long random secret (same idea as local) |
| `NEXT_PUBLIC_SITE_URL` | `https://chadandveronika.wedding` |
| `ALLOW_DEV_BYPASS` | **omit** or `false` in production |

3. Deploy. Add custom domain `chadandveronika.wedding` under **Settings → Domains**.

## 4. QR codes for print

After seeding production (or staging with production domain):

```bash
NEXT_PUBLIC_SITE_URL=https://chadandveronika.wedding yarn qr:generate:local
# or against remote DB:
dotenv -e .env.supabase -- tsx scripts/generate-qr-codes.ts
```

Output lands in `qr-codes/` (gitignored). Zip and send to your designer.

- Error correction: **H**
- Print size: ~1–1.5" minimum
- Test-scan every code on a phone against the live domain before the print deadline

## 5. Open the site to guests

Set `open: true` on each event in [`src/lib/events.ts`](../src/lib/events.ts) and redeploy. Events open independently: the engagement party can go live before the wedding. Guests can only unlock if they're invited to an open event (local `ALLOW_DEV_BYPASS` still works).

## 6. Admin panel

1. Vercel → Settings → Environment Variables: add **`ADMIN_PASSWORD`** (Production) with a long password only the two of you know, then redeploy.
2. Vercel → Settings → Domains: add **`admin.chadandveronika.wedding`** to this project. If the domain's DNS isn't on Vercel, add the CNAME Vercel shows (`cname.vercel-dns.com`).
3. The middleware serves `/admin/*` pages on the `admin.` host. `/admin` on the guest domain returns 404 in production.

## 7. Smoke test checklist

- [ ] Unauthenticated visit → `/gate`
- [ ] Phone unlock sets cookie and plays the envelope (shared numbers ask who you are)
- [ ] `/i/{token}` sets cookie and unlocks home (when an event they're invited to is open)
- [ ] RSVP updates that event's invitation (+ checked household members invited to it)
- [ ] Engagement-only guests can't open `/wedding` or the atlas
- [ ] History atlas loads wedding guests + traces
- [ ] Production QR URLs resolve (not localhost)
- [ ] `admin.` domain shows the sign-in page; a wrong password is rejected; `/admin` on the main domain is a 404
