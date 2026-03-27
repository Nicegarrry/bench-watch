# BenchWatch Deployment Runbook

**Stack:** Wasp 0.21 · Supabase (Postgres) · Railway (server) · Vercel (client SPA)

---

## Prerequisites

- Working internet connection (npm must reach registry.npmjs.org)
- Railway CLI: `npm install -g @railway/cli` → `railway login`
- Vercel CLI: `npm install -g vercel` → `vercel login`
- Supabase project running with direct connection URL

---

## Step 1 — Run DB migration

The schema has changed (legislation pipeline, notifications, displayName). Before deploying, run:

```bash
wasp db migrate-dev
```

Name the migration (e.g. `legislation_notifications`) when prompted.

---

## Step 2 — Build

```bash
wasp build
```

This generates:
- `.wasp/build/server/` — Node.js Express server (for Railway)
- `.wasp/build/web-app/` — Static React SPA (for Vercel)

---

## Step 3 — Deploy server to Railway

### Option A — Railway CLI (recommended)
```bash
cd .wasp/build/server
railway login
railway link          # link to your existing Railway project
railway up            # deploy
```

### Option B — Railway GitHub integration
1. Push the repo to GitHub
2. In Railway dashboard → New Project → Deploy from GitHub
3. Set root directory to `.wasp/build/server` (or use a Nixpacks config)
4. **Note:** Railway won't see the `.wasp/build/` directory if it's gitignored.
   Preferred approach: use CLI to deploy the built artifact directly.

### Railway environment variables (set in Railway dashboard → Variables)
```
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.vqcxahvhclbomfdcnrbz.supabase.co:5432/postgres
ANTHROPIC_API_KEY=sk-ant-api03-...
WASP_SERVER_URL=https://<your-railway-domain>.up.railway.app
WASP_WEB_CLIENT_URL=https://<your-vercel-domain>.vercel.app
JWT_SECRET=<run: openssl rand -hex 32>
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USERNAME=resend
SMTP_PASSWORD=<your-resend-api-key>
```

**Important:** Use the Supabase **direct connection URL** (`db.[ref].supabase.co:5432`),
NOT the pooler. Railway → Supabase direct works fine without pgbouncer.

---

## Step 4 — Deploy client to Vercel

```bash
cd .wasp/build/web-app
vercel --prod
```

When prompted:
- Framework: Other (it's a Vite static build)
- Build command: leave blank (already built)
- Output directory: `.` (the web-app dir is already the build output)

Set in Vercel dashboard → Settings → Environment Variables:
```
REACT_APP_API_URL=https://<your-railway-domain>.up.railway.app
```

The `vercel.json` at the project root handles SPA routing (all paths → index.html).

---

## Step 5 — Post-deploy verification

1. Open the Railway URL — server should respond at `/api/health` or similar
2. Open the Vercel URL — client should load and auth should work
3. Sign up / log in → confirm redirect to `/intelligence`
4. Trigger a pipeline run from `/dev` → check Railway logs

---

## Step 6 — Run DB migration on production

Production Supabase already has the bw01 migration recorded. For the new schema changes:

```bash
# With DATABASE_URL pointing at Supabase direct URL:
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.vqcxahvhclbomfdcnrbz.supabase.co:5432/postgres" \
  wasp db migrate-dev
```

Or use the Supabase MCP to apply the migration SQL directly.

---

## Resend SMTP setup

1. Sign up at resend.com
2. Add and verify your domain (`bench.watch`)
3. Go to API Keys → Create API key
4. Set `SMTP_PASSWORD=<api-key>` in Railway

The email sender is configured in `main.wasp` as SMTP pointing at `smtp.resend.com:587`.
Wasp reads `SMTP_HOST`, `SMTP_PORT`, `SMTP_USERNAME`, `SMTP_PASSWORD` from env automatically.

---

## Cron job schedule (Railway server, PgBoss)

PgBoss runs these cron jobs inside the persistent Railway server process:

| Job | UTC | AEST | What |
|-----|-----|------|------|
| discoveryJob | 16:00 | 02:00 | Phase 1: RSS polling |
| triageJob | 17:00 | 03:00 | Phase 2: triage + text + analysis |
| digestJob | 18:00 | 04:00 | Phase 3: per-user digests |

No external cron needed — PgBoss handles scheduling internally.
