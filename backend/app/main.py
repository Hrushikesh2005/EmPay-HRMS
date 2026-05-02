"""FastAPI application entrypoint (minimal).

This module provides a very small, working FastAPI application with a
single `/health` endpoint. Implement additional routers, middleware and
startup/shutdown logic inside the `app` package as needed.
"""

from fastapi import FastAPI

from app.api.v1.auth import router as auth_router

app = FastAPI(title="EmPay HRMS API")

app.include_router(auth_router, prefix="/api/v1")


@app.get("/health", tags=["health"])
def health_check() -> dict:
	return {"status": "ok"}


if __name__ == "__main__":
	import uvicorn

	uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
