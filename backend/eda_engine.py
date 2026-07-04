# =========================================================
# eda_engine.py  —  Industry-Level EDA Pipeline  v5.1
# =========================================================
#
# FIXES vs v4.4
# ─────────────────────────────────────────────────────────
# FIX 1  build_dataset_slices(): index-safe missing_mask
# FIX 2  correlation: NaN kept as null (not replaced with 0)
# FIX 3  statistical_summary: non_null_count computed before fillna
# FIX 4  detect_anomalies: guard for len < 3 + std == 0
# FIX 5  handle_missing_values: final sweep handles bool/datetime
# FIX 6  generate_insights: skip _was_missing correlation pairs
#
# NEW FIXES IN v5.1
# ─────────────────────────────────────────────────────────
# FIX 7  DEAD IMPORT — removed "import sqlite3" (never used;
#         project uses MySQL via database.py).
# FIX 8  SERIALISATION BUG — preview was inserted into result
#         dict WITHOUT clean_json(). NaN/NaT values in any of
#         the 10 preview rows would cause "NaN is not JSON
#         serializable". Now wrapped: clean_json(preview).
# FIX 9  PERFORMANCE — compute_scatter_pairs() used iterrows()
#         to build point dicts (10-100x slower than vectorised).
#         Replaced with pts.to_dict(orient='records') +
#         list comprehension with key renaming.
# FIX 10 DEAD CODE NOTE — basic_eda(), treat_outliers(), and
#         build_preprocessing_pipeline() are utility functions
#         not called by perform_eda(). They are kept for future
#         use (Phase 8 Predictive Modeling) but clearly marked.
# =========================================================


# =========================================================
# 1  IMPORT LIBRARIES
# =========================================================
import logging
# FIX 7: removed "import sqlite3" — was never used
from io       import StringIO
from datetime import datetime

import numpy  as np
import pandas as pd

try:
    from sklearn.compose         import ColumnTransformer
    from sklearn.impute          import SimpleImputer
    from sklearn.model_selection import train_test_split
    from sklearn.pipeline        import Pipeline
    from sklearn.preprocessing   import OneHotEncoder, StandardScaler
    SKLEARN_AVAILABLE = True
except ImportError:
    SKLEARN_AVAILABLE = False


# =========================================================
# EDA ACCURACY ENGINE  (inline — no external import needed)
# =========================================================
_ACC_WEIGHTS = {
    "completeness": 0.25,
    "validity":     0.20,
    "consistency":  0.20,
    "uniqueness":   0.20,
    "integrity":    0.15,
}

def compute_eda_accuracy(df: pd.DataFrame, handling_report: dict, duplicates: int) -> dict:
    """
    Compute a weighted 5-dimension EDA Accuracy score (0-100).

    Dimensions
    ----------
    Completeness  0.25  — missing cell rate
    Validity      0.20  — range / type checks
    Consistency   0.20  — cross-field rules, constant cols, high cardinality
    Uniqueness    0.20  — duplicate rows
    Integrity     0.15  — severely null cols, mixed-type cols
    """
    if df is None or df.empty or len(df.columns) == 0:
        return {
            "eda_accuracy": 0.0, "completeness": 0.0, "validity": 0.0,
            "consistency": 0.0,  "uniqueness": 0.0,  "integrity": 0.0,
            "issues": ["Empty or invalid dataset"],
            "suggestions": ["Upload a valid non-empty file"],
            "grade": "F", "ml_ready": False,
            "dimension_weights": _ACC_WEIGHTS,
            "missing_pct": 100.0, "duplicate_pct": 0.0,
        }

    total_rows  = len(df)
    total_cols  = len(df.columns)
    total_cells = total_rows * total_cols
    issues: list  = []
    suggestions: list = []

    # ── 1. Completeness ──────────────────────────────────────────────────────
    total_missing = int(df.isnull().sum().sum())
    missing_pct   = (total_missing / total_cells * 100) if total_cells > 0 else 0
    completeness  = round(max(0.0, 100.0 - missing_pct * 1.5), 2)
    if missing_pct > 0:
        issues.append(f"{missing_pct:.1f}% missing values across all cells")
    if missing_pct > 5:
        suggestions.append("Fill or drop columns with high missing rates")
    if missing_pct > 20:
        suggestions.append("Consider imputation strategies before ML modelling")

    # ── 2. Validity ──────────────────────────────────────────────────────────
    validity        = 100.0
    invalid_details = []
    for col in df.columns:
        if col.endswith("_was_missing"):
            continue
        series = df[col].dropna()
        if len(series) == 0:
            continue
        if pd.api.types.is_numeric_dtype(series):
            cl = col.lower()
            if any(k in cl for k in ["age", "years", "yr"]):
                bad = int(((series < 0) | (series > 120)).sum())
                if bad:
                    validity -= min(round(bad / len(series) * 100, 1) * 0.3, 5)
                    invalid_details.append(f"'{col}': {bad} values outside age range 0–120")
            elif any(k in cl for k in ["pct", "percent", "rate", "ratio"]):
                bad = int(((series < 0) | (series > 100)).sum())
                if bad:
                    validity -= min(round(bad / len(series) * 100, 1) * 0.3, 5)
                    invalid_details.append(f"'{col}': {bad} percentage values outside 0–100")
            elif any(k in cl for k in ["price", "cost", "qty", "quantity", "amount", "salary"]):
                bad = int((series < 0).sum())
                if bad:
                    validity -= min(round(bad / len(series) * 100, 1) * 0.2, 5)
                    invalid_details.append(f"'{col}': {bad} negative values (expected non-negative)")
        if pd.api.types.is_object_dtype(series):
            ss = series.astype(str)
            if len(ss.unique()) > len(ss.str.lower().unique()):
                n = len(ss.unique()) - len(ss.str.lower().unique())
                validity -= min(n * 0.1, 3)
                invalid_details.append(f"'{col}': mixed-case inconsistency ({n} extra variants)")
    validity = round(max(0.0, validity), 2)
    if invalid_details:
        issues.extend(invalid_details[:5])
        suggestions.append("Standardise categorical columns (e.g. uniform casing)")
        suggestions.append("Validate numeric ranges before ML feature engineering")

    # ── 3. Consistency ───────────────────────────────────────────────────────
    consistency   = 100.0
    col_lower_map = {c.lower(): c for c in df.columns}

    def _find(keywords):
        for kw in keywords:
            for lc, rc in col_lower_map.items():
                if kw in lc:
                    return rc
        return None

    _qty   = _find(["qty", "quantity", "count"])
    _price = _find(["unit_price", "price_per", "unitprice"])
    _total = _find(["total", "total_price", "totalprice", "amount"])
    if _qty and _price and _total:
        try:
            diff = ((df[_qty] * df[_price] - df[_total]).abs() / (df[_total].abs() + 1e-9)).dropna()
            bad  = int((diff > 0.01).sum())
            if bad:
                cp = round(bad / total_rows * 100, 1)
                consistency -= min(cp * 0.5, 15)
                issues.append(f"{bad} rows where {_total} ≠ {_qty} × {_price} (>{cp}%)")
                suggestions.append(f"Re-check: {_total} = {_qty} × {_price}")
        except Exception:
            pass

    const_cols = [c for c in df.columns
                  if not c.endswith("_was_missing") and df[c].nunique(dropna=True) <= 1]
    if const_cols:
        consistency -= min(len(const_cols) * 3, 15)
        issues.append(f"{len(const_cols)} constant column(s): {', '.join(const_cols[:3])}")
        suggestions.append("Drop constant / zero-variance columns before modelling")

    high_card = [c for c in df.select_dtypes(include="object").columns
                 if not c.endswith("_was_missing")
                 and df[c].nunique() / max(total_rows, 1) > 0.9
                 and df[c].nunique() > 50]
    if high_card:
        consistency -= min(len(high_card) * 2, 10)
        issues.append(f"{len(high_card)} high-cardinality categorical column(s) — may be ID/free-text")
        suggestions.append("Review high-cardinality columns — encode or drop before ML")
    consistency = round(max(0.0, consistency), 2)

    # ── 4. Uniqueness ────────────────────────────────────────────────────────
    dup_pct    = (duplicates / total_rows * 100) if total_rows > 0 else 0
    uniqueness = round(max(0.0, 100.0 - dup_pct * 2.0), 2)
    if dup_pct > 0:
        issues.append(f"{dup_pct:.1f}% duplicate rows ({duplicates:,} records)")
    if dup_pct > 1:
        suggestions.append("Remove duplicate rows before model training")

    # ── 5. Integrity ─────────────────────────────────────────────────────────
    integrity = 100.0
    sev_miss  = [c for c in df.columns
                 if not c.endswith("_was_missing")
                 and df[c].isnull().mean() * 100 > 80]
    if sev_miss:
        integrity -= min(len(sev_miss) * 5, 25)
        issues.append(f"{len(sev_miss)} column(s) with >80% null rate: {', '.join(sev_miss[:3])}")
        suggestions.append("Drop or impute columns with >80% missing values")

    mixed = []
    for col in df.select_dtypes(include="object").columns:
        if col.endswith("_was_missing"):
            continue
        try:
            sample = df[col].dropna().head(200).astype(str)
            ratio  = sample.str.match(r"^-?\d+\.?\d*$").mean()
            if 0.3 < ratio < 0.9:
                mixed.append(col)
                integrity -= 3
        except Exception:
            pass
    if mixed:
        issues.append(f"{len(mixed)} column(s) appear to have mixed types: {', '.join(mixed[:3])}")
        suggestions.append("Cast mixed-type columns to consistent dtypes")
    integrity = round(max(0.0, integrity), 2)

    # ── Weighted final score ─────────────────────────────────────────────────
    eda_accuracy = round(
        _ACC_WEIGHTS["completeness"] * completeness
        + _ACC_WEIGHTS["validity"]     * validity
        + _ACC_WEIGHTS["consistency"]  * consistency
        + _ACC_WEIGHTS["uniqueness"]   * uniqueness
        + _ACC_WEIGHTS["integrity"]    * integrity,
        2,
    )
    grade    = ("A" if eda_accuracy >= 90 else "B" if eda_accuracy >= 80
                else "C" if eda_accuracy >= 65 else "D" if eda_accuracy >= 50 else "F")
    ml_ready = eda_accuracy >= 75

    if not ml_ready:
        suggestions.append("Dataset accuracy below 75% — resolve quality issues before ML/DL training")

    # deduplicate
    seen_s: set = set()
    unique_s    = [s for s in suggestions if not (s in seen_s or seen_s.add(s))]  # type: ignore[func-returns-value]

    logger.info("EDA Accuracy=%.1f%% C=%.1f V=%.1f Co=%.1f U=%.1f I=%.1f grade=%s",
                eda_accuracy, completeness, validity, consistency, uniqueness, integrity, grade)

    return {
        "eda_accuracy":      eda_accuracy,
        "completeness":      completeness,
        "validity":          validity,
        "consistency":       consistency,
        "uniqueness":        uniqueness,
        "integrity":         integrity,
        "issues":            issues[:10],
        "suggestions":       unique_s[:8],
        "grade":             grade,
        "ml_ready":          ml_ready,
        "dimension_weights": _ACC_WEIGHTS,
        "missing_pct":       round(missing_pct, 2),
        "duplicate_pct":     round(dup_pct, 2),
    }

