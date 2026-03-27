# BenchWatch — Claude Code Context

## What This Is

BenchWatch is an Australian legal intelligence dashboard and daily email digest.
It monitors every major Australian appellate court, discovers new decisions via RSS,
uses AI to identify the most significant ones, generates case analyses, and delivers
personalised digests to users based on their chosen areas of law.

**Stack:** Wasp 0.21 · Postgres (Supabase prod / Docker local) · Railway (server) · Vercel (client SPA) · Stripe · Resend (email)

**Lovable prototype exists** for user testing only — this is the real build. Don't
reference or mirror the Lovable codebase.

---

## Development Environment (Current Machine)

- **macOS 25.4.0** (Darwin, Apple Silicon assumed)
- **Node 22.22.2**, **Docker 29.3.1** available
- **Wasp CLI** installed (run `wasp start` for dev)
- **No psql** client installed locally — use `wasp db studio` for DB inspection
- Previously developed on macOS 12 without Docker — used Supabase directly as dev DB

### Local Dev Setup
```bash
# 1. Start Wasp's Docker-managed Postgres (new — previously used Supabase directly)
wasp start db

# 2. Create .env.server with required vars
#    DATABASE_URL=<from wasp start db output, or Supabase connection string>
#    ANTHROPIC_API_KEY=sk-ant-...

# 3. Run migrations
wasp db migrate-dev

# 4. Seed law areas + RSS feeds
wasp db seed

# 5. Start dev server (client :3000 + server :3001)
wasp start
```

### Known Housekeeping
- **Stray `migrations/` at project root** — created by running `npx prisma migrate dev` directly instead of `wasp db migrate-dev`. Canonical migrations are in `.wasp/out/db/migrations/`. The root `migrations/` folder should be deleted.
- **Email provider is `Dummy`** in `main.wasp` — no emails actually send. Switch to Resend/SendGrid before production.
- **No `.env.server` file exists** — must be created with `DATABASE_URL` and `ANTHROPIC_API_KEY`.
- **Tests:** `npm test` runs vitest. 49 tests across 6 files covering pipeline functions (unit + integration with mocked externals). Test files live in `src/pipeline/__tests__/`, fixtures in `src/test/fixtures/`.

---

## Core Architecture: Three-Phase Pipeline

### Phase 1 — Case Discovery (RSS → database)
- Poll 13 JADE RSS feeds weekly (Sunday 5am AEST)
- Parse RSS 2.0 XML, extract metadata (case name, citation, date, court, catchwords, judges, JADE URL)
- Filter to last 7 days, deduplicate by citation, upsert into `cases` table
- Volume: ~80–150 appellate decisions per week

**JADE feed URLs (all confirmed working as of 25 March 2026):**
```
https://jade.io/xml/au-hca.xml           # High Court
https://jade.io/xml/au-hca-sj.xml        # HCA Single Justice
https://jade.io/xml/au-fca-fc.xml        # Federal Court Full Court
https://jade.io/xml/au-fca.xml           # Federal Court
https://jade.io/xml/au-nsw-ca.xml        # NSW Court of Appeal
https://jade.io/xml/au-nsw-cca.xml       # NSW Criminal Appeal
https://jade.io/xml/au-vic-sca.xml       # Victorian Court of Appeal (NOT au-vic-ca.xml)
https://jade.io/xml/au-qld-ca.xml        # Queensland Court of Appeal
https://jade.io/xml/au-wa-sca.xml        # WA Court of Appeal
https://jade.io/xml/au-sa-sc.xml         # SA Full Court (NOT au-sa-scfc.xml)
https://jade.io/xml/au-tas-fc.xml        # Tasmania Full Court
https://jade.io/xml/au-act-ca.xml        # ACT Court of Appeal
https://jade.io/xml/au-nt-ca.xml         # NT Court of Appeal
```

**Required JADE request headers:**
```
User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36
Accept: application/rss+xml, application/xml, text/xml, */*
Referer: https://jade.io/
```

**AustLII RSS feeds are dead** — HTTP 410 on most. Do not use.

