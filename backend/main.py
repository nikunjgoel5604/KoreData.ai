# main.py — Kore_data-ex  v9.0
# =========================================================
# FIXES vs shared doc 45
# ─────────────────────────────────────────────────────────
# FIX 1  Removed `from landing_routes import ...`
#         landing_routes.py does not exist — caused ImportError on startup.
#
# FIX 2  Removed duplicate @app.get("/health") at the bottom.
#         Two identical route definitions — FastAPI ignores the second
#         one silently but it is bad practice and causes confusion.
#         The single /health endpoint is now at the top (required by
#         railway.json healthcheckPath="/health" to respond first).
#
# FIX 3  Removed init_contact_table() call in lifespan.
#         Was calling a function from the removed landing_routes import.
#
# v9.1 PATCH — landing_routes restored:
#         Re-added landing_router + init_contact_table now that
#         landing_routes.py exists. Fixes 404 on /about /services /contact.
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
from datetime import datetime, timedelta
from typing import Optional

from dotenv import load_dotenv
load_dotenv()

logger = logging.getLogger(__name__)

from fastapi import FastAPI, UploadFile, File, Request, HTTPException, Header
from fastapi.responses import JSONResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from pydantic import BaseModel
import pandas as pd

from database           import init_db, db_fetchone, db_fetchall, db_execute
from eda_engine         import perform_eda
import notification_engine as notif
from simulation_engine  import simulation_router
from activity_routes    import activity_router
from ml_routes          import ml_router
from account_routes     import account_router
from landing_routes     import landing_router, init_contact_table   # ← PATCH v9.1


# ─── Lifespan ─────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    init_contact_table()   # ← PATCH v9.1
    logger.info(
        "[Kore] v9.1 started — routers: simulation, activity, ml, account, landing"
        " | DEMO_MODE=%s", DEMO_MODE
    )
    yield
    logger.info("[Kore] Server shutting down.")


# ─── App ──────────────────────────────────────────────────────────────────────