EDA_ACCURACY_AVAILABLE = True   # always True — no external dependency


# =========================================================
# 2  LOGGING
# =========================================================
logging.basicConfig(
    level  = logging.INFO,
    format = "%(asctime)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)


# =========================================================
# 3  SAFE JSON SERIALISATION HELPER
# =========================================================
def clean_json(obj):
    """
    Recursively convert any Python / NumPy / Pandas object
    into a structure that json.dumps() can handle.
    """
    if isinstance(obj, dict):
        return {k: clean_json(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [clean_json(v) for v in obj]
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, (np.integer, np.int64)):
        return int(obj)
    if isinstance(obj, (np.floating, np.float64)):
        val = float(obj)
        return None if (np.isnan(val) or np.isinf(val)) else val
    if isinstance(obj, float):
        return None if (np.isnan(obj) or np.isinf(obj)) else obj
    if isinstance(obj, bool):
        return bool(obj)
    try:
        if pd.isna(obj):
            return None
    except Exception:
        pass
    return obj


# =========================================================
# 4  MULTI-FORMAT DATA LOADER  (utility — not called by pipeline)
# =========================================================
def load_data(path, file_type="csv", **kwargs):
    """
    Standalone utility to load datasets from various formats.
    NOTE: Not called by perform_eda(). Loading happens in main.py.
    Kept here for use in notebooks / scripts / future CLI tool.
    """
    readers = {
        "csv"     : lambda: pd.read_csv(path, **kwargs),
        "excel"   : lambda: pd.read_excel(path, **kwargs),
        "json"    : lambda: pd.read_json(path, **kwargs),
        "parquet" : lambda: pd.read_parquet(path, **kwargs),
        "xml"     : lambda: pd.read_xml(path, **kwargs),
        "pickle"  : lambda: pd.read_pickle(path, **kwargs),
        "hdf"     : lambda: pd.read_hdf(path, **kwargs),
        "feather" : lambda: pd.read_feather(path, **kwargs),
        "text"    : lambda: pd.read_csv(path, delimiter="\t", **kwargs),
        "sql"     : lambda: pd.read_sql(path, kwargs.pop("conn"), **kwargs),
    }
    if file_type not in readers:
        raise ValueError(
            f"Unsupported file type '{file_type}'. Supported: {list(readers.keys())}"
        )
    df = readers[file_type]()
    logger.info("Data loaded — shape %s", df.shape)
    return df


# =========================================================
# 5  BASIC EDA REPORTER  (utility — not called by pipeline)
# =========================================================
# FIX 10: basic_eda() is dead code — never called by perform_eda().
# Kept as a quick diagnostic utility. Uses logger instead of print().
def basic_eda(df):
    """Quick console EDA — for notebooks and debugging only."""
    logger.info("SHAPE            : %s", df.shape)
    logger.info("MISSING VALUES   :\n%s", df.isnull().sum())
    logger.info("DUPLICATES       : %s", df.duplicated().sum())
    logger.info("DATA TYPES       :\n%s", df.dtypes)
    logger.info("STATISTICAL SUMMARY:\n%s", df.describe())


# =========================================================
# 6  DUPLICATE REMOVER
# =========================================================
def remove_duplicates(df):
    before  = len(df)
    df      = df.drop_duplicates()
    removed = before - len(df)
    pct     = (removed / before * 100) if before else 0
    logger.info("Duplicates removed: %d  (%.2f %%)", removed, pct)
    return df


# =========================================================
# 7  OUTLIER DETECTION — IQR  (flag only)
# =========================================================
def detect_outliers(df, numeric_cols):
    """Detect outliers using IQR fences (Q1-1.5*IQR, Q3+1.5*IQR)."""
    outlier_report = {}
    for col in numeric_cols:
        series = df[col].dropna()
        if len(series) < 4:
            continue
        Q1         = series.quantile(0.25)
        Q3         = series.quantile(0.75)
        IQR        = Q3 - Q1
        lower      = Q1 - 1.5 * IQR
        upper      = Q3 + 1.5 * IQR
        n_outliers = int(((series < lower) | (series > upper)).sum())
        outlier_report[col] = {
            "outliers_count": n_outliers,
            "lower_bound"   : round(float(lower), 4),
            "upper_bound"   : round(float(upper), 4),
            "Q1"            : round(float(Q1),    4),
            "Q3"            : round(float(Q3),    4),
            "IQR"           : round(float(IQR),   4),
        }
    return outlier_report


# =========================================================
# 8  OUTLIER TREATMENT — IQR Capping  (utility — not called by pipeline)
# =========================================================
# FIX 10: treat_outliers() is not called by perform_eda().
# Outliers are detected but not winsorised in the current pipeline.
# To enable: call treat_outliers(df, numeric_cols_clean) in perform_eda()
# after Step 10 (outlier detection). Kept here for Phase 8 activation.
def treat_outliers(df, numeric_cols):
    """Cap outlier values at the IQR fence boundaries (Winsorisation)."""
    for col in numeric_cols:
        Q1    = df[col].quantile(0.25)
        Q3    = df[col].quantile(0.75)
        IQR   = Q3 - Q1
        lower = Q1 - 1.5 * IQR
        upper = Q3 + 1.5 * IQR
        df[col] = np.where(df[col] < lower, lower, df[col])
        df[col] = np.where(df[col] > upper, upper, df[col])
    logger.info("Outliers treated via IQR capping for %d columns", len(numeric_cols))
    return df


# =========================================================
# 9  COLUMN-CATEGORY DETECTOR
# =========================================================
def get_col_category(series):
    """Classify a pandas Series as 'Numeric' or 'Categorical'."""
    if series.dtype == bool:
        return "Categorical"
    if pd.api.types.is_numeric_dtype(series):
        return "Numeric"
    if series.dtype == "object":
        converted = pd.to_numeric(series, errors="coerce")
        if converted.notna().sum() > len(series) * 0.7:
            return "Numeric"
    return "Categorical"


# =========================================================
# 10  FAKE-MISSING VALUE STANDARDISER
# =========================================================
def standardize_missing_values(df):
    """Convert common fake-missing representations to np.nan."""
    missing_patterns = [
        "", " ", "  ",
        "NA", "N/A", "na", "n/a", "Na",
        "NULL", "null", "Null",
        "None", "none",
        "NaN", "nan", "NAN",
        "-", "--", "---", "?",
    ]
    df = df.replace(missing_patterns, np.nan)
    logger.info("Fake-missing values standardised to NaN.")
    return df


# =========================================================
# 11  FULLY-EMPTY COLUMN DROPPER
# =========================================================
def drop_fully_empty_columns(df):
    """Drop columns where 100 % of values are NaN."""
    empty_cols = df.columns[df.isna().all()].tolist()
    warn_cols  = df.columns[df.isna().mean() > 0.7].tolist()

    if empty_cols:
        logger.info("Dropping %d fully-empty column(s): %s", len(empty_cols), empty_cols)
        df = df.drop(columns=empty_cols)

    for col in warn_cols:
        if col not in empty_cols and col in df.columns:
            pct = df[col].isna().mean() * 100
            logger.warning("Column '%s' is %.1f %% empty.", col, pct)

    return df, empty_cols


# =========================================================
# 12  DATE SEQUENCE VALIDATOR & AUTO-FILLER
# =========================================================
def detect_frequency(date_series):
    """Detect the dominant time frequency of a datetime Series."""
    date_series = date_series.sort_values().dropna()
    if len(date_series) < 3:
        return None
    diffs = date_series.diff().dropna()
    if len(diffs) == 0:
        return None
    most_common_diff = diffs.value_counts().index[0]
    days             = most_common_diff.days
    if days == 1:
        return "D"
    elif 28 <= days <= 31:
        return "M"
    elif 365 <= days <= 366:
        return "Y"
    return None


def fill_missing_sequence(df, date_col, mode="sequence"):
    """Detect and fill missing date gaps in a datetime column."""
    df   = df.sort_values(date_col).reset_index(drop=True)
    freq = detect_frequency(df[date_col])

    if freq is None:
        logger.warning("Could not detect date frequency for '%s'.", date_col)
        return df, None, 0

    logger.info("Date column '%s' — frequency: %s", date_col, freq)

    if mode == "keep":
        return df, freq, 0

    start_date = df[date_col].min()
    end_date   = df[date_col].max()
    full_range = pd.date_range(start=start_date, end=end_date, freq=freq)
    original_n = len(df)

    df            = df.set_index(date_col).reindex(full_range)
    df.index.name = date_col
    df            = df.reset_index()

    gaps_filled = len(df) - original_n
    if gaps_filled > 0:
        logger.info("Filled %d missing date gap(s) in '%s'.", gaps_filled, date_col)

    return df, freq, gaps_filled


# =========================================================
# 13  DATE FORMAT DETECTION & AUTO-PARSING
# =========================================================
DATE_FORMATS = [
    "%Y-%m-%d",           "%Y/%m/%d",           "%Y.%m.%d",
    "%d/%m/%Y",           "%d-%m-%Y",           "%d.%m.%Y",
    "%d/%m/%y",           "%d-%m-%y",
    "%m/%d/%Y",           "%m-%d-%Y",           "%m/%d/%y",
    "%d %b %Y",           "%d %B %Y",
    "%B %d, %Y",          "%b %d, %Y",
    "%d-%b-%Y",           "%d-%B-%Y",           "%d %b %y",
    "%Y-%m-%d %H:%M:%S",  "%d/%m/%Y %H:%M:%S",
    "%m/%d/%Y %H:%M:%S",  "%Y-%m-%dT%H:%M:%S",
]


def detect_date_format(series):
    """Probe the first 50 non-null values against every DATE_FORMATS pattern."""
    sample = series.dropna().head(50).astype(str)
    for fmt in DATE_FORMATS:
        try:
            parsed = pd.to_datetime(sample, format=fmt, errors="coerce")
            if parsed.notna().sum() >= len(sample) * 0.8:
                return fmt
        except Exception:
            continue
    return None


def try_parse_dates(df):
    """Scan every object column and attempt datetime conversion."""
    detected_dates  = []
    date_format_map = {}

    for col in df.columns:
        if df[col].dtype != "object":
            continue
        fmt = detect_date_format(df[col])
        if not fmt:
            continue
        try:
            parsed = pd.to_datetime(df[col], format=fmt, errors="coerce")
            if parsed.notna().sum() > len(df) * 0.6:
                df[col]              = parsed
                detected_dates.append(col)
                date_format_map[col] = fmt
                logger.info("Date column detected: '%s'  format: %s", col, fmt)
        except Exception:
            try:
                parsed = pd.to_datetime(df[col], errors="coerce")
                if parsed.notna().sum() > len(df) * 0.6:
                    df[col]              = parsed
                    detected_dates.append(col)
                    date_format_map[col] = "auto-detected"
            except Exception:
                pass

    return df, detected_dates, date_format_map


# =========================================================
# 14  PRE-CLEANING SNAPSHOT
# =========================================================
def capture_before_snapshot(df):
    """Record the state of every column BEFORE any cleaning."""
    snapshot   = {}
    total_rows = len(df)
    THRESHOLD  = 0.05

    for col in df.columns:
        missing_count   = int(df[col].isnull().sum())
        col_category    = get_col_category(df[col])
        missing_ratio   = missing_count / total_rows if total_rows > 0 else 0
        fill_value      = None
        fill_strategy   = "No Action Needed"
        strategy_reason = "Column has no missing values"
        skewness_val    = None
        will_drop_rows  = False
        indicator_col   = None

        if col_category == "Numeric":
            num_series = (
                pd.to_numeric(df[col], errors="coerce")
                if df[col].dtype == "object"
                else df[col]
            )
            if missing_count > 0:
                try:
                    skewness_val = round(float(num_series.skew()), 4)
                except Exception:
                    skewness_val = None

                if missing_ratio < THRESHOLD:
                    will_drop_rows  = True
                    fill_strategy   = f"Drop {missing_count} rows (missing < 5 %)"
                    strategy_reason = (
                        f"Missing ratio {missing_ratio:.2%} < 5 % threshold → "
                        f"safest to drop {missing_count} rows"
                    )
                else:
                    indicator_col = col + "_was_missing"
                    if skewness_val is not None and -0.5 < skewness_val < 0.5:
                        val = num_series.mean()
                        if val is not None and not np.isnan(float(val)):
                            fill_value      = round(float(val), 4)
                            fill_strategy   = f"Fill {missing_count} missing with Mean = {fill_value}"
                            strategy_reason = f"Symmetric distribution (skew = {skewness_val}) → Mean"
                    else:
                        val = num_series.median()
                        if val is not None and not np.isnan(float(val)):
                            fill_value      = round(float(val), 4)
                            fill_strategy   = f"Fill {missing_count} missing with Median = {fill_value}"
                            strategy_reason = f"Skewed distribution (skew = {skewness_val}) → Median"

        elif col_category == "Categorical":
            if missing_count > 0:
                indicator_col = col + "_was_missing"
                if missing_ratio < THRESHOLD:
                    mode_vals = df[col].dropna().mode()
                    if len(mode_vals) > 0:
                        fill_value      = str(mode_vals[0])
                        fill_strategy   = f"Fill {missing_count} missing with Mode = '{fill_value}'"
                        strategy_reason = f"Missing ratio {missing_ratio:.2%} < 5 % → Mode fill"
                    else:
                        fill_strategy   = "Fill with 'Unknown'"
                        fill_value      = "Unknown"
                        strategy_reason = "No dominant category found"
                else:
                    fill_value      = "Unknown"
                    fill_strategy   = f"Fill {missing_count} missing with 'Unknown'"
                    strategy_reason = f"Missing ratio {missing_ratio:.2%} ≥ 5 % → 'Unknown'"

        try:
            if df[col].dtype == "object":
                vc_before = df[col].str.strip().value_counts(dropna=False).head(10).to_dict()
            else:
                vc_before = df[col].value_counts(dropna=False).head(10).to_dict()
        except Exception:
            vc_before = {}
        vc_before = {str(k): int(v) for k, v in vc_before.items()}

        try:
            sample_missing = df.index[df[col].isnull()].tolist()[:5]
            sample_missing = [int(i) for i in sample_missing]
        except Exception:
            sample_missing = []

        snapshot[col] = {
            "col_type"           : col_category,
            "missing_count"      : missing_count,
            "missing_pct"        : round(missing_ratio * 100, 2),
            "missing_ratio"      : round(missing_ratio, 6),
            "skewness"           : skewness_val,
            "fill_value"         : str(fill_value) if fill_value is not None else None,
            "fill_strategy"      : fill_strategy,
            "strategy_reason"    : strategy_reason,
            "will_drop_rows"     : will_drop_rows,
            "indicator_col"      : indicator_col,
            "total_rows"         : total_rows,
            "vc_before"          : vc_before,
            "sample_missing_rows": sample_missing,
        }

    return snapshot


# =========================================================
# 15  INTELLIGENT MISSING-VALUE HANDLER  v2
# =========================================================
MISSING_THRESHOLD = 0.05


def handle_numerical_missing(df, threshold=MISSING_THRESHOLD):
    """Handle missing values in NUMERICAL columns only."""
    numeric_report = {}
    numeric_cols   = df.select_dtypes(include=np.number).columns.tolist()

    for col in numeric_cols:
        if col.endswith("_was_missing"):
            continue

        missing_ratio = df[col].isna().mean()

        if missing_ratio == 0:
            numeric_report[col] = {
                "action": "No Missing", "fill_val": None,
                "strategy": "No action needed", "skewness": None,
                "missing_ratio": 0.0, "indicator_added": False,
            }
            continue

        logger.info("  [Numeric] '%s' — missing: %.2f %%", col, missing_ratio * 100)

        if missing_ratio < threshold:
            rows_before  = len(df)
            df           = df.dropna(subset=[col])
            rows_dropped = rows_before - len(df)
            numeric_report[col] = {
                "action"         : f"Dropped {rows_dropped} rows (missing < {threshold:.0%})",
                "fill_val"       : None,
                "strategy"       : "Drop rows",
                "skewness"       : None,
                "missing_ratio"  : round(float(missing_ratio), 6),
                "indicator_added": False,
            }
        else:
            indicator_name     = col + "_was_missing"
            df[indicator_name] = df[col].isna().astype(int)
            skew_value         = float(df[col].skew())

            if abs(skew_value) < 0.5:
                fill_value = round(float(df[col].mean()), 4)
                strategy   = "Mean"
            else:
                fill_value = round(float(df[col].median()), 4)
                strategy   = "Median"

            df[col] = df[col].fillna(fill_value)

            numeric_report[col] = {
                "action"         : f"Filled NaN with {strategy} = {fill_value}",
                "fill_val"       : fill_value,
                "strategy"       : strategy,
                "skewness"       : round(skew_value, 4),
                "missing_ratio"  : round(float(missing_ratio), 6),
                "indicator_added": True,
                "indicator_col"  : indicator_name,
            }
            logger.info("  [Numeric] '%s': %s(%s) skew=%.2f", col, strategy, fill_value, skew_value)

    return df, numeric_report


def handle_categorical_missing(df, threshold=MISSING_THRESHOLD):
    """Handle missing values in CATEGORICAL columns only."""
    categorical_report = {}
    cat_cols           = df.select_dtypes(include="object").columns.tolist()

    for col in cat_cols:
        if col.endswith("_was_missing"):
            continue

        df[col] = df[col].where(df[col].isnull(), df[col].astype(str).str.strip())
        df[col] = df[col].replace("", np.nan)

        missing_ratio = df[col].isna().mean()

        if missing_ratio == 0:
            categorical_report[col] = {
                "action": "No Missing", "fill_val": None,
                "strategy": "No action needed",
                "missing_ratio": 0.0, "indicator_added": False,
            }
            continue

        logger.info("  [Categorical] '%s' — missing: %.2f %%", col, missing_ratio * 100)

        indicator_name     = col + "_was_missing"
        df[indicator_name] = df[col].isna().astype(int)

        if missing_ratio < threshold:
            mode_vals  = df[col].mode(dropna=True)
            fill_value = str(mode_vals[0]) if len(mode_vals) > 0 else "Unknown"
            strategy   = "Mode" if len(mode_vals) > 0 else "Unknown (no mode)"
        else:
            fill_value = "Unknown"
            strategy   = "Unknown"

        df[col] = df[col].fillna(fill_value)

        categorical_report[col] = {
            "action"         : f"Filled NaN with {strategy} = '{fill_value}'",
            "fill_val"       : fill_value,
            "strategy"       : strategy,
            "missing_ratio"  : round(float(missing_ratio), 6),
            "indicator_added": True,
            "indicator_col"  : indicator_name,
        }
        logger.info("  [Categorical] '%s': %s('%s')", col, strategy, fill_value)

    return df, categorical_report


def handle_missing_values(df, already_standardized=False):
    """Master missing-value pipeline."""
    if not already_standardized:
        df = standardize_missing_values(df)

    before_snapshot = capture_before_snapshot(df)
    handling_report = {}
    logger.info("Starting missing-value handling pipeline ...")

    df, _ = drop_fully_empty_columns(df)

    total_rows      = len(df)
    missing_percent = df.isnull().sum() / total_rows
    cols_to_drop    = missing_percent[missing_percent > 0.5].index.tolist()
    cols_to_drop    = [c for c in cols_to_drop if c in df.columns]

    if cols_to_drop:
        logger.info("Dropping %d column(s) with >50 %% missing: %s", len(cols_to_drop), cols_to_drop)
        df = df.drop(columns=cols_to_drop)

    for col in df.select_dtypes(include="object").columns:
        if col.endswith("_was_missing"):
            continue
        converted = pd.to_numeric(df[col], errors="coerce")
        if converted.notna().sum() > len(df) * 0.7:
            df[col] = converted
            logger.info("  Column '%s' cast object -> numeric", col)

    df, numeric_report     = handle_numerical_missing(df, threshold=MISSING_THRESHOLD)
    df, categorical_report = handle_categorical_missing(df, threshold=MISSING_THRESHOLD)

    # FIX 5: Expanded final NaN sweep — handles bool, datetime, and other dtypes
    for col in df.columns:
        if col.endswith("_was_missing"):
            continue
        if not df[col].isnull().any():
            continue
        if pd.api.types.is_numeric_dtype(df[col]):
            df[col] = df[col].fillna(df[col].median())
        elif df[col].dtype == "object":
            mode_vals = df[col].mode()
            if len(mode_vals) > 0:
                df[col] = df[col].fillna(mode_vals[0])
        else:
            # bool, datetime, category — forward-fill then back-fill
            df[col] = df[col].ffill().bfill()

    # Time-series guard
    date_col = next((c for c in ["Date", "date", "DATE"] if c in df.columns), None)
    if date_col:
        try:
            df = df.sort_values(date_col).ffill().bfill()
            logger.info("Time-series guard applied on '%s'.", date_col)
        except Exception as exc:
            logger.warning("Time-series fill failed: %s", exc)

    all_sub_reports = {**numeric_report, **categorical_report}

    for col in before_snapshot:
        snap       = before_snapshot[col]
        sub        = all_sub_reports.get(col, {})
        col_action = sub.get("action", "No Missing")

        try:
            vc_after = df[col].value_counts(dropna=False).head(10).to_dict() if col in df.columns else {}
        except Exception:
            vc_after = {}
        vc_after = {str(k): int(v) for k, v in vc_after.items()}

        missing_after = int(df[col].isnull().sum()) if col in df.columns else 0

        handling_report[col] = {
            "missing_before"     : snap.get("missing_count", 0),
            "missing_after"      : missing_after,
            "method"             : col_action,
            "col_type"           : snap.get("col_type", "Unknown"),
            "fill_value"         : snap.get("fill_value", None),
            "fill_strategy"      : snap.get("fill_strategy", "—"),
            "missing_pct"        : snap.get("missing_pct", 0),
            "vc_before"          : snap.get("vc_before", {}),
            "vc_after"           : vc_after,
            "missing_ratio"      : snap.get("missing_ratio", 0),
            "skewness"           : snap.get("skewness", None),
            "strategy_reason"    : snap.get("strategy_reason", "—"),
            "indicator_col"      : snap.get("indicator_col", None),
            "will_drop_rows"     : snap.get("will_drop_rows", False),
            "sample_missing_rows": snap.get("sample_missing_rows", []),
            "impute_strategy"    : sub.get("strategy", "No action"),
            "indicator_added"    : sub.get("indicator_added", False),
        }

    logger.info("Missing-value pipeline complete.")
    return df, handling_report, before_snapshot


# =========================================================
# 16  EXTENDED STATISTICAL SUMMARY
# =========================================================
def statistical_summary(df, numeric_cols):
    """Compute extended descriptive statistics per numeric column."""
    if not numeric_cols:
        return {}

    summary = {}
    for col in numeric_cols:
        if col.endswith("_was_missing"):
            continue
        try:
            s        = df[col]
            mean_val = float(s.mean())
            std_val  = float(s.std())
            min_val  = float(s.min())
            max_val  = float(s.max())

            # FIX 3: Counts computed on original series (before any fillna)
            missing_count  = int(s.isnull().sum())
            non_null_count = int(s.notna().sum())

            summary[col] = {
                "mean"          : round(mean_val,                4),
                "median"        : round(float(s.median()),       4),
                "std"           : round(std_val,                 4),
                "variance"      : round(float(s.var()),          4),
                "min"           : round(min_val,                 4),
                "max"           : round(max_val,                 4),
                "range"         : round(max_val - min_val,       4),
                "25%"           : round(float(s.quantile(0.25)), 4),
                "75%"           : round(float(s.quantile(0.75)), 4),
                "skewness"      : round(float(s.skew()),         4),
                "kurtosis"      : round(float(s.kurtosis()),     4),
                "cv"            : (
                    round(abs(std_val / mean_val) * 100, 2) if mean_val != 0 else None
                ),
                "missing_count" : missing_count,
                "non_null_count": non_null_count,
            }
        except Exception as exc:
            logger.warning("Stats failed for '%s': %s", col, exc)

    return summary


# =========================================================
# 17  Z-SCORE ANOMALY DETECTION
# =========================================================
def detect_anomalies(df, numeric_cols):
    """Flag data points as anomalies using the Z-score method (|Z| > 3)."""
    anomalies = {}
    for col in numeric_cols:
        if col.endswith("_was_missing"):
            continue
        try:
            series = df[col].dropna()
            # FIX 4: Guard for short series and zero std
            if len(series) < 3:
                continue
            mean = series.mean()
            std  = series.std()
            if std == 0:
                continue

            z_scores        = np.abs((series - mean) / std)
            anomalous_count = int((z_scores > 3).sum())

            if anomalous_count > 0:
                sample_idx = [int(i) for i in z_scores[z_scores > 3].index.tolist()[:5]]
                anomalies[col] = {
                    "anomalous_count": anomalous_count,
                    "anomalous_pct"  : round((anomalous_count / len(series)) * 100, 2),
                    "mean"           : round(float(mean), 4),
                    "std"            : round(float(std),  4),
                    "threshold"      : 3,
                    "sample_indices" : sample_idx,
                }
        except Exception as exc:
            logger.warning("Anomaly detection failed for '%s': %s", col, exc)

    return anomalies


# =========================================================
# 18  DATA QUALITY SCORE  (0 – 100)
# =========================================================
def calculate_data_quality_score(df, missing_handling_report, duplicates):
    """Score overall data quality on a 0–100 scale."""
    score      = 100.0
    total_rows = len(df)
    total_cols = len(df.columns)

    if total_rows == 0:
        return 0.0

    total_cells   = total_rows * total_cols
    total_missing = sum(v["missing_before"] for v in missing_handling_report.values())
    missing_pct   = (total_missing / total_cells) * 100 if total_cells > 0 else 0
    score        -= min(missing_pct, 30)

    dup_pct = (duplicates / total_rows) * 100
    score  -= min(dup_pct, 15)

    for col in df.columns:
        if col.endswith("_was_missing"):
            continue
        if df[col].nunique() == 1:
            score -= 5

    return round(max(score, 0.0), 2)


# =========================================================
# 19  SKLEARN PREPROCESSING PIPELINE BUILDER
#     (utility — not called by pipeline; reserved for Phase 9)
# =========================================================
# FIX 10: Not called by perform_eda(). Activate in Phase 9 (Predictive Model).
def build_preprocessing_pipeline(df, target_column):
    """Build a production-ready sklearn preprocessing pipeline."""
    if not SKLEARN_AVAILABLE:
        raise ImportError("scikit-learn is required. Install: pip install scikit-learn")

    X = df.drop(columns=[target_column])
    y = df[target_column]

    numerical_cols   = X.select_dtypes(include=["int64", "float64"]).columns
    categorical_cols = X.select_dtypes(include=["object", "category"]).columns

    numeric_pipeline = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="median")),
        ("scaler",  StandardScaler()),
    ])
    categorical_pipeline = Pipeline(steps=[
        ("imputer", SimpleImputer(strategy="most_frequent")),
        ("encoder", OneHotEncoder(handle_unknown="ignore")),
    ])
    preprocessor = ColumnTransformer(transformers=[
        ("num", numeric_pipeline,     numerical_cols),
        ("cat", categorical_pipeline, categorical_cols),
    ])

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42
    )

    logger.info("Pipeline built — train: %d / test: %d", len(X_train), len(X_test))
    return preprocessor, X_train, X_test, y_train, y_test


