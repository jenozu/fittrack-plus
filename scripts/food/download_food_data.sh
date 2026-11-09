#!/usr/bin/env bash
# Download the free food databases FitTrack+ imports.
#
#   bash scripts/food/download_food_data.sh [target_dir]     (default: /var/lib/fittrack/fooddata)
#
# Safe to re-run: finished downloads are skipped, half-finished ones resume.
# Needs ~1.5 GB free. Override any URL with an env var, e.g. USDA_FOUNDATION_URL=... when USDA
# publishes a newer release (check https://fdc.nal.usda.gov/download-datasets).
set -euo pipefail

DIR="${1:-/var/lib/fittrack/fooddata}"
USDA_FOUNDATION_URL="${USDA_FOUNDATION_URL:-https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_foundation_food_csv_2026-10-29.zip}"
USDA_SR_URL="${USDA_SR_URL:-https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip}"
CNF_URL="${CNF_URL:-https://open.canada.ca/data/dataset/1b6139bd-ed7e-4043-bc28-ff00e10f3109/resource/019f2a90-e3a9-489d-b6e1-f74f4ba1d006/download/cnf_fcen_all-files-data_2026.zip}"
OFF_URL="${OFF_URL:-https://static.openfoodfacts.org/data/en.openfoodfacts.org.products.csv.gz}"

mkdir -p "$DIR"
cd "$DIR"

need() { command -v "$1" >/dev/null || { echo "Missing '$1'. Install it (sudo apt install $2)." >&2; exit 1; }; }
need curl curl
need unzip unzip

fetch() { # url filename
  local url="$1" out="$2"
  if [[ -f "$out" && ! -f "$out.part" ]]; then
    echo "  ✓ $out already downloaded"
    return
  fi
  echo "  ↓ $out"
  touch "$out.part"
  curl --fail --location --retry 5 --retry-delay 10 --continue-at - \
       --user-agent "FitTrackPlus-importer/1.0" -o "$out" "$url"
  rm -f "$out.part"
}

echo "Downloading into $DIR"
fetch "$USDA_FOUNDATION_URL" usda_foundation.zip
fetch "$USDA_SR_URL"         usda_sr_legacy.zip
fetch "$CNF_URL"             cnf.zip
fetch "$OFF_URL"             openfoodfacts.csv.gz

echo "Unpacking"
rm -rf cnf && mkdir -p cnf && unzip -q -o cnf.zip -d cnf
# USDA zips are read directly by the importer; no need to unpack.

echo "Checking"
unzip -l usda_foundation.zip | grep -q "food_nutrient.csv" || { echo "usda_foundation.zip looks wrong" >&2; exit 1; }
unzip -l usda_sr_legacy.zip  | grep -q "food_nutrient.csv" || { echo "usda_sr_legacy.zip looks wrong" >&2; exit 1; }
find cnf -iname "*nutrient*amount*.csv" | grep -q . || { echo "CNF zip has no nutrient amount file" >&2; exit 1; }
gzip -t openfoodfacts.csv.gz || { echo "openfoodfacts.csv.gz is corrupt: delete it and re-run" >&2; exit 1; }

du -sh "$DIR"/* | sed 's/^/  /'
echo "Done. Next: bash scripts/food/import_food_data.sh $DIR"
