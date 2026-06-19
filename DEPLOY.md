# Deploy runbook — Neon + Vercel

StockCheck deploys as a normal Next.js app on **Vercel**, backed by a **Neon** PostgreSQL database.
Steps marked 🧑 are yours to do (cloud accounts); ⚙️ happen automatically.

> ⚠️ **Company-safe:** use a **new personal Neon project** and your own Vercel/GitHub — never company
> credentials or data. Everything seeded here is synthetic.

---

## 0. Before you push — secret scan 🧑

```bash
# nothing real should appear; .env must be ignored
git ls-files | grep -E '(^|/)\.env$' && echo "STOP: .env tracked" || echo "ok: .env not tracked"
git grep -nE 'postgres(ql)?://[^ ]*@|AUTH_SECRET=.|sk_live|BEGIN .*PRIVATE KEY' -- . ':!*.example' || echo "ok: no secrets in tree"
```

Both should print `ok`. (`.env` is gitignored; `.env.example` is the only env file committed.)

## 1. Create a Neon project 🧑

1. Sign up / log in at **neon.tech** → **New Project**.
2. Region: **Singapore (`ap-southeast-1`)** — matches Vercel `sin1` in `vercel.json` (keeps latency low).
3. From the connection details, copy **two** URLs:
   - **Pooled** (host contains `-pooler`) → this is `DATABASE_URL`.
   - **Direct** (no `-pooler`) → this is `DIRECT_DATABASE_URL` (used by Prisma Migrate).
   - Make sure both end with `?sslmode=require`.

## 2. Push to a new GitHub repo 🧑

```bash
cd stockcheck-demo
git add -A && git commit -m "StockCheck portfolio demo"   # if not already committed
gh repo create stockcheck-demo --public --source=. --push
# or create the repo on github.com and: git remote add origin <url> && git push -u origin main
```

## 3. Import on Vercel + set env 🧑

1. **vercel.com → Add New → Project →** import the GitHub repo. Framework auto-detected (Next.js).
2. **Settings → Environment Variables** (Production + Preview):

   | Name | Value |
   |------|-------|
   | `DATABASE_URL` | Neon **pooled** URL |
   | `DIRECT_DATABASE_URL` | Neon **direct** URL |
   | `AUTH_SECRET` | output of `npx auth secret` (or `openssl rand -base64 32`) |
   | `DEMO_RESET_TOKEN` | any long random string (manual reset) |
   | `CRON_SECRET` | a long random string — Vercel Cron sends it as `Authorization: Bearer` |

   > The reset endpoint accepts either `CRON_SECRET` (used by Cron) or `DEMO_RESET_TOKEN`. Set both; they can be equal.

3. **Deploy.** ⚙️ `vercel-build` runs `prisma migrate deploy && next build`, so the schema is created on Neon automatically.

## 4. Seed the database (first time) 🧑

The migration creates empty tables — seed the synthetic data once:

```bash
# option A: from your machine, pointed at Neon
DATABASE_URL="<neon-pooled-url>" npm run db:seed

# option B: trigger the reset endpoint (also used by cron)
curl -X POST https://<your-app>.vercel.app/api/demo/reset \
  -H "x-demo-reset-token: <DEMO_RESET_TOKEN>"
```

## 5. Verify live ⚙️🧑

- Open `https://<your-app>.vercel.app` → click **"🚀 เข้าสู่ Live Demo"** → you're in as admin.
- Check `/units` (4 categories), open an item, run a verify, view `/audit`.
- Confirm the **Reset demo** button restores the seed.
- Cron re-seeds **once a day** (`vercel.json`, `0 0 * * *`) — visitor edits won't pile up.
  > Vercel **Hobby (free)** allows cron **once per day** max. The "Reset demo" button is always available for an instant reset; upgrade to Pro if you want more frequent cron.

## 6. Finishing touches 🧑

- Put the real URL in `README.md` / `README-TH.md` (the `Live Demo:` line).
- Set your **Resume** URL in `src/components/DemoBanner.tsx` (currently points to GitHub).
- Add the live link to your resume / LinkedIn.

---

### Rollback

Vercel keeps every deployment — **Deployments → … → Promote to Production** on a previous build to roll back
instantly. Schema migrations are additive; if needed, restore Neon from its point-in-time history.
