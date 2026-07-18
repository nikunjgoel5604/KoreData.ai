# 011_schema_repairs.py — Repair missing columns, tables, constraints, and indexes

import logging

logger = logging.getLogger(__name__)

VERSION = 11
DESCRIPTION = "Repair missing columns, tables, constraints, and indexes for project isolation."
CHECKSUM = "f8d6e3c1a6c8b4f0b2f0a1c1d0e5b7c1"
DEPENDENCIES = [10]

def UP(cur) -> None:
    # Helper to check column existence within transaction
    def column_exists(table: str, col: str) -> bool:
        cur.execute(
            "SELECT 1 FROM information_schema.COLUMNS "
            "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s AND COLUMN_NAME = %s",
            (table, col)
        )
        return cur.fetchone() is not None

    # Helper to check foreign key existence within transaction
    def foreign_key_exists(table: str, fk: str) -> bool:
        cur.execute(
            "SELECT 1 FROM information_schema.TABLE_CONSTRAINTS "
            "WHERE CONSTRAINT_SCHEMA = DATABASE() AND TABLE_NAME = %s "
            "AND CONSTRAINT_NAME = %s AND CONSTRAINT_TYPE = 'FOREIGN KEY'",
            (table, fk)
        )
        return cur.fetchone() is not None

    # Helper to check index existence within transaction
    def index_exists(table: str, idx: str) -> bool:
        cur.execute(
            "SELECT 1 FROM information_schema.STATISTICS "
            "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s AND INDEX_NAME = %s",
            (table, idx)
        )
        return cur.fetchone() is not None

    # Helper to check table existence within transaction
    def table_exists(table: str) -> bool:
        cur.execute(
            "SELECT 1 FROM information_schema.TABLES "
            "WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = %s",
            (table,)
        )
        return cur.fetchone() is not None

    # 1. Ensure new tables exist
    # 1a. dataset_profiles
    cur.execute("""
        CREATE TABLE IF NOT EXISTS dataset_profiles (
            id         INT AUTO_INCREMENT PRIMARY KEY,
            project_id VARCHAR(50) NOT NULL,
            dataset_id INT NOT NULL,
            profile_json LONGTEXT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (dataset_id) REFERENCES uploaded_files(id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)

    # 1b. feature_engineering
    cur.execute("""
        CREATE TABLE IF NOT EXISTS feature_engineering (
            id         INT AUTO_INCREMENT PRIMARY KEY,
            project_id VARCHAR(50) NOT NULL,
            dataset_id INT NOT NULL,
            recipe_json LONGTEXT NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (dataset_id) REFERENCES uploaded_files(id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)

    # 1c. project_activity_log
    cur.execute("""
        CREATE TABLE IF NOT EXISTS project_activity_log (
            id             INT AUTO_INCREMENT PRIMARY KEY,
            project_id     VARCHAR(50) NOT NULL,
            login_id       VARCHAR(20) NOT NULL,
            action         VARCHAR(255) NOT NULL,
            entity         VARCHAR(50) NULL,
            entity_id      VARCHAR(50) NULL,
            previous_value TEXT NULL,
            new_value      TEXT NULL,
            created_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE,
            FOREIGN KEY (login_id) REFERENCES kore_users(login_id) ON DELETE CASCADE ON UPDATE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    """)

    # 2. Repair uploaded_files columns
    if table_exists("uploaded_files"):
        if not column_exists("uploaded_files", "project_id"):
            cur.execute("ALTER TABLE uploaded_files ADD COLUMN project_id VARCHAR(50) NULL")
        if not column_exists("uploaded_files", "row_count"):
            cur.execute("ALTER TABLE uploaded_files ADD COLUMN row_count INT NOT NULL DEFAULT 0")
        if not column_exists("uploaded_files", "col_count"):
            cur.execute("ALTER TABLE uploaded_files ADD COLUMN col_count INT NOT NULL DEFAULT 0")
        if not column_exists("uploaded_files", "data_quality_score"):
            cur.execute("ALTER TABLE uploaded_files ADD COLUMN data_quality_score FLOAT NULL")
        if not column_exists("uploaded_files", "status"):
            cur.execute("ALTER TABLE uploaded_files ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'Active'")
        
        # Add foreign key if missing
        if not foreign_key_exists("uploaded_files", "fk_uploaded_files_projects"):
            try:
                cur.execute("ALTER TABLE uploaded_files ADD CONSTRAINT fk_uploaded_files_projects FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE")
            except Exception as e:
                logger.warning(f"Could not add fk_uploaded_files_projects constraint: {e}")

    # 3. Repair ml_saved_models columns
    if table_exists("ml_saved_models"):
        if not column_exists("ml_saved_models", "project_id"):
            cur.execute("ALTER TABLE ml_saved_models ADD COLUMN project_id VARCHAR(50) NULL")
        if not foreign_key_exists("ml_saved_models", "fk_ml_saved_projects"):
            try:
                cur.execute("ALTER TABLE ml_saved_models ADD CONSTRAINT fk_ml_saved_projects FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE")
            except Exception as e:
                logger.warning(f"Could not add fk_ml_saved_projects constraint: {e}")

    # 4. Repair ml_training_history columns
    if table_exists("ml_training_history"):
        if not column_exists("ml_training_history", "project_id"):
            cur.execute("ALTER TABLE ml_training_history ADD COLUMN project_id VARCHAR(50) NULL")
        if not foreign_key_exists("ml_training_history", "fk_ml_training_projects"):
            try:
                cur.execute("ALTER TABLE ml_training_history ADD CONSTRAINT fk_ml_training_projects FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE")
            except Exception as e:
                logger.warning(f"Could not add fk_ml_training_projects constraint: {e}")

    # 5. Repair user_notifications columns
    if table_exists("user_notifications"):
        if not column_exists("user_notifications", "project_id"):
            cur.execute("ALTER TABLE user_notifications ADD COLUMN project_id VARCHAR(50) NULL")
        if not foreign_key_exists("user_notifications", "fk_user_notifications_projects"):
            try:
                cur.execute("ALTER TABLE user_notifications ADD CONSTRAINT fk_user_notifications_projects FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE ON UPDATE CASCADE")
            except Exception as e:
                logger.warning(f"Could not add fk_user_notifications_projects constraint: {e}")

    # 6. Build missing indexes for query optimization
    indexes_to_build = [
        ("uploaded_files", "idx_files_project", "(project_id)"),
        ("ml_saved_models", "idx_saved_models_project", "(project_id)"),
        ("ml_training_history", "idx_training_history_project", "(project_id)"),
        ("user_notifications", "idx_notifications_project", "(project_id)"),
        ("project_activity_log", "idx_activity_project", "(project_id)"),
        ("visualizations", "idx_visualizations_project", "(project_id)"),
        ("project_reports", "idx_reports_project", "(project_id)"),
        ("project_exports", "idx_exports_project", "(project_id)")
    ]

    for table_name, index_name, columns_spec in indexes_to_build:
        if table_exists(table_name) and not index_exists(table_name, index_name):
            try:
                cur.execute(f"CREATE INDEX {index_name} ON {table_name} {columns_spec}")
            except Exception as e:
                logger.warning(f"Could not create index {index_name} on {table_name}: {e}")

def VERIFY() -> bool:
    from database.schema import table_exists, column_exists
    return (
        table_exists("dataset_profiles")
        and table_exists("feature_engineering")
        and table_exists("project_activity_log")
        and column_exists("uploaded_files", "project_id")
        and column_exists("ml_saved_models", "project_id")
        and column_exists("ml_training_history", "project_id")
        and column_exists("user_notifications", "project_id")
    )

def DOWN(cur) -> None:
    cur.execute("DROP TABLE IF EXISTS project_activity_log")
    cur.execute("DROP TABLE IF EXISTS feature_engineering")
    cur.execute("DROP TABLE IF EXISTS dataset_profiles")
