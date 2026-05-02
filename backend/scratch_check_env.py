from app.core.config import settings
print(f"EMAILS_ENABLED: {settings.EMAILS_ENABLED}")
print(f"SMTP_USER: {settings.SMTP_USER}")
print(f"SMTP_PASSWORD: {'SET' if settings.SMTP_PASSWORD else 'NOT SET'}")
