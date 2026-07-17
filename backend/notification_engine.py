# notification_engine.py — Kore_data-ex  v6.0
# =========================================================
# Backend notification engine.
#
# Responsibilities:
#   · Create notifications for users (file upload, EDA complete, etc.)
#   · Fetch notifications per user (with unread count)
#   · Mark individual or all notifications as read / unread
#   · Auto-expire notifications older than 30 days
#
# This module is imported by main.py and exposes:
#   create_notification(login_id, message, notif_type, source_section)
#   get_notifications(login_id) → list[dict]
#   mark_read(notif_id, login_id)
#   mark_unread(notif_id, login_id)
#   mark_all_read(login_id)
#   get_unread_count(login_id) → int
#
# DB TABLE: user_notifications
#   id, login_id, message, type, source_section, is_read, created_at
# =========================================================

from datetime import datetime, timedelta
from database import db_execute, db_fetchone, db_fetchall


# ─── Table bootstrap (called from database.init_db) ──────────────────────────

CREATE_TABLE_SQL = """
    CREATE TABLE IF NOT EXISTS user_notifications (
        id             INT           NOT NULL AUTO_INCREMENT,
        login_id       VARCHAR(20)   NOT NULL,
        message        TEXT          NOT NULL,
        type           VARCHAR(20)   NOT NULL DEFAULT 'info',
        source_section VARCHAR(50)   NULL,
        is_read        TINYINT(1)    NOT NULL DEFAULT 0,
        created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        FOREIGN KEY (login_id) REFERENCES kore_users(login_id)
            ON DELETE CASCADE ON UPDATE CASCADE,
        INDEX idx_notif_user   (login_id),
        INDEX idx_notif_unread (login_id, is_read),
        INDEX idx_notif_time   (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
"""


# ─── Notification types ───────────────────────────────────────────────────────
# Use these constants everywhere — avoids magic strings.

TYPE_INFO    = 'info'
TYPE_SUCCESS = 'success'
TYPE_WARNING = 'warning'
TYPE_ERROR   = 'error'


# ─── Core operations ─────────────────────────────────────────────────────────

def create_notification(
    login_id:       str,
    message:        str,
    notif_type:     str  = TYPE_INFO,
    source_section: str  = None,
    project_id:     str  = None,
) -> int:
    notif_id = db_execute(
        "INSERT INTO user_notifications "
        "(login_id, message, type, source_section, project_id) "
        "VALUES (%s, %s, %s, %s, %s)",
        (login_id, message, notif_type, source_section, project_id),
    )
    _auto_expire(login_id)
    return notif_id


def get_notifications(login_id: str, limit: int = 50, project_id: str = None) -> list[dict]:
    if project_id:
        rows = db_fetchall(
            "SELECT id, message, type, source_section, is_read, created_at, project_id "
            "FROM user_notifications "
            "WHERE login_id = %s AND project_id = %s "
            "ORDER BY created_at DESC "
            "LIMIT %s",
            (login_id, project_id, limit),
        )
    else:
        rows = db_fetchall(
            "SELECT id, message, type, source_section, is_read, created_at, project_id "
            "FROM user_notifications "
            "WHERE login_id = %s AND project_id IS NULL "
            "ORDER BY created_at DESC "
            "LIMIT %s",
            (login_id, limit),
        )
    for row in rows:
        row["created_at"] = str(row["created_at"])
        row["is_read"]    = bool(row["is_read"])
    return rows


def get_unread_count(login_id: str, project_id: str = None) -> int:
    if project_id:
        row = db_fetchone(
            "SELECT COUNT(*) AS cnt FROM user_notifications "
            "WHERE login_id = %s AND project_id = %s AND is_read = 0",
            (login_id, project_id),
        )
    else:
        row = db_fetchone(
            "SELECT COUNT(*) AS cnt FROM user_notifications "
            "WHERE login_id = %s AND project_id IS NULL AND is_read = 0",
            (login_id,),
        )
    return row["cnt"] if row else 0


def mark_read(notif_id: int, login_id: str) -> bool:
    row = db_fetchone(
        "SELECT id FROM user_notifications WHERE id = %s AND login_id = %s",
        (notif_id, login_id),
    )
    if not row:
        return False
    db_execute(
        "UPDATE user_notifications SET is_read = 1 WHERE id = %s",
        (notif_id,),
    )
    return True


def mark_unread(notif_id: int, login_id: str) -> bool:
    row = db_fetchone(
        "SELECT id FROM user_notifications WHERE id = %s AND login_id = %s",
        (notif_id, login_id),
    )
    if not row:
        return False
    db_execute(
        "UPDATE user_notifications SET is_read = 0 WHERE id = %s",
        (notif_id,),
    )
    return True


def mark_all_read(login_id: str, project_id: str = None) -> int:
    if project_id:
        db_execute(
            "UPDATE user_notifications SET is_read = 1 "
            "WHERE login_id = %s AND project_id = %s AND is_read = 0",
            (login_id, project_id),
        )
    else:
        db_execute(
            "UPDATE user_notifications SET is_read = 1 "
            "WHERE login_id = %s AND project_id IS NULL AND is_read = 0",
            (login_id,),
        )
    return 0





# ─── Internal helpers ─────────────────────────────────────────────────────────

def _auto_expire(login_id: str, days: int = 30) -> None:
    """
    Delete notifications older than `days` days for this user.
    Called automatically after each create_notification().
    Keeps the table lean — no background cron required.
    """
    cutoff = datetime.now() - timedelta(days=days)
    db_execute(
        "DELETE FROM user_notifications "
        "WHERE login_id = %s AND created_at < %s",
        (login_id, cutoff),
    )
