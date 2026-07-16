# ml_engine.py — Kore_data-ex  v3.0
# =========================================================
# NEW in v3.0
# ─────────────────────────────────────────────────────────
# parse_user_prompt()       — NLP-style prompt → task/target inference
# suggest_prediction_goals()— Auto-generate prediction ideas from dataset
# recommend_from_prompt()   — Full pipeline: prompt → target → model recs
#
# All existing functions unchanged.
# =========================================================

import io
import re
import base64
import logging
import warnings
warnings.filterwarnings("ignore")

import numpy  as np
import pandas as pd
from typing import Optional, Dict, List, Any, Tuple

logger = logging.getLogger(__name__)

try:
    import joblib
    JOBLIB_OK = True
except ImportError:
    JOBLIB_OK = False

try:
    from sklearn.model_selection  import (
        train_test_split, cross_val_score, learning_curve,
        StratifiedKFold, KFold,
    )
    from sklearn.preprocessing    import StandardScaler, LabelEncoder, label_binarize
    from sklearn.impute           import SimpleImputer
    from sklearn.metrics          import (
        accuracy_score, f1_score, precision_score, recall_score,
        mean_squared_error, mean_absolute_error, r2_score,
        roc_auc_score, silhouette_score,
        confusion_matrix, roc_curve, auc,
    )
    from sklearn.linear_model     import (
        LinearRegression, Ridge, Lasso, ElasticNet, LogisticRegression,
    )
    from sklearn.tree             import DecisionTreeClassifier, DecisionTreeRegressor
    from sklearn.ensemble         import (
        RandomForestClassifier, RandomForestRegressor,
        GradientBoostingClassifier, GradientBoostingRegressor,
    )
    from sklearn.svm              import SVC, SVR
    from sklearn.neighbors        import KNeighborsClassifier, KNeighborsRegressor
    from sklearn.naive_bayes      import GaussianNB
    from sklearn.cluster          import KMeans, DBSCAN
    from sklearn.neural_network   import MLPClassifier, MLPRegressor
    SKLEARN_OK = True
except ImportError as _e:
    SKLEARN_OK = False
    logger.error("[ml_engine] sklearn unavailable: %s", _e)


# ═══════════════════════════════════════════════════════════════════════════════
#  MODEL REGISTRY
# ═══════════════════════════════════════════════════════════════════════════════

MODEL_REGISTRY: Dict[str, Dict] = {
    # ── Regression ───────────────────────────────────────────────────────────
    "linear_regression": {
        "name": "Linear Regression", "category": "Machine Learning",
        "task": ["regression"], "complexity": "low", "speed": "fast", "icon": "📈",
        "description": "Fits a straight line through data. Best when feature-target relationships are linear.",
        "best_for": ["small datasets", "interpretability", "numeric targets"],
        "limitations": ["non-linear data", "outlier sensitivity"],
        "hyperparams": {},
        "min_rows": 10, "eda_score_min": 0,
    },
    "ridge": {
        "name": "Ridge Regression", "category": "Machine Learning",
        "task": ["regression"], "complexity": "low", "speed": "fast", "icon": "📉",
        "description": "Linear regression with L2 regularisation. Prevents overfitting with many features.",
        "best_for": ["multicollinearity", "many features"],
        "limitations": ["non-linear patterns"],
        "hyperparams": {"alpha": 1.0},
        "min_rows": 10, "eda_score_min": 0,
    },
    "lasso": {
        "name": "Lasso Regression", "category": "Machine Learning",
        "task": ["regression"], "complexity": "low", "speed": "fast", "icon": "🔗",
        "description": "L1 regularisation drives irrelevant weights to zero — automatic feature selection.",
        "best_for": ["sparse features", "feature selection"],
        "limitations": ["correlated features"],
        "hyperparams": {"alpha": 1.0},
        "min_rows": 10, "eda_score_min": 0,
    },
    "elasticnet": {
        "name": "ElasticNet", "category": "Machine Learning",
        "task": ["regression"], "complexity": "low", "speed": "fast", "icon": "🌐",
        "description": "Combines L1 + L2 penalties. Best of Ridge and Lasso worlds.",
        "best_for": ["mixed feature importance", "many features"],
        "limitations": ["two hyperparameters to tune"],
        "hyperparams": {"alpha": 1.0, "l1_ratio": 0.5},
        "min_rows": 10, "eda_score_min": 0,
    },
    "decision_tree_reg": {
        "name": "Decision Tree Regressor", "category": "Machine Learning",
        "task": ["regression"], "complexity": "medium", "speed": "fast", "icon": "🌳",
        "description": "Splits data into regions via yes/no questions. Highly interpretable tree structure.",
        "best_for": ["non-linear patterns", "interpretability", "mixed data"],
        "limitations": ["overfitting", "instability"],
        "hyperparams": {"max_depth": 5, "min_samples_split": 2},
        "min_rows": 20, "eda_score_min": 0,
    },
    "random_forest_reg": {
        "name": "Random Forest Regressor", "category": "Machine Learning",
        "task": ["regression"], "complexity": "medium", "speed": "medium", "icon": "🌲",
        "description": "Ensemble of decision trees averaging predictions. Robust and accurate.",
        "best_for": ["tabular data", "non-linear patterns", "feature importance"],
        "limitations": ["memory usage", "slow for very large data"],
        "hyperparams": {"n_estimators": 100, "max_depth": 10, "min_samples_split": 2},
        "min_rows": 50, "eda_score_min": 50,
    },
    "gradient_boosting_reg": {
        "name": "Gradient Boosting Regressor", "category": "Machine Learning",
        "task": ["regression"], "complexity": "high", "speed": "medium", "icon": "🚀",
        "description": "Sequentially builds trees each correcting previous errors. Often best on tabular data.",
        "best_for": ["competitions", "tabular data", "high accuracy"],
        "limitations": ["tuning required", "slower than RF"],
        "hyperparams": {"n_estimators": 100, "learning_rate": 0.1, "max_depth": 3},
        "min_rows": 50, "eda_score_min": 60,
    },
    "svr": {
        "name": "Support Vector Regressor", "category": "Machine Learning",
        "task": ["regression"], "complexity": "high", "speed": "slow", "icon": "⚙️",
        "description": "Finds optimal hyperplane within margin tolerance. Strong on small/medium datasets.",
        "best_for": ["small datasets", "high-dimensional data"],
        "limitations": ["slow on large data", "feature scaling required"],
        "hyperparams": {"C": 1.0, "kernel": "rbf", "epsilon": 0.1},
        "min_rows": 20, "eda_score_min": 50,
    },
    "knn_reg": {
        "name": "KNN Regressor", "category": "Machine Learning",
        "task": ["regression"], "complexity": "low", "speed": "medium", "icon": "🔵",
        "description": "Predicts based on average of K nearest training samples.",
        "best_for": ["small datasets", "local patterns"],
        "limitations": ["curse of dimensionality", "slow prediction"],
        "hyperparams": {"n_neighbors": 5, "weights": "uniform"},
        "min_rows": 20, "eda_score_min": 40,
    },
    "ann_reg": {
        "name": "ANN Regressor (Deep Learning)", "category": "Deep Learning",
        "task": ["regression"], "complexity": "high", "speed": "medium", "icon": "🧠",
        "description": "Multi-layer perceptron. Learns complex non-linear patterns via backpropagation.",
        "best_for": ["complex patterns", "large datasets", "non-linear relationships"],
        "limitations": ["needs more data", "black box", "hyperparameter sensitive"],
        "hyperparams": {"hidden_layer_sizes": [100, 50], "max_iter": 500, "activation": "relu", "learning_rate_init": 0.001},
        "min_rows": 200, "eda_score_min": 65,
    },
    # ── Classification ────────────────────────────────────────────────────────
    "logistic_regression": {
        "name": "Logistic Regression", "category": "Machine Learning",
        "task": ["classification"], "complexity": "low", "speed": "fast", "icon": "📊",
        "description": "Linear model for binary/multi-class classification. Fast and interpretable.",
        "best_for": ["binary classification", "interpretability", "baseline"],
        "limitations": ["linear boundaries only"],
        "hyperparams": {"C": 1.0, "max_iter": 300},
        "min_rows": 20, "eda_score_min": 0,
    },
    "decision_tree_clf": {
        "name": "Decision Tree Classifier", "category": "Machine Learning",
        "task": ["classification"], "complexity": "medium", "speed": "fast", "icon": "🌳",
        "description": "Rule-based classification. Easy to visualise and explain to stakeholders.",
        "best_for": ["explainability", "mixed features", "non-linear"],
        "limitations": ["overfitting", "instability"],
        "hyperparams": {"max_depth": 5, "criterion": "gini", "min_samples_split": 2},
        "min_rows": 20, "eda_score_min": 0,
    },
    "random_forest_clf": {
        "name": "Random Forest Classifier", "category": "Machine Learning",
        "task": ["classification"], "complexity": "medium", "speed": "medium", "icon": "🌲",
        "description": "Ensemble of decision trees via bagging. Industry standard for tabular classification.",
        "best_for": ["tabular data", "imbalanced classes", "feature importance"],
        "limitations": ["not ideal for sequential/text data"],
        "hyperparams": {"n_estimators": 100, "max_depth": 10, "criterion": "gini"},
        "min_rows": 50, "eda_score_min": 50,
    },
    "gradient_boosting_clf": {
        "name": "Gradient Boosting Classifier", "category": "Machine Learning",
        "task": ["classification"], "complexity": "high", "speed": "medium", "icon": "🚀",
        "description": "Powerful boosting ensemble. Often the most accurate on structured data.",
        "best_for": ["high accuracy", "tabular data", "imbalanced data"],
        "limitations": ["slow training", "overfitting risk"],
        "hyperparams": {"n_estimators": 100, "learning_rate": 0.1, "max_depth": 3},
        "min_rows": 50, "eda_score_min": 60,
    },
    "svm_clf": {
        "name": "Support Vector Classifier", "category": "Machine Learning",
        "task": ["classification"], "complexity": "high", "speed": "slow", "icon": "⚙️",
        "description": "Maximises the margin between classes. Powerful for high-dimensional data.",
        "best_for": ["text classification", "high-dimensional", "small datasets"],
        "limitations": ["slow on large data", "hard to tune"],
        "hyperparams": {"C": 1.0, "kernel": "rbf"},
        "min_rows": 20, "eda_score_min": 50,
    },
    "knn_clf": {
        "name": "KNN Classifier", "category": "Machine Learning",
        "task": ["classification"], "complexity": "low", "speed": "medium", "icon": "🔵",
        "description": "Classifies based on majority vote of K nearest neighbours.",
        "best_for": ["small datasets", "non-linear boundaries"],
        "limitations": ["slow on large data", "sensitive to scale"],
        "hyperparams": {"n_neighbors": 5, "weights": "uniform"},
        "min_rows": 20, "eda_score_min": 40,
    },
    "naive_bayes": {
        "name": "Naive Bayes", "category": "Machine Learning",
        "task": ["classification"], "complexity": "low", "speed": "fast", "icon": "📝",
        "description": "Probabilistic classifier using Bayes theorem. Extremely fast, good baseline.",
        "best_for": ["text classification", "spam detection", "fast baseline"],
        "limitations": ["independence assumption rarely holds"],
        "hyperparams": {},
        "min_rows": 10, "eda_score_min": 0,
    },
    "ann_clf": {
        "name": "ANN Classifier (Deep Learning)", "category": "Deep Learning",
        "task": ["classification"], "complexity": "high", "speed": "medium", "icon": "🧠",
        "description": "Multi-layer perceptron neural network. Learns complex feature interactions automatically.",
        "best_for": ["complex patterns", "large datasets", "non-linear boundaries"],
        "limitations": ["needs more data", "black box"],
        "hyperparams": {"hidden_layer_sizes": [128, 64, 32], "max_iter": 500, "activation": "relu", "learning_rate_init": 0.001},
        "min_rows": 200, "eda_score_min": 65,
    },
    # ── Clustering ────────────────────────────────────────────────────────────
    "kmeans": {
        "name": "K-Means Clustering", "category": "Machine Learning",
        "task": ["clustering"], "complexity": "low", "speed": "fast", "icon": "⭕",
        "description": "Partitions data into K spherical clusters by minimising intra-cluster variance.",
        "best_for": ["well-separated clusters", "customer segmentation"],
        "limitations": ["K must be known", "spherical clusters only"],
        "hyperparams": {"n_clusters": 3},
        "min_rows": 10, "eda_score_min": 0,
    },
    "dbscan": {
        "name": "DBSCAN Clustering", "category": "Machine Learning",
        "task": ["clustering"], "complexity": "medium", "speed": "medium", "icon": "🔮",
        "description": "Density-based clustering. Finds arbitrary shapes, detects outliers automatically.",
        "best_for": ["irregular shapes", "noise/outlier detection", "unknown K"],
        "limitations": ["sensitive to epsilon and min_samples"],
        "hyperparams": {"eps": 0.5, "min_samples": 5},
        "min_rows": 10, "eda_score_min": 0,
    },
}


