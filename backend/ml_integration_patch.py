# ml_integration_patch.py
# =========================================================
# HOW TO WIRE ml_engine.py + ml_routes.py + ml.js
# into your existing Kore_data-ex project
#
# ── FILE PLACEMENT ─────────────────────────────────────
#   ml_engine.py  → backend/ml_engine.py
#   ml_routes.py  → backend/ml_routes.py
#   ml.js         → backend/static/Js/ml.js
#
# ── STEP 1: main.py — add 2 lines ──────────────────────
# In main.py, in the imports section, after:
#   from simulation_engine import simulation_router
# ADD:
#   from ml_routes import ml_router
#
# In main.py, after:
#   app.include_router(simulation_router)
# ADD:
#   app.include_router(ml_router)
#
# ── STEP 2: home.html — add sidebar nav item ───────────
# In home.html, inside the "Intelligence" sidebar-group,
# after the "Predictive Model" nav-item, ADD:
#
#   <div class="nav-item" data-section="ml-studio">
#     <span class="nav-icon">🤖</span>ML Studio
#   </div>
#
# ── STEP 3: home.html — add the section container ──────
# In home.html, inside <main class="content-area">,
# after section-predict, ADD:
#
#   <!-- ── ML Studio ──────────────────────────────── -->
#   <section class="content-section" id="section-ml-studio">
#     <!-- Populated by MLStudio.init() in ml.js -->
#   </section>
#
# ── STEP 4: home.html — add sectionTitles entry ────────
# In home.html, in the sectionTitles object, ADD:
#   'ml-studio': 'ML Studio',
#
# ── STEP 5: home.html — init on nav click ──────────────
# In home.html, in the section nav click handler, ADD:
#   if (el.dataset.section === 'ml-studio') {
#     MLStudio.init();
#   }
#
# ── STEP 6: home.html — load ml.js script ──────────────
# Before </body> in home.html, AFTER activity_tracker_ui.js,
# ADD:
#   <script src="/static/Js/ml.js"></script>
#
# ── STEP 7: eda.js — wire switch case ──────────────────
# In eda.js DOMContentLoaded event handler, inside the
# switch(section) block, ADD:
#   case 'ml-studio': if (window.MLStudio) MLStudio.init(); break;
#
# ── REQUIREMENTS ───────────────────────────────────────
# All ML dependencies (sklearn, numpy, pandas) are already
# in requirements.txt. No new packages needed.
# =========================================================


# ── EXACT DIFF for main.py ─────────────────────────────

MAIN_PY_IMPORT_ADDITION = """
from ml_routes import ml_router          # ML/DL Studio
"""

MAIN_PY_ROUTER_ADDITION = """
app.include_router(ml_router)            # /ml/recommend, /ml/train, /ml/auto, /ml/models
"""

# ── EXACT HTML for home.html sidebar ──────────────────

SIDEBAR_NAV_ITEM = """
          <div class="nav-item" data-section="ml-studio">
            <span class="nav-icon">🤖</span>ML Studio
          </div>
"""

# ── EXACT HTML for home.html section ──────────────────

SECTION_HTML = """
      <!-- ── ML Studio ─────────────────────────────────────────── -->
      <section class="content-section" id="section-ml-studio">
        <!-- Populated dynamically by MLStudio.init() in ml.js -->
      </section>
"""

# ── SECTION TITLE ─────────────────────────────────────

SECTION_TITLE_ENTRY = """
    'ml-studio': 'ML Studio',
"""

# ── SCRIPT TAG ────────────────────────────────────────

SCRIPT_TAG = """
<script src="/static/Js/ml.js"></script>
"""
