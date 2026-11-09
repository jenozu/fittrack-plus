---
paths:
  - "backend/**/*.py"
---

# Backend rules (FastAPI + SQLAlchemy + Postgres)

- Routers live in `backend/routers/`, Pydantic schemas in `backend/schemas/`, business logic in `backend/services/`.
- Auth: `from utils.auth import get_db, get_current_user`. Every user-data query filters by `current_user.id`;
  another user's row returns 404 (not 403), so ids can't be probed.
- Schema changes go through Alembic (`.claude/skills/db-migration/SKILL.md`). Never `Base.metadata.create_all`
  in app code once task 4 is done.
- Food lookups go through `backend/food_data/service.py` (`search_foods`, `get_food`, `lookup_barcode`). Don't query
  `foods` ad hoc in routers, and don't call external food APIs anywhere else.
- Diary entries store a nutrition snapshot (calories, macros) computed by `services/nutrition.py` from grams at write
  time. Reading a day never recomputes from `foods`.
- Dates from the client are local `YYYY-MM-DD` strings; don't convert them through UTC.
- Use `logging`, not `print`, in new code. Never log tokens, passwords or full request bodies.
