# FitTrack+

## Goal
A calorie and macro tracker that two people (the owner and his girlfriend) actually use every day
on their phones instead of MyFitnessPal. It is a web app opened from a home-screen icon (PWA), so
there is nothing to install from an app store. **Done** means: both of us have logged every meal
for 7 days straight on our phones, finding almost every food by search or barcode in under
10 seconds, without asking the developer for help.

## Non-goals (for now)
- Native iOS/Android apps, Expo, app-store releases.
- AI photo meal recognition, smart coach, gamification (XP, badges, levels), meal planning,
  grocery lists, recipes, water tracking, body measurements, data export. The code exists; it is
  hidden from the UI, not deleted. Revisit only after the success criteria are met.
- Paid food APIs (Nutritionix, Edamam, FatSecret Premier). No per-call costs.
- Scraping or reverse-engineering MyFitnessPal or any other app.
- Social features, sharing, public sign-up, multi-tenant scale. Two to ten users on one VPS.

## Success criteria
1. Searching "banana", "chicken breast", "greek yogurt", "kraft dinner", "shreddies" each returns
   a sensible top-3 in under 300 ms on the VPS.
2. Scanning the barcode of 10 random packaged foods from our kitchen (Canadian groceries) finds
   at least 8; the misses can be added as a custom food in under a minute.
3. The app installs to the home screen on iPhone (Safari) and Android (Chrome), opens full-screen,
   and the camera barcode scanner works there.
4. A day's diary shows calories and protein/carbs/fat against targets computed at onboarding.
5. Deploying a change is one command; the database is backed up nightly and a restore has been tested.

## Capabilities
### Food database (local, free)
- Import USDA Foundation + SR Legacy (generic foods), Health Canada CNF (Canadian generic foods),
  and Open Food Facts products sold in Canada/US into Postgres. Values stored per 100 g, with portions.
- Search-as-you-type with prefix matching, typo tolerance and ranking (generic foods first for
  plain words, popular products for brands).
- Barcode lookup: local first, then one live Open Food Facts call per real scan, cached.
- Custom foods per user (private), including "fix this food" copies of bad entries.
### Diary
- Log a food to a meal (breakfast/lunch/dinner/snacks) by grams or a portion; edit; delete.
- Recent and frequent foods for one-tap re-logging. Copy yesterday's meal.
- Daily totals vs targets; move between days.
### Goals and progress
- Onboarding computes calorie target (Mifflin-St Jeor + activity) and macro split; editable.
- Weight log with a simple trend chart.
### Delivery
- PWA (manifest, icons, service worker), HTTPS on the VPS, one-command deploy, nightly backups.

## Structure
```
backend/
  food_data/        <- food database: schema.sql, importers, service.py (search/barcode)  [built]
  routers/food.py   <- food search/barcode/custom-food/diary endpoints
  routers/users.py  <- profile + targets
  models.py         <- SQLAlchemy models (Food/FoodPortion map onto food_data tables)
  alembic/          <- schema migrations for app tables
frontend/src/
  pages/FoodLog.jsx, Dashboard.jsx, Onboarding.jsx, Progress.jsx
  components/FoodSearch*, PortionPicker, BarcodeScanner
  config/features.js <- feature flags hiding non-goal pages
scripts/
  food/   <- download + import food data
  vps/    <- setup_server.sh, deploy.sh, backup_db.sh, restore_db.sh
  local/  <- cleanup_repo.sh, dev_setup.sh, docker-compose.dev.yml
```

## Dependency order
1. Repo cleanup and local dev environment (nothing else is reliable before this).
2. Security basics and migrations (Alembic) — needed before changing tables.
3. Food database wired into the API (depends on 2).
4. Diary changes to store grams + food reference (depends on 3).
5. Frontend food search, portion picker, scanner, diary (depend on 3–4).
6. Targets/onboarding check, weight log (independent of 3–5, after 2).
7. PWA + VPS + deploy + backups (deploy needs 5; VPS setup can happen any time after 1).
8. Real-use trial and fixes (needs everything).

