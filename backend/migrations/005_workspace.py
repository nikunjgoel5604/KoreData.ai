# 005_workspace.py — Workspace tables

import logging
from database.schema import table_exists

logger = logging.getLogger(__name__)

VERSION = 5
DESCRIPTION = "Create kore_workspace_state table to store dynamic active settings."
CHECKSUM = "a6c8b4f0b2f0a1c1d0e5b7b9f8d6e3c5"
DEPENDENCIES = [3]

def UP(cur) -> None:
    cur.execute("""
        CREATE TABLE IF NOT EXISTS kore_workspace_state (
            login_id                VARCHAR(20)   NOT NULL,
            active_project_id       VARCHAR(50)   NULL,
            active_dataset_id       INT           NULL,
            active_model_id         INT           NULL,
            current_module          VARCHAR(50)   NULL,
            current_page            VARCHAR(50)   NULL,
            current_chart           VARCHAR(50)   NULL,
            last_pipeline_step      VARCHAR(50)   NULL,
            eda_result              LONGTEXT      NULL,
            active_panels           TEXT          NULL,
            selected_panel          VARCHAR(50)   NULL,
            sim_running             TINYINT(1)    NOT NULL DEFAULT 0,
            current_stage_key       VARCHAR(50)   NULL,
            sim_progress            INT           NOT NULL DEFAULT 0,
            stage_statuses          TEXT          NULL,
            logs                    LONGTEXT      NULL,
            open_tabs_json          LONGTEXT      NULL,
            active_tab_id           VARCHAR(50)   NULL,
            workspace_settings_json LONGTEXT      NULL,
            workspace_history_json  LONGTEXT      NULL,
            updated_at              TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            PRIMARY KEY (login_id),
            FOREIGN KEY (login_id) REFERENCES kore_users(login_id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)

def VERIFY() -> bool:
    return table_exists("kore_workspace_state")

def DOWN(cur) -> None:
    cur.execute("DROP TABLE IF EXISTS kore_workspace_state")
