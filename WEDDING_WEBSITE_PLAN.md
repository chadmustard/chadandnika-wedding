# Wedding Website — v1 Plan

Carry this file into the new repo (suggested name: `chadandnika-wedding` or `wedding`).  
**Scope for first release:** invite-only wedding site. No planning dashboard, no email agent, no Supabase Auth / Auth.js login.

---

## Goals (v1)

- Immersive wedding site for **chadandnika.wedding** (or similar).
- **Invite-only** — each guest gets a unique QR code on their physical invite that unlocks the site.
- Big photography, one hero composition, dry / sarcastic copy throughout.
- Four sections (tabs or in-page nav): **RSVP**, **Registry**, **Schedule**, **History**.
- Postgres for guest identity, RSVPs, location timelines (+ optional location photos).
- Host on **Vercel**; database on **Supabase** (same pattern as Mustard's Masters).

**Explicitly out of scope for v1**

- Couple/parents dashboard
- Vendor tracking, budget, email triage
- Guest-editable profile images
- Guest-editable timelines (couple seeds data)
- Supabase Auth / Google OAuth / “sign up” flows (guests scan a QR — that’s their login)
- Monorepo / Turborepo (add later if/when a dashboard appears)

---

## Invite-only access (QR codes)

The whole site is private. Guests don’t create accounts or sign in with Google — they **scan a QR code on their mailed invite**, which maps to a unique token in the database.

### Flow

```
[Printed QR on invite]  →  https://chadandnika.wedding/i/{inviteToken}
                                    ↓
                         validate token against Person.inviteToken
                                    ↓
                         set httpOnly session cookie (personId)
                                    ↓
                         redirect to site — guest is identified
```

### Rules

- **One token per guest** — stored on `Person.inviteToken` (unique, unguessable — `cuid` or `nanoid`, not sequential IDs).
- **Middleware** on all routes except `/i/[token]` — no valid session → show a friendly “scan your invite” gate page (not a login form).
- **Re-scan works** — same QR always works; guest can scan again from a photo of the invite if they lose the paper.
- **RSVP is tied to identity** — name pre-filled from `Person.displayName`; guest confirms or edits lightly, but submission links to their `personId`.
- **History photo uploads** (when enabled) scoped to that guest’s own `LocationStay` nodes only.
- **Couple bypass** — seed tokens for Chad/Nika too; optional dev-only bypass for local preview (never in prod).

### QR code generation

A seed/build script generates print-ready PNGs (or SVGs) per guest:

```
Input:  Person rows from DB (displayName + inviteToken)
Output: qr-codes/chad-mustard.png, qr-codes/veronika-mustard.png, …
URL:    https://chadandnika.wedding/i/{inviteToken}
```

- Use the **`qrcode`** npm package (Node) or equivalent.
- **Error correction level H** — survives smudges and fancy invite borders.
- **Minimum ~1–1.5"** print size; test scans on phone before sending to printer.
- **Use production domain** in encoded URLs before print (or a stable redirect you control).
- Zip the folder for your designer/printer to drop one QR per guest invite.

### Physical invite copy (suggestion)

Something like: *“Scan to RSVP, explore the site, and see where everyone’s been. No password. No app. Just point your phone at this and pretend it’s 2026.”*

---

## Product surfaces

### 1. Hero (first viewport)

- Full-bleed background photo (edge-to-edge — not a card or inset image).
- Brand / names as the dominant text signal (“Chad & Nika” or agreed lockup).
- One short supporting line of dry humor.
- One primary CTA (e.g. “RSVP” or “Find your way around”).
- Nav into the four sections — keep the first viewport uncluttered (no registry tiles, schedule snippets, or guest counts here).

**Assets needed early**

| Asset | Use |
|-------|-----|
| Hero photo (high-res, landscape + crop-friendly) | Full-bleed background |
| Optional secondary photos | Section dividers / Registry detail |
| Couple + guest headshots (square-ish JPEGs) | History map avatars |
| Per-guest QR codes (generated) | Printed on physical invites |
| Favicon / OG image | Sharing (OG may show gate page for unauthenticated — fine) |

Store static marketing images in `public/` (or `public/photos/`). Guest headshots can start in `public/guests/` for v1; move to Supabase Storage if the set gets large.

---

### 2. RSVP

Simple form, easy to finish on mobile. **Requires invite session** (scanned QR).

**Fields**

- Full name (pre-filled from `Person.displayName`, editable if needed)
- Attending? Yes / No (required)
- Dietary restrictions (optional textarea)

**Behavior**

- `POST` API route → updates RSVP fields on the authenticated `Person` row (or linked `Rsvp` row).
- Success state with a sarcastic confirmation line.
- One RSVP per guest — tied to `personId`, no duplicate anonymous submissions.
- Light bot protection still fine (honeypot on form) but invite gate is the main guard.

**Copy tone:** short, dry, not corporate (“Tell us if you’re coming. Or don’t. We’ll find out somehow.”).

---

### 3. Registry

- Tile layout; **one tile for v1:** Honeymoon Fund.
- Click tile → detail view/modal: honeymoon destination(s), Venmo handle, funny note about skipping the “wedding website tax” / registry cut.
- Future tiles can be added without redesigning the page.

Mostly static content in code or MDX; no checkout integration in v1 — Venmo is enough.

---

### 4. Schedule

- Placeholder page: **TBD**, with one witty line.
- Structure the route now so real events drop in later without nav changes.

---

### 5. History (interactive map)

The fun / ambitious page. Treat as the main engineering investment of v1.

#### Concept

Not a 3D globe. A **flat “wedding atlas”**:

- **Center / main panel:** continental United States.
- **Right side insets:** Ukraine, Italy (people lived there).
- **Left side inset:** Singapore (guest born there).

Each person is a small **circular profile image** (Life360-style) at their **current** location (`isCurrent` timeline row). A **trace / path** connects the places they’ve lived, in order.

#### Data model (seeded by you)

```
Person
  - id, displayName, profileImageUrl (set only by you)
  - inviteToken (unique — powers QR code)
  - isCouple flag optional (Chad / Nika)
  - rsvp fields: attending, dietaryRestrictions, respondedAt
  - firstVisitAt, lastVisitAt (optional — track who scanned in)

LocationStay (timeline node — one-to-many from Person)
  - id, personId
  - placeLabel          // "Columbus, OH", "Kyiv", "Singapore"
  - region              // "us" | "ukraine" | "italy" | "singapore" (which map panel)
  - lat, lng            // for positioning on that panel
  - fromYear, toYear?   // or fromDate / toDate
  - isCurrent           // true → avatar renders here
  - sortOrder

LocationPhoto (optional for v1; recommended as v1.1)
  - id, locationStayId, uploadedByPersonId
  - imageUrl, caption?, createdAt
```

**Rules**

- Profile images: **admin/seed only** — guests cannot change them.
- Timelines: **seeded by you** for v1 (Prisma seed script). Guests do not edit moves.
- Photos on a node: see phasing below — identity is now solved via QR session.

#### Interaction

- Spin/pan/zoom within reason on the US panel (or keep it static + hover if motion is enough).
- Hover/click a **path node** → place label, years, optional photo strip.
- Hover/click an **avatar** → person name + short “lived in …” summary.
- Traces: ordered polyline (or soft curves) across that person’s nodes; if a person crosses panels (e.g. Ukraine → Illinois), draw the US segment on the US map and show the Ukraine node on the inset, with a visual cue that the story continues off-panel (dotted connector or “continued in Ukraine” chip — don’t fake a single continuous world projection).

#### Map tech recommendation

Prefer a **custom composite layout** over a real world map library fighting insets:

- SVG (or canvas) base for continental US + separate SVG insets for Ukraine / Italy / Singapore.
- Position markers with stored `lat`/`lng` projected per-panel (simple equirectangular or hand-tuned projectors per inset).
- Libraries like `react-simple-maps` are optional; a designed SVG atlas may look more intentional and match the “immersive wedding site” vibe better than default Mapbox chrome.

Avoid Three.js globe for this release — you already decided against globe UX, and insets are easier in 2D.

#### Photos on nodes — phasing

Identity is handled by the QR invite flow, so guest uploads are much safer than on a public site.

| Phase | What |
|-------|------|
| **v1** | Seed people + timelines + profile images. Map with avatars + traces + hover details. You can seed a few `LocationPhoto`s yourself. |
| **v1.1** | Logged-in guest (via QR session) can add photos to **their own** `LocationStay` nodes only. `uploadedByPersonId` tracks who added what. |
| **Later** | Moderation queue / couple dashboard if volume warrants it. |

Keep `LocationPhoto` in the schema from day one (even if upload UI is read-only in v1).

---

## Tech stack

| Layer | Choice | Why |
|-------|--------|-----|
| App | **Next.js (App Router)**, TypeScript | Same as Masters; one deploy |
| Styling | Tailwind + distinctive fonts (not Inter/system default) | Immersive branded site |
| DB | **Supabase Postgres** | Hosted DB; familiar from Masters |
| ORM | **Prisma** | Migrations + seed scripts for guests/timelines |
| Hosting | **Vercel** | Custom domain, previews |
| Storage | `public/` first; Supabase Storage if needed | Headshots, location photos, QR exports |
| Access control | **Per-guest invite tokens + httpOnly cookie** | No Supabase Auth; QR is the login |
| QR generation | **`qrcode`** npm package | Print-ready PNGs from seed script |
| Package manager | pnpm or yarn | Single app — no workspaces required |

**Not using:** Supabase Auth, Auth.js, Google OAuth, shared site passwords.

**Repo shape (v1 — single app, not a monorepo)**

```
chadandnika-wedding/
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts                 # couple + guests + tokens + LocationStay
├── scripts/
│   └── generate-qr-codes.ts    # export PNGs per guest for print
├── public/
│   ├── hero/
│   └── guests/                 # profile JPEGs for seed
├── qr-codes/                   # generated, gitignored — zip for printer
├── src/
│   ├── app/
│   │   ├── page.tsx            # hero + section shell / tabs (gated)
│   │   ├── i/[token]/page.tsx  # invite entry — validate token, set cookie
│   │   ├── gate/page.tsx       # “scan your invite” fallback
│   │   ├── api/rsvp/route.ts
│   │   ├── api/history/...     # read people + stays (+ photos)
│   │   └── api/photos/...      # v1.1: upload to own nodes only
│   ├── components/
│   │   ├── hero/
│   │   ├── rsvp/
│   │   ├── registry/
│   │   ├── schedule/
│   │   └── history/            # atlas, markers, traces, node panel
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── session.ts          # read/set invite cookie, get current Person
│   │   └── copy.ts             # centralized sarcastic copy strings
│   └── middleware.ts           # gate all routes except /i/* and static assets
├── docs/
│   └── DEPLOY.md               # Vercel + Supabase + domain + QR print notes
└── WEDDING_WEBSITE_PLAN.md     # this file
```

Promote to a monorepo later if you add `dashboard` — don’t pay that cost before v1.

---

## Prisma schema (draft)

```prisma
model Person {
  id                   String          @id @default(cuid())
  displayName          String
  profileImageUrl      String
  inviteToken          String          @unique @default(cuid())
  isCouple             Boolean         @default(false)
  sortOrder            Int             @default(0)

  // RSVP (updated by guest after scanning in)
  attending            Boolean?
  dietaryRestrictions  String?
  respondedAt          DateTime?

  // Optional visit tracking
  firstVisitAt         DateTime?
  lastVisitAt          DateTime?

  stays                LocationStay[]
  uploadedPhotos       LocationPhoto[] @relation("UploadedBy")
}

model LocationStay {
  id         String          @id @default(cuid())
  personId   String
  person     Person          @relation(fields: [personId], references: [id], onDelete: Cascade)
  placeLabel String
  region     String          // us | ukraine | italy | singapore
  lat        Float
  lng        Float
  fromYear   Int
  toYear     Int?            // null if open-ended / current
  isCurrent  Boolean         @default(false)
  sortOrder  Int
  photos     LocationPhoto[]

  @@index([personId])
}

model LocationPhoto {
  id                 String       @id @default(cuid())
  locationStayId     String
  locationStay       LocationStay @relation(fields: [locationStayId], references: [id], onDelete: Cascade)
  uploadedByPersonId String?
  uploadedBy         Person?      @relation("UploadedBy", fields: [uploadedByPersonId], references: [id])
  imageUrl           String
  caption            String?
  createdAt          DateTime     @default(now())
}
```

Notes:

- **RSVP lives on `Person`** — no separate anonymous `Rsvp` table; the invite token *is* the guest identity.
- Enforce at most one `isCurrent: true` per person in seed/app logic (or a partial unique index later).
- `region` drives which atlas panel gets the marker.
- `inviteToken` defaults to `cuid()` on insert; seed script can regenerate if needed before print.

---

## Session / middleware (sketch)

```typescript
// Cookie: wedding_session = signed/encrypted personId (or session id → personId in DB)
// Set on GET /i/[token] after token lookup
// Read in middleware + API routes via lib/session.ts

// middleware.ts — allow without session:
//   /i/*          (invite entry)
//   /gate         (scan-your-invite page)
//   /_next/*, /favicon.ico, static assets
// Everything else → redirect to /gate if no session
```

Use a signed cookie (`iron-session`, `jose`, or Next.js-compatible session helper) — no Supabase Auth required.

---

## Copy / tone

- Dry, sarcastic, warm underneath — not mean, not generic wedding-script.
- Centralize strings (hero, gate page, RSVP success, registry Venmo joke, schedule TBD, empty history states) so voice stays consistent.
- Gate page example: *“This site is invite-only. If you lost your invite, text Chad. He’ll pretend to be surprised.”*
- Registry: explicit joke about not paying a wedding-site/registry tax; Venmo as the “premium integration.”

---

## Design direction

- One immersive hero composition; brand names hero-level.
- Expressive typography (load real fonts — avoid Inter / Roboto / system UI default).
- Photography as the visual anchor; avoid purple-gradient / cream-serif AI-default looks.
- Motion: 2–3 intentional moments (e.g. hero fade/ken-burns subtle, tab transition, map trace draw-on).
- History page can be denser; other sections stay simple.
- Mobile: RSVP must be effortless; map should degrade to pan/zoom + list fallback if markers get crowded.
- Gate page should still feel on-brand (not a stark “403 Forbidden”).

---

## Setup order (for Cursor in the new repo)

1. **Create repo** + Next.js + Tailwind + TypeScript + Prisma.
2. **Supabase project** — create DB; set `DATABASE_URL` / `DIRECT_URL` (pooler + direct, same as Masters).
3. **Schema + migrate** — `Person` (with `inviteToken` + RSVP fields), `LocationStay`, `LocationPhoto`.
4. **Invite flow** — `/i/[token]` route, session cookie, middleware gate, `/gate` page.
5. **Hero shell** — full-bleed photo, typography, nav to four sections (behind gate).
6. **RSVP** — pre-filled form + API updating authenticated `Person` + success state.
7. **Registry** — one honeymoon tile + detail + Venmo + joke copy.
8. **Schedule** — TBD placeholder.
9. **History atlas**
   - Layout: US + left Singapore inset + right Ukraine/Italy insets.
   - Seed Chad, Nika, guests with stays + profile images + invite tokens.
   - Render current avatars + traces + hover/click detail.
   - Optionally render seeded `LocationPhoto`s in the detail panel.
10. **QR script** — `scripts/generate-qr-codes.ts` → PNGs per guest; test scan on phone.
11. **Polish** — fonts, motion, mobile, OG image, 404, gate page copy.
12. **Deploy** — Vercel project, env vars, custom domain, smoke-test invite flow + RSVP against prod DB.
13. **Print** — zip QR folder for designer; verify production URLs before final print run.

---

## Environment variables

```
DATABASE_URL=              # Supabase pooled
DIRECT_URL=                # Supabase direct (migrations)
SESSION_SECRET=            # sign/encrypt invite session cookie
NEXT_PUBLIC_SITE_URL=      # https://chadandnika.wedding — used in QR generation
# Optional later:
# NEXT_PUBLIC_VENMO_USER=  # or hardcode in copy for v1
```

No Supabase Auth keys required for v1.

---

## Seed data checklist

Collect before or while building:

**Guests & invites**

- [ ] Full guest list with display names
- [ ] Profile JPEG per person (you control these)
- [ ] Run seed → generates `inviteToken` per person
- [ ] Run QR script → one PNG per guest for print
- [ ] Test-scan each QR against staging/prod before print deadline

**History map**

- [ ] Ordered list of places + approximate years per person
- [ ] `region` + lat/lng per place (good enough > perfect)
- [ ] Mark exactly one `isCurrent` stay per person
- [ ] Chad: Ohio → Virginia → Georgia → North Carolina
- [ ] Veronika: Ukraine → Illinois → Wisconsin → Georgia → North Carolina
- [ ] At least one guest with Singapore; anyone with Italy/Ukraine for inset testing
- [ ] Optional: 1–2 photos on a Virginia (or similar) node to prove the photo UI

---

## Success criteria (v1 done)

- [ ] Unauthenticated visitors see gate page, not site content
- [ ] Scanning a guest QR sets session and unlocks full site
- [ ] Hero feels immersive on desktop and mobile
- [ ] RSVP submits against the correct `Person` row
- [ ] Registry honeymoon tile + Venmo + joke copy ship
- [ ] Schedule shows TBD without looking broken
- [ ] History shows couple + seeded guests as avatar circles on the atlas
- [ ] Traces reflect multi-stop lives; current location matches `isCurrent`
- [ ] Insets for Singapore / Ukraine / Italy are readable
- [ ] QR PNGs generated and ready for print
- [ ] Site live on Vercel with custom domain

---

## Nice follow-ups (after v1)

- Guest photo upload on own nodes (session already identifies them)
- Real schedule + weekend logistics
- More registry tiles
- Couple dashboard to view RSVPs + who’s scanned in (`firstVisitAt`)
- Token rotation if an invite is compromised (rare)
- Promote to monorepo if dashboard becomes a second app

---

## Decision log

| Decision | Choice |
|----------|--------|
| Dashboard in v1? | No |
| Monorepo in v1? | No — single Next app |
| Site access | **Invite-only via per-guest QR → token → session cookie** |
| Supabase Auth / Auth.js? | **No** — QR token is the login |
| Shared site password? | **No** — per-guest tokens only |
| Map form | Flat US atlas + SG / UA / IT insets (not a globe) |
| Profile images | Couple-seeded only |
| Timelines | Couple-seeded only |
| Photos on nodes | Schema yes; guest upload in v1.1 (identity ready via QR) |
| Registry commerce | Venmo only |
| DB / host | Supabase + Vercel |
| QR delivery | Physical invite in the mail; URL encodes `inviteToken` |
