# FitTrack+ rules (always loaded, for the main session and every subagent)

## Scope
- The plan is `.taskmaster/`. Work only on the task you were given or that `tasks.py next` returns.
- PRD non-goals are off limits: no Expo/native, no paid food APIs, no un-hiding AI scan/coach/badges/meal plans/
  recipes/water/measurements/export/exercise, no scraping other apps.
- No new dependency (pip or npm) unless the task names it. Otherwise report it as an idea.
- Ideas → `.taskmaster/docs/parking-lot.md` (dated line). Never build them on the side.

## Safety
- Never commit secrets. `.env` files are gitignored; config comes from env vars (`os.getenv`), with no real defaults
  for secrets.
- Never run destructive commands against anything but the local dev/test databases: no `DROP`, `TRUNCATE`,
  `pg_restore --clean`, `rm -rf` outside the repo, `git push --force`, `git reset --hard` on shared branches.
- Never ssh to the VPS or deploy unless the user explicitly asked in this session (`/deploy`).
- Every endpoint that touches user data requires `Depends(get_current_user)` and filters by `user_id`.
  Custom foods are private to `created_by_user`.

## Code
- Small, direct changes. Match the surrounding style. No speculative abstractions, no drive-by refactors.
- Python: type hints on new functions, `sqlalchemy.text()` with bound parameters for raw SQL (never f-strings with
  user input). Backend tests in `backend/tests/` (pytest, FastAPI TestClient).
- Every task ends with its testStrategy actually run. "Looks right" is not done.

## Commands that work here
- Task state: `python .taskmaster/tasks.py status|next|show <id>|log <id> "..."|set-status <id> <status>|validate`
- Backend tests: `cd backend && TEST_DATABASE_URL=postgresql://fittrack:fittrack@localhost:5432/fittrack_test pytest -q`
- Local db up: `docker compose -f scripts/local/docker-compose.dev.yml up -d`
- Frontend: `cd frontend && npm run build && npm run lint`
- Shell scripts: `shellcheck -S warning scripts/*/*.sh` if shellcheck is installed.
