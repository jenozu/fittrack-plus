"""Regenerate TASKS.md (human-readable checklist) from .taskmaster/tasks/tasks.json.
Run from the repo root:  python .taskmaster/render_tasks_md.py"""
import json
from pathlib import Path

root = Path(__file__).resolve().parent.parent
tasks = json.loads((root / ".taskmaster/tasks/tasks.json").read_text(encoding="utf-8"))["master"]["tasks"]
box = {"done": "[x]", "cancelled": "[~]"}
phase_of = {1: 0, 2: 0, 3: 0, 4: 0, 5: 1, 6: 1, 7: 1, 8: 1, 9: 1, 10: 2, 11: 2, 12: 2, 13: 2, 14: 2, 15: 2,
            16: 3, 17: 3, 18: 3, 19: 4}
phases = ["Phase 0 - Foundation", "Phase 1 - Food database in the API", "Phase 2 - Core loop on a phone",
          "Phase 3 - Ship", "Phase 4 - Live with it"]
out = ["# FitTrack+ task checklist", "",
       "Generated from `.taskmaster/tasks/tasks.json` (the source of truth). Regenerate with",
       "`python .taskmaster/render_tasks_md.py`. Work the tasks in order; each one says how to test it.", ""]
done = sum(t["status"] == "done" for t in tasks)
out.append(f"**Progress: {done}/{len(tasks)} tasks done.**")
current = None
for t in tasks:
    p = phase_of.get(t["id"], 4)
    if p != current:
        current = p
        out += ["", f"## {phases[p]}", ""]
    deps = f" _(after {', '.join(map(str, t['dependencies']))})_" if t["dependencies"] else ""
    out.append(f"- {box.get(t['status'], '[ ]')} **{t['id']}. {t['title']}**{deps}  ")
    out.append(f"  {t['description']}  ")
    out.append(f"  _Test:_ {' '.join(t['testStrategy'].split())}")
    for s in t.get("subtasks", []):
        out.append(f"  - {box.get(s['status'], '[ ]')} {t['id']}.{s['id']} {s['title']}")
(root / "TASKS.md").write_text("\n".join(out) + "\n", encoding="utf-8")
print(f"wrote TASKS.md ({len(tasks)} tasks)")
