# 004_notifications.py — Notifications table

import logging
from database.schema import table_exists

logger = logging.getLogger(__name__)

VERSION = 4
DESCRIPTION = "Create user_notifications table and configure search indexes."
CHECKSUM = "f8d6e3c1a6c8b4f0b2f0a1c1d0e5b7b9"
DEPENDENCIES = [3]

def UP(cur) -> None:
    cur.execute("""
        CREATE TABLE IF NOT EXISTS user_notifications (
            id             INT           NOT NULL AUTO_INCREMENT,
            login_id       VARCHAR(20)   NOT NULL,
            project_id     VARCHAR(50)   NULL,
            message        TEXT          NOT NULL,
            type           VARCHAR(20)   NOT NULL DEFAULT 'info',
            source_section VARCHAR(50)   NULL,
            is_read        TINYINT(1)    NOT NULL DEFAULT 0,
            created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            FOREIGN KEY (login_id) REFERENCES kore_users(login_id) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)

    # Indexes
    indexes = [
        "CREATE INDEX idx_notif_user   ON user_notifications(login_id)",
        "CREATE INDEX idx_notif_unread ON user_notifications(login_id, is_read)",
        "CREATE INDEX idx_notif_time   ON user_notifications(created_at)"
    ]
    for ddl in indexes:
        try:
            cur.execute(ddl)
        except Exception:
            pass

def VERIFY() -> bool:
    return table_exists("user_notifications")

def DOWN(cur) -> None:
    cur.execute("DROP TABLE IF EXISTS user_notifications")
