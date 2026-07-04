# main_activity_patch.py — Kore_data-ex  v8.2
# =========================================================
# Reference document — shows the COMPLETE integration state
# of activity tracking in main.py.
#
# As of v8.2 your main.py already has:
#   ✅ activity_router imported and mounted
#   ✅ user_sessions + daily_activity tables in database.py init_db()
#
# What you may still want to add (optional):
#   ⬜ ActivityMiddleware (passive last-seen — see below)
#
# What you do NOT need to add:
#   ❌ record_login() / record_logout() calls inside auth routes
#      The frontend handles this via POST /activity/login and
#      POST /activity/validate on every page load.
#      Backend auth routes (verify-otp, password-login) do NOT
#      need to touch activity tracking at all.
#   ❌ activity_token in auth responses
#      The frontend generates and stores its own activity token
#      via the /activity/login endpoint. Auth routes return only
#      the auth token. Activity token lives in localStorage.
# =========================================================


# ════════════════════════════════════════════════════════
#  WHAT IS ALREADY IN main.py  (no action needed)
# ════════════════════════════════════════════════════════

ALREADY_DONE = """
# Line 52  (imports section)
from activity_routes import activity_router      # v8.0 activity tracking

# Line 77  (after simulation_router)
app.include_router(activity_router)              # registers all /activity/* endpoints
"""


# ════════════════════════════════════════════════════════
#  OPTIONAL: Add ActivityMiddleware (passive last-seen)
#
#  What it does:
#    - On every authenticated API request it silently touches
#      daily_activity.last_seen_at using the auth Bearer token.
#    - This is a secondary passive layer. The primary tracking
#      is the frontend heartbeat every 60s.
#    - Safe to skip — heartbeat already covers last_seen_at.
#    - Add if you want server-side tracking even for non-JS clients.
#
#  How to add (3 lines in main.py):
# ════════════════════════════════════════════════════════

MIDDLEWARE_STEP_1_IMPORT = """
# Add after:
#   from activity_routes import activity_router

from activity_middleware import ActivityMiddleware
"""

MIDDLEWARE_STEP_2_REGISTER = """
# Add AFTER:
#   app.add_middleware(CORSMiddleware, ...)
# and BEFORE:
#   app.include_router(simulation_router)

app.add_middleware(ActivityMiddleware)
"""

# Full context showing exact placement:
MIDDLEWARE_PLACEMENT_EXAMPLE = """
# ── Current main.py structure (your file) ─────────────────
from activity_routes   import activity_router
from activity_middleware import ActivityMiddleware        # ← ADD THIS LINE

app = FastAPI(title="Kore_data-ex API", version="8.2", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(ActivityMiddleware)                    # ← ADD THIS LINE

app.include_router(simulation_router)
app.include_router(activity_router)
"""


# ════════════════════════════════════════════════════════
#  HOW THE ACTIVITY SYSTEM WORKS (v8.2 architecture)
# ════════════════════════════════════════════════════════

ARCHITECTURE_NOTES = """
FLOW ON PAGE LOAD:
──────────────────
1. Frontend loads home.html
2. activity_tracker_ui.js DOMContentLoaded fires
3. startSession() reads kore_activity_token from localStorage
4. If token exists → POST /activity/validate
      Server checks user_sessions WHERE session_token=? AND is_active=1
      Valid  → returns existing session info, frontend reuses token
      Invalid → fall through to step 5
5. If no token (or invalid) → POST /activity/login
      Server inserts new user_sessions row, returns new activity token
      Frontend stores token in localStorage as kore_activity_token
6. Every 60s → POST /activity/heartbeat (keeps last_seen_at fresh)
7. Every 30s → GET /activity/dashboard (updates all stat cards)

FLOW ON SIGN OUT:
─────────────────
1. User clicks Sign Out button
2. core.js logout() called
3. await ActivityTracker.signOut() called
4. endSession() → POST /activity/logout (closes user_sessions row with duration)
5. localStorage.removeItem('kore_activity_token')
6. localStorage.removeItem('kore_token') + other auth keys
7. Redirect to /

FLOW ON PASSWORD CHANGE / PROFILE UPDATE:
──────────────────────────────────────────
1. User changes password (forgot-password flow)
2. Redirected to login page → pagehide fires
3. pagehide sends beacon to /activity/heartbeat ONLY
   (does NOT close session, does NOT remove activity token)
4. User logs back in with new password
5. startSession() reads kore_activity_token from localStorage (still there)
6. POST /activity/validate → token still active in DB → RESUMED
7. Session continues, no reset, login_count unchanged

RESET CONDITION (only):
───────────────────────
· User clicks Sign Out → session closed, token removed
· User account deleted → ON DELETE CASCADE removes all user_sessions rows
· Nothing else resets the activity session
"""


# ════════════════════════════════════════════════════════
#  ENDPOINTS REGISTERED BY activity_router
# ════════════════════════════════════════════════════════

ENDPOINTS = """
POST /activity/validate       → check if saved token still active (refresh-safe)
POST /activity/login          → start new activity session
POST /activity/logout         → close session, record duration
POST /activity/heartbeat      → keep-alive ping every 60s
GET  /activity/dashboard      → all 4 stat card values + first/last access
GET  /activity/history        → day-wise history table (limit param)
GET  /activity/login-activity → combined dashboard + history (for Login Activity section)
"""


# ════════════════════════════════════════════════════════
#  DATABASE TABLES (created automatically by init_db())
# ════════════════════════════════════════════════════════

DB_TABLES = """
user_sessions   — one row per login event
                  (login_at, logout_at, duration_sec, is_active, session_token)

daily_activity  — one aggregated row per user per calendar day
                  (first_login_at, last_seen_at, total_active_sec,
                   login_count, logout_count)

Both tables use login_id FK → kore_users.login_id
ON DELETE CASCADE so account deletion removes all activity data.
"""
