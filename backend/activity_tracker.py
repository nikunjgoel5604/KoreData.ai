# activity_tracker.py — Kore_data-ex  v8.7
# =========================================================
# FORMAT UPDATE — All display formats aligned to requirement
# ─────────────────────────────────────────────────────────
# Current Session  → HH:MM:SS  (resets on every new login)
# Today Spend      → HH:MM:SS  (all completed sessions today + live)
# Total Spend      → HH:MM:SS  (cumulative all-time)
# Today Day card   → DD:HH:MM:SS  ("Day:hh:mm:ss" as specified)
# Sidebar Total    → DD:HH:MM:SS  (same unified format)
#
# DEFINITIONS (from user requirement):
#
# Current Session:
#   Time since the current login only. Resets to 00:00:00 on every
#   new login. Example: login 9:40 AM → shows time from 9:40 AM.
#
# Today Spend:
#   Sum of ALL completed sessions today + current live session.
#   Example: 9:00-9:30 AM (30m) + 9:40 AM onwards (live).
#   Today Spend = 30m + current session. NOT just one session.
#
# Total Spend:
#   Cumulative time from first-ever login to now.
#   Example: user first logged in 31/03/2026, today 03/04/2026,
#   Total = every minute they were online across all those days.
#
# Today Day:
#   Total Spend expressed as "DD:HH:MM:SS" so the user can see
#   exactly how many days, hours, minutes, seconds they've spent.
#   Example: 1 day 2 hours 30 min 15 sec → "01:02:30:15"
#
# Last Access:
#   The most recent logout time (or login time if still active).
#   After a logout it shows the logout time exactly.
#   After a re-login the live session updates it continuously.
# ─────────────────────────────────────────────────────────
# ALL FIXES FROM v8.6 CARRIED FORWARD UNCHANGED:
# · force_new=True skips same-day resume on explicit re-login
# · sendBeacon for reliable logout during navigation
# · validate_session() rejects cross-day sessions
# · record_logout() credits time to session's own date
# · logout_count always increments
# · get_history() adds live seconds to today's row
# =========================================================

import logging
from datetime  import datetime, date
from typing    import Optional, List, Tuple
from database  import get_connection

logger = logging.getLogger(__name__)


# ─── Formatters ───────────────────────────────────────────────────────────────

def _fmt_hms(seconds) -> str:
    """
    HH:MM:SS — Current Session and Today Spend.
    Hours can exceed 24 (no day rollover) so a full day of activity
    shows as 24:00:00, two days as 48:00:00, etc.
    """
    s = max(0, int(seconds) if seconds else 0)
    h = s // 3600
    m = (s % 3600) // 60
    sec = s % 60
    return f"{h:02d}:{m:02d}:{sec:02d}"


def _fmt_ddhmmss(seconds) -> str:
    """
    DD:HH:MM:SS — Today Day card and sidebar Total.
    As specified: "Day:hh:mm:ss"
    Example: 90061s (1d 1h 1m 1s) → "01:01:01:01"
             3723s  (0d 1h 2m 3s) → "00:01:02:03"
    """
    s  = max(0, int(seconds) if seconds else 0)
    d  = s // 86400
    h  = (s % 86400) // 3600
    m  = (s % 3600) // 60
    sec = s % 60
    return f"{d:02d}:{h:02d}:{m:02d}:{sec:02d}"


def _iso(dt) -> Optional[str]:
    return dt.isoformat() if dt and hasattr(dt, "isoformat") else None


# ─── Record login ─────────────────────────────────────────────────────────────

