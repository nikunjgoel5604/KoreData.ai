# activity_routes.py — Kore_data-ex  v8.1
# =========================================================
# FIXES vs v8.0
# ─────────────────────────────────────────────────────────
# FIX 1  New POST /activity/validate endpoint
#         Frontend sends its saved activity token on every
#         page load. If valid → returns existing session info.
#         If invalid → frontend then calls /activity/login.
#         This is what makes refresh-safe session tracking work.
#
# FIX 2  POST /activity/login now returns session_token correctly
#         regardless of whether it's a resume or new login.
# =========================================================

import secrets
import logging
from datetime  import datetime
from typing    import Optional

from fastapi   import APIRouter, Header, HTTPException, Request
from pydantic  import BaseModel

from activity_tracker import (
    record_login, validate_session, record_logout,
    heartbeat, get_dashboard, get_history
)

logger = logging.getLogger(__name__)

activity_router = APIRouter(prefix="/activity", tags=["Activity"])


# ─── Request models ───────────────────────────────────────────────────────────

class ActivityLoginReq(BaseModel):
    login_id:   str
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    force_new:  bool          = False   # True = explicit re-login, skip same-day resume

class ValidateSessionReq(BaseModel):
    session_token: str
    login_id:      str

class ActivityLogoutReq(BaseModel):
    session_token: str

class HeartbeatReq(BaseModel):
    session_token: str


# ─── Auth helper ─────────────────────────────────────────────────────────────

def _require_login_id(authorization: Optional[str]) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Authorization header required.")
    from database import db_fetchone
    row = db_fetchone(
        "SELECT login_id FROM sessions WHERE token=%s AND expires_at>NOW()",
        (authorization[7:],)
    )
    if not row:
        raise HTTPException(status_code=401, detail="Token invalid or expired.")
    return row["login_id"]


# ─── Routes ──────────────────────────────────────────────────────────────────

@activity_router.post("/validate")
def activity_validate(body: ValidateSessionReq):
    """
    Step 1 on every page load.
    Frontend sends its saved activity token.
    Returns {valid: true, session_token, login_at} if still active.
    Returns {valid: false} if token expired/closed — frontend then calls /login.
    """
    result = validate_session(body.session_token, body.login_id)
    if result:
        return {"valid": True, **result}
    return {"valid": False}


@activity_router.post("/login")
def activity_login(
    body:          ActivityLoginReq,
    request:       Request,
    authorization: Optional[str] = Header(None),
):
    """
    Called only when /validate returns valid=false.
    Creates a new session row or returns existing one (refresh-safe).
    """
    login_id = body.login_id
    if authorization and authorization.startswith("Bearer "):
        try:
            login_id = _require_login_id(authorization)
        except HTTPException:
            pass

    new_token = secrets.token_hex(32)
    ip  = body.ip_address or (request.client.host if request.client else None)
    ua  = body.user_agent or request.headers.get("user-agent")

    result = record_login(login_id, new_token, ip, ua, force_new=body.force_new)
    return {"ok": True, **result}


@activity_router.post("/logout")
def activity_logout(body: ActivityLogoutReq):
    """
    Closes session and records duration.
    Safe to call multiple times (idempotent).
    """
    dur_sec, dur_str = record_logout(body.session_token)
    return {"ok": True, "duration_sec": dur_sec, "duration": dur_str}


@activity_router.post("/heartbeat")
def activity_heartbeat(body: HeartbeatReq):
    """Keep-alive ping every 60s. Updates last_seen_at + logout_at."""
    ok = heartbeat(body.session_token)
    return {"ok": ok, "ts": datetime.now().isoformat()}


@activity_router.get("/dashboard")
def activity_dashboard(authorization: Optional[str] = Header(None)):
    """All stats for the 4 sidebar cards. All times in HH:MM:SS."""
    login_id = _require_login_id(authorization)
    stats    = get_dashboard(login_id)
    return {"login_id": login_id, "current_time": datetime.now().isoformat(), **stats}


@activity_router.get("/history")
def activity_history(
    limit:         int            = 30,
    authorization: Optional[str] = Header(None),
):
    """Day-wise history table. All times in HH:MM:SS."""
    login_id = _require_login_id(authorization)
    records  = get_history(login_id, limit=min(limit, 365))
    return {"login_id": login_id, "total": len(records), "records": records}


@activity_router.get("/login-activity")
def login_activity_summary(authorization: Optional[str] = Header(None)):
    """Combined: First Access + Last Access + history table."""
    login_id = _require_login_id(authorization)
    stats    = get_dashboard(login_id)
    records  = get_history(login_id, limit=60)
    return {
        "title":         "Login Activity",
        "first_access":  stats["first_access"],
        "last_access":   stats["last_access"],
        "table_columns": [
            "Date", "Session Start", "Today Spend",
            "Logins / Logouts", "Total Spend"
        ],
        "table": records,
    }
