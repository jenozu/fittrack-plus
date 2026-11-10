# FitTrack+ task checklist

Generated from `.taskmaster/tasks/tasks.json` (the source of truth). Regenerate with
`python .taskmaster/render_tasks_md.py`. Work the tasks in order; each one says how to test it.

**Progress: 16/19 tasks done.**

## Phase 0 - Foundation

- [x] **1. Clean up the repo**  
  Untrack the committed virtualenv and caches, remove the dead top-level mockup, archive old planning docs and deploy scripts.  
  _Test:_ `git ls-files | grep -c -E "venv/|__pycache__"` prints 0. `ls` at repo root shows README.md, backend, frontend, docs, scripts, .taskmaster.
- [x] **2. Set up local development** _(after 1)_  
  Postgres in Docker, backend venv, frontend packages, .env, and the food tables, so the app runs on the developer's computer.  
  _Test:_ `curl localhost:8000/health` returns 200. The frontend loads in the browser. In backend/: `TEST_DATABASE_URL=postgresql://fittrack:fittrack@localhost:5432/fittrack_test pytest food_data -q` -> 10 passed (create the db first: `docker compose -f scripts/local/docker-compose.dev.yml exec -T db createdb -U fittrack fittrack_test`).
- [x] **3. Security basics** _(after 2)_  
  Fail fast without a real SECRET_KEY, restrict CORS, and stop strangers from registering on the public URL.  
  _Test:_ `pytest backend/tests/test_security.py -q`: (a) importing utils.security with SECRET_KEY unset raises; (b) POST /auth/register returns 403 with ALLOW_REGISTRATION=false; (c) a request with Origin: https://evil.example gets no Access-Control-Allow-Origin header.
- [x] **4. Adopt Alembic migrations** _(after 3)_  
  Replace Base.metadata.create_all with Alembic so existing tables can be changed safely (create_all never alters a table).  
  _Test:_ Drop and recreate the local db, run `alembic upgrade head`, start uvicorn, register a user and log a food via /docs. `alembic check` (or `alembic revision --autogenerate` producing an empty migration) shows models and db agree.

## Phase 1 - Food database in the API

- [x] **5. Local food database (schema, importers, search, barcode)**  
  Free, self-hosted food data in Postgres: USDA Foundation + SR Legacy, Health Canada CNF, Open Food Facts (Canada/US), with ranked search and barcode lookup.  
  _Test:_ `TEST_DATABASE_URL=... pytest backend/food_data -q` -> 10 passed. Real-data run is task 17.4.
  - [x] 5.1 Schema and search function
  - [x] 5.2 USDA importer
  - [x] 5.3 CNF importer
  - [x] 5.4 Open Food Facts importer
  - [x] 5.5 Service: search, get, barcode with live fallback
  - [x] 5.6 Download/import shell scripts
- [x] **6. Serve the food database from the API** _(after 4, 5)_  
  Point /food/search and /food/barcode at food_data.service and delete the mock and paid-API services.  
  _Test:_ backend/tests/test_food_api.py with TestClient + a logged-in test user against the test db loaded from the food_data fixtures: search "banana" -> first result "Bananas, raw" with portions[0]=={"label":"100 g","grams":100}; unauthenticated search -> 401; barcode 068100084245 -> Kraft Dinner; unknown barcode with the live fetch monkeypatched to None -> 404. Locally with real USDA/CNF data: `curl -H "Authorization: Bearer $T" "localhost:8000/food/search?q=chicken%20breast"` looks sensible.
- [x] **7. Diary entries store grams and a nutrition snapshot** _(after 6)_  
  Log food by grams or portion; the server computes calories/macros from per-100 g data and stores them on the entry.  
  _Test:_ `pytest backend/tests/test_diary.py -q` passes (see subtasks). Old rows created before the migration still list correctly.
  - [x] 7.1 Migration: new food_entries columns
  - [x] 7.2 Nutrition maths
  - [x] 7.3 Entry endpoints
  - [x] 7.4 Stop writing food_master
- [x] **8. Custom foods** _(after 7)_  
  Users can create, edit and delete their own private foods, including from a failed barcode scan and as a corrected copy of a bad entry.  
  _Test:_ pytest: create per-serving (30 g serving, 120 kcal -> 400 kcal/100 g); user B cannot see it in search or GET /food/{id}; scan the custom barcode as user A -> returns the custom food; copy of an OFF food is editable and ranks first for user A.