def record_login(
    login_id:   str,
    token:      str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    force_new:  bool          = False,
) -> dict:
    """
    Login recording — refresh-safe and force-new-safe.

    force_new=False (default — page refresh / validate path):
      Step 1: If active same-day session exists → RESUME it.
              login_count unchanged. Used for tab refresh, nav.
      Step 2: Close any stale sessions (previous days).
      Step 3: Insert new session for today.

    force_new=True (explicit logout + re-login):
      SKIPS Step 1 entirely. Goes straight to Step 2.
      This guarantees:
        · Any stale same-day session is closed with real duration
          and logout_count=1 (even if keepalive logout fetch failed).
        · today_comp is accumulated before new session starts.
        · Session counter resets to 00:00:00 from the new login_at.
        · login_count increments for the new login.
    """
    conn = get_connection()
    cur  = conn.cursor(dictionary=True)
    try:
        now   = datetime.now()
        today = date.today()

        # ── Step 1: Same-day resume (only when force_new=False) ────────────
        if not force_new:
            cur.execute(
                "SELECT session_token, login_at FROM user_sessions "
                "WHERE login_id=%s AND is_active=1 AND DATE(login_at)=%s "
                "ORDER BY login_at DESC LIMIT 1",
                (login_id, today)
            )
            existing = cur.fetchone()
            if existing:
                logger.info("[Activity] Same-day resume — user=%s", login_id)
                return {
                    "session_token": existing["session_token"],
                    "login_at":      _iso(existing["login_at"]),
                    "resumed":       True,
                }

        # ── Step 2: Close ALL active sessions (any day, including same-day) ─
        # force_new=True: also closes any same-day session that wasn't properly
        # logged out (e.g. keepalive fetch failed during navigation).
        cur.execute(
            "SELECT id, login_at FROM user_sessions "
            "WHERE login_id=%s AND is_active=1",
            (login_id,)
        )
        for stale in cur.fetchall():
            stale_dur  = max(0, int((now - stale["login_at"]).total_seconds()))
            stale_date = stale["login_at"].date()
            cur.execute(
                "UPDATE user_sessions "
                "SET is_active=0, logout_at=%s, duration_sec=%s WHERE id=%s",
                (now, stale_dur, stale["id"])
            )
            cur.execute(
                """INSERT INTO daily_activity
                   (login_id, activity_date, first_login_at, last_seen_at,
                    total_active_sec, logout_count)
                   VALUES (%s, %s, %s, %s, %s, 1)
                   ON DUPLICATE KEY UPDATE
                     last_seen_at     = VALUES(last_seen_at),
                     total_active_sec = total_active_sec + VALUES(total_active_sec),
                     logout_count     = logout_count + 1""",
                (login_id, stale_date, stale["login_at"], now, stale_dur)
            )
            logger.info(
                "[Activity] Session closed on login — user=%s date=%s dur=%ss force=%s",
                login_id, stale_date, stale_dur, force_new
            )

        # ── Step 3: Insert fresh session row ───────────────────────────────
        cur.execute(
            "INSERT INTO user_sessions "
            "(login_id, session_token, login_at, ip_address, user_agent) "
            "VALUES (%s, %s, %s, %s, %s)",
            (login_id, token, now, ip_address, user_agent)
        )

        # ── Step 4: Upsert daily_activity for today ────────────────────────
        # first_login_at is NEVER overwritten — it stays as the day's first login.
        cur.execute(
            """INSERT INTO daily_activity
               (login_id, activity_date, first_login_at, last_seen_at, login_count)
               VALUES (%s, %s, %s, %s, 1)
               ON DUPLICATE KEY UPDATE
                 last_seen_at = VALUES(last_seen_at),
                 login_count  = login_count + 1""",
            (login_id, today, now, now)
        )

        logger.info("[Activity] New session started — user=%s force=%s", login_id, force_new)
        return {
            "session_token": token,
            "login_at":      _iso(now),
            "resumed":       False,
        }
    finally:
        cur.close()
        conn.close()


# ─── Validate existing token ──────────────────────────────────────────────────

def validate_session(token: str, login_id: str) -> Optional[dict]:
    """
    Check saved activity token on every page load.
    Only resumes if the session started TODAY (CURDATE()).
    Cross-day sessions return None → forces a fresh session.
    """
    conn = get_connection()
    cur  = conn.cursor(dictionary=True)
    try:
        cur.execute(
            "SELECT session_token, login_at FROM user_sessions "
            "WHERE session_token=%s AND login_id=%s "
            "AND is_active=1 AND DATE(login_at)=CURDATE() "
            "LIMIT 1",
            (token, login_id)
        )
        row = cur.fetchone()
        if not row:
            return None
        return {
            "session_token": row["session_token"],
            "login_at":      _iso(row["login_at"]),
            "resumed":       True,
        }
    finally:
        cur.close()
        conn.close()


# ─── Record logout ────────────────────────────────────────────────────────────

