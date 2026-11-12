# Manual checks waiting for the human

The phase-runner appends steps here instead of stopping mid-phase. Run them at the end of the phase,
tell the lead which failed, then delete the sections that passed.

## Task 2 - Set up local development (2026-11-08)
1. `cd backend && venv/Scripts/python.exe -m uvicorn main:app`, then `cd frontend && npm run dev`; open the printed URL; login/landing page renders, no console errors.
2. Optional: http://localhost:8000/docs loads.
3. Note: email-validator + dnspython added to requirements.txt (needed by existing pydantic EmailStr); csv.field_size_limit fix for Windows. Revert if unwanted.

## Task 4 - Adopt Alembic migrations (2026-11-08)
1. `cd backend`, `venv/Scripts/python.exe -m uvicorn main:app --port 8000`; open http://localhost:8000/docs; register a test user, log in, create a food entry; expect 2xx. (Automated TestClient e2e already passed on a scratch db.)
2. Note: bcrypt==4.0.1 pinned in requirements.txt (passlib compat; fixes 72-byte register error). Old-install procedure: `alembic stamp bf60e849d28a && alembic upgrade head`.

## Task 10.1 - API client (2026-11-08)
1. Run backend + `cd frontend && npm run dev`, log in, DevTools console.
2. `await foodAPI.search('banana')` returns foods with `portions` (if foodAPI is not on window, check via FoodLog search once 10.4 lands).
3. Search 'a b&c' sends q=a%20b%26c.

## Task 10.2 - Search component (2026-11-08)
1. Mount FoodSearch (wired in 10.4), Network tab filter food/search. Type g,gr,gre,greek fast: <=2 requests, earlier ones cancelled; slow-3G: newest results win.
2. Empty box shows Recent; suspect foods show warning icon; rows show name, brand, kcal, source tag; input autofocused.
3. 390x844: no horizontal scroll, rows >=44 px. Check source tag for Open Food Facts food shows "Open Food Facts" (key guessed as "off").

## Task 10.3 - Portion picker (2026-11-08)
1. After 10.4 wiring: search Bananas, raw; pick g, 150 -> preview 145.5 kcal.
2. Change meal to dinner, Add -> entry stored with meal_type dinner. Portion label x 0.5 sends portion_label+quantity.
3. 390x844: sheet clears home bar, no zoom on focus, number keyboard. Note: "0,5" (comma) not accepted.

## Task 10.4 / 10 - Wire into FoodLog (2026-11-08)
1. Backend + `npm run dev`, Chrome device mode 390x844, Food Log -> Search Food.
2. Type "chick bre": results ~0.5 s. Tap, pick "1 cup, chopped" x 1.5: preview updates. Add -> entry in right meal, totals update.
3. Barcode scan opens PortionPicker; miss shows not-found alert. Footer attribution visible. No console errors.

## Task 11 - Barcode scanner (2026-11-08)
1. Camera needs HTTPS: deploy, or `vite --host` with @vitejs/plugin-basic-ssl (not installed).
2. iPhone Safari + Android Chrome: scan 5 packaged foods -> PortionPicker for the right product.
3. Unknown barcode (or typed number) -> "No food found" card -> "Not found - add it" -> form with barcode prefilled -> Save -> PortionPicker.
4. Close scanner: camera light off. Torch button on Android. Repeat after Add to Home Screen (task 16).

## Task 12 - Today screen (2026-11-08)
1. 390x844, "/" : "+ Add" per meal for breakfast/lunch/dinner/snack lands in the right meal (meal preselected).
2. Tap entry -> change grams -> Save; Delete another. Totals update; remaining = target - eaten; macro bars match sums.
3. < yesterday, Today to return. "Copy yesterday's breakfast" works; empty day shows note.
4. Recent chip one-tap add; scan button opens camera. No horizontal scroll, no layout jump, no console errors.
5. Edit-mode oddity: entry whose portion_label matches no portion falls back to first portion on save (low risk).

## Task 13 - Hide non-core features (2026-11-08)
1. 390x844: bottom bar has Today, Add, Progress, Profile; each works, active highlighted; content not hidden behind bar; logout icon works. (If bar sits under iPhone home indicator add viewport-fit=cover to index.html.)
2. Desktop: top nav same 4 links.
3. URLs /exercise /recipes /meal-planning /measurements /achievements /export redirect to /.
4. Profile: no achievements button, level line or export card.

