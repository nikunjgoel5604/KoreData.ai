# 008_visualizations.py — Visualizations table

import logging
from database.schema import table_exists

logger = logging.getLogger(__name__)

VERSION = 8
DESCRIPTION = "Create visualizations table to track canvas configurations."
CHECKSUM = "a6c8b4f0b2f0a1c1d0e5b7b9f8d6e3c9"
DEPENDENCIES = [3, 6]

def UP(cur) -> None:
    cur.execute("""
        CREATE TABLE IF NOT EXISTS visualizations (
            id                INT          NOT NULL AUTO_INCREMENT,
            project_id        VARCHAR(50)  NOT NULL,
            dataset_id        INT          NULL,
            chart_type        VARCHAR(50)  NOT NULL,
            chart_name        VARCHAR(100) NOT NULL,
            chart_config_json LONGTEXT     NOT NULL,
            created_by        VARCHAR(20)  NOT NULL,
            created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (dataset_id) REFERENCES uploaded_files(id) ON DELETE SET NULL ON UPDATE CASCADE,
            FOREIGN KEY (created_by) REFERENCES kore_users(login_id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)

def VERIFY() -> bool:
    return table_exists("visualizations")

def DOWN(cur) -> None:
    cur.execute("DROP TABLE IF EXISTS visualizations")
