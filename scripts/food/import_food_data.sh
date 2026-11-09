#!/usr/bin/env bash
# Load the downloaded food databases into Postgres (the `foods` and `food_portions` tables).
#
#   bash scripts/food/import_food_data.sh [data_dir] [--skip-off]
#
# Reads DATABASE_URL from the environment or backend/.env. Safe to re-run: rows are
# upserted, so running it again after a new release just refreshes the data.
# Takes roughly 10-30 minutes on a small VPS, almost all of it the Open Food Facts step.
# Extra args after the data dir are passed to the OFF importer, e.g. --min-scans 1
set -euo pipefail

REPO="$(cd "$(dirname "$0")/../.." && pwd)"
DIR="${1:-/var/lib/fittrack/fooddata}"
shift || true
SKIP_OFF=0
OFF_ARGS=()
for a in "$@"; do
  if [[ "$a" == "--skip-off" ]]; then SKIP_OFF=1; else OFF_ARGS+=("$a"); fi
done

cd "$REPO/backend"
if [[ -f venv/bin/activate ]]; then source venv/bin/activate; fi
python -c "import duckdb, psycopg2" 2>/dev/null || { echo "Run: pip install -r backend/requirements.txt" >&2; exit 1; }

step() { echo; echo "== $* =="; }

step "USDA Foundation Foods"
python -m food_data.import_usda "$DIR/usda_foundation.zip"
step "USDA SR Legacy"
python -m food_data.import_usda "$DIR/usda_sr_legacy.zip"
step "Canadian Nutrient File"
python -m food_data.import_cnf "$DIR/cnf"
if [[ $SKIP_OFF -eq 0 ]]; then
  step "Open Food Facts (Canada + US products)"
  python -m food_data.import_off "$DIR/openfoodfacts.csv.gz" "${OFF_ARGS[@]}"
fi

step "Summary"
python - <<'PY'
from food_data.common import connect
conn = connect()
cur = conn.cursor()
cur.execute("ANALYZE foods; ANALYZE food_portions;")
cur.execute("SELECT source, count(*) FROM foods GROUP BY source ORDER BY 2 DESC")
for source, n in cur.fetchall():
    print(f"  {source:16s} {n:>9,}")
for q in ("banana", "chicken breast", "greek yogurt", "kraft dinner"):
    cur.execute("SELECT f.name, f.brand FROM search_foods(%s, 3) s JOIN foods f ON f.id = s.id ORDER BY s.score DESC", (q,))
    print(f"  '{q}': " + " | ".join(f"{n}{' (' + b + ')' if b else ''}" for n, b in cur.fetchall()))
PY
echo; echo "Food database ready."