def record_logout(token: str) -> Tuple[int, str]:
    """
    Close session. Always increments logout_count.
    Credits time to the day the session STARTED (session_date),
    not today — correct for sessions left open overnight.
    """
    conn = get_connection()
    cur  = conn.cursor(dictionary=True)
    try:
        cur.execute(
            "SELECT id, login_id, login_at FROM user_sessions "
            "WHERE session_token=%s AND is_active=1 LIMIT 1",
            (token,)
        )
        session = cur.fetchone()
        if not session:
            return 0, "00:00:00"

        now          = datetime.now()
        session_date = session["login_at"].date()
        dur_sec      = max(0, int((now - session["login_at"]).total_seconds()))

        cur.execute(
            "UPDATE user_sessions "
            "SET logout_at=%s, duration_sec=%s, is_active=0 "
            "WHERE session_token=%s",
            (now, dur_sec, token)
        )

        # Always upsert — logout_count increments even for zero-duration sign-out
        cur.execute(
            """INSERT INTO daily_activity
               (login_id, activity_date, first_login_at, last_seen_at,
                total_active_sec, logout_count)
               VALUES (%s, %s, %s, %s, %s, 1)
               ON DUPLICATE KEY UPDATE
                 last_seen_at     = VALUES(last_seen_at),
                 total_active_sec = total_active_sec + VALUES(total_active_sec),
                 logout_count     = logout_count + 1""",
            (session["login_id"], session_date, session["login_at"], now, dur_sec)
        )

        logger.info(
            "[Activity] Logout — user=%s date=%s dur=%ss",
            session["login_id"], session_date, dur_sec
        )
        return dur_sec, _fmt_hms(dur_sec)
    finally:
        cur.close()
        conn.close()


# ─── Heartbeat ────────────────────────────────────────────────────────────────

def heartbeat(token: str) -> bool:
    """60s keep-alive. Updates last_seen_at using session's own date."""
    conn = get_connection()
    cur  = conn.cursor(dictionary=True)
    try:
        cur.execute(
            "SELECT login_id, login_at FROM user_sessions "
            "WHERE session_token=%s AND is_active=1 LIMIT 1",
            (token,)
        )
        row = cur.fetchone()
        if not row:
            return False
        now          = datetime.now()
        session_date = row["login_at"].date()
        cur.execute(
            "UPDATE daily_activity SET last_seen_at=%s "
            "WHERE login_id=%s AND activity_date=%s",
            (now, row["login_id"], session_date)
        )
        cur.execute(
            "UPDATE user_sessions SET logout_at=%s "
            "WHERE session_token=%s AND is_active=1",
            (now, token)
        )
        return True
    finally:
        cur.close()
        conn.close()


# ─── Dashboard stats ──────────────────────────────────────────────────────────

def get_dashboard(login_id: str) -> dict:
    """
    Sidebar + stat card values.

    Session = NOW() - current login_at  (resets on every new login)
    Today   = today's completed secs + live session secs
    Total   = SUM(all days' completed secs) + live session secs
    """
    conn = get_connection()
    cur  = conn.cursor(dictionary=True)
    try:
        today = date.today()

        cur.execute(
            "SELECT MIN(login_at) AS fe FROM user_sessions WHERE login_id=%s",
            (login_id,)
        )
        first_ever = (cur.fetchone() or {}).get("fe")

        cur.execute(
            "SELECT COALESCE(MAX(logout_at), MAX(login_at)) AS la "
            "FROM user_sessions WHERE login_id=%s",
            (login_id,)
        )
        last_access = (cur.fetchone() or {}).get("la")

        # Completed seconds for today from daily_activity
        cur.execute(
            "SELECT first_login_at, total_active_sec "
            "FROM daily_activity "
            "WHERE login_id=%s AND activity_date=%s",
            (login_id, today)
        )
        da          = cur.fetchone() or {}
        today_first = da.get("first_login_at")
        today_comp  = int(da.get("total_active_sec") or 0)

        # Live session — today only
        cur.execute(
            "SELECT login_at FROM user_sessions "
            "WHERE login_id=%s AND is_active=1 AND DATE(login_at)=%s "
            "ORDER BY login_at DESC LIMIT 1",
            (login_id, today)
        )
        active_row = cur.fetchone()
        cur_sec    = 0
        is_active  = False
        if active_row:
            is_active = True
            cur_sec   = max(0, int((datetime.now() - active_row["login_at"]).total_seconds()))

        today_total = today_comp + cur_sec

        cur.execute(
            "SELECT COALESCE(SUM(total_active_sec), 0) AS tot "
            "FROM daily_activity WHERE login_id=%s",
            (login_id,)
        )
        total_comp     = int((cur.fetchone() or {}).get("tot") or 0)
        lifetime_total = total_comp + cur_sec

        def _disp(dt):
            return dt.strftime("%A, %d %B %Y, %I:%M %p") if dt else "—"

        return {
            "first_access": {
                "raw":     _iso(first_ever),
                "display": _disp(first_ever),
            },
            "last_access": {
                "raw":     _iso(last_access),
                "display": _disp(last_access),
            },
            "today": {
                "first_login": {
                    "raw":     _iso(today_first),
                    "display": today_first.strftime("%I:%M %p") if today_first else "—",
                },
                # active_sec: total seconds today (completed + live)
                # active: HH:MM:SS display
                "active_sec": today_total,
                "active":     _fmt_hms(today_total),
            },
            "session": {
                # active_sec: seconds since current login (resets on every new login)
                # active: HH:MM:SS display
                "active_sec": cur_sec,
                "active":     _fmt_hms(cur_sec),
                "is_active":  is_active,
            },
            "total": {
                # lifetime_sec: all-time total seconds
                # lifetime: HH:MM:SS (Total Spend card)
                # lifetime_dhms: DD:HH:MM:SS (Today Day card and sidebar)
                "lifetime_sec":  lifetime_total,
                "lifetime":      _fmt_hms(lifetime_total),
                "lifetime_dhms": _fmt_ddhmmss(lifetime_total),
            },
        }
    finally:
        cur.close()
        conn.close()