- [x] **9. Recent foods, frequent foods, copy a meal** _(after 7)_  
  One-tap re-logging, which is most of daily use.  
  _Test:_ pytest: log A, B, A -> recent = [A, B] with A's last grams; copy yesterday's breakfast creates identical rows on today.

## Phase 2 - Core loop on a phone

- [x] **10. Frontend: food search and portion picker** _(after 6, 7)_  
  Fast, phone-friendly search-as-you-type and a portion sheet with a live macro preview.  
  _Test:_ Manual at 390x844 in Chrome devtools device mode: type "chick bre" -> results within ~0.5 s; pick "1 cup, chopped" x 1.5 -> preview updates; Add -> appears in the right meal. `npm run build` and `npm run lint` pass.
  - [x] 10.1 API client
  - [x] 10.2 Search component
  - [x] 10.3 Portion picker sheet
  - [x] 10.4 Wire into FoodLog page
- [x] **11. Barcode scanner that works on iPhone and Android** _(after 10)_  
  Replace quagga with the BarcodeDetector API plus the barcode-detector (ZXing WebAssembly) polyfill; misses lead to 'add this food'.  
  _Test:_ On a real iPhone (Safari) and Android (Chrome): scan 5 packaged foods; each opens the right product or the add form. Closing the scanner turns the camera light off. Works after "Add to Home Screen" too (re-check in task 16).
- [x] **12. Today screen (diary dashboard)** _(after 9, 10)_  
  The home screen: today's meals, totals vs targets, quick add, day navigation.  
  _Test:_ Manual at 390x844: log breakfast/lunch/dinner/snack, edit one entry's grams, delete one, navigate to yesterday and back, copy yesterday's breakfast. Totals match the sum of the entries.
- [x] **13. Hide non-core features** _(after 1)_  
  Feature flags hide AI scan, coach, badges, meal planning, recipes, water, measurements, export, exercise from navigation and routes.  
  _Test:_ Every visible link works; no hidden page is reachable by URL (redirects to /); `npm run build` passes.
- [x] **14. Check onboarding and targets** _(after 3)_  
  Make sure calorie and macro targets are computed correctly and can be edited.  
  _Test:_ `npm test`: 30 y, 165 cm, 60 kg, female, moderate -> BMR 1320.25, TDEE ~2046. Manual: edit targets in Profile, Today screen updates.
- [x] **15. Weight log and trend** _(after 4)_  
  Log weight quickly and see a smoothed trend.  
  _Test:_ Log 5 weights on different days; chart shows points and the average line; logging twice on one day keeps one value.

## Phase 3 - Ship

- [x] **16. Make it an installable PWA** _(after 13)_  
  Manifest, icons, service worker and iOS tags so it installs from the browser and opens full-screen.  
  _Test:_ `npm run build` emits dist/sw.js and dist/manifest.webmanifest. Chrome devtools > Application > Manifest shows no errors and "installable". After deploy (task 17), installing on both phones opens full-screen with the icon, and the scanner still works.
- [ ] **17. Server setup, first deploy, real food data** _(after 6, 16)_  
  Put the app on the VPS with HTTPS and load the real food databases.  
  _Test:_ https://<domain> loads with a valid certificate; /api/health returns 200; the 5 searches in PRD success criterion 1 return sensible top-3 results in under 300 ms (check the browser Network tab).
  - [x] 17.1 DNS and server setup
  - [~] 17.2 Existing data (only if an old install had real data)
  - [x] 17.3 First deploy
  - [ ] 17.4 Download and import food data
  - [ ] 17.5 Speed and sanity check
  - [x] 17.6 IP/HTTP-only mode for setup_server.sh
- [ ] **18. Backups and a restore drill** _(after 17)_  
  Prove the nightly backup works and can be restored.  
  _Test:_ Row counts in the restored test db match production; the drill is logged on this task with the date.

## Phase 4 - Live with it

- [ ] **19. Phone install and 7-day trial** _(after 11, 12, 14, 15, 18)_  
  Both people install it, log for a week, and the top friction gets fixed.  
  _Test:_ PRD success criteria 1-5 checked off in the decision log with dates. Both users have 7 consecutive days with entries: `SELECT user_id, count(DISTINCT entry_date) FROM food_entries WHERE entry_date > now() - interval '8 days' GROUP BY 1;` -> 7 each.
