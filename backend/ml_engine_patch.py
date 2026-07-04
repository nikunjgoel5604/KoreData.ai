# ═══════════════════════════════════════════════════════════════════════════════
#  ML ENGINE PATCH — v4.1
#  APPEND this entire block to the bottom of your existing ml_engine.py
#
#  KEY FIX vs v4.0:
#    recommend_models() returns key "recommendations" (list of dicts with
#    "model_key", "score", etc.) — NOT "ranked". v4.0 used recs.get("ranked")
#    which silently returned [] every time, breaking all suggestions.
#
#  Adds three public functions:
#    • parse_user_prompt(prompt, df)
#    • suggest_prediction_goals(df, eda_score)
#    • recommend_from_prompt(df, prompt, eda_score)
# ═══════════════════════════════════════════════════════════════════════════════

from __future__ import annotations
import re
from typing import Any, Dict, List, Optional
import pandas as pd

# ─── Keyword banks ────────────────────────────────────────────────────────────

_INCREASE_DECREASE = {
    "increase", "decrease", "rise", "fall", "grow", "shrink", "up", "down",
    "higher", "lower", "trend", "change", "fluctuate", "spike", "drop",
    "surge", "decline", "more", "less",
}
_BINARY_WORDS = {
    "whether", "will", "detect", "identify", "classify", "is", "are", "does",
    "churn", "fraud", "spam", "default", "survive", "outcome",
    "yes or no", "true or false", "0 or 1", "positive", "negative",
}
_CATEGORY_WORDS = {
    "category", "type", "group", "class", "kind", "label", "segment",
    "bucket", "tier", "genre", "species", "department",
}
_NUMERIC_WORDS = {
    "how much", "how many", "amount", "value", "score", "rate", "price",
    "cost", "revenue", "count", "number", "total", "sum", "average",
    "mean", "level", "quantity", "percentage", "ratio", "weight", "height",
    "temperature", "sales", "demand", "forecast", "estimate",
}
_CLUSTER_WORDS = {
    "cluster", "group", "segment", "partition", "profile", "similar",
    "pattern", "community", "cohort",
}
_TASK_ICONS = {
    "classification": "🎯",
    "regression":     "📈",
    "clustering":     "🔵",
}


# ─── Private helpers ──────────────────────────────────────────────────────────

def _empty_parse_result(df: pd.DataFrame, reason: str = "") -> dict:
    numeric_cols = df.select_dtypes(include="number").columns.tolist() if not df.empty else []
    cat_cols     = df.select_dtypes(exclude="number").columns.tolist() if not df.empty else []
    return {
        "inferred_task":     None,
        "inferred_target":   None,
        "confidence":        0.0,
        "explanation":       reason or "Could not infer task from prompt.",
        "prompt_type":       "unknown",
        "suggested_targets": numeric_cols[:4],
        "numeric_cols":      numeric_cols,
        "cat_cols":          cat_cols,
        "all_cols":          df.columns.tolist() if not df.empty else [],
    }


def _rank_target_candidates(df: pd.DataFrame, tokens: set, task: str) -> List[str]:
    candidates: list = []
    numeric_cols = set(df.select_dtypes(include="number").columns)
    cat_cols     = set(df.select_dtypes(exclude="number").columns)

    for col in df.columns:
        col_lower = col.lower().replace("_", " ").replace("-", " ")
        col_words = set(col_lower.split())
        score     = 0.0

        overlap = len(col_words & tokens)
        score  += overlap * 2.0

        for tok in tokens:
            if len(tok) > 3 and tok in col_lower:
                score += 1.0

        if re.search(r"\bid\b|_id$|^id_", col_lower):
            score -= 3.0

        if task == "regression" and col in numeric_cols:
            score += 0.5
        elif task == "classification":
            unique_ratio = df[col].nunique() / max(len(df), 1)
            if col in cat_cols or (col in numeric_cols and unique_ratio < 0.05):
                score += 0.5

        candidates.append((score, col))

    candidates.sort(key=lambda x: -x[0])
    return [c for sc, c in candidates if sc > 0]