# ═══════════════════════════════════════════════════════════════════════════════
#  PROMPT PARSER  (v3.0 NEW)
#  Converts a natural language prediction goal into a structured intent.
# ═══════════════════════════════════════════════════════════════════════════════

# Keyword banks for intent detection
_INCREASE_DECREASE = [
    "increase", "decrease", "rise", "fall", "grow", "decline", "drop",
    "go up", "go down", "higher", "lower", "trend", "change", "fluctuate",
    "improve", "worsen", "surge", "collapse", "spike",
]
_BINARY_WORDS = [
    "whether", "will", "yes or no", "true or false", "happen or not",
    "likely", "unlikely", "possible", "predict if", "determine if",
    "fire or not", "pass or fail", "default or not", "churn", "survive",
    "win or lose", "approve", "reject",
]
_CATEGORY_WORDS = [
    "which category", "what type", "classify", "categorize", "which class",
    "what kind", "group", "segment", "label", "what product", "what species",
]
_NUMERIC_WORDS = [
    "how much", "how many", "what will be", "estimate", "forecast",
    "predict the value", "predict the amount", "predict the count",
    "predict the number", "what price", "what cost", "what score",
    "revenue", "sales", "profit", "temperature", "rainfall", "count",
]
_CLUSTER_WORDS = [
    "group", "cluster", "segment", "find patterns", "discover groups",
    "similar customers", "natural groups", "hidden patterns", "no target",
]


def parse_user_prompt(
    prompt: str,
    df: pd.DataFrame,
) -> dict:
    """
    Parse a natural-language prediction prompt and map it to:
      - inferred_task  : classification | regression | clustering
      - inferred_target: column name (or None if unclear)
      - confidence     : high | medium | low
      - explanation    : why we inferred what we did
      - prompt_type    : increase_decrease | binary | categorical | numeric | cluster | unknown
      - suggested_targets: ranked list of candidate columns

    Example prompt: "Predict whether fire count will increase or decrease"
    """
    if not prompt or not prompt.strip():
        return _empty_parse_result(df)

    p_lower = prompt.lower().strip()
    cols    = df.columns.tolist()
    numeric_cols = df.select_dtypes(include=np.number).columns.tolist()
    cat_cols     = df.select_dtypes(include="object").columns.tolist()

    # ── Step 1: Detect prompt type ───────────────────────────────────────────
    prompt_type  = "unknown"
    inferred_task = None

    if any(kw in p_lower for kw in _INCREASE_DECREASE):
        prompt_type   = "increase_decrease"
        inferred_task = "classification"   # usually binary: up/down
    elif any(kw in p_lower for kw in _BINARY_WORDS):
        prompt_type   = "binary"
        inferred_task = "classification"
    elif any(kw in p_lower for kw in _CATEGORY_WORDS):
        prompt_type   = "categorical"
        inferred_task = "classification"
    elif any(kw in p_lower for kw in _NUMERIC_WORDS):
        prompt_type   = "numeric"
        inferred_task = "regression"
    elif any(kw in p_lower for kw in _CLUSTER_WORDS):
        prompt_type   = "cluster"
        inferred_task = "clustering"

    # ── Step 2: Find which column the prompt is talking about ────────────────
    inferred_target = None
    matched_score   = 0

    for col in cols:
        col_lower = col.lower().replace("_", " ").replace("-", " ")
        col_words = set(col_lower.split())
        # Check multi-word overlap between column name and prompt
        overlap = sum(1 for word in col_words if len(word) > 2 and word in p_lower)
        # Exact substring match scores higher
        if col_lower in p_lower:
            overlap += 5
        if overlap > matched_score:
            matched_score   = overlap
            inferred_target = col

    # ── Step 3: If target found, refine task based on column data ────────────
    if inferred_target and inferred_target in df.columns:
        series   = df[inferred_target].dropna()
        n_unique = series.nunique()
        dtype    = str(series.dtype)

        if inferred_task is None:
            if dtype in ("int64", "float64", "int32", "float32"):
                inferred_task = "classification" if n_unique <= 20 else "regression"
            else:
                inferred_task = "classification"

        # Override: if prompt says increase/decrease but col is numeric
        # → treat as binary classification (up=1, down=0)
        if prompt_type == "increase_decrease" and dtype in ("int64", "float64", "int32", "float32"):
            inferred_task = "classification"   # binarise the target in the UI

    # ── Step 4: Confidence scoring ───────────────────────────────────────────
    confidence = "low"
    if inferred_target and matched_score >= 3:
        confidence = "high"
    elif inferred_target and matched_score >= 1:
        confidence = "medium"
    elif inferred_target is None and inferred_task:
        confidence = "medium"

    # ── Step 5: Suggested targets ranked ─────────────────────────────────────
    suggested_targets = _rank_target_candidates(df, inferred_task, prompt_type)

    # ── Step 6: Human-readable explanation ───────────────────────────────────
    explanation = _build_prompt_explanation(
        prompt, inferred_task, inferred_target, prompt_type, confidence, df
    )

    return {
        "original_prompt":   prompt,
        "prompt_type":       prompt_type,
        "inferred_task":     inferred_task or "classification",
        "inferred_target":   inferred_target,
        "confidence":        confidence,
        "explanation":       explanation,
        "suggested_targets": suggested_targets,
        "numeric_cols":      numeric_cols,
        "cat_cols":          cat_cols,
        "all_cols":          cols,
    }


