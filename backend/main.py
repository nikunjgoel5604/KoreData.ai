# main.py — Kore_data-ex  v9.2
# =========================================================
# CHANGES vs v9.1
# ─────────────────────────────────────────────────────────
# FIX 1  Registration now ALWAYS sends an email OTP and the
#         account stays is_verified=0 (even if a password was
#         set at registration time) until the OTP is confirmed
#         via POST /auth/verify-otp. This matches the frontend
#         flow: Register -> Enter OTP -> Auto-login.
#
# FIX 2  _send_email_otp() now sends a branded HTML email
#         (KoreData-EX verification template) with a plain-text
#         fallback, instead of a bare plain-text message.
#
# Everything else is unchanged from v9.1.
# =========================================================

# ══ sys.path fix — MUST be before ALL imports ════════════
import sys as _sys, os as _os
_sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__)))
# ═════════════════════════════════════════════════════════

import os
import io
import time
import secrets
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
from typing import Optional

from dotenv import load_dotenv
# Load environment variables from absolute path
base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dotenv_path = os.path.join(base_dir, ".env")
load_dotenv(dotenv_path=dotenv_path, override=True)

# ─── Environment configuration defaults ───────────────────────────────────────
UPLOAD_FOLDER = os.environ.get("UPLOAD_FOLDER", os.path.join(base_dir, "storage"))
AI_KEYS       = os.environ.get("AI_KEYS", "")
JWT_KEYS      = os.environ.get("JWT_KEYS", os.environ.get("APP_SECRET", "super-secret-key-1234"))
MODEL_PATHS   = os.environ.get("MODEL_PATHS", os.path.join(base_dir, "models"))
LOGGING_LEVEL = os.environ.get("LOGGING_LEVEL", "INFO")

try:
    logging.getLogger().setLevel(LOGGING_LEVEL.upper())
except Exception:
    logging.getLogger().setLevel(logging.INFO)

logger = logging.getLogger(__name__)

from fastapi import FastAPI, UploadFile, File, Request, HTTPException, Header, Form
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import BaseModel
import pandas as pd

from database           import initialize_database, db_fetchone, db_fetchall, db_execute
from eda_engine         import perform_eda
import notification_engine as notif
from simulation_engine  import simulation_router
from activity_routes    import activity_router
from ml_routes          import ml_router
from account_routes     import account_router
from landing_routes     import landing_router, init_contact_table


# ─── Lifespan ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_database()
    init_contact_table()
    logger.info(
        "[Kore] v10.0 started — routers: simulation, activity, ml, account, landing"
        " | DEMO_MODE=%s", DEMO_MODE
    )
    yield
    logger.info("[Kore] Server shutting down.")


# ─── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(
    title       = "Kore_data-ex API",
    version     = "9.2",
    description = "End-to-end Data Intelligence & ML Recommendation Platform",
    lifespan    = lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

from fastapi import Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
import mysql.connector

@app.middleware("http")
async def log_requests_middleware(request: Request, call_next):
    start_time = time.time()
    path = request.url.path
    method = request.method
    
    auth = request.headers.get("Authorization")
    auth_status = "Authenticated" if auth else "Anonymous"
    
    is_static = path.startswith(("/static", "/favicon.ico", "/_next"))
    
    if not is_static:
        logger.info(f"[API REQ] Path: {path} | Method: {method} | Auth: {auth_status}")
    
    try:
        response = await call_next(request)
        duration_ms = (time.time() - start_time) * 1000
        if not is_static:
            logger.info(f"[API RES] Path: {path} | Status: {response.status_code} | Duration: {duration_ms:.2f}ms")
        return response
    except Exception as exc:
        duration_ms = (time.time() - start_time) * 1000
        logger.error(f"[API ERR] Path: {path} | Duration: {duration_ms:.2f}ms | Error: {exc}", exc_info=True)
        raise exc

@app.exception_handler(mysql.connector.Error)
async def mysql_exception_handler(request: Request, exc: mysql.connector.Error):
    logger.error(f"[DB GLOBAL EXCEPTION] Code: {exc.errno} | Message: {exc.msg}", exc_info=True)
    
    err_code = "DB_QUERY_FAILED"
    if exc.errno == 1054:
        err_code = "DB_SCHEMA_1054"
    elif exc.errno == 1146:
        err_code = "DB_SCHEMA_1146"
    elif exc.errno in (2002, 2003, 2006, 2013):
        err_code = "DB_CONNECTION_FAILED"
        
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": "Database query or connection failed.",
            "error_code": err_code
        }
    )

@app.exception_handler(StarletteHTTPException)
async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    logger.error(f"[HTTP EXCEPTION] Path: {request.url.path} | Code: {exc.status_code} | Message: {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail,
            "error_code": f"HTTP_{exc.status_code}"
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.error(f"[VALIDATION EXCEPTION] Path: {request.url.path} | Errors: {exc.errors()}")
    return JSONResponse(
        status_code=422,
        content={
            "success": False,
            "message": "Validation Error",
            "error_code": "VALIDATION_ERROR",
            "details": exc.errors()
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"[UNHANDLED EXCEPTION] Path: {request.url.path} | Error: {exc}", exc_info=True)
    err_msg = str(exc)
    err_code = "INTERNAL_SERVER_ERROR"
    
    if "Unknown column" in err_msg:
        err_code = "DB_SCHEMA_1054"
    elif "doesn't exist" in err_msg:
        err_code = "DB_SCHEMA_1146"
        
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "message": err_msg.split("\n")[0] if err_msg else "An unexpected error occurred.",
            "error_code": err_code
        }
    )

from fastapi import APIRouter

projects_router = APIRouter(prefix="/projects", tags=["Projects"])
workspace_router = APIRouter(prefix="/workspace", tags=["Workspace"])
dataset_router = APIRouter(tags=["Datasets"])
eda_router = APIRouter(tags=["EDA"])
visualization_router = APIRouter(prefix="/visualizations", tags=["Visualizations"])
prediction_router = APIRouter(prefix="/prediction", tags=["Prediction"])
reports_router = APIRouter(prefix="/reports", tags=["Reports"])
export_router = APIRouter(prefix="/export", tags=["Export"])
ai_router = APIRouter(prefix="/ai", tags=["AI"])
notification_router = APIRouter(prefix="/notifications", tags=["Notifications"])


# ─── Static & Templates ───────────────────────────────────────────────────────
BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR  = os.path.join(BASE_DIR, "static")
TMPL_DIR    = os.path.join(BASE_DIR, "templates")
STORAGE_DIR = os.path.join(BASE_DIR, "storage")
EDA_DIR     = os.path.join(STORAGE_DIR, "eda")
REPORTS_DIR = os.path.join(STORAGE_DIR, "reports")

for _d, _name in [
    (STATIC_DIR, "backend/static"),
    (TMPL_DIR, "backend/templates"),
    (STORAGE_DIR, "backend/storage"),
    (EDA_DIR, "backend/storage/eda"),
    (REPORTS_DIR, "backend/storage/reports"),
]:
    if not os.path.isdir(_d):
        os.makedirs(_d, exist_ok=True)
        logger.info("[Kore] Created directory: %s", _d)

