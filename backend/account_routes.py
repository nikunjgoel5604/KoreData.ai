# account_routes.py — Kore_data-ex  v1.0
# =========================================================
# Account management API routes.
#
# Mount in main.py:
#   from account_routes import account_router
#   app.include_router(account_router)
#
# ENDPOINTS
# ─────────────────────────────────────────────────────────
#   GET  /account/profile
#   POST /account/profile/update
#   POST /account/avatar/upload
#   POST /account/resume/upload
#   POST /account/verify/email/send
#   POST /account/verify/email/confirm
#   POST /account/verify/phone/send
#   POST /account/verify/phone/confirm
#   GET  /account/activity
#   POST /account/delete
#
# DB TABLE additions needed (account_schema.sql):
#   ALTER TABLE kore_users ADD COLUMN display_name VARCHAR(80)  NULL;
#   ALTER TABLE kore_users ADD COLUMN bio          TEXT         NULL;
#   ALTER TABLE kore_users ADD COLUMN dob          DATE         NULL;
#   ALTER TABLE kore_users ADD COLUMN avatar_url   VARCHAR(255) NULL;
#   ALTER TABLE kore_users ADD COLUMN resume_name  VARCHAR(255) NULL;
#   ALTER TABLE kore_users ADD COLUMN resume_url   VARCHAR(255) NULL;
#   ALTER TABLE kore_users ADD COLUMN job_title    VARCHAR(100) NULL;
#   ALTER TABLE kore_users ADD COLUMN company      VARCHAR(100) NULL;
#   ALTER TABLE kore_users ADD COLUMN industry     VARCHAR(80)  NULL;
#   ALTER TABLE kore_users ADD COLUMN years_exp    VARCHAR(30)  NULL;
#   ALTER TABLE kore_users ADD COLUMN linkedin     VARCHAR(255) NULL;
#   ALTER TABLE kore_users ADD COLUMN skills_json  TEXT         NULL;  -- JSON array
#   ALTER TABLE kore_users ADD COLUMN exp_json     TEXT         NULL;  -- JSON array
#   ALTER TABLE kore_users ADD COLUMN address_json TEXT         NULL;  -- JSON object
#   ALTER TABLE kore_users ADD COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 0;
#   ALTER TABLE kore_users ADD COLUMN phone_verified TINYINT(1) NOT NULL DEFAULT 0;
#   ALTER TABLE kore_users ADD COLUMN last_login   DATETIME     NULL;
#
# NEW TABLE:
#   CREATE TABLE user_activity (
#     id         INT          NOT NULL AUTO_INCREMENT,
#     login_id   VARCHAR(20)  NOT NULL,
#     action     VARCHAR(60)  NOT NULL,
#     ip_address VARCHAR(45)  NULL,
#     device     VARCHAR(120) NULL,
#     created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
#     PRIMARY KEY (id),
#     FOREIGN KEY (login_id) REFERENCES kore_users(login_id)
#         ON DELETE CASCADE ON UPDATE CASCADE,
#     INDEX idx_act_user (login_id),
#     INDEX idx_act_time (created_at)
#   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
# =========================================================

import os
import io
import json
import secrets
import logging
import smtplib
from email.mime.text import MIMEText
from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, UploadFile, File, Header, Request, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from database import db_fetchone, db_fetchall, db_execute

logger = logging.getLogger(__name__)

account_router = APIRouter(prefix="/account", tags=["Account"])

