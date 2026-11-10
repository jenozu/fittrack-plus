"""Shared helpers for the food importers: DB connection, normalisation, bulk upsert."""

from __future__ import annotations

import io
import os
import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Iterable, Optional

import psycopg2
import psycopg2.extras

SCHEMA_PATH = Path(__file__).with_name("schema.sql")


@dataclass
class FoodRow:
    source: str
    source_id: str
    name: str
    kcal_100g: float
    protein_100g: float = 0.0
    carbs_100g: float = 0.0
    fat_100g: float = 0.0
    fiber_100g: Optional[float] = None
    sugar_100g: Optional[float] = None
    sodium_mg_100g: Optional[float] = None
    brand: Optional[str] = None
    barcode: Optional[str] = None
    serving_g: Optional[float] = None
    serving_label: Optional[str] = None
    popularity: int = 0
    quality: str = "ok"
    portions: list[tuple[str, float]] = field(default_factory=list)  # (label, grams)


def connect(database_url: Optional[str] = None):
    url = database_url or os.environ.get("DATABASE_URL")
    if not url:
        # Fall back to backend/.env so the scripts work the same way the app does.
        env = Path(__file__).resolve().parent.parent / ".env"
        if env.exists():
            for line in env.read_text().splitlines():
                if line.startswith("DATABASE_URL="):
                    url = line.split("=", 1)[1].strip().strip('"').strip("'")
    if not url:
        raise SystemExit("DATABASE_URL is not set (env var or backend/.env).")
    return psycopg2.connect(url)


def apply_schema(conn) -> None:
    with conn.cursor() as cur:
        cur.execute(SCHEMA_PATH.read_text())
    conn.commit()


def to_float(value) -> Optional[float]:
    if value is None:
        return None
    s = str(value).strip().replace(",", ".")
    if s == "" or s.lower() in {"nan", "none", "null"}:
        return None
    try:
        f = float(s)
    except ValueError:
        return None
    if f != f or f in (float("inf"), float("-inf")):
        return None
    return f


def normalize_barcode(code) -> Optional[str]:
    """Digits only, padded to EAN-13. UPC-A (12 digits) scans then match EAN-13 records."""
    if code is None:
        return None
    digits = re.sub(r"\D", "", str(code))
    if not digits or len(digits) < 8:
        return None
    if len(digits) == 14 and digits.startswith("0"):
        digits = digits[1:]
    if len(digits) < 13:
        digits = digits.zfill(13)
    return digits


_space = re.compile(r"\s+")


def clean_text(s) -> Optional[str]:
    if s is None:
        return None
    s = _space.sub(" ", str(s)).strip()
    return s or None


def assess_quality(row: FoodRow) -> Optional[str]:
    """Return None if the row must be rejected, else 'ok' or 'suspect'."""
    k, p, c, f = row.kcal_100g, row.protein_100g, row.carbs_100g, row.fat_100g
    if k is None or k < 0 or k > 902:  # pure fat is ~900 kcal/100 g
        return None
    if min(p, c, f) < 0 or p > 100 or c > 100 or f > 100:
        return None
    if p + c + f > 105:
        return None
    atwater = 4 * p + 4 * c + 9 * f
    if abs(k - atwater) > max(60.0, 0.35 * max(k, atwater)):
        return "suspect"
    return "ok"


COLUMNS = [
    "source", "source_id", "name", "brand", "barcode", "kcal_100g", "protein_100g",
    "carbs_100g", "fat_100g", "fiber_100g", "sugar_100g", "sodium_mg_100g",
    "serving_g", "serving_label", "popularity", "quality",
]


def upsert_foods(conn, rows: Iterable[FoodRow], batch_size: int = 20000) -> dict:
    """Bulk upsert via COPY into a temp table. Returns counts."""
    stats = {"seen": 0, "rejected": 0, "written": 0, "portions": 0}
    batch: list[FoodRow] = []

    def flush():
        if not batch:
            return
        _write_batch(conn, batch, stats)
        batch.clear()

    for row in rows:
        stats["seen"] += 1
        row.name = clean_text(row.name) or ""
        row.brand = clean_text(row.brand)
        if not row.name:
            stats["rejected"] += 1
            continue
        q = assess_quality(row)
        if q is None:
            stats["rejected"] += 1
            continue
        row.quality = q
        batch.append(row)
        if len(batch) >= batch_size:
            flush()
    flush()
    conn.commit()
    return stats


def _copy_value(v) -> str:
    """Encode one value for Postgres COPY text format."""
    if v is None:
        return r"\N"
    if isinstance(v, float):
        return repr(round(v, 4)) if v == v else r"\N"
    s = str(v)
    return s.replace("\x00", "").replace("\\", "\\\\").replace("\t", " ").replace("\n", " ").replace("\r", " ")


def _write_batch(conn, batch: list[FoodRow], stats: dict) -> None:
    # De-duplicate within the batch (last one wins) so ON CONFLICT never sees two.
    unique: dict[tuple[str, str], FoodRow] = {}
    for r in batch:
        unique[(r.source, r.source_id)] = r
    rows = list(unique.values())

    buf = io.StringIO()
    for r in rows:
        buf.write("\t".join(_copy_value(getattr(r, c)) for c in COLUMNS) + "\n")
    buf.seek(0)

    with conn.cursor() as cur:
        cur.execute(
            f"CREATE TEMP TABLE foods_stage ON COMMIT DROP AS SELECT {', '.join(COLUMNS)} FROM foods WITH NO DATA"
        )
        cur.copy_expert(
            f"COPY foods_stage ({', '.join(COLUMNS)}) FROM STDIN WITH (FORMAT text)", buf
        )
        cols = ", ".join(COLUMNS)
        updates = ", ".join(f"{c} = EXCLUDED.{c}" for c in COLUMNS if c not in ("source", "source_id"))
        cur.execute(
            f"""
            INSERT INTO foods ({cols})
            SELECT {cols} FROM foods_stage
            ON CONFLICT (source, source_id) DO UPDATE SET {updates}, updated_at = now()
            RETURNING id, source, source_id
            """
        )
        ids = {(s, sid): fid for fid, s, sid in cur.fetchall()}
        stats["written"] += len(ids)

        portion_rows = []
        for r in rows:
            fid = ids.get((r.source, r.source_id))
            if fid is None:
                continue
            seen = set()
            for seq, (label, grams) in enumerate(r.portions):
                label = clean_text(label)
                if not label or grams is None or grams <= 0 or label in seen:
                    continue
                seen.add(label)
                portion_rows.append((fid, label[:200], float(grams), seq))
        if portion_rows:
            cur.execute(
                "DELETE FROM food_portions WHERE food_id = ANY(%s)",
                (list({p[0] for p in portion_rows}),),
            )
            psycopg2.extras.execute_values(
                cur,
                "INSERT INTO food_portions (food_id, label, grams, seq) VALUES %s "
                "ON CONFLICT (food_id, label) DO NOTHING",
                portion_rows,
                page_size=5000,
            )
            stats["portions"] += len(portion_rows)
    conn.commit()

