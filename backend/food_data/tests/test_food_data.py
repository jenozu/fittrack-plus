"""Run: TEST_DATABASE_URL=postgresql://user:pass@localhost/fittrack_test pytest backend/food_data -q"""

from food_data import import_cnf, import_off, import_usda
from food_data.common import apply_schema, normalize_barcode, upsert_foods
from food_data.service import get_food, lookup_barcode, search_foods


def one(conn, sql, *args):
    with conn.cursor() as cur:
        cur.execute(sql, args)
        return cur.fetchone()


def load_everything(conn, fixtures):
    apply_schema(conn)
    upsert_foods(conn, import_usda.load(fixtures / "usda_foundation"))
    upsert_foods(conn, import_usda.load(fixtures / "FoodData_Central_sr_legacy_food_csv_2018-04.zip"))
    upsert_foods(conn, import_cnf.load(fixtures / "cnf2015"))
    upsert_foods(conn, import_off.load(fixtures / "off.csv.gz", ["canada", "united-states"], 0, "256MB"))


def test_barcode_normalisation():
    assert normalize_barcode("068100084245") == "0068100084245"   # UPC-A -> EAN-13
    assert normalize_barcode("0068100084245") == "0068100084245"
    assert normalize_barcode("00068100084245") == "0068100084245"  # GTIN-14
    assert normalize_barcode("abc") is None


def test_usda_foundation(conn, fixtures):
    apply_schema(conn)
    stats = upsert_foods(conn, import_usda.load(fixtures / "usda_foundation"))
    assert stats["written"] == 3                       # sample_food row skipped
    kcal, = one(conn, "SELECT kcal_100g FROM foods WHERE source_id='1001'")
    assert kcal == 97                                  # Atwater energy used when 1008 missing
    kcal, = one(conn, "SELECT kcal_100g FROM foods WHERE source_id='1002'")
    assert round(kcal) == round(4 * 22.5 + 9 * 1.93)  # computed from macros
    label, grams = one(conn, "SELECT serving_label, serving_g FROM foods WHERE source_id='1001'")
    assert grams == 118 and label.startswith("1 medium")
    n, = one(conn, "SELECT count(*) FROM food_portions p JOIN foods f ON f.id=p.food_id WHERE f.source_id='1004'")
    assert n == 1                                      # zero-gram portion dropped


def test_usda_sr_zip(conn, fixtures):
    apply_schema(conn)
    stats = upsert_foods(conn, import_usda.load(fixtures / "FoodData_Central_sr_legacy_food_csv_2018-04.zip"))
    assert stats["written"] == 2
    src, label = one(conn, "SELECT source, serving_label FROM foods WHERE source_id='2001'")
    assert src == "usda_sr" and label == "1 container (6 oz)"


def test_cnf_2015(conn, fixtures):
    apply_schema(conn)
    stats = upsert_foods(conn, import_cnf.load(fixtures / "cnf2015"))
    assert stats["written"] == 2
    name, fat = one(conn, "SELECT name, fat_100g FROM foods WHERE source='cnf' AND source_id='5000'")
    assert name == "Tourtière, homemade" and fat == 18  # accent survives cp1252, sat-fat not used as fat
    grams, = one(conn, "SELECT grams FROM food_portions p JOIN foods f ON f.id=p.food_id "
                       "WHERE f.source_id='61' AND label='250ml'")
    assert abs(grams - 258) < 0.01                    # factor x 100 g


def test_cnf_2026_style(conn, fixtures):
    apply_schema(conn)
    stats = upsert_foods(conn, import_cnf.load(fixtures / "cnf2026"))
    assert stats["written"] == 1
    grams, = one(conn, "SELECT grams FROM food_portions")
    assert grams == 258                               # grams column used as-is