---

### Phase 2 — AI Triage + Analysis

#### Phase 2a — Triage (metadata only, cheap batch)
- Send all ~80–150 new cases to Claude Sonnet in batches of ~30
- Input: citation, case name, court, catchwords only
- Output: significance score 1–10, area-of-law tags, flag top ~20–30 for full analysis
- ~50 seconds for 90 cases · ~$0.50–1.00 per weekly run

#### Phase 2b — Judgment Text Retrieval
**Use `www6.austlii.edu.au` as primary source.** This is the only confirmed-working
AustLII mirror for server-side requests (returns full HTML ~700KB, server-rendered).

Other mirrors tested and their status:
- `www.austlii.edu.au` → HTTP 410
- `classic.austlii.edu.au` → HTTP 403
- `www5.austlii.edu.au` → HTTP 403
- `www8.austlii.edu.au` → Timeout
- Try `www7.austlii.edu.au` as fallback if www6 fails
- `jade.io/mnc/` → Returns JS app shell only, no text
- `jade.io/content/ext/mnc/` → "Not authorised" (needs API key)

**URL pattern:**
```
https://www6.austlii.edu.au/cgi-bin/viewdoc/au/cases/{jurisdiction}/{court}/{year}/{number}.html
```

**Jurisdiction mapping:**
```
HCA, FCA, FCAFC → cth
NSWCA, NSWCCA  → nsw
VSCA           → vic
QCA            → qld
WASCA          → wa
SASCFC         → sa
TASFC          → tas
ACTCA          → act
NTCA           → nt
```

**Critical implementation rules:**
1. Only fetch text for cases scoring 7+ (not all 5+ — too slow)
2. Limit download to first 100KB per page (judgment text is at the top)
3. Rate limit: 3 seconds between requests minimum
4. Use a queue/worker pattern — do NOT run all fetches in a single function invocation
5. For cases scoring 5–6, use catchwords from RSS feed instead of full text
6. ~2 errors per 38 fetches is normal — log and continue, don't abort the run

#### Phase 2c — Full Case Analysis (per case, cached, shared across users)
- For each significant case (7+), call Claude Sonnet with judgment excerpt
- Web search tool enabled for finding commentary
- Output fields: `facts_summary`, `legal_analysis`, `why_it_matters`, `significance_score`
  (refined), `score_justification`, `primary_area`, `secondary_areas[]`,
  `classification_reasoning`, `commentary_urls[]`, `model_used`
- Stored in `case_analyses` — one row per case, reused for all users
- Cost: ~$0.10–0.20 per case · ~$3–5 for 20–30 cases per week

---

### Phase 3 — Per-User Cross-Prioritisation
- Pull all Phase 2 cases tagged with the user's selected areas
- Call Claude Sonnet: rank and select top 3–5 + next 15 for this specific user
- Cheap (analyses are pre-computed — Claude just ranks)
- Store in `user_digests`, `user_digest_top_cases`, `user_digest_extended_cases`
- Cost: ~$0.10–0.20 per user per week

---

## Pipeline Scheduling (Cron — Daily AEST)
```
02:00 — Phase 1: RSS polling (shared, runs once)       [UTC 16:00]
03:00 — Phase 2: Triage + text retrieval + analysis     [UTC 17:00]
04:00 — Phase 3: Per-user cross-prioritisation + email  [UTC 18:00]
```

**Each phase must be a background worker/job, not a single synchronous function.**
Timing benchmarks from Lovable prototype (for reference):
- Phase 1: ~60s · Phase 2a: ~50s · Phase 2b: ~120s+ (bottleneck) · Phase 2c + 3: ~50–70s each
- Total: ~5 minutes. Single-function invocations will timeout.

---

## AI Model
- **Claude Sonnet 4** for all AI calls (speed + cost balance)
- Web search tool enabled for Phase 2c
- Model string: `claude-sonnet-4-20250514`

---