## Task 14 - Onboarding and targets (2026-11-08)
1. Onboard test profile (30 y, 165 cm, 60 kg, female, moderate): target ~2046 kcal.
2. Profile: edit calories/macros, Save; Today shows the new targets; survives reload.
3. Note: lean bulk is +300 (spec example +250) - confirm OK.

## Task 15 - Weight log and trend (2026-11-08)
1. Progress page at 390 px (log row may be cramped): log a weight -> point appears; five days -> 5 points + 7-day average line.
2. Log twice same day -> one point, value replaced. kg/lb toggle persists after reload (localStorage, not profile). 30/90 days switch works.

## Task 16 - Installable PWA (2026-11-08)
1. `cd frontend && npm run build && npx vite preview`; Chrome DevTools > Application > Manifest: no errors, "installable", icons shown.
2. Application > Service Workers: sw.js registered; /api/ requests never served from SW cache.
3. After login the Install modal shows once; "Got it" then reload: not shown again.
4. After deploy (task 17): iPhone (Safari > Share > Add to Home Screen) and Android (Chrome > Install app) open full-screen with icon; scanner still works.
Note: icons are placeholder "F+"; vite-plugin-pwa resolved to 2.0.0 (spec said 1.x), builds fine on Vite 5.

## Task 17.5 - Search sanity on live data (2026-11-10)
Automatic: all 5 PRD searches return in 170-275 ms end to end over the public API. Judge by hand: top-3 for chicken breast, greek yogurt, kraft dinner, shreddies are all OFF branded entries (duplicates like "Chicken Breast" x3), generic CNF/USDA items are not ranked first. If that is not "sensible", add a ranking task (prefer cnf/usda for generic queries, dedupe names). Kraft dinner 273 ms is near the 300 ms limit; retest from the phone.

## Task 18 - Backups (2026-11-10)
Tomorrow: `ssh root@2.25.108.3 'ls -lh /var/backups/fittrack; tail /var/log/fittrack-backup.log'` should show a new dump from the 03:15 cron and no errors. Optionally scp a dump to your computer (off-server copy).
Also before task 19: delete test user deploycheck@example.com (id 1) from prod.

## Task 20 - Remove dead exercise data from Progress (2026-11-11)
1. Open Progress at 375px and 1280px.
2. No "Burned" legend entry, burned bar or Total Burned card.
3. Dashed Target line is visible across the Calorie Trends chart.
4. Two remaining stat cards: 2 columns at 1280, stacked at 375.

## Task 21 - Design foundation (2026-11-11)
1. Today/Add/Progress/Profile at 375 and 1280: one primary button style (brand magenta, white text); Add's Scan Barcode is outlined secondary.
2. Active nav item reads clearly (brand-700 on brand-100), mobile and desktop.
3. Tab through a form: visible focus ring.
4. Fit Boo SVG mark replaces F+; Login/Register background flat pale pink.

## Task 22.1 - Today summary (2026-11-11)
1. /?date=<yesterday> shows yesterday and a Today link; /?date=not-a-date falls back to today.
2. 375 and 1280: P/C/F bars in three distinct colours.
3. Over protein target: right-hand text red, bar stays full. Over kcal: red number with "kcal over".

## Task 22.2 - Today meal sections (2026-11-11)
1. 375px: empty meal shows "No <meal> logged yet."; "Add food" and "Copy yesterday" on one line.
2. Logged row shows amount under name ("1 slice · 28 g"); quick add shows "Quick add".
3. Tap row, edit amount, Save; tap row, Delete.

## Task 22.3 / 22 - Search-first Add (2026-11-11)
1. 375px: Today > Add food under Lunch: "Add to Lunch", search focused, no diary list.
2. Search "banana", pick, Add: back on Today with entry and amount. Edit amount, Save; Delete.
3. Bottom nav Add > Quick add logs to the time-of-day meal.
4. Barcode miss: "No food found" with Dismiss and "Add it" opens custom food form.
5. 1280px: /food single column looks right.

## Task 23 - Progress polish (2026-11-11)
1. 375 and 1280: plain "Progress", one period control, weight form not truncated, headline 7-day average + change.
2. Last point/bar carries today's date.
3. Macros-by-day table shows hit/miss per day. Hit thresholds are the builder's choice (kcal within 10%, protein >=90%, carbs/fat <=110%): owner to OK or adjust.
4. Fresh account: both empty states render.

## Task 24 - Profile polish (2026-11-11)
1. 375 and 1280: no number over 1 decimal, no greyed fields, one Save, sections Account/Body/Goal/Daily targets.
2. Change Target Calories, Save, reload: persists.
