# landing_routes.py — Kore Data  v1.0
# =========================================================
# Routes for the new landing pages:
#   GET  /about
#   GET  /services
#   GET  /contact
#   POST /contact/submit
#
# Mount in main.py:
#   from landing_routes import landing_router
#   app.include_router(landing_router)
#
# DB TABLE (contact_messages) created automatically on startup
# via init_contact_table() — call from main.py lifespan.
# =========================================================

import logging
import smtplib
from datetime import datetime
from email.mime.text import MIMEText
from typing   import Optional

from fastapi           import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from pydantic          import BaseModel

from database import db_execute, db_fetchall, get_connection

logger = logging.getLogger(__name__)

landing_router = APIRouter(tags=["Landing"])


# ─── Template engine ──────────────────────────────────────────────────────────

import os
_BASE = os.path.dirname(os.path.abspath(__file__))
_TMPL = Jinja2Templates(directory=os.path.join(_BASE, "templates"))


# ─── Contact form schema ──────────────────────────────────────────────────────

class ContactMessage(BaseModel):
    name:    str
    email:   str
    company: Optional[str] = ""
    subject: Optional[str] = ""
    message: str


def _send_contact_email(name: str, email: str, company: str, message: str, ip: Optional[str]) -> None:
    smtp_host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    smtp_sender = os.environ.get("SMTP_SENDER", "")
    smtp_password = os.environ.get("SMTP_PASSWORD", "")

    if not smtp_sender or not smtp_password:
        raise RuntimeError("SMTP_SENDER and SMTP_PASSWORD are required")

    subject = f"KoreData contact form: {company or name}"
    body = (
        "New KoreData contact message\n\n"
        f"Name: {name}\n"
        f"Email: {email}\n"
        f"Company: {company or '-'}\n"
        f"IP Address: {ip or '-'}\n\n"
        f"Message:\n{message}\n"
    )

    msg = MIMEText(body, "plain")
    msg["Subject"] = subject
    msg["From"] = smtp_sender
    msg["To"] = smtp_sender
    msg["Reply-To"] = email

    with smtplib.SMTP(smtp_host, smtp_port, timeout=15) as server:
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(smtp_sender, smtp_password)
        server.sendmail(smtp_sender, [smtp_sender], msg.as_string())


# ─── DB bootstrap ─────────────────────────────────────────────────────────────

def init_contact_table() -> None:
    """Create contact_messages table if it doesn't exist."""
    conn = get_connection()
    cur  = conn.cursor()
    try:
        cur.execute("""
            CREATE TABLE IF NOT EXISTS contact_messages (
                id         INT          NOT NULL AUTO_INCREMENT,
                name       VARCHAR(100) NOT NULL,
                email      VARCHAR(100) NOT NULL,
                subject    VARCHAR(100) NULL DEFAULT NULL,
                message    TEXT         NOT NULL,
                ip_address VARCHAR(45)  NULL DEFAULT NULL,
                created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
                is_read    TINYINT(1)   NOT NULL DEFAULT 0,
                PRIMARY KEY (id),
                INDEX idx_cm_email (email),
                INDEX idx_cm_time  (created_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
              COMMENT='Contact form submissions from landing pages.'
        """)
        logger.info("[Landing] contact_messages table ready.")
    except Exception as exc:
        logger.warning("[Landing] Could not create contact_messages table: %s", exc)
    finally:
        cur.close()
        conn.close()


# ─── Page routes ──────────────────────────────────────────────────────────────

@landing_router.get("/about", response_class=HTMLResponse)
async def about_page(request: Request):
    """About page."""
    return _TMPL.TemplateResponse("about.html", {"request": request})


@landing_router.get("/services", response_class=HTMLResponse)
async def services_page(request: Request):
    """Services page."""
    return _TMPL.TemplateResponse("services.html", {"request": request})


@landing_router.get("/contact", response_class=HTMLResponse)
async def contact_page(request: Request):
    """Contact page."""
    return _TMPL.TemplateResponse("contact.html", {"request": request})


# ─── Contact form submission ──────────────────────────────────────────────────

@landing_router.post("/contact/submit")
async def contact_submit(body: ContactMessage, request: Request):
    """
    Store contact form submission in the DB.
    Returns 200 always so the frontend shows success animation.
    """
    name    = (body.name    or "").strip()[:100]
    email   = (body.email   or "").strip()[:100]
    company = (body.company or "").strip()[:100]
    subject = (body.subject or company or "Contact form").strip()[:100]
    message = (body.message or "").strip()[:2000]
    ip      = request.client.host if request.client else None

    if not name or not email or not message:
        return {"ok": False, "error": "Missing required fields"}

    if "@" not in email:
        return {"ok": False, "error": "Invalid email"}

    try:
        db_execute(
            "INSERT INTO contact_messages (name, email, subject, message, ip_address) "
            "VALUES (%s, %s, %s, %s, %s)",
            (name, email, subject, message, ip),
        )
        logger.info("[Landing] Contact form from: %s <%s>", name, email)
    except Exception as exc:
        # Log but still return success — never show DB errors to users
        logger.error("[Landing] contact_submit DB error: %s", exc)

    try:
        _send_contact_email(name, email, company, message, ip)
    except Exception as exc:
        logger.error("[Landing] contact_submit email error: %s", exc)
        return {
            "ok": False,
            "error": "We saved your message, but email delivery failed. Please try again shortly.",
        }

    return {
        "ok":      True,
        "message": "Thank you! We'll get back to you within 24 hours.",
    }


# ─── Admin: list contact messages (authenticated endpoint) ────────────────────
# Uncomment if you want an admin endpoint to read submissions.

# from fastapi import Header, HTTPException
# from database import db_fetchone

# @landing_router.get("/admin/contact-messages")
# def admin_contact_messages(authorization: Optional[str] = Header(None)):
#     if not authorization or not authorization.startswith("Bearer "):
#         raise HTTPException(status_code=401, detail="Not authorised")
#     token = authorization[7:]
#     user  = db_fetchone(
#         "SELECT login_id FROM sessions WHERE token=%s AND expires_at>NOW()", (token,)
#     )
#     if not user:
#         raise HTTPException(status_code=401, detail="Token invalid")
#     rows = db_fetchall(
#         "SELECT id, name, email, subject, created_at, is_read "
#         "FROM contact_messages ORDER BY created_at DESC LIMIT 100"
#     )
#     for r in rows:
#         r["created_at"] = str(r["created_at"])
#     return {"messages": rows, "total": len(rows)}
