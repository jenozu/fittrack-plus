---
name: next-task
description: The per-task procedure for FitTrack+ - route one task from .taskmaster to the cheapest capable builder (haiku, then sonnet, then opus), verify with a different agent, escalate between builders on failure, then log, mark done and commit. Preloaded by the phase-runner, which loops it over a whole phase. A human can also run /next-task <id> for a single task.
argument-hint: "[task-id]"
---

# Run one task

Whoever runs this (normally the **phase-runner**) plans, routes, verifies and records. **You don't write app code**;
builders do. (Exception: a one-line fix the verifier pinpointed exactly, such as a wrong import. Log it.)
Task id: `$ARGUMENTS` if given, else `python .taskmaster/tasks.py next`.

## 1. Look at it
`python .taskmaster/tasks.py show <id>`: description, complexity, testStrategy, the end of the log. Don't open source files.

## 2. Split big tasks first
Complexity ≥ 7 with no subtasks: dispatch **builder-opus** with "Split task <id> into subtasks; do not build."
Then run each subtask through this procedure. The parent is done when all subtasks are done and its own
testStrategy passes (one verifier run on the parent).

## 3. Route to the cheapest capable builder
Starting tier from `complexity` (a subtask without one uses its parent's minus 2):

| Complexity | Start with | Start one tier higher when… |
|---|---|---|
| 1–3 | builder-haiku | the details don't name exact files and steps |
| 4–6 | builder-sonnet | it touches auth, migrations, or scripts/vps |
| 7+ (unsplit, or the split itself) | builder-opus | — |

Good haiku work: config edits, flags, a script, small UI tweaks, tests for existing code, lint fixes.
Not haiku: Alembic migrations, auth, search SQL, the barcode scanner, anything vague.

Dispatch with the Agent tool (`subagent_type` = builder name). Prompt, nothing more:
```
Task <id>: <title>. Build exactly this task, run its testStrategy, reply in your STATUS format.
[On escalation:] Previous attempt by <tier> failed: <its IF FAILED section, verbatim>. Don't repeat that approach.
[On verifier/reviewer failure:] Findings to fix: <their PROBLEMS/FINDINGS, verbatim>.
```

## 4. Verify with a different agent (always)
- Builder DONE → **verifier**: "Verify task <id>."
- Tasks 3, 4, 7.1, 17.x, 18, or a diff touching `backend/utils/security.py`, `backend/routers/auth.py`,
  `backend/alembic/`, `scripts/vps/` → after a verifier PASS, also **reviewer**: "Review task <id>."
- MANUAL CHECK NEEDED with everything automatic passing: don't stop. Append the steps to
  `.taskmaster/docs/manual-checks.md` (`## Task <id> - <title> (<date>)` + the steps) and treat the verdict as PASS.

## 5. Escalate between builders
Ladder: **haiku → sonnet → opus**. Move one rung up when the builder reports FAILED or BLOCKED, the verifier says
FAIL, the reviewer says CHANGES NEEDED, or the builder hit maxTurns (partial output).
- One rung per failure. Retry the same tier only for a mechanical failure (db not running, wrong test path):
  fix the environment and retry once.
- BLOCKED for a missing decision, credential or human-only step → don't climb the ladder; that's an escalation to the lead.
- Log every rung: `python .taskmaster/tasks.py log <id> "escalate <from>→<to>: <one-line reason>"`.
- Opus failed, or 2 escalations and still failing → stop this task and escalate to the lead (the phase-runner's
  rules say how). Run alone by a human, report to the human instead.

## 6. Close out (after PASS, plus APPROVE if reviewed). Keep it to these steps.
1. Drift check, in your head: does the result match the task and the PRD goal? If a builder's report shows a later
   task is now wrong, update that task's details with `tasks.py log <later-id> "note from <id>: ..."`.
   Scope changes are an escalation, not something to edit.
2. Builder IDEAS → one dated line each in `.taskmaster/docs/parking-lot.md`.
3. `python .taskmaster/tasks.py log <id> "done by <tier>[, escalated from <tier>]; verified"`
4. `python .taskmaster/tasks.py set-status <id> done && python .taskmaster/render_tasks_md.py`
5. `git add -A && git commit -q -m "task <id>: <short title>"` (add your environment's attribution lines if it
   asks for them). Don't push.
6. Keep a running tally for the end-of-phase report (tier, first-try or escalated). Don't update memory.md per
   task; the phase-runner does it once at the end.
7. No progress message. Go straight to the next task.
