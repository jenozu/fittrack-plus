---
name: run-phase
description: Lead (main session) command to build a whole FitTrack+ phase hands-off. Launches the phase-runner subagent (Sonnet) and only gets involved when it reports COMPLETE, PARTIAL, ESCALATE or HUMAN NEEDED. Use when the human says "run phase 2", "build the next phase", "keep going", or /run-phase.
argument-hint: "[phase-number | task-ids e.g. 13,14,15]"
---

# Run a phase (you are the lead)

You are the main session. Your job here is cheap: launch, wait, decide only when asked. Do **not** read task
logs, diffs or source files while the phase-runner works, and don't relay its progress.

## 1. Launch
- Phase = `$ARGUMENTS`. If empty, use the phase named in memory.md "Now". If that's unclear, run
  `python .taskmaster/tasks.py status` once and take the phase of the next pending task
  (Phase 0: 1-4 · 1: 5-9 · 2: 10-15 · 3: 16-18 · 4: 19 · 5: 20-24 · 6: 25-27).
- Tell the human in one line: "Running phase <n> with the phase-runner; I'll come back when it's done or stuck."
- Dispatch the Agent tool with `subagent_type: phase-runner` and wait for it (don't background it):
  `Run phase <n> to completion.` (or `Run tasks <ids> to completion.`)

## 2. Read its one report and act
- **COMPLETE** → tell the human in ≤ 6 lines: tasks done, routing tally, and "N manual checks are waiting in
  `.taskmaster/docs/manual-checks.md`: run them on your phone/computer and tell me what failed." Suggest the next
  phase. Offer `git push` (don't push unasked).
- **PARTIAL** (turn limit) → relaunch a fresh phase-runner right away with the same prompt. No human message.
  If it comes back PARTIAL twice in a row with no new tasks done, treat it as ESCALATE.
- **ESCALATE** → this is where you earn your keep. Read only what the report points at
  (`tasks.py show <id>`, and the specific error). Then choose one:
  1. **Fix the plan:** the task is wrong or underspecified. Rewrite its details/testStrategy (add a corrective
     subtask with `tasks.py add --parent <id> ...` rather than editing done work), log why, relaunch the phase-runner.
  2. **Unblock it yourself:** dispatch builder-opus with your specific diagnosis and guidance (not just "try again").
     Verify with the verifier, close out with the next-task steps, then relaunch the phase-runner.
  3. **Scope change:** add a dated entry to the PRD decision log and update the affected tasks first; ask the
     human if it changes a goal or non-goal.
  4. **Ask the human** if it needs a decision, credentials, money or something only they can do.
  Two failed rescue attempts on the same task → ask the human. Don't keep spending.
- **HUMAN NEEDED** → pass the request on to the human clearly (exact commands/steps, what to send back).
  When they reply, record any fact in memory.md "Facts" and relaunch.

## 3. After manual checks come back
For each failure the human reports: `tasks.py add` a fix task (dependency on the original, complexity estimate,
exact repro steps in details), clear the passed sections from manual-checks.md, then `/run-phase` again
with those task ids.

Phases 3-4 are mostly hands-on (DNS, the VPS, phones). Expect HUMAN NEEDED there; that's normal.
