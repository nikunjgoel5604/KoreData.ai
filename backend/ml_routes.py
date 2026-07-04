# ml_routes.py — Kore_data-ex  ML Studio API  v3.1
# ═══════════════════════════════════════════════════════════════════════════════
# FIXES vs v3.0
# ─────────────────────────────────────────────────────────
# FIX 1  to_df() pandas 2.x compat — errors="ignore" removed in pandas 2.2+
#         → replaced with try/except + coerce pattern
# FIX 2  Added /ml/suggest  (Write a Prompt feature)
# FIX 3  Added /ml/recommend-from-prompt  (Show Me Ideas feature)
#
# ENDPOINTS
# ─────────────────────────────────────────────────────────
#   GET  /ml/models                  → full model registry
#   POST /ml/recommend               → ranked recommendations (EDA-aware)
#   POST /ml/recommend-from-prompt   → dataset ideas (Show Me Ideas)
#   POST /ml/suggest                 → prompt-based suggestions (Write a Prompt)
#   POST /ml/train                   → train + metrics + save to disk + DB
#   POST /ml/auto                    → auto train top-3, return best + compare
#   POST /ml/predict                 → run inference on new rows
#   POST /ml/report                  → generate structured JSON report
#   GET  /ml/saved                   → list saved models for user
#   GET  /ml/history                 → training history from DB
#   GET  /ml/download/{key}          → download .joblib file
#   DELETE /ml/delete/{key}          → delete saved model
# ═══════════════════════════════════════════════════════════════════════════════

import json
import logging
import os
import re
from datetime import datetime
from typing   import Any, Dict, List, Optional

import pandas as pd
from fastapi          import APIRouter, Header, HTTPException
from fastapi.responses import FileResponse
from pydantic         import BaseModel, validator

from database  import db_execute, db_fetchall, db_fetchone
from ml_engine import (
    MODEL_REGISTRY,
    recommend_models,
    train_model,
    auto_train_best,
    generate_report,
    predict_new,
    save_model,
    load_model,
    list_saved_models,
    delete_saved_model,
    analyse_dataset,
    _model_dir,
)

logger    = logging.getLogger(__name__)
ml_router = APIRouter(prefix="/ml", tags=["ML Studio"])


# ─── Auth helper ─────────────────────────────────────────────────────────────

def _require_auth(authorization: Optional[str]) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing Authorization header")
    token = authorization[7:]
    user  = db_fetchone(
        "SELECT u.* FROM sessions s JOIN kore_users u ON u.login_id = s.login_id "
        "WHERE s.token = %s AND s.expires_at > NOW()", (token,)
    )
    if not user:
        raise HTTPException(status_code=401, detail="Token invalid or expired")
    return user


# ─── Pydantic schemas ─────────────────────────────────────────────────────────

class MLDataset(BaseModel):
    """Common dataset payload sent from ml.js _payload()."""
    data:       List[Dict[str, Any]]
    columns:    List[str]
    target_col: Optional[str]  = None
    task_hint:  Optional[str]  = None
    eda_score:  Optional[float] = None

    @validator("task_hint")
    def valid_task(cls, v):
        if v not in {None, "classification", "regression", "clustering"}:
            raise ValueError("task_hint must be classification|regression|clustering")
        return v

    def to_df(self) -> pd.DataFrame:
        if not self.data:
            raise HTTPException(status_code=400, detail="Dataset 'data' is empty. Upload a file first.")
        df = pd.DataFrame(self.data, columns=self.columns if self.columns else None)
        if df.empty:
            raise HTTPException(status_code=400, detail="Dataset is empty after parsing.")

        # Remove internal prefix keys added by eda.js
        for col in [c for c in df.columns if str(c).startswith("_")]:
            df = df.drop(columns=[col])

        # FIX 1: pandas 2.x compat — errors="ignore" was removed in pandas 2.2
        # Use try/except coerce pattern instead
        for col in df.columns:
            try:
                converted = pd.to_numeric(df[col], errors="coerce")
                # Only cast if >70% of non-null values are numeric
                non_null = df[col].notna().sum()
                if non_null > 0 and converted.notna().sum() / non_null > 0.7:
                    df[col] = converted
            except Exception:
                pass

        return df


class TrainRequest(MLDataset):
    model_key:   str
    hyperparams: Optional[Dict[str, Any]] = None
    test_size:   float = 0.2
    stratify:    bool  = True

    @validator("test_size")
    def clamp(cls, v):
        return max(0.05, min(0.40, float(v)))


class PredictRequest(BaseModel):
    model_b64:     str  = ""
    scaler_b64:    str  = ""
    le_b64:        str  = ""
    feature_names: List[str]
    rows:          List[Dict[str, Any]]


