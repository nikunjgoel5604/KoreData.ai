# models.py — Kore_data-ex Activity Tracking  v1.0
# =========================================================
# Pure dataclass models — no ORM dependency.
# These mirror the SQL schema and are used throughout the
# backend for type safety and serialisation.
# =========================================================

from __future__ import annotations
from dataclasses import dataclass, field
from datetime    import datetime, date
from typing      import Optional


@dataclass
class UserSession:
    """
    One row in user_sessions.
    Represents a single login → logout pair.
    """
    id:             int
    login_id:       str
    session_token:  str
    login_at:       datetime
    logout_at:      Optional[datetime]
    duration_sec:   Optional[int]       # None while active
    ip_address:     Optional[str]
    user_agent:     Optional[str]
    is_active:      bool
    created_at:     datetime

    @property
    def is_closed(self) -> bool:
        return not self.is_active

    @property
    def duration_display(self) -> str:
        sec = self.duration_sec or 0
        return _fmt_hms(sec)

    def to_dict(self) -> dict:
        return {
            "id":            self.id,
            "login_id":      self.login_id,
            "session_token": self.session_token,
            "login_at":      _iso(self.login_at),
            "logout_at":     _iso(self.logout_at),
            "duration_sec":  self.duration_sec,
            "duration":      self.duration_display,
            "ip_address":    self.ip_address,
            "is_active":     self.is_active,
        }


@dataclass
class DailyActivity:
    """
    One row in daily_activity.
    Aggregated day-level statistics per user.
    """
    id:               int
    login_id:         str
    activity_date:    date
    first_login_at:   datetime
    last_seen_at:     datetime
    total_active_sec: int
    login_count:      int
    logout_count:     int
    updated_at:       datetime

    @property
    def total_active_display(self) -> str:
        return _fmt_hms(self.total_active_sec)

    def to_dict(self) -> dict:
        return {
            "date":             str(self.activity_date),
            "first_login_at":   _iso(self.first_login_at),
            "last_seen_at":     _iso(self.last_seen_at),
            "total_active_sec": self.total_active_sec,
            "total_active":     self.total_active_display,
            "login_count":      self.login_count,
            "logout_count":     self.logout_count,
        }


@dataclass
class DashboardStats:
    """
    Computed dashboard statistics returned by sp_get_dashboard.
    Not stored in the DB — assembled at query time.
    """
    first_ever_login:     Optional[datetime]
    last_access:          Optional[datetime]
    today_first_login:    Optional[datetime]
    today_active_sec:     int
    current_session_sec:  int
    is_active:            bool
    total_lifetime_sec:   int

    # ── Formatted display properties ─────────────────────────────────────────

    @property
    def first_access_display(self) -> str:
        if not self.first_ever_login:
            return "—"
        return self.first_ever_login.strftime("%A, %d %B %Y, %I:%M %p")

    @property
    def last_access_display(self) -> str:
        if not self.last_access:
            return "—"
        return self.last_access.strftime("%A, %d %B %Y, %I:%M %p")

    @property
    def today_first_login_display(self) -> str:
        if not self.today_first_login:
            return "—"
        return self.today_first_login.strftime("%I:%M %p")

    @property
    def today_active_display(self) -> str:
        return _fmt_hms(self.today_active_sec)

    @property
    def current_session_display(self) -> str:
        return _fmt_hms(self.current_session_sec)

    @property
    def total_lifetime_display(self) -> str:
        return _fmt_hms(self.total_lifetime_sec)

    @property
    def total_lifetime_days(self) -> str:
        """Also express total time in days + hours."""
        sec  = self.total_lifetime_sec
        days = sec // 86400
        hrs  = (sec % 86400) // 3600
        mins = (sec % 3600)  // 60
        if days > 0:
            return f"{days}d {hrs}h {mins}m"
        return _fmt_hms(sec)

    def to_dict(self) -> dict:
        return {
            "first_access": {
                "raw":     _iso(self.first_ever_login),
                "display": self.first_access_display,
            },
            "last_access": {
                "raw":     _iso(self.last_access),
                "display": self.last_access_display,
            },
            "today": {
                "first_login": {
                    "raw":     _iso(self.today_first_login),
                    "display": self.today_first_login_display,
                },
                "active_sec":   self.today_active_sec,
                "active":       self.today_active_display,
            },
            "session": {
                "active_sec":  self.current_session_sec,
                "active":      self.current_session_display,
                "is_active":   self.is_active,
            },
            "total": {
                "lifetime_sec": self.total_lifetime_sec,
                "lifetime":     self.total_lifetime_display,
                "lifetime_days":self.total_lifetime_days,
            },
        }


@dataclass
class HistoryRecord:
    """
    One row returned by sp_get_history.
    """
    activity_date:          date
    first_login_at:         datetime
    last_seen_at:           datetime
    total_active_sec:       int
    login_count:            int
    logout_count:           int
    cumulative_active_sec:  int

    def to_dict(self) -> dict:
        return {
            "date":             str(self.activity_date),
            "date_display":     datetime.combine(self.activity_date, datetime.min.time())
                                    .strftime("%a, %d %b %Y"),
            "session_start":    _iso(self.first_login_at),
            "session_display":  self.first_login_at.strftime("%I:%M %p"),
            "last_seen":        _iso(self.last_seen_at),
            "today_spend":      _fmt_hms(self.total_active_sec),
            "login_count":      self.login_count,
            "logout_count":     self.logout_count,
            "total_spend":      _fmt_hms(self.cumulative_active_sec),
            "total_spend_days": _fmt_days(self.cumulative_active_sec),
        }


# ── Helpers ───────────────────────────────────────────────────────────────────

def _fmt_hms(seconds: int) -> str:
    """Format seconds as HH:MM:SS."""
    if seconds is None or seconds < 0:
        seconds = 0
    h = seconds // 3600
    m = (seconds % 3600) // 60
    s = seconds % 60
    return f"{h:02d}:{m:02d}:{s:02d}"


def _fmt_days(seconds: int) -> str:
    """Format large durations as Xd Xh Xm."""
    if seconds is None or seconds < 0:
        seconds = 0
    d = seconds // 86400
    h = (seconds % 86400) // 3600
    m = (seconds % 3600) // 60
    if d > 0:
        return f"{d}d {h}h {m}m"
    if h > 0:
        return f"{h}h {m}m"
    return f"{m}m {seconds % 60}s"


def _iso(dt) -> Optional[str]:
    """Return ISO 8601 string or None."""
    if dt is None:
        return None
    return dt.isoformat() if hasattr(dt, "isoformat") else str(dt)
