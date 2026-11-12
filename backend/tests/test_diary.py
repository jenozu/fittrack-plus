"""Diary entry endpoints. Needs TEST_DATABASE_URL (reuses the food fixture from test_food_api)."""
import os
import subprocess
import sys
from datetime import date
from pathlib import Path
from types import SimpleNamespace

import pytest

from models import FoodEntry, User
from test_food_api import client  # noqa: F401  (fixture)


@pytest.fixture()
def diary(client):  # noqa: F811
    from utils.auth import get_current_user, get_db
    c, app = client
    # app tables come from Alembic (foods already exist from the client fixture); no-op if up to date
    subprocess.run([sys.executable, "-m", "alembic", "upgrade", "head"], check=True, capture_output=True,
                   cwd=Path(__file__).resolve().parent.parent, env={**os.environ, "DATABASE_URL": os.environ["TEST_DATABASE_URL"]})
    db = app.dependency_overrides[get_db]()
    users = [User(email=f"diary{i}@test.example", hashed_password="x") for i in (1, 2)]
    db.add_all(users)
    db.commit()
    who = {"id": users[0].id}
    app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(id=who["id"])
    yield c, who, [u.id for u in users], db
    db.query(FoodEntry).filter(FoodEntry.user_id.in_([u.id for u in users])).delete(synchronize_session=False)
    for u in users:
        db.delete(u)
    db.commit()


TODAY = date.today().isoformat()


def _banana(c):
    return c.get("/food/search", params={"q": "banana"}).json()[0]


def test_create_by_grams_portion_and_quick_add(diary):
    c, _, _, _ = diary
    b = _banana(c)
    r = c.post("/food/entries", json={"food_id": b["id"], "grams": 150, "meal_type": "breakfast", "entry_date": TODAY})
    assert r.status_code == 201, r.text
    e = r.json()
    assert e["grams"] == 150 and e["food_name"] == "Bananas, raw"
    assert e["calories"] == pytest.approx(b["kcal_100g"] * 1.5, abs=0.1)

    r = c.post("/food/entries", json={"food_id": b["id"], "portion_label": "100 g", "quantity": 2,
                                      "meal_type": "lunch", "entry_date": TODAY})
    assert r.json()["grams"] == 200 and r.json()["portion_label"] == "100 g"
    assert c.post("/food/entries", json={"food_id": b["id"], "portion_label": "nope", "entry_date": TODAY}).status_code == 422

    r = c.post("/food/entries", json={"food_name": "Mystery bar", "calories": 210, "protein_g": 10,
                                      "meal_type": "snack", "entry_date": TODAY})
    assert r.status_code == 201 and r.json()["food_id"] is None and r.json()["calories"] == 210
    assert c.post("/food/entries", json={"food_name": "x", "entry_date": TODAY}).status_code == 422

    day = c.get("/food/entries", params={"entry_date": TODAY}).json()
    assert len(day["entries"]) == 3 and set(day["meals"]) == {"breakfast", "lunch", "snack"}
    assert day["totals"]["calories"] == pytest.approx(sum(m["calories"] for m in day["meals"].values()), abs=0.1)


def test_update_recomputes_and_scales(diary):
    c, _, _, _ = diary
    b = _banana(c)
    e = c.post("/food/entries", json={"food_id": b["id"], "grams": 100, "entry_date": TODAY}).json()
    u = c.put(f"/food/entries/{e['id']}", json={"grams": 300}).json()
    assert u["grams"] == 300 and u["calories"] == pytest.approx(b["kcal_100g"] * 3, abs=0.1)
    # quick-add with no food: meal change only
    q = c.post("/food/entries", json={"food_name": "Bar", "calories": 100, "entry_date": TODAY}).json()
    assert c.put(f"/food/entries/{q['id']}", json={"meal_type": "snack"}).json()["meal_type"] == "snack"
    assert c.put(f"/food/entries/{q['id']}", json={"grams": 50}).status_code == 422


def test_other_user_gets_404(diary):
    c, who, ids, _ = diary
    e = c.post("/food/entries", json={"food_name": "Mine", "calories": 50, "entry_date": TODAY}).json()
    who["id"] = ids[1]
    assert c.get(f"/food/entries/{e['id']}").status_code == 404
    assert c.put(f"/food/entries/{e['id']}", json={"grams": 5}).status_code == 404
    assert c.delete(f"/food/entries/{e['id']}").status_code == 404
    assert c.get("/food/entries", params={"entry_date": TODAY}).json()["entries"] == []
    who["id"] = ids[0]
    assert c.delete(f"/food/entries/{e['id']}").status_code == 204


def test_recent_frequent_copy(diary):
    from datetime import timedelta
    c, _, _, _ = diary
    a = _banana(c)
    b = c.get("/food/barcode/068100084245").json()
    yday = (date.today() - timedelta(days=1)).isoformat()
    for f, g, d, m in [(a, 100, yday, "breakfast"), (b, 50, yday, "breakfast"), (a, 120, yday, "lunch")]:
        assert c.post("/food/entries", json={"food_id": f["id"], "grams": g, "meal_type": m, "entry_date": d}).status_code == 201
    r = c.get("/food/recent").json()
    assert [x["food"]["id"] for x in r] == [a["id"], b["id"]] and r[0]["grams"] == 120
    fr = c.get("/food/frequent").json()
    assert fr[0]["food"]["id"] == a["id"] and fr[0]["times_logged"] == 2
    r = c.post("/food/entries/copy", json={"from_date": yday, "to_date": TODAY, "meal_type": "breakfast"})
    assert r.status_code == 201 and len(r.json()) == 2
    got = c.get("/food/entries", params={"entry_date": TODAY}).json()["entries"]
    src = {e["food_id"]: e for e in c.get("/food/entries", params={"entry_date": yday}).json()["entries"] if e["meal_type"] == "breakfast"}
    assert len(got) == 2
    for e in got:
        assert e["calories"] == src[e["food_id"]]["calories"] and e["grams"] == src[e["food_id"]]["grams"]


def test_copy_whole_day_and_isolation(diary):
    from datetime import timedelta
    c, who, ids, _ = diary
    a = _banana(c)
    src = (date.today() - timedelta(days=3)).isoformat()
    for g, m in [(100, "breakfast"), (150, "lunch")]:
        assert c.post("/food/entries", json={"food_id": a["id"], "grams": g, "meal_type": m, "entry_date": src}).status_code == 201
    r = c.post("/food/entries/copy", json={"from_date": src, "to_date": TODAY})
    assert r.status_code == 201 and len(r.json()) == 2
    key = lambda e: (e["meal_type"], e["calories"], e["protein_g"], e["carbs_g"], e["fat_g"], e["grams"], e["food_name"])
    want = sorted(key(e) for e in c.get("/food/entries", params={"entry_date": src}).json()["entries"])
    assert sorted(key(e) for e in r.json()) == want
    who["id"] = ids[1]  # another user copying the same date gets nothing
    assert c.post("/food/entries/copy", json={"from_date": src, "to_date": TODAY}).json() == []
    who["id"] = ids[0]