def _empty_parse_result(df: pd.DataFrame) -> dict:
    """Return a default parse result when no prompt is given."""
    numeric_cols = df.select_dtypes(include=np.number).columns.tolist()
    cat_cols     = df.select_dtypes(include="object").columns.tolist()
    return {
        "original_prompt":   "",
        "prompt_type":       "unknown",
        "inferred_task":     "classification",
        "inferred_target":   None,
        "confidence":        "low",
        "explanation":       "No prompt provided. Please describe what you want to predict.",
        "suggested_targets": _rank_target_candidates(df, None, "unknown"),
        "numeric_cols":      numeric_cols,
        "cat_cols":          cat_cols,
        "all_cols":          df.columns.tolist(),
    }


def _rank_target_candidates(
    df: pd.DataFrame,
    task_hint: Optional[str],
    prompt_type: str,
) -> List[dict]:
    """
    Score every column as a potential prediction target and rank them.
    Returns top-10 with reasoning.
    """
    candidates = []
    n_rows = len(df)

    for col in df.columns:
        score   = 0
        reasons = []
        col_lower = col.lower().replace("_", " ").replace("-", " ")

        series   = df[col].dropna()
        n_unique = series.nunique()
        dtype    = str(series.dtype)

        # Column name heuristics — common target names
        target_keywords = [
            "target", "label", "class", "outcome", "result", "predict",
            "output", "y", "status", "flag", "type", "category", "level",
            "score", "rating", "grade", "count", "amount", "price",
            "sales", "revenue", "churn", "default", "fraud",
        ]
        for kw in target_keywords:
            if kw in col_lower:
                score  += 20
                reasons.append(f"Column name '{col}' looks like a typical target variable")
                break

        # Data type alignment with task hint
        if task_hint == "regression":
            if dtype in ("int64", "float64", "int32", "float32") and n_unique > 10:
                score  += 25
                reasons.append("Numeric column with many values — good regression target")
        elif task_hint == "classification":
            if n_unique <= 20:
                score  += 20
                reasons.append(f"Only {n_unique} unique values — good classification target")
            if dtype == "object":
                score  += 10
                reasons.append("Categorical column — natural classification target")

        # Binary columns always good for classification
        if n_unique == 2:
            score  += 15
            vals = series.astype(str).unique().tolist()
            reasons.append(f"Binary column ({vals[0]} / {vals[1]}) — ideal for binary classification")

        # Penalise ID-like columns
        if n_unique / max(n_rows, 1) > 0.95:
            score  -= 30
            reasons.append("Nearly all unique values — likely an ID column, not a good target")

        # Penalise columns with too many missing values
        missing_pct = df[col].isnull().mean() * 100
        if missing_pct > 30:
            score  -= 15
            reasons.append(f"{missing_pct:.0f}% missing — unreliable as target")

        # Boost for increase/decrease prompt type → numeric time-series columns
        if prompt_type == "increase_decrease":
            trend_kw = ["count", "fire", "amount", "total", "sales", "value", "number", "rate"]
            for kw in trend_kw:
                if kw in col_lower:
                    score += 10
                    reasons.append(f"'{col}' likely tracks a quantity that can increase/decrease")
                    break

        inferred_task = "regression"
        if n_unique <= 20 or dtype == "object":
            inferred_task = "classification"
        if task_hint:
            inferred_task = task_hint

        candidates.append({
            "column":        col,
            "score":         max(0, score),
            "dtype":         dtype,
            "n_unique":      int(n_unique),
            "missing_pct":   round(missing_pct, 1),
            "inferred_task": inferred_task,
            "reasons":       reasons[:2],  # top 2 reasons only
        })

    candidates.sort(key=lambda x: x["score"], reverse=True)
    return candidates[:10]


def _build_prompt_explanation(
    prompt: str,
    task: Optional[str],
    target: Optional[str],
    prompt_type: str,
    confidence: str,
    df: pd.DataFrame,
) -> str:
    parts = []

    type_descriptions = {
        "increase_decrease": "📈 You want to predict whether something will increase or decrease — this is a binary classification task.",
        "binary":            "🎯 You want to predict a yes/no outcome — this is a binary classification task.",
        "categorical":       "🏷 You want to predict a category or class — this is a multi-class classification task.",
        "numeric":           "🔢 You want to predict a numeric value — this is a regression task.",
        "cluster":           "⭕ You want to discover natural groups in the data — this is a clustering task.",
        "unknown":           "🤔 Prediction goal is unclear from the prompt.",
    }
    parts.append(type_descriptions.get(prompt_type, ""))

    if target:
        parts.append(f"Target column identified: '{target}' (confidence: {confidence}).")
    else:
        parts.append("No specific column was identified in the prompt. Please select a target column below.")

    if task == "classification" and prompt_type == "increase_decrease":
        parts.append(
            "For increase/decrease prediction, the system will binarise the target "
            "column: values above the median = 'increase', below = 'decrease'."
        )

    if confidence == "low":
        parts.append("⚠ Low confidence — please review the suggested targets and select one manually.")

    return " ".join(parts)


# ═══════════════════════════════════════════════════════════════════════════════
#  SUGGESTION ENGINE  (v3.0 NEW)
#  Auto-generates prediction goal ideas from the dataset structure.
# ═══════════════════════════════════════════════════════════════════════════════

