"""FastAPI application entrypoint (minimal).

This module provides a very small, working FastAPI application with a
single `/health` endpoint. Implement additional routers, middleware and
startup/shutdown logic inside the `app` package as needed.
"""

from fastapi import FastAPI

app = FastAPI(title="EmPay HRMS API")


@app.get("/health", tags=["health"])
def health_check() -> dict:
	return {"status": "ok"}


if __name__ == "__main__":
	import uvicorn

	uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
