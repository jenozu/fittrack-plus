# Parking lot

Ideas that are not part of the current plan. Review at the end of each phase: promote to a
task, defer, or delete on purpose.

- 2026-11-08: Re-enable hidden features one at a time (water, measurements, recipes, exercise log) after the 7-day trial.
- 2026-11-08: USDA Branded Foods import (US-only, ~3 GB) if OFF misses too many US products.
- 2026-11-08: Contribute missing Canadian products back to Open Food Facts (their write API) when a user creates a custom food from a failed scan.
- 2026-11-08: Monthly cron job to refresh OFF data (`import_food_data.sh` is already idempotent).
- 2026-11-08: Offline logging queue in the service worker (log without signal, sync later).
- 2026-11-08: AI photo logging (existing ai_meal_recognition.py) — costs money per call; only if manual logging proves to be the bottleneck.
- 2026-11-08: Apple Health / Google Fit step and weight sync (not possible from a PWA without a native wrapper).
- 2026-11-08: Off-site backups (rclone to Backblaze B2 / Google Drive).
2026-11-08: task 3 review - registration lock fails open on values other than exact 'false'; set exactly ALLOW_REGISTRATION=false at task 19 (or tighten parse). Also /health returns str(e) from DB errors (leaks host/user).
2026-11-08: backend/README.md is UTF-16; convert to UTF-8 sometime. /health stale startup log says 'Nutritionix + USDA'.
- 2026-11-08: /food/search now returns bare list; frontend FoodLog.jsx:63 expects .results (fix in Phase 2). Docs still mention Nutritionix (API_SETUP_GUIDE.md, READMEs).
- 2026-11-08: Drop the food_master table and FoodMaster model/schemas once hidden features (ai_meal, recipes, meal_plans, smart_coach) are rebuilt on food_data; food flow no longer touches it (task 7.4).
- 2026-11-08: move custom-food write helpers from routers/food.py into food_data/service.py; test food delete nulls food_entries.food_id; copy_food loses extra portions
- 2026-11-08: repo-wide 'npm run lint' has ~91 pre-existing errors in untouched pages (Progress, Recipes, Register...). Task 10 testStrategy says lint passes; clean up. Also: FoodLog entry rows show 'quantity unit' - show portion_label/grams; hook custom food form into FoodSearch onCreate.
- 2026-11-08: PortionPicker edit mode: unmatched portion_label silently falls back to first portion on save; defaultMeal exported from component file (move to util).
- 2026-11-08: backend/routers/users.py _calculate_target_calories is a second macro formula (30/40/30); consider removing for one source of truth.
- 2026-11-08: add users.weight_unit via Alembic so kg/lb follows the user across devices (currently localStorage); log-weight shortcut on Today.
- 2026-11-08 frontend: replace placeholder PWA icons with real logo; Install entry in Profile to reopen instructions
- 2026-11-10: backup_db.sh could start with 'cd /' (find cwd warning exits 1 when run via ssh from /root; fine under cron)
- 2026-11-10: import_food_data.sh passes openfoodfacts.csv.gz to import_off, which OOMs duckdb on the VPS; gunzip to a temp .tsv first (17.4 builder ran it by hand). Also search_foods EXPLAIN 57 ms cold on 950k rows vs 50 ms target.
