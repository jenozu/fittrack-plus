# Manual checks waiting for the human

The phase-runner appends steps here instead of stopping mid-phase. Run them at the end of the phase,
tell the lead which failed, then delete the sections that passed.

## Task 2 - Set up local development (2026-11-08)
1. `cd backend && venv/Scripts/python.exe -m uvicorn main:app`, then `cd frontend && npm run dev`; open the printed URL; login/landing page renders, no console errors.
2. Optional: http://localhost:8000/docs loads.
3. Note: email-validator + dnspython added to requirements.txt (needed by existing pydantic EmailStr); csv.field_size_limit fix for Windows. Revert if unwanted.

## Task 4 - Adopt Alembic migrations (2026-11-08)
1. `cd backend`, `venv/Scripts/python.exe -m uvicorn main:app --port 8000`; open http://localhost:8000/docs; register a test user, log in, create a food entry; expect 2xx. (Automated TestClient e2e already passed on a scratch db.)
2. Note: bcrypt==4.0.1 pinned in requirements.txt (passlib compat; fixes 72-byte register error). Old-install procedure: `alembic stamp bf60e849d28a && alembic upgrade head`.
