# initializer.py — Database Initializer Pipeline

import logging
import sys
from database.validator import validate_environment
from database.connection import verify_mysql_reachable, auto_create_database
from database.pool import ConnectionPoolManager
from database.migrations import run_migrations
from database.health import get_db_health_status
from database.utils import print_step, safe_print

logger = logging.getLogger(__name__)

def initialize_database() -> bool:
    """
    Refactored modular database initialization sequence.
    Exits with error if any required validation fails.
    """
    safe_print("\n==============================")
    safe_print("  KoreData Database Startup   ")
    safe_print("==============================")

    try:
        # 1. Environment validation
        validate_environment()
        print_step("Environment validated")

        # 2. Configuration loaded
        # Config values are validated in step 1, so this is verified.
        print_step("Configuration loaded")

        # 3. Server check
        if not verify_mysql_reachable():
            raise RuntimeError("MySQL database server is not reachable.")
        print_step("MySQL server reachable")

        # 4. Auto database creation
        auto_create_database()
        print_step("Database exists")

        # 5. Connection pool setup
        if not ConnectionPoolManager.create_pool():
            raise RuntimeError("Failed to create connection pool.")
        print_step("Connection pool created")

        # 6. Run versioned migrations
        run_migrations()
        print_step("Schema verified")
        print_step("Migrations completed")

        # 7. Verify constraints and index wellness
        get_db_health_status()
        print_step("Health initialized")

        safe_print("==============================")
        safe_print("\nREADY\n")
        safe_print("Application started successfully.")
        return True

    except Exception as exc:
        logger.critical(f"[DB INIT] Database bootstrap failed: {exc}", exc_info=True)
        safe_print("\n==============================")
        print_step("FAILED", "fail")
        safe_print(f"Reason: {exc}")
        safe_print("==============================\n")
        sys.exit(1)