# =========================================================
# 20  BOXPLOT DATA  — Chart.js ready
# =========================================================
def compute_boxplot_data(df, numeric_cols):
    """Compute whisker / box / outlier coordinates for Chart.js."""
    boxplots = {}
    for col in numeric_cols:
        if col.endswith("_was_missing"):
            continue
        try:
            series = df[col].dropna()
            if len(series) < 4:
                continue
            Q1          = float(series.quantile(0.25))
            Q3          = float(series.quantile(0.75))
            IQR         = Q3 - Q1
            lower       = Q1 - 1.5 * IQR
            upper       = Q3 + 1.5 * IQR
            whisker_lo  = float(series[series >= lower].min())
            whisker_hi  = float(series[series <= upper].max())
            outlier_pts = series[(series < lower) | (series > upper)].tolist()
            boxplots[col] = {
                "min"     : round(whisker_lo,             4),
                "q1"      : round(Q1,                     4),
                "median"  : round(float(series.median()), 4),
                "mean"    : round(float(series.mean()),   4),
                "q3"      : round(Q3,                     4),
                "max"     : round(whisker_hi,             4),
                "outliers": [round(float(v), 4) for v in outlier_pts[:100]],
            }
        except Exception as exc:
            logger.warning("Boxplot failed for '%s': %s", col, exc)
    return boxplots