class ReportRequest(BaseModel):
    train_result:    dict
    dataset_profile: Optional[dict] = None


class PromptRequest(MLDataset):
    """Payload for Write a Prompt feature."""
    prompt: str = ""


class IdeasRequest(MLDataset):
    """Payload for Show Me Ideas feature."""
    pass


# ─── DB persistence helper ────────────────────────────────────────────────────

def _persist_training_run(login_id: str, result: dict, file_path: Optional[str] = None) -> int:
    m = result.get("metrics", {})
    try:
        task = result.get("task_type", "")
        primary = (
            m.get("r2_score")   if task == "regression"     else
            m.get("accuracy")   if task == "classification" else
            m.get("silhouette_score")
        )
        row_id = db_execute(
            """INSERT INTO ml_training_history
               (login_id, model_key, model_name, category, task_type, target_col,
                n_features, n_rows_train, n_rows_test, test_size, eda_score,
                primary_metric, f1_score, precision_score, recall_score, roc_auc,
                rmse, mae, r2_score, cv_score, cv_std, hyperparams,
                model_file_path, deploy_ready, grade)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)""",
            (
                login_id,
                result.get("model_key",""),
                result.get("model_name",""),
                result.get("category","Machine Learning"),
                task,
                result.get("target_col"),
                result.get("n_features"),
                result.get("training_samples"),
                result.get("test_samples"),
                result.get("test_size", 0.2),
                result.get("eda_score"),
                primary,
                m.get("f1_score"),
                m.get("precision"),
                m.get("recall"),
                m.get("roc_auc"),
                m.get("rmse"),
                m.get("mae"),
                m.get("r2_score"),
                result.get("cv_score"),
                result.get("cv_std"),
                json.dumps(result.get("hyperparams", {})),
                file_path,
                int(result.get("deploy_ready", False)),
                result.get("grade"),
            )
        )
        return row_id or 0
    except Exception as exc:
        logger.warning("[ml_routes] DB persist failed: %s", exc)
        return 0


# ─── Prompt → model matching helper ──────────────────────────────────────────

_KEYWORD_MAP = {
    # regression keywords
    "price":       ("regression",),
    "cost":        ("regression",),
    "salary":      ("regression",),
    "revenue":     ("regression",),
    "sales":       ("regression",),
    "predict.*num": ("regression",),
    "forecast":    ("regression",),
    "estimate":    ("regression",),
    "value":       ("regression",),
    "amount":      ("regression",),
    "score":       ("regression",),
    "rating":      ("regression",),
    "temperature": ("regression",),
    "demand":      ("regression",),
    # classification keywords
    "classify":    ("classification",),
    "category":    ("classification",),
    "type":        ("classification",),
    "class":       ("classification",),
    "label":       ("classification",),
    "spam":        ("classification",),
    "fraud":       ("classification",),
    "churn":       ("classification",),
    "detect":      ("classification",),
    "diagnos":     ("classification",),
    "will.*yes":   ("classification",),
    "will.*no":    ("classification",),
    "yes.*no":     ("classification",),
    "binary":      ("classification",),
    "approve":     ("classification",),
    "sentiment":   ("classification",),
    # clustering keywords
    "group":       ("clustering",),
    "cluster":     ("clustering",),
    "segment":     ("clustering",),
    "pattern":     ("clustering",),
    "similar":     ("clustering",),
    "unsupervised": ("clustering",),
}

def _detect_task_from_prompt(prompt: str) -> Optional[str]:
    """Detect task type from natural language prompt."""
    p = prompt.lower()
    scores = {"regression": 0, "classification": 0, "clustering": 0}
    for pattern, tasks in _KEYWORD_MAP.items():
        if re.search(pattern, p):
            for t in tasks:
                scores[t] += 1
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else None


def _extract_target_from_prompt(prompt: str, columns: List[str]) -> Optional[str]:
    """Try to find a column name mentioned in the prompt."""
    p = prompt.lower()
    for col in columns:
        if col.lower() in p:
            return col
    return None


# ═══════════════════════════════════════════════════════════════════════════════
#  GET /ml/models
# ═══════════════════════════════════════════════════════════════════════════════

@ml_router.get("/models")
def get_model_registry(authorization: Optional[str] = Header(None)):
    _require_auth(authorization)
    models = []
    for key, meta in MODEL_REGISTRY.items():
        models.append({k: v for k, v in meta.items() if k not in ("min_rows", "eda_score_min")} | {"model_key": key})
    return {"models": models, "total": len(models)}