def suggest_prediction_goals(df: pd.DataFrame, eda_score: Optional[float] = None) -> List[dict]:
    """
    Analyse the dataset and generate a list of concrete prediction goals
    the user could pursue, with recommended models for each.

    Returns a list of suggestion dicts:
      {
        "goal":          "Predict whether sales will increase or decrease",
        "target_col":    "Sales",
        "task_type":     "classification",
        "prompt_type":   "increase_decrease",
        "confidence":    "high",
        "icon":          "📈",
        "top_models":    ["random_forest_clf", "gradient_boosting_clf"],
        "explanation":   "..."
      }
    """
    suggestions = []
    n_rows       = len(df)
    numeric_cols = df.select_dtypes(include=np.number).columns.tolist()
    cat_cols     = df.select_dtypes(include="object").columns.tolist()
    eda_acc      = eda_score or 75.0

    def _top_models_for(task: str, n: int = 3) -> List[str]:
        candidates = {k: v for k, v in MODEL_REGISTRY.items() if task in v["task"]}
        # simple scoring: ensemble > linear > other, and min_rows check
        ordered = sorted(
            candidates.items(),
            key=lambda kv: (
                20 if kv[0] in ("random_forest_clf","random_forest_reg","gradient_boosting_clf","gradient_boosting_reg") else
                10 if kv[0] in ("logistic_regression","linear_regression","ridge") else 5
            ),
            reverse=True,
        )
        return [k for k, v in ordered if n_rows >= v.get("min_rows", 10)][:n]

    # ── Suggestion type 1: Numeric columns → increase/decrease ───────────────
    trend_priority = [
        "count", "fire", "sales", "revenue", "profit", "price", "amount",
        "total", "rate", "temperature", "rainfall", "score", "value",
    ]
    for col in numeric_cols:
        col_lower = col.lower().replace("_", " ").replace("-", " ")
        n_unique  = df[col].nunique()

        if n_unique < 5:
            continue  # too few values for a trend

        priority = sum(1 for kw in trend_priority if kw in col_lower)
        if priority == 0 and len(suggestions) >= 3:
            continue   # only show lower-priority cols if we need more

        suggestions.append({
            "goal":        f"Predict whether {col} will increase or decrease",
            "target_col":  col,
            "task_type":   "classification",
            "prompt_type": "increase_decrease",
            "confidence":  "high" if priority > 0 else "medium",
            "icon":        "📈",
            "top_models":  _top_models_for("classification"),
            "explanation": (
                f"Binarise '{col}' into increase/decrease based on the median split. "
                f"Train a classifier to predict which direction '{col}' will go. "
                f"This is useful for forecasting trends, alerts, and business decisions."
            ),
        })
        if len(suggestions) >= 3:
            break

    # ── Suggestion type 2: Binary / few-class categorical → classify ─────────
    for col in cat_cols:
        series   = df[col].dropna()
        n_unique = series.nunique()

        if n_unique < 2 or n_unique > 15:
            continue

        icon = "🎯" if n_unique == 2 else "🏷"
        vals = series.value_counts().index.tolist()[:3]
        val_preview = " / ".join(str(v) for v in vals)

        suggestions.append({
            "goal":        f"Predict the value of {col} ({val_preview}{'...' if n_unique > 3 else ''})",
            "target_col":  col,
            "task_type":   "classification",
            "prompt_type": "binary" if n_unique == 2 else "categorical",
            "confidence":  "high",
            "icon":        icon,
            "top_models":  _top_models_for("classification"),
            "explanation": (
                f"'{col}' has {n_unique} categories. Train a classifier to predict "
                f"which category a new data point belongs to. "
                f"{'Binary classification (two outcomes).' if n_unique == 2 else f'Multi-class classification ({n_unique} outcomes).'}"
            ),
        })
        if len(suggestions) >= 6:
            break

    # ── Suggestion type 3: High-variance numeric → regression ────────────────
    reg_added = 0
    for col in numeric_cols:
        series = df[col].dropna()
        if series.nunique() < 10:
            continue
        cv = series.std() / abs(series.mean()) if series.mean() != 0 else 0
        if cv < 0.05:
            continue  # too little variance to be interesting

        suggestions.append({
            "goal":        f"Predict the exact value of {col}",
            "target_col":  col,
            "task_type":   "regression",
            "prompt_type": "numeric",
            "confidence":  "high",
            "icon":        "🔢",
            "top_models":  _top_models_for("regression"),
            "explanation": (
                f"Predict the numeric value of '{col}' given the other columns. "
                f"Useful when you need a precise estimate rather than a category. "
                f"Mean={series.mean():.2f}, Std={series.std():.2f}."
            ),
        })
        reg_added += 1
        if reg_added >= 2:
            break

    # ── Suggestion type 4: Clustering (always available) ─────────────────────
    if n_rows >= 10:
        suggestions.append({
            "goal":        "Discover natural groups / segments in the data",
            "target_col":  None,
            "task_type":   "clustering",
            "prompt_type": "cluster",
            "confidence":  "high",
            "icon":        "⭕",
            "top_models":  _top_models_for("clustering"),
            "explanation": (
                "No target column needed. K-Means groups similar rows together. "
                "Useful for customer segmentation, anomaly detection, and pattern discovery."
            ),
        })

    # Deduplicate by target_col + task_type
    seen = set()
    unique = []
    for s in suggestions:
        key = (s["target_col"], s["task_type"])
        if key not in seen:
            seen.add(key)
            unique.append(s)

    return unique[:8]   # max 8 suggestions


# ═══════════════════════════════════════════════════════════════════════════════
#  RECOMMEND FROM PROMPT  (v3.0 NEW)
#  Combines prompt parsing + model recommendation in one call.
# ═══════════════════════════════════════════════════════════════════════════════

def recommend_from_prompt(
    df:        pd.DataFrame,
    prompt:    str,
    eda_score: Optional[float] = None,
) -> dict:
    """
    Full pipeline: user prompt → parse intent → recommend models.

    Returns everything needed to auto-fill the ML Studio form.
    """
    parse_result = parse_user_prompt(prompt, df)

    target_col  = parse_result["inferred_target"]
    task_hint   = parse_result["inferred_task"]

    # Get model recommendations
    rec = recommend_models(df, target_col, task_hint, eda_score)

    # Enhance explanation with prompt context
    prompt_explanation = parse_result["explanation"]
    rec["explanation"] = prompt_explanation + "\n\n" + rec.get("explanation", "")

    return {
        **rec,
        "parse_result":       parse_result,
        "prompt":             prompt,
        "prompt_interpreted": _summarise_prompt_intent(parse_result),
    }


def _summarise_prompt_intent(parse: dict) -> str:
    """One-sentence summary of what the system understood from the prompt."""
    task   = parse.get("inferred_task", "classification")
    target = parse.get("inferred_target")
    ptype  = parse.get("prompt_type", "unknown")
    conf   = parse.get("confidence", "low")

    task_verbs = {
        "classification": "classify",
        "regression":     "predict the value of",
        "clustering":     "find groups in",
    }
    verb = task_verbs.get(task, "analyse")

    if target:
        return f"Understood: {verb} '{target}' (confidence: {conf}, type: {ptype})."
    return f"Understood: {task} task, no specific target column identified (confidence: {conf})."


# ═══════════════════════════════════════════════════════════════════════════════
#  DATASET ANALYSER  (unchanged from v2.0)
# ═══════════════════════════════════════════════════════════════════════════════