# =========================================================
# 21  SCATTER PAIRS  — top correlated (Chart.js ready)
# =========================================================
def compute_scatter_pairs(df, numeric_cols, correlation, top_n=4):
    """
    Find the top-N most correlated pairs and return scatter coordinates.

    FIX 9: Replaced iterrows() with vectorised to_dict(orient='records').
    iterrows() is 10-100x slower — for 300 rows it was negligible but
    for large datasets it caused noticeable lag. Vectorised is always better.
    """
    if len(numeric_cols) < 2:
        return []

    corr_pairs = []
    for i, c1 in enumerate(numeric_cols):
        for c2 in numeric_cols[i + 1:]:
            val = correlation.get(c1, {}).get(c2, 0) or 0
            corr_pairs.append((abs(float(val)), c1, c2, float(val)))

    corr_pairs.sort(reverse=True)

    pairs = []
    seen  = set()
    for _, c1, c2, val in corr_pairs[:top_n]:
        key = f"{c1}|{c2}"
        if key in seen:
            continue
        seen.add(key)

        pts = df[[c1, c2]].dropna().head(300)

        # FIX 9: Vectorised — no iterrows()
        records = pts.to_dict(orient="records")
        points  = [
            {"x": round(float(r[c1]), 4), "y": round(float(r[c2]), 4)}
            for r in records
        ]

        pairs.append({
            "x_col" : c1,
            "y_col" : c2,
            "corr"  : round(val, 4),
            "points": points,
        })
    return pairs


