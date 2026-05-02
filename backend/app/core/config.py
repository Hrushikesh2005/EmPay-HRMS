from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
	DATABASE_URL: str
	SECRET_KEY: str
	ALGORITHM: str = "HS256"
	ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
	REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

	class Config:
		env_file = str(Path(__file__).resolve().parents[3] / ".env")
		env_file_encoding = "utf-8"


settings = Settings()
