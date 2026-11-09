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