# =========================================================
# 22  FULL DATASET BUILDER
# =========================================================
def build_dataset_slices(df, handling_report):
    """
    Build pre-sliced views of the full dataset for the View Dataset panel.

    FIX 1: Used reset_index(drop=True) on missing_mask so positional
    access into all_records is always safe after date-range reindexing.
    """
    logger.info("Building dataset slices ...")

    n    = len(df)
    cols = df.columns.tolist()

    df_safe = df.copy()
    df_safe = df_safe.where(df_safe.notna(), other=None)

    for col in df_safe.select_dtypes(include="datetime").columns:
        df_safe[col] = df_safe[col].dt.strftime("%Y-%m-%d %H:%M:%S")

    all_records = df_safe.to_dict(orient="records")

    head_slices = {
        "100": [clean_json(r) for r in all_records],
        "75" : [clean_json(r) for r in all_records[:max(1, int(n * 0.75))]],
        "50" : [clean_json(r) for r in all_records[:max(1, int(n * 0.50))]],
        "25" : [clean_json(r) for r in all_records[:max(1, int(n * 0.25))]],
    }

    tail_slices = {
        "100": [clean_json(r) for r in all_records],
        "75" : [clean_json(r) for r in all_records[max(0, int(n * 0.25)):]],
        "50" : [clean_json(r) for r in all_records[max(0, int(n * 0.50)):]],
        "25" : [clean_json(r) for r in all_records[max(0, int(n * 0.75)):]],
    }

    # FIX 1: reset_index ensures positional access into all_records is safe
    missing_mask_values = df.isnull().any(axis=1).reset_index(drop=True).tolist()
    missing_records     = [
        clean_json(all_records[i])
        for i, flag in enumerate(missing_mask_values)
        if flag
    ]

    missing_cols_count = sum(
        1 for v in handling_report.values() if v.get("missing_before", 0) > 0
    )

    logger.info(
        "Slices built — %d rows, %d cols, %d missing rows",
        n, len(cols), len(missing_records),
    )

    return {
        "head"              : head_slices,
        "tail"              : tail_slices,
        "missing"           : missing_records,
        "total_rows"        : n,
        "total_cols"        : len(cols),
        "col_names"         : cols,
        "missing_cols_count": missing_cols_count,
    }


