---
paths:
  - "scripts/**"
---

# Script rules

- `scripts/vps/*` run as root on the production server. Every change gets the reviewer subagent.
- Bash: `#!/usr/bin/env bash` + `set -euo pipefail`, quote every variable, idempotent (safe to run twice),
  print what each step does, fail with a clear message. `shellcheck -S warning` must be clean.
- Never put secrets in scripts; generate them on the server (`openssl rand -hex 32`) into `backend/.env` (mode 600).
- `scripts/local/*` must work in Git Bash on Windows (handle `venv/Scripts` vs `venv/bin`).
- Keep the header comment (what it does, how to run it) accurate when you change a script.
