"""Email sending via Gmail SMTP.

Set EMAILS_ENABLED=True in .env and fill in SMTP_USER / SMTP_PASSWORD
(use a Gmail App Password, not your regular Google password).

How to get a Gmail App Password:
  1. Go to https://myaccount.google.com/apppasswords
  2. Select "Mail" and your device
  3. Copy the 16-char password into .env as SMTP_PASSWORD
"""

import smtplib
import logging
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.core.config import settings

logger = logging.getLogger(__name__)


def send_welcome_email(to_email: str, full_name: str, employee_code: str, temp_password: str) -> str:
    """Send a welcome email with login credentials.

    Returns "sent", "disabled", or "failed".
    """
    if not settings.EMAILS_ENABLED:
        logger.info(
            "[EMAIL DISABLED] Would have sent welcome email to %s | code=%s | password=%s",
            to_email, employee_code, temp_password
        )
        return "disabled"

    subject = f"Welcome to {settings.EMAILS_FROM_NAME} — Your Login Credentials"

    html_body = f"""
    <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; padding: 32px; border: 1px solid #e2e8f0; border-radius: 12px;">
        <h2 style="color: #1e293b;">Welcome aboard, {full_name}! 🎉</h2>
        <p style="color: #475569;">Your account has been created on <strong>{settings.EMAILS_FROM_NAME}</strong>. Here are your login details:</p>

        <table style="width: 100%; background: #f8fafc; border-radius: 8px; padding: 16px; margin: 24px 0;">
            <tr>
                <td style="color: #64748b; padding: 6px 0;">Employee ID</td>
                <td style="font-weight: bold; color: #0f172a; letter-spacing: 1px;">{employee_code}</td>
            </tr>
            <tr>
                <td style="color: #64748b; padding: 6px 0;">Email</td>
                <td style="font-weight: bold; color: #0f172a;">{to_email}</td>
            </tr>
            <tr>
                <td style="color: #64748b; padding: 6px 0;">Temporary Password</td>
                <td style="font-weight: bold; color: #0f172a; font-family: monospace; font-size: 16px;">{temp_password}</td>
            </tr>
        </table>

        <p style="color: #ef4444; font-size: 13px;">⚠️ Please log in and change your password immediately.</p>

        <p style="color: #94a3b8; font-size: 12px; margin-top: 32px;">If you have any questions, contact your HR administrator.</p>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.EMAILS_FROM_NAME} <{settings.SMTP_USER}>"
    msg["To"] = to_email
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.ehlo()
            server.starttls()
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.SMTP_USER, to_email, msg.as_string())
        logger.info("Welcome email sent to %s", to_email)
        return "sent"
    except Exception as exc:
        logger.error("Failed to send welcome email to %s: %s", to_email, exc)
        return "failed"
