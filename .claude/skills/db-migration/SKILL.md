---
name: db-migration
description: Create, review and test an Alembic migration for FitTrack+ app tables (users, food_entries, weight_logs...). Use whenever a task changes a SQLAlchemy model or a table's columns. Not for the foods/food_portions tables, which backend/food_data/schema.sql owns.
---

# Alembic migration procedure

Prerequisite: task 4 is done (`backend/alembic.ini` exists). If not, stop: that task comes first.

1. **Change the model** in `backend/models.py`. Keep old columns that existing rows use (e.g. food_entries.quantity/unit);
   add new ones as nullable or with a server_default, so the upgrade works on a table that has data.
2. **Generate**, from `backend/` with the venv active:
   `alembic revision --autogenerate -m "<what changed, short>"`
3. **Read the generated file** in `backend/alembic/versions/`. Fix it by hand when autogenerate gets it wrong:
   - It must NOT mention `foods` or `food_portions` (the `include_object` filter in env.py should prevent it; if it
     appears, the filter is broken - fix env.py, not the migration).
   - Renames show up as drop + add, which loses data: replace them with `op.alter_column(..., new_column_name=...)`.
   - Adding NOT NULL to a table with rows needs a `server_default` or a data backfill step first.
   - Foreign keys to `foods(id)` use `ondelete="SET NULL"` (diary entries keep their nutrition snapshot).
   - `downgrade()` must really undo `upgrade()`.
4. **Test the round trip** on the local dev db with some data in it:
   `alembic upgrade head && alembic downgrade -1 && alembic upgrade head`
   then `alembic check` (no pending model changes).
5. **Run the backend tests**: `TEST_DATABASE_URL=postgresql://fittrack:fittrack@localhost:5432/fittrack_test pytest -q`
6. Commit the migration together with the model change. `scripts/vps/deploy.sh` runs `alembic upgrade head` on deploy;
   the nightly backup is the safety net, but for a destructive migration take a manual one first:
   `sudo -u postgres bash /var/www/fittrack-plus/scripts/vps/backup_db.sh`.
