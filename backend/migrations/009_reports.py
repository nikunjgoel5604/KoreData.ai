# 009_reports.py — Reports, exports, statistics and predictions

import logging
from database.schema import table_exists

logger = logging.getLogger(__name__)

VERSION = 9
DESCRIPTION = "Create project_reports, project_exports, project_statistics, and predictions tables."
CHECKSUM = "b2f0a1c1d0e5b7b9f8d6e3c1a6c8b4f4"
DEPENDENCIES = [3, 6]

def UP(cur) -> None:
    # 1. predictions
    cur.execute("""
        CREATE TABLE IF NOT EXISTS predictions (
            id             INT         NOT NULL AUTO_INCREMENT,
            project_id     VARCHAR(50) NOT NULL,
            model_id       INT         NOT NULL,
            input_dataset  VARCHAR(255) NULL,
            output_dataset VARCHAR(255) NULL,
            confidence     FLOAT       NULL,
            generated_at   TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (model_id)   REFERENCES ml_saved_models(id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)

    # 2. project_reports
    cur.execute("""
        CREATE TABLE IF NOT EXISTS project_reports (
            id           INT          NOT NULL AUTO_INCREMENT,
            project_id   VARCHAR(50)  NOT NULL,
            report_name  VARCHAR(100) NOT NULL,
            report_type  VARCHAR(50)  NOT NULL,
            pdf_path     VARCHAR(500) NOT NULL,
            generated_by VARCHAR(20)  NOT NULL,
            generated_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            FOREIGN KEY (project_id)   REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (generated_by) REFERENCES kore_users(login_id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)

    # 3. project_exports
    cur.execute("""
        CREATE TABLE IF NOT EXISTS project_exports (
            id             INT          NOT NULL AUTO_INCREMENT,
            project_id     VARCHAR(50)  NOT NULL,
            export_type    VARCHAR(50)  NOT NULL,
            zip_path       VARCHAR(500) NULL,
            csv_path       VARCHAR(500) NULL,
            sql_path       VARCHAR(500) NULL,
            python_path    VARCHAR(500) NULL,
            notebook_path  VARCHAR(500) NULL,
            download_count INT          NOT NULL DEFAULT 0,
            created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)

    # 4. project_statistics
    cur.execute("""
        CREATE TABLE IF NOT EXISTS project_statistics (
            project_id          VARCHAR(50) NOT NULL PRIMARY KEY,
            dataset_count       INT         NOT NULL DEFAULT 0,
            model_count         INT         NOT NULL DEFAULT 0,
            chart_count         INT         NOT NULL DEFAULT 0,
            report_count        INT         NOT NULL DEFAULT 0,
            export_count        INT         NOT NULL DEFAULT 0,
            storage_used        VARCHAR(50) NOT NULL DEFAULT '0 KB',
            pipeline_completion INT         NOT NULL DEFAULT 0,
            quality_score       FLOAT       NULL,
            updated_at          TIMESTAMP   NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)

def VERIFY() -> bool:
    return (
        table_exists("predictions")
        and table_exists("project_reports")
        and table_exists("project_exports")
        and table_exists("project_statistics")
    )

def DOWN(cur) -> None:
    cur.execute("DROP TABLE IF EXISTS project_statistics")
    cur.execute("DROP TABLE IF EXISTS project_exports")
    cur.execute("DROP TABLE IF EXISTS project_reports")
    cur.execute("DROP TABLE IF EXISTS predictions")
