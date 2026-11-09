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
