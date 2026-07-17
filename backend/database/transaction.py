# transaction.py — Database transaction manager

import logging
from mysql.connector import Error
from database.pool import ConnectionPoolManager

logger = logging.getLogger(__name__)

class Transaction:
    def __init__(self):
        self.conn = None
        self.cur = None

    def __enter__(self):
        try:
            self.conn = ConnectionPoolManager.get_connection()
            self.conn.autocommit = False
            self.cur = self.conn.cursor(buffered=True)
            self.cur.execute("START TRANSACTION")
            return self.cur
        except Error as exc:
            logger.error(f"[DB] Transaction initialization failed: {exc}")
            self._cleanup()
            raise exc

    def __exit__(self, exc_type, exc_val, exc_tb):
        if exc_type is not None:
            # Exception occurred, rollback
            try:
                if self.conn:
                    logger.warning("[DB] Rolling back transaction due to exception.")
                    self.conn.rollback()
            except Error as rollback_exc:
                logger.error(f"[DB] Rollback failed: {rollback_exc}")
        else:
            # Succeeded, commit
            try:
                if self.conn:
                    self.conn.commit()
            except Error as commit_exc:
                logger.critical(f"[DB] Commit failed: {commit_exc}")
                raise commit_exc
        
        self._cleanup()
        return False  # Do not suppress exceptions

    def _cleanup(self):
        if self.cur:
            try:
                self.cur.close()
            except Exception:
                pass
        if self.conn:
            try:
                self.conn.autocommit = True
                self.conn.close()
            except Exception:
                pass