def _build_prompt_explanation(prompt: str, task: str, target, conf: float) -> str:
    task_desc = {
        "regression":     "predict a numeric value",
        "classification": "classify into categories",
        "clustering":     "group rows by pattern",
    }.get(task, "analyse the data")
    if target:
        return (
            f"Your goal appears to be: {task_desc}. "
            f"The most likely target column is '{target}' "
            f"(confidence {conf:.0%})."
        )
    return f"Your goal appears to be: {task_desc} (confidence {conf:.0%})."


# ─── Public: parse_user_prompt ────────────────────────────────────────────────

def parse_user_prompt(prompt: str, df: pd.DataFrame) -> dict:
    """
    Parse a natural-language prediction prompt against the loaded dataset.
    Returns inferred_task, inferred_target, confidence, explanation,
    suggested_targets, numeric_cols, cat_cols, all_cols.
    """
    if df is None or df.empty:
        return _empty_parse_result(pd.DataFrame(), "Dataset is empty.")

    prompt_lower = prompt.lower()
    tokens       = set(re.sub(r"[^\w\s]", " ", prompt_lower).split())

    scores: Dict[str, float] = {
        "regression": 0.0, "classification": 0.0, "clustering": 0.0,
    }

    for word in _CLUSTER_WORDS:
        if word in prompt_lower:
            scores["clustering"] += 1.5

    for word in _NUMERIC_WORDS:
        if word in prompt_lower:
            scores["regression"] += 1.0

    inc_dec_hits = sum(1 for w in _INCREASE_DECREASE if w in prompt_lower)
    if inc_dec_hits:
        scores["regression"]     += inc_dec_hits * 0.8
        scores["classification"] += inc_dec_hits * 0.6

    for word in _BINARY_WORDS:
        if word in prompt_lower:
            scores["classification"] += 1.0

    for word in _CATEGORY_WORDS:
        if word in prompt_lower:
            scores["classification"] += 1.2

    best_task  = max(scores, key=lambda k: scores[k])
    best_score = scores[best_task]

    if best_score == 0.0:
        return _empty_parse_result(
            df, "No recognisable prediction intent found in the prompt."
        )

    total_score = sum(scores.values()) or 1.0
    confidence  = round(min(scores[best_task] / total_score, 0.97), 2)

    ranked_targets = _rank_target_candidates(df, tokens, best_task)
    top_target     = ranked_targets[0] if ranked_targets else None

    if best_task == "clustering":
        top_target = None

    numeric_cols = df.select_dtypes(include="number").columns.tolist()
    cat_cols     = df.select_dtypes(exclude="number").columns.tolist()

    return {
        "inferred_task":     best_task,
        "inferred_target":   top_target,
        "confidence":        confidence,
        "explanation":       _build_prompt_explanation(
                                 prompt, best_task, top_target, confidence
                             ),
        "prompt_type":       best_task,
        "suggested_targets": (ranked_targets[:5]
                              if best_task != "clustering"
                              else numeric_cols[:5]),
        "numeric_cols":      numeric_cols,
        "cat_cols":          cat_cols,
        "all_cols":          df.columns.tolist(),
    }


# ─── Public: suggest_prediction_goals ────────────────────────────────────────