if os.path.isdir(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

templates = Jinja2Templates(directory=TMPL_DIR) if os.path.isdir(TMPL_DIR) else None


# ─── OTP / SMTP config ────────────────────────────────────────────────────────

DEMO_MODE      = os.environ.get("DEMO_MODE", "false").lower() == "true"
OTP_EXPIRY_MIN = int(os.environ.get("OTP_EXPIRY_MINUTES", "10"))
SMTP_HOST      = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT      = int(os.environ.get("SMTP_PORT", "587"))
SMTP_SENDER    = os.environ.get("SMTP_SENDER", "")
SMTP_PASSWORD  = os.environ.get("SMTP_PASSWORD", "")
SUPPORT_EMAIL  = os.environ.get("SUPPORT_EMAIL", "koredata.ai@gmail.com")
SITE_URL       = os.environ.get("SITE_URL", "https://koredata.ai")


def _generate_otp() -> str:
    return str(secrets.randbelow(900000) + 100000)


# ── Branded HTML OTP email (KoreData-EX verification template) ───────────────

def _build_otp_email_html(otp: str, first_name: str = "") -> str:
    greeting = f"Hello {first_name}," if first_name else "Hello,"
    return f"""\
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Verify Your Email Address | KoreData-EX</title>
</head>
<body style="margin:0;padding:0;background-color:#000814;font-family:'DM Sans',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="background-color:#000814;padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
               style="max-width:560px;background-color:#03101f;border:1px solid rgba(0,212,255,0.25);
                      border-radius:12px;overflow:hidden;">

          <!-- Header / Logo -->
          <tr>
            <td align="center" style="padding:32px 24px 16px;">
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <span style="display:inline-block;width:40px;height:40px;line-height:40px;
                             text-align:center;border:1px solid #00d4ff;border-radius:8px;
                             color:#00d4ff;font-family:'DM Mono',Consolas,monospace;font-weight:800;">
                  K∂
                </span>
                <span style="font-family:Arial,sans-serif;font-weight:800;letter-spacing:2px;
                             text-transform:uppercase;color:#d9f3ff;font-size:20px;">
                  Kore<span style="color:#00d4ff;">Data</span>-EX
                </span>
              </div>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td align="center" style="padding:0 24px 8px;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.02em;">
                Verify Your Email Address
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:16px 32px 0;color:#9fc9de;font-size:14px;line-height:1.7;">
              <p style="margin:0 0 12px;">{greeting}</p>
              <p style="margin:0 0 12px;">
                Welcome to <strong style="color:#d9f3ff;">KoreData-EX</strong>!
              </p>
              <p style="margin:0 0 12px;">
                Thank you for creating your account. To complete your registration and secure
                your account, please verify your email address using the One-Time Password (OTP) below.
              </p>
            </td>
          </tr>

          <!-- OTP box -->
          <tr>
            <td align="center" style="padding:24px 24px 8px;">
              <div style="color:#7ab8d4;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;
                          margin-bottom:10px;font-family:'DM Mono',Consolas,monospace;">
                Your Verification Code
              </div>
              <div style="display:inline-block;padding:16px 36px;background:rgba(0,212,255,0.08);
                          border:1px solid rgba(0,212,255,0.4);border-radius:10px;
                          color:#00d4ff;font-size:34px;font-weight:800;letter-spacing:10px;
                          font-family:'DM Mono',Consolas,monospace;">
                {otp}
              </div>
              <div style="color:#658ba0;font-size:12px;margin-top:12px;">
                This verification code is valid for {OTP_EXPIRY_MIN} minutes.
              </div>
            </td>
          </tr>

          <!-- Security note -->
          <tr>
            <td style="padding:24px 32px 0;color:#9fc9de;font-size:13px;line-height:1.7;">
              <p style="margin:0 0 8px;font-weight:700;color:#d9f3ff;">For your security:</p>
              <ul style="margin:0 0 12px;padding-left:18px;">
                <li>Do not share this code with anyone.</li>
                <li>KoreData-EX will never ask for your OTP via phone, email, or social media.</li>
                <li>If you did not request this verification, you can safely ignore this email.</li>
              </ul>
              <p style="margin:0 0 12px;">
                Once verified, you'll be able to access the full KoreData-EX platform and begin
                exploring AI-powered data analytics.
              </p>
              <p style="margin:0 0 4px;">If you need assistance, feel free to contact us.</p>
              <p style="margin:0 0 4px;">📧 Email: <a href="mailto:{SUPPORT_EMAIL}" style="color:#00d4ff;text-decoration:none;">{SUPPORT_EMAIL}</a></p>
              <p style="margin:0 0 16px;">🌐 Website: <a href="{SITE_URL}" style="color:#00d4ff;text-decoration:none;">{SITE_URL}</a></p>
            </td>
          </tr>

          <!-- Sign-off -->
          <tr>
            <td style="padding:0 32px 24px;color:#9fc9de;font-size:13px;line-height:1.7;">
              <p style="margin:0 0 4px;">Thank you for choosing KoreData-EX.</p>
              <p style="margin:0 0 4px;color:#00ff88;font-weight:700;">Transform Data Into Intelligence</p>
              <p style="margin:0;color:#658ba0;">KoreData-EX Team</p>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 32px 24px;border-top:1px solid rgba(0,212,255,0.15);">
              <p style="margin:0;color:#5b7a8c;font-size:11px;">
                This is an automated email. Please do not reply directly to this message.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:16px 24px 28px;background:rgba(0,212,255,0.04);">
              <p style="margin:0;color:#5b7a8c;font-size:11px;letter-spacing:0.5px;">
                © 2026 KoreData-EX. All Rights Reserved.<br/>
                Transform Data Into Intelligence
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


def _build_otp_email_text(otp: str, first_name: str = "") -> str:
    greeting = f"Hello {first_name}," if first_name else "Hello,"
    return (
        f"Verify Your Email Address | KoreData-EX\n\n"
        f"{greeting}\n\n"
        f"Welcome to KoreData-EX!\n\n"
        f"Thank you for creating your account. To complete your registration and secure your "
        f"account, please verify your email address using the One-Time Password (OTP) below.\n\n"
        f"Your Verification Code: {otp}\n\n"
        f"This verification code is valid for {OTP_EXPIRY_MIN} minutes.\n\n"
        f"For your security:\n"
        f"- Do not share this code with anyone.\n"
        f"- KoreData-EX will never ask for your OTP via phone, email, or social media.\n"
        f"- If you did not request this verification, you can safely ignore this email.\n\n"
        f"Once verified, you'll be able to access the full KoreData-EX platform and begin "
        f"exploring AI-powered data analytics.\n\n"
        f"If you need assistance, feel free to contact us.\n"
        f"Email: {SUPPORT_EMAIL}\n"
        f"Website: {SITE_URL}\n\n"
        f"Thank you for choosing KoreData-EX.\n"
        f"Transform Data Into Intelligence\n"
        f"KoreData-EX Team\n\n"
        f"This is an automated email. Please do not reply directly to this message.\n"
        f"© 2026 KoreData-EX. All Rights Reserved."
    )


def _send_html_email(to_address: str, subject: str, html_body: str, text_body: str) -> None:
    """Low-level branded-email sender shared by every OTP email in the app."""
    if not SMTP_SENDER or not SMTP_PASSWORD:
        raise HTTPException(
            status_code=500,
            detail="Email service not configured. Set SMTP_SENDER and SMTP_PASSWORD in .env",
        )

    msg            = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = f"KoreData-EX <{SMTP_SENDER}>"
    msg["To"]      = to_address

    msg.attach(MIMEText(text_body, "plain"))
    msg.attach(MIMEText(html_body, "html"))

    try:
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as server:
            server.ehlo()
            server.starttls()
            server.ehlo()
            server.login(SMTP_SENDER, SMTP_PASSWORD)
            server.sendmail(SMTP_SENDER, [to_address], msg.as_string())
    except smtplib.SMTPAuthenticationError:
        raise HTTPException(status_code=500, detail="SMTP authentication failed.")
    except smtplib.SMTPException as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {e}")


def _send_email_otp(to_address: str, otp: str, first_name: str = "") -> None:
    _send_html_email(
        to_address,
        "Verify Your Email Address | KoreData-EX",
        _build_otp_email_html(otp, first_name),
        _build_otp_email_text(otp, first_name),
    )


# ── Forgot Password / Forgot Login ID email ───────────────────────────────────
# Same branded look as the verification email, but this one also reveals the
# person's Login ID (since they may have forgotten that too), alongside the
# password-reset OTP.

def _build_forgot_password_email_html(otp: str, login_id: str, first_name: str = "") -> str:
    greeting = f"Hello {first_name}," if first_name else "Hello,"
    return f"""\
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Reset Your Password | KoreData-EX</title>
</head>
<body style="margin:0;padding:0;background-color:#000814;font-family:'DM Sans',Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="background-color:#000814;padding:32px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
               style="max-width:560px;background-color:#03101f;border:1px solid rgba(0,212,255,0.25);
                      border-radius:12px;overflow:hidden;">

          <!-- Header / Logo -->
          <tr>
            <td align="center" style="padding:32px 24px 16px;">
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <span style="display:inline-block;width:40px;height:40px;line-height:40px;
                             text-align:center;border:1px solid #00d4ff;border-radius:8px;
                             color:#00d4ff;font-family:'DM Mono',Consolas,monospace;font-weight:800;">
                  K∂
                </span>
                <span style="font-family:Arial,sans-serif;font-weight:800;letter-spacing:2px;
                             text-transform:uppercase;color:#d9f3ff;font-size:20px;">
                  Kore<span style="color:#00d4ff;">Data</span>-EX
                </span>
              </div>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td align="center" style="padding:0 24px 8px;">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:800;letter-spacing:-0.02em;">
                Reset Your Password
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:16px 32px 0;color:#9fc9de;font-size:14px;line-height:1.7;">
              <p style="margin:0 0 12px;">{greeting}</p>
              <p style="margin:0 0 12px;">
                We received a request to recover your <strong style="color:#d9f3ff;">KoreData-EX</strong>
                account access. Here are your account details and a one-time code to reset your password.
              </p>
            </td>
          </tr>

          <!-- Login ID box -->
          <tr>
            <td align="center" style="padding:16px 24px 0;">
              <div style="color:#7ab8d4;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;
                          margin-bottom:8px;font-family:'DM Mono',Consolas,monospace;">
                Your Login ID
              </div>
              <div style="display:inline-block;padding:10px 28px;background:rgba(0,255,136,0.08);
                          border:1px solid rgba(0,255,136,0.35);border-radius:8px;
                          color:#00ff88;font-size:20px;font-weight:800;letter-spacing:3px;
                          font-family:'DM Mono',Consolas,monospace;">
                {login_id}
              </div>
            </td>
          </tr>

          <!-- OTP box -->
          <tr>
            <td align="center" style="padding:24px 24px 8px;">
              <div style="color:#7ab8d4;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;
                          margin-bottom:10px;font-family:'DM Mono',Consolas,monospace;">
                Password Reset Code
              </div>
              <div style="display:inline-block;padding:16px 36px;background:rgba(0,212,255,0.08);
                          border:1px solid rgba(0,212,255,0.4);border-radius:10px;
                          color:#00d4ff;font-size:34px;font-weight:800;letter-spacing:10px;
                          font-family:'DM Mono',Consolas,monospace;">
                {otp}
              </div>
              <div style="color:#658ba0;font-size:12px;margin-top:12px;">
                This code is valid for {OTP_EXPIRY_MIN} minutes.
              </div>
            </td>
          </tr>

          <!-- Security note -->
          <tr>
            <td style="padding:24px 32px 0;color:#9fc9de;font-size:13px;line-height:1.7;">
              <p style="margin:0 0 8px;font-weight:700;color:#d9f3ff;">For your security:</p>
              <ul style="margin:0 0 12px;padding-left:18px;">
                <li>Do not share your Login ID or this code with anyone.</li>
                <li>KoreData-EX will never ask for your OTP via phone, email, or social media.</li>
                <li>If you did not request this, you can safely ignore this email — your password will not change.</li>
              </ul>
              <p style="margin:0 0 4px;">If you need assistance, feel free to contact us.</p>
              <p style="margin:0 0 4px;">📧 Email: <a href="mailto:{SUPPORT_EMAIL}" style="color:#00d4ff;text-decoration:none;">{SUPPORT_EMAIL}</a></p>
              <p style="margin:0 0 16px;">🌐 Website: <a href="{SITE_URL}" style="color:#00d4ff;text-decoration:none;">{SITE_URL}</a></p>
            </td>
          </tr>

          <!-- Sign-off -->
          <tr>
            <td style="padding:0 32px 24px;color:#9fc9de;font-size:13px;line-height:1.7;">
              <p style="margin:0 0 4px;">Thank you for choosing KoreData-EX.</p>
              <p style="margin:0 0 4px;color:#00ff88;font-weight:700;">Transform Data Into Intelligence</p>
              <p style="margin:0;color:#658ba0;">KoreData-EX Team</p>
            </td>
          </tr>

          <tr>
            <td style="padding:16px 32px 24px;border-top:1px solid rgba(0,212,255,0.15);">
              <p style="margin:0;color:#5b7a8c;font-size:11px;">
                This is an automated email. Please do not reply directly to this message.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding:16px 24px 28px;background:rgba(0,212,255,0.04);">
              <p style="margin:0;color:#5b7a8c;font-size:11px;letter-spacing:0.5px;">
                © 2026 KoreData-EX. All Rights Reserved.<br/>
                Transform Data Into Intelligence
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
"""


def _build_forgot_password_email_text(otp: str, login_id: str, first_name: str = "") -> str:
    greeting = f"Hello {first_name}," if first_name else "Hello,"
    return (
        f"Reset Your Password | KoreData-EX\n\n"
        f"{greeting}\n\n"
        f"We received a request to recover your KoreData-EX account access.\n\n"
        f"Your Login ID: {login_id}\n"
        f"Your Password Reset Code: {otp}\n\n"
        f"This code is valid for {OTP_EXPIRY_MIN} minutes.\n\n"
        f"For your security:\n"
        f"- Do not share your Login ID or this code with anyone.\n"
        f"- KoreData-EX will never ask for your OTP via phone, email, or social media.\n"
        f"- If you did not request this, you can safely ignore this email — your password will not change.\n\n"
        f"If you need assistance, feel free to contact us.\n"
        f"Email: {SUPPORT_EMAIL}\n"
        f"Website: {SITE_URL}\n\n"
        f"Thank you for choosing KoreData-EX.\n"
        f"Transform Data Into Intelligence\n"
        f"KoreData-EX Team\n\n"
        f"This is an automated email. Please do not reply directly to this message.\n"
        f"© 2026 KoreData-EX. All Rights Reserved."
    )


def _send_forgot_password_email(to_address: str, otp: str, login_id: str, first_name: str = "") -> None:
    _send_html_email(
        to_address,
        "Reset Your Password | KoreData-EX",
        _build_forgot_password_email_html(otp, login_id, first_name),
        _build_forgot_password_email_text(otp, login_id, first_name),
    )


def _store_otp(login_id: str, otp: str, method: str, contact: str, purpose: str = "login") -> None:
    db_execute(
        "UPDATE otp_tokens SET is_used = 1 WHERE login_id = %s AND purpose = %s AND is_used = 0",
        (login_id, purpose),
    )
    expires = datetime.now() + timedelta(minutes=OTP_EXPIRY_MIN)
    db_execute(
        "INSERT INTO otp_tokens (login_id, otp_code, method, contact, purpose, expires_at) "
        "VALUES (%s, %s, %s, %s, %s, %s)",
        (login_id, otp, method, contact, purpose, expires),
    )


# ─── Session helpers ──────────────────────────────────────────────────────────

def make_session_token(login_id: str) -> str:
    token   = secrets.token_hex(32)
    expires = datetime.now() + timedelta(days=30)
    db_execute(
        "INSERT INTO sessions (token, login_id, expires_at) VALUES (%s, %s, %s)",
        (token, login_id, expires),
    )
    return token


def get_user_from_token(token: str) -> Optional[dict]:
    return db_fetchone(
        "SELECT u.* FROM sessions s "
        "JOIN kore_users u ON u.login_id = s.login_id "
        "WHERE s.token = %s AND s.expires_at > NOW()",
        (token,),
    )


def _require_auth(authorization: Optional[str]) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing or malformed Authorization header")
    user = get_user_from_token(authorization[7:])
    if not user:
        raise HTTPException(status_code=401, detail="Token invalid or expired")
    return user


# ─── Pydantic models ──────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    first_name: str
    last_name:  str = ""
    email:      str
    phone:      str
    password:   str = ""
    otp_method: str = "email"

class LoginRequestBody(BaseModel):
    identifier: str = ""
    contact:    str = ""
    otp_method: str = "email"

class VerifyOTPRequest(BaseModel):
    login_id: str
    otp_code: str

class ResendOTPRequest(BaseModel):
    login_id: str

class SetPasswordRequest(BaseModel):
    login_id: str
    password: str

class PasswordLoginRequest(BaseModel):
    identifier: str
    password:   str

class ResetPasswordRequest(BaseModel):
    login_id:     str
    new_password: str

class ForgotCheckRequest(BaseModel):
    login_id: str

class ForgotSendOTPRequest(BaseModel):
    login_id: str
    method:   str = "email"
    contact:  str

class ForgotVerifyOTPRequest(BaseModel):
    login_id: str
    otp_code: str

# ── Email-first "Forgot Password / Forgot Login ID" flow ─────────────────────
# The person only needs to remember their email. The OTP email itself
# reveals their Login ID, and after OTP verification they can set a
# brand-new password — covering both "forgot password" and "forgot ID".

class ForgotByEmailSendOTPRequest(BaseModel):
    email: str

class ForgotByEmailVerifyOTPRequest(BaseModel):
    email:    str
    otp_code: str

class ForgotByEmailResetRequest(BaseModel):
    email:        str
    otp_code:     str
    new_password: str

class CodeRunRequest(BaseModel):
    code:    str
    dataset: Optional[dict] = None

class DatasetVersionRequest(BaseModel):
    version: str
    columns: Optional[list] = None
    rows:    Optional[list] = None

class DatasetEditRequest(BaseModel):
    rows:    list
    columns: list

class ApplyMissingRequest(BaseModel):
    column:   str
    strategy: str
    rows:     list
    columns:  list


class ProjectCreateRequest(BaseModel):
    name:         str
    description:  Optional[str] = ""
    project_type: Optional[str] = "Standard"
    industry:     Optional[str] = "General"
    visibility:   Optional[str] = "private"
    color_theme:  Optional[str] = "blue"
    icon:         Optional[str] = "folder"

class ProjectUpdateRequest(BaseModel):
    name:                   Optional[str] = None
    description:            Optional[str] = None
    project_type:           Optional[str] = None
    industry:               Optional[str] = None
    visibility:             Optional[str] = None
    color_theme:            Optional[str] = None
    icon:                   Optional[str] = None
    is_favorite:            Optional[int] = None
    is_archived:            Optional[int] = None
    active_dataset:         Optional[str] = None
    active_model:           Optional[str] = None
    current_pipeline_stage: Optional[str] = None

class ProjectShareRequest(BaseModel):
    email: str
    role:  str = "Viewer"

class WorkspaceSaveRequest(BaseModel):
    active_project_id:       Optional[str] = None
    active_dataset_id:       Optional[int] = None
    active_model_id:         Optional[int] = None
    current_module:          Optional[str] = None
    current_page:            Optional[str] = None
    current_chart:           Optional[str] = None
    last_pipeline_step:      Optional[str] = None
    eda_result:              Optional[str] = None
    active_panels:           Optional[str] = None
    selected_panel:          Optional[str] = None
    sim_running:             int           = 0
    current_stage_key:       Optional[str] = None
    sim_progress:            int           = 0
    stage_statuses:          Optional[str] = None
    logs:                    Optional[str] = None
    open_tabs_json:          Optional[str] = None
    active_tab_id:           Optional[str] = None
    workspace_settings_json: Optional[str] = None
    workspace_history_json:  Optional[str] = None



# ─── Performance monitor ──────────────────────────────────────────────────────

class PerformanceMonitor:
    def __init__(self):
        self.metrics:    dict            = {}
        self.start_time: Optional[float] = None

    def start(self) -> None:
        self.start_time = time.time()

    def log_stage(self, stage_name: str) -> None:
        if self.start_time is None:
            return
        self.metrics[stage_name] = {
            "duration_ms": round((time.time() - self.start_time) * 1000, 2),
            "timestamp":   datetime.now().isoformat(),
        }

    def get_total_time(self) -> float:
        if self.start_time is None:
            return 0.0
        return round((time.time() - self.start_time) * 1000, 2)


# ─── Health (single definition — required by railway.json) ───────────────────

@app.get("/health")
def health_check():
    """Railway / Docker healthcheck. Expanded to include detailed db, pool, and storage telemetry."""
    from database import get_db_health_status
    import time
    
    db_stats = {}
    try:
        db_stats = get_db_health_status()
    except Exception as exc:
        logger.error(f"[HEALTH] Failed to fetch db stats: {exc}")
        db_stats = {"status": "unhealthy", "error": str(exc)}
        
    return {
        "status": "ok" if db_stats.get("status") == "healthy" else "degraded",
        "app_version": "10.0",
        "mysql_version": db_stats.get("mysql_version", "Unknown"),
        "schema_version": db_stats.get("schema_version", 0),
        "database_size_mb": db_stats.get("database_size_mb", 0.0),
        "connection_pool": db_stats.get("pool", {}),
        "storage": db_stats.get("storage", {}),
        "server_time": time.strftime("%Y-%m-%d %H:%M:%S"),
        "app_uptime_sec": db_stats.get("uptime_sec", 0),
        "service": "kore-data-ex",
    }


@app.get("/version")
def version_info():
    import sys, platform
    return {
        "app":      "Kore_data-ex",
        "version":  "9.2",
        "python":   sys.version,
        "platform": platform.system(),
    }


# ─── Page routes ──────────────────────────────────────────────────────────────

@app.get("/", response_class=HTMLResponse)
async def index(request: Request):
    if templates is None:
        return HTMLResponse("<h1>Templates not found.</h1>", status_code=500)
    return templates.TemplateResponse("index.html", {"request": request})


@app.get("/home", response_class=HTMLResponse)
async def home(request: Request):
    if templates is None:
        return HTMLResponse("<h1>Templates not found.</h1>", status_code=500)
    return templates.TemplateResponse("home.html", {"request": request})


# ─── Auth routes ──────────────────────────────────────────────────────────────

@app.post("/auth/register")
def register(body: RegisterRequest):
    """
    Registration ALWAYS requires email OTP verification before the account
    becomes usable — even if the person sets a password during registration.

    Flow:
      1. Create the kore_users row with is_verified = 0
         (password_hash is stored now if provided, but login is blocked
         until OTP verification via /auth/verify-otp).
      2. Generate + store an OTP (purpose='register') and email it using
         the branded KoreData-EX HTML template.
      3. Frontend shows the OTP entry step, then calls /auth/verify-otp,
         which marks is_verified=1 and returns a session token (auto-login).
    """
    password = body.password.strip()
    if password and len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    # Check email and phone separately so the person gets a specific,
    # accurate message instead of a generic "one of these is taken".
    existing_email = db_fetchone(
        "SELECT login_id FROM kore_users WHERE email = %s", (body.email,)
    )
    if existing_email:
        raise HTTPException(
            status_code=409,
            detail="This email is already used. Please login or use Forgot Password.",
        )

    existing_phone = db_fetchone(
        "SELECT login_id FROM kore_users WHERE phone = %s", (body.phone,)
    )
    if existing_phone:
        raise HTTPException(
            status_code=409,
            detail="This phone number is already used. Please use a different number or login.",
        )

    login_id = "KD" + str(secrets.randbelow(900000) + 100000)
    while db_fetchone("SELECT 1 FROM kore_users WHERE login_id = %s", (login_id,)):
        login_id = "KD" + str(secrets.randbelow(900000) + 100000)

    if password:
        db_execute(
            "INSERT INTO kore_users (login_id, first_name, last_name, email, phone, password_hash, is_verified) "
            "VALUES (%s, %s, %s, %s, %s, %s, 0)",
            (login_id, body.first_name, body.last_name, body.email, body.phone, _hash_password(password)),
        )
    else:
        db_execute(
            "INSERT INTO kore_users (login_id, first_name, last_name, email, phone) "
            "VALUES (%s, %s, %s, %s, %s)",
            (login_id, body.first_name, body.last_name, body.email, body.phone),
        )

    otp = _generate_otp()
    _store_otp(login_id, otp, "email", body.email, purpose="register")

    demo_otp = None
    if DEMO_MODE:
        demo_otp = otp
    else:
        _send_email_otp(body.email, otp, body.first_name)

    return {
        "login_id":     login_id,
        "sent_to":      body.email,
        "requires_otp": True,
        "message":      "Account created. Enter the OTP sent to your email to verify and continue.",
        **({"demo_otp": demo_otp} if demo_otp else {}),
    }


@app.post("/auth/login-request")
def login_request(body: LoginRequestBody):
    identifier = body.identifier.strip() or body.contact.strip()
    if not identifier:
        raise HTTPException(status_code=400, detail="Provide login_id, email, or phone")

    user = (
        db_fetchone("SELECT * FROM kore_users WHERE login_id = %s", (identifier,))
        or db_fetchone("SELECT * FROM kore_users WHERE email = %s",  (identifier,))
        or db_fetchone("SELECT * FROM kore_users WHERE phone = %s",  (identifier,))
    )
    if not user:
        raise HTTPException(status_code=404, detail="No account found with that identifier")

    otp = _generate_otp()
    _store_otp(user["login_id"], otp, "email", user["email"], purpose="login")

    demo_otp = None
    if DEMO_MODE:
        demo_otp = otp
    else:
        _send_email_otp(user["email"], otp, user.get("first_name", ""))

    return {
        "login_id": user["login_id"],
        "sent_to":  user["email"],
        **({"demo_otp": demo_otp} if demo_otp else {}),
    }


@app.post("/auth/verify-otp")
def verify_otp(body: VerifyOTPRequest):
    otp_row = db_fetchone(
        "SELECT * FROM otp_tokens "
        "WHERE login_id = %s AND otp_code = %s "
        "AND is_used = 0 AND expires_at > NOW() "
        "ORDER BY id DESC LIMIT 1",
        (body.login_id, body.otp_code),
    )
    if not otp_row:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    db_execute("UPDATE otp_tokens SET is_used = 1 WHERE id = %s", (otp_row["id"],))
    db_execute("UPDATE kore_users SET is_verified = 1 WHERE login_id = %s", (body.login_id,))

    user  = db_fetchone("SELECT * FROM kore_users WHERE login_id = %s", (body.login_id,))
    token = make_session_token(body.login_id)

    try:
        notif.create_notification(
            body.login_id,
            f"Welcome to Kore, {user['first_name']}! Upload your first dataset to get started.",
            notif.TYPE_SUCCESS,
            "upload",
        )
    except Exception:
        pass

    return {
        "token":     token,
        "login_id":  user["login_id"],
        "user_id":   user["login_id"],
        "full_name": f"{user['first_name']} {user['last_name']}".strip(),
        "email":     user["email"],
    }


@app.post("/auth/resend-otp")
def resend_otp(body: ResendOTPRequest):
    user = db_fetchone("SELECT * FROM kore_users WHERE login_id = %s", (body.login_id,))
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    last_otp = db_fetchone(
        "SELECT method, contact FROM otp_tokens "
        "WHERE login_id = %s ORDER BY id DESC LIMIT 1",
        (body.login_id,),
    )
    method  = last_otp["method"]  if last_otp else "email"
    contact = last_otp["contact"] if last_otp else user["email"]

    if method == "phone" and not DEMO_MODE:
        raise HTTPException(status_code=501, detail="SMS OTP is not yet available.")

    otp = _generate_otp()
    _store_otp(body.login_id, otp, method, contact)

    demo_otp = None
    if DEMO_MODE:
        demo_otp = otp
    else:
        _send_email_otp(contact, otp, user.get("first_name", ""))

    return {"message": "OTP resent", **({"demo_otp": demo_otp} if demo_otp else {})}


@app.post("/auth/logout")
def logout(authorization: Optional[str] = Header(None)):
    if authorization and authorization.startswith("Bearer "):
        db_execute("DELETE FROM sessions WHERE token = %s", (authorization[7:],))
    return {"message": "Logged out successfully"}


@app.get("/auth/verify")
def verify_token(authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)
    return {
        "valid":    True,
        "login_id": user["login_id"],
        "name":     f"{user['first_name']} {user['last_name']}".strip(),
        "email":    user["email"],
    }


# ─── Password auth routes ─────────────────────────────────────────────────────

import bcrypt as _bcrypt


def _hash_password(plain: str) -> str:
    return _bcrypt.hashpw(plain.encode(), _bcrypt.gensalt(rounds=12)).decode()


def _verify_password(plain: str, hashed: str) -> bool:
    try:
        return _bcrypt.checkpw(plain.encode(), hashed.encode())
    except Exception:
        return False


@app.post("/auth/set-password")
def set_password(body: SetPasswordRequest):
    if not body.password or len(body.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")
    user = db_fetchone(
        "SELECT login_id, is_verified FROM kore_users WHERE login_id = %s", (body.login_id,)
    )
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    if not user["is_verified"]:
        raise HTTPException(status_code=403, detail="Account not verified. Verify OTP first.")
    db_execute(
        "UPDATE kore_users SET password_hash = %s WHERE login_id = %s",
        (_hash_password(body.password), body.login_id),
    )
    return {"ok": True, "message": "Password set successfully."}


@app.post("/auth/password-login")
def password_login(body: PasswordLoginRequest):
    identifier = body.identifier.strip()
    user = (
        db_fetchone("SELECT * FROM kore_users WHERE login_id = %s", (identifier,))
        or db_fetchone("SELECT * FROM kore_users WHERE email = %s",  (identifier,))
    )
    if not user:
        raise HTTPException(status_code=401, detail="Login ID not found. Please check and try again.")

    if not user.get("is_verified"):
        raise HTTPException(
            status_code=403,
            detail="Account not verified yet. Please complete the email OTP verification first.",
        )

    pw_hash = user.get("password_hash")
    if not pw_hash:
        raise HTTPException(status_code=400, detail="No password set. Use OTP login or Forgot Password.")
    if not _verify_password(body.password, pw_hash):
        raise HTTPException(status_code=401, detail="Incorrect password. Please try again.")
    token = make_session_token(user["login_id"])
    return {
        "token":     token,
        "login_id":  user["login_id"],
        "user_id":   user["login_id"],
        "full_name": f"{user['first_name']} {user['last_name']}".strip(),
        "email":     user["email"],
    }


@app.post("/auth/forgot/send-otp")
def forgot_by_email_send_otp(body: ForgotByEmailSendOTPRequest):
    """
    Step 1 of the "Forgot Password / Forgot Login ID" flow.
    The person only needs their email. We look up the account, generate
    a reset OTP, and email it together with their Login ID — so the
    email itself recovers their forgotten ID as well as unlocking the
    password reset.
    """
    email = body.email.strip()
    user  = db_fetchone("SELECT * FROM kore_users WHERE email = %s", (email,))
    if not user:
        raise HTTPException(status_code=404, detail="No account found with that email address.")

    otp = _generate_otp()
    _store_otp(user["login_id"], otp, "email", email, purpose="reset_password")

    demo_otp = None
    if DEMO_MODE:
        demo_otp = otp
    else:
        _send_forgot_password_email(email, otp, user["login_id"], user.get("first_name", ""))

    return {
        "ok":      True,
        "sent_to": email,
        "message": "If an account exists for this email, a Login ID reminder and reset code have been sent.",
        **({"demo_otp": demo_otp, "demo_login_id": user["login_id"]} if demo_otp else {}),
    }


@app.post("/auth/forgot/verify-otp")
def forgot_by_email_verify_otp(body: ForgotByEmailVerifyOTPRequest):
    """
    Step 2: verify the OTP from the email. On success we reveal the
    Login ID in the API response too (the person already has it in
    their inbox, this just mirrors it in the UI) and unlock step 3.
    """
    email = body.email.strip()
    user  = db_fetchone("SELECT login_id, first_name FROM kore_users WHERE email = %s", (email,))
    if not user:
        raise HTTPException(status_code=404, detail="No account found with that email address.")

    otp_row = db_fetchone(
        "SELECT * FROM otp_tokens "
        "WHERE login_id = %s AND otp_code = %s AND purpose = 'reset_password' "
        "AND is_used = 0 AND expires_at > NOW() "
        "ORDER BY id DESC LIMIT 1",
        (user["login_id"], body.otp_code),
    )
    if not otp_row:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP. Please request a new one.")

    db_execute("UPDATE otp_tokens SET is_used = 1 WHERE id = %s", (otp_row["id"],))

    return {
        "ok":       True,
        "login_id": user["login_id"],
        "message":  "OTP verified. Your Login ID has been recovered — you can now set a new password.",
    }


@app.post("/auth/forgot/reset-password")
def forgot_by_email_reset_password(body: ForgotByEmailResetRequest):
    """
    Step 3: set the new password. Requires the same OTP that was just
    verified in step 2 (it stays valid — but consumed — until it
    expires), so this endpoint can't be called without having gone
    through the email + OTP verification first.
    """
    if not body.new_password or len(body.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    email = body.email.strip()
    user  = db_fetchone("SELECT login_id FROM kore_users WHERE email = %s", (email,))
    if not user:
        raise HTTPException(status_code=404, detail="No account found with that email address.")

    otp_row = db_fetchone(
        "SELECT * FROM otp_tokens "
        "WHERE login_id = %s AND otp_code = %s AND purpose = 'reset_password' "
        "AND is_used = 1 AND expires_at > NOW() "
        "ORDER BY id DESC LIMIT 1",
        (user["login_id"], body.otp_code),
    )
    if not otp_row:
        raise HTTPException(
            status_code=400,
            detail="Your verification has expired. Please restart the Forgot Password process.",
        )

    db_execute(
        "UPDATE kore_users SET password_hash = %s WHERE login_id = %s",
        (_hash_password(body.new_password), user["login_id"]),
    )
    # Invalidate this OTP fully so it can't be replayed for another reset.
    db_execute(
        "UPDATE otp_tokens SET expires_at = NOW() WHERE id = %s",
        (otp_row["id"],),
    )
    try:
        db_execute(
            "INSERT INTO password_reset_log (login_id, action) VALUES (%s, 'reset_password')",
            (user["login_id"],),
        )
    except Exception:
        pass

    return {
        "ok":       True,
        "login_id": user["login_id"],
        "message":  "Password reset successfully. You can now log in with your Login ID and new password.",
    }


# ── Legacy login_id-based forgot-password flow (kept for backward compatibility) ──

@app.post("/auth/forgot-password/check")
def forgot_password_check(body: ForgotCheckRequest):
    user = db_fetchone("SELECT login_id FROM kore_users WHERE login_id = %s", (body.login_id.strip(),))
    if not user:
        raise HTTPException(status_code=404, detail="Login ID not found.")
    return {"ok": True, "login_id": user["login_id"]}


@app.post("/auth/forgot-password/send-otp")
def forgot_password_send_otp(body: ForgotSendOTPRequest):
    user = db_fetchone("SELECT * FROM kore_users WHERE login_id = %s", (body.login_id.strip(),))
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    contact = body.contact.strip()
    if body.method == "email" and contact.lower() != user["email"].lower():
        raise HTTPException(status_code=400, detail="This email is not registered with your account.")
    if body.method == "phone" and contact != user["phone"]:
        raise HTTPException(status_code=400, detail="This phone is not registered with your account.")
    if body.method == "phone" and not DEMO_MODE:
        raise HTTPException(status_code=501, detail="SMS OTP not yet available. Use Email.")
    otp = _generate_otp()
    _store_otp(user["login_id"], otp, body.method, contact, purpose="reset_password")
    demo_otp = None
    if DEMO_MODE:
        demo_otp = otp
    else:
        _send_email_otp(contact, otp, user.get("first_name", ""))
    return {"ok": True, "sent_to": contact, **({"demo_otp": demo_otp} if demo_otp else {})}


@app.post("/auth/forgot-password/verify-otp")
def forgot_password_verify_otp(body: ForgotVerifyOTPRequest):
    otp_row = db_fetchone(
        "SELECT * FROM otp_tokens "
        "WHERE login_id = %s AND otp_code = %s "
        "AND is_used = 0 AND expires_at > NOW() "
        "ORDER BY id DESC LIMIT 1",
        (body.login_id, body.otp_code),
    )
    if not otp_row:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP.")
    db_execute("UPDATE otp_tokens SET is_used = 1 WHERE id = %s", (otp_row["id"],))
    return {"ok": True, "message": "OTP verified. You can now set a new password."}


@app.post("/auth/reset-password")
def reset_password(body: ResetPasswordRequest):
    if not body.new_password or len(body.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")
    user = db_fetchone("SELECT login_id FROM kore_users WHERE login_id = %s", (body.login_id,))
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    db_execute(
        "UPDATE kore_users SET password_hash = %s WHERE login_id = %s",
        (_hash_password(body.new_password), body.login_id),
    )
    return {"ok": True, "message": "Password reset successfully. You can now log in."}


# ─── User routes ──────────────────────────────────────────────────────────────

@app.get("/me")
def me(authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)
    return {
        "login_id":   user["login_id"],
        "name":       f"{user['first_name']} {user['last_name']}".strip(),
        "email":      user["email"],
        "phone":      user["phone"],
        "created_at": str(user["created_at"]),
    }


@app.get("/my-files")
@dataset_router.get("/my-files")
@dataset_router.get("/datasets")
def my_files(project_id: Optional[str] = None, authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)
    
    if project_id:
        check_project_access(project_id, user["login_id"])
        files = db_fetchall(
            "SELECT id, file_name, file_type, file_size_kb, row_count, col_count, uploaded_at, data_quality_score, status "
            "FROM uploaded_files WHERE project_id = %s AND status = 'Active' ORDER BY uploaded_at DESC",
            (project_id,),
        )
    else:
        files = db_fetchall(
            "SELECT id, file_name, file_type, file_size_kb, row_count, col_count, uploaded_at, data_quality_score, status "
            "FROM uploaded_files WHERE login_id = %s AND project_id IS NULL AND status = 'Active' ORDER BY uploaded_at DESC",
            (user["login_id"],),
        )
        
    for f in files:
        f["uploaded_at"] = str(f["uploaded_at"])
    return {"files": files, "total": len(files)}


@app.delete("/my-files/{file_id}")
def delete_file(file_id: int, authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)
    
    file_row = db_fetchone("SELECT * FROM uploaded_files WHERE id = %s", (file_id,))
    if not file_row:
        raise HTTPException(status_code=404, detail="File not found")
        
    project_id = file_row.get("project_id")
    if project_id:
        check_project_access(project_id, user["login_id"], "Editor")
        
    db_execute("DELETE FROM uploaded_files WHERE id = %s", (file_id,))
    
    if file_row.get("storage_path"):
        full_path = os.path.join(BASE_DIR, file_row["storage_path"])
        if os.path.isfile(full_path):
            try:
                os.remove(full_path)
            except Exception:
                pass
                
    if file_row.get("eda_json_path"):
        full_eda_path = os.path.join(BASE_DIR, file_row["eda_json_path"])
        if os.path.isfile(full_eda_path):
            try:
                os.remove(full_eda_path)
            except Exception:
                pass
                
    if project_id:
        proj = db_fetchone("SELECT active_dataset FROM projects WHERE id = %s", (project_id,))
        if proj and proj["active_dataset"] == file_row["file_name"]:
            next_f = db_fetchone("SELECT file_name FROM uploaded_files WHERE project_id = %s AND status = 'Active' ORDER BY uploaded_at DESC LIMIT 1", (project_id,))
            next_name = next_f["file_name"] if next_f else None
            db_execute("UPDATE projects SET active_dataset = %s WHERE id = %s", (next_name, project_id))
            
        refresh_project_statistics(project_id)
        log_project_activity(project_id, user["login_id"], f"Deleted dataset: {file_row['file_name']}", "dataset", str(file_id))
        
    return {"ok": True, "message": "File deleted successfully"}


@app.get("/my-files/{file_id}/eda")
@eda_router.get("/my-files/{file_id}/eda")
@eda_router.get("/eda/{file_id}")
def get_file_eda(file_id: int, authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)
    row = db_fetchone(
        "SELECT eda_json_path FROM uploaded_files WHERE id = %s AND login_id = %s",
        (file_id, user["login_id"])
    )
    if not row or not row.get("eda_json_path"):
        raise HTTPException(status_code=404, detail="EDA result not found or cache is empty")
    
    full_path = os.path.join(BASE_DIR, row["eda_json_path"])
    if not os.path.isfile(full_path):
        raise HTTPException(status_code=404, detail="EDA JSON file does not exist on disk")
        
    try:
        import json
        with open(full_path, "r", encoding="utf-8") as f_in:
            data = json.load(f_in)
        return data
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Failed to read cached EDA: {exc}")


# ─── Notification routes ──────────────────────────────────────────────────────

@app.get("/notifications")
@notification_router.get("")
def get_notifications(project_id: Optional[str] = None, authorization: Optional[str] = Header(None)):
    user  = _require_auth(authorization)
    items = notif.get_notifications(user["login_id"], project_id=project_id)
    return {
        "notifications": items,
        "total":         len(items),
        "unread_count":  notif.get_unread_count(user["login_id"], project_id=project_id),
    }


@app.get("/notifications/unread-count")
@notification_router.get("/unread-count")
def unread_count(project_id: Optional[str] = None, authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)
    return {"unread_count": notif.get_unread_count(user["login_id"], project_id=project_id)}


@app.post("/notifications/{notif_id}/read")
@notification_router.post("/{notif_id}/read")
def notification_mark_read(notif_id: int, authorization: Optional[str] = Header(None)):
    user  = _require_auth(authorization)
    found = notif.mark_read(notif_id, user["login_id"])
    if not found:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"ok": True, "unread_count": notif.get_unread_count(user["login_id"])}


@app.post("/notifications/{notif_id}/unread")
@notification_router.post("/{notif_id}/unread")
def notification_mark_unread(notif_id: int, authorization: Optional[str] = Header(None)):
    user  = _require_auth(authorization)
    found = notif.mark_unread(notif_id, user["login_id"])
    if not found:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"ok": True, "unread_count": notif.get_unread_count(user["login_id"])}


@app.post("/notifications/read-all")
@notification_router.post("/read-all")
def notification_mark_all_read(project_id: Optional[str] = None, authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)
    notif.mark_all_read(user["login_id"], project_id=project_id)
    return {"ok": True, "unread_count": 0}


# ─── Upload / EDA route ───────────────────────────────────────────────────────

@app.post("/upload")
@dataset_router.post("/upload")
@dataset_router.post("/datasets/upload")
async def upload_file(
    project_id:    Optional[str] = None,
    file:          UploadFile    = File(...),
    authorization: Optional[str] = Header(None),
):
    monitor = PerformanceMonitor()
    monitor.start()
    try:
        user = None
        if authorization and authorization.startswith("Bearer "):
            user = get_user_from_token(authorization[7:])
            
        if not user:
            raise HTTPException(status_code=401, detail="Unauthorized")
            
        if project_id:
            check_project_access(project_id, user["login_id"], "Editor")
            
        contents = await file.read()
        monitor.log_stage("file_read")

        fname = (file.filename or "").lower()
        if   fname.endswith(".csv"):     df = pd.read_csv(io.BytesIO(contents))
        elif fname.endswith((".xlsx",".xls")): df = pd.read_excel(io.BytesIO(contents))
        elif fname.endswith(".json"):    df = pd.read_json(io.BytesIO(contents))
        elif fname.endswith(".parquet"): df = pd.read_parquet(io.BytesIO(contents))
        elif fname.endswith(".xml"):     df = pd.read_xml(io.BytesIO(contents))
        else:
            return JSONResponse(status_code=400, content={"error": "Unsupported file type."})

        monitor.log_stage("file_parse")

        if df.empty:
            return JSONResponse(status_code=400, content={"error": "The uploaded file is empty."})

        eda_result = perform_eda(df)
        monitor.log_stage("eda_complete")

        parts   = (file.filename or "file.csv").rsplit(".", 1)
        ext     = parts[-1] if len(parts) == 2 else "unknown"
        size_kb = round(len(contents) / 1024, 2)
        rows    = eda_result.get("overview", {}).get("rows",    None)
        cols    = eda_result.get("overview", {}).get("columns", None)
        
        missing_pct = eda_result.get("overview", {}).get("missing_pct", 0)
        quality_score = max(0.0, min(100.0, 100.0 - missing_pct))

        file_id = db_execute(
            "INSERT INTO uploaded_files "
            "(login_id, project_id, file_name, file_type, file_size_kb, row_count, col_count, data_quality_score, status) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, 'Active')",
            (user["login_id"], project_id, file.filename, ext, size_kb, rows, cols, quality_score),
        )
        
        if project_id:
            setup_project_folders(user["login_id"], project_id)
            raw_rel_path = os.path.join("storage", "users", user["login_id"], "projects", project_id, "datasets", f"{file_id}_{file.filename}")
            raw_full_path = os.path.join(BASE_DIR, raw_rel_path)
            
            with open(raw_full_path, "wb") as f_raw:
                f_raw.write(contents)
                
            eda_filename = f"{file_id}_eda.json"
            eda_rel_path = os.path.join("storage", "users", user["login_id"], "projects", project_id, "eda", eda_filename)
        else:
            raw_rel_path = None
            eda_filename = f"{user['login_id']}_{file_id}_eda.json"
            eda_rel_path = os.path.join("storage", "eda", eda_filename)
            
        eda_full_path = os.path.join(BASE_DIR, eda_rel_path)
        
        import json
        try:
            with open(eda_full_path, "w", encoding="utf-8") as f_out:
                json.dump(eda_result, f_out, ensure_ascii=False, indent=2)
            
            db_execute(
                "UPDATE uploaded_files SET eda_json_path = %s, storage_path = %s WHERE id = %s",
                (eda_rel_path, raw_rel_path, file_id)
            )
        except Exception as file_exc:
            logger.error(f"[Kore] Failed to write EDA JSON to disk: {file_exc}")
            
        if project_id:
            db_execute("UPDATE projects SET active_dataset = %s WHERE id = %s", (file.filename, project_id))
            refresh_project_statistics(project_id)
            log_project_activity(project_id, user["login_id"], f"Uploaded dataset: {file.filename}", "dataset", str(file_id))
            db_execute("UPDATE project_pipeline SET status = 'Completed' WHERE project_id = %s AND step_name = 'Import Dataset'", (project_id,))
            
        try:
            notif.create_notification(
                user["login_id"],
                f'"{file.filename}" uploaded — {rows or "?"} rows, {cols or "?"} cols. EDA complete.',
                notif.TYPE_SUCCESS,
                "overview",
            )
            if project_id:
                db_execute("UPDATE user_notifications SET project_id = %s WHERE login_id = %s AND project_id IS NULL ORDER BY id DESC LIMIT 1", (project_id, user["login_id"]))
        except Exception:
            pass

        eda_result["_performance_metrics"] = {
            "stages":          monitor.metrics,
            "total_time_ms":   monitor.get_total_time(),
            "file_size_bytes": len(contents),
            "file_name":       file.filename,
            "processed_at":    datetime.now().isoformat(),
        }
        eda_result["dataset_id"] = file_id
        eda_result["file_name"] = file.filename
        eda_result["storage_path"] = raw_rel_path
        
        return eda_result

    except Exception as exc:
        logger.error(f"Upload failed: {exc}")
        return JSONResponse(status_code=500, content={"error": f"EDA processing failed: {exc}"})


# ─── Code execution route ─────────────────────────────────────────────────────

@app.post("/code-run")
async def code_run(body: CodeRunRequest, authorization: Optional[str] = Header(None)):
    _require_auth(authorization)

    import io as _io
    import math, json, re as _re, traceback as _tb, contextlib
    import pandas as _pd
    import numpy  as _np

    exec_globals: dict = {
        "__builtins__": {
            "print": print, "len": len, "range": range, "enumerate": enumerate,
            "zip": zip, "map": map, "filter": filter, "sorted": sorted,
            "reversed": reversed, "list": list, "dict": dict, "set": set,
            "tuple": tuple, "str": str, "int": int, "float": float, "bool": bool,
            "round": round, "abs": abs, "min": min, "max": max, "sum": sum,
            "isinstance": isinstance, "type": type, "hasattr": hasattr,
            "getattr": getattr, "vars": vars, "dir": dir,
            "True": True, "False": False, "None": None,
        },
        "pd": _pd, "pandas": _pd, "np": _np, "numpy": _np,
        "math": math, "re": _re, "json": json, "dataset": body.dataset or {},
    }

    output_buf = _io.StringIO()
    error_msg  = None
    result_val = None

    try:
        with contextlib.redirect_stdout(output_buf):
            exec(compile(body.code, "<user_code>", "exec"), exec_globals)  # noqa: S102
        output = output_buf.getvalue()
        if "result" in exec_globals and not callable(exec_globals["result"]):
            raw = exec_globals["result"]
            try:
                result_val = _pd.DataFrame(raw).to_dict(orient="records") if isinstance(raw, _pd.DataFrame) else str(raw)
            except Exception:
                result_val = str(raw)
    except Exception:
        error_msg = _tb.format_exc(limit=8)
        output    = output_buf.getvalue()

    return {
        "output": output, "error": error_msg,
        "result": result_val, "lines_run": len(body.code.strip().splitlines()),
    }


# ─── Dataset Edit / Version Routes ────────────────────────────────────────────

@app.post("/dataset/select-version")
async def dataset_select_version(
    body: DatasetVersionRequest,
    authorization: Optional[str] = Header(None),
):
    login_id = None
    if authorization and authorization.startswith("Bearer "):
        user = get_user_from_token(authorization[7:])
        if user:
            login_id = user["login_id"]
    logger.info("[dataset] version=%s by %s", body.version, login_id or "anon")
    return {
        "ok":      True,
        "version": body.version,
        "rows":    len(body.rows) if body.rows else 0,
        "message": f"Active dataset set to '{body.version}'",
    }


@app.post("/dataset/edit")
async def dataset_edit(
    body: DatasetEditRequest,
    authorization: Optional[str] = Header(None),
):
    _require_auth(authorization)
    if not body.rows or not body.columns:
        raise HTTPException(status_code=400, detail="rows and columns are required.")
    try:
        df = pd.DataFrame(body.rows, columns=body.columns)
        if df.empty:
            raise HTTPException(status_code=400, detail="Edited dataset is empty.")
        eda_result = perform_eda(df)
        eda_result["_source"] = "edited"
        return eda_result
    except Exception as exc:
        logger.error("[dataset/edit] error: %s", exc)
        raise HTTPException(status_code=500, detail=f"EDA on edited dataset failed: {exc}")


@app.post("/dataset/apply-missing")
async def dataset_apply_missing(
    body: ApplyMissingRequest,
    authorization: Optional[str] = Header(None),
):
    _require_auth(authorization)
    if not body.rows or not body.columns:
        raise HTTPException(status_code=400, detail="rows and columns are required.")
    try:
        import numpy as _np
        df  = pd.DataFrame(body.rows, columns=body.columns)
        col = body.column
        if col not in df.columns:
            raise HTTPException(status_code=400, detail=f"Column '{col}' not found.")
        strat = body.strategy.lower()
        if   strat == "mean":   fill = float(pd.to_numeric(df[col], errors="coerce").mean())
        elif strat == "median": fill = float(pd.to_numeric(df[col], errors="coerce").median())
        elif strat == "zero":   fill = 0
        elif strat == "mode":
            mode_vals = df[col].dropna().mode()
            fill      = mode_vals[0] if len(mode_vals) > 0 else ""
        else:
            raise HTTPException(status_code=400, detail=f"Unknown strategy '{strat}'.")
        df[col] = df[col].replace(["", "nan", "NaN", "None", "null"], _np.nan).fillna(fill)
        return {"ok": True, "column": col, "strategy": strat, "fill_value": fill, "rows": df.to_dict(orient="records")}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Missing value fill failed: {exc}")


# ─── Workspace State Routes ───────────────────────────────────────────────────

# ─── Project Management Helpers ────────────────────────────────────────────────

import uuid

def check_project_access(project_id: str, login_id: str, minimum_role: str = "Viewer") -> dict:
    """
    Checks if a user has access to a project and returns their role.
    Raises HTTPException if access is denied.
    """
    project = db_fetchone("SELECT * FROM projects WHERE id = %s AND is_deleted = 0", (project_id,))
    if not project:
        raise HTTPException(status_code=404, detail="Project not found or deleted")
    
    # If the user is the owner of the project, they have full access
    if project["login_id"] == login_id:
        return {"project": project, "role": "Owner"}
    
    # Check project_members table
    member = db_fetchone("SELECT * FROM project_members WHERE project_id = %s AND login_id = %s", (project_id, login_id))
    if not member:
        raise HTTPException(status_code=403, detail="Access denied. You are not a member of this project.")
    
    role_hierarchy = {
        "Owner": 5,
        "Admin": 4,
        "Editor": 3,
        "Viewer": 2,
        "Guest": 1
    }
    
    user_level = role_hierarchy.get(member["role"], 0)
    required_level = role_hierarchy.get(minimum_role, 0)
    
    if user_level < required_level:
        raise HTTPException(status_code=403, detail=f"Insufficient permissions. Requires {minimum_role} role.")
        
    return {"project": project, "role": member["role"]}


def setup_project_folders(login_id: str, project_id: str):
    try:
        user_dir = os.path.join(BASE_DIR, "storage", "users", login_id, "projects", project_id)
        subdirs = ["datasets", "eda", "charts", "models", "reports", "exports", "notebooks", "ai", "temp"]
        for subdir in subdirs:
            path = os.path.join(user_dir, subdir)
            os.makedirs(path, exist_ok=True)
    except Exception as e:
        logger.warning(f"Failed to create project folder structure: {e}")


def log_project_activity(project_id: str, login_id: str, action: str, entity: str = None, entity_id: str = None, prev_val: str = None, new_val: str = None):
    try:
        db_execute(
            "INSERT INTO project_activity_log (project_id, login_id, action, entity, entity_id, previous_value, new_value) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s)",
            (project_id, login_id, action, entity, entity_id, prev_val, new_val)
        )
    except Exception as e:
        logger.warning(f"Failed to log project activity: {e}")


def get_project_stats(project_id: str) -> dict:
    try:
        ds_count = db_fetchone("SELECT COUNT(*) as cnt FROM uploaded_files WHERE project_id = %s AND status = 'Active'", (project_id,))
        md_count = db_fetchone("SELECT COUNT(*) as cnt FROM ml_saved_models WHERE project_id = %s", (project_id,))
        ch_count = db_fetchone("SELECT COUNT(*) as cnt FROM visualizations WHERE project_id = %s", (project_id,))
        rp_count = db_fetchone("SELECT COUNT(*) as cnt FROM project_reports WHERE project_id = %s", (project_id,))
        ex_count = db_fetchone("SELECT COUNT(*) as cnt FROM project_exports WHERE project_id = %s", (project_id,))
        
        # calculate storage used
        total_kb = db_fetchone("SELECT SUM(file_size_kb) as total FROM uploaded_files WHERE project_id = %s AND status = 'Active'", (project_id,))
        kb = total_kb["total"] if total_kb and total_kb["total"] else 0
        storage_str = f"{round(kb / 1024, 2)} MB" if kb > 1024 else f"{round(kb, 1)} KB"
        
        # calculate pipeline completion %
        pipeline_steps = db_fetchall("SELECT status FROM project_pipeline WHERE project_id = %s", (project_id,))
        completed = sum(1 for step in pipeline_steps if step["status"] == "Completed")
        total_steps = len(pipeline_steps) or 8
        completion_pct = int((completed / total_steps) * 100)
        
        # average quality score
        avg_score = db_fetchone("SELECT AVG(data_quality_score) as avg FROM uploaded_files WHERE project_id = %s AND status = 'Active'", (project_id,))
        q_score = round(avg_score["avg"], 1) if avg_score and avg_score["avg"] is not None else None
        
        return {
            "dataset_count": ds_count["cnt"] if ds_count else 0,
            "model_count": md_count["cnt"] if md_count else 0,
            "chart_count": ch_count["cnt"] if ch_count else 0,
            "report_count": rp_count["cnt"] if rp_count else 0,
            "export_count": ex_count["cnt"] if ex_count else 0,
            "storage_used": storage_str,
            "pipeline_completion": completion_pct,
            "quality_score": q_score
        }
    except Exception as e:
        logger.warning(f"Failed to get project stats: {e}")
        return {}


def refresh_project_statistics(project_id: str):
    try:
        stats = get_project_stats(project_id)
        if not stats:
            return
        
        # Update project_statistics table
        exists = db_fetchone("SELECT 1 FROM project_statistics WHERE project_id = %s", (project_id,))
        if exists:
            db_execute(
                "UPDATE project_statistics SET dataset_count = %s, model_count = %s, chart_count = %s, report_count = %s, "
                "export_count = %s, storage_used = %s, pipeline_completion = %s, quality_score = %s WHERE project_id = %s",
                (stats["dataset_count"], stats["model_count"], stats["chart_count"], stats["report_count"],
                 stats["export_count"], stats["storage_used"], stats["pipeline_completion"], stats["quality_score"], project_id)
            )
        else:
            db_execute(
                "INSERT INTO project_statistics (project_id, dataset_count, model_count, chart_count, report_count, "
                "export_count, storage_used, pipeline_completion, quality_score) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
                (project_id, stats["dataset_count"], stats["model_count"], stats["chart_count"], stats["report_count"],
                 stats["export_count"], stats["storage_used"], stats["pipeline_completion"], stats["quality_score"])
            )
        
        # Sync storage_used, dataset_count, model_count, report_count on the projects table as well
        db_execute(
            "UPDATE projects SET storage_used = %s, dataset_count = %s, model_count = %s, report_count = %s WHERE id = %s",
            (stats["storage_used"], stats["dataset_count"], stats["model_count"], stats["report_count"], project_id)
        )
    except Exception as e:
        logger.warning(f"Failed to refresh project statistics: {e}")


# ─── Workspace State Routes ───────────────────────────────────────────────────

@workspace_router.get("/state")
def get_workspace_state(authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)
    state = db_fetchone("SELECT * FROM kore_workspace_state WHERE login_id = %s", (user["login_id"],))
    if not state:
        return {
            "active_project_id": None,
            "active_dataset_id": None,
            "active_model_id": None,
            "current_module": None,
            "current_page": None,
            "current_chart": None,
            "last_pipeline_step": None,
            "eda_result": None,
            "active_panels": None,
            "selected_panel": "dashboard",
            "sim_running": 0,
            "current_stage_key": None,
            "sim_progress": 0,
            "stage_statuses": None,
            "logs": None,
            "open_tabs_json": None,
            "active_tab_id": None,
            "workspace_settings_json": None,
            "workspace_history_json": None
        }
    return state


@workspace_router.post("/state")
def save_workspace_state(body: WorkspaceSaveRequest, authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)
    lid = user["login_id"]
    
    exists = db_fetchone("SELECT 1 FROM kore_workspace_state WHERE login_id = %s", (lid,))
    if exists:
        db_execute(
            "UPDATE kore_workspace_state SET "
            "active_project_id = %s, active_dataset_id = %s, active_model_id = %s, "
            "current_module = %s, current_page = %s, current_chart = %s, last_pipeline_step = %s, "
            "eda_result = %s, active_panels = %s, selected_panel = %s, "
            "sim_running = %s, current_stage_key = %s, sim_progress = %s, "
            "stage_statuses = %s, logs = %s, open_tabs_json = %s, active_tab_id = %s, "
            "workspace_settings_json = %s, workspace_history_json = %s WHERE login_id = %s",
            (
                body.active_project_id, body.active_dataset_id, body.active_model_id,
                body.current_module, body.current_page, body.current_chart, body.last_pipeline_step,
                body.eda_result, body.active_panels, body.selected_panel,
                body.sim_running, body.current_stage_key, body.sim_progress,
                body.stage_statuses, body.logs, body.open_tabs_json, body.active_tab_id,
                body.workspace_settings_json, body.workspace_history_json, lid
            )
        )
    else:
        db_execute(
            "INSERT INTO kore_workspace_state "
            "(login_id, active_project_id, active_dataset_id, active_model_id, current_module, current_page, "
            "current_chart, last_pipeline_step, eda_result, active_panels, selected_panel, sim_running, current_stage_key, "
            "sim_progress, stage_statuses, logs, open_tabs_json, active_tab_id, workspace_settings_json, workspace_history_json) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
            (
                lid, body.active_project_id, body.active_dataset_id, body.active_model_id,
                body.current_module, body.current_page, body.current_chart, body.last_pipeline_step,
                body.eda_result, body.active_panels, body.selected_panel,
                body.sim_running, body.current_stage_key, body.sim_progress,
                body.stage_statuses, body.logs, body.open_tabs_json, body.active_tab_id,
                body.workspace_settings_json, body.workspace_history_json
            )
        )

    return {"ok": True, "message": "Workspace state saved to MySQL"}


# ─── Project APIs ─────────────────────────────────────────────────────────────

@app.get("/projects")
def get_projects(authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)
    lid = user["login_id"]
    
    projects = db_fetchall(
        "SELECT p.*, "
        "       ps.dataset_count, ps.model_count, ps.chart_count, ps.report_count, ps.export_count, "
        "       ps.storage_used as stat_storage_used, ps.pipeline_completion, ps.quality_score "
        "FROM projects p "
        "LEFT JOIN project_members pm ON pm.project_id = p.id "
        "LEFT JOIN project_statistics ps ON ps.project_id = p.id "
        "WHERE p.is_deleted = 0 AND (p.login_id = %s OR pm.login_id = %s) "
        "GROUP BY p.id "
        "ORDER BY p.is_favorite DESC, p.last_opened_at DESC, p.created_at DESC",
        (lid, lid)
    )
    for p in projects:
        p["created_at"] = str(p["created_at"])
        p["updated_at"] = str(p["updated_at"])
        p["last_opened_at"] = str(p["last_opened_at"]) if p["last_opened_at"] else None
        p["is_favorite"] = bool(p["is_favorite"])
        p["is_archived"] = bool(p["is_archived"])
        p["is_deleted"] = bool(p["is_deleted"])
        if p["stat_storage_used"] is not None:
            p["storage_used"] = p["stat_storage_used"]
            
    return {"projects": projects, "total": len(projects)}


@app.get("/projects/{project_id}")
def get_project_details(project_id: str, authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)
    access = check_project_access(project_id, user["login_id"])
    project = access["project"]
    
    refresh_project_statistics(project_id)
    stats = db_fetchone("SELECT * FROM project_statistics WHERE project_id = %s", (project_id,))
    
    pipeline = db_fetchall("SELECT step_name, status, updated_at FROM project_pipeline WHERE project_id = %s", (project_id,))
    for step in pipeline:
        step["updated_at"] = str(step["updated_at"])
        
    activity = db_fetchall("SELECT * FROM project_activity_log WHERE project_id = %s ORDER BY created_at DESC LIMIT 30", (project_id,))
    for act in activity:
        act["created_at"] = str(act["created_at"])
        
    members = db_fetchall(
        "SELECT pm.id, pm.login_id, pm.role, pm.created_at, "
        "       CONCAT(u.first_name, ' ', u.last_name) as name, u.email "
        "FROM project_members pm "
        "JOIN kore_users u ON u.login_id = pm.login_id "
        "WHERE pm.project_id = %s",
        (project_id,)
    )
    for m in members:
        m["created_at"] = str(m["created_at"])
        
    return {
        "project": {
            **project,
            "created_at": str(project["created_at"]),
            "updated_at": str(project["updated_at"]),
            "last_opened_at": str(project["last_opened_at"]) if project["last_opened_at"] else None,
            "is_favorite": bool(project["is_favorite"]),
            "is_archived": bool(project["is_archived"]),
            "is_deleted": bool(project["is_deleted"])
        },
        "role": access["role"],
        "stats": stats or {},
        "pipeline": pipeline,
        "activity": activity,
        "members": members
    }


@app.post("/projects")
def create_project(body: ProjectCreateRequest, authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)
    lid = user["login_id"]
    
    project_id = "proj-" + str(uuid.uuid4())[:8]
    
    db_execute(
        "INSERT INTO projects (id, login_id, name, description, project_type, industry, visibility, color_theme, icon) "
        "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
        (project_id, lid, body.name, body.description, body.project_type, body.industry, body.visibility, body.color_theme, body.icon)
    )
    
    setup_project_folders(lid, project_id)
    
    db_execute("INSERT INTO project_members (project_id, login_id, role) VALUES (%s, %s, 'Owner')", (project_id, lid))
    
    db_execute("INSERT INTO project_settings (project_id, default_theme) VALUES (%s, %s)", (project_id, "dark" if body.color_theme == "indigo" else "light"))
    
    steps = ['Import Dataset', 'EDA', 'Visualization', 'Feature Engineering', 'Machine Learning', 'Prediction', 'Reports', 'Export']
    for step in steps:
        db_execute("INSERT INTO project_pipeline (project_id, step_name, status) VALUES (%s, %s, 'Not Started')", (project_id, step))
        
    log_project_activity(project_id, lid, "Project created", "project", project_id, None, body.name)
    refresh_project_statistics(project_id)
    
    db_execute(
        "INSERT INTO kore_workspace_state (login_id, active_project_id) "
        "VALUES (%s, %s) ON DUPLICATE KEY UPDATE active_project_id = %s",
        (lid, project_id, project_id)
    )
    
    try:
        notif.create_notification(
            lid,
            f"Project '{body.name}' created successfully.",
            notif.TYPE_SUCCESS,
            "overview"
        )
        db_execute("UPDATE user_notifications SET project_id = %s WHERE login_id = %s AND project_id IS NULL ORDER BY id DESC LIMIT 1", (project_id, lid))
    except Exception:
        pass
        
    return {"ok": True, "project_id": project_id, "message": "Project created successfully."}


@app.put("/projects/{project_id}")
def update_project(project_id: str, body: ProjectUpdateRequest, authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)
    access = check_project_access(project_id, user["login_id"], "Editor")
    
    fields = []
    params = []
    changes = []
    
    update_fields = {
        "name": body.name,
        "description": body.description,
        "project_type": body.project_type,
        "industry": body.industry,
        "visibility": body.visibility,
        "color_theme": body.color_theme,
        "icon": body.icon,
        "is_favorite": body.is_favorite,
        "is_archived": body.is_archived,
        "active_dataset": body.active_dataset,
        "active_model": body.active_model,
        "current_pipeline_stage": body.current_pipeline_stage
    }
    
    for col, val in update_fields.items():
        if val is not None:
            fields.append(f"{col} = %s")
            params.append(val)
            changes.append(f"{col}: {val}")
            
    if not fields:
        return {"ok": True, "message": "No changes requested."}
        
    params.append(project_id)
    db_execute(f"UPDATE projects SET {', '.join(fields)} WHERE id = %s", tuple(params))
    
    log_project_activity(project_id, user["login_id"], "Project updated", "project", project_id, None, ", ".join(changes))
    return {"ok": True, "message": "Project updated successfully."}


@app.delete("/projects/{project_id}")
def delete_project(project_id: str, authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)
    check_project_access(project_id, user["login_id"], "Admin")
    lid = user["login_id"]
    
    # Soft delete
    db_execute("UPDATE projects SET is_deleted = 1 WHERE id = %s", (project_id,))
    log_project_activity(project_id, lid, "Project soft-deleted", "project", project_id)
    
    # Auto-switch user active project if deleting currently active project
    state = db_fetchone("SELECT active_project_id FROM kore_workspace_state WHERE login_id = %s", (lid,))
    if state and state["active_project_id"] == project_id:
        next_proj = db_fetchone("SELECT id FROM projects WHERE login_id = %s AND is_deleted = 0 LIMIT 1", (lid,))
        next_id = next_proj["id"] if next_proj else None
        db_execute("UPDATE kore_workspace_state SET active_project_id = %s WHERE login_id = %s", (next_id, lid))
        
    return {"ok": True, "message": "Project deleted successfully."}


@app.post("/projects/{project_id}/archive")
def archive_project(project_id: str, authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)
    check_project_access(project_id, user["login_id"], "Editor")
    
    db_execute("UPDATE projects SET is_archived = 1 WHERE id = %s", (project_id,))
    log_project_activity(project_id, user["login_id"], "Project archived", "project", project_id)
    return {"ok": True, "message": "Project archived successfully."}


@app.post("/projects/{project_id}/restore")
def restore_project(project_id: str, authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)
    check_project_access(project_id, user["login_id"], "Editor")
    
    db_execute("UPDATE projects SET is_archived = 0, is_deleted = 0 WHERE id = %s", (project_id,))
    log_project_activity(project_id, user["login_id"], "Project restored", "project", project_id)
    return {"ok": True, "message": "Project restored successfully."}


@app.post("/projects/{project_id}/duplicate")
def duplicate_project(project_id: str, authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)
    lid = user["login_id"]
    access = check_project_access(project_id, lid, "Viewer")
    orig = access["project"]
    
    new_id = "proj-" + str(uuid.uuid4())[:8]
    new_name = orig["name"] + " (Copy)"
    
    db_execute(
        "INSERT INTO projects (id, login_id, name, description, project_type, industry, visibility, color_theme, icon) "
        "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)",
        (new_id, lid, new_name, orig["description"], orig["project_type"], orig["industry"], orig["visibility"], orig["color_theme"], orig["icon"])
    )
    
    setup_project_folders(lid, new_id)
    
    db_execute("INSERT INTO project_members (project_id, login_id, role) VALUES (%s, %s, 'Owner')", (new_id, lid))
    
    orig_pipeline = db_fetchall("SELECT step_name, status FROM project_pipeline WHERE project_id = %s", (project_id,))
    for step in orig_pipeline:
        db_execute("INSERT INTO project_pipeline (project_id, step_name, status) VALUES (%s, %s, %s)", (new_id, step["step_name"], step["status"]))
        
    refresh_project_statistics(new_id)
    
    orig_files = db_fetchall("SELECT * FROM uploaded_files WHERE project_id = %s AND status = 'Active'", (project_id,))
    for f in orig_files:
        db_execute(
            "INSERT INTO uploaded_files (login_id, project_id, file_name, file_type, file_size_kb, row_count, col_count, eda_json_path, report_json_path, data_quality_score, storage_path) "
            "VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)",
            (lid, new_id, f["file_name"], f["file_type"], f["file_size_kb"], f["row_count"], f["col_count"], f["eda_json_path"], f["report_json_path"], f["data_quality_score"], f["storage_path"])
        )
        
    refresh_project_statistics(new_id)
    log_project_activity(new_id, lid, "Project duplicated", "project", new_id, project_id, f"Cloned from {project_id}")
    
    return {"ok": True, "project_id": new_id, "message": "Project duplicated successfully."}


@app.post("/projects/{project_id}/favorite")
def favorite_project(project_id: str, authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)
    check_project_access(project_id, user["login_id"], "Viewer")
    
    project = db_fetchone("SELECT is_favorite FROM projects WHERE id = %s", (project_id,))
    new_fav = 0 if project["is_favorite"] else 1
    db_execute("UPDATE projects SET is_favorite = %s WHERE id = %s", (new_fav, project_id))
    
    action = "Project starred" if new_fav else "Project unstarred"
    log_project_activity(project_id, user["login_id"], action, "project", project_id)
    return {"ok": True, "is_favorite": bool(new_fav), "message": f"{action} successfully."}


@app.post("/projects/{project_id}/share")
def share_project(project_id: str, body: ProjectShareRequest, authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)
    check_project_access(project_id, user["login_id"], "Editor")
    
    target_user = db_fetchone("SELECT login_id, first_name, last_name FROM kore_users WHERE email = %s", (body.email.strip(),))
    if not target_user:
        raise HTTPException(status_code=404, detail="No Kore user registered with that email address.")
        
    target_lid = target_user["login_id"]
    
    exists = db_fetchone("SELECT 1 FROM project_members WHERE project_id = %s AND login_id = %s", (project_id, target_lid))
    if exists:
        db_execute("UPDATE project_members SET role = %s WHERE project_id = %s AND login_id = %s", (body.role, project_id, target_lid))
    else:
        db_execute("INSERT INTO project_members (project_id, login_id, role) VALUES (%s, %s, %s)", (project_id, target_lid, body.role))
        
    log_project_activity(project_id, user["login_id"], f"Shared project with {body.email}", "member", target_lid, None, body.role)
    
    try:
        notif.create_notification(
            target_lid,
            f"You have been invited to project as '{body.role}' by {user['first_name']}.",
            notif.TYPE_INFO,
            "overview"
        )
        db_execute("UPDATE user_notifications SET project_id = %s WHERE login_id = %s AND project_id IS NULL ORDER BY id DESC LIMIT 1", (project_id, target_lid))
    except Exception:
        pass
        
    return {"ok": True, "message": f"Project successfully shared with {body.email} as {body.role}."}


@app.post("/projects/{project_id}/transfer-owner")
def transfer_owner(project_id: str, body: ProjectShareRequest, authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)
    access = check_project_access(project_id, user["login_id"])
    if access["role"] != "Owner":
        raise HTTPException(status_code=403, detail="Only the project Owner can transfer ownership.")
        
    target_user = db_fetchone("SELECT login_id FROM kore_users WHERE email = %s", (body.email.strip(),))
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found.")
        
    target_lid = target_user["login_id"]
    
    db_execute("UPDATE projects SET login_id = %s WHERE id = %s", (target_lid, project_id))
    db_execute("UPDATE project_members SET role = 'Admin' WHERE project_id = %s AND login_id = %s", (project_id, user["login_id"]))
    
    exists = db_fetchone("SELECT 1 FROM project_members WHERE project_id = %s AND login_id = %s", (project_id, target_lid))
    if exists:
        db_execute("UPDATE project_members SET role = 'Owner' WHERE project_id = %s AND login_id = %s", (project_id, target_lid))
    else:
        db_execute("INSERT INTO project_members (project_id, login_id, role) VALUES (%s, %s, 'Owner')", (project_id, target_lid))
        
    log_project_activity(project_id, user["login_id"], f"Transferred ownership to {body.email}", "project", project_id)
    return {"ok": True, "message": f"Ownership successfully transferred to {body.email}."}


@app.get("/projects/{project_id}/activity")
def get_project_activity(project_id: str, limit: int = 50, authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)
    check_project_access(project_id, user["login_id"])
    
    activity = db_fetchall(
        "SELECT a.*, CONCAT(u.first_name, ' ', u.last_name) as user_name, u.email "
        "FROM project_activity_log a "
        "JOIN kore_users u ON u.login_id = a.login_id "
        "WHERE a.project_id = %s "
        "ORDER BY a.created_at DESC "
        "LIMIT %s",
        (project_id, limit)
    )
    for act in activity:
        act["created_at"] = str(act["created_at"])
        
    return {"activity": activity, "total": len(activity)}


@app.get("/projects/{project_id}/statistics")
def get_project_statistics(project_id: str, authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)
    check_project_access(project_id, user["login_id"])
    
    refresh_project_statistics(project_id)
    stats = db_fetchone("SELECT * FROM project_statistics WHERE project_id = %s", (project_id,))
    if stats:
        stats["updated_at"] = str(stats["updated_at"])
    return {"statistics": stats or {}}


class ActivateProjectRequest(BaseModel):
    project_id: str

@workspace_router.post("/activate")
def activate_project(body: ActivateProjectRequest, authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)
    lid = user["login_id"]
    
    check_project_access(body.project_id, lid)
    
    db_execute(
        "INSERT INTO kore_workspace_state (login_id, active_project_id) "
        "VALUES (%s, %s) ON DUPLICATE KEY UPDATE active_project_id = %s",
        (lid, body.project_id, body.project_id)
    )
    
    db_execute("UPDATE projects SET last_opened_at = NOW() WHERE id = %s", (body.project_id,))
    return {"ok": True, "message": "Project activated in workspace state."}


# ─── Stats ───────────────────────────────────────────────────────────────────

@app.get("/stats")
def stats(project_id: Optional[str] = None, authorization: Optional[str] = Header(None)):
    if project_id and authorization:
        try:
            user = _require_auth(authorization)
            check_project_access(project_id, user["login_id"])
            refresh_project_statistics(project_id)
            stat = db_fetchone("SELECT * FROM project_statistics WHERE project_id = %s", (project_id,))
            if stat:
                return {
                    "total_users": 1,
                    "total_uploads": stat["dataset_count"],
                    "model_count": stat["model_count"],
                    "chart_count": stat["chart_count"],
                    "report_count": stat["report_count"],
                    "export_count": stat["export_count"],
                    "storage_used": stat["storage_used"],
                    "pipeline_completion": stat["pipeline_completion"]
                }
        except Exception:
            pass
            
    uc = db_fetchone("SELECT COUNT(*) AS cnt FROM kore_users")
    fc = db_fetchone("SELECT COUNT(*) AS cnt FROM uploaded_files")
    return {
        "total_users":   uc["cnt"] if uc else 0,
        "total_uploads": fc["cnt"] if fc else 0,
    }


# ─── New Router Endpoints ───────────────────────────────────────────────────

# 1. Visualizations
class VisualizationSaveBody(BaseModel):
    project_id: str
    dataset_id: Optional[int] = None
    chart_type: str
    chart_name: str
    chart_config_json: str

@visualization_router.get("")
def get_visualizations(project_id: str, authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)
    check_project_access(project_id, user["login_id"])
    rows = db_fetchall("SELECT * FROM visualizations WHERE project_id = %s", (project_id,))
    for r in rows:
        r["created_at"] = str(r["created_at"])
    return {"success": True, "data": rows}

@visualization_router.post("")
def save_visualization(body: VisualizationSaveBody, authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)
    check_project_access(body.project_id, user["login_id"], minimum_role="Editor")
    db_execute(
        "INSERT INTO visualizations (project_id, dataset_id, chart_type, chart_name, chart_config_json, created_by) "
        "VALUES (%s, %s, %s, %s, %s, %s)",
        (body.project_id, body.dataset_id, body.chart_type, body.chart_name, body.chart_config_json, user["login_id"])
    )
    return {"success": True, "message": "Chart configuration saved."}

@visualization_router.delete("/{viz_id}")
def delete_visualization(viz_id: int, authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)
    row = db_fetchone("SELECT project_id FROM visualizations WHERE id = %s", (viz_id,))
    if not row:
        raise HTTPException(status_code=404, detail="Visualization not found")
    check_project_access(row["project_id"], user["login_id"], minimum_role="Editor")
    db_execute("DELETE FROM visualizations WHERE id = %s", (viz_id,))
    return {"success": True, "message": "Visualization deleted."}


# 2. Predictions
class PredictionSaveBody(BaseModel):
    project_id: str
    model_id: int
    input_dataset: Optional[str] = None
    output_dataset: Optional[str] = None
    confidence: Optional[float] = None

@prediction_router.get("")
def get_predictions(project_id: str, authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)
    check_project_access(project_id, user["login_id"])
    rows = db_fetchall("SELECT * FROM predictions WHERE project_id = %s ORDER BY generated_at DESC", (project_id,))
    for r in rows:
        r["generated_at"] = str(r["generated_at"])
    return {"success": True, "data": rows}

@prediction_router.post("")
def save_prediction(body: PredictionSaveBody, authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)
    check_project_access(body.project_id, user["login_id"], minimum_role="Editor")
    db_execute(
        "INSERT INTO predictions (project_id, model_id, input_dataset, output_dataset, confidence) "
        "VALUES (%s, %s, %s, %s, %s)",
        (body.project_id, body.model_id, body.input_dataset, body.output_dataset, body.confidence)
    )
    return {"success": True, "message": "Prediction record saved."}


# 3. Reports
class ReportSaveBody(BaseModel):
    project_id: str
    report_name: str
    report_type: str
    pdf_path: str

@reports_router.get("")
def get_reports(project_id: str, authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)
    check_project_access(project_id, user["login_id"])
    rows = db_fetchall("SELECT * FROM project_reports WHERE project_id = %s ORDER BY generated_at DESC", (project_id,))
    for r in rows:
        r["generated_at"] = str(r["generated_at"])
    return {"success": True, "data": rows}

@reports_router.post("")
def save_report(body: ReportSaveBody, authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)
    check_project_access(body.project_id, user["login_id"], minimum_role="Editor")
    db_execute(
        "INSERT INTO project_reports (project_id, report_name, report_type, pdf_path, generated_by) "
        "VALUES (%s, %s, %s, %s, %s)",
        (body.project_id, body.report_name, body.report_type, body.pdf_path, user["login_id"])
    )
    return {"success": True, "message": "Report record saved."}


# 4. Exports
class ExportSaveBody(BaseModel):
    project_id: str
    export_type: str
    zip_path: Optional[str] = None
    csv_path: Optional[str] = None
    sql_path: Optional[str] = None
    python_path: Optional[str] = None
    notebook_path: Optional[str] = None

@export_router.get("")
def get_exports(project_id: str, authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)
    check_project_access(project_id, user["login_id"])
    rows = db_fetchall("SELECT * FROM project_exports WHERE project_id = %s ORDER BY created_at DESC", (project_id,))
    for r in rows:
        r["created_at"] = str(r["created_at"])
    return {"success": True, "data": rows}

@export_router.post("")
def save_export(body: ExportSaveBody, authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)
    check_project_access(body.project_id, user["login_id"], minimum_role="Editor")
    db_execute(
        "INSERT INTO project_exports (project_id, export_type, zip_path, csv_path, sql_path, python_path, notebook_path) "
        "VALUES (%s, %s, %s, %s, %s, %s, %s)",
        (body.project_id, body.export_type, body.zip_path, body.csv_path, body.sql_path, body.python_path, body.notebook_path)
    )
    return {"success": True, "message": "Export record saved."}


# 5. AI Copilot Chat
class AiChatBody(BaseModel):
    project_id: str
    prompt: str

@ai_router.get("/chat/history")
def get_ai_chat_history(project_id: str, authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)
    check_project_access(project_id, user["login_id"])
    rows = db_fetchall("SELECT prompt, response, created_at FROM ai_chat_history WHERE project_id = %s AND login_id = %s ORDER BY created_at ASC", (project_id, user["login_id"]))
    
    formatted = []
    for r in rows:
        formatted.append({
            "sender": "user",
            "text": r["prompt"],
            "time": r["created_at"].strftime("%I:%M %p") if r["created_at"] else ""
        })
        formatted.append({
            "sender": "ai",
            "text": r["response"],
            "time": r["created_at"].strftime("%I:%M %p") if r["created_at"] else ""
        })
    return {"success": True, "history": formatted}

@ai_router.post("/chat")
def post_ai_chat(body: AiChatBody, authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)
    check_project_access(body.project_id, user["login_id"])
    
    project_id = body.project_id
    
    files_count = db_fetchone("SELECT COUNT(*) as cnt FROM uploaded_files WHERE project_id = %s", (project_id,))
    model_count = db_fetchone("SELECT COUNT(*) as cnt FROM ml_saved_models WHERE project_id = %s", (project_id,))
    active_file = db_fetchone("SELECT file_name, id FROM uploaded_files WHERE project_id = %s ORDER BY uploaded_at DESC LIMIT 1", (project_id,))
    
    dataset_name = active_file["file_name"] if active_file else "active_dataset.csv"
    
    latest_model = db_fetchone("SELECT model_name, primary_metric FROM ml_saved_models WHERE project_id = %s ORDER BY saved_at DESC LIMIT 1", (project_id,))
    trained_text = ""
    if latest_model:
        trained_text = f"I see a {latest_model['model_name']} model is active with a primary metric score of {latest_model['primary_metric']}."
    else:
        trained_text = "No active model has been trained yet in ML Studio."
        
    prompt_lower = body.prompt.lower()
    reply = ""
    if "cleaning" in prompt_lower or "impute" in prompt_lower:
        reply = f"### Imputation & Outlier Strategy\nBased on your active dataset **{dataset_name}**, I recommend performing median value imputation on columns with missing ratios exceeding 5%. Let's also apply Min-Max scaling on numeric fields. You can run these simulations inside the Data Cleaning panel."
    elif "model" in prompt_lower or "algorithm" in prompt_lower or "train" in prompt_lower:
        reply = f"### Model Architecture Suggestions\n{trained_text}\nTo improve classification accuracy/F1 scores, I recommend setting up a Feature Scaling preprocessing layer or switching to XGBoost with 150 estimators inside **ML Studio**."
    elif "explain" in prompt_lower or "describe" in prompt_lower or "stats" in prompt_lower:
        reply = f"### Dataset Statistical Profile\n- **Project File Count**: {files_count['cnt'] if files_count else 0}\n- **ML Model Count**: {model_count['cnt'] if model_count else 0}\n- **Latest Active File**: {dataset_name}\n\nI suggest checking the correlation matrix grid in EDA to flag multicollinearity before training linear models."
    else:
        reply = f"I've analyzed your data queries against the active project context ({dataset_name}). Let's proceed with visual analysis or train models using ML Studio."
        
    db_execute(
        "INSERT INTO ai_chat_history (project_id, login_id, prompt, response, model) "
        "VALUES (%s, %s, %s, %s, %s)",
        (project_id, user["login_id"], body.prompt, reply, "GPT-4o Enterprise")
    )
    
    return {
        "success": True,
        "response": reply,
        "model": "GPT-4o Enterprise",
        "time": datetime.now().strftime("%I:%M %p")
    }



# ─── Mount routers ────────────────────────────────────────────────────────────
app.include_router(simulation_router)
app.include_router(activity_router)
app.include_router(ml_router)
app.include_router(account_router)
app.include_router(landing_router)
app.include_router(projects_router)
app.include_router(workspace_router)
app.include_router(dataset_router)
app.include_router(eda_router)
app.include_router(visualization_router)
app.include_router(prediction_router)
app.include_router(reports_router)
app.include_router(export_router)
app.include_router(ai_router)
app.include_router(notification_router)

# ─── Entry point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host      = "0.0.0.0",
        port      = int(os.environ.get("PORT", 8000)),
        reload    = False,
        log_level = "info",
    )
