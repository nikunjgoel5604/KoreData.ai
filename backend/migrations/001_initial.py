# 001_initial.py — Initial migration

import logging
from database.schema import table_exists, column_exists

logger = logging.getLogger(__name__)

VERSION = 1
DESCRIPTION = "Setup core authentication, users, OTP, sessions, and password reset logging."
CHECKSUM = "a6c8b4f0b2f0a1c1d0e5b7b9f8d6e3c1"
DEPENDENCIES = []

def UP(cur) -> None:
    # 1. kore_users
    cur.execute("""
        CREATE TABLE IF NOT EXISTS kore_users (
            id            INT           NOT NULL AUTO_INCREMENT,
            login_id      VARCHAR(20)   NOT NULL,
            first_name    VARCHAR(50)   NOT NULL,
            last_name     VARCHAR(50)   DEFAULT '',
            email         VARCHAR(100)  NOT NULL,
            phone         VARCHAR(20)   NOT NULL,
            password_hash VARCHAR(255)  NULL DEFAULT NULL,
            is_verified   TINYINT(1)    NOT NULL DEFAULT 0,
            created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            UNIQUE KEY uq_login_id (login_id),
            UNIQUE KEY uq_email    (email),
            UNIQUE KEY uq_phone    (phone)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)

    # 2. otp_tokens
    cur.execute("""
        CREATE TABLE IF NOT EXISTS otp_tokens (
            id         INT                   NOT NULL AUTO_INCREMENT,
            login_id   VARCHAR(20)           NOT NULL,
            otp_code   VARCHAR(6)            NOT NULL,
            method     ENUM('email','phone') NOT NULL,
            contact    VARCHAR(100)          NOT NULL,
            purpose    ENUM('login','register','set_password','reset_password','verify_contact') NOT NULL DEFAULT 'login',
            expires_at DATETIME              NOT NULL,
            is_used    TINYINT(1)            NOT NULL DEFAULT 0,
            created_at TIMESTAMP             NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            FOREIGN KEY (login_id) REFERENCES kore_users(login_id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)

    # 3. sessions
    cur.execute("""
        CREATE TABLE IF NOT EXISTS sessions (
            id         INT         NOT NULL AUTO_INCREMENT,
            token      VARCHAR(64) NOT NULL UNIQUE,
            login_id   VARCHAR(20) NOT NULL,
            created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
            expires_at DATETIME    NOT NULL,
            PRIMARY KEY (id),
            FOREIGN KEY (login_id) REFERENCES kore_users(login_id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)

    # 4. password_reset_log
    cur.execute("""
        CREATE TABLE IF NOT EXISTS password_reset_log (
            id         INT         NOT NULL AUTO_INCREMENT,
            login_id   VARCHAR(20) NOT NULL,
            action     ENUM('set_password','reset_password') NOT NULL,
            ip_address VARCHAR(45) NULL DEFAULT NULL,
            created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            FOREIGN KEY (login_id) REFERENCES kore_users(login_id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)

    # Indexes
    indexes = [
        "CREATE INDEX idx_otp_active   ON otp_tokens(login_id, is_used)",
        "CREATE INDEX idx_otp_expires  ON otp_tokens(expires_at)",
        "CREATE INDEX idx_sess_token   ON sessions(token)",
        "CREATE INDEX idx_sess_login   ON sessions(login_id)"
    ]
    for ddl in indexes:
        try:
            cur.execute(ddl)
        except Exception:
            pass  # Already exists or handled safely

def VERIFY() -> bool:
    return (
        table_exists("kore_users")
        and table_exists("otp_tokens")
        and table_exists("sessions")
        and table_exists("password_reset_log")
        and column_exists("kore_users", "password_hash")
    )

def DOWN(cur) -> None:
    cur.execute("DROP TABLE IF EXISTS password_reset_log")
    cur.execute("DROP TABLE IF EXISTS sessions")
    cur.execute("DROP TABLE IF EXISTS otp_tokens")
    cur.execute("DROP TABLE IF EXISTS kore_users")
