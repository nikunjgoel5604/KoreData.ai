# 010_ai.py — AI and pipeline tables

import logging
from database.schema import table_exists

logger = logging.getLogger(__name__)

VERSION = 10
DESCRIPTION = "Create ai_chat_history, project_pipeline, and simulation_sessions tables."
CHECKSUM = "d0e5b7b9f8d6e3c1a6c8b4f0b2f0a1d4"
DEPENDENCIES = [3]

def UP(cur) -> None:
    # 1. ai_chat_history
    cur.execute("""
        CREATE TABLE IF NOT EXISTS ai_chat_history (
            id         INT         NOT NULL AUTO_INCREMENT,
            project_id VARCHAR(50) NOT NULL,
            login_id   VARCHAR(20) NOT NULL,
            prompt     TEXT        NOT NULL,
            response   TEXT        NOT NULL,
            model      VARCHAR(50) NULL,
            tokens     INT         NULL,
            created_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (login_id)   REFERENCES kore_users(login_id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)

    # 2. project_pipeline
    cur.execute("""
        CREATE TABLE IF NOT EXISTS project_pipeline (
            id         INT         NOT NULL AUTO_INCREMENT,
            project_id VARCHAR(50) NOT NULL,
            step_name  VARCHAR(50) NOT NULL,
            status     ENUM('Not Started', 'In Progress', 'Completed') NOT NULL DEFAULT 'Not Started',
            updated_at TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE,
            UNIQUE KEY uq_proj_step (project_id, step_name)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)

    # 3. simulation_sessions
    cur.execute("""
        CREATE TABLE IF NOT EXISTS simulation_sessions (
            simulation_id VARCHAR(50)   NOT NULL,
            login_id      VARCHAR(20)   NOT NULL,
            dataset_id    INT           NULL,
            status        VARCHAR(20)   NOT NULL DEFAULT 'idle',
            progress      INT           NOT NULL DEFAULT 0,
            stage         VARCHAR(50)   NULL,
            logs_path     VARCHAR(500)  NULL,
            created_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
            updated_at    DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            completed_at  DATETIME      NULL,
            PRIMARY KEY (simulation_id),
            FOREIGN KEY (login_id) REFERENCES kore_users(login_id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)

def VERIFY() -> bool:
    return (
        table_exists("ai_chat_history")
        and table_exists("project_pipeline")
        and table_exists("simulation_sessions")
    )

def DOWN(cur) -> None:
    cur.execute("DROP TABLE IF EXISTS simulation_sessions")
    cur.execute("DROP TABLE IF EXISTS project_pipeline")
    cur.execute("DROP TABLE IF EXISTS ai_chat_history")
