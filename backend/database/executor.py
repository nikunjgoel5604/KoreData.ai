# executor.py — Parameterized query executor

import time
import logging
from typing import Optional, List, Any
import mysql.connector
from mysql.connector import Error
from database.pool import ConnectionPoolManager
from database.logger import log_query, log_error

logger = logging.getLogger(__name__)

def _get_sql_type_and_table(query: str) -> tuple:
    """Parse query to identify operation type and main table name (best-effort)."""
    clean_q = query.strip().upper()
    sql_type = "OTHER"
    table = "UNKNOWN"

    tokens = clean_q.split()
    if not tokens:
        return sql_type, table

    sql_type = tokens[0]
    
    # Try to find table name
    if sql_type in ("SELECT", "DELETE"):
        for i, tok in enumerate(tokens):
            if tok == "FROM" and i + 1 < len(tokens):
                table = tokens[i + 1].strip("`()")
                break
    elif sql_type == "INSERT":
        for i, tok in enumerate(tokens):
            if tok == "INTO" and i + 1 < len(tokens):
                table = tokens[i + 1].split('(')[0].strip("`()")
                break
    elif sql_type == "UPDATE":
        if len(tokens) > 1:
            table = tokens[1].strip("`()")
    elif sql_type == "CREATE":
        for i, tok in enumerate(tokens):
            if tok == "TABLE" and i + 1 < len(tokens):
                table = tokens[i + 1].split('(')[0].strip("`()")
                break
    elif sql_type == "ALTER":
        for i, tok in enumerate(tokens):
            if tok == "TABLE" and i + 1 < len(tokens):
                table = tokens[i + 1].strip("`()")
                break

    return sql_type, table

def db_execute(query: str, params: tuple = (), retries: int = 3) -> int:
    """Execute write query, returns lastrowid."""
    sql_type, table = _get_sql_type_and_table(query)
    
    for attempt in range(1, retries + 1):
        conn = None
        cur = None
        start = time.time()
        try:
            conn = ConnectionPoolManager.get_connection()
            cur = conn.cursor(buffered=True)
            cur.execute(query, params)
            last_id = cur.lastrowid
            
            duration_ms = (time.time() - start) * 1000
            log_query(sql_type, table, duration_ms, cur.rowcount, query)
            return last_id
        except Error as exc:
            duration_ms = (time.time() - start) * 1000
            log_error(sql_type, table, query, exc.errno, exc.msg, exc)
            
            # Retry transient connection errors
            if exc.errno in (1053, 2003, 2006, 2013) and attempt < retries:
                logger.warning(f"[DB] Transient query error. Retrying ({attempt}/{retries})...")
                time.sleep(0.5 * attempt)
                continue
            raise exc
        finally:
            if cur:
                try: cur.close()
                except Exception: pass
            if conn:
                try: conn.close()
                except Exception: pass

def db_fetchone(query: str, params: tuple = (), retries: int = 3) -> Optional[dict]:
    """Execute select query, returns first row dict."""
    sql_type, table = _get_sql_type_and_table(query)

    for attempt in range(1, retries + 1):
        conn = None
        cur = None
        start = time.time()
        try:
            conn = ConnectionPoolManager.get_connection()
            cur = conn.cursor(dictionary=True, buffered=True)
            cur.execute(query, params)
            row = cur.fetchone()
            
            duration_ms = (time.time() - start) * 1000
            log_query(sql_type, table, duration_ms, 1 if row else 0, query)
            return row
        except Error as exc:
            duration_ms = (time.time() - start) * 1000
            log_error(sql_type, table, query, exc.errno, exc.msg, exc)

            if exc.errno in (1053, 2003, 2006, 2013) and attempt < retries:
                logger.warning(f"[DB] Transient query error. Retrying ({attempt}/{retries})...")
                time.sleep(0.5 * attempt)
                continue
            raise exc
        finally:
            if cur:
                try: cur.close()
                except Exception: pass
            if conn:
                try: conn.close()
                except Exception: pass

def db_fetchall(query: str, params: tuple = (), retries: int = 3) -> List[dict]:
    """Execute select query, returns list of dict rows."""
    sql_type, table = _get_sql_type_and_table(query)

    for attempt in range(1, retries + 1):
        conn = None
        cur = None
        start = time.time()
        try:
            conn = ConnectionPoolManager.get_connection()
            cur = conn.cursor(dictionary=True, buffered=True)
            cur.execute(query, params)
            rows = cur.fetchall()
            
            duration_ms = (time.time() - start) * 1000
            log_query(sql_type, table, duration_ms, len(rows), query)
            return rows
        except Error as exc:
            duration_ms = (time.time() - start) * 1000
            log_error(sql_type, table, query, exc.errno, exc.msg, exc)

            if exc.errno in (1053, 2003, 2006, 2013) and attempt < retries:
                logger.warning(f"[DB] Transient query error. Retrying ({attempt}/{retries})...")
                time.sleep(0.5 * attempt)
                continue
            raise exc
        finally:
            if cur:
                try: cur.close()
                except Exception: pass
            if conn:
                try: conn.close()
                except Exception: pass
