import importlib
import subprocess
import sys
from pathlib import Path

from fastapi.testclient import TestClient

BACKEND = Path(__file__).resolve().parent.parent


def test_import_without_secret_key_raises():
    # dotenv doesn't override an already-set (empty) var, so this works even with a local .env
    r = subprocess.run(
        [sys.executable, "-c", "import utils.security"],
        cwd=BACKEND, env={"SECRET_KEY": "", "PATH": ""}, capture_output=True, text=True,
    )
    assert r.returncode != 0 and "SECRET_KEY" in r.stderr


def test_registration_closed(monkeypatch):
    monkeypatch.setenv("ALLOW_REGISTRATION", "false")
    from main import app
    r = TestClient(app).post("/auth/register", json={"email": "a@b.co", "password": "Passw0rd!x", "first_name": "A", "last_name": "B"})
    assert r.status_code == 403


def test_cors_blocks_evil_origin():
    from main import app
    r = TestClient(app).get("/", headers={"Origin": "https://evil.example"})
    assert "access-control-allow-origin" not in r.headers