# ═══════════════════════════════════════════════════════════════════════════════
#  POST /ml/recommend
# ═══════════════════════════════════════════════════════════════════════════════

@ml_router.post("/recommend")
def ml_recommend(body: MLDataset, authorization: Optional[str] = Header(None)):
    _require_auth(authorization)
    try:
        df  = body.to_df()
        rec = recommend_models(df, body.target_col, body.task_hint, body.eda_score)
        return {"ok": True, **rec, "timestamp": datetime.now().isoformat()}
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("[ml/recommend] %s", exc)
        raise HTTPException(status_code=500, detail=f"Recommendation failed: {exc}")


# ═══════════════════════════════════════════════════════════════════════════════
#  POST /ml/suggest  (Write a Prompt feature)
# ═══════════════════════════════════════════════════════════════════════════════

@ml_router.post("/suggest")
def ml_suggest(body: PromptRequest, authorization: Optional[str] = Header(None)):
    """
    Write a Prompt: user describes what they want in plain English.
    Returns model recommendations tailored to their description.

    Example prompts:
      "I want to predict house prices"
      "Detect fraud in transactions"
      "Group customers by behavior"
    """
    _require_auth(authorization)
    try:
        df = body.to_df()

        prompt    = (body.prompt or "").strip()
        if not prompt:
            raise HTTPException(status_code=400, detail="Please write a prompt describing what you want to predict.")

        # Detect task type from prompt
        detected_task   = _detect_task_from_prompt(prompt)
        detected_target = _extract_target_from_prompt(prompt, body.columns)

        # Fall back to body.task_hint if detection fails
        task_hint  = detected_task  or body.task_hint  or "classification"
        target_col = detected_target or body.target_col

        # Generate recommendations
        rec = recommend_models(df, target_col, task_hint, body.eda_score)

        # Build prompt analysis explanation
        prompt_analysis = {
            "detected_task":     detected_task,
            "detected_target":   detected_target,
            "final_task":        task_hint,
            "final_target":      target_col,
            "prompt_received":   prompt,
        }

        # Prepend a prompt-specific explanation
        task_desc = {
            "classification": "predict a category or class",
            "regression":     "predict a numeric value",
            "clustering":     "discover natural groups in your data",
        }
        prompt_note = (
            f'Based on your prompt "{prompt[:80]}", I detected you want to '
            f'{task_desc.get(task_hint, task_hint)}. '
            f'{"Target column detected: \"" + detected_target + "\". " if detected_target else ""}'
            f'Here are the best models for this goal:'
        )

        return {
            "ok":             True,
            "prompt_analysis": prompt_analysis,
            "prompt_note":    prompt_note,
            **rec,
            "timestamp":      datetime.now().isoformat(),
        }

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("[ml/suggest] %s", exc)
        raise HTTPException(status_code=500, detail=f"Prompt analysis failed: {exc}")


# ═══════════════════════════════════════════════════════════════════════════════
#  POST /ml/recommend-from-prompt  (Show Me Ideas feature)
# ═══════════════════════════════════════════════════════════════════════════════