def test_off_filter_and_quality(conn, fixtures):
    apply_schema(conn)
    stats = upsert_foods(conn, import_off.load(fixtures / "off.csv.gz", ["canada", "united-states"], 0, "256MB"))
    names = {r[0] for r in _all(conn, "SELECT name FROM foods")}
    assert "Nutella" not in names                    # France only -> filtered out
    assert "Broken \"quote product" not in names     # 5000 kcal -> rejected
    assert stats["rejected"] >= 1
    kcal, sodium, brand = one(conn, "SELECT kcal_100g, sodium_mg_100g, brand FROM foods WHERE barcode='0068100084245'")
    assert round(kcal) == round(1569 / 4.184) and sodium == 750 and brand == "Kraft"
    q, = one(conn, "SELECT quality FROM foods WHERE name='Mislabelled Bar'")
    assert q == "suspect"


def _all(conn, sql):
    with conn.cursor() as cur:
        cur.execute(sql)
        return cur.fetchall()


def test_search_ranking(conn, session, fixtures):
    load_everything(conn, fixtures)
    res = search_foods(session, "banana")
    assert res[0]["name"] == "Bananas, raw"           # generic, short name first
    assert res[0]["portions"][0] == {"label": "100 g", "grams": 100.0}
    assert search_foods(session, "chick bre")[0]["name"].startswith("Chicken, broiler")  # prefix typing
    assert search_foods(session, "bananna")                                          # typo -> trigram
    assert search_foods(session, "greek yog")[0]["name"] in ("Yogurt, Greek, plain, nonfat", "Greek Yogurt 0% Plain")
    assert search_foods(session, "tourtiere")[0]["name"] == "Tourtière, homemade"   # accent-insensitive
    assert search_foods(session, "x") == []


def test_custom_foods_are_private(conn, session, fixtures):
    apply_schema(conn)
    with conn.cursor() as cur:
        cur.execute("INSERT INTO foods (source, source_id, name, kcal_100g, created_by_user) "
                    "VALUES ('custom', 'u1-1', 'Mom''s banana bread', 320, 1)")
    conn.commit()
    assert any(f["name"] == "Mom's banana bread" for f in search_foods(session, "banana bread", user_id=1))
    assert not any(f["name"] == "Mom's banana bread" for f in search_foods(session, "banana bread", user_id=2))


def test_barcode_local_then_live_then_cached(conn, session, fixtures):
    load_everything(conn, fixtures)
    calls = []

    def fake_fetch(code):
        calls.append(code)
        if code.endswith("77777"):
            return {"code": code, "product_name": "PC Blue Menu Oats", "brands": "President's Choice",
                    "nutriments": {"energy-kcal_100g": 375, "proteins_100g": 13, "carbohydrates_100g": 67,
                                   "fat_100g": 6.5, "sodium_100g": 0.01},
                    "serving_size": "1/2 cup (40 g)", "serving_quantity": 40}
        return None

    assert lookup_barcode(session, "068100084245", fetch=fake_fetch)["name"] == "Kraft Dinner Original"
    assert calls == []                                 # local hit, no API call
    food = lookup_barcode(session, "060383777777", fetch=fake_fetch)
    assert food["name"] == "PC Blue Menu Oats" and food["serving_g"] == 40
    assert len(calls) == 1
    again = lookup_barcode(session, "060383777777", fetch=fake_fetch)
    assert again["id"] == food["id"] and len(calls) == 1   # cached
    assert lookup_barcode(session, "000000099999", fetch=fake_fetch) is None
    assert get_food(session, food["id"])["portions"][1] == {"label": "1/2 cup (40 g)", "grams": 40.0}


def test_reimport_is_idempotent(conn, fixtures):
    load_everything(conn, fixtures)
    before = one(conn, "SELECT count(*) FROM foods")[0], one(conn, "SELECT count(*) FROM food_portions")[0]
    load_everything(conn, fixtures)
    after = one(conn, "SELECT count(*) FROM foods")[0], one(conn, "SELECT count(*) FROM food_portions")[0]
    assert before == after


