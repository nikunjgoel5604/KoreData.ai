# main_landing_patch.py — Kore Data  v1.0
# =========================================================
# EXACT lines to add to your existing main.py
# DO NOT overwrite main.py — only add these lines.
# =========================================================

# ── STEP 1: Add import near the top of main.py ────────────
#
# After:
#   from activity_routes import activity_router
#
# Add:
#   from landing_routes import landing_router, init_contact_table

# ── STEP 2: Mount the router ──────────────────────────────
#
# After:
#   app.include_router(activity_router)
#
# Add:
#   app.include_router(landing_router)

# ── STEP 3: Call init_contact_table in lifespan ───────────
#
# In your existing lifespan function:
#   @asynccontextmanager
#   async def lifespan(app: FastAPI):
#       init_db()
#       yield
#
# Change to:
#   @asynccontextmanager
#   async def lifespan(app: FastAPI):
#       init_db()
#       init_contact_table()   # ← ADD THIS LINE
#       yield

# ── STEP 4: Update static CSS mount path ─────────────────
#
# Your existing mount:
#   app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")
#
# This already serves everything under /static/ so landing.css,
# about.css, services.css, contact.css will be served automatically
# once you place them in backend/static/CSS/
#
# NOTE: CSS paths in the HTML use lowercase /static/css/ — make sure
# your static folder uses the same case as the filesystem.
# If your folder is "CSS" (uppercase), either rename to "css" or
# update the <link> tags in the HTML files to match.

# ── QUICK DIFF (copy-paste friendly) ─────────────────────

MAIN_PY_IMPORT_PATCH = """
# At top with other imports:
from landing_routes import landing_router, init_contact_table
"""

MAIN_PY_ROUTER_PATCH = """
# After: app.include_router(activity_router)
app.include_router(landing_router)
"""

MAIN_PY_LIFESPAN_PATCH = """
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    init_contact_table()   # NEW
    yield
"""

# ── CSS FOLDER NOTE ───────────────────────────────────────
#
# Place new CSS files in:
#   backend/static/CSS/landing.css
#   backend/static/CSS/about.css
#   backend/static/CSS/services.css
#   backend/static/CSS/contact.css
#
# If your static path uses "css" (lowercase), update <link> tags.
# All 4 CSS files extend the existing theme — they do NOT touch
# login.css or theme.css.
#
# Place new JS files in:
#   backend/static/Js/slider.js
#
# This only adds slider logic for about.html and does NOT
# touch or modify any existing JS files.