@ml_router.post("/recommend-from-prompt")
def ml_recommend_from_prompt(body: IdeasRequest, authorization: Optional[str] = Header(None)):
    """
    Show Me Ideas: analyzes the uploaded dataset and suggests what could be
    predicted from it. Returns a list of prediction ideas with confidence scores.

    No target column needed — this scans all columns automatically.
    """
    _require_auth(authorization)
    try:
        df      = body.to_df()
        profile = analyse_dataset(df, None)

        ideas   = []
        columns = body.columns or list(df.columns)

        for col in columns:
            if str(col).startswith("_") or str(col).endswith("_was_missing"):
                continue

            series   = df[col].dropna()
            n_unique = series.nunique()
            n_rows   = len(df)

            if n_unique < 2:
                continue

            # --- Classification ideas ---
            if n_unique <= 20:
                confidence = 90 if n_unique == 2 else (80 if n_unique <= 5 else 65)
                task_type  = "classification"
                task_label = "Binary Classification" if n_unique == 2 else f"{n_unique}-Class Classification"
                idea_text  = (
                    f"Predict '{col}' — {n_unique} unique values "
                    f"({'binary' if n_unique == 2 else 'multi-class'}). "
                    f"Use the other {len(columns)-1} columns as features."
                )
                rec = recommend_models(
                    df.drop(columns=[col], errors="ignore"),
                    None, task_type, body.eda_score
                )
                top_model = rec["recommendations"][0]["name"] if rec["recommendations"] else "Random Forest"
                ideas.append({
                    "target_col":   col,
                    "task_type":    task_type,
                    "task_label":   task_label,
                    "confidence":   confidence,
                    "idea":         idea_text,
                    "top_model":    top_model,
                    "n_unique":     n_unique,
                    "reason":       f"{n_unique} distinct categories — ideal for {task_label}.",
                    "icon":         "🎯",
                })

            # --- Regression ideas ---
            if pd.api.types.is_numeric_dtype(series) and n_unique > 20:
                col_lower = col.lower()
                relevance = 0
                for kw in ["price","cost","salary","amount","revenue","score","rate","count","total","value","age","duration","income"]:
                    if kw in col_lower:
                        relevance += 20
                if relevance == 0:
                    relevance = 50  # Generic numeric column

                confidence = min(90, 50 + relevance)
                idea_text  = (
                    f"Predict '{col}' — continuous numeric column "
                    f"(range: {series.min():.1f} to {series.max():.1f}). "
                    f"Use the other {len(columns)-1} columns as features."
                )
                rec = recommend_models(
                    df.drop(columns=[col], errors="ignore"),
                    None, "regression", body.eda_score
                )
                top_model = rec["recommendations"][0]["name"] if rec["recommendations"] else "Random Forest"
                ideas.append({
                    "target_col":   col,
                    "task_type":    "regression",
                    "task_label":   "Regression",
                    "confidence":   confidence,
                    "idea":         idea_text,
                    "top_model":    top_model,
                    "n_unique":     n_unique,
                    "reason":       f"Continuous numeric — predict exact {col} value.",
                    "icon":         "📈",
                })

        # Clustering idea (always available)
        ideas.append({
            "target_col":   None,
            "task_type":    "clustering",
            "task_label":   "Clustering",
            "confidence":   70,
            "idea":         (
                f"Discover natural groups in your data — {n_rows} rows, {len(columns)} features. "
                "No target column needed. Find hidden segments automatically."
            ),
            "top_model":    "K-Means Clustering",
            "n_unique":     None,
            "reason":       "Unsupervised learning — uncover hidden structure.",
            "icon":         "⭕",
        })

        # Sort by confidence descending
        ideas.sort(key=lambda x: x["confidence"], reverse=True)

        return {
            "ok":             True,
            "ideas":          ideas[:10],  # top 10
            "total":          len(ideas),
            "dataset_profile": profile,
            "timestamp":      datetime.now().isoformat(),
        }

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("[ml/recommend-from-prompt] %s", exc)
        raise HTTPException(status_code=500, detail=f"Ideas generation failed: {exc}")


# ═══════════════════════════════════════════════════════════════════════════════
#  POST /ml/train
# ═══════════════════════════════════════════════════════════════════════════════

@ml_router.post("/train")
def ml_train(body: TrainRequest, authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)
    if body.model_key not in MODEL_REGISTRY:
        raise HTTPException(status_code=400, detail=f"Unknown model_key: '{body.model_key}'")
    try:
        df     = body.to_df()
        result = train_model(
            df, body.target_col, body.model_key,
            body.hyperparams, body.test_size, body.stratify, body.eda_score,
        )
        if result.get("error"):
            raise HTTPException(status_code=422, detail=result["error"])

        rpt = generate_report(result, {"n_rows": len(df), "n_cols": len(df.columns)})
        result["deploy_ready"] = rpt["deploy_ready"]
        result["grade"]        = rpt["grade"]

        file_path = None
        try:
            meta      = MODEL_REGISTRY.get(body.model_key, {})
            file_path = save_model(
                model          = result.pop("_model",  None),
                scaler         = result.pop("_scaler", None),
                le             = result.pop("_le",     None),
                model_key      = body.model_key,
                login_id       = user["login_id"],
                meta           = meta,
                feature_names  = result.get("feature_names", []),
                primary_metric = (
                    result.get("metrics", {}).get("accuracy") or
                    result.get("metrics", {}).get("r2_score")
                ),
            )
            result["model_saved"]  = True
            result["download_url"] = f"/ml/download/{body.model_key}"
        except Exception as save_err:
            logger.warning("[ml/train] Save failed: %s", save_err)
            result.pop("_model",  None)
            result.pop("_scaler", None)
            result.pop("_le",     None)
            result["model_saved"] = False

        history_id = _persist_training_run(user["login_id"], result, file_path)
        result["history_id"] = history_id

        return {"ok": True, **result}

    except HTTPException:
        raise
    except Exception as exc:
        logger.error("[ml/train] %s", exc)
        raise HTTPException(status_code=500, detail=f"Training failed: {exc}")