# =========================================================
# 23  SMART AUTO-INSIGHTS GENERATOR
# =========================================================
def generate_insights(
    df, numeric_cols, categorical_cols, datetime_cols,
    handling_report, outlier_report, duplicates, date_format_map,
    anomalies=None, quality_score=None, correlation=None,
):
    """Generate a human-readable list of insight strings."""
    insights    = []
    rows, cols  = df.shape
    anomalies   = anomalies   or {}
    correlation = correlation or {}

    insights.append(f"Dataset: {rows:,} rows × {cols} columns")

    if quality_score is not None:
        grade = ("A" if quality_score >= 90 else
                 "B" if quality_score >= 75 else
                 "C" if quality_score >= 60 else "D")
        insights.append(f"Data Quality Score: {quality_score:.1f}/100  (Grade {grade})")

    if numeric_cols:
        num_str = ", ".join(numeric_cols[:5])
        if len(numeric_cols) > 5:
            num_str += f", +{len(numeric_cols) - 5} more"
        insights.append(f"{len(numeric_cols)} numeric column(s): {num_str}")

    if categorical_cols:
        cat_str = ", ".join(categorical_cols[:5])
        if len(categorical_cols) > 5:
            cat_str += f", +{len(categorical_cols) - 5} more"
        insights.append(f"{len(categorical_cols)} categorical column(s): {cat_str}")

    if datetime_cols:
        insights.append(f"{len(datetime_cols)} datetime column(s): {', '.join(datetime_cols)}")
    else:
        insights.append("No date/time columns detected")

    if duplicates > 0:
        pct = round((duplicates / rows) * 100, 1) if rows > 0 else 0
        insights.append(f"Found {duplicates:,} duplicate rows ({pct} % of dataset)")
    else:
        insights.append("No duplicate rows found")

    missing_cols_list = [
        (c, v["missing_before"])
        for c, v in handling_report.items()
        if v["missing_before"] > 0
    ]
    if missing_cols_list:
        worst = max(missing_cols_list, key=lambda x: x[1])
        insights.append(
            f"{len(missing_cols_list)} column(s) had missing values "
            f"(worst: '{worst[0]}' with {worst[1]:,} missing)"
        )
    else:
        insights.append("Dataset is clean — no missing values!")

    if outlier_report:
        outlier_cols = [c for c, v in outlier_report.items() if v["outliers_count"] > 0]
        if outlier_cols:
            worst_out = max(outlier_cols, key=lambda c: outlier_report[c]["outliers_count"])
            insights.append(
                f"IQR outliers in {len(outlier_cols)} column(s) — "
                f"worst: '{worst_out}' ({outlier_report[worst_out]['outliers_count']:,} pts)"
            )

    if anomalies:
        insights.append(
            f"Z-score anomalies (|Z|>3) in {len(anomalies)} column(s): "
            + ", ".join(list(anomalies.keys())[:4])
        )

    for col in numeric_cols:
        if col.endswith("_was_missing"):
            continue
        try:
            skew = float(df[col].skew())
            if abs(skew) > 1.5:
                direction = "right (+)" if skew > 0 else "left (−)"
                insights.append(f"'{col}' heavily skewed {direction}  skew={skew:.2f}")
        except Exception:
            pass

    for col in categorical_cols:
        if col.endswith("_was_missing"):
            continue
        n_unique = df[col].nunique()
        if n_unique > rows * 0.8 and rows > 0:
            insights.append(
                f"'{col}' has very high cardinality ({n_unique:,} unique) — likely an ID column"
            )

    for col in df.columns:
        if col.endswith("_was_missing"):
            continue
        if df[col].nunique() == 1:
            insights.append(f"'{col}' has only 1 unique value — adds no information")

    # FIX 6: Skip pairs where both cols end with _was_missing
    best_corr_val  = 0.0
    best_corr_pair = None
    seen_pairs: set = set()
    for c1 in numeric_cols:
        if c1.endswith("_was_missing"):
            continue
        for c2 in numeric_cols:
            if c2.endswith("_was_missing") or c1 == c2:
                continue
            key = tuple(sorted([c1, c2]))
            if key in seen_pairs:
                continue
            seen_pairs.add(key)
            val = abs(float(correlation.get(c1, {}).get(c2, 0) or 0))
            if val > best_corr_val:
                best_corr_val  = val
                best_corr_pair = (c1, c2, float(correlation.get(c1, {}).get(c2, 0) or 0))

    if best_corr_pair and best_corr_val >= 0.3:
        c1, c2, raw = best_corr_pair
        direction   = "positive" if raw > 0 else "negative"
        insights.append(f"Strongest correlation: '{c1}' ↔ '{c2}' = {raw:.2f} ({direction})")

    return insights


