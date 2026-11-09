# Instructions for AI coding assistants (Claude Code, Cursor, Codex, Copilot...)

This repo is built task by task from a written plan. Follow this loop exactly; the owner has a
history of the project drifting away from the plan, and this file exists to stop that.

## Where the plan lives
- `.taskmaster/docs/prd.md` — goal, non-goals, success criteria, stack, decision log. Read Goal and Non-goals every session.
- `.taskmaster/tasks/tasks.json` — tasks, subtasks, status, dependencies, test strategy, work log. Source of truth.
- `.taskmaster/docs/parking-lot.md` — ideas that are NOT in the plan.
- `TASKS.md` — a human-readable checklist generated from tasks.json. Never edit by hand.

Helper (Python stdlib only), run from the repo root:
```
python .taskmaster/tasks.py status            # where are we
python .taskmaster/tasks.py next              # the one task to do now
python .taskmaster/tasks.py show 7            # full details of task 7 (or 7.2)
python .taskmaster/tasks.py set-status 7.2 in-progress|done|deferred|cancelled
python .taskmaster/tasks.py log 7.2 "plan: ..."   # timestamped note on a task
python .taskmaster/tasks.py add --help        # add a task
python .taskmaster/tasks.py validate          # after any manual edit of tasks.json
python .taskmaster/render_tasks_md.py         # refresh TASKS.md after status changes
```

## Every session
1. `git pull --ff-only`, then `python .taskmaster/tasks.py status`, and read the log of any in-progress task.
2. Tell the owner in 2–3 lines where things stand and what's next. Resume in-progress work before starting anything new.

## Work loop (one task at a time)
1. `tasks.py next`, then `tasks.py show <id>`. A task scored 7+ without subtasks: split it into 3–5 subtasks first.
2. Read the code the task touches. Log your plan: `tasks.py log <id> "plan: files X, Y; approach ..."`.
3. `tasks.py set-status <id> in-progress`, build it.
4. Log what worked, what failed and why, and any non-obvious decision.
5. Run the task's testStrategy for real. Not done until it passes.
6. Drift check (below), `set-status <id> done`, `render_tasks_md.py`, commit with the id: `task 7.2: nutrition maths`.
7. Push at the end of a session.

## Drift rules
- Only work on the task `next` returned. If something else seems more important, say so; let the owner decide.
- New idea mid-task (yours or the owner's) → add a dated line to `parking-lot.md`, keep going.
- Changing what is being built → update the PRD decision log first, then the tasks, then the code.
- Stop and say so if you are editing files the task didn't mention, adding a library the PRD didn't choose,
  rewriting finished work, or the task has doubled in size. Then choose: log as a deviation, split into a new task, or park it.
- Never reword a `done` task; add a corrective subtask instead. Cancel tasks, never delete them.

## Project facts that are easy to get wrong
- It's a web app/PWA. No Expo, no native apps (PRD non-goal).
- Food data is local: `backend/food_data/` (tables `foods`, `food_portions`, SQL function `search_foods`). Values are
  per 100 g. Do not add paid food APIs. Do not use the Open Food Facts search API for typeahead; live OFF is only
  for barcode misses (one call per real scan).
- `foods`/`food_portions` are owned by `backend/food_data/schema.sql`, not Alembic.
- Diary entries store a nutrition snapshot; never recompute old days from current food data.
- Hidden features (AI scan, coach, badges, meal plans, recipes, water, measurements, export, exercise) stay hidden.
- Production: `/var/www/fittrack-plus` on an Ubuntu VPS, service `fittrack-backend`, nginx proxies `/api/` → `127.0.0.1:8000`.
  Deploy = `sudo bash scripts/vps/deploy.sh`. Frontend is built with `VITE_API_URL=/api`.
- Tests: `cd backend && TEST_DATABASE_URL=postgresql://fittrack:fittrack@localhost:5432/fittrack_test pytest -q`.
