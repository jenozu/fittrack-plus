#!/usr/bin/env bash
# One-time repo cleanup (task 1). Run from anywhere inside the repo, on a clean working tree.
# Windows: run in Git Bash (installed with Git for Windows).
#   bash scripts/local/cleanup_repo.sh
# Review with `git status`, then commit. Nothing is pushed.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "Commit or stash your changes first, so this cleanup is its own commit." >&2
  exit 1
fi

echo "1. Untrack the committed Python virtualenv and caches (files stay on your disk)"
git rm -r -q --cached backend/venv 2>/dev/null || true
git ls-files -z | grep -z '__pycache__/' | xargs -0 -r git rm -q --cached

echo "2. Remove the old top-level mockup (fake data; imports components that don't exist)"
for f in App.jsx App.css index.html; do
  [[ -f "$f" ]] && git rm -q "$f"
done

echo "3. Archive old planning docs and deploy scripts"
mkdir -p docs/archive/old-deploy
shopt -s nullglob
for f in *.md; do
  case "$f" in README.md|AGENTS.md|CLAUDE.md|TASKS.md) ;; *) git mv "$f" docs/archive/ ;; esac
done
for f in deploy-vps.sh deploy-to-vps.ps1 deploy-phase-1-2.ps1; do
  [[ -f "$f" ]] && git mv "$f" docs/archive/old-deploy/
done

echo "4. Harden .gitignore"
add_ignore() { grep -qxF "$1" .gitignore || echo "$1" >> .gitignore; }
add_ignore ""
add_ignore "# Added by cleanup_repo.sh"
add_ignore "backend/venv/"
add_ignore "**/__pycache__/"
add_ignore "frontend/dist/"
add_ignore "fooddata/"
add_ignore "*.dump"
git add .gitignore

echo
git status --short | head -30
echo "..."
echo "Done. Check it, then:  git commit -m \"task 1: repo cleanup\""