# ─── History ─────────────────────────────────────────────────────────────────

def get_history(login_id: str, limit: int = 30) -> List[dict]:
    """
    Day-wise history table.

    FIX: Today Spend showed 00:00:00 because daily_activity.total_active_sec
    only accumulates on session close. The live session's seconds were never
    included. Now we fetch the live session separately and add its seconds to
    today's row before formatting. All past days are unaffected.

    Columns returned:
      date_display    → "Mon, 30 Mar 2026"
      session_display → "09:48 AM"   (first login of the day)
      today_spend     → "HH:MM:SS"   (completed + live seconds for today)
      login_count     → int
      logout_count    → int
      total_spend_days→ "X Days Xh Xm" (cumulative from first day)
    """
    conn = get_connection()
    cur  = conn.cursor(dictionary=True)
    try:
        today = date.today()

        # Fetch live session seconds so today's row is accurate
        cur.execute(
            "SELECT login_at FROM user_sessions "
            "WHERE login_id=%s AND is_active=1 AND DATE(login_at)=%s "
            "LIMIT 1",
            (login_id, today)
        )
        live_row  = cur.fetchone()
        live_sec  = 0
        if live_row:
            live_sec = max(0, int((datetime.now() - live_row["login_at"]).total_seconds()))

        # Day-wise rows with cumulative window function
        cur.execute(
            """SELECT
                   activity_date,
                   first_login_at,
                   last_seen_at,
                   total_active_sec,
                   login_count,
                   logout_count,
                   SUM(total_active_sec) OVER (
                       PARTITION BY login_id
                       ORDER BY activity_date
                       ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
                   ) AS cum_sec
               FROM daily_activity
               WHERE login_id=%s
               ORDER BY activity_date DESC
               LIMIT %s""",
            (login_id, limit)
        )

        rows = []
        for r in cur.fetchall():
            ad  = r["activity_date"]
            fla = r["first_login_at"]

            # Add live seconds only to today's row
            completed_sec = int(r["total_active_sec"] or 0)
            is_today      = (ad == today) if isinstance(ad, date) else (str(ad) == str(today))
            act_sec       = completed_sec + (live_sec if is_today else 0)
            cum_sec       = int(r["cum_sec"] or 0) + (live_sec if is_today else 0)

            rows.append({
                "date":             str(ad),
                "date_display":     ad.strftime("%a, %d %b %Y")
                                    if hasattr(ad, "strftime") else str(ad),
                "session_start":    _iso(fla),
                "session_display":  fla.strftime("%I:%M %p") if fla else "—",
                "last_seen":        _iso(r["last_seen_at"]),
                "today_spend":      _fmt_hms(act_sec),
                "login_count":      r["login_count"],
                "logout_count":     r["logout_count"],
                "total_spend":      _fmt_hms(cum_sec),
                "total_spend_days": _fmt_ddhmmss(cum_sec),   # DD:HH:MM:SS
            })
        return rows
    finally:
        cur.close()
        conn.close()
