# 006_ml.py — Machine Learning tables

import logging
from database.schema import table_exists

logger = logging.getLogger(__name__)

VERSION = 6
DESCRIPTION = "Create ml_training_history and ml_saved_models tables."
CHECKSUM = "d0e5b7b9f8d6e3c1a6c8b4f0b2f0a1c9"
DEPENDENCIES = [3]

def UP(cur) -> None:
    # 1. uploaded_files (which is a dependency of ml_saved_models)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS uploaded_files (
            id                 INT          NOT NULL AUTO_INCREMENT,
            login_id           VARCHAR(20)  NOT NULL,
            project_id         VARCHAR(50)  NULL,
            file_name          VARCHAR(255) NOT NULL,
            file_type          VARCHAR(20)  NOT NULL,
            file_size_kb       FLOAT        NOT NULL,
            row_count          INT          NULL,
            col_count          INT          NULL,
            eda_json_path      VARCHAR(500) NULL,
            report_json_path   VARCHAR(500) NULL,
            data_quality_score FLOAT        NULL,
            status             VARCHAR(20)  NOT NULL DEFAULT 'Active',
            storage_path       VARCHAR(500) NULL,
            cache_version      INT          NOT NULL DEFAULT 1,
            uploaded_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            FOREIGN KEY (login_id) REFERENCES kore_users(login_id) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)

    # 2. ml_training_history
    cur.execute("""
        CREATE TABLE IF NOT EXISTS ml_training_history (
            id              INT           NOT NULL AUTO_INCREMENT,
            login_id        VARCHAR(20)   NOT NULL,
            project_id      VARCHAR(50)   NULL,
            model_key       VARCHAR(60)   NOT NULL,
            model_name      VARCHAR(120)  NOT NULL,
            category        VARCHAR(40)   NOT NULL,
            task_type       VARCHAR(20)   NOT NULL,
            target_col      VARCHAR(100)  NULL,
            n_features      INT           NULL,
            n_rows_train    INT           NULL,
            n_rows_test     INT           NULL,
            test_size       FLOAT         NULL,
            eda_score       FLOAT         NULL,
            primary_metric  FLOAT         NULL,
            f1_score        FLOAT         NULL,
            precision_score FLOAT         NULL,
            recall_score    FLOAT         NULL,
            roc_auc         FLOAT         NULL,
            rmse            FLOAT         NULL,
            mae             FLOAT         NULL,
            r2_score        FLOAT         NULL,
            cv_score        FLOAT         NULL,
            cv_std          FLOAT         NULL,
            hyperparams     TEXT          NULL,
            model_file_path VARCHAR(500)  NULL,
            deploy_ready    TINYINT(1)    NOT NULL DEFAULT 0,
            grade           VARCHAR(20)   NULL,
            trained_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            FOREIGN KEY (login_id) REFERENCES kore_users(login_id) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)

    # 3. ml_saved_models
    cur.execute("""
        CREATE TABLE IF NOT EXISTS ml_saved_models (
            id              INT           NOT NULL AUTO_INCREMENT,
            login_id        VARCHAR(20)   NOT NULL,
            project_id      VARCHAR(50)   NULL,
            dataset_id      INT           NULL,
            history_id      INT           NULL,
            model_key       VARCHAR(60)   NOT NULL,
            model_name      VARCHAR(120)  NOT NULL,
            task_type       VARCHAR(20)   NOT NULL,
            file_path       VARCHAR(500)  NOT NULL,
            file_size_kb    FLOAT         NULL,
            feature_names   TEXT          NULL,
            primary_metric  FLOAT         NULL,
            is_active       TINYINT(1)    NOT NULL DEFAULT 1,
            saved_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            FOREIGN KEY (login_id)   REFERENCES kore_users(login_id) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (dataset_id) REFERENCES uploaded_files(id) ON DELETE SET NULL ON UPDATE CASCADE,
            FOREIGN KEY (history_id) REFERENCES ml_training_history(id) ON DELETE SET NULL ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)

    # dataset_versions
    cur.execute("""
        CREATE TABLE IF NOT EXISTS dataset_versions (
            id            INT          NOT NULL AUTO_INCREMENT,
            dataset_id    INT          NOT NULL,
            version_num   INT          NOT NULL DEFAULT 1,
            file_path     VARCHAR(500) NOT NULL,
            created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            FOREIGN KEY (dataset_id) REFERENCES uploaded_files(id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)

    # Indexes
    indexes = [
        "CREATE INDEX idx_files_login  ON uploaded_files(login_id)",
        "CREATE INDEX idx_files_time   ON uploaded_files(uploaded_at)",
        "CREATE INDEX idx_mth_user      (login_id)",
        "CREATE INDEX idx_mth_model     (model_key)",
        "CREATE INDEX idx_mth_task      (task_type)",
        "CREATE INDEX idx_mth_time      (trained_at)",
        "CREATE INDEX idx_msm_user      (login_id)",
        "CREATE INDEX idx_msm_model_key (login_id, model_key)"
    ]
    for ddl in indexes:
        try:
            cur.execute(ddl)
        except Exception:
            pass

def VERIFY() -> bool:
    return (
        table_exists("uploaded_files")
        and table_exists("ml_training_history")
        and table_exists("ml_saved_models")
        and table_exists("dataset_versions")
    )

def DOWN(cur) -> None:
    cur.execute("DROP TABLE IF EXISTS dataset_versions")
    cur.execute("DROP TABLE IF EXISTS ml_saved_models")
    cur.execute("DROP TABLE IF EXISTS ml_training_history")
    cur.execute("DROP TABLE IF EXISTS uploaded_files")