# =========================================================
# 24  MISSING ANALYSIS BUILDER  — feeds 3 frontend panels
# =========================================================
def _build_missing_analysis(before_snapshot, handling_report, df_clean):
    """
    Build the three data structures consumed by the frontend
    Missing Value Analysis panels (BEFORE / HANDLING / AFTER).
    """
    total_rows = (
        list(before_snapshot.values())[0]["total_rows"]
        if before_snapshot else 0
    )

    before_list           = []
    total_missing_cells   = 0
    total_missing_columns = 0

    for col, snap in before_snapshot.items():
        mc = snap.get("missing_count", 0)
        if mc == 0:
            continue
        total_missing_cells   += mc
        total_missing_columns += 1
        before_list.append({
            "col"                : col,
            "col_type"           : snap.get("col_type", "Unknown"),
            "missing_count"      : mc,
            "missing_pct"        : snap.get("missing_pct", 0),
            "missing_ratio"      : snap.get("missing_ratio", 0),
            "total_rows"         : total_rows,
            "sample_values"      : [
                k for k in snap.get("vc_before", {}).keys()
                if k not in ("nan", "NaN", "None", "")
            ][:5],
            "sample_missing_rows": snap.get("sample_missing_rows", []),
        })

    before_list.sort(key=lambda x: x["missing_count"], reverse=True)

    handling_numeric     = []
    handling_categorical = []

    for col, snap in before_snapshot.items():
        mc = snap.get("missing_count", 0)
        if mc == 0:
            continue
        col_type = snap.get("col_type", "Unknown")
        skewness = snap.get("skewness", None)
        entry = {
            "col"           : col,
            "col_type"      : col_type,
            "missing_count" : mc,
            "missing_pct"   : snap.get("missing_pct", 0),
            "missing_ratio" : snap.get("missing_ratio", 0),
            "threshold_pct" : 5.0,
            "strategy"      : snap.get("fill_strategy", "—"),
            "reason"        : snap.get("strategy_reason", "—"),
            "fill_value"    : snap.get("fill_value", None),
            "will_drop_rows": snap.get("will_drop_rows", False),
            "indicator_col" : snap.get("indicator_col", None),
            "skewness"      : skewness,
            "skew_direction": (
                "symmetric (|skew| < 0.5) → Mean"
                if skewness is not None and abs(skewness) < 0.5
                else "skewed (|skew| ≥ 0.5) → Median"
                if skewness is not None
                else None
            ),
        }
        if col_type == "Numeric":
            handling_numeric.append(entry)
        else:
            handling_categorical.append(entry)

    after_list = []
    for col, snap in before_snapshot.items():
        mc_before = snap.get("missing_count", 0)
        if mc_before == 0:
            continue
        report   = handling_report.get(col, {})
        mc_after = report.get("missing_after", 0)
        fixed    = mc_before > 0 and mc_after == 0

        after_list.append({
            "col"          : col,
            "col_type"     : snap.get("col_type", "Unknown"),
            "before_count" : mc_before,
            "before_pct"   : snap.get("missing_pct", 0),
            "vc_before"    : snap.get("vc_before", {}),
            "strategy"     : snap.get("fill_strategy", "—"),
            "reason"       : snap.get("strategy_reason", "—"),
            "fill_value"   : snap.get("fill_value", None),
            "indicator_col": snap.get("indicator_col", None),
            "after_count"  : mc_after,
            "after_pct"    : round((mc_after / total_rows * 100), 2) if total_rows > 0 else 0,
            "vc_after"     : report.get("vc_after", {}),
            "method"       : report.get("method", "—"),
            "is_fixed"     : fixed,
            "status"       : "✔ Fixed" if fixed else ("⚠ Remaining" if mc_after > 0 else "✔ Clean"),
        })

    after_list.sort(key=lambda x: x["before_count"], reverse=True)

    return {
        "before"  : before_list,
        "handling": {"numeric": handling_numeric, "categorical": handling_categorical},
        "after"   : after_list,
        "totals"  : {
            "missing_columns": total_missing_columns,
            "missing_cells"  : total_missing_cells,
            "total_rows"     : total_rows,
            "total_cols"     : len(before_snapshot),
        },
    }


