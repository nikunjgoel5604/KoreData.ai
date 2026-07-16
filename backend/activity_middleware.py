# activity_middleware.py — Kore_data-ex  v8.2
# =========================================================
# CHANGES vs v1.0
# ─────────────────────────────────────────────────────────
# FIX 1  _update_last_seen() was synchronous inside an async
#         middleware. Under load this blocks the event loop.
#         Now runs in a background thread via asyncio.
#
# FIX 2  /activity/* paths are now skipped. The middleware
#         was previously touching daily_activity on every
#         heartbeat request, causing redundant DB writes
#         (heartbeat already updates last_seen_at itself).
#
# FIX 3  Skip list expanded to include /activity, /auth,
#         /simulation to avoid unnecessary DB calls on
#         unauthenticated and non-data paths.
#
# PURPOSE (unchanged):
#   Passive secondary tracking layer. On every authenticated
#   API request it touches daily_activity.last_seen_at using
#   the Bearer auth token. This covers non-JS clients and
#   ensures last_seen is accurate even without a heartbeat.
#   Safe to enable or disable — primary tracking is the
#   frontend heartbeat every 60s.
#
# OPTIONAL — mount in main.py:
#   from activity_middleware import ActivityMiddleware
#   app.add_middleware(ActivityMiddleware)
# =========================================================

import asyncio
import logging
from datetime import datetime, date

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests        import Request
from starlette.responses       import Response

logger = logging.getLogger(__name__)

# Paths that should never trigger activity recording
_SKIP_PREFIXES = (
    "/health",
    "/static",
    "/docs",
    "/openapi.json",
    "/redoc",
    "/favicon",
    "/activity",    # activity routes handle their own DB writes
    "/auth",        # auth routes don't need passive tracking
    "/simulation",  # simulation SSE stream — no tracking needed
)


class ActivityMiddleware(BaseHTTPMiddleware):
    """
    Passive last-seen tracker.

    On every authenticated request to a data endpoint it updates
    daily_activity.last_seen_at using the auth Bearer token.

    Runs the DB update in a thread pool so it never blocks the
    async event loop.
    """

    async def dispatch(self, request: Request, call_next) -> Response:
        # Process the actual request first — never delay the response
        response = await call_next(request)

        # Skip non-data paths
        path = request.url.path
        if any(path.startswith(p) for p in _SKIP_PREFIXES):
            return response

        # Only track authenticated requests
        auth = request.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return response

        token = auth[7:]

        # FIX 1: Run synchronous DB call in a thread pool,
        # not directly in the async dispatch method.
        try:
            loop = asyncio.get_event_loop()
            loop.run_in_executor(None, self._update_last_seen, token)
        except Exception as exc:
            # Never let middleware errors affect the response
            logger.debug("[ActivityMiddleware] executor error: %s", exc)

        return response

    @staticmethod
    def _update_last_seen(token: str) -> None:
        """
        Touch last_seen_at for the user owning this auth token.
        Looks up login_id from the sessions (auth) table, then
        updates daily_activity for today.

        Silently no-ops if:
        - Token not found or expired
        - daily_activity row doesn't exist yet for today
          (it will be created on next heartbeat/login)
        """
        try:
            from database import db_fetchone, get_connection

            # Resolve auth token → login_id
            row = db_fetchone(
                "SELECT login_id FROM sessions "
                "WHERE token = %s AND expires_at > NOW() LIMIT 1",
                (token,),
            )
            if not row:
                return

            login_id = row["login_id"]
            today    = date.today()
            now      = datetime.now()

            conn = get_connection()
            cur  = conn.cursor()
            try:
                cur.execute(
                    "UPDATE daily_activity SET last_seen_at = %s "
                    "WHERE login_id = %s AND activity_date = %s",
                    (now, login_id, today),
                )
                # Only log if a row was actually updated (avoids noise on first login of day)
                if cur.rowcount > 0:
                    logger.debug(
                        "[ActivityMiddleware] last_seen_at updated — user=%s", login_id
                    )
            finally:
                cur.close()
                conn.close()

        except Exception as exc:
            # Silently swallow all errors — middleware must never break a response
            logger.debug("[ActivityMiddleware] _update_last_seen error: %s", exc)
