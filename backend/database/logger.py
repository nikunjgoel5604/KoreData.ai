# logger.py — Database logger

import logging
import traceback
import time
from typing import Optional, Any

logger = logging.getLogger("database.executor")

class DBMetrics:
    total_queries: int = 0
    failed_queries: int = 0
    slow_queries: int = 0
    reconnect_count: int = 0
    total_execution_time_ms: float = 0.0

def log_query(
    sql_type: str,
    table: str,
    duration_ms: float,
    rows: int,
    query: str,
    warnings: int = 0
) -> None:
    DBMetrics.total_queries += 1
    DBMetrics.total_execution_time_ms += duration_ms

    if duration_ms > 200.0:
        DBMetrics.slow_queries += 1
        logger.warning(
            f"[DB SLOW QUERY] Type: {sql_type} | Table: {table} | "
            f"Duration: {duration_ms:.2f}ms | Rows: {rows} | SQL: {query}"
        )
    else:
        logger.info(
            f"[DB QUERY] Type: {sql_type} | Table: {table} | "
            f"Duration: {duration_ms:.2f}ms | Rows: {rows}"
        )

def log_error(
    operation: str,
    table: str,
    query: str,
    error_code: int,
    message: str,
    exc: Exception
) -> None:
    DBMetrics.failed_queries += 1
    tb_str = "".join(traceback.format_tb(exc.__traceback__))
    logger.error(
        f"\n[DB ERROR]\n"
        f"Operation:  {operation}\n"
        f"Table:      {table}\n"
        f"Query:      {query}\n"
        f"Error Code: {error_code}\n"
        f"Message:    {message}\n"
        f"Traceback:\n{tb_str}"
    )

def increment_reconnect():
    DBMetrics.reconnect_count += 1
