---
name: deploy
description: Push main and deploy FitTrack+ to the VPS, then check it's healthy. Only when the user explicitly asks to deploy.
disable-model-invocation: true
argument-hint: "[ssh-target, e.g. me@fit.example.com]"
---

# Deploy to the VPS

SSH target: `$ARGUMENTS`. If empty, read it from `.claude/deploy-target` (one line, e.g. `me@fit.example.com`,
gitignored). If neither exists, ask the user once and offer to save it there.

1. Pre-flight (stop on any failure and report it):
   - `git status --short` is clean and the branch is `main`.
   - Backend tests pass: `cd backend && TEST_DATABASE_URL=postgresql://fittrack:fittrack@localhost:5432/fittrack_test pytest -q`
   - Frontend builds: `cd frontend && npm run build`
   - `python .taskmaster/tasks.py validate`
2. Show the user `git log --oneline origin/main..main` (what will ship) and get a yes.
3. `git push origin main`
4. `ssh <target> "sudo bash /var/www/fittrack-plus/scripts/vps/deploy.sh"`. It must end with "API healthy".
   On failure: `ssh <target> "sudo journalctl -u fittrack-backend -n 60 --no-pager"`, report the error, and suggest
   the fix as a new task. Don't hot-fix on the server.
5. Smoke test: `curl -fsS https://<domain>/api/health` and
   `curl -fsS -o /dev/null -w "%{http_code} %{time_total}s\n" https://<domain>/`.
6. Log it on the current task: `python .taskmaster/tasks.py log <id> "deployed <sha>"`.
