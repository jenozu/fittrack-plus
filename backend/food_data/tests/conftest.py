import os
import sys
from pathlib import Path

import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))  # backend/

from food_data.tests.make_fixtures import build  # noqa: E402

TEST_DB = os.environ.get("TEST_DATABASE_URL")


@pytest.fixture(scope="session")
def fixtures(tmp_path_factory):
    root = tmp_path_factory.mktemp("fooddata")
    build(root)
    return root


@pytest.fixture()
def conn():
    if not TEST_DB:
        pytest.skip("set TEST_DATABASE_URL to a throwaway Postgres database")
    import psycopg2
    c = psycopg2.connect(TEST_DB)
    with c.cursor() as cur:
        cur.execute("DROP TABLE IF EXISTS food_portions, foods CASCADE")
    c.commit()
    yield c
    c.close()


@pytest.fixture()
def session(conn):
    from sqlalchemy import create_engine
    from sqlalchemy.orm import Session
    engine = create_engine(TEST_DB.replace("postgresql://", "postgresql+psycopg2://", 1))
    with Session(engine) as s:
        yield s
    engine.dispose()
