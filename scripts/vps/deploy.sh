#!/usr/bin/env bash
# Deploy the latest code from GitHub. Run on the VPS after every push:
#   sudo bash /var/www/fittrack-plus/scripts/vps/deploy.sh
# From your computer in one line:
#   ssh you@your-vps "sudo bash /var/www/fittrack-plus/scripts/vps/deploy.sh"
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/fittrack-plus}"
APP_USER="${APP_USER:-fittrack}"
BRANCH="${BRANCH:-main}"
as_app() { sudo -u "$APP_USER" bash -c "$1"; }

[[ $EUID -eq 0 ]] || { echo "Run with sudo." >&2; exit 1; }
cd "$APP_DIR"

echo "[1/6] Pulling $BRANCH"
BEFORE="$(git rev-parse --short HEAD)"
as_app "cd '$APP_DIR' && git fetch -q origin && git checkout -q '$BRANCH' && git pull -q --ff-only origin '$BRANCH'"
AFTER="$(git rev-parse --short HEAD)"
echo "      $BEFORE -> $AFTER"

echo "[2/6] Backend dependencies"
as_app "cd '$APP_DIR/backend' && venv/bin/pip install -q -r requirements.txt"

echo "[3/6] Database schema"
if [[ -f backend/alembic.ini ]]; then
  as_app "cd '$APP_DIR/backend' && venv/bin/alembic upgrade head"
else
  as_app "cd '$APP_DIR/backend' && venv/bin/python -c 'from database import Base, engine; import models; Base.metadata.create_all(bind=engine)'"
fi
# Food tables/search function (idempotent).
as_app "cd '$APP_DIR/backend' && venv/bin/python -c 'from food_data.common import connect, apply_schema; apply_schema(connect())'"

echo "[4/6] Frontend build"
as_app "cd '$APP_DIR/frontend' && npm ci --no-audit --no-fund --loglevel=error && VITE_API_URL=/api npm run build"

echo "[5/6] Restarting API"
systemctl restart fittrack-backend
for i in {1..20}; do
  if curl -fsS http://127.0.0.1:8000/health >/dev/null 2>&1; then break; fi
  sleep 1
  if [[ $i -eq 20 ]]; then
    echo "API did not come up. Last log lines:" >&2
    journalctl -u fittrack-backend -n 40 --no-pager >&2
    exit 1
  fi
done

echo "[6/6] Reloading nginx"
nginx -t -q && systemctl reload nginx

echo "Deployed $AFTER. API healthy."
