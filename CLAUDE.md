# Working on this repo

Invite-only site for Chad & Veronika's engagement party and wedding. Next.js 14 (App Router), Prisma 7 on Postgres (Supabase in production), Tailwind, and Vercel hosting. See `README.md` for setup.

## Change workflow

- **Every change goes through its own pull request.** Never commit or push straight to `main`. Make one branch per feature or fix, so the change history stays easy to follow.
- Keep PRs focused. Unrelated work (e.g. a redesign versus a data-model refactor) gets separate PRs.

## Demo every visible change

Every PR or new feature comes with a **demo of the change running in the app**, so Chad can see what changed visually without reading code:

1. Run the app locally (`docker compose up -d`, `yarn prisma:deploy:local`, `yarn prisma:seed:local`, `yarn dev`). Sign in as the right test guest (e.g. `/i/dev-chad`, or a guest invited to only one event).
2. Walk through every screen the PR touches. Take screenshots, plus a short screen recording or GIF for animations. Show before and after when something existing changed.
3. Cover the states that matter: each kind of guest (wedding only, engagement only, both), mobile and desktop widths, and light/dark themes if they exist.
4. Send the screenshots to Chad and summarize them in the PR description under a **Demo** heading. Say what is visually different.

If a PR has no visible change (pure refactor, tooling), say so in the PR under **Demo** and describe how it was checked instead.

## Guest data is private

This repo is **public**. Never commit real guest phone numbers, addresses, or other personal details. Real guest data stays out of git. Committed fixtures use obviously fake values.
