#!/usr/bin/env bash
# Set up FitTrack+ for development on your computer (task 2).
# Needs: Python 3.11+, Node 20+, and Docker Desktop (for Postgres). Windows: run in Git Bash.
#   bash scripts/local/dev_setup.sh
# Then, in two terminals:
#   cd backend && source venv/bin/activate (Windows: source venv/Scripts/activate) && uvicorn main:app --reload
#   cd frontend && npm run dev
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"

echo "1. Postgres in Docker (port 5432, data kept in a Docker volume)"
docker compose -f scripts/local/docker-compose.dev.yml up -d
for _ in {1..30}; do
  docker compose -f scripts/local/docker-compose.dev.yml exec -T db pg_isready -U fittrack -q && break
  sleep 1
done

echo "2. backend/.env"
if [[ ! -f backend/.env ]]; then
  SECRET=$(python -c "import secrets; print(secrets.token_hex(32))" 2>/dev/null || python3 -c "import secrets; print(secrets.token_hex(32))")
  cat > backend/.env <<ENV
DATABASE_URL=postgresql://fittrack:fittrack@localhost:5432/fittrack_db
SECRET_KEY=$SECRET
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
OFF_USER_AGENT="FitTrackPlus-dev/1.0"
USDA_API_KEY=
OPENAI_API_KEY=
ENV
  echo "   created"
else
  echo "   exists, kept"
fi

echo "3. Python virtualenv"
PY=$(command -v python3 || command -v python)
[[ -d backend/venv ]] || "$PY" -m venv backend/venv
if [[ -f backend/venv/Scripts/python.exe ]]; then VPY=backend/venv/Scripts/python.exe; else VPY=backend/venv/bin/python; fi
"$VPY" -m pip install -q --upgrade pip
"$VPY" -m pip install -q -r backend/requirements.txt pytest

echo "4. Frontend packages"
(cd frontend && npm install --no-audit --no-fund --loglevel=error)

echo "5. Food tables"
(cd backend && "../$VPY" -c "from food_data.common import connect, apply_schema; apply_schema(connect())")

cat <<NEXT

Ready. Optional: load real food data locally (small sets only, ~2 minutes):
  bash scripts/food/download_food_data.sh ./fooddata
  bash scripts/food/import_food_data.sh ./fooddata --skip-off

Run the food tests:
  docker compose -f scripts/local/docker-compose.dev.yml exec -T db createdb -U fittrack fittrack_test || true
  cd backend && TEST_DATABASE_URL=postgresql://fittrack:fittrack@localhost:5432/fittrack_test ../$VPY -m pytest food_data -q
NEXT