# ─── Config ───────────────────────────────────────────────────────────────────
DEMO_MODE     = os.environ.get("DEMO_MODE", "false").lower() == "true"
OTP_EXPIRY    = int(os.environ.get("OTP_EXPIRY_MINUTES", "2"))
SMTP_HOST     = os.environ.get("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT     = int(os.environ.get("SMTP_PORT", "587"))
SMTP_SENDER   = os.environ.get("SMTP_SENDER", "")
SMTP_PASSWORD = os.environ.get("SMTP_PASSWORD", "")

# ─── Auth helper (re-used from main.py pattern) ───────────────────────────────
def _require_auth(authorization: Optional[str]) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    token = authorization[7:]
    user  = db_fetchone(
        "SELECT u.* FROM sessions s "
        "JOIN kore_users u ON u.login_id = s.login_id "
        "WHERE s.token = %s AND s.expires_at > NOW()",
        (token,),
    )
    if not user:
        raise HTTPException(status_code=401, detail="Token invalid or expired")
    return user

# ─── OTP helpers ──────────────────────────────────────────────────────────────
def _gen_otp() -> str:
    return str(secrets.randbelow(900000) + 100000)

def _store_otp(login_id: str, otp: str, method: str, contact: str, purpose: str = "verify_contact") -> None:
    # Invalidate old OTPs for this purpose
    db_execute(
        "UPDATE otp_tokens SET is_used = 1 "
        "WHERE login_id = %s AND purpose IN ('verify_contact', %s) AND is_used = 0",
        (login_id, purpose),
    )
    expires = datetime.now() + timedelta(minutes=OTP_EXPIRY)
    # Use sp_request_otp if purpose column exists, else fallback INSERT
    try:
        db_execute(
            "INSERT INTO otp_tokens (login_id, otp_code, method, contact, purpose, expires_at) "
            "VALUES (%s, %s, %s, %s, %s, %s)",
            (login_id, otp, method, contact, purpose, expires),
        )
    except Exception:
        db_execute(
            "INSERT INTO otp_tokens (login_id, otp_code, method, contact, expires_at) "
            "VALUES (%s, %s, %s, %s, %s)",
            (login_id, otp, method, contact, expires),
        )

def _send_email(to: str, subject: str, body: str) -> None:
    if not SMTP_SENDER or not SMTP_PASSWORD:
        raise HTTPException(status_code=500, detail="SMTP not configured")
    msg = MIMEText(body, "plain")
    msg["Subject"] = subject
    msg["From"]    = SMTP_SENDER
    msg["To"]      = to
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=10) as s:
        s.starttls()
        s.login(SMTP_SENDER, SMTP_PASSWORD)
        s.sendmail(SMTP_SENDER, [to], msg.as_string())

def _log_activity(login_id: str, action: str, request: Optional[Request] = None) -> None:
    """Write to user_activity table. Silently fails if table not yet created."""
    ip     = None
    device = None
    if request:
        ip     = request.client.host if request.client else None
        device = request.headers.get("User-Agent", "")[:120]
    try:
        db_execute(
            "INSERT INTO user_activity (login_id, action, ip_address, device) VALUES (%s, %s, %s, %s)",
            (login_id, action, ip, device),
        )
    except Exception:
        pass  # table may not exist yet

# ─── Pydantic models ──────────────────────────────────────────────────────────

class ProfileUpdateRequest(BaseModel):
    first_name:   Optional[str] = None
    last_name:    Optional[str] = None
    display_name: Optional[str] = None
    bio:          Optional[str] = None
    dob:          Optional[str] = None
    email:        Optional[str] = None
    phone:        Optional[str] = None
    job_title:    Optional[str] = None
    company:      Optional[str] = None
    industry:     Optional[str] = None
    years_exp:    Optional[str] = None
    linkedin:     Optional[str] = None
    skills:       Optional[list] = None
    experience:   Optional[list] = None
    address:      Optional[dict] = None


class VerifySendRequest(BaseModel):
    contact: str

class VerifyConfirmRequest(BaseModel):
    otp_code: str


# ─── GET /account/profile ─────────────────────────────────────────────────────
@account_router.get("/profile")
def get_profile(authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)

    # Try to fetch extended columns gracefully
    extended = db_fetchone(
        "SELECT display_name, bio, dob, avatar_url, resume_name, resume_url, "
        "job_title, company, industry, years_exp, linkedin, "
        "skills_json, exp_json, address_json, "
        "email_verified, phone_verified, last_login, created_at "
        "FROM kore_users WHERE login_id = %s",
        (user["login_id"],),
    )

    # Parse JSON fields
    skills     = []
    experience = []
    address    = {}
    if extended:
        try: skills     = json.loads(extended.get("skills_json") or "[]")
        except: pass
        try: experience = json.loads(extended.get("exp_json")    or "[]")
        except: pass
        try: address    = json.loads(extended.get("address_json") or "{}")
        except: pass

    ext = extended or {}
    return {
        "login_id":       user["login_id"],
        "first_name":     user.get("first_name", ""),
        "last_name":      user.get("last_name", ""),
        "email":          user.get("email", ""),
        "phone":          user.get("phone", ""),
        "display_name":   ext.get("display_name") or "",
        "bio":            ext.get("bio") or "",
        "dob":            str(ext.get("dob") or "") if ext.get("dob") else "",
        "avatar_url":     ext.get("avatar_url") or None,
        "resume_name":    ext.get("resume_name") or None,
        "resume_url":     ext.get("resume_url") or None,
        "job_title":      ext.get("job_title") or "",
        "company":        ext.get("company") or "",
        "industry":       ext.get("industry") or "",
        "years_exp":      ext.get("years_exp") or "",
        "linkedin":       ext.get("linkedin") or "",
        "skills":         skills,
        "experience":     experience,
        "address":        address,
        "email_verified": bool(ext.get("email_verified") or user.get("is_verified", 0)),
        "phone_verified": bool(ext.get("phone_verified", 0)),
        "created_at":     str(user.get("created_at") or ""),
        "last_login":     str(ext.get("last_login") or ""),
        "is_verified":    bool(user.get("is_verified", 0)),
    }


