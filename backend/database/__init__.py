# __init__.py — Database package entry point

from database.initializer import initialize_database
from database.executor import db_execute, db_fetchone, db_fetchall
from database.pool import ConnectionPoolManager
from database.health import get_db_health_status

get_connection = ConnectionPoolManager.get_connection

__all__ = [
    "initialize_database",
    "db_execute",
    "db_fetchone",
    "db_fetchall",
    "get_connection",
    "get_db_health_status",
]