# (source, name, brand, popularity, complete). Names mirror the real USDA/CNF/OFF rows; OFF rows
# compete with short, query-like names, real-ish scan counts and same-name+brand duplicates.
RANKING_ROWS = [
    ("usda_foundation", "Bananas, raw", None, 0, True),
    ("cnf", "Banana, raw", None, 0, True),
    ("off", "Banana", "Dole", 400, True), ("off", "Banana", "Dole", 120, True),
    ("off", "Banana", "Chiquita", 350, True), ("off", "Bananas", "Del Monte", 250, False),
    ("off", "Banana chips", "Compliments", 200, True), ("off", "Banana Bread", "Dempster's", 150, True),
    ("usda_foundation", "Chicken, breast, boneless, skinless, raw", None, 0, True),
    ("usda_sr", "Chicken, broilers or fryers, breast, meat only, cooked, roasted", None, 0, True),
    ("cnf", "Chicken, broiler, breast, meat, roasted", None, 0, True),
    ("off", "Chicken Breast", "Kirkland Signature", 450, True),
    ("off", "Chicken Breast", "Maple Leaf", 300, True), ("off", "Chicken breast", "Maple Leaf", 120, True),
    ("off", "Chicken Breast", "President's Choice", 260, True), ("off", "Chicken Breast", "Lilydale", 90, True),
    ("off", "Chicken Breast Strips", "Janes", 200, True), ("off", "Grilled Chicken Breast", "Compliments", 150, True),
    ("off", "Chicken Breast Fillets", "Lilydale", 80, False),
    ("usda_sr", "Yogurt, Greek, plain, nonfat", None, 0, True),
    ("usda_foundation", "Yogurt, Greek, strawberry, nonfat", None, 0, True),
    ("cnf", "Yogurt, Greek, plain, 2% M.F.", None, 0, True),
    ("off", "Greek Yogurt", "Chobani", 800, True), ("off", "Greek yogurt", "Oikos", 600, True),
    ("off", "Greek Yogurt", "Oikos", 300, True), ("off", "Greek Yogurt", "Liberte", 400, True),
    ("off", "Greek Yogurt Plain", "Kirkland Signature", 350, True), ("off", "Greek Yogurt", "Iogo", 150, True),
    ("off", "Greek Yogurt Vanilla", "Chobani", 250, True),
    ("off", "Shreddies", "Post", 900, True), ("off", "Shreddies", "Post", 200, False),
    ("off", "Honey Shreddies", "Post", 300, True), ("off", "Frosted Shreddies", "Post", 200, True),
    ("cnf", "Cereal, ready-to-eat, whole wheat squares, Shreddies", None, 0, True),
    ("off", "Kraft Dinner Original", "Kraft", 700, True), ("off", "Kraft Dinner Original", "Kraft", 90, True),
    ("off", "Kraft Dinner Spirals", "Kraft", 200, True), ("off", "Kraft Dinner Three Cheese", "Kraft", 150, True),
    ("usda_sr", "KRAFT, Macaroni and Cheese Dinner, Original Flavor, unprepared", None, 0, True),
]
VERIFIED = ("usda_foundation", "usda_sr", "cnf")


def test_search_prefers_verified_and_keeps_brands(conn, session):
    apply_schema(conn)
    with conn.cursor() as cur:
        for i, (src, name, brand, pop, full) in enumerate(RANKING_ROWS):
            extra = (2.0, 10.0, 300.0, 100.0) if full else (None, None, None, None)
            cur.execute("INSERT INTO foods (source, source_id, name, brand, kcal_100g, popularity, "
                        "fiber_100g, sugar_100g, sodium_mg_100g, serving_g) "
                        "VALUES (%s,%s,%s,%s,100,%s,%s,%s,%s,%s)", (src, f"r{i}", name, brand, pop, *extra))
    conn.commit()

    def top3(q):
        return [(f["source"], f["name"], f["brand"]) for f in search_foods(session, q)[:3]]

    for q in ("banana", "chicken breast", "greek yogurt"):
        assert any(src in VERIFIED for src, _, _ in top3(q)), (q, top3(q))
    assert any(src == "off" and name.startswith("Kraft Dinner") for src, name, _ in top3("kraft dinner"))
    assert any(src == "off" and name == "Shreddies" for src, name, _ in top3("shreddies")), top3("shreddies")
    # same-name+brand OFF duplicates collapse to one row
    names = [(f["name"].lower(), f["brand"]) for f in search_foods(session, "chicken breast")]
    assert names.count(("chicken breast", "Maple Leaf")) == 1
