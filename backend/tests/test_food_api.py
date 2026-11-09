"""Needs TEST_DATABASE_URL (throwaway Postgres). Loads the food_data fixtures into it."""
import os
from types import SimpleNamespace

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from food_data import import_cnf, import_off, import_usda
from food_data import service
from food_data.common import apply_schema, upsert_foods
from food_data.tests.make_fixtures import build

TEST_DB = os.environ.get("TEST_DATABASE_URL")


@pytest.fixture()
def client(tmp_path):
    if not TEST_DB:
        pytest.skip("set TEST_DATABASE_URL")
    import psycopg2
    from main import app
    from utils.auth import get_current_user, get_db

    build(tmp_path)
    conn = psycopg2.connect(TEST_DB)
    with conn.cursor() as cur:
        cur.execute("DROP TABLE IF EXISTS food_portions, foods CASCADE")
    conn.commit()
    apply_schema(conn)
    upsert_foods(conn, import_usda.load(tmp_path / "usda_foundation"))
    upsert_foods(conn, import_cnf.load(tmp_path / "cnf2015"))
    upsert_foods(conn, import_off.load(tmp_path / "off.csv.gz", ["canada", "united-states"], 0, "256MB"))
    conn.close()

    engine = create_engine(TEST_DB.replace("postgresql://", "postgresql+psycopg2://", 1))
    session = Session(engine)
    app.dependency_overrides[get_db] = lambda: session
    app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(id=1)
    yield TestClient(app), app
    app.dependency_overrides.clear()
    session.close()
    engine.dispose()


def test_search_and_get(client):
    c, _ = client
    r = c.get("/food/search", params={"q": "banana"})
    assert r.status_code == 200
    first = r.json()[0]
    assert first["name"] == "Bananas, raw" and first["portions"][0] == {"label": "100 g", "grams": 100.0}
    assert c.get(f"/food/{first['id']}").json()["name"] == "Bananas, raw"
    assert c.get("/food/99999999").status_code == 404


def test_search_requires_auth(client):
    c, app = client
    app.dependency_overrides.clear()
    assert c.get("/food/search", params={"q": "banana"}).status_code in (401, 403)


def test_barcode(client, monkeypatch):
    c, _ = client
    assert c.get("/food/barcode/068100084245").json()["name"] == "Kraft Dinner Original"
    def no_network(*a, **k):
        raise service.requests.RequestException("offline")
    monkeypatch.setattr(service.requests, "get", no_network)  # live OFF fetch -> None
    assert c.get("/food/barcode/000000099999").status_code == 404


def test_custom_foods(client):
    c, app = client
    from utils.auth import get_current_user
    r = c.post("/food/custom", json={"name": "Zorblat bar", "basis": "serving", "serving_g": 30,
                                     "serving_label": "1 bar", "kcal": 120, "protein": 3,
                                     "barcode": "5012345678900"})
    assert r.status_code == 201
    f = r.json()
    assert f["kcal_100g"] == 400 and f["source"] == "custom"
    assert {"label": "1 bar", "grams": 30.0} in f["portions"]
    assert c.post("/food/custom", json={"name": "x", "basis": "serving", "kcal": 1}).status_code == 422
    assert c.get("/food/barcode/5012345678900").json()["id"] == f["id"]

    # user B cannot see, edit or delete it
    app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(id=2)
    assert c.get(f"/food/{f['id']}").status_code == 404
    assert all(x["id"] != f["id"] for x in c.get("/food/search", params={"q": "zorblat"}).json())
    body = {"name": "hax", "kcal": 1}
    assert c.put(f"/food/custom/{f['id']}", json=body).status_code == 404
    assert c.delete(f"/food/custom/{f['id']}").status_code == 404
    app.dependency_overrides[get_current_user] = lambda: SimpleNamespace(id=1)

    assert c.put(f"/food/custom/{f['id']}", json={"name": "Zorblat bar", "kcal": 350}).json()["kcal_100g"] == 350
    assert c.delete(f"/food/custom/{f['id']}").status_code == 204
    assert c.get(f"/food/{f['id']}").status_code == 404


def test_copy_off_food(client):
    c, _ = client
    off = c.get("/food/barcode/068100084245").json()
    cp = c.post(f"/food/{off['id']}/copy").json()
    assert cp["source"] == "custom" and cp["id"] != off["id"] and cp["kcal_100g"] == off["kcal_100g"]
    upd = {"name": off["name"], "brand": off["brand"], "barcode": off["barcode"], "kcal": 111}
    assert c.put(f"/food/custom/{cp['id']}", json=upd).json()["kcal_100g"] == 111
    assert c.get("/food/barcode/068100084245").json()["id"] == cp["id"]
    assert c.get("/food/search", params={"q": off["name"]}).json()[0]["id"] == cp["id"]