## Significance Scoring Rubric
```
9–10  Landmark (HCA contested principle, overrules authority)
7–8   Highly significant (CoA clarifies unsettled law)
5–6   Notable (useful application, resolves practical uncertainty)
3–4   Routine but worth noting
1–2   Routine (consent orders, non-appearances)
```

Cross-prioritisation rules:
- Absolute significance dominates (9 always beats 6)
- Within 2 points, diversify across areas
- Never pad with sub-5 cases for coverage
- "Next 15" is the coverage safety net
- Never fabricate case names or citations

---

## Data Model

```sql
rss_feed_registry (id, court_code, court_name, source, feed_url, tier, is_active,
  last_polled_at, last_successful_at, last_error, last_http_status, items_last_poll)

law_areas (slug PK, name, description, search_terms, catchword_patterns[],
  court_mask_paths[], icon, sort_order, is_active)

user_profiles (id → auth.users, display_name, plan, onboarded,
  dashboard_runs_this_week, dashboard_runs_reset_at)

user_areas (id, user_id → auth.users, area_slug → law_areas, email_frequency)

cases (id, citation UNIQUE, case_name, court, court_code, decision_date,
  austlii_url, jade_url, jade_article_id, source, catchwords, judgment_excerpt,
  excerpt_fetched, bench, orders, created_at, updated_at)

case_area_tags (case_id → cases, area_slug → law_areas,
  relevance_confidence, assigned_by, PRIMARY KEY(case_id, area_slug))

case_analyses (id, case_id → cases UNIQUE, facts_summary, legal_analysis,
  why_it_matters, significance_score, score_justification, primary_area,
  secondary_areas[], classification_reasoning, commentary_urls[], model_used,
  generated_at)

discovery_runs (id, period_type, period_start, period_end, status,
  sources_used[], courts_polled[], cases_discovered, cases_triaged,
  cases_analysed, error_message, created_at, completed_at)

user_digests (id, user_id → auth.users, period_type, period_start, period_end,
  area_slugs[], source, status, digest_summary, area_balance_note,
  raw_ai_response JSONB, model_used, tokens_used, run_duration_ms,
  error_message, created_at, completed_at)

user_digest_top_cases (id, digest_id → user_digests, case_id → cases,
  rank, facts_summary, legal_analysis, why_it_matters, catchwords,
  significance_score, score_justification, primary_area, secondary_areas[],
  classification_reasoning, commentary_urls[])

user_digest_extended_cases (id, digest_id → user_digests, case_id → cases,
  rank, significance_score, primary_area, one_line_summary, detail_loaded)

email_sends (id, user_id → auth.users, digest_id → user_digests,
  sent_at, status, email_type)
```

---

## 15 Areas of Law
Administrative Law · Constitutional Law · Contract Law · Employment & Industrial ·
Criminal Law · Corporations & Insolvency · Property & Real Estate ·
Planning & Environment · Tax · Torts & Personal Injury · Intellectual Property ·
Competition & Consumer · Migration · Privacy & Information · Family Law

---

## Business Model
- **Free:** 3 runs/week, 1 area
- **Pro $29/mo:** 10 runs/week, unlimited areas, archive
- **Team $99/mo:** (details TBC)

---

## Brand & Design

**Typography:**
- `Newsreader` — headings, case names, page titles
- `DM Sans` — body, labels, nav, UI
- `JetBrains Mono` — citations, court codes, metadata

**Colour palette (CSS variables):**
```css
--color-navy: #1A1F36;
--color-brass: #C49A2B;
--color-brass-light: #D4AD4A;
--color-parchment: #E8E0D0;
--color-warm-white: #FAF8F5;
--color-warm-bg: #F7F4EF;
--color-charcoal: #1A1A1A;
--color-muted: #6B6B6B;
--color-bark: #5C3D2E;
--color-red: #B83230;
--color-orange: #D4873A;
--color-card-bg: #FFFFFF;
--color-border: #E8E0D0;
--color-highlight-bg: #F5F0E8;
--font-serif: 'Newsreader', Georgia, serif;
--font-sans: 'DM Sans', -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', monospace;
--sidebar-width: 220px;
--topbar-height: 56px;
```

