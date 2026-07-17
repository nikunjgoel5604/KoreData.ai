# health.py — Health monitoring and metrics

import os
import shutil
import time
import logging
from typing import Dict, Any
from database.pool import ConnectionPoolManager
from database.schema import get_schema_version, table_exists
from database.executor import db_fetchone
from database.logger import DBMetrics

logger = logging.getLogger(__name__)

START_TIME = time.time()

def get_mysql_version() -> str:
    """Retrieve MySQL server version string."""
    try:
        row = db_fetchone("SELECT VERSION() as ver")
        return row["ver"] if row else "Unknown"
    except Exception:
        return "Unavailable"

def get_database_size_mb() -> float:
    """Query size of current database in Megabytes."""
    try:
        row = db_fetchone("""
            SELECT SUM(data_length + index_length) / 1024 / 1024 AS db_size
            FROM information_schema.TABLES
            WHERE table_schema = DATABASE()
        """)
        if row and row["db_size"] is not None:
            return round(float(row["db_size"]), 2)
    except Exception:
        pass
    return 0.0

def get_storage_stats() -> dict:
    """Introspect disk storage usage and capacities for files and reports."""
    stats = {}
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    storage_dir = os.path.join(base_dir, "storage")
    
    # Ensure directories exist
    os.makedirs(storage_dir, exist_ok=True)
    
    # General disk stats
    try:
        total, used, free = shutil.disk_usage(storage_dir)
        stats["disk_free_gb"] = round(free / (1024 ** 3), 2)
        stats["disk_used_gb"] = round(used / (1024 ** 3), 2)
        stats["disk_total_gb"] = round(total / (1024 ** 3), 2)
    except Exception:
        stats["disk_free_gb"] = 0.0

    stats["storage_path"] = storage_dir
    return stats

def get_db_health_status() -> dict:
    """Compile comprehensive health and performance metrics."""
    pool_metrics = ConnectionPoolManager.get_pool_metrics()
    
    # Active/Idle metrics can be approximated or retrieved if supported.
    # We will populate standard metadata.
    schema_v = get_schema_version()
    
    metrics = {
        "status": "healthy" if pool_metrics.get("status") == "active" else "degraded",
        "mysql_version": get_mysql_version(),
        "schema_version": schema_v,
        "database_size_mb": get_database_size_mb(),
        "pool": {
            "status": pool_metrics.get("status", "inactive"),
            "size": pool_metrics.get("pool_size", 0),
            "total_queries": DBMetrics.total_queries,
            "failed_queries": DBMetrics.failed_queries,
            "slow_queries": DBMetrics.slow_queries,
            "reconnect_count": DBMetrics.reconnect_count,
            "avg_query_time_ms": (
                round(DBMetrics.total_execution_time_ms / DBMetrics.total_queries, 2)
                if DBMetrics.total_queries > 0 else 0.0
            )
        },
        "storage": get_storage_stats(),
        "uptime_sec": int(time.time() - START_TIME)
    }
    return metrics
