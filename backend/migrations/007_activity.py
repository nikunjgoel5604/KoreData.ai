# 007_activity.py — Activity and audit tables

import logging
from database.schema import table_exists

logger = logging.getLogger(__name__)

VERSION = 7
DESCRIPTION = "Create user_sessions and daily_activity tables for active state audit trails."
CHECKSUM = "f8d6e3c1a6c8b4f0b2f0a1c1d0e5b7b0"
DEPENDENCIES = [1]

def UP(cur) -> None:
    # 1. user_sessions
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

    # 2. daily_activity
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

    # Indexes
    indexes = [
        "CREATE INDEX idx_us_login_id  ON user_sessions(login_id)",
        "CREATE INDEX idx_us_login_at  ON user_sessions(login_at)",
        "CREATE INDEX idx_us_is_active ON user_sessions(is_active)",
        "CREATE INDEX idx_da_login_id  ON daily_activity(login_id)",
        "CREATE INDEX idx_da_date      ON daily_activity(activity_date)"
    ]
    for ddl in indexes:
        try:
            cur.execute(ddl)
        except Exception:
            pass

def VERIFY() -> bool:
    return table_exists("user_sessions") and table_exists("daily_activity")

def DOWN(cur) -> None:
    cur.execute("DROP TABLE IF EXISTS daily_activity")
    cur.execute("DROP TABLE IF EXISTS user_sessions")
