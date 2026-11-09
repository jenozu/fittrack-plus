"""Weight log: one entry per user per day. Needs TEST_DATABASE_URL."""
from datetime import date, timedelta

from models import WeightLog
from test_diary import diary  # noqa: F401
from test_food_api import client  # noqa: F401


def test_weight_upsert_one_per_day(diary):  # noqa: F811
    c, who, ids, db = diary
    today = date.today()
    for i, w in enumerate([80, 79.8, 79.5, 79.9, 79.2]):
        r = c.post("/dashboard/weight", json={"weight_kg": w, "log_date": (today - timedelta(days=4 - i)).isoformat()})
        assert r.status_code == 200, r.text
    c.post("/dashboard/weight", json={"weight_kg": 78.0, "log_date": today.isoformat()})
    rows = c.get("/dashboard/weight", params={"days": 30}).json()
    assert len(rows) == 5 and rows[-1]["weight_kg"] == 78.0
    assert c.post("/dashboard/weight", json={"weight_kg": 5, "log_date": today.isoformat()}).status_code == 422
    db.query(WeightLog).filter(WeightLog.user_id.in_(ids)).delete(synchronize_session=False)
    db.commit()
