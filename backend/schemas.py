# schemas.py — Kore_data-ex Activity Tracking  v1.0
# =========================================================
# Pydantic schemas for request validation and response
# serialisation.  Kept separate from models.py so models
# stay dependency-free (usable in scripts / tests).
# =========================================================

from __future__ import annotations
from typing     import Optional, List
from datetime   import datetime
from pydantic   import BaseModel, Field


# ── Request schemas ───────────────────────────────────────────────────────────

class ActivityLoginRequest(BaseModel):
    """Payload sent to POST /activity/login"""
    login_id:   str = Field(..., min_length=1, max_length=20)
    ip_address: Optional[str] = Field(None, max_length=45)
    user_agent: Optional[str] = None


class ActivityLogoutRequest(BaseModel):
    """Payload sent to POST /activity/logout"""
    session_token: str = Field(..., min_length=1)


class HeartbeatRequest(BaseModel):
    """
    Payload sent to POST /activity/heartbeat
    Frontend sends this every 60 s to keep last_seen_at fresh.
    """
    session_token: str = Field(..., min_length=1)


# ── Response schemas ──────────────────────────────────────────────────────────

class TimePoint(BaseModel):
    raw:     Optional[str] = None
    display: str           = "—"


class TodayStats(BaseModel):
    first_login: TimePoint
    active_sec:  int
    active:      str   # "HH:MM:SS"


class SessionStats(BaseModel):
    active_sec: int
    active:     str   # "HH:MM:SS"
    is_active:  bool


class TotalStats(BaseModel):
    lifetime_sec:  int
    lifetime:      str   # "HH:MM:SS"
    lifetime_days: str   # "Xd Xh Xm"


class DashboardResponse(BaseModel):
    login_id:     str
    current_time: str           # ISO
    first_access: TimePoint
    last_access:  TimePoint
    today:        TodayStats
    session:      SessionStats
    total:        TotalStats


class HistoryRow(BaseModel):
    date:         str            # "YYYY-MM-DD"
    date_display: str            # "Mon, 18 Mar 2026"
    session_start:str            # ISO
    session_display: str         # "09:55 AM"
    last_seen:    str            # ISO
    today_spend:  str            # "HH:MM:SS"
    login_count:  int
    logout_count: int
    total_spend:  str            # "HH:MM:SS"
    total_spend_days: str        # "Xd Xh Xm"


class HistoryResponse(BaseModel):
    login_id: str
    total:    int
    records:  List[HistoryRow]


class LoginActivitySummary(BaseModel):
    """
    Compact summary matching the required UI format:
        First Access: ...
        Last Access:  ...
        Table: Date → Session → Today Spend → Login/Logout → Total Spend
    """
    login_id:     str
    first_access: TimePoint
    last_access:  TimePoint
    history:      List[HistoryRow]


class ActivityLoginResponse(BaseModel):
    ok:            bool
    session_token: str
    login_at:      str


class ActivityLogoutResponse(BaseModel):
    ok:           bool
    duration_sec: int
    duration:     str
