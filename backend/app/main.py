"""FastAPI application entrypoint (minimal).

This module provides a very small, working FastAPI application with a
single `/health` endpoint. Implement additional routers, middleware and
startup/shutdown logic inside the `app` package as needed.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.auth import router as auth_router
from app.api.employee import router as employee_router
from app.api.attendance import router as attendance_router
from app.api.leave import router as leave_router
from app.api.users import router as users_router
from app.api.leave_types import router as leave_types_router
from app.api.leave_balances import router as leave_balances_router

app = FastAPI(title="EmPay HRMS API")

app.add_middleware(
	CORSMiddleware,
	allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(employee_router, prefix="/api/v1")
app.include_router(attendance_router, prefix="/api/v1")
app.include_router(leave_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(leave_types_router, prefix="/api/v1")
app.include_router(leave_balances_router, prefix="/api/v1")


@app.get("/health", tags=["health"])
def health_check() -> dict:
	return {"status": "ok"}


if __name__ == "__main__":
	import uvicorn

	uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)