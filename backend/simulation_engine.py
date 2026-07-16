# simulation_engine.py — Kore_data-ex  v6.0
# =========================================================
# Backend simulation engine.
#
# Responsibilities:
#   · Define the canonical EDA simulation step sequence
#   · Provide a /simulation/steps endpoint so the frontend
#     always gets step definitions from the server (single
#     source of truth — no duplication in JS)
#   · Provide a /simulation/run  endpoint that streams
#     Server-Sent Events (SSE) with live step progress
#
# Exported FastAPI router: simulation_router
# Mount in main.py:
#   from simulation_engine import simulation_router
#   app.include_router(simulation_router)
# =========================================================

import asyncio
import json
from datetime import datetime
from typing   import AsyncGenerator

from fastapi           import APIRouter, Header
from fastapi.responses import StreamingResponse
from typing            import Optional

simulation_router = APIRouter(prefix="/simulation", tags=["Simulation"])


# ─── Step definitions ─────────────────────────────────────────────────────────
# Each step has:
#   key                   — machine identifier used by frontend
#   label                 — short display title
#   description           — one-line explanation shown in the panel
#   duration_ms           — realistic wait time (used by SSE stream)
#   section               — optional frontend section to navigate to
#   accuracy_dimension    — which EDA Accuracy dimension this step evaluates
#   accuracy_contribution — cumulative % of accuracy score revealed by this step

SIMULATION_STEPS: list[dict] = [
    {
        "key":                  "load",
        "label":                "Loading dataset",
        "description":          "Reading file bytes and detecting encoding / delimiter",
        "duration_ms":          800,
        "section":              "upload",
        "accuracy_dimension":   None,
        "accuracy_contribution": 0,
    },
    {
        "key":                  "inspect",
        "label":                "Inspecting structure",
        "description":          "Counting rows, columns, data types — checking Integrity",
        "duration_ms":          600,
        "section":              "structure",
        "accuracy_dimension":   "integrity",
        "accuracy_contribution": 10,
    },
    {
        "key":                  "stats",
        "label":                "Computing statistics",
        "description":          "Mean, median, std dev, ranges — checking Validity",
        "duration_ms":          900,
        "section":              "overview",
        "accuracy_dimension":   "validity",
        "accuracy_contribution": 25,
    },
    {
        "key":                  "missing",
        "label":                "Detecting missing values",
        "description":          "Locating NaN / null cells — evaluating Completeness",
        "duration_ms":          700,
        "section":              "missing",
        "accuracy_dimension":   "completeness",
        "accuracy_contribution": 45,
    },
    {
        "key":                  "correlation",
        "label":                "Building correlations",
        "description":          "Pearson correlation matrix — evaluating Consistency",
        "duration_ms":          1000,
        "section":              "correlation",
        "accuracy_dimension":   "consistency",
        "accuracy_contribution": 60,
    },
    {
        "key":                  "charts",
        "label":                "Generating charts",
        "description":          "Histograms and box plots for distribution analysis",
        "duration_ms":          800,
        "section":              "charts",
        "accuracy_dimension":   "validity",
        "accuracy_contribution": 72,
    },
    {
        "key":                  "nlp",
        "label":                "Running NLP analysis",
        "description":          "Detecting text columns — evaluating Uniqueness patterns",
        "duration_ms":          700,
        "section":              "nlp",
        "accuracy_dimension":   "uniqueness",
        "accuracy_contribution": 82,
    },
    {
        "key":                  "insights",
        "label":                "Deriving insights",
        "description":          "Auto-generating observations from statistical patterns",
        "duration_ms":          600,
        "section":              "insights",
        "accuracy_dimension":   None,
        "accuracy_contribution": 92,
    },
    {
        "key":                  "report",
        "label":                "Finalising report",
        "description":          "Computing final EDA Accuracy score — packaging results",
        "duration_ms":          400,
        "section":              None,
        "accuracy_dimension":   None,
        "accuracy_contribution": 100,
    },
]


# ─── REST endpoint — step definitions ─────────────────────────────────────────

@simulation_router.get("/steps")
def get_simulation_steps():
    """
    Return the ordered list of simulation steps.
    Frontend uses this to build the panel — single source of truth.
    """
    return {"steps": SIMULATION_STEPS, "total": len(SIMULATION_STEPS)}


# ─── SSE endpoint — live streaming simulation ─────────────────────────────────

@simulation_router.get("/run")
async def run_simulation(authorization: Optional[str] = Header(None)):
    """
    Stream EDA simulation progress as Server-Sent Events.

    Each event is a JSON object:
      { "step": <index>, "key": "...", "label": "...",
        "description": "...", "section": "...",
        "status": "running" | "done",
        "progress": <0-100> }

    A final event with status "complete" signals the stream is finished.

    Frontend usage (simulation.js):
      const es = new EventSource('/simulation/run');
      es.onmessage = e => { const data = JSON.parse(e.data); ... };
    """

    async def _event_stream() -> AsyncGenerator[str, None]:
        total = len(SIMULATION_STEPS)

        for i, step in enumerate(SIMULATION_STEPS):
            # ── "running" event ───────────────────────────────────────────────
            running_payload = json.dumps({
                "step":               i,
                "key":                step["key"],
                "label":              step["label"],
                "description":        step["description"],
                "section":            step["section"],
                "accuracy_dimension": step["accuracy_dimension"],
                "accuracy_progress":  step["accuracy_contribution"],
                "status":             "running",
                "progress":           round(i / total * 100),
            })
            yield f"data: {running_payload}\n\n"

            await asyncio.sleep(step["duration_ms"] / 1000)

            # ── "done" event ──────────────────────────────────────────────────
            done_payload = json.dumps({
                "step":               i,
                "key":                step["key"],
                "label":              step["label"],
                "description":        step["description"],
                "section":            step["section"],
                "accuracy_dimension": step["accuracy_dimension"],
                "accuracy_progress":  step["accuracy_contribution"],
                "status":             "done",
                "progress":           round((i + 1) / total * 100),
            })
            yield f"data: {done_payload}\n\n"

        # ── final "complete" event ────────────────────────────────────────────
        complete_payload = json.dumps({
            "status":       "complete",
            "progress":     100,
            "completed_at": datetime.now().isoformat(),
            "total_steps":  total,
        })
        yield f"data: {complete_payload}\n\n"

    return StreamingResponse(
        _event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control":               "no-cache",
            "X-Accel-Buffering":           "no",   # required for nginx proxy
            "Access-Control-Allow-Origin": "*",
        },
    )
