"""Food lookups the API calls: search, get by id, barcode (local first, then live Open Food Facts).

Works with a SQLAlchemy Session or Connection, so the FastAPI routers can pass `db` straight in.

    from food_data.service import search_foods, get_food, lookup_barcode
    results = search_foods(db, "greek yogurt", limit=20, user_id=current_user.id)
"""

from __future__ import annotations

import os
from typing import Optional

import requests
from sqlalchemy import text

from .common import assess_quality, normalize_barcode
from .import_off import to_row

OFF_PRODUCT_URL = "https://world.openfoodfacts.org/api/v2/product/{code}.json"
OFF_FIELDS = ("code,product_name,generic_name,brands,nutriments,serving_size,"
              "serving_quantity,unique_scans_n")
# Open Food Facts asks apps to identify themselves: "AppName/Version (contact)".
USER_AGENT = os.getenv("OFF_USER_AGENT", "FitTrackPlus/1.0 (personal nutrition tracker)")

FOOD_COLUMNS = ("id, source, name, brand, barcode, kcal_100g, protein_100g, carbs_100g, fat_100g, "
                "fiber_100g, sugar_100g, sodium_mg_100g, serving_g, serving_label, quality")


def _with_portions(db, rows) -> list[dict]:
    foods = [dict(r._mapping) for r in rows]
    if not foods:
        return []
    ids = [f["id"] for f in foods]
    portions = db.execute(
        text("SELECT food_id, label, grams FROM food_portions WHERE food_id = ANY(:ids) ORDER BY food_id, seq"),
        {"ids": ids},
    ).fetchall()
    by_food: dict[int, list] = {}
    for p in portions:
        by_food.setdefault(p.food_id, []).append({"label": p.label, "grams": p.grams})
    for f in foods:
        f["portions"] = [{"label": "100 g", "grams": 100.0}] + by_food.get(f["id"], [])
    return foods


def search_foods(db, q: str, limit: int = 20, user_id: Optional[int] = None) -> list[dict]:
    q = (q or "").strip()
    if len(q) < 2:
        return []
    rows = db.execute(
        text(
            f"SELECT {', '.join('f.' + c.strip() for c in FOOD_COLUMNS.split(','))}, s.score "
            "FROM search_foods(:q, :lim, :uid) s JOIN foods f ON f.id = s.id ORDER BY s.score DESC"
        ),
        {"q": q, "lim": limit, "uid": user_id},
    ).fetchall()
    return _with_portions(db, rows)


def get_food(db, food_id: int) -> Optional[dict]:
    rows = db.execute(text(f"SELECT {FOOD_COLUMNS} FROM foods WHERE id = :id"), {"id": food_id}).fetchall()
    found = _with_portions(db, rows)
    return found[0] if found else None


def fetch_off_product(barcode: str, timeout: float = 8.0) -> Optional[dict]:
    """One live API call per real scan, as Open Food Facts asks. Returns the raw product or None."""
    try:
        resp = requests.get(
            OFF_PRODUCT_URL.format(code=barcode),
            params={"fields": OFF_FIELDS},
            headers={"User-Agent": USER_AGENT},
            timeout=timeout,
        )
    except requests.RequestException:
        return None
    if resp.status_code != 200:
        return None
    data = resp.json()
    if data.get("status") != 1 or not data.get("product"):
        return None
    return data["product"]


def _cache_off_product(db, product: dict) -> Optional[int]:
    n = product.get("nutriments") or {}
    row = to_row(
        product.get("code"),
        (product.get("product_name") or product.get("generic_name") or "").strip() or None,
        ((product.get("brands") or "").split(",")[0].strip() or None),
        n.get("energy-kcal_100g"), n.get("energy_100g"),
        n.get("proteins_100g"), n.get("carbohydrates_100g"), n.get("fat_100g"),
        n.get("fiber_100g"), n.get("sugars_100g"), n.get("sodium_100g"),
        product.get("serving_size"), product.get("serving_quantity"), product.get("unique_scans_n"),
    )
    if row is None or not row.name:
        return None

    quality = assess_quality(row)
    if quality is None:
        return None
    food_id = db.execute(
        text(
            """
            INSERT INTO foods (source, source_id, name, brand, barcode, kcal_100g, protein_100g, carbs_100g,
                               fat_100g, fiber_100g, sugar_100g, sodium_mg_100g, serving_g, serving_label,
                               popularity, quality)
            VALUES (:source, :source_id, :name, :brand, :barcode, :kcal, :p, :c, :f, :fib, :sug, :sod,
                    :sg, :sl, :pop, :q)
            ON CONFLICT (source, source_id) DO UPDATE SET
                name = EXCLUDED.name, brand = EXCLUDED.brand, kcal_100g = EXCLUDED.kcal_100g,
                protein_100g = EXCLUDED.protein_100g, carbs_100g = EXCLUDED.carbs_100g,
                fat_100g = EXCLUDED.fat_100g, fiber_100g = EXCLUDED.fiber_100g,
                sugar_100g = EXCLUDED.sugar_100g, sodium_mg_100g = EXCLUDED.sodium_mg_100g,
                serving_g = EXCLUDED.serving_g, serving_label = EXCLUDED.serving_label,
                quality = EXCLUDED.quality, updated_at = now()
            RETURNING id
            """
        ),
        dict(source=row.source, source_id=row.source_id, name=row.name, brand=row.brand,
             barcode=row.barcode, kcal=row.kcal_100g, p=row.protein_100g, c=row.carbs_100g,
             f=row.fat_100g, fib=row.fiber_100g, sug=row.sugar_100g, sod=row.sodium_mg_100g,
             sg=row.serving_g, sl=row.serving_label, pop=row.popularity, q=quality),
    ).scalar_one()
    for seq, (label, grams) in enumerate(row.portions):
        db.execute(
            text("INSERT INTO food_portions (food_id, label, grams, seq) VALUES (:f, :l, :g, :s) "
                 "ON CONFLICT (food_id, label) DO UPDATE SET grams = EXCLUDED.grams"),
            {"f": food_id, "l": label, "g": grams, "s": seq},
        )
    db.commit()
    return food_id


def lookup_barcode(db, code: str, user_id: Optional[int] = None, fetch=fetch_off_product) -> Optional[dict]:
    """Local database first; on a miss, one live Open Food Facts call, cached for next time."""
    barcode = normalize_barcode(code)
    if not barcode:
        return None
    row = db.execute(
        text(
            f"SELECT {FOOD_COLUMNS} FROM foods WHERE barcode = :b "
            "AND (source <> 'custom' OR created_by_user = :uid) "
            "ORDER BY (source = 'custom') DESC, updated_at DESC LIMIT 1"
        ),
        {"b": barcode, "uid": user_id},
    ).fetchall()
    if row:
        return _with_portions(db, row)[0]
    # OFF accepts both 12-digit UPC and 13-digit EAN; try the form the scanner gave first.
    digits = "".join(ch for ch in str(code) if ch.isdigit())
    for candidate in dict.fromkeys([digits, barcode]):
        product = fetch(candidate)
        if product:
            product.setdefault("code", candidate)
            food_id = _cache_off_product(db, product)
            return get_food(db, food_id) if food_id else None
    return None
