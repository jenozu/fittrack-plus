# FitTrack+ — Claude Code instructions

@AGENTS.md

---

## How Claude Code works on this repo: lead → phase-runner → builders

The plan loop in AGENTS.md above still applies, but in Claude Code the work is split by role.

**Which role am I?**
- **A builder, verifier or reviewer subagent:** follow your agent file. It overrides the AGENTS.md work loop
  (you don't mark tasks done, commit or push). Ignore the rest of this section.
- **The phase-runner subagent:** follow your agent file and the preloaded `next-task` procedure.
- **The main session: you are the lead.** Run `/run-phase` and stay out of the details. Don't read task logs,
  diffs or builder reports while a phase runs. You act only on the phase-runner's final report:
  COMPLETE (summarise for the human), PARTIAL (relaunch), ESCALATE (diagnose and unblock), HUMAN NEEDED (pass it on).
  Recommended: run the lead on Opus. It does little, but its decisions are the hard ones.

**The team** (`.claude/agents/`):

| Agent | Model | Role |
|---|---|---|
| phase-runner | sonnet, medium effort | Sub-orchestrator: runs a whole phase, routes/verifies/escalates/commits, reports once |
| builder-haiku | haiku | Complexity 1–3 with exact files/steps |
| builder-sonnet | sonnet | Complexity 4–6, auth/migrations/scripts, or after haiku failed |
| builder-opus | opus | Complexity 7+, splitting big tasks, or after sonnet failed |
| verifier | haiku | After every builder DONE: runs the testStrategy independently, read-only |
| reviewer | sonnet | Risky diffs (security, migrations, scripts/vps, tasks 17/18), read-only |

**Escalation:**
- Inside a task (phase-runner): builder-haiku → builder-sonnet → builder-opus, one rung per failure, each logged.
- Out of the phase (phase-runner → lead): when opus fails, there's a scope/PRD change, something destructive,
  or a human-only step. The lead fixes the plan, unblocks with builder-opus, or asks the human.
- Manual checks (phone, browser) don't stop a phase. They collect in `.taskmaster/docs/manual-checks.md` for the
  human to run at the end of the phase.

Nesting is capped at one level below the phase-runner (`CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=2`); builders,
verifier and reviewer can't spawn agents.

**Skills:** `/run-phase [n | ids]` (lead) · `next-task` (phase-runner's per-task procedure; `/next-task <id>` runs
one task by hand) · `/deploy [ssh-target]` (only when asked) · `db-migration` · `mobile-ui-check`.
**Rules:** `.claude/rules/`: `rules.md` and `memory.md` always load; backend, frontend, food-data and scripts rules load with matching files.

## Keeping cost down
- Hand off a whole phase per launch, not a task. The lead's context should only grow by one report per phase.
- `memory.md` is updated once per phase run, not per task. Details live in `tasks.py log`.
- Don't paste task JSON or file contents into prompts; pass ids and failure notes.
- Run `/compact` in the lead between phases in long sessions.
