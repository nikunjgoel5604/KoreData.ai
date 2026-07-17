# pool.py — Connection Pool Manager

import time
import logging
import mysql.connector
from mysql.connector import Error, pooling
from database.config import get_connection_config
from database.logger import increment_reconnect

logger = logging.getLogger(__name__)

class ConnectionPoolManager:
    _pool: pooling.MySQLConnectionPool = None

    @classmethod
    def create_pool(cls, retries: int = 5, delay: float = 2.0) -> bool:
        """Create MySQL Connection Pool with retries."""
        config = get_connection_config(include_db=True)
        for attempt in range(1, retries + 1):
            try:
                cls._pool = pooling.MySQLConnectionPool(
                    pool_name="kore_pool",
                    pool_size=10,
                    **config
                )
                logger.info(f"[DB] Connection pool created (attempt {attempt}/{retries}).")
                return True
            except Error as exc:
                logger.warning(f"[DB] Pool creation failed (attempt {attempt}/{retries}): {exc}")
                if attempt < retries:
                    time.sleep(delay * attempt)
        logger.critical("[DB] All pool creation attempts failed.")
        return False

    @classmethod
    def get_connection(cls):
        """Get verified, alive connection from the pool. Recreates pool if lost."""
        config = get_connection_config(include_db=True)
        try:
            if not cls._pool:
                logger.warning("[DB] Pool is missing. Recreating pool...")
                cls.create_pool()

            if cls._pool:
                try:
                    conn = cls._pool.get_connection()
                    conn.ping(reconnect=True, attempts=3, delay=1)
                    return conn
                except Error as exc:
                    logger.warning(f"[DB] Connection validation failed: {exc}. Retrying with pool recreation...")
                    increment_reconnect()
                    cls.recreate_pool()
                    conn = cls._pool.get_connection()
                    conn.ping(reconnect=True, attempts=3, delay=1)
                    return conn
            
            logger.warning("[DB] Pool unavailable. Using direct fallback connection.")
            return mysql.connector.connect(**config)
        except Error as exc:
            logger.error(f"[DB] Get connection failed: {exc}")
            raise RuntimeError(f"Cannot connect to Database: {exc}") from exc

    @classmethod
    def recreate_pool(cls):
        """Force recreate the connection pool."""
        logger.info("[DB] Recreating connection pool...")
        cls._pool = None
        cls.create_pool(retries=3, delay=1.0)

    @classmethod
    def get_pool_metrics(cls) -> dict:
        """Expose connection pool status metrics."""
        if cls._pool:
            return {
                "name": cls._pool.pool_name,
                "pool_size": cls._pool.pool_size,
                "status": "active"
            }
        return {
            "status": "inactive"
        }