def suggest_prediction_goals(
    df: pd.DataFrame,
    eda_score: Optional[float] = None,
) -> List[Dict[str, Any]]:
    """
    Auto-generate up to 8 prediction goal suggestion cards from dataset structure.
    Each card: goal, target_col, task_type, top_models, explanation, icon.
    """
    if df is None or df.empty:
        return []

    suggestions: List[Dict[str, Any]] = []

    numeric_cols    = df.select_dtypes(include="number").columns.tolist()
    numeric_targets = [
        c for c in numeric_cols
        if not re.search(r"\bid\b|_id$|^id_|^index$", c.lower())
    ]
    cat_targets = [
        c for c in df.select_dtypes(exclude="number").columns
        if not re.search(r"\bid\b|_id$|^id_|^index$", c.lower())
    ]

    def _top_model_keys(task: str, target=None) -> List[str]:
        # recommend_models returns {"recommendations": [...], "auto_top_key": ...}
        # The list items have key "model_key"
        try:
            recs   = recommend_models(df, target, task, eda_score)
            ranked = recs.get("recommendations", [])      # ← CORRECT KEY
            return [r["model_key"] for r in ranked[:3]]
        except Exception:
            return []

    # Regression suggestions (up to 3)
    for col in numeric_targets[:3]:
        unique_ratio = df[col].nunique() / max(len(df), 1)
        if unique_ratio < 0.02:
            continue
        col_label = col.replace("_", " ").title()
        suggestions.append({
            "goal":        f"Predict {col_label}",
            "target_col":  col,
            "task_type":   "regression",
            "top_models":  _top_model_keys("regression", col),
            "explanation": (
                f"Forecast the numeric value of '{col}' based on the "
                f"other columns in your dataset."
            ),
            "icon": _TASK_ICONS["regression"],
        })

    # Classification — binary/low-cardinality numeric columns
    for col in numeric_targets:
        n_unique = df[col].nunique()
        if 2 <= n_unique <= 10:
            col_label = col.replace("_", " ").title()
            suggestions.append({
                "goal":        f"Classify {col_label}",
                "target_col":  col,
                "task_type":   "classification",
                "top_models":  _top_model_keys("classification", col),
                "explanation": (
                    f"'{col}' has only {n_unique} distinct values — "
                    f"a good candidate for classification."
                ),
                "icon": _TASK_ICONS["classification"],
            })
            if len(suggestions) >= 5:
                break

    # Classification — categorical columns
    for col in cat_targets[:2]:
        n_unique = df[col].nunique()
        if 2 <= n_unique <= 20:
            col_label = col.replace("_", " ").title()
            suggestions.append({
                "goal":        f"Predict {col_label} Category",
                "target_col":  col,
                "task_type":   "classification",
                "top_models":  _top_model_keys("classification", col),
                "explanation": (
                    f"Predict which '{col}' category a row belongs to "
                    f"({n_unique} classes)."
                ),
                "icon": _TASK_ICONS["classification"],
            })

    # Clustering (always offer if ≥ 2 numeric cols)
    if len(numeric_targets) >= 2:
        suggestions.append({
            "goal":        "Find Hidden Groups",
            "target_col":  None,
            "task_type":   "clustering",
            "top_models":  _top_model_keys("clustering"),
            "explanation": (
                "No target needed — discover natural groupings and patterns "
                "across all numeric columns."
            ),
            "icon": _TASK_ICONS["clustering"],
        })

    return suggestions[:8]


# ─── Public: recommend_from_prompt ───────────────────────────────────────────

def recommend_from_prompt(
    df: pd.DataFrame,
    prompt: str,
    eda_score: Optional[float] = None,
) -> dict:
    """
    Full one-call pipeline:
      1. parse_user_prompt  →  task + target
      2. recommend_models   →  recommendations list

    recommend_models returns:
      {"recommendations": [...], "auto_top_key": "...", "task_type": "...", ...}

    This function reads those keys correctly and returns a unified response dict.
    """
    parse_result = parse_user_prompt(prompt, df)

    task   = parse_result.get("inferred_task")
    target = parse_result.get("inferred_target")

    recs = recommend_models(df, target, task, eda_score)

    # ── CORRECT KEY: "recommendations" not "ranked" ───────────────────────────
    recommendations_list = recs.get("recommendations", [])
    top_key  = recs.get("auto_top_key") or (
        recommendations_list[0]["model_key"] if recommendations_list else None
    )
    top_name = (
        recommendations_list[0].get("name", top_key)
        if recommendations_list else None
    )

    if task and target:
        prompt_interpreted = f"Interpreted as: {task} → target column '{target}'"
    elif task:
        prompt_interpreted = f"Interpreted as: {task}"
    else:
        prompt_interpreted = "Could not interpret prompt."

    dataset_profile = {
        "n_rows":       len(df),
        "n_cols":       len(df.columns),
        "numeric_cols": parse_result.get("numeric_cols", []),
        "cat_cols":     parse_result.get("cat_cols", []),
    }

    return {
        "parse_result":          parse_result,
        "recommendations":       recommendations_list,   # the actual list
        "auto_top_key":          top_key,
        "auto_top_name":         top_name,
        "explanation":           parse_result.get("explanation", ""),
        "dataset_profile":       dataset_profile,
        "task_type":             task,
        "target_col":            target,
        "prompt_interpreted":    prompt_interpreted,
        "confidence":            parse_result.get("confidence", 0.0),
        "suggested_targets":     parse_result.get("suggested_targets", []),
        # Pass through the full recs dict so frontend can read task_type etc.
        "full_recommend_result": recs,
    }
