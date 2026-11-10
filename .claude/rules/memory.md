# FitTrack+ memory (short-term project state)

<!-- Put this file at .claude/rules/memory.md. Rules without a `paths:` header load automatically at the start of
     every Claude Code session, so nothing else needs to import it. HTML comments like this one are stripped before
     loading, so they cost no context. -->

**Why this file exists:** so a new session knows where things stand without re-reading the PRD, the task logs or
old chats. Read this first. Open `.taskmaster/` only for the task you're working on.

**Who edits it:** the phase-runner, **once at the end of each run** (complete, partial or escalation), in its own
commit. The lead also edits it after resolving an escalation or when the human gives a fact worth keeping.
Builders, the verifier and the reviewer only read it. Never update it per task.

**Size rules (this is the point of the file):**
- Max ~80 lines total. Each section has a cap; when it's full, delete the least useful line before adding one.
- Replace, don't append: "Now" is overwritten every time, and outdated lines are deleted, not struck through.
- Only add a line to "Learned" if it would save a future session 5+ minutes or prevent a repeat failure.
- Details belong in `tasks.py log <id>`; this file holds one-line pointers ("see 7.3 log").

---

## Now (overwrite each time, max 6 lines)
- Phase 3 - Ship. Done: 16, 17.1 (setup_server.sh ran, IP mode), 17.2 cancelled (n/a). 17.3 deploy.sh ran OK on VPS (API healthy on 127.0.0.1:8000).
- BLOCKER: VPS is shared; Docker Traefik owns :80/:443 (other apps: rf-scanner, twd, arova, ebaybay). http://2.25.108.3 -> Traefik 308 to https. FitTrack nginx not reachable.
- Needs human decision: domain + Traefik route, or nginx on a free alt port (8082 taken). Then 17.3 register test, 17.4 food import, 17.5, 18.
- Last session: 2026-11-10, phase 3 stopped at HUMAN NEEDED (port conflict).
- Manual checks waiting: see `.taskmaster/docs/manual-checks.md` (task 16).

## Facts (stable, max 15 lines)
- Dev machine: Windows; shell scripts run in Git Bash; venv python at `backend/venv/Scripts/python.exe`.
- Local db: native PG17 (no Docker; superuser `postgres` needs no password locally), `postgresql://fittrack:fittrack@localhost:5432/fittrack_db`; tests use `.../fittrack_test`.
- VPS: Ubuntu, app at `/var/www/fittrack-plus`, user `fittrack`, service `fittrack-backend`, nginx `/api/` -> :8000.
- Domain: none yet, serve on the IP over HTTP (camera scan + PWA install need HTTPS later) · SSH target: root@2.25.108.3 (also in `.claude/deploy-target`). No old FitTrack data.
- VPS is SHARED: Docker Traefik (traefik-traefik-1) owns :80/:443 for other apps (rf-scanner, twd-*, arova, ebaybay). Never touch them without asking.
- Food data: local Postgres (`foods`, `food_portions`, `search_foods()`), per 100 g. Live Open Food Facts calls only on barcode misses.
- Diary entries store a nutrition snapshot; never recompute past days.
- Hidden (non-goal) features stay hidden: AI scan, coach, badges, meal plans, recipes, water, measurements, export, exercise.
- Users: the owner + his girlfriend. Registration gets closed after both sign up (task 19).

## Decisions since the PRD (max 8 lines, newest first; full text in prd.md decision log)
- 2026-11-08: Local dev on native PG17, not Docker. dev_setup.sh skips docker if missing.
- 2026-11-08: Lead (main, Opus) launches a phase-runner (Sonnet, medium) per phase; it routes tasks to builders
  haiku -> sonnet -> opus and escalates to the lead only when stuck. Manual checks are batched per phase.

## Learned / gotchas (max 15 lines, newest first)
- vite-plugin-pwa resolved to 2.0.0 (task said 1.x); works on Vite 5. `npm run lint` has ~98 pre-existing errors (React unused import).
- Repo-wide `npm run lint` is red (~86 pre-existing errors in untouched pages); check touched files with `npx eslint <files>` instead.
- zxing-wasm exports map blocks dist/ paths: use `zxing-wasm/reader/zxing_reader.wasm?url` (task 11).
- Windows pytest may need `--basetemp=<scratchpad>` (default temp dir PermissionError).
- Run pytest with `backend/venv/Scripts/python.exe -m pytest -p no:cacheprovider --basetemp=<writable dir>`; global python lacks food_data and default tmp is permission-denied.
- Migration 7.1 adds the foods FK only if `foods` exists: apply food_data schema before alembic on deploy.
- Run pytest/alembic with backend/venv/Scripts/python.exe (system python lacks duckdb); add --basetemp in a writable dir if WinError 5. Agents can't read .env files; pass DATABASE_URL via env.
- Old-install DBs: `alembic stamp bf60e849d28a && alembic upgrade head` (not `stamp head`). bcrypt pinned 4.0.1 for passlib.
- ALLOW_REGISTRATION closes only on exact "false"; set it exactly so at task 19.
- CNF 2026 column names are unverified: run `python -m food_data.import_cnf <dir> --inspect` before importing (task 17.4).
- `backend/requirements.txt` was UTF-16; it's now UTF-8. Keep it UTF-8 (Windows editors can silently switch it back).
- `search_foods()` must stay two-stage (prefix candidates, then ranking); a single-pass version took ~600 ms on 500k rows.

## Model routing record (update counts at each close-out)
| Tier | Done first try | Escalated up | Notes |
|---|---|---|---|
| haiku | 3 | 0 | tasks 1, 13, 14 |
| sonnet | 9 | 0 | task 11 needed one same-tier fix round (spec gap) |
| opus | 0 | 0 | |
<!-- If one tier escalates on 3 tasks in a row, the phase-runner escalates to the lead, who may raise that tier's
     starting complexity in .claude/skills/next-task/SKILL.md. If haiku passes everything, give it complexity 4 too. -->

## Open questions for the human (max 5; delete once answered)
