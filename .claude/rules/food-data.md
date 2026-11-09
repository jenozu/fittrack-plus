---
paths:
  - "backend/food_data/**"
---

# Food database rules

- `schema.sql` is the only owner of `foods`, `food_portions`, `f_unaccent()` and `search_foods()`. It must stay
  idempotent (IF NOT EXISTS / CREATE OR REPLACE): deploy runs it every time.
- All nutrition is per 100 g. Portions are (label, grams). "100 g" is prepended by `service.py`, not stored.
- Barcodes are stored normalised to 13 digits (`common.normalize_barcode`). Always normalise before lookups.
- Importers upsert on (source, source_id) and must stay re-runnable. Never DELETE imported rows in bulk:
  diary entries reference `foods.id`.
- Search speed target: < 50 ms for `search_foods()` on the VPS. After changing the function, run
  `EXPLAIN ANALYZE SELECT * FROM search_foods('greek yog', 20);` on a db with real data and paste the time in the log.
- Live Open Food Facts calls: only in `service.lookup_barcode`, one per real scan, with `OFF_USER_AGENT`.
- Tests: `cd backend && TEST_DATABASE_URL=... pytest food_data -q` (fixtures in `food_data/tests/make_fixtures.py`
  mirror the real file layouts; extend them when you handle a new layout).
- Attribution must stay visible in the UI: USDA FoodData Central, Canadian Nutrient File (Health Canada),
  Open Food Facts (ODbL).
