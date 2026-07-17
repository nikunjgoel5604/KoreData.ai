# 002_auth.py — Additional user profile fields

import logging
from database.schema import column_exists

logger = logging.getLogger(__name__)

VERSION = 2
DESCRIPTION = "Add detailed profile fields to the users table."
CHECKSUM = "b2f0a1c1d0e5b7b9f8d6e3c1a6c8b4f0"
DEPENDENCIES = [1]

def UP(cur) -> None:
    cols = [
        ("display_name",  "VARCHAR(80) NULL"),
        ("bio",           "TEXT NULL"),
        ("dob",           "DATE NULL"),
        ("avatar_url",    "VARCHAR(255) NULL"),
        ("resume_name",   "VARCHAR(255) NULL"),
        ("resume_url",    "VARCHAR(255) NULL"),
        ("job_title",     "VARCHAR(100) NULL"),
        ("company",       "VARCHAR(100) NULL"),
        ("industry",      "VARCHAR(80) NULL"),
        ("years_exp",     "VARCHAR(30) NULL"),
        ("linkedin",      "VARCHAR(255) NULL"),
        ("skills_json",   "TEXT NULL"),
        ("exp_json",      "TEXT NULL"),
        ("address_json",  "TEXT NULL"),
        ("email_verified","TINYINT(1) NOT NULL DEFAULT 0"),
        ("phone_verified","TINYINT(1) NOT NULL DEFAULT 0"),
        ("last_login",    "DATETIME NULL")
    ]
    for col_name, ddl in cols:
        if not column_exists("kore_users", col_name):
            cur.execute(f"ALTER TABLE kore_users ADD COLUMN `{col_name}` {ddl}")

def VERIFY() -> bool:
    return (
        column_exists("kore_users", "display_name")
        and column_exists("kore_users", "bio")
        and column_exists("kore_users", "email_verified")
    )

def DOWN(cur) -> None:
    cols = [
        "display_name", "bio", "dob", "avatar_url", "resume_name", "resume_url",
        "job_title", "company", "industry", "years_exp", "linkedin", "skills_json",
        "exp_json", "address_json", "email_verified", "phone_verified", "last_login"
    ]
    for col in cols:
        if column_exists("kore_users", col):
            cur.execute(f"ALTER TABLE kore_users DROP COLUMN `{col}`")
