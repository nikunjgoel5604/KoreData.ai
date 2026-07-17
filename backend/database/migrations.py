# migrations.py — Migration framework runner

import time
import logging
from typing import List, Dict, Any
from database.transaction import Transaction
from database.schema import table_exists, record_migration, get_applied_migrations
from database.executor import db_execute
from database.utils import print_step, safe_print
from mysql.connector import Error

logger = logging.getLogger(__name__)

def ensure_version_table_exists() -> None:
    """Create schema_versions table if not already present."""
    if not table_exists("schema_versions"):
        logger.info("[DB] Creating 'schema_versions' tracking table...")
        db_execute("""
            CREATE TABLE IF NOT EXISTS schema_versions (
                version        INT          NOT NULL PRIMARY KEY,
                description    VARCHAR(255) NOT NULL,
                checksum       VARCHAR(64)  NOT NULL,
                applied_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                execution_time FLOAT        NOT NULL COMMENT 'in milliseconds',
                status         VARCHAR(20)  NOT NULL DEFAULT 'Applied'
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
        """)

def run_migrations() -> None:
    """
    Load all migrations from registry and run pending migrations sequentially inside transactions.
    """
    ensure_version_table_exists()

    # Import the registry dynamically to avoid circular references
    from migrations.migration_registry import MIGRATION_REGISTRY

    applied_set = set(get_applied_migrations())
    latest_version = max(MIGRATION_REGISTRY.keys()) if MIGRATION_REGISTRY else 0
    current_version = max(applied_set) if applied_set else 0

    pending_versions = sorted([v for v in MIGRATION_REGISTRY.keys() if v not in applied_set])

    safe_print("\n===============================")
    safe_print("      DATABASE MIGRATIONS      ")
    safe_print("===============================")
    safe_print(f"Current Version: {current_version}")
    safe_print(f"Latest Version:  {latest_version}")
    safe_print(f"Pending:         {len(pending_versions)} migrations")
    safe_print("===============================\n")

    for version in pending_versions:
        migration = MIGRATION_REGISTRY[version]
        desc = getattr(migration, "DESCRIPTION", "No description provided.")
        dependencies = getattr(migration, "DEPENDENCIES", [])

        # Check dependencies
        for dep in dependencies:
            if dep not in applied_set:
                logger.critical(
                    f"[DB] Migration {version} failed: Dependency migration {dep} has not been applied."
                )
                raise RuntimeError(f"Unmet migration dependency: {dep} is required by {version}")

        logger.info(f"[DB] Applying migration {version:03d} ({desc})...")
        start_time = time.time()

        try:
            with Transaction() as cur:
                # Execute UP
                migration.UP(cur)
                # Verify schema
                if not migration.VERIFY():
                    raise RuntimeError("Verification checks failed after UP execution.")
            
            # Succeeded
            duration_ms = (time.time() - start_time) * 1000
            checksum = getattr(migration, "CHECKSUM", "N/A")
            record_migration(version, desc, checksum, duration_ms, status="Applied")
            applied_set.add(version)
            print_step(f"Migration {version:03d} applied successfully in {duration_ms:.2f}ms.", "ok")

        except Exception as exc:
            duration_ms = (time.time() - start_time) * 1000
            checksum = getattr(migration, "CHECKSUM", "N/A")
            try:
                record_migration(version, desc, checksum, duration_ms, status="Failed")
            except Exception:
                pass
            logger.critical(f"[FAIL] Migration {version:03d} failed: {exc}")
            raise exc

    safe_print("===============================")
    safe_print("  MIGRATIONS SYNCED SUCCESSFULLY ")
    safe_print("===============================\n")