# ═══════════════════════════════════════════════════════════════════════════════
#  POST /ml/auto
# ═══════════════════════════════════════════════════════════════════════════════

@ml_router.post("/auto")
def ml_auto(body: MLDataset, authorization: Optional[str] = Header(None)):
    user = _require_auth(authorization)
    try:
        df     = body.to_df()
        result = auto_train_best(df, body.target_col, body.task_hint, body.eda_score)
        if result.get("error"):
            raise HTTPException(status_code=422, detail=result["error"])

        best = result.get("best_result", {})
        if best and not best.get("error"):
            _persist_training_run(user["login_id"], best)

        return {"ok": True, **result}
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("[ml/auto] %s", exc)
        raise HTTPException(status_code=500, detail=f"Auto-train failed: {exc}")


# ═══════════════════════════════════════════════════════════════════════════════
#  POST /ml/predict
# ═══════════════════════════════════════════════════════════════════════════════

@ml_router.post("/predict")
def ml_predict(body: PredictRequest, authorization: Optional[str] = Header(None)):
    _require_auth(authorization)
    if not body.rows:
        raise HTTPException(status_code=400, detail="No rows provided for prediction.")
    if not body.feature_names:
        raise HTTPException(status_code=400, detail="feature_names required.")

    result = predict_new(
        body.model_b64, body.scaler_b64, body.le_b64,
        body.feature_names, body.rows,
    )
    if result.get("error"):
        raise HTTPException(status_code=500, detail=result["error"])
    return {"ok": True, **result}


# ═══════════════════════════════════════════════════════════════════════════════
#  POST /ml/report
# ═══════════════════════════════════════════════════════════════════════════════

@ml_router.post("/report")
def ml_report(body: ReportRequest, authorization: Optional[str] = Header(None)):
    _require_auth(authorization)
    try:
        rpt = generate_report(body.train_result, body.dataset_profile or {})
        return {"ok": True, "report": rpt, "generated_at": datetime.now().isoformat()}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {exc}")


# ═══════════════════════════════════════════════════════════════════════════════
#  GET /ml/saved
# ═══════════════════════════════════════════════════════════════════════════════

@ml_router.get("/saved")
def ml_saved(authorization: Optional[str] = Header(None)):
    user  = _require_auth(authorization)
    saved = list_saved_models(user["login_id"])
    return {"ok": True, "saved_models": saved, "total": len(saved)}


# ═══════════════════════════════════════════════════════════════════════════════
#  GET /ml/history
# ═══════════════════════════════════════════════════════════════════════════════

@ml_router.get("/history")
def ml_history(
    limit:         int            = 20,
    authorization: Optional[str]  = Header(None),
):
    user = _require_auth(authorization)
    rows = db_fetchall(
        """SELECT id, model_key, model_name, category, task_type, target_col,
                  primary_metric, f1_score, rmse, r2_score, cv_score,
                  eda_score, deploy_ready, grade, trained_at
           FROM ml_training_history
           WHERE login_id = %s
           ORDER BY trained_at DESC
           LIMIT %s""",
        (user["login_id"], min(limit, 100)),
    )
    for r in rows:
        r["trained_at"]   = str(r["trained_at"])
        r["deploy_ready"] = bool(r["deploy_ready"])
    return {"ok": True, "history": rows, "total": len(rows)}


# ═══════════════════════════════════════════════════════════════════════════════
#  GET /ml/download/{model_key}
# ═══════════════════════════════════════════════════════════════════════════════

@ml_router.get("/download/{model_key}")
def ml_download(model_key: str, authorization: Optional[str] = Header(None)):
    user  = _require_auth(authorization)
    d     = _model_dir(user["login_id"])
    files = sorted(d.glob(f"{model_key}_*.joblib"), reverse=True)
    if not files:
        raise HTTPException(
            status_code=404,
            detail=f"No saved model '{model_key}'. Train the model first."
        )
    fpath = files[0]
    return FileResponse(
        path       = str(fpath),
        filename   = f"kore_{model_key}_{user['login_id']}.joblib",
        media_type = "application/octet-stream",
    )


# ═══════════════════════════════════════════════════════════════════════════════
#  DELETE /ml/delete/{model_key}
# ═══════════════════════════════════════════════════════════════════════════════

@ml_router.delete("/delete/{model_key}")
def ml_delete(model_key: str, authorization: Optional[str] = Header(None)):
    user    = _require_auth(authorization)
    deleted = delete_saved_model(model_key, user["login_id"])
    if not deleted:
        raise HTTPException(status_code=404, detail=f"No model '{model_key}' found to delete.")
    return {"ok": True, "message": f"Model '{model_key}' deleted."}
