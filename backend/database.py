# database.py — Kore_data-ex  v9.1
# =========================================================
# CHANGES vs v9.0
# ─────────────────────────────────────────────────────────
# FIX 1  "mysql.connector.errors.InternalError: Unread result
#         found" — db_fetchone() used an UNBUFFERED cursor.
#         If a query matched more than one row (e.g. an OR
#         condition across two unique columns matching two
#         different existing rows), fetchone() only consumed
#         the first row. Closing the cursor with a second row
#         still unread raises InternalError on the *next*
#         query that reuses the same pooled connection.
#
#         Fix: db_fetchone() and db_fetchall() now open the
#         cursor with buffered=True, so MySQL Connector reads
#         the entire result set into client memory immediately
#         on execute() — there is never anything left "unread"
#         when the cursor closes.
#
# Everything else is unchanged from v9.0.
# =========================================================

import os
import time
import logging

import mysql.connector
from mysql.connector import Error, pooling
from typing import Optional, List
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(
    level  = logging.INFO,
    format = "%(asctime)s - %(levelname)s - [%(name)s] %(message)s",
)
logger = logging.getLogger(__name__)


# ─── Config ───────────────────────────────────────────────────────────────────

def _get_host()     -> str:  return os.environ.get("MYSQLHOST")     or os.environ.get("DB_HOST")  or "localhost"
def _get_port()     -> int:
    try:    return int(str(os.environ.get("MYSQLPORT") or os.environ.get("DB_PORT") or "3306").strip())
    except: return 3306
def _get_database() -> str:  return os.environ.get("MYSQLDATABASE") or os.environ.get("DB_NAME")  or "kore_data"
def _get_user()     -> str:  return os.environ.get("MYSQLUSER")     or os.environ.get("DB_USER")  or "root"
def _get_password() -> str:  return os.environ.get("MYSQLPASSWORD") or os.environ.get("DB_PASS")  or ""

DB_CONFIG: dict = {
    "host":               _get_host(),
    "port":               _get_port(),
    "database":           _get_database(),
    "user":               _get_user(),
    "password":           _get_password(),
    "charset":            "utf8mb4",
    "autocommit":         True,
    "connection_timeout": 10,
}


# ─── Connection pool ─────────────────────────────────────────────────────────

def _create_pool(retries: int = 5, delay: float = 2.0):
    for attempt in range(1, retries + 1):
        try:
            pool = pooling.MySQLConnectionPool(pool_name="kore_pool", pool_size=5, **DB_CONFIG)
            logger.info("[DB] Pool ready (attempt %d/%d)", attempt, retries)
            return pool
        except Error as exc:
            logger.warning("[DB] Pool failed (attempt %d/%d): %s", attempt, retries, exc)
            if attempt < retries:
                time.sleep(delay * attempt)
    logger.error("[DB] All %d pool-creation attempts failed.", retries)
    return None

connection_pool = _create_pool()


def get_connection():
    try:
        if connection_pool:
            conn = connection_pool.get_connection()
            try:
                conn.ping(reconnect=True, attempts=3, delay=1)
            except Error:
                pass
            return conn
        logger.warning("[DB] Pool unavailable — direct connection.")
        return mysql.connector.connect(**DB_CONFIG)
    except Error as exc:
        raise RuntimeError(f"[DB] Cannot get connection: {exc}") from exc


# ─── Schema init ──────────────────────────────────────────────────────────────