# ─── POST /account/profile/update ─────────────────────────────────────────────
@account_router.post("/profile/update")
def update_profile(body: ProfileUpdateRequest, request: Request, authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)
    lid  = user["login_id"]

    # Build SET clause dynamically from provided fields
    updates = {}
    if body.first_name   is not None: updates["first_name"]    = body.first_name.strip()
    if body.last_name    is not None: updates["last_name"]     = body.last_name.strip()
    if body.display_name is not None: updates["display_name"]  = body.display_name.strip()
    if body.bio          is not None: updates["bio"]           = body.bio.strip()
    if body.dob          is not None: updates["dob"]           = body.dob or None
    if body.email        is not None: updates["email"]         = body.email.strip()
    if body.phone        is not None: updates["phone"]         = body.phone.strip()
    if body.job_title    is not None: updates["job_title"]     = body.job_title.strip()
    if body.company      is not None: updates["company"]       = body.company.strip()
    if body.industry     is not None: updates["industry"]      = body.industry
    if body.years_exp    is not None: updates["years_exp"]     = body.years_exp
    if body.linkedin     is not None: updates["linkedin"]      = body.linkedin.strip()
    if body.skills       is not None: updates["skills_json"]   = json.dumps(body.skills)
    if body.experience   is not None: updates["exp_json"]      = json.dumps(body.experience)
    if body.address      is not None: updates["address_json"]  = json.dumps(body.address)

    if not updates:
        return {"ok": True, "message": "Nothing to update"}

    set_clause = ", ".join(f"{col} = %s" for col in updates)
    values     = list(updates.values()) + [lid]

    try:
        db_execute(
            f"UPDATE kore_users SET {set_clause} WHERE login_id = %s",
            tuple(values),
        )
    except Exception as exc:
        logger.error("[account] update_profile error: %s", exc)
        raise HTTPException(status_code=500, detail="Failed to update profile. Some columns may need migration — run account_schema.sql.")

    _log_activity(lid, "Profile Update", request)
    return {"ok": True, "message": "Profile updated successfully"}


# ─── POST /account/avatar/upload ──────────────────────────────────────────────
@account_router.post("/avatar/upload")
async def upload_avatar(
    file:          UploadFile           = File(...),
    authorization: Optional[str]        = Header(None),
):
    user = _require_auth(authorization)

    if file.content_type not in ("image/jpeg", "image/png", "image/webp", "image/gif"):
        raise HTTPException(status_code=400, detail="Only JPEG, PNG, WebP or GIF allowed")

    contents = await file.read()
    if len(contents) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image must be under 2 MB")

    # ── Save to static/avatars/<login_id>.<ext> ────────────────────────────
    BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
    AVATAR_DIR  = os.path.join(BASE_DIR, "static", "avatars")
    os.makedirs(AVATAR_DIR, exist_ok=True)

    ext         = file.filename.rsplit(".", 1)[-1].lower() if "." in (file.filename or "") else "jpg"
    avatar_name = f"{user['login_id']}.{ext}"
    avatar_path = os.path.join(AVATAR_DIR, avatar_name)
    avatar_url  = f"/static/avatars/{avatar_name}"

    with open(avatar_path, "wb") as f:
        f.write(contents)

    # Update DB
    try:
        db_execute(
            "UPDATE kore_users SET avatar_url = %s WHERE login_id = %s",
            (avatar_url, user["login_id"]),
        )
    except Exception:
        pass  # column may not exist yet

    return {"ok": True, "avatar_url": avatar_url}


