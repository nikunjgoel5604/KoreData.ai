# connection.py — Database creation and validation connections

import logging
import mysql.connector
from mysql.connector import Error
from database.config import get_connection_config, get_db_name

logger = logging.getLogger(__name__)

def verify_mysql_reachable() -> bool:
    """Check if MySQL server is reachable without binding a database name."""
    config = get_connection_config(include_db=False)
    conn = None
    try:
        conn = mysql.connector.connect(**config)
        return True
    except Error as exc:
        logger.error(f"[DB] MySQL server unreachable: {exc}")
        return False
    finally:
        if conn:
            conn.close()

def auto_create_database() -> None:
    """Connect to MySQL without a database name and create the target database if not exists."""
    config = get_connection_config(include_db=False)
    db_name = get_db_name()
    conn = None
    cur = None
    try:
        conn = mysql.connector.connect(**config)
        cur = conn.cursor()
        cur.execute(f"SHOW DATABASES LIKE '{db_name}'")
        row = cur.fetchone()
        if not row:
            logger.info(f"[DB] Database '{db_name}' does not exist. Creating...")
            cur.execute(
                f"CREATE DATABASE `{db_name}` "
                f"CHARACTER SET utf8mb4 "
                f"COLLATE utf8mb4_unicode_ci"
            )
            logger.info(f"[DB] Database '{db_name}' created successfully.")
        else:
            logger.info(f"[DB] Database '{db_name}' already exists.")
    except Error as exc:
        logger.critical(f"[DB] Failed to create database: {exc}")
        raise RuntimeError(f"Database creation failed: {exc}") from exc
    finally:
        if cur:
            cur.close()
        if conn:
            conn.close()