# =========================================================
# 25  MAIN EDA FUNCTION — perform_eda()
# =========================================================
def perform_eda(df):
    """
    End-to-end EDA pipeline called by the FastAPI /upload endpoint.
    Returns a JSON-safe result dict consumed by the frontend.
    """
    if df is None or len(df) == 0:
        return {"error": "Empty DataFrame"}

    df            = df.copy()
    rows, columns = df.shape
    logger.info("EDA started — %d rows × %d columns", rows, columns)

    # Step 1 — Capture df.info() before cleaning
    buffer      = StringIO()
    df.info(buf=buffer)
    info_string = buffer.getvalue()

    # Step 2 — Unique counts before cleaning
    nunique_data = df.nunique().to_dict()

    # Step 3 — Standardise fake-missing values
    df = standardize_missing_values(df)

    # Step 4 — Drop 100%-empty columns
    df, dropped_empty_cols = drop_fully_empty_columns(df)

    # Step 5 — Detect and convert datetime columns
    df, detected_dates, date_format_map = try_parse_dates(df)

    # Step 6 — Fill missing date sequence gaps
    date_gap_report = {}
    for date_col in detected_dates:
        df, freq, gaps_filled = fill_missing_sequence(df, date_col, mode="sequence")
        date_gap_report[date_col] = {"frequency": freq, "gaps_filled": gaps_filled}

    # Step 7 — Handle all missing values
    df, handling_report, before_snapshot = handle_missing_values(
        df, already_standardized=True
    )

    # Step 8 — Classify column types after cleaning
    numeric_cols     = df.select_dtypes(include=np.number).columns.tolist()
    categorical_cols = df.select_dtypes(include="object").columns.tolist()
    datetime_cols    = df.select_dtypes(include="datetime").columns.tolist()

    numeric_cols_clean     = [c for c in numeric_cols     if not c.endswith("_was_missing")]
    categorical_cols_clean = [c for c in categorical_cols if not c.endswith("_was_missing")]

    # Step 9 — Extended statistical summary
    stats = statistical_summary(df, numeric_cols)

    # Step 10 — IQR outlier detection
    outlier_report = detect_outliers(df, numeric_cols_clean)

    # Step 11 — Top-50 value counts
    value_counts = {}
    for col in categorical_cols_clean:
        try:
            value_counts[col] = df[col].astype(str).value_counts().head(50).to_dict()
        except Exception:
            value_counts[col] = {}

    # Step 12 — Histogram data (20 bins)
    histograms = {}
    for col in numeric_cols_clean:
        values = df[col].dropna()
        if len(values) > 0:
            counts, bins = np.histogram(values, bins=20)
            histograms[col] = {"bins": bins[:-1].tolist(), "counts": counts.tolist()}

    # Step 13 — Pearson correlation matrix
    # FIX 2: NaN kept — clean_json() converts to null (undefined correlation)
    correlation = {}
    numeric_df  = df[numeric_cols_clean].select_dtypes(include=np.number)
    if len(numeric_df.columns) >= 2:
        correlation = numeric_df.corr().to_dict()

    # Step 14 — Count duplicates
    duplicates = int(df.duplicated().sum())

    # Step 15 — 10-row preview
    # FIX 8: Explicitly clean_json() the preview rows so NaN/NaT values
    # in any preview cell don't cause serialisation errors.
    preview = clean_json(df.head(10).to_dict(orient="records"))

    # Step 16 — Boxplot data
    boxplots = compute_boxplot_data(df, numeric_cols_clean)

    # Step 17 — Scatter pairs
    scatter_pairs = compute_scatter_pairs(df, numeric_cols_clean, correlation, top_n=4)

    # Step 18 — Quality score
    quality_score = calculate_data_quality_score(df, handling_report, duplicates)

    # Step 19 — Z-score anomaly detection
    anomalies = detect_anomalies(df, numeric_cols_clean)

    # Step 20 — Auto-insights
    insights = generate_insights(
        df, numeric_cols_clean, categorical_cols_clean, datetime_cols,
        handling_report, outlier_report, duplicates, date_format_map,
        anomalies=anomalies, quality_score=quality_score, correlation=correlation,
    )

    # Step 21 — Full dataset slices
    dataset_slices = build_dataset_slices(df, handling_report)

    # Step 22 — Rich missing analysis (3 panels)
    missing_analysis = _build_missing_analysis(before_snapshot, handling_report, df)

    # Step 22b — EDA Accuracy (5-dimension weighted score)
    eda_accuracy_report = {}
    if EDA_ACCURACY_AVAILABLE:
        try:
            eda_accuracy_report = compute_eda_accuracy(df, handling_report, duplicates)
        except Exception as exc:
            logger.warning("EDA Accuracy computation failed: %s", exc)
            eda_accuracy_report = {"eda_accuracy": None, "error": str(exc)}

    logger.info("EDA complete — quality score: %.1f", quality_score)

    result = {
        "overview": {
            "rows"               : rows,
            "columns"            : columns,
            "numeric_columns"    : numeric_cols_clean,
            "categorical_columns": categorical_cols_clean,
            "datetime_columns"   : datetime_cols,
            "date_formats"       : date_format_map,
        },
        "dataset_info"            : info_string,
        "nunique"                 : nunique_data,
        "missing_handling_process": handling_report,
        "missing_analysis"        : missing_analysis,
        "data_quality"            : {
            "duplicates"        : duplicates,
            "outliers"          : outlier_report,
            "quality_score"     : quality_score,
            "anomalies"         : anomalies,
            "dropped_empty_cols": dropped_empty_cols,
            "date_gap_report"   : date_gap_report,
        },
        "eda_accuracy"            : eda_accuracy_report,
        "statistics"              : stats,
        "value_counts"            : value_counts,
        "preview"                 : preview,
        "dataset_slices"          : dataset_slices,
        "visualization"           : {
            "histograms"   : histograms,
            "boxplots"     : boxplots,
            "scatter_pairs": scatter_pairs,
        },
        "advanced_visualization"  : {
            "correlation": correlation,
        },
        "insights"                : insights,
        "generated_at"            : datetime.now().isoformat(),
    }

    return clean_json(result)