**Significance badge mapping:**
- 9–10 → `PRECEDENT SHIFT` · background #B83230 · white text
- 7–8  → `SIGNIFICANT` · background #D4873A · white text
- 5–6  → `NOTABLE` · background #C49A2B · white text

**Court badges:** Navy pill (#1A1F36), white text, JetBrains Mono 11px

**Layout:** Persistent left sidebar (220px) + top bar (56px). All authenticated pages
use this layout. Landing and auth pages are full-width only.

---

## Key Layout Rules
1. Sidebar nav items: Intelligence · Archive · Citations (disabled) · Reports (disabled)
2. "New Brief" button in sidebar = triggers new pipeline run
3. Disabled nav items show "Coming Soon" tooltip on hover
4. Sidebar collapses to icon-only rail at <1024px, hamburger at <768px
5. Content area max-width: 960px with comfortable padding
6. Case cards: 4px left border coloured by significance score
7. "Why it matters" box: background #F5F0E8, 3px brass left border

---

## Pages
- `/intelligence` — main dashboard (Priority Insights)
- `/archive` — past digests from `user_digests` table
- `/login` — auth
- `/settings` — profile, areas, subscription, security

---

## Deployment Architecture

**NOT Vercel serverless** — Wasp uses PgBoss (job queue) which requires a persistent
Node.js process. Vercel serverless functions can't run persistent background workers.

**Server → Railway** (or Fly.io): The Wasp Express server runs as a persistent process.
PgBoss is embedded in the server and handles the Sunday cron pipeline.

**Client → Vercel** (or Netlify): After `wasp build`, the static React SPA in
`.wasp/build/web-app/` can be hosted on Vercel as a static site (no server needed).

**Deployment steps (when ready):**
```bash
wasp build                          # generates .wasp/build/server/ + web-app/
cd .wasp/build/server && railway up  # deploy server to Railway
# deploy .wasp/build/web-app/ to Vercel as static site
```

**Env vars needed on Railway:** `DATABASE_URL`, `ANTHROPIC_API_KEY`, `WASP_SERVER_URL`,
`WASP_WEB_CLIENT_URL`, `JWT_SECRET`

**Dev:** `wasp start db` for Docker Postgres + `wasp start` for app. Docker is now available on this machine (previously wasn't on macOS 12).

---

## Key Decisions (Don't Revisit Without Good Reason)
- JADE RSS for discovery (AustLII feeds are dead)
- `www6.austlii.edu.au` for judgment text (other mirrors blocked server-side)
- Claude Sonnet 4 for all AI calls
- `cases` and `case_analyses` are shared across users — never duplicated per user
- `user_digests` are per-user (cross-prioritisation depends on area mix)
- Phase 1 runs once per week (shared); Phase 3 runs per user
- Queue/worker pattern for Phase 2b — never in a single synchronous function
- Fetch first 100KB only from AustLII pages (text is at the top)

---

## Wasp + Prisma: Schema Rules (Don't Break These)

**How Wasp manages schema.prisma:**
- The developer-owned source is `/schema.prisma` at the project root — edit this one
- Wasp reads it and generates `.wasp/out/db/schema.prisma` by appending auth models (`Auth`, `AuthIdentity`, `Session`) and an `auth Auth?` field to `User`
- The generated file at `.wasp/out/db/schema.prisma` is read-only — never edit it directly

**Rules:**
1. Never manually add `Auth`, `AuthIdentity`, or `Session` models to the project-root `schema.prisma` — Wasp injects these automatically. Doing so causes "cannot be defined because a model with that name already exists" errors across the whole schema.
2. Always run database commands via `wasp db migrate-dev`, never `npx prisma migrate dev` directly from the project root. Running Prisma directly creates a stray `migrations/` folder at the root; the canonical migrations live in `.wasp/out/db/migrations/`.
3. If you see the "already exists" errors, check `schema.prisma` for auth model duplicates and remove them.
4. If there is a stray `migrations/` at the project root, delete it: `rm -rf migrations/`
