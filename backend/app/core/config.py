from pathlib import Path
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
	DATABASE_URL: str
	SECRET_KEY: str
	ALGORITHM: str = "HS256"
	ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
	REFRESH_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

	# Company (used in employee ID prefix — change when multi-company support is added)
	COMPANY_PREFIX: str = "EM"

	# Gmail SMTP
	SMTP_HOST: str = "smtp.gmail.com"
	SMTP_PORT: int = 587
	SMTP_USER: str = ""
	SMTP_PASSWORD: str = ""  # Gmail App Password
	EMAILS_FROM_NAME: str = "EmPay HRMS"
	EMAILS_ENABLED: bool = False  # Set to True in .env when SMTP is configured

	class Config:
		env_file = str(Path(__file__).resolve().parents[3] / ".env")
		env_file_encoding = "utf-8"


settings = Settings()