app = FastAPI(
    title       = "Kore_data-ex API",
    version     = "9.1",
    description = "End-to-end Data Intelligence & ML Recommendation Platform",
    lifespan    = lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Mount routers ────────────────────────────────────────────────────────────
app.include_router(simulation_router)
app.include_router(activity_router)
app.include_router(ml_router)
app.include_router(account_router)
app.include_router(landing_router)   # ← PATCH v9.1

# ─── Static & Templates ───────────────────────────────────────────────────────
BASE_DIR   = os.path.dirname(os.path.abspath(__file__))
STATIC_DIR = os.path.join(BASE_DIR, "static")
TMPL_DIR   = os.path.join(BASE_DIR, "templates")

for _d, _name in [(STATIC_DIR, "backend/static"), (TMPL_DIR, "backend/templates")]:
    if not os.path.isdir(_d):
        logger.warning("[Kore] Directory not found: %s", _d)

if os.path.isdir(STATIC_DIR):
    app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

templates = Jinja2Templates(directory=TMPL_DIR) if os.path.isdir(TMPL_DIR) else None


# ─── OTP / SMTP config ────────────────────────────────────────────────────────

DEMO_MODE      = os.environ.get("DEMO_MODE", "false").lower() == "true"
OTP_EXPIRY_MIN = int(os.environ.get("OTP_EXPIRY_MINUTES", "2"))
SMTP_HOST      = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT      = int(os.environ.get("SMTP_PORT", "587"))
SMTP_SENDER    = os.environ.get("SMTP_SENDER", "")
SMTP_PASSWORD  = os.environ.get("SMTP_PASSWORD", "")


def _generate_otp() -> str:
    return str(secrets.randbelow(900000) + 100000)


def _send_email_otp(to_address: str, otp: str) -> None:
    if not SMTP_SENDER or not SMTP_PASSWORD:
        raise HTTPException(
            status_code=500,
            detail="Email service not configured. Set SMTP_SENDER and SMTP_PASSWORD in .env",
        )
    msg = MIMEText(
        f"Your Kore Data verification code is: {otp}\n\n"
        f"This code expires in {OTP_EXPIRY_MIN} minutes.\n"
        f"Do not share it with anyone.",
        "plain",
    )
    msg["Subject"] = "Your Kore Data OTP"
    msg["From"]    = SMTP_SENDER
    msg["To"]      = to_address
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
    """Railway / Docker healthcheck. Must respond 200 quickly."""
    from database import get_connection
    db_ok = False
    try:
        conn = get_connection()
        conn.close()
        db_ok = True
    except Exception:
        pass
    return {
        "status":  "ok" if db_ok else "degraded",
        "db":      "connected" if db_ok else "unavailable",
        "version": "9.1",
        "service": "kore-data-ex",
    }


@app.get("/version")
def version_info():
    import sys, platform
    return {
        "app":      "Kore_data-ex",
        "version":  "9.1",
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
    password = body.password.strip()
    if password and len(password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    existing = db_fetchone(
        "SELECT login_id FROM kore_users WHERE email = %s OR phone = %s",
        (body.email, body.phone),
    )
    if existing:
        raise HTTPException(status_code=409, detail="Email or phone already registered")

    login_id = "KD" + str(secrets.randbelow(900000) + 100000)
    while db_fetchone("SELECT 1 FROM kore_users WHERE login_id = %s", (login_id,)):
        login_id = "KD" + str(secrets.randbelow(900000) + 100000)

    if password:
        db_execute(
            "INSERT INTO kore_users (login_id, first_name, last_name, email, phone, password_hash, is_verified) "
            "VALUES (%s, %s, %s, %s, %s, %s, 1)",
            (login_id, body.first_name, body.last_name, body.email, body.phone, _hash_password(password)),
        )
        return {
            "ok": True,
            "login_id": login_id,
            "message": "Account created. Use this Login ID and password to sign in.",
        }

    db_execute(
        "INSERT INTO kore_users (login_id, first_name, last_name, email, phone) "
        "VALUES (%s, %s, %s, %s, %s)",
        (login_id, body.first_name, body.last_name, body.email, body.phone),
    )

    otp = _generate_otp()
    _store_otp(login_id, otp, body.otp_method, body.email)

    demo_otp = None
    if DEMO_MODE:
        demo_otp = otp
    else:
        _send_email_otp(body.email, otp)

    return {
        "login_id": login_id,
        "sent_to":  body.email,
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
    _store_otp(user["login_id"], otp, "email", user["email"])

    demo_otp = None
    if DEMO_MODE:
        demo_otp = otp
    else:
        _send_email_otp(user["email"], otp)

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
        _send_email_otp(contact, otp)

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
    _store_otp(user["login_id"], otp, body.method, contact)
    demo_otp = None
    if DEMO_MODE:
        demo_otp = otp
    else:
        _send_email_otp(contact, otp)
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
def my_files(authorization: Optional[str] = Header(None)):
    user  = _require_auth(authorization)
    files = db_fetchall(
        "SELECT id, file_name, file_type, file_size_kb, row_count, col_count, uploaded_at "
        "FROM uploaded_files WHERE login_id = %s ORDER BY uploaded_at DESC",
        (user["login_id"],),
    )
    for f in files:
        f["uploaded_at"] = str(f["uploaded_at"])
    return {"files": files, "total": len(files)}


# ─── Notification routes ──────────────────────────────────────────────────────

@app.get("/notifications")
def get_notifications(authorization: Optional[str] = Header(None)):
    user  = _require_auth(authorization)
    items = notif.get_notifications(user["login_id"])
    return {
        "notifications": items,
        "total":         len(items),
        "unread_count":  notif.get_unread_count(user["login_id"]),
    }


@app.get("/notifications/unread-count")
def unread_count(authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)
    return {"unread_count": notif.get_unread_count(user["login_id"])}


@app.post("/notifications/{notif_id}/read")
def notification_mark_read(notif_id: int, authorization: Optional[str] = Header(None)):
    user  = _require_auth(authorization)
    found = notif.mark_read(notif_id, user["login_id"])
    if not found:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"ok": True, "unread_count": notif.get_unread_count(user["login_id"])}


@app.post("/notifications/{notif_id}/unread")
def notification_mark_unread(notif_id: int, authorization: Optional[str] = Header(None)):
    user  = _require_auth(authorization)
    found = notif.mark_unread(notif_id, user["login_id"])
    if not found:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"ok": True, "unread_count": notif.get_unread_count(user["login_id"])}


@app.post("/notifications/read-all")
def notification_mark_all_read(authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)
    notif.mark_all_read(user["login_id"])
    return {"ok": True, "unread_count": 0}


# ─── Upload / EDA route ───────────────────────────────────────────────────────

@app.post("/upload")
async def upload_file(
    file:          UploadFile    = File(...),
    authorization: Optional[str] = Header(None),
):
    monitor = PerformanceMonitor()
    monitor.start()
    try:
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

        if authorization and authorization.startswith("Bearer "):
            user = get_user_from_token(authorization[7:])
            if user:
                parts   = (file.filename or "file.csv").rsplit(".", 1)
                ext     = parts[-1] if len(parts) == 2 else "unknown"
                size_kb = round(len(contents) / 1024, 2)
                rows    = eda_result.get("overview", {}).get("rows",    None)
                cols    = eda_result.get("overview", {}).get("columns", None)
                db_execute(
                    "INSERT INTO uploaded_files "
                    "(login_id, file_name, file_type, file_size_kb, row_count, col_count) "
                    "VALUES (%s, %s, %s, %s, %s, %s)",
                    (user["login_id"], file.filename, ext, size_kb, rows, cols),
                )
                try:
                    notif.create_notification(
                        user["login_id"],
                        f'"{file.filename}" uploaded — {rows or "?"} rows, {cols or "?"} cols. EDA complete.',
                        notif.TYPE_SUCCESS,
                        "overview",
                    )
                except Exception:
                    pass

        eda_result["_performance_metrics"] = {
            "stages":          monitor.metrics,
            "total_time_ms":   monitor.get_total_time(),
            "file_size_bytes": len(contents),
            "file_name":       file.filename,
            "processed_at":    datetime.now().isoformat(),
        }
        return eda_result

    except Exception as exc:
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


# ─── Stats ───────────────────────────────────────────────────────────────────

@app.get("/stats")
def stats():
    uc = db_fetchone("SELECT COUNT(*) AS cnt FROM kore_users")
    fc = db_fetchone("SELECT COUNT(*) AS cnt FROM uploaded_files")
    return {
        "total_users":   uc["cnt"] if uc else 0,
        "total_uploads": fc["cnt"] if fc else 0,
    }


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
