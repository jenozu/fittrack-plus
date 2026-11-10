"""Import Health Canada's Canadian Nutrient File (CNF).

Usage:
    python -m food_data.import_cnf /path/to/cnf_folder_or_zip
    python -m food_data.import_cnf /path/to/cnf --inspect   # print file headers, import nothing

Works with the 2015 layout ("FOOD NAME.csv", "CONVERSION FACTOR.csv", ...) and the
2026 layout ("food_name.csv", "measure_weight_conversion.csv", ...). Column names
are matched loosely and nutrients are matched by name, so small layout changes
don't break it. If a required column can't be found, it stops and prints the
headers it saw: adjust the candidate lists below.

Licence: Open Government Licence - Canada. Attribute "Canadian Nutrient File, Health Canada".
"""

from __future__ import annotations

import argparse
import csv
import io
import re
import statistics
import sys
import zipfile
from collections import defaultdict
from pathlib import Path

from .common import FoodRow, apply_schema, connect, to_float, upsert_foods

csv.field_size_limit(2**31 - 1)


def _norm(s: str) -> str:
    return re.sub(r"[^a-z0-9]", "", s.lower())


FILES = {
    "food": ["foodname"],
    "amount": ["nutrientamount"],
    "nutrient": ["nutrientname"],
    "conversion": ["measureweightconversion", "conversionfactor"],
    "measure": ["measurename"],
}

COLS = {
    "food_id": ["foodid", "foodcode"],
    "food_desc": ["fooddescription", "fooddescriptione", "fooddescriptionen", "foodnameenglish",
                  "foodnameen", "foodname", "englishname", "description"],
    "nutrient_id": ["nutrientid", "nutrientcode"],
    "nutrient_value": ["nutrientvalue", "nutrientamount", "value", "amount"],
    "nutrient_name": ["nutrientname", "nutrientnamee", "nutrientnameen", "nutrientnameenglish", "name"],
    "nutrient_unit": ["nutrientunit", "unit", "unitofmeasure"],
    "nutrient_code": ["nutrientcode", "tagname"],
    "measure_id": ["measureid", "measurecode"],
    "measure_desc": ["measuredescriptionandunit", "measuredescriptionanduniten", "measuredescription", "measuredescriptione", "measuredescriptionen",
                     "measurenameenglish", "measurename", "description"],
    "conversion_value": ["measureweightconversion", "conversionfactorvalue", "conversionfactor", "measureweight",
                         "weightingrams", "gramweight", "weight", "conversionvalue", "value"],
}

# name test -> field, plus CNF numeric nutrient codes as a fallback
NUTRIENTS = [
    ("kcal", lambda n, u: "energy" in n and "kcal" in u.replace(" ", "").lower(), "208"),
    ("protein", lambda n, u: n.startswith("protein"), "203"),
    ("fat", lambda n, u: n.startswith("fat (total") or n in ("fat", "total fat", "fat, total"), "204"),
    ("carbs", lambda n, u: n.startswith("carbohydrate") and "total" in n, "205"),
    ("fiber", lambda n, u: n.startswith(("fibre", "fiber")) and ("dietary" in n or "total" in n), "291"),
    ("sugar", lambda n, u: n.startswith("sugars") and "total" in n, "269"),
    ("sodium", lambda n, u: n.startswith("sodium"), "307"),
]


class Bundle:
    def __init__(self, path: Path):
        self.path = path
        if path.suffix == ".zip":
            z = zipfile.ZipFile(path)
            self.files = {Path(n).stem: (lambda n=n: z.read(n)) for n in z.namelist() if n.lower().endswith(".csv")}
        else:
            self.files = {p.stem: (lambda p=p: p.read_bytes()) for p in path.rglob("*") if p.suffix.lower() == ".csv"}

    def reader(self, kind: str):
        wanted = FILES[kind]
        for stem, read in self.files.items():
            if _norm(stem) in wanted:
                raw = read()
                for enc in ("utf-8-sig", "cp1252"):
                    try:
                        text = raw.decode(enc)
                        break
                    except UnicodeDecodeError:
                        continue
                return stem, csv.DictReader(io.StringIO(text, newline=""))
        return None, None


def pick(headers, key, required=True):
    normed = {_norm(h): h for h in headers}
    for cand in COLS[key]:
        if cand in normed:
            return normed[cand]
    if key == "conversion_value":
        for h in headers:
            n = _norm(h)
            if not n.endswith("id") and any(w in n for w in ("conversion", "factor", "weight", "gram")):
                return h
    if required:
        raise SystemExit(f"[cnf] Could not find a '{key}' column. Headers seen: {list(headers)}")
    return None


def inspect(path: Path):
    b = Bundle(path)
    for kind in FILES:
        stem, r = b.reader(kind)
        print(f"{kind:10s} -> {stem!r}: {r.fieldnames if r else 'MISSING'}")