# ─── POST /account/resume/upload ──────────────────────────────────────────────
@account_router.post("/resume/upload")
async def upload_resume(
    file:          UploadFile           = File(...),
    authorization: Optional[str]        = Header(None),
):
    user = _require_auth(authorization)

    allowed_types = (
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Only PDF, DOC or DOCX allowed")

    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Resume must be under 5 MB")

    BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
    RESUME_DIR  = os.path.join(BASE_DIR, "static", "resumes")
    os.makedirs(RESUME_DIR, exist_ok=True)

    ext         = file.filename.rsplit(".", 1)[-1].lower() if "." in (file.filename or "") else "pdf"
    fname       = f"{user['login_id']}_resume.{ext}"
    fpath       = os.path.join(RESUME_DIR, fname)
    furl        = f"/static/resumes/{fname}"

    with open(fpath, "wb") as f:
        f.write(contents)

    try:
        db_execute(
            "UPDATE kore_users SET resume_name = %s, resume_url = %s WHERE login_id = %s",
            (file.filename, furl, user["login_id"]),
        )
    except Exception:
        pass

    return {"ok": True, "resume_url": furl, "resume_name": file.filename}


# ─── POST /account/verify/email/send ──────────────────────────────────────────
@account_router.post("/verify/email/send")
def verify_email_send(body: VerifySendRequest, authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)

    # Contact must match registered email
    if body.contact.strip().lower() != user["email"].lower():
        raise HTTPException(status_code=400, detail="This email does not match your registered email address.")

    otp = _gen_otp()
    _store_otp(user["login_id"], otp, "email", body.contact, "verify_contact")

    demo_otp = None
    if DEMO_MODE:
        demo_otp = otp
    else:
        try:
            _send_email(
                body.contact,
                "Kore — Verify your email address",
                f"Your email verification code is: {otp}\n\nExpires in {OTP_EXPIRY} minutes.",
            )
        except Exception as exc:
            raise HTTPException(status_code=500, detail=f"Failed to send email: {exc}")

    return {"ok": True, "sent_to": body.contact, **({"demo_otp": demo_otp} if demo_otp else {})}


# ─── POST /account/verify/email/confirm ───────────────────────────────────────
@account_router.post("/verify/email/confirm")
def verify_email_confirm(body: VerifyConfirmRequest, authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)

    otp_row = db_fetchone(
        "SELECT id FROM otp_tokens "
        "WHERE login_id = %s AND otp_code = %s AND method = 'email' "
        "AND is_used = 0 AND expires_at > NOW() "
        "ORDER BY id DESC LIMIT 1",
        (user["login_id"], body.otp_code),
    )
    if not otp_row:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    db_execute("UPDATE otp_tokens SET is_used = 1 WHERE id = %s", (otp_row["id"],))
    try:
        db_execute(
            "UPDATE kore_users SET is_verified = 1, email_verified = 1 WHERE login_id = %s",
            (user["login_id"],),
        )
    except Exception:
        db_execute("UPDATE kore_users SET is_verified = 1 WHERE login_id = %s", (user["login_id"],))

    return {"ok": True, "message": "Email verified successfully"}


# ─── POST /account/verify/phone/send ──────────────────────────────────────────
@account_router.post("/verify/phone/send")
def verify_phone_send(body: VerifySendRequest, authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)

    if body.contact.strip() != user["phone"]:
        raise HTTPException(status_code=400, detail="This phone number does not match your registered phone.")

    if not DEMO_MODE:
        raise HTTPException(status_code=501, detail="SMS OTP is not yet available. Use Email verification.")

    otp = _gen_otp()
    _store_otp(user["login_id"], otp, "phone", body.contact, "verify_contact")

    return {"ok": True, "sent_to": body.contact, "demo_otp": otp}


# ─── POST /account/verify/phone/confirm ───────────────────────────────────────
@account_router.post("/verify/phone/confirm")
def verify_phone_confirm(body: VerifyConfirmRequest, authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)

    otp_row = db_fetchone(
        "SELECT id FROM otp_tokens "
        "WHERE login_id = %s AND otp_code = %s AND method = 'phone' "
        "AND is_used = 0 AND expires_at > NOW() "
        "ORDER BY id DESC LIMIT 1",
        (user["login_id"], body.otp_code),
    )
    if not otp_row:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    db_execute("UPDATE otp_tokens SET is_used = 1 WHERE id = %s", (otp_row["id"],))
    try:
        db_execute(
            "UPDATE kore_users SET phone_verified = 1 WHERE login_id = %s",
            (user["login_id"],),
        )
    except Exception:
        pass

    return {"ok": True, "message": "Phone number verified successfully"}


# ─── GET /account/activity ────────────────────────────────────────────────────
@account_router.get("/activity")
def get_activity(authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)
    try:
        rows = db_fetchall(
            "SELECT action, ip_address AS ip, device, created_at AS timestamp "
            "FROM user_activity WHERE login_id = %s "
            "ORDER BY created_at DESC LIMIT 50",
            (user["login_id"],),
        )
        for r in rows:
            r["timestamp"] = str(r["timestamp"])
        return {"activity": rows}
    except Exception:
        return {"activity": []}


# ─── POST /account/delete ─────────────────────────────────────────────────────
@account_router.post("/delete")
def delete_account(request: Request, authorization: Optional[str] = Header(None)):
    """
    Permanently delete the authenticated user's account and all related data.
    CASCADE DELETE on kore_users will remove sessions, otp_tokens,
    uploaded_files, user_notifications, etc.
    """
    user = _require_auth(authorization)
    lid  = user["login_id"]

    # Delete session first (so the token can no longer be used mid-delete)
    db_execute("DELETE FROM sessions WHERE login_id = %s", (lid,))
    # Delete user (cascades to all child tables)
    db_execute("DELETE FROM kore_users WHERE login_id = %s", (lid,))

    logger.info("[account] Account deleted: %s", lid)
    return {"ok": True, "message": "Account permanently deleted"}
