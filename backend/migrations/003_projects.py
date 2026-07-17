# 003_projects.py — Project tables

import logging
from database.schema import table_exists

logger = logging.getLogger(__name__)

VERSION = 3
DESCRIPTION = "Create projects, project_members, and project_settings tables."
CHECKSUM = "d0e5b7b9f8d6e3c1a6c8b4f0b2f0a1c1"
DEPENDENCIES = [1]

def UP(cur) -> None:
    # 1. projects
    cur.execute("""
        CREATE TABLE IF NOT EXISTS projects (
            id                     VARCHAR(50)  NOT NULL,
            login_id               VARCHAR(20)  NOT NULL,
            name                   VARCHAR(100) NOT NULL,
            description            TEXT         NULL,
            industry               VARCHAR(50)  NOT NULL DEFAULT 'General',
            project_type           VARCHAR(50)  NOT NULL DEFAULT 'Standard',
            visibility             VARCHAR(20)  NOT NULL DEFAULT 'private',
            color_theme            VARCHAR(20)  NOT NULL DEFAULT 'blue',
            icon                   VARCHAR(20)  NOT NULL DEFAULT 'folder',
            storage_used           VARCHAR(50)  NOT NULL DEFAULT '0 KB',
            status                 VARCHAR(20)  NOT NULL DEFAULT 'Active',
            is_favorite            TINYINT(1)   NOT NULL DEFAULT 0,
            is_archived            TINYINT(1)   NOT NULL DEFAULT 0,
            is_deleted             TINYINT(1)   NOT NULL DEFAULT 0,
            current_pipeline_stage VARCHAR(50)  NOT NULL DEFAULT 'Import Dataset',
            active_dataset         VARCHAR(100) NULL,
            active_model           VARCHAR(100) NULL,
            created_at             TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at             TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            last_opened_at         TIMESTAMP    NULL DEFAULT NULL,
            PRIMARY KEY (id),
            FOREIGN KEY (login_id) REFERENCES kore_users(login_id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)

    # 2. project_members
    cur.execute("""
        CREATE TABLE IF NOT EXISTS project_members (
            id         INT         NOT NULL AUTO_INCREMENT,
            project_id VARCHAR(50) NOT NULL,
            login_id   VARCHAR(20) NOT NULL,
            role       ENUM('Owner', 'Admin', 'Editor', 'Viewer', 'Guest') NOT NULL DEFAULT 'Viewer',
            created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (login_id)   REFERENCES kore_users(login_id) ON DELETE CASCADE ON UPDATE CASCADE,
            UNIQUE KEY uq_proj_member (project_id, login_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)

    # 3. project_settings
    cur.execute("""
        CREATE TABLE IF NOT EXISTS project_settings (
            project_id            VARCHAR(50) NOT NULL PRIMARY KEY,
            default_theme         VARCHAR(20) NOT NULL DEFAULT 'dark',
            default_ai_model      VARCHAR(50) NOT NULL DEFAULT 'gemini-1.5-pro',
            default_language      VARCHAR(10) NOT NULL DEFAULT 'en',
            notification_settings TEXT        NULL,
            auto_save             TINYINT(1)  NOT NULL DEFAULT 1,
            timezone              VARCHAR(50) NOT NULL DEFAULT 'UTC',
            chart_preferences     TEXT        NULL,
            report_preferences    TEXT        NULL,
            created_at            TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)

def VERIFY() -> bool:
    return (
        table_exists("projects")
        and table_exists("project_members")
        and table_exists("project_settings")
    )

def DOWN(cur) -> None:
    cur.execute("DROP TABLE IF EXISTS project_settings")
    cur.execute("DROP TABLE IF EXISTS project_members")
    cur.execute("DROP TABLE IF EXISTS projects")