## Phases
- Phase 0 — Foundation: cleanup, local dev, security, Alembic. Exit: backend + frontend run locally, tests pass.
- Phase 1 — Food database live in the API. Exit: `/food/search?q=banana` returns real USDA/CNF/OFF results locally.
- Phase 2 — Core loop on a phone screen. Exit: log a full day of meals locally at 390 px width, by search and by barcode.
- Phase 3 — Ship. Exit: https://<domain> installed on both phones, nightly backup present, restore tested.
- Phase 4 — Live with it. Exit: success criteria 1–5 met after a 7-day trial.

## Test strategy
- Backend: `pytest` under `backend/` against a throwaway Postgres
  (`TEST_DATABASE_URL=postgresql://fittrack:fittrack@localhost:5432/fittrack_test pytest -q`).
  Critical: food search ranking, barcode normalisation (UPC-A vs EAN-13), nutrition maths from
  grams, custom foods private per user, auth required on every diary endpoint.
- Frontend: `npm run build` must pass; `npm run lint`; manual checks in Chrome devtools at 390×844.
- Deploy: `deploy.sh` ends with a health check; after deploy, run the 5 searches in criterion 1.

## Architecture and stack
Kept from the existing repo (it already works; rewriting would cost weeks and gain nothing):
- Frontend: React 18 + Vite + Tailwind + React Router + Recharts. Add `vite-plugin-pwa`.
- Backend: FastAPI + SQLAlchemy + Postgres 16, JWT auth. Add Alembic for app-table migrations.
- Food data: self-hosted in the same Postgres (`foods`, `food_portions`, `search_foods()`),
  using `pg_trgm` + `unaccent`. Import with Python + DuckDB (streams the 9 GB OFF export).
- Hosting: the existing VPS (Ubuntu), nginx serving `frontend/dist` and proxying `/api` to uvicorn,
  Let's Encrypt HTTPS, systemd service `fittrack-backend`, app at `/var/www/fittrack-plus`.
Rejected: Expo/React Native (install friction), Supabase (would mean rewriting the working
FastAPI backend), Nutritionix (free tier gone), live-API-only search (OFF search API is
rate-limited and not meant for typeahead; USDA lacks Canadian products).

## Risks and open questions
- CNF 2026 file layout could not be checked before writing the importer (it was tested against
  the 2015 layout and a guessed 2026 layout). Run `python -m food_data.import_cnf <dir> --inspect`
  first; if columns are not recognised, adjust the candidate lists in `import_cnf.py`.
- OFF data quality varies; mitigated by sanity checks (`quality='suspect'` ranks lower) and custom foods.
- Canadian store brands (PC, Compliments, Selection) may have thin OFF coverage; custom foods +
  contributing back to OFF are the fallback.
- iOS PWAs: camera access from a home-screen app has historically been less reliable than in Safari itself.
  Test the scanner on the iPhone in installed mode early (task 11/16); keep the "type the number" fallback.
- Small VPS RAM: setup adds swap; OFF import uses `--memory-limit 1GB` by default.

## Decision log
- 2026-11-08: Keep the existing React + FastAPI + Postgres app and VPS instead of rebuilding in
  Expo/Supabase. Reason: it is already a web app; the blocker was food data, not the stack.
- 2026-11-08: Food data comes from free bulk downloads imported into our own Postgres (USDA
  Foundation + SR Legacy, Health Canada CNF, Open Food Facts CA/US), with live OFF only for barcode
  misses. Nutritionix and the mock USDA/Nutritionix services are removed. (affects tasks 5–8)
- 2026-11-08: Non-core features are hidden behind feature flags, not deleted. (task 13)
- 2026-11-08: Diary entries keep a nutrition snapshot (kcal/macros at time of logging) plus a
  nullable food reference, so re-importing food data never changes past days. (task 7)
- 2026-11-08: Task 5 (food database layer) built and tested against sample files shaped like the
  real downloads; not yet run on the real downloads. (tasks 5, 17)