def init_db() -> None:
    conn = get_connection()
    cur  = conn.cursor()
    try:

        # ── kore_users ────────────────────────────────────────────────────────
        cur.execute("""
            CREATE TABLE IF NOT EXISTS kore_users (
                id            INT           NOT NULL AUTO_INCREMENT,
                login_id      VARCHAR(20)   NOT NULL,
                first_name    VARCHAR(50)   NOT NULL,
                last_name     VARCHAR(50)   DEFAULT '',
                email         VARCHAR(100)  NOT NULL,
                phone         VARCHAR(20)   NOT NULL,
                is_verified   TINYINT(1)    NOT NULL DEFAULT 0,
                created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY uq_login_id (login_id),
                UNIQUE KEY uq_email    (email),
                UNIQUE KEY uq_phone    (phone)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)

        # ── otp_tokens ────────────────────────────────────────────────────────
        cur.execute("""
            CREATE TABLE IF NOT EXISTS otp_tokens (
                id         INT                   NOT NULL AUTO_INCREMENT,
                login_id   VARCHAR(20)           NOT NULL,
                otp_code   VARCHAR(6)            NOT NULL,
                method     ENUM('email','phone') NOT NULL,
                contact    VARCHAR(100)          NOT NULL,
                expires_at DATETIME              NOT NULL,
                is_used    TINYINT(1)            NOT NULL DEFAULT 0,
                created_at TIMESTAMP             NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                FOREIGN KEY (login_id) REFERENCES kore_users(login_id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)

        # ── sessions ──────────────────────────────────────────────────────────
        cur.execute("""
            CREATE TABLE IF NOT EXISTS sessions (
                id         INT         NOT NULL AUTO_INCREMENT,
                token      VARCHAR(64) NOT NULL UNIQUE,
                login_id   VARCHAR(20) NOT NULL,
                created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                expires_at DATETIME    NOT NULL,
                PRIMARY KEY (id),
                FOREIGN KEY (login_id) REFERENCES kore_users(login_id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)

        # ── uploaded_files ────────────────────────────────────────────────────
        cur.execute("""
            CREATE TABLE IF NOT EXISTS uploaded_files (
                id           INT          NOT NULL AUTO_INCREMENT,
                login_id     VARCHAR(20)  NOT NULL,
                file_name    VARCHAR(255) NOT NULL,
                file_type    VARCHAR(20)  NOT NULL,
                file_size_kb FLOAT        NOT NULL,
                row_count    INT          NULL,
                col_count    INT          NULL,
                uploaded_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                FOREIGN KEY (login_id) REFERENCES kore_users(login_id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)

        # ── user_notifications ────────────────────────────────────────────────
        cur.execute("""
            CREATE TABLE IF NOT EXISTS user_notifications (
                id             INT           NOT NULL AUTO_INCREMENT,
                login_id       VARCHAR(20)   NOT NULL,
                message        TEXT          NOT NULL,
                type           VARCHAR(20)   NOT NULL DEFAULT 'info',
                source_section VARCHAR(50)   NULL,
                is_read        TINYINT(1)    NOT NULL DEFAULT 0,
                created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                FOREIGN KEY (login_id) REFERENCES kore_users(login_id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)

        # ── password_reset_log ────────────────────────────────────────────────
        cur.execute("""
            CREATE TABLE IF NOT EXISTS password_reset_log (
                id         INT         NOT NULL AUTO_INCREMENT,
                login_id   VARCHAR(20) NOT NULL,
                action     ENUM('set_password','reset_password') NOT NULL,
                ip_address VARCHAR(45) NULL DEFAULT NULL,
                created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                FOREIGN KEY (login_id) REFERENCES kore_users(login_id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)

        # ── user_sessions (activity tracking) ────────────────────────────────
        cur.execute("""
            CREATE TABLE IF NOT EXISTS user_sessions (
                id              INT           NOT NULL AUTO_INCREMENT,
                login_id        VARCHAR(20)   NOT NULL,
                session_token   VARCHAR(64)   NOT NULL,
                login_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
                logout_at       DATETIME      NULL DEFAULT NULL,
                duration_sec    INT           NULL DEFAULT NULL,
                ip_address      VARCHAR(45)   NULL,
                user_agent      TEXT          NULL,
                is_active       TINYINT(1)    NOT NULL DEFAULT 1,
                created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY uq_us_token (session_token),
                FOREIGN KEY (login_id) REFERENCES kore_users(login_id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)

        # ── daily_activity ────────────────────────────────────────────────────
        cur.execute("""
            CREATE TABLE IF NOT EXISTS daily_activity (
                id                INT           NOT NULL AUTO_INCREMENT,
                login_id          VARCHAR(20)   NOT NULL,
                activity_date     DATE          NOT NULL,
                first_login_at    DATETIME      NOT NULL,
                last_seen_at      DATETIME      NOT NULL,
                total_active_sec  INT           NOT NULL DEFAULT 0,
                login_count       INT           NOT NULL DEFAULT 0,
                logout_count      INT           NOT NULL DEFAULT 0,
                updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                UNIQUE KEY uq_da_user_date (login_id, activity_date),
                FOREIGN KEY (login_id) REFERENCES kore_users(login_id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)

        # ── ml_training_history ─────────────────────────────────────────
        cur.execute("""
            CREATE TABLE IF NOT EXISTS ml_training_history (
                id              INT           NOT NULL AUTO_INCREMENT,
                login_id        VARCHAR(20)   NOT NULL,
                model_key       VARCHAR(60)   NOT NULL
                                COMMENT 'e.g. random_forest_clf, gradient_boosting_reg',
                model_name      VARCHAR(120)  NOT NULL,
                category        VARCHAR(40)   NOT NULL
                                COMMENT 'Machine Learning | Deep Learning',
                task_type       VARCHAR(20)   NOT NULL
                                COMMENT 'classification | regression | clustering',
                target_col      VARCHAR(100)  NULL,
                n_features      INT           NULL,
                n_rows_train    INT           NULL,
                n_rows_test     INT           NULL,
                test_size       FLOAT         NULL,
                eda_score       FLOAT         NULL
                                COMMENT 'EDA Accuracy score used at training time',
                primary_metric  FLOAT         NULL
                                COMMENT 'Accuracy for clf / R2 for reg / Silhouette for cluster',
                f1_score        FLOAT         NULL,
                precision_score FLOAT         NULL,
                recall_score    FLOAT         NULL,
                roc_auc         FLOAT         NULL,
                rmse            FLOAT         NULL,
                mae             FLOAT         NULL,
                r2_score        FLOAT         NULL,
                cv_score        FLOAT         NULL,
                cv_std          FLOAT         NULL,
                hyperparams     TEXT          NULL
                                COMMENT 'JSON string of hyperparameters used',
                model_file_path VARCHAR(500)  NULL
                                COMMENT 'Relative path to saved .joblib file',
                deploy_ready    TINYINT(1)    NOT NULL DEFAULT 0,
                grade           VARCHAR(20)   NULL
                                COMMENT 'Excellent | Good | Fair | Poor',
                trained_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                FOREIGN KEY (login_id) REFERENCES kore_users(login_id) ON DELETE CASCADE ON UPDATE CASCADE,
                INDEX idx_mth_user      (login_id),
                INDEX idx_mth_model     (model_key),
                INDEX idx_mth_task      (task_type),
                INDEX idx_mth_time      (trained_at),
                INDEX idx_mth_user_task (login_id, task_type)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
              COMMENT='One row per ML training run. Links user to model metrics and saved file.'
        """)

        # ── ml_saved_models ────────────────────────────────────────────
        cur.execute("""
            CREATE TABLE IF NOT EXISTS ml_saved_models (
                id              INT           NOT NULL AUTO_INCREMENT,
                login_id        VARCHAR(20)   NOT NULL,
                history_id      INT           NULL
                                COMMENT 'FK to ml_training_history.id — the training run that produced this model',
                model_key       VARCHAR(60)   NOT NULL,
                model_name      VARCHAR(120)  NOT NULL,
                task_type       VARCHAR(20)   NOT NULL,
                file_path       VARCHAR(500)  NOT NULL
                                COMMENT 'Absolute or relative path to .joblib file on disk',
                file_size_kb    FLOAT         NULL,
                feature_names   TEXT          NULL
                                COMMENT 'JSON array of feature column names',
                primary_metric  FLOAT         NULL,
                is_active       TINYINT(1)    NOT NULL DEFAULT 1
                                COMMENT '1 = current version, 0 = superseded by newer save',
                saved_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
                PRIMARY KEY (id),
                FOREIGN KEY (login_id)   REFERENCES kore_users(login_id)
                    ON DELETE CASCADE ON UPDATE CASCADE,
                FOREIGN KEY (history_id) REFERENCES ml_training_history(id)
                    ON DELETE SET NULL ON UPDATE CASCADE,
                INDEX idx_msm_user      (login_id),
                INDEX idx_msm_model_key (login_id, model_key),
                INDEX idx_msm_active    (login_id, is_active),
                INDEX idx_msm_time      (saved_at)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
              COMMENT='Persisted ML models per user. file_path points to .joblib on disk.'
        """)

        # ── kore_workspace_state ───────────────────────────────────────────
        cur.execute("""
            CREATE TABLE IF NOT EXISTS kore_workspace_state (
                login_id          VARCHAR(20)   NOT NULL,
                eda_result        LONGTEXT      NULL,
                active_panels     TEXT          NULL,
                selected_panel    VARCHAR(50)   NULL,
                sim_running       TINYINT(1)    NOT NULL DEFAULT 0,
                current_stage_key VARCHAR(50)   NULL,
                sim_progress      INT           NOT NULL DEFAULT 0,
                stage_statuses    TEXT          NULL,
                logs              LONGTEXT      NULL,
                updated_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                PRIMARY KEY (login_id),
                FOREIGN KEY (login_id) REFERENCES kore_users(login_id) ON DELETE CASCADE ON UPDATE CASCADE
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)

        # ── Indexes (safe — ignores if already exist) ─────────────────────────
        indexes = [
            "CREATE INDEX idx_otp_active   ON otp_tokens(login_id, is_used)",
            "CREATE INDEX idx_otp_expires  ON otp_tokens(expires_at)",
            "CREATE INDEX idx_sess_token   ON sessions(token)",
            "CREATE INDEX idx_sess_login   ON sessions(login_id)",
            "CREATE INDEX idx_files_login  ON uploaded_files(login_id)",
            "CREATE INDEX idx_files_time   ON uploaded_files(uploaded_at)",
            "CREATE INDEX idx_notif_user   ON user_notifications(login_id)",
            "CREATE INDEX idx_notif_unread ON user_notifications(login_id, is_read)",
            "CREATE INDEX idx_notif_time   ON user_notifications(created_at)",
            "CREATE INDEX idx_us_login_id  ON user_sessions(login_id)",
            "CREATE INDEX idx_us_login_at  ON user_sessions(login_at)",
            "CREATE INDEX idx_us_is_active ON user_sessions(is_active)",
            "CREATE INDEX idx_us_date      ON user_sessions(login_id, login_at)",
            "CREATE INDEX idx_da_login_id  ON daily_activity(login_id)",
            "CREATE INDEX idx_da_date      ON daily_activity(activity_date)",
        ]
        for ddl in indexes:
            try:
                cur.execute(ddl)
            except Error:
                pass  # already exists — safe

        # ── Safe column migrations ─────────────────────────────────────────────
        _safe_migrate(cur, [
            ("kore_users", "password_hash", "ALTER TABLE kore_users ADD COLUMN password_hash VARCHAR(255) NULL DEFAULT NULL AFTER is_verified"),
            ("otp_tokens", "purpose",       "ALTER TABLE otp_tokens ADD COLUMN purpose ENUM('login','register','set_password','reset_password','verify_contact') NOT NULL DEFAULT 'login' AFTER contact"),
            ("kore_users", "display_name",  "ALTER TABLE kore_users ADD COLUMN display_name VARCHAR(80) NULL"),
            ("kore_users", "bio",           "ALTER TABLE kore_users ADD COLUMN bio TEXT NULL"),
            ("kore_users", "dob",           "ALTER TABLE kore_users ADD COLUMN dob DATE NULL"),
            ("kore_users", "avatar_url",    "ALTER TABLE kore_users ADD COLUMN avatar_url VARCHAR(255) NULL"),
            ("kore_users", "resume_name",   "ALTER TABLE kore_users ADD COLUMN resume_name VARCHAR(255) NULL"),
            ("kore_users", "resume_url",    "ALTER TABLE kore_users ADD COLUMN resume_url VARCHAR(255) NULL"),
            ("kore_users", "job_title",     "ALTER TABLE kore_users ADD COLUMN job_title VARCHAR(100) NULL"),
            ("kore_users", "company",       "ALTER TABLE kore_users ADD COLUMN company VARCHAR(100) NULL"),
            ("kore_users", "industry",      "ALTER TABLE kore_users ADD COLUMN industry VARCHAR(80) NULL"),
            ("kore_users", "years_exp",     "ALTER TABLE kore_users ADD COLUMN years_exp VARCHAR(30) NULL"),
            ("kore_users", "linkedin",      "ALTER TABLE kore_users ADD COLUMN linkedin VARCHAR(255) NULL"),
            ("kore_users", "skills_json",   "ALTER TABLE kore_users ADD COLUMN skills_json TEXT NULL"),
            ("kore_users", "exp_json",      "ALTER TABLE kore_users ADD COLUMN exp_json TEXT NULL"),
            ("kore_users", "address_json",  "ALTER TABLE kore_users ADD COLUMN address_json TEXT NULL"),
            ("kore_users", "email_verified","ALTER TABLE kore_users ADD COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 0"),
            ("kore_users", "phone_verified","ALTER TABLE kore_users ADD COLUMN phone_verified TINYINT(1) NOT NULL DEFAULT 0"),
            ("kore_users", "last_login",    "ALTER TABLE kore_users ADD COLUMN last_login DATETIME NULL"),
        ])

        logger.info("[DB] All tables ready (v9.1 — buffered-cursor fix included).")

    finally:
        try: cur.close()
        except: pass
        try: conn.close()
        except: pass


def _safe_migrate(cur, migrations: list) -> None:
    """Run ALTER TABLE only if column does not yet exist."""
    for table, column, ddl in migrations:
        try:
            cur.execute(
                "SELECT 1 FROM information_schema.COLUMNS "
                "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s AND COLUMN_NAME = %s",
                (table, column)
            )
            # This helper cursor is unbuffered by default (plain conn.cursor()),
            # so fully drain it with fetchall() before the next execute().
            row = cur.fetchall()
            if not row:
                cur.execute(ddl)
                logger.info("[DB] Migration: added %s.%s", table, column)
        except Error as exc:
            logger.debug("[DB] Migration skipped %s.%s: %s", table, column, exc)


# ─── Query helpers ────────────────────────────────────────────────────────────

def db_fetchone(query: str, params: tuple = ()) -> Optional[dict]:
    """
    FIX: buffered=True — without this, a query that matches more than
    one row leaves unread rows behind after fetchone(). Closing that
    cursor then raises mysql.connector.errors.InternalError:
    'Unread result found' on this or the next connection reuse.
    """
    conn = get_connection()
    cur  = conn.cursor(dictionary=True, buffered=True)
    try:
        cur.execute(query, params)
        return cur.fetchone()
    finally:
        try: cur.close()
        except: pass
        try: conn.close()
        except: pass


def db_fetchall(query: str, params: tuple = ()) -> List[dict]:
    conn = get_connection()
    cur  = conn.cursor(dictionary=True, buffered=True)
    try:
        cur.execute(query, params)
        return cur.fetchall()
    finally:
        try: cur.close()
        except: pass
        try: conn.close()
        except: pass


def db_execute(query: str, params: tuple = ()) -> int:
    conn = get_connection()
    cur  = conn.cursor(buffered=True)
    try:
        cur.execute(query, params)
        return cur.lastrowid
    finally:
        try: cur.close()
        except: pass
        try: conn.close()
        except: pass
