-- FitTrack+ local food database.
-- Safe to run repeatedly (everything is IF NOT EXISTS / OR REPLACE).
-- All nutrition values are stored PER 100 g. Portions convert a household
-- measure ("1 cup, sliced") into grams.

CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- unaccent() is not IMMUTABLE, so it cannot be used in a generated column
-- directly. This wrapper is the standard workaround.
CREATE OR REPLACE FUNCTION f_unaccent(text) RETURNS text
    LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT
    AS $$ SELECT public.unaccent('public.unaccent', $1) $$;

CREATE TABLE IF NOT EXISTS foods (
    id               BIGSERIAL PRIMARY KEY,
    -- usda_foundation | usda_sr | cnf | off | custom
    source           TEXT NOT NULL,
    source_id        TEXT NOT NULL,
    name             TEXT NOT NULL,
    brand            TEXT,
    barcode          TEXT,                 -- normalised to 13 digits (EAN-13)
    kcal_100g        REAL NOT NULL,
    protein_100g     REAL NOT NULL DEFAULT 0,
    carbs_100g       REAL NOT NULL DEFAULT 0,
    fat_100g         REAL NOT NULL DEFAULT 0,
    fiber_100g       REAL,
    sugar_100g       REAL,
    sodium_mg_100g   REAL,
    serving_g        REAL,                 -- default serving in grams, if known
    serving_label    TEXT,                 -- e.g. "1 cup (240 ml)"
    popularity       INTEGER NOT NULL DEFAULT 0,   -- OFF unique scans
    quality          TEXT NOT NULL DEFAULT 'ok',    -- ok | suspect
    created_by_user  INTEGER,              -- users.id for custom foods
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
    search_text      TEXT GENERATED ALWAYS AS (
        lower(f_unaccent(coalesce(brand, '') || ' ' || name))
    ) STORED,
    search_vec       TSVECTOR GENERATED ALWAYS AS (
        setweight(to_tsvector('simple', lower(f_unaccent(name))), 'A') ||
        setweight(to_tsvector('simple', lower(f_unaccent(coalesce(brand, '')))), 'B')
    ) STORED,
    UNIQUE (source, source_id)
);

CREATE INDEX IF NOT EXISTS foods_search_vec_idx  ON foods USING GIN (search_vec);
CREATE INDEX IF NOT EXISTS foods_search_trgm_idx ON foods USING GIN (search_text gin_trgm_ops);
CREATE INDEX IF NOT EXISTS foods_barcode_idx     ON foods (barcode) WHERE barcode IS NOT NULL;
CREATE INDEX IF NOT EXISTS foods_user_idx        ON foods (created_by_user) WHERE created_by_user IS NOT NULL;

CREATE TABLE IF NOT EXISTS food_portions (
    id       BIGSERIAL PRIMARY KEY,
    food_id  BIGINT NOT NULL REFERENCES foods(id) ON DELETE CASCADE,
    label    TEXT NOT NULL,     -- "1 cup, chopped"
    grams    REAL NOT NULL CHECK (grams > 0),
    seq      INTEGER NOT NULL DEFAULT 0,
    UNIQUE (food_id, label)
);
CREATE INDEX IF NOT EXISTS food_portions_food_idx ON food_portions (food_id);

-- Ranked search used by the API. Prefix matching makes it work as you type
-- ("chick bre" finds "Chicken breast"); trigram similarity catches typos.
-- Two stages keep it fast on ~1M rows: pick a few hundred cheap candidates,
-- then do the expensive similarity scoring only on those.
CREATE OR REPLACE FUNCTION search_foods(q TEXT, lim INTEGER DEFAULT 25, for_user INTEGER DEFAULT NULL)
RETURNS TABLE (id BIGINT, score REAL)
LANGUAGE plpgsql STABLE AS $$
DECLARE
    raw  TEXT := lower(f_unaccent(trim(coalesce(q, ''))));
    tsq  TSQUERY;
    ids  BIGINT[];
BEGIN
    SELECT nullif(string_agg(quote_literal(t) || ':*', ' & '), '')::tsquery INTO tsq
    FROM regexp_split_to_table(raw, '[^[:alnum:]]+') AS t
    WHERE t <> '';
    IF tsq IS NULL THEN
        RETURN;
    END IF;

    -- Stage 1a: word-prefix matches. Generic foods and the user's own foods first,
    -- then the most-scanned products.
    ids := ARRAY(
        SELECT f.id FROM foods f
        WHERE f.search_vec @@ tsq
          AND (f.source <> 'custom' OR f.created_by_user = for_user)
        ORDER BY (f.source IN ('usda_foundation', 'usda_sr', 'cnf', 'custom')) DESC,
                 f.popularity DESC, length(f.name)
        LIMIT 400
    );

    -- Stage 1b: typo tolerance, only when prefix matching found too little.
    IF cardinality(ids) < lim THEN
        ids := ids || ARRAY(
            SELECT f.id FROM foods f
            WHERE f.search_text % raw
              AND (f.source <> 'custom' OR f.created_by_user = for_user)
            ORDER BY f.search_text <-> raw
            LIMIT 100
        );
    END IF;

    -- Stage 2: rank the candidates.
    RETURN QUERY
    SELECT f.id,
           (  CASE WHEN f.search_vec @@ tsq THEN 1 ELSE 0 END
            + similarity(f.search_text, raw) * 2
            + CASE WHEN lower(f_unaccent(f.name)) LIKE raw || '%' THEN 0.4 ELSE 0 END
            + CASE WHEN f.source IN ('usda_foundation', 'usda_sr', 'cnf') THEN 0.35 ELSE 0 END
            + CASE WHEN f.source = 'custom' THEN 0.5 ELSE 0 END
            + ln(1 + f.popularity) * 0.05
            - CASE WHEN f.quality = 'suspect' THEN 0.5 ELSE 0 END
            - length(f.name) * 0.002
           )::REAL
    FROM foods f
    WHERE f.id = ANY(ids)
    ORDER BY 2 DESC
    LIMIT lim;
END
$$;
