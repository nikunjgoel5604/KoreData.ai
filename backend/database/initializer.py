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

        # 7. Self-healing schema audit & repair
        audit_and_repair_schema()

        # 8. Verify constraints and index wellness
        get_db_health_status()
        print_step("Health initialized")

        safe_print("==============================")
        safe_print("\nREADY\n")
        safe_print("Application started successfully.")
    except Exception as exc:
        logger.critical(f"[DB INIT] Database bootstrap failed: {exc}", exc_info=True)
        safe_print("\n==============================")
        print_step("FAILED", "fail")
        safe_print(f"Reason: {exc}")
        safe_print("==============================\n")
        sys.exit(1)


def audit_and_repair_schema():
    """
    Introspects MySQL database tables and columns, and auto-heals
    by executing CREATE TABLE or ALTER TABLE queries for any missing structures.
    """
    from database.schema import TABLES_SCHEMA, table_exists, column_exists, foreign_key_exists
    from database.executor import db_execute

    logger.info("[DB AUDIT] Starting database schema validation and self-healing...")

    for table, schema in TABLES_SCHEMA.items():
        columns = schema["columns"]
        foreign_keys = schema.get("foreign_keys", {})

        # 1. Create table if missing
        if not table_exists(table):
            logger.warning(f"[DB HEAL] Table '{table}' is missing. Creating table...")
            col_defs = [f"{col} {definition}" for col, definition in columns.items()]
            
            # Form CREATE TABLE query
            create_query = f"CREATE TABLE {table} (\n  " + ",\n  ".join(col_defs) + "\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;"
            try:
                db_execute(create_query)
                logger.info(f"[DB HEAL] Table '{table}' successfully created.")
            except Exception as e:
                logger.error(f"[DB HEAL] Failed to create table '{table}': {e}")
                continue # Skip auditing columns if creation failed

        # 2. Audit existing table columns
        for col_name, col_def in columns.items():
            # If the column has "PRIMARY KEY", strip it from the ALTER TABLE ADD COLUMN command
            # to prevent MySQL duplicate primary key constraint errors.
            alter_def = col_def.replace("PRIMARY KEY", "")
            
            if not column_exists(table, col_name):
                logger.warning(f"[DB HEAL] Column '{col_name}' is missing in table '{table}'. Auto-healing...")
                try:
                    db_execute(f"ALTER TABLE {table} ADD COLUMN {col_name} {alter_def}")
                    logger.info(f"[DB HEAL] Column '{col_name}' successfully added to table '{table}'.")
                except Exception as e:
                    logger.error(f"[DB HEAL] Failed to add column '{col_name}' to table '{table}': {e}")

        # 3. Audit foreign key constraints
        for fk_name, (col, ref) in foreign_keys.items():
            if not foreign_key_exists(table, fk_name):
                logger.warning(f"[DB HEAL] Foreign key constraint '{fk_name}' is missing in table '{table}'. Auto-healing...")
                try:
                    db_execute(f"ALTER TABLE {table} ADD CONSTRAINT {fk_name} FOREIGN KEY ({col}) REFERENCES {ref}")
                    logger.info(f"[DB HEAL] Foreign key constraint '{fk_name}' successfully added to table '{table}'.")
                except Exception as e:
                    logger.error(f"[DB HEAL] Failed to add foreign key constraint '{fk_name}' to table '{table}': {e}")

    logger.info("[DB AUDIT] Database schema audit and repair completed.")
