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
- Phase 0 - Foundation. Done: 1 (repo cleanup), 5 (earlier).
- Next: task 2 (local dev) in-progress, unblocked: owner chose local PG17 over Docker (see decision log).
- fittrack_db holds old app tables (users, food_entries, water_logs...); task 4 Alembic must baseline them.
- Last session: 2026-11-08, phase 0 run stopped at task 2.
- Manual checks waiting: 0 (`.taskmaster/docs/manual-checks.md`).

## Facts (stable, max 15 lines)
- Dev machine: Windows; shell scripts run in Git Bash; venv python at `backend/venv/Scripts/python.exe`.
- Local db: native PG17 (no Docker; superuser `postgres` needs no password locally), `postgresql://fittrack:fittrack@localhost:5432/fittrack_db`; tests use `.../fittrack_test`.
- VPS: Ubuntu, app at `/var/www/fittrack-plus`, user `fittrack`, service `fittrack-backend`, nginx `/api/` -> :8000.
- Domain: _(fill in at task 17.1)_ · SSH target: _(fill in; also in `.claude/deploy-target`)_
- Food data: local Postgres (`foods`, `food_portions`, `search_foods()`), per 100 g. Live Open Food Facts calls only on barcode misses.
- Diary entries store a nutrition snapshot; never recompute past days.
- Hidden (non-goal) features stay hidden: AI scan, coach, badges, meal plans, recipes, water, measurements, export, exercise.
- Users: the owner + his girlfriend. Registration gets closed after both sign up (task 19).

## Decisions since the PRD (max 8 lines, newest first; full text in prd.md decision log)
- 2026-11-08: Local dev on native PG17, not Docker. dev_setup.sh skips docker if missing.
- 2026-11-08: Lead (main, Opus) launches a phase-runner (Sonnet, medium) per phase; it routes tasks to builders
  haiku -> sonnet -> opus and escalates to the lead only when stuck. Manual checks are batched per phase.

## Learned / gotchas (max 15 lines, newest first)
- CNF 2026 column names are unverified: run `python -m food_data.import_cnf <dir> --inspect` before importing (task 17.4).
- `backend/requirements.txt` was UTF-16; it's now UTF-8. Keep it UTF-8 (Windows editors can silently switch it back).
- `search_foods()` must stay two-stage (prefix candidates, then ranking); a single-pass version took ~600 ms on 500k rows.

## Model routing record (update counts at each close-out)
| Tier | Done first try | Escalated up | Notes |
|---|---|---|---|
| haiku | 1 | 0 | task 1 |
| sonnet | 0 | 0 | |
| opus | 0 | 0 | |
<!-- If one tier escalates on 3 tasks in a row, the phase-runner escalates to the lead, who may raise that tier's
     starting complexity in .claude/skills/next-task/SKILL.md. If haiku passes everything, give it complexity 4 too. -->

## Open questions for the human (max 5; delete once answered)
- What domain/subdomain will the app use? (needed for task 17.1)
- Is there an old FitTrack+ install on the VPS with real data worth keeping? (task 17.2)
