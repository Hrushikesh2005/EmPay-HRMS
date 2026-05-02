# EmPay — Smart HRMS (scaffold)

EmPay is a Human Resource Management System scaffold providing a React frontend (Vite) and a Python FastAPI backend placeholder. This repository currently contains a UI scaffold and backend placeholder modules to be implemented.

**What’s in this repo:**

- Frontend: React + Vite app in [EMPAY_HRMS/src](EMPAY_HRMS/src#L1)
- Backend: placeholder FastAPI package in [EMPAY_HRMS/backend/app/README.md](EMPAY_HRMS/backend/app/README.md#L1)

**Status:** Starter scaffold — frontend example pages present; backend dependencies listed in [EMPAY_HRMS/backend/requirements.txt](EMPAY_HRMS/backend/requirements.txt#L1-L20) and a placeholder `app/` package exists but contains no runtime logic yet.

**Quick Start**

Frontend (development):

```bash
cd EMPAY_HRMS
npm install
npm run dev
```

Open http://localhost:5173 in your browser after Vite starts.

Backend (development — scaffolded placeholders):

```bash
cd EMPAY_HRMS/backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1   # PowerShell
# or .\.venv\Scripts\activate for cmd
pip install -r requirements.txt
# run when backend implemented:
# uvicorn app.main:app --reload --port 8000
```

Backend implementation notes:

- The backend package lives at [EMPAY_HRMS/backend/app](EMPAY_HRMS/backend/app/README.md#L1). It contains placeholder modules for `main`, `core`, `db`, `models`, `schemas`, `routers`, `services`, and `utils`.
- Implement the ASGI `app` in `app/main.py` and add Alembic migrations and models before starting the server.

Contributing

- Implement features in small commits and update this README with setup details, migrations, and API docs.

If you want, I can scaffold a working `app/main.py` with a `/health` route and a simple DB wiring next.
