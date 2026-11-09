"""Import USDA FoodData Central "Foundation Foods" and "SR Legacy" CSV downloads.

Usage:
    python -m food_data.import_usda /path/to/FoodData_Central_foundation_food_csv_2026-10-29
    python -m food_data.import_usda /path/to/FoodData_Central_sr_legacy_food_csv_2018-04

The folder (or .zip) must contain food.csv, food_nutrient.csv and, optionally,
food_portion.csv + measure_unit.csv. Data is public domain (CC0).
"""

from __future__ import annotations

import argparse
import csv
import io
import sys
import zipfile
from collections import defaultdict
from pathlib import Path

from .common import FoodRow, apply_schema, connect, to_float, upsert_foods

# FDC nutrient ids
ENERGY_KCAL = 1008
ENERGY_ATWATER_GENERAL = 2047
ENERGY_ATWATER_SPECIFIC = 2048
PROTEIN = 1003
FAT = 1004
CARBS = 1005
FIBER = 1079
SUGARS_NLEA = 2000
SUGARS_TOTAL = 1063
SODIUM = 1093
WANTED = {ENERGY_KCAL, ENERGY_ATWATER_GENERAL, ENERGY_ATWATER_SPECIFIC, PROTEIN, FAT,
          CARBS, FIBER, SUGARS_NLEA, SUGARS_TOTAL, SODIUM}

DATA_TYPES = {"foundation_food": "usda_foundation", "sr_legacy_food": "usda_sr"}

csv.field_size_limit(2**31 - 1)


class Source:
    """Read CSVs from either an extracted folder or the original zip."""

    def __init__(self, path: Path):
        self.path = path
        self.zip = zipfile.ZipFile(path) if path.suffix == ".zip" else None

    def open(self, name: str):
        if self.zip:
            matches = [n for n in self.zip.namelist() if n.endswith("/" + name) or n == name]
            if not matches:
                return None
            return io.TextIOWrapper(self.zip.open(matches[0]), encoding="utf-8-sig", newline="")
        direct = self.path / name
        if direct.exists():
            return open(direct, encoding="utf-8-sig", newline="")
        nested = list(self.path.glob(f"*/{name}"))
        return open(nested[0], encoding="utf-8-sig", newline="") if nested else None

    def rows(self, name: str):
        f = self.open(name)
        if f is None:
            return None
        return csv.DictReader(f)


def load(path: Path):
    src = Source(path)
    foods_csv = src.rows("food.csv")
    if foods_csv is None:
        raise SystemExit(f"food.csv not found in {path}")

    foods: dict[str, tuple[str, str]] = {}
    for r in foods_csv:
        kind = DATA_TYPES.get(r.get("data_type", ""))
        if kind:
            foods[r["fdc_id"]] = (kind, r["description"])
    if not foods:
        raise SystemExit("No foundation_food / sr_legacy_food rows in food.csv")

    nutrients: dict[str, dict[int, float]] = defaultdict(dict)
    fn = src.rows("food_nutrient.csv")
    if fn is None:
        raise SystemExit(f"food_nutrient.csv not found in {path}")
    for r in fn:
        fid = r["fdc_id"]
        if fid not in foods:
            continue
        try:
            nid = int(r["nutrient_id"])
        except (TypeError, ValueError):
            continue
        if nid in WANTED:
            amt = to_float(r.get("amount"))
            if amt is not None:
                nutrients[fid][nid] = amt

    units = {}
    mu = src.rows("measure_unit.csv")
    if mu is not None:
        units = {r["id"]: r["name"] for r in mu}

    portions: dict[str, list[tuple[int, str, float]]] = defaultdict(list)
    fp = src.rows("food_portion.csv")
    if fp is not None:
        for r in fp:
            fid = r["fdc_id"]
            if fid not in foods:
                continue
            grams = to_float(r.get("gram_weight"))
            if not grams or grams <= 0:
                continue
            amount = to_float(r.get("amount"))
            unit = units.get(r.get("measure_unit_id", ""), "")
            if unit in ("undetermined", "unknown"):
                unit = ""
            desc = (r.get("modifier") or "").strip() or (r.get("portion_description") or "").strip()
            if desc.lower() == unit.lower():
                desc = ""
            label = " ".join(x for x in (f"{amount:g}" if amount else "", unit, desc) if x)
            seq = int(to_float(r.get("seq_num")) or 0)
            portions[fid].append((seq, label, grams))

    for fid, (kind, name) in foods.items():
        n = nutrients.get(fid, {})
        p, f, c = n.get(PROTEIN, 0.0), n.get(FAT, 0.0), n.get(CARBS, 0.0)
        kcal = n.get(ENERGY_KCAL) or n.get(ENERGY_ATWATER_GENERAL) or n.get(ENERGY_ATWATER_SPECIFIC)
        if kcal is None:
            if not (p or f or c):
                continue  # no usable data
            kcal = 4 * p + 4 * c + 9 * f
        ps = [(label, g) for _, label, g in sorted(portions.get(fid, []))]
        yield FoodRow(
            source=kind,
            source_id=fid,
            name=name,
            kcal_100g=kcal,
            protein_100g=p,
            carbs_100g=c,
            fat_100g=f,
            fiber_100g=n.get(FIBER),
            sugar_100g=n.get(SUGARS_NLEA, n.get(SUGARS_TOTAL)),
            sodium_mg_100g=n.get(SODIUM),
            serving_g=ps[0][1] if ps else None,
            serving_label=ps[0][0] if ps else None,
            portions=ps,
        )


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("paths", nargs="+", type=Path, help="FDC CSV folder(s) or zip(s)")
    ap.add_argument("--database-url")
    args = ap.parse_args(argv)
    conn = connect(args.database_url)
    apply_schema(conn)
    for path in args.paths:
        stats = upsert_foods(conn, load(path))
        print(f"[usda] {path.name}: {stats}")


if __name__ == "__main__":
    main()
