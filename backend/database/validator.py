# validator.py — Database Environment Validator

import os
import sys
import logging
from database.config import get_db_host, get_db_port, get_db_name, get_db_user, get_db_pass
from database.utils import print_step, safe_print

logger = logging.getLogger(__name__)

def validate_environment() -> bool:
    """
    Validate that all required database environment variables are loaded correctly.
    Exits application startup if any critical variable is missing.
    """
    host = get_db_host()
    port = get_db_port()
    name = get_db_name()
    user = get_db_user()
    password = get_db_pass()

    safe_print("\n===========================")
    safe_print("  DATABASE CONFIGURATION   ")
    safe_print("===========================")

    issues = []

    # Verify DB_HOST
    if host and len(host.strip()) > 0:
        print_step(f"DB_HOST: {host}", "ok")
    else:
        print_step("DB_HOST: MISSING", "fail")
        issues.append("DB_HOST is required but missing or empty.")

    # Verify DB_PORT
    if port > 0:
        print_step(f"DB_PORT: {port}", "ok")
    else:
        print_step("DB_PORT: INVALID", "fail")
        issues.append("DB_PORT must be a positive integer.")

    # Verify DB_NAME
    if name and len(name.strip()) > 0:
        print_step(f"DB_NAME: {name}", "ok")
    else:
        print_step("DB_NAME: MISSING", "fail")
        issues.append("DB_NAME is required but missing or empty.")

    # Verify DB_USER
    if user and len(user.strip()) > 0:
        print_step(f"DB_USER: {user}", "ok")
    else:
        print_step("DB_USER: MISSING", "fail")
        issues.append("DB_USER is required but missing or empty.")

    # Verify DB_PASS (can be empty, warning instead of failure)
    if password:
        print_step("DB_PASS: (hidden)", "ok")
    else:
        print_step("DB_PASS: EMPTY (warning)", "warn")

    safe_print("===========================\n")

    if issues:
        logger.critical("[DB] Environment validation failed. Pending issues:")
        for issue in issues:
            logger.critical(f"  - {issue}")
        sys.exit("[DB] Critical Database Configuration Missing. Shutting down server.")

    return True