def analyse_dataset(df: pd.DataFrame, target_col: Optional[str] = None) -> dict:
    n_rows, n_cols = df.shape
    numeric_cols   = df.select_dtypes(include=np.number).columns.tolist()
    cat_cols       = df.select_dtypes(include="object").columns.tolist()
    task_type      = "clustering"
    n_classes      = 0
    class_names: List[str] = []
    class_balance  = "balanced"
    target_dtype   = None

    if target_col and target_col in df.columns:
        series       = df[target_col].dropna()
        n_unique     = series.nunique()
        target_dtype = str(series.dtype)

        if target_dtype in ("int64", "float64", "int32", "float32"):
            task_type = "classification" if n_unique <= 20 else "regression"
        else:
            task_type = "classification"

        if task_type == "classification":
            n_classes   = n_unique
            class_names = sorted(series.astype(str).unique().tolist()[:20])
            vc = series.value_counts(normalize=True)
            if vc.max() > 0.8:
                class_balance = "imbalanced"

    missing_pct   = df.isnull().mean().mean() * 100
    duplicate_pct = df.duplicated().mean() * 100

    return {
        "n_rows": n_rows, "n_cols": n_cols,
        "n_numeric": len(numeric_cols), "n_categorical": len(cat_cols),
        "task_type": task_type, "n_classes": n_classes,
        "class_names": class_names, "target_dtype": target_dtype,
        "missing_pct": round(missing_pct, 2),
        "duplicate_pct": round(duplicate_pct, 2),
        "is_large": n_rows > 10_000, "is_wide": n_cols > 50,
        "class_balance": class_balance,
        "numeric_cols": numeric_cols, "cat_cols": cat_cols,
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  RECOMMENDATION ENGINE  (unchanged from v2.0)
# ═══════════════════════════════════════════════════════════════════════════════

def recommend_models(
    df:          pd.DataFrame,
    target_col:  Optional[str] = None,
    task_hint:   Optional[str] = None,
    eda_score:   Optional[float] = None,
) -> dict:
    profile   = analyse_dataset(df, target_col)
    task_type = task_hint or profile["task_type"]
    eda_acc   = eda_score if eda_score is not None else 75.0

    candidates = {k: v for k, v in MODEL_REGISTRY.items() if task_type in v["task"]}
    scored = []

    for key, meta in candidates.items():
        score    = 50
        reasons  = []
        warnings = []

        min_eda = meta.get("eda_score_min", 0)
        if eda_acc < min_eda:
            score -= (min_eda - eda_acc) * 0.5
            warnings.append(f"EDA accuracy {eda_acc:.0f}% is below recommended {min_eda}% for this model")

        score += min(eda_acc * 0.1, 10)

        min_rows = meta.get("min_rows", 10)
        if profile["n_rows"] < min_rows:
            score -= 30
            warnings.append(f"Dataset has only {profile['n_rows']} rows; this model needs ≥{min_rows}")

        if profile["is_large"]:
            if meta["speed"] == "fast":   score += 15; reasons.append("Fast algorithm handles large datasets efficiently")
            elif meta["speed"] == "slow": score -= 20; warnings.append("Can be slow on datasets with >10k rows")
        else:
            reasons.append(f"Dataset size ({profile['n_rows']:,} rows) suits this model")

        if key in ("random_forest_clf","random_forest_reg","gradient_boosting_clf","gradient_boosting_reg"):
            score += 18; reasons.append("Ensemble methods excel on tabular structured data")

        if not profile["is_large"] and profile["missing_pct"] < 5:
            if key in ("linear_regression","logistic_regression","ridge","lasso"):
                score += 10; reasons.append("Clean small dataset — linear models give good baseline")

        if task_type == "classification":
            if profile["n_classes"] == 2:
                if key == "logistic_regression": score += 12; reasons.append("Go-to model for binary classification")
                if key == "svm_clf":             score += 8;  reasons.append("SVMs are powerful for binary tasks")
            elif profile["n_classes"] > 10:
                if key in ("random_forest_clf","gradient_boosting_clf","ann_clf"):
                    score += 10; reasons.append("Multi-class problems benefit from ensemble / neural approaches")
            if profile["class_balance"] == "imbalanced":
                if key in ("random_forest_clf","gradient_boosting_clf"):
                    score += 12; reasons.append("Handles class imbalance well via bootstrap sampling")
                if key == "naive_bayes":
                    score -= 8;  warnings.append("Naive Bayes may struggle with severe class imbalance")

        if task_type == "regression":
            if profile["is_wide"]:
                if key in ("lasso","ridge","elasticnet"):
                    score += 15; reasons.append("L1/L2 regularisation handles wide feature spaces well")
            if not profile["is_wide"] and not profile["is_large"]:
                if key == "svr": score += 8; reasons.append("SVR performs well on small/medium datasets")

        if meta["category"] == "Deep Learning":
            if profile["n_rows"] < 200:
                score -= 30; warnings.append("Deep Learning needs more data (< 200 rows is too few)")
            elif profile["n_rows"] < 500:
                score -= 15; warnings.append("Marginal data for deep learning — ML models may be safer")
            elif profile["n_rows"] > 5000:
                score += 15; reasons.append("Sufficient data for deep learning to excel")
            if eda_acc < 65:
                score -= 10; warnings.append("Deep learning benefits more from cleaner data (EDA < 65%)")

        if profile["is_wide"] and key in ("knn_clf","knn_reg"):
            score -= 15; warnings.append("KNN suffers from curse of dimensionality on wide datasets")

        scored.append({
            **meta,
            "model_key": key,
            "score":     max(0, min(100, round(score, 1))),
            "reasons":   reasons,
            "warnings":  warnings,
        })

    scored.sort(key=lambda x: x["score"], reverse=True)
    for i, item in enumerate(scored):
        item["rank"] = i + 1

    explanation = _build_explanation(profile, task_type, scored[:3], eda_acc)

    return {
        "dataset_profile":  profile,
        "task_type":        task_type,
        "recommendations":  scored,
        "auto_top_key":     scored[0]["model_key"] if scored else None,
        "explanation":      explanation,
        "eda_score_used":   eda_acc,
    }


def _build_explanation(profile, task_type, top3, eda_acc):
    parts = [
        f"Your dataset has {profile['n_rows']:,} rows and {profile['n_cols']} columns "
        f"({profile['n_numeric']} numeric, {profile['n_categorical']} categorical).",
        f"EDA Accuracy score: {eda_acc:.1f}% — {'✓ dataset is clean enough for reliable modelling' if eda_acc >= 75 else '⚠ data quality may affect model performance'}.",
    ]
    if task_type == "regression":
        parts.append("This is a regression problem — predicting a continuous numeric value.")
    elif task_type == "classification":
        kind = "binary" if profile["n_classes"] == 2 else "multi-class"
        parts.append(f"This is a {kind} classification problem with {profile['n_classes']} target classes.")
    else:
        parts.append("No target column selected — running unsupervised clustering to discover natural groups.")
    if top3:
        names = [m["name"] for m in top3]
        parts.append(f"Top picks: {', '.join(names)}. Best recommendation: '{top3[0]['name']}' (score {top3[0]['score']}/100).")
    if profile["missing_pct"] > 5:
        parts.append(f"⚠ {profile['missing_pct']}% missing values — automatic imputation applied.")
    if profile["class_balance"] == "imbalanced":
        parts.append("⚠ Imbalanced target detected — consider models robust to class imbalance.")
    return " ".join(parts)


# ═══════════════════════════════════════════════════════════════════════════════
#  PREPROCESSING  (unchanged from v2.0)
# ═══════════════════════════════════════════════════════════════════════════════

def _preprocess(df: pd.DataFrame, target_col: Optional[str], task_type: str):
    df = df.copy()
    y  = None
    le = None

    if target_col and target_col in df.columns:
        y_raw = df[target_col].copy()
        df    = df.drop(columns=[target_col])
        if task_type == "classification":
            le = LabelEncoder()
            y  = le.fit_transform(y_raw.astype(str))
        else:
            num = pd.to_numeric(y_raw, errors="coerce")
            y   = num.fillna(num.median()).values

    for col in df.select_dtypes(include="object").columns:
        if df[col].nunique() / max(len(df), 1) > 0.9:
            df = df.drop(columns=[col])

    for col in df.select_dtypes(include="object").columns:
        enc = LabelEncoder()
        df[col] = enc.fit_transform(df[col].astype(str))

    imputer = SimpleImputer(strategy="median")
    X_arr   = imputer.fit_transform(df.values.astype(float))
    return X_arr, y, df.columns.tolist(), le


def _encode_object(obj) -> str:
    if not JOBLIB_OK:
        return ""
    buf = io.BytesIO()
    joblib.dump(obj, buf)
    return base64.b64encode(buf.getvalue()).decode("utf-8")


def _decode_object(b64: str):
    if not JOBLIB_OK or not b64:
        return None
    buf = io.BytesIO(base64.b64decode(b64))
    return joblib.load(buf)


# ═══════════════════════════════════════════════════════════════════════════════
#  MODEL BUILDER  (unchanged from v2.0)
# ═══════════════════════════════════════════════════════════════════════════════

def _build_model(model_key: str, hp: dict):
    hp  = hp or {}
    hls = tuple(hp["hidden_layer_sizes"]) if isinstance(hp.get("hidden_layer_sizes"), list) else \
          hp.get("hidden_layer_sizes", (100, 50))

    builders = {
        "linear_regression":     lambda: LinearRegression(),
        "ridge":                 lambda: Ridge(alpha=hp.get("alpha", 1.0)),
        "lasso":                 lambda: Lasso(alpha=hp.get("alpha", 1.0), max_iter=5000),
        "elasticnet":            lambda: ElasticNet(alpha=hp.get("alpha",1.0), l1_ratio=hp.get("l1_ratio",0.5), max_iter=5000),
        "decision_tree_reg":     lambda: DecisionTreeRegressor(max_depth=hp.get("max_depth",5), min_samples_split=int(hp.get("min_samples_split",2)), random_state=42),
        "random_forest_reg":     lambda: RandomForestRegressor(n_estimators=int(hp.get("n_estimators",100)), max_depth=hp.get("max_depth",10), min_samples_split=int(hp.get("min_samples_split",2)), random_state=42, n_jobs=-1),
        "gradient_boosting_reg": lambda: GradientBoostingRegressor(n_estimators=int(hp.get("n_estimators",100)), learning_rate=hp.get("learning_rate",0.1), max_depth=int(hp.get("max_depth",3)), random_state=42),
        "svr":                   lambda: SVR(C=hp.get("C",1.0), kernel=hp.get("kernel","rbf"), epsilon=hp.get("epsilon",0.1)),
        "knn_reg":               lambda: KNeighborsRegressor(n_neighbors=int(hp.get("n_neighbors",5)), weights=hp.get("weights","uniform")),
        "ann_reg":               lambda: MLPRegressor(hidden_layer_sizes=hls, max_iter=int(hp.get("max_iter",500)), activation=hp.get("activation","relu"), learning_rate_init=hp.get("learning_rate_init",0.001), random_state=42, early_stopping=True, validation_fraction=0.1),
        "logistic_regression":   lambda: LogisticRegression(C=hp.get("C",1.0), max_iter=int(hp.get("max_iter",300)), random_state=42),
        "decision_tree_clf":     lambda: DecisionTreeClassifier(max_depth=hp.get("max_depth",5), criterion=hp.get("criterion","gini"), min_samples_split=int(hp.get("min_samples_split",2)), random_state=42),
        "random_forest_clf":     lambda: RandomForestClassifier(n_estimators=int(hp.get("n_estimators",100)), max_depth=hp.get("max_depth",10), criterion=hp.get("criterion","gini"), random_state=42, n_jobs=-1),
        "gradient_boosting_clf": lambda: GradientBoostingClassifier(n_estimators=int(hp.get("n_estimators",100)), learning_rate=hp.get("learning_rate",0.1), max_depth=int(hp.get("max_depth",3)), random_state=42),
        "svm_clf":               lambda: SVC(C=hp.get("C",1.0), kernel=hp.get("kernel","rbf"), probability=True, random_state=42),
        "knn_clf":               lambda: KNeighborsClassifier(n_neighbors=int(hp.get("n_neighbors",5)), weights=hp.get("weights","uniform")),
        "naive_bayes":           lambda: GaussianNB(),
        "ann_clf":               lambda: MLPClassifier(hidden_layer_sizes=hls, max_iter=int(hp.get("max_iter",500)), activation=hp.get("activation","relu"), learning_rate_init=hp.get("learning_rate_init",0.001), random_state=42, early_stopping=True, validation_fraction=0.1),
        "kmeans":                lambda: KMeans(n_clusters=int(hp.get("n_clusters",3)), random_state=42, n_init="auto"),
        "dbscan":                lambda: DBSCAN(eps=hp.get("eps",0.5), min_samples=int(hp.get("min_samples",5))),
    }
    if model_key not in builders:
        raise ValueError(f"Unknown model key: {model_key}")
    return builders[model_key]()


# ═══════════════════════════════════════════════════════════════════════════════
#  FEATURE IMPORTANCE  (unchanged)
# ═══════════════════════════════════════════════════════════════════════════════

def _get_feature_importance(model, feature_names, X_train, y_train) -> list:
    try:
        if hasattr(model, "feature_importances_"):
            imp = model.feature_importances_
        elif hasattr(model, "coef_"):
            imp = np.abs(model.coef_).flatten()
            if len(imp) != len(feature_names):
                return []
        else:
            from sklearn.inspection import permutation_importance
            pi  = permutation_importance(model, X_train, y_train, n_repeats=5, random_state=42, n_jobs=-1)
            imp = pi.importances_mean
        total = imp.sum()
        pct   = (imp / total * 100) if total > 0 else imp
        return sorted(
            [{"feature": f, "importance": round(float(v), 6), "pct": round(float(p), 2)}
             for f, v, p in zip(feature_names, imp, pct)],
            key=lambda x: x["importance"], reverse=True,
        )[:20]
    except Exception:
        return []


# ═══════════════════════════════════════════════════════════════════════════════
#  LEARNING CURVE  (unchanged)
# ═══════════════════════════════════════════════════════════════════════════════

def _get_learning_curve(model, X, y, task_type, cv=3) -> dict:
    try:
        scoring = "r2" if task_type == "regression" else "accuracy"
        n_pts   = min(6, max(3, len(X) // 50))
        sizes   = np.linspace(0.15, 1.0, n_pts)
        train_sizes, train_scores, val_scores = learning_curve(
            model, X, y,
            train_sizes=sizes,
            cv=cv,
            scoring=scoring,
            n_jobs=-1,
            error_score="raise",
        )
        return {
            "train_sizes":   train_sizes.tolist(),
            "train_mean":    train_scores.mean(axis=1).round(4).tolist(),
            "train_std":     train_scores.std(axis=1).round(4).tolist(),
            "val_mean":      val_scores.mean(axis=1).round(4).tolist(),
            "val_std":       val_scores.std(axis=1).round(4).tolist(),
            "metric":        scoring,
        }
    except Exception as e:
        logger.debug("[ml_engine] learning_curve failed: %s", e)
        return {}


# ═══════════════════════════════════════════════════════════════════════════════
#  CONFUSION MATRIX  (unchanged)
# ═══════════════════════════════════════════════════════════════════════════════

def _get_confusion_matrix(y_true, y_pred, le) -> dict:
    try:
        cm     = confusion_matrix(y_true, y_pred)
        labels = le.classes_.tolist() if le is not None else [str(i) for i in range(cm.shape[0])]
        return {"matrix": cm.tolist(), "labels": [str(l) for l in labels]}
    except Exception:
        return {}


# ═══════════════════════════════════════════════════════════════════════════════
#  ROC CURVE  (unchanged)
# ═══════════════════════════════════════════════════════════════════════════════

def _get_roc_curve(model, X_test, y_test, le, n_classes) -> dict:
    try:
        if not hasattr(model, "predict_proba"):
            return {}
        proba = model.predict_proba(X_test)
        labels = le.classes_.tolist() if le is not None else list(range(n_classes))

        if n_classes == 2:
            fpr, tpr, _ = roc_curve(y_test, proba[:, 1])
            roc_auc_val = auc(fpr, tpr)
            idx = np.linspace(0, len(fpr)-1, min(50, len(fpr)), dtype=int)
            return {
                "type":   "binary",
                "curves": [{
                    "label": str(labels[1]),
                    "auc":   round(float(roc_auc_val), 4),
                    "fpr":   fpr[idx].round(4).tolist(),
                    "tpr":   tpr[idx].round(4).tolist(),
                }],
            }
        else:
            y_bin  = label_binarize(y_test, classes=list(range(n_classes)))
            curves = []
            for i in range(n_classes):
                try:
                    fpr, tpr, _ = roc_curve(y_bin[:, i], proba[:, i])
                    roc_auc_val = auc(fpr, tpr)
                    idx = np.linspace(0, len(fpr)-1, min(30, len(fpr)), dtype=int)
                    curves.append({
                        "label": str(labels[i]),
                        "auc":   round(float(roc_auc_val), 4),
                        "fpr":   fpr[idx].round(4).tolist(),
                        "tpr":   tpr[idx].round(4).tolist(),
                    })
                except Exception:
                    pass
            return {"type": "multiclass", "curves": curves}
    except Exception as e:
        logger.debug("[ml_engine] roc_curve failed: %s", e)
        return {}


# ═══════════════════════════════════════════════════════════════════════════════
#  PRED VS ACTUAL  (unchanged)
# ═══════════════════════════════════════════════════════════════════════════════

def _get_pred_vs_actual(y_test, y_pred, n=100) -> dict:
    try:
        idx = np.random.choice(len(y_test), min(n, len(y_test)), replace=False)
        return {
            "actual":    np.array(y_test)[idx].round(4).tolist(),
            "predicted": np.array(y_pred)[idx].round(4).tolist(),
            "residuals": (np.array(y_test)[idx] - np.array(y_pred)[idx]).round(4).tolist(),
        }
    except Exception:
        return {}


# ═══════════════════════════════════════════════════════════════════════════════
#  MAIN TRAIN FUNCTION  (unchanged from v2.0)
# ═══════════════════════════════════════════════════════════════════════════════

def train_model(
    df:          pd.DataFrame,
    target_col:  Optional[str],
    model_key:   str,
    hyperparams: Optional[dict] = None,
    test_size:   float          = 0.2,
    stratify:    bool           = True,
    eda_score:   Optional[float] = None,
) -> dict:
    if not SKLEARN_OK:
        return {"error": "scikit-learn is not installed on this server."}

    try:
        meta      = MODEL_REGISTRY.get(model_key, {})
        task_type = (meta.get("task") or ["regression"])[0]
        hp        = hyperparams if hyperparams is not None else dict(meta.get("hyperparams", {}))

        X, y, feature_names, le = _preprocess(df, target_col, task_type)
        scaler = StandardScaler()
        X_sc   = scaler.fit_transform(X)

        result: dict = {
            "model_key":     model_key,
            "model_name":    meta.get("name", model_key),
            "category":      meta.get("category", "Machine Learning"),
            "task_type":     task_type,
            "n_features":    len(feature_names),
            "feature_names": feature_names,
            "error":         None,
            "eda_score":     eda_score,
        }

        if task_type == "clustering":
            model  = _build_model(model_key, hp)
            labels = model.fit_predict(X_sc)
            n_cl   = len(set(labels)) - (1 if -1 in labels else 0)
            metrics: dict = {
                "n_clusters": n_cl,
                "n_noise":    int((labels == -1).sum()),
            }
            if n_cl > 1:
                try:
                    metrics["silhouette_score"] = round(float(
                        silhouette_score(X_sc, labels, sample_size=min(2000, len(X_sc)))
                    ), 4)
                except Exception:
                    metrics["silhouette_score"] = None
            uniq, cnts = np.unique(labels, return_counts=True)
            metrics["cluster_distribution"] = {str(int(k)): int(v) for k, v in zip(uniq, cnts)}

            result.update({
                "metrics":             metrics,
                "feature_importance":  [],
                "sample_predictions":  [{"cluster": int(l)} for l in labels[:50]],
                "training_samples":    len(X_sc),
                "test_samples":        0,
                "cv_score":            None,
                "cv_std":              None,
                "confusion_matrix":    {},
                "roc_curve":           {},
                "learning_curve":      {},
                "pred_vs_actual":      {},
                "model_b64":           _encode_object(model),
                "scaler_b64":          _encode_object(scaler),
                "le_b64":              "",
            })
            return result

        n_classes = len(np.unique(y)) if y is not None else 0

        strat_y = y if (task_type == "classification" and stratify and n_classes >= 2) else None
        try:
            X_train, X_test, y_train, y_test = train_test_split(
                X_sc, y, test_size=test_size, random_state=42, stratify=strat_y
            )
        except ValueError:
            X_train, X_test, y_train, y_test = train_test_split(
                X_sc, y, test_size=test_size, random_state=42
            )

        model = _build_model(model_key, hp)
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        result["training_samples"] = len(X_train)
        result["test_samples"]     = len(X_test)

        cv_scoring = "r2" if task_type == "regression" else "accuracy"
        try:
            cv_n = min(5, max(2, len(X) // 20))
            cvs  = cross_val_score(model, X_sc, y, cv=cv_n, scoring=cv_scoring, n_jobs=-1)
            result["cv_score"] = round(float(cvs.mean()), 4)
            result["cv_std"]   = round(float(cvs.std()), 4)
        except Exception:
            result["cv_score"] = None
            result["cv_std"]   = None

        if task_type == "regression":
            mse = float(mean_squared_error(y_test, y_pred))
            result["metrics"] = {
                "r2_score": round(float(r2_score(y_test, y_pred)), 4),
                "rmse":     round(float(np.sqrt(mse)), 4),
                "mae":      round(float(mean_absolute_error(y_test, y_pred)), 4),
                "mse":      round(mse, 4),
                "mape":     round(float(np.mean(np.abs((y_test - y_pred) / np.where(y_test == 0, 1e-9, y_test)))) * 100, 4),
            }
        else:
            avg = "binary" if n_classes <= 2 else "weighted"
            result["metrics"] = {
                "accuracy":  round(float(accuracy_score(y_test, y_pred)), 4),
                "f1_score":  round(float(f1_score(y_test, y_pred, average=avg, zero_division=0)), 4),
                "precision": round(float(precision_score(y_test, y_pred, average=avg, zero_division=0)), 4),
                "recall":    round(float(recall_score(y_test, y_pred, average=avg, zero_division=0)), 4),
            }
            try:
                if hasattr(model, "predict_proba"):
                    proba = model.predict_proba(X_test)
                    if n_classes == 2:
                        result["metrics"]["roc_auc"] = round(float(roc_auc_score(y_test, proba[:,1])), 4)
                    else:
                        result["metrics"]["roc_auc"] = round(float(roc_auc_score(y_test, proba, multi_class="ovr", average="weighted")), 4)
            except Exception:
                pass

        result["feature_importance"] = _get_feature_importance(model, feature_names, X_train, y_train)
        result["learning_curve"]     = _get_learning_curve(model, X_sc, y, task_type, cv=min(3, max(2, len(X)//30)))

        if task_type == "classification":
            result["confusion_matrix"] = _get_confusion_matrix(y_test, y_pred, le)
            result["roc_curve"]        = _get_roc_curve(model, X_test, y_test, le, n_classes)
            result["pred_vs_actual"]   = {}
        else:
            result["confusion_matrix"] = {}
            result["roc_curve"]        = {}
            result["pred_vs_actual"]   = _get_pred_vs_actual(y_test, y_pred)

        n     = min(25, len(y_test))
        raw_a = y_test[:n]
        raw_p = y_pred[:n]
        if task_type == "classification" and le is not None:
            al = le.inverse_transform(raw_a.astype(int))
            pl = le.inverse_transform(raw_p.astype(int))
            result["sample_predictions"] = [
                {"actual": str(a), "predicted": str(p), "correct": bool(a == p)}
                for a, p in zip(al, pl)
            ]
        else:
            result["sample_predictions"] = [
                {"actual": round(float(a), 4), "predicted": round(float(p), 4),
                 "error": round(abs(float(a)-float(p)), 4)}
                for a, p in zip(raw_a, raw_p)
            ]

        result["model_b64"]  = _encode_object(model)
        result["scaler_b64"] = _encode_object(scaler)
        result["le_b64"]     = _encode_object(le) if le is not None else ""

        return result

    except Exception as exc:
        import traceback as _tb
        logger.error("[ml_engine] train_model error: %s", exc)
        return {"error": str(exc), "traceback": _tb.format_exc(limit=8)}


# ═══════════════════════════════════════════════════════════════════════════════
#  AUTO TRAIN BEST  (unchanged)
# ═══════════════════════════════════════════════════════════════════════════════

def auto_train_best(
    df:         pd.DataFrame,
    target_col: Optional[str],
    task_hint:  Optional[str]   = None,
    eda_score:  Optional[float] = None,
) -> dict:
    rec     = recommend_models(df, target_col, task_hint, eda_score)
    top3    = rec["recommendations"][:3]
    task    = rec["task_type"]
    results = []

    for item in top3:
        r = train_model(df, target_col, item["model_key"], eda_score=eda_score)
        if not r.get("error"):
            results.append(r)

    if not results:
        return {"error": "All auto-train attempts failed.", "recommendations": rec}

    def _key(r):
        m = r.get("metrics", {})
        if task == "regression":     return m.get("r2_score", -999)
        if task == "classification": return m.get("accuracy", 0)
        return m.get("silhouette_score") or 0

    best = max(results, key=_key)
    return {"best_result": best, "all_results": results, "recommendations": rec}


# ═══════════════════════════════════════════════════════════════════════════════
#  PREDICT ON NEW DATA  (unchanged)
# ═══════════════════════════════════════════════════════════════════════════════

def predict_new(
    model_b64:     str,
    scaler_b64:    str,
    le_b64:        str,
    feature_names: list,
    rows:          list,
) -> dict:
    try:
        model  = _decode_object(model_b64)  if model_b64  else None
        scaler = _decode_object(scaler_b64) if scaler_b64 else None
        le     = _decode_object(le_b64)     if le_b64     else None

        if model is None or scaler is None:
            return {"error": "Could not deserialise model. Ensure joblib is installed."}

        df = pd.DataFrame(rows)
        for col in feature_names:
            if col not in df.columns:
                df[col] = 0
        df = df[feature_names]

        for col in df.select_dtypes(include="object").columns:
            enc = LabelEncoder()
            df[col] = enc.fit_transform(df[col].astype(str))

        imputer = SimpleImputer(strategy="median")
        X_arr   = imputer.fit_transform(df.values.astype(float))
        X_sc    = scaler.transform(X_arr)
        y_pred  = model.predict(X_sc)

        preds = [str(p) for p in le.inverse_transform(y_pred.astype(int))] if le is not None \
                else [round(float(p), 4) for p in y_pred]

        probs = None
        if hasattr(model, "predict_proba") and le is not None:
            try:
                proba  = model.predict_proba(X_sc)
                labels = [str(c) for c in le.classes_]
                probs  = [{labels[i]: round(float(v), 4) for i, v in enumerate(row)} for row in proba]
            except Exception:
                pass

        return {"predictions": preds, "probabilities": probs}

    except Exception as exc:
        import traceback as _tb
        return {"error": str(exc), "traceback": _tb.format_exc(limit=6)}


# ═══════════════════════════════════════════════════════════════════════════════
#  REPORT GENERATOR  (unchanged)
# ═══════════════════════════════════════════════════════════════════════════════

def generate_report(train_result: dict, dataset_profile: dict) -> dict:
    metrics  = train_result.get("metrics", {})
    task     = train_result.get("task_type", "unknown")
    fi       = train_result.get("feature_importance", [])
    cm       = train_result.get("confusion_matrix", {})
    roc      = train_result.get("roc_curve", {})
    cv       = train_result.get("cv_score")
    cv_std   = train_result.get("cv_std")

    if task == "regression":
        primary_metric = metrics.get("r2_score", 0)
        grade = "Excellent" if primary_metric >= 0.9 else \
                "Good"      if primary_metric >= 0.75 else \
                "Fair"      if primary_metric >= 0.5  else "Poor"
    elif task == "classification":
        primary_metric = metrics.get("accuracy", 0)
        grade = "Excellent" if primary_metric >= 0.95 else \
                "Good"      if primary_metric >= 0.85 else \
                "Fair"      if primary_metric >= 0.70 else "Poor"
    else:
        primary_metric = metrics.get("silhouette_score") or 0
        grade = "Good" if primary_metric >= 0.5 else "Fair" if primary_metric >= 0.25 else "Poor"

    top_features = [fi[i]["feature"] for i in range(min(5, len(fi)))]

    deploy_ready = (
        (task == "regression"     and metrics.get("r2_score", 0) >= 0.70) or
        (task == "classification" and metrics.get("accuracy", 0)  >= 0.80) or
        (task == "clustering"     and (metrics.get("silhouette_score") or 0) >= 0.3)
    )

    return {
        "report_version":   "1.0",
        "model_name":       train_result.get("model_name", ""),
        "model_key":        train_result.get("model_key", ""),
        "category":         train_result.get("category", ""),
        "task_type":        task,
        "grade":            grade,
        "deploy_ready":     deploy_ready,
        "dataset": {
            "rows":            dataset_profile.get("n_rows", 0),
            "cols":            dataset_profile.get("n_cols", 0),
            "missing_pct":     dataset_profile.get("missing_pct", 0),
            "duplicate_pct":   dataset_profile.get("duplicate_pct", 0),
            "n_classes":       dataset_profile.get("n_classes", 0),
            "class_balance":   dataset_profile.get("class_balance", ""),
        },
        "split": {
            "training_samples": train_result.get("training_samples", 0),
            "test_samples":     train_result.get("test_samples", 0),
        },
        "metrics":          metrics,
        "cv_score":         cv,
        "cv_std":           cv_std,
        "eda_score":        train_result.get("eda_score"),
        "top_features":     top_features,
        "all_features":     fi[:10],
        "has_confusion_matrix": bool(cm),
        "has_roc_curve":        bool(roc),
        "n_features":       train_result.get("n_features", 0),
        "feature_names":    train_result.get("feature_names", []),
        "summary": (
            f"Model '{train_result.get('model_name')}' achieved "
            f"{'R²=' + str(metrics.get('r2_score','—')) if task=='regression' else 'accuracy=' + str(round(metrics.get('accuracy',0)*100,1))+'%' if task=='classification' else 'silhouette=' + str(metrics.get('silhouette_score','—'))}. "
            f"Performance grade: {grade}. "
            f"{'Ready for deployment.' if deploy_ready else 'Further tuning recommended before deployment.'}"
        ),
    }


# ═══════════════════════════════════════════════════════════════════════════════
#  MODEL PERSISTENCE  (unchanged from v2.1)
# ═══════════════════════════════════════════════════════════════════════════════

import json
import shutil
from pathlib import Path
from datetime import datetime

_MODELS_BASE = Path(__file__).parent / "saved_models"


def _model_dir(login_id: str) -> Path:
    d = _MODELS_BASE / login_id
    d.mkdir(parents=True, exist_ok=True)
    return d


def save_model(
    model,
    scaler,
    le,
    model_key:   str,
    login_id:    str,
    meta:        dict,
    feature_names: list = None,
    primary_metric: float = None,
) -> str:
    if not JOBLIB_OK:
        raise RuntimeError("joblib not installed — cannot save model")
    if model is None:
        raise RuntimeError("model is None — nothing to save")

    d     = _model_dir(login_id)
    ts    = datetime.now().strftime("%Y%m%d_%H%M%S")
    fname = f"{model_key}_{ts}.joblib"
    fpath = d / fname

    for old in d.glob(f"{model_key}_*.joblib"):
        try:
            old.unlink()
        except Exception:
            pass

    bundle = {
        "model":          model,
        "scaler":         scaler,
        "le":             le,
        "model_key":      model_key,
        "model_name":     meta.get("name", model_key),
        "task_type":      (meta.get("task") or ["unknown"])[0],
        "category":       meta.get("category", "Machine Learning"),
        "feature_names":  feature_names or [],
        "primary_metric": primary_metric,
        "trained_at":     datetime.now().isoformat(),
        "meta":           meta,
    }

    buf = io.BytesIO()
    joblib.dump(bundle, buf)
    with open(fpath, "wb") as f:
        f.write(buf.getvalue())

    logger.info("[ml_engine] Model saved → %s (%.1f KB)", fpath, fpath.stat().st_size / 1024)
    return str(fpath)


def load_model(model_key: str, login_id: str) -> Optional[dict]:
    if not JOBLIB_OK:
        return None
    d = _model_dir(login_id)
    files = sorted(d.glob(f"{model_key}_*.joblib"), reverse=True)
    if not files:
        return None
    try:
        bundle = joblib.load(files[0])
        logger.info("[ml_engine] Model loaded ← %s", files[0])
        return bundle
    except Exception as exc:
        logger.error("[ml_engine] load_model failed: %s", exc)
        return None


def list_saved_models(login_id: str) -> List[dict]:
    d = _model_dir(login_id)
    result = []
    for fpath in sorted(d.glob("*.joblib"), reverse=True):
        try:
            bundle = joblib.load(fpath)
            stat   = fpath.stat()
            result.append({
                "model_key":      bundle.get("model_key", fpath.stem),
                "model_name":     bundle.get("model_name", "—"),
                "task_type":      bundle.get("task_type", "—"),
                "category":       bundle.get("category", "Machine Learning"),
                "feature_names":  bundle.get("feature_names", []),
                "primary_metric": bundle.get("primary_metric"),
                "trained_at":     bundle.get("trained_at"),
                "file_name":      fpath.name,
                "file_size_kb":   round(stat.st_size / 1024, 2),
                "download_url":   f"/ml/download/{bundle.get('model_key', fpath.stem)}",
            })
        except Exception:
            pass
    return result


def delete_saved_model(model_key: str, login_id: str) -> bool:
    d = _model_dir(login_id)
    deleted = False
    for fpath in d.glob(f"{model_key}_*.joblib"):
        try:
            fpath.unlink()
            deleted = True
            logger.info("[ml_engine] Deleted model file: %s", fpath)
        except Exception as exc:
            logger.warning("[ml_engine] Could not delete %s: %s", fpath, exc)
    return deleted

