"""Import packaged/branded products from the Open Food Facts nightly CSV export.

Usage:
    python -m food_data.import_off /path/to/en.openfoodfacts.org.products.csv.gz
    python -m food_data.import_off FILE --countries canada,united-states --min-scans 0

The full export is ~0.9 GB compressed / ~9 GB uncompressed. DuckDB streams it and
keeps only products sold in the chosen countries that have usable nutrition data,
so the VPS never needs the whole thing in memory or in Postgres.

Licence: Open Database License (ODbL). Attribute "Open Food Facts" in the app.
"""

from __future__ import annotations

import argparse
import tempfile
from pathlib import Path

from .common import FoodRow, apply_schema, connect, normalize_barcode, to_float, upsert_foods

FILTER_SQL = """
SELECT
    code,
    coalesce(nullif(trim(product_name), ''), nullif(trim(generic_name), '')) AS name,
    nullif(trim(split_part(brands, ',', 1)), '')                            AS brand,
    "energy-kcal_100g" AS kcal, "energy_100g" AS kj,
    proteins_100g AS protein, carbohydrates_100g AS carbs, fat_100g AS fat,
    fiber_100g AS fiber, sugars_100g AS sugar, sodium_100g AS sodium,
    serving_size, serving_quantity, unique_scans_n
FROM read_csv(
    '{csv_path}', delim = '\t', header = true, quote = '', escape = '', all_varchar = true,
    ignore_errors = true, max_line_size = 2000000, parallel = false, strict_mode = false
)
WHERE ({country_filter})
  AND coalesce(nullif(trim(product_name), ''), nullif(trim(generic_name), '')) IS NOT NULL
  AND (try_cast("energy-kcal_100g" AS DOUBLE) IS NOT NULL OR try_cast("energy_100g" AS DOUBLE) IS NOT NULL)
  AND coalesce(try_cast(unique_scans_n AS INTEGER), 0) >= {min_scans}
"""


def load(csv_path: Path, countries: list[str], min_scans: int, memory_limit: str):
    import duckdb

    con = duckdb.connect()
    con.execute(f"SET memory_limit = '{memory_limit}'")
    con.execute("SET preserve_insertion_order = false")
    con.execute("SET threads = 1")  # big CSV lines x threads blew a 2 GB limit
    country_filter = " OR ".join(
        f"countries_tags LIKE '%en:{c.strip()}%'" for c in countries if c.strip()
    ) or "TRUE"
    sql = FILTER_SQL.format(
        csv_path=str(csv_path).replace("'", "''"), country_filter=country_filter, min_scans=int(min_scans)
    )

    # Write the filtered subset to a small parquet first: a crash halfway through the
    # Postgres load then doesn't mean re-reading 9 GB.
    with tempfile.TemporaryDirectory() as tmp:
        out = Path(tmp) / "off_subset.parquet"
        con.execute(f"COPY ({sql}) TO '{out}' (FORMAT parquet)")
        n = con.execute("SELECT count(*) FROM read_parquet(?)", [str(out)]).fetchone()[0]
        print(f"[off] {n} candidate products after country/nutrition filter")
        cur = con.execute("SELECT * FROM read_parquet(?)", [str(out)])
        while True:
            chunk = cur.fetchmany(10000)
            if not chunk:
                break
            for rec in chunk:
                row = to_row(*rec)
                if row:
                    yield row


def to_row(code, name, brand, kcal, kj, protein, carbs, fat, fiber, sugar, sodium,
           serving_size, serving_quantity, scans):
    barcode = normalize_barcode(code)
    if not barcode:
        return None
    k = to_float(kcal)
    if k is None:
        kj_v = to_float(kj)
        k = kj_v / 4.184 if kj_v is not None else None
    if k is None:
        return None
    sod = to_float(sodium)
    sg = to_float(serving_quantity)
    label = (serving_size or "").strip() or None
    portions = [(label, sg)] if label and sg and 0 < sg < 2000 else []
    return FoodRow(
        source="off",
        source_id=barcode,
        name=name,
        brand=brand,
        barcode=barcode,
        kcal_100g=k,
        protein_100g=to_float(protein) or 0.0,
        carbs_100g=to_float(carbs) or 0.0,
        fat_100g=to_float(fat) or 0.0,
        fiber_100g=to_float(fiber),
        sugar_100g=to_float(sugar),
        sodium_mg_100g=sod * 1000 if sod is not None else None,  # OFF stores grams
        serving_g=sg if portions else None,
        serving_label=label if portions else None,
        popularity=int(to_float(scans) or 0),
        portions=portions,
    )


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("csv", type=Path, help="en.openfoodfacts.org.products.csv(.gz)")
    ap.add_argument("--countries", default="canada,united-states",
                    help="comma-separated OFF country tags (default: canada,united-states). Use 'all' for everything")
    ap.add_argument("--min-scans", type=int, default=0, help="skip products scanned fewer times (shrinks the DB)")
    ap.add_argument("--memory-limit", default="1GB", help="DuckDB memory cap (keep below your VPS RAM)")
    ap.add_argument("--database-url")
    args = ap.parse_args(argv)
    countries = [] if args.countries == "all" else args.countries.split(",")
    conn = connect(args.database_url)
    apply_schema(conn)
    print(f"[off] {upsert_foods(conn, load(args.csv, countries, args.min_scans, args.memory_limit))}")


if __name__ == "__main__":
    main()