def load(path: Path):
    b = Bundle(path)

    _, fr = b.reader("food")
    if fr is None:
        raise SystemExit("[cnf] food name file not found")
    fid_col = pick(fr.fieldnames, "food_id")
    desc_col = pick(fr.fieldnames, "food_desc")
    foods = {r[fid_col].strip(): r[desc_col] for r in fr if r.get(fid_col)}

    _, nr = b.reader("nutrient")
    if nr is None:
        raise SystemExit("[cnf] nutrient name file not found")
    nid_col = pick(nr.fieldnames, "nutrient_id")
    nname_col = pick(nr.fieldnames, "nutrient_name")
    unit_col = pick(nr.fieldnames, "nutrient_unit", required=False)
    code_col = pick(nr.fieldnames, "nutrient_code", required=False)
    nutrient_rows = [
        (r[nid_col].strip(), (r.get(nname_col) or "").strip().lower(),
         (r.get(unit_col) or "") if unit_col else "", (r.get(code_col) or "").strip() if code_col else "")
        for r in nr
    ]
    nutrient_field: dict[str, str] = {}
    # Pass 1: the well-known CNF nutrient codes. Pass 2: match by name for anything left.
    for fieldname, test, code in NUTRIENTS:
        for nid, name, unit, ncode in nutrient_rows:
            if ncode == code or (not code_col and nid == code):
                nutrient_field[nid] = fieldname
                break
        else:
            for nid, name, unit, ncode in nutrient_rows:
                if nid not in nutrient_field and test(name, unit):
                    nutrient_field[nid] = fieldname
                    break
    missing = {n for n, _, _ in NUTRIENTS} - set(nutrient_field.values())
    if {"kcal", "protein", "fat", "carbs"} & missing:
        raise SystemExit(f"[cnf] could not identify core nutrients: {missing}")

    _, ar = b.reader("amount")
    if ar is None:
        raise SystemExit("[cnf] nutrient amount file not found")
    a_fid = pick(ar.fieldnames, "food_id")
    a_nid = pick(ar.fieldnames, "nutrient_id")
    a_val = pick(ar.fieldnames, "nutrient_value")
    values: dict[str, dict[str, float]] = defaultdict(dict)
    for r in ar:
        field = nutrient_field.get((r.get(a_nid) or "").strip())
        if field:
            v = to_float(r.get(a_val))
            if v is not None:
                values[(r.get(a_fid) or "").strip()][field] = v

    measures = {}
    _, mr = b.reader("measure")
    if mr is not None:
        m_id = pick(mr.fieldnames, "measure_id")
        m_desc = pick(mr.fieldnames, "measure_desc")
        measures = {r[m_id].strip(): r[m_desc] for r in mr}

    portions: dict[str, list[tuple[str, float]]] = defaultdict(list)
    stem, cr = b.reader("conversion")
    if cr is not None and measures:
        c_fid = pick(cr.fieldnames, "food_id")
        c_mid = pick(cr.fieldnames, "measure_id")
        c_val = pick(cr.fieldnames, "conversion_value")
        raw = [(r[c_fid].strip(), r[c_mid].strip(), to_float(r.get(c_val))) for r in cr]
        raw = [x for x in raw if x[2] and x[2] > 0]
        # 2015 stores a factor relative to 100 g (1 cup milk = 2.58); a grams column
        # would have a much larger median. Decide once per file.
        is_factor = "factor" in _norm(c_val) or (raw and statistics.median(x[2] for x in raw) < 6)
        print(f"[cnf] {stem}: column '{c_val}' treated as {'factor x100 g' if is_factor else 'grams'}")
        for fid, mid, v in raw:
            label = measures.get(mid)
            if label:
                portions[fid].append((label, v * 100 if is_factor else v))

    for fid, desc in foods.items():
        n = values.get(fid)
        if not n or "kcal" not in n:
            continue
        ps = portions.get(fid, [])
        yield FoodRow(
            source="cnf",
            source_id=fid,
            name=desc,
            kcal_100g=n["kcal"],
            protein_100g=n.get("protein", 0.0),
            carbs_100g=n.get("carbs", 0.0),
            fat_100g=n.get("fat", 0.0),
            fiber_100g=n.get("fiber"),
            sugar_100g=n.get("sugar"),
            sodium_mg_100g=n.get("sodium"),
            serving_g=ps[0][1] if ps else None,
            serving_label=ps[0][0] if ps else None,
            portions=ps,
        )


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("path", type=Path)
    ap.add_argument("--inspect", action="store_true")
    ap.add_argument("--database-url")
    args = ap.parse_args(argv)
    if args.inspect:
        inspect(args.path)
        return
    conn = connect(args.database_url)
    apply_schema(conn)
    print(f"[cnf] {upsert_foods(conn, load(args.path))}")


if __name__ == "__main__":
    main()
