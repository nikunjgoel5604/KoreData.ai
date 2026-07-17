# config.py — Database configuration and validation

import os
from dotenv import load_dotenv

# Load environment variables from absolute path
base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
dotenv_path = os.path.join(base_dir, ".env")
load_dotenv(dotenv_path=dotenv_path, override=True)

def get_db_host() -> str:
    return (
        os.environ.get("DB_HOST")
        or os.environ.get("MYSQLHOST")
        or "localhost"
    )

def get_db_port() -> int:
    val = os.environ.get("DB_PORT") or os.environ.get("MYSQLPORT") or "3306"
    try:
        return int(str(val).strip())
    except Exception:
        return 3306

def get_db_name() -> str:
    return (
        os.environ.get("DB_NAME")
        or os.environ.get("MYSQLDATABASE")
        or "kore_data"
    )

def get_db_user() -> str:
    return (
        os.environ.get("DB_USER")
        or os.environ.get("MYSQLUSER")
        or "root"
    )

def get_db_pass() -> str:
    return (
        os.environ.get("DB_PASS")
        or os.environ.get("MYSQLPASSWORD")
        or ""
    )

def get_connection_config(include_db: bool = True) -> dict:
    config = {
        "host": get_db_host(),
        "port": get_db_port(),
        "user": get_db_user(),
        "password": get_db_pass(),
        "charset": "utf8mb4",
        "autocommit": True,
        "connection_timeout": 10,
    }
    if include_db:
        config["database"] = get_db_name()
    return config
