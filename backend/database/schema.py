# schema.py — Schema verification engine

import logging
from typing import List, Optional
from database.executor import db_fetchone, db_fetchall, db_execute
from mysql.connector import Error

logger = logging.getLogger(__name__)

def table_exists(table_name: str) -> bool:
    row = db_fetchone(
        "SELECT 1 FROM information_schema.TABLES "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s",
        (table_name,)
    )
    return row is not None

def column_exists(table_name: str, column_name: str) -> bool:
    row = db_fetchone(
        "SELECT 1 FROM information_schema.COLUMNS "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s AND COLUMN_NAME = %s",
        (table_name, column_name)
    )
    return row is not None

def index_exists(table_name: str, index_name: str) -> bool:
    row = db_fetchone(
        "SELECT 1 FROM information_schema.STATISTICS "
        "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s AND INDEX_NAME = %s",
        (table_name, index_name)
    )
    return row is not None

def foreign_key_exists(table_name: str, constraint_name: str) -> bool:
    row = db_fetchone(
        "SELECT 1 FROM information_schema.TABLE_CONSTRAINTS "
        "WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = %s "
        "AND CONSTRAINT_NAME = %s AND CONSTRAINT_TYPE = 'FOREIGN KEY'",
        (table_name, constraint_name)
    )
    return row is not None

def get_schema_version() -> int:
    """Query schema_versions table for the highest successfully applied version number."""
    if not table_exists("schema_versions"):
        return 0
    row = db_fetchone(
        "SELECT MAX(version) as max_v FROM schema_versions WHERE status = 'Applied'"
    )
    if row and row["max_v"] is not None:
        return int(row["max_v"])
    return 0

def get_applied_migrations() -> List[int]:
    """Retrieve list of successfully applied migration version integers."""
    if not table_exists("schema_versions"):
        return []
    rows = db_fetchall(
        "SELECT version FROM schema_versions WHERE status = 'Applied' ORDER BY version ASC"
    )
    return [int(r["version"]) for r in rows]

def record_migration(
    version: int,
    description: str,
    checksum: str,
    execution_time_ms: float,
    status: str = "Applied"
) -> None:
    """Record a migration run outcome in the version tracking table."""
    db_execute(
        "INSERT INTO schema_versions (version, description, checksum, applied_at, execution_time, status) "
        "VALUES (%s, %s, %s, CURRENT_TIMESTAMP, %s, %s) "
        "ON DUPLICATE KEY UPDATE "
        "description = VALUES(description), checksum = VALUES(checksum), "
        "applied_at = VALUES(applied_at), execution_time = VALUES(execution_time), status = VALUES(status)",
        (version, description, checksum, execution_time_ms, status)
    )
