# schema_definitions.py — Authoritative schema definitions for all database tables

TABLES_SCHEMA = {
    "kore_users": {
        "columns": {
            "login_id": "VARCHAR(20) NOT NULL PRIMARY KEY",
            "first_name": "VARCHAR(50) NOT NULL",
            "last_name": "VARCHAR(50) NULL DEFAULT ''",
            "email": "VARCHAR(100) NOT NULL UNIQUE",
            "phone": "VARCHAR(20) NOT NULL UNIQUE",
            "password_hash": "VARCHAR(255) NULL",
            "is_verified": "TINYINT(1) NOT NULL DEFAULT 0",
            "created_at": "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"
        }
    },
    "otp_tokens": {
        "columns": {
            "id": "INT NOT NULL AUTO_INCREMENT PRIMARY KEY",
            "login_id": "VARCHAR(20) NOT NULL",
            "otp_code": "VARCHAR(6) NOT NULL",
            "otp_type": "VARCHAR(10) NOT NULL DEFAULT 'email'",
            "expires_at": "DATETIME NOT NULL",
            "created_at": "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"
        },
        "foreign_keys": {
            "fk_otp_tokens_users": ("login_id", "kore_users(login_id) ON DELETE CASCADE ON UPDATE CASCADE")
        }
    },
    "sessions": {
        "columns": {
            "token": "VARCHAR(64) NOT NULL PRIMARY KEY",
            "login_id": "VARCHAR(20) NOT NULL",
            "created_at": "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
            "expires_at": "DATETIME NOT NULL"
        },
        "foreign_keys": {
            "fk_sessions_users": ("login_id", "kore_users(login_id) ON DELETE CASCADE ON UPDATE CASCADE")
        }
    },
    "password_reset_log": {
        "columns": {
            "id": "INT NOT NULL AUTO_INCREMENT PRIMARY KEY",
            "login_id": "VARCHAR(20) NOT NULL",
            "token": "VARCHAR(64) NOT NULL",
            "expires_at": "DATETIME NOT NULL",
            "created_at": "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"
        },
        "foreign_keys": {
            "fk_password_reset_users": ("login_id", "kore_users(login_id) ON DELETE CASCADE ON UPDATE CASCADE")
        }
    },
    "projects": {
        "columns": {
            "id": "VARCHAR(50) NOT NULL PRIMARY KEY",
            "login_id": "VARCHAR(20) NOT NULL",
            "name": "VARCHAR(100) NOT NULL",
            "description": "TEXT NULL",
            "industry": "VARCHAR(50) NOT NULL DEFAULT 'General'",
            "project_type": "VARCHAR(50) NOT NULL DEFAULT 'Standard'",
            "visibility": "VARCHAR(20) NOT NULL DEFAULT 'private'",
            "color_theme": "VARCHAR(20) NOT NULL DEFAULT 'blue'",
            "icon": "VARCHAR(20) NOT NULL DEFAULT 'folder'",
            "storage_used": "VARCHAR(50) NOT NULL DEFAULT '0 KB'",
            "status": "VARCHAR(20) NOT NULL DEFAULT 'Active'",
            "is_favorite": "TINYINT(1) NOT NULL DEFAULT 0",
            "is_archived": "TINYINT(1) NOT NULL DEFAULT 0",
            "is_deleted": "TINYINT(1) NOT NULL DEFAULT 0",
            "current_pipeline_stage": "VARCHAR(50) NOT NULL DEFAULT 'Import Dataset'",
            "active_dataset": "VARCHAR(100) NULL",
            "active_model": "VARCHAR(100) NULL",
            "created_at": "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
            "updated_at": "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
            "last_opened_at": "TIMESTAMP NULL DEFAULT NULL",
            "dataset_count": "INT NOT NULL DEFAULT 0",
            "model_count": "INT NOT NULL DEFAULT 0",
            "report_count": "INT NOT NULL DEFAULT 0"
        },
        "foreign_keys": {
            "fk_projects_users": ("login_id", "kore_users(login_id) ON DELETE CASCADE ON UPDATE CASCADE")
        }
    },
    "project_members": {
        "columns": {
            "id": "INT NOT NULL AUTO_INCREMENT PRIMARY KEY",
            "project_id": "VARCHAR(50) NOT NULL",
            "login_id": "VARCHAR(20) NOT NULL",
            "role": "ENUM('Owner', 'Admin', 'Editor', 'Viewer', 'Guest') NOT NULL DEFAULT 'Viewer'",
            "created_at": "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"
        },
        "foreign_keys": {
            "fk_project_members_projects": ("project_id", "projects(id) ON DELETE CASCADE ON UPDATE CASCADE"),
            "fk_project_members_users": ("login_id", "kore_users(login_id) ON DELETE CASCADE ON UPDATE CASCADE")
        }
    },
    "project_settings": {
        "columns": {
            "project_id": "VARCHAR(50) NOT NULL PRIMARY KEY",
            "default_theme": "VARCHAR(20) NOT NULL DEFAULT 'dark'",
            "default_ai_model": "VARCHAR(50) NOT NULL DEFAULT 'gemini-1.5-pro'",
            "default_language": "VARCHAR(10) NOT NULL DEFAULT 'en'",
            "notification_settings": "TEXT NULL",
            "auto_save": "TINYINT(1) NOT NULL DEFAULT 1",
            "timezone": "VARCHAR(50) NOT NULL DEFAULT 'UTC'",
            "chart_preferences": "TEXT NULL",
            "report_preferences": "TEXT NULL",
            "created_at": "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"
        },
        "foreign_keys": {
            "fk_project_settings_projects": ("project_id", "projects(id) ON DELETE CASCADE ON UPDATE CASCADE")
        }
    },
    "user_notifications": {
        "columns": {
            "id": "INT NOT NULL AUTO_INCREMENT PRIMARY KEY",
            "login_id": "VARCHAR(20) NOT NULL",
            "project_id": "VARCHAR(50) NULL",
            "title": "VARCHAR(200) NOT NULL",
            "message": "TEXT NOT NULL",
            "type": "VARCHAR(20) NOT NULL DEFAULT 'info'",
            "is_read": "TINYINT(1) NOT NULL DEFAULT 0",
            "created_at": "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"
        },
        "foreign_keys": {
            "fk_user_notifications_users": ("login_id", "kore_users(login_id) ON DELETE CASCADE ON UPDATE CASCADE"),
            "fk_user_notifications_projects": ("project_id", "projects(id) ON DELETE CASCADE ON UPDATE CASCADE")
        }
    },
    "kore_workspace_state": {
        "columns": {
            "login_id": "VARCHAR(20) NOT NULL PRIMARY KEY",
            "active_project_id": "VARCHAR(50) NULL",
            "active_dataset_id": "INT NULL",
            "active_model_id": "INT NULL",
            "current_module": "VARCHAR(50) NULL",
            "current_page": "VARCHAR(50) NULL",
            "current_chart": "VARCHAR(50) NULL",
            "last_pipeline_step": "VARCHAR(50) NULL",
            "eda_result": "LONGTEXT NULL",
            "active_panels": "TEXT NULL",
            "selected_panel": "VARCHAR(50) NULL",
            "sim_running": "TINYINT(1) NOT NULL DEFAULT 0",
            "current_stage_key": "VARCHAR(50) NULL",
            "sim_progress": "INT NOT NULL DEFAULT 0",
            "stage_statuses": "TEXT NULL",
            "logs": "LONGTEXT NULL",
            "open_tabs_json": "LONGTEXT NULL",
            "active_tab_id": "VARCHAR(50) NULL",
            "workspace_settings_json": "LONGTEXT NULL",
            "workspace_history_json": "LONGTEXT NULL"
        },
        "foreign_keys": {
            "fk_workspace_state_users": ("login_id", "kore_users(login_id) ON DELETE CASCADE ON UPDATE CASCADE"),
            "fk_workspace_state_projects": ("active_project_id", "projects(id) ON DELETE SET NULL ON UPDATE CASCADE")
        }
    },
    "uploaded_files": {
        "columns": {
            "id": "INT NOT NULL AUTO_INCREMENT PRIMARY KEY",
            "login_id": "VARCHAR(20) NOT NULL",
            "project_id": "VARCHAR(50) NULL",
            "file_name": "VARCHAR(255) NOT NULL",
            "file_type": "VARCHAR(50) NOT NULL DEFAULT 'csv'",
            "file_size_kb": "DOUBLE NOT NULL DEFAULT 0.0",
            "row_count": "INT NOT NULL DEFAULT 0",
            "col_count": "INT NOT NULL DEFAULT 0",
            "data_quality_score": "FLOAT NULL",
            "status": "VARCHAR(20) NOT NULL DEFAULT 'Active'",
            "eda_json_path": "VARCHAR(500) NULL",
            "file_path": "VARCHAR(500) NOT NULL",
            "uploaded_at": "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"
        },
        "foreign_keys": {
            "fk_uploaded_files_users": ("login_id", "kore_users(login_id) ON DELETE CASCADE ON UPDATE CASCADE"),
            "fk_uploaded_files_projects": ("project_id", "projects(id) ON DELETE CASCADE ON UPDATE CASCADE")
        }
    },
    "ml_training_history": {
        "columns": {
            "id": "INT NOT NULL AUTO_INCREMENT PRIMARY KEY",
            "login_id": "VARCHAR(20) NOT NULL",
            "project_id": "VARCHAR(50) NULL",
            "dataset_id": "INT NOT NULL",
            "model_name": "VARCHAR(100) NOT NULL",
            "algorithm": "VARCHAR(50) NOT NULL",
            "target_column": "VARCHAR(100) NOT NULL",
            "parameters_json": "LONGTEXT NOT NULL",
            "status": "VARCHAR(20) NOT NULL DEFAULT 'Completed'",
            "duration_ms": "INT NOT NULL DEFAULT 0",
            "created_at": "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"
        },
        "foreign_keys": {
            "fk_ml_training_users": ("login_id", "kore_users(login_id) ON DELETE CASCADE ON UPDATE CASCADE"),
            "fk_ml_training_projects": ("project_id", "projects(id) ON DELETE CASCADE ON UPDATE CASCADE"),
            "fk_ml_training_files": ("dataset_id", "uploaded_files(id) ON DELETE CASCADE ON UPDATE CASCADE")
        }
    },
    "ml_saved_models": {
        "columns": {
            "id": "INT NOT NULL AUTO_INCREMENT PRIMARY KEY",
            "login_id": "VARCHAR(20) NOT NULL",
            "project_id": "VARCHAR(50) NULL",
            "history_id": "INT NOT NULL",
            "model_name": "VARCHAR(100) NOT NULL",
            "model_key": "VARCHAR(50) NOT NULL",
            "primary_metric": "DOUBLE NOT NULL DEFAULT 0.0",
            "metrics_json": "LONGTEXT NOT NULL",
            "features_json": "LONGTEXT NOT NULL",
            "file_path": "VARCHAR(500) NOT NULL",
            "saved_at": "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"
        },
        "foreign_keys": {
            "fk_ml_saved_users": ("login_id", "kore_users(login_id) ON DELETE CASCADE ON UPDATE CASCADE"),
            "fk_ml_saved_projects": ("project_id", "projects(id) ON DELETE CASCADE ON UPDATE CASCADE"),
            "fk_ml_saved_history": ("history_id", "ml_training_history(id) ON DELETE CASCADE ON UPDATE CASCADE")
        }
    },
    "dataset_versions": {
        "columns": {
            "id": "INT NOT NULL AUTO_INCREMENT PRIMARY KEY",
            "dataset_id": "INT NOT NULL",
            "version_number": "INT NOT NULL",
            "description": "VARCHAR(255) NULL",
            "file_path": "VARCHAR(500) NOT NULL",
            "created_at": "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"
        },
        "foreign_keys": {
            "fk_dataset_versions_files": ("dataset_id", "uploaded_files(id) ON DELETE CASCADE ON UPDATE CASCADE")
        }
    },
    "user_sessions": {
        "columns": {
            "id": "INT NOT NULL AUTO_INCREMENT PRIMARY KEY",
            "login_id": "VARCHAR(20) NOT NULL",
            "session_token": "VARCHAR(64) NOT NULL",
            "login_at": "DATETIME NOT NULL",
            "logout_at": "DATETIME NULL",
            "duration_sec": "INT NULL",
            "ip_address": "VARCHAR(45) NULL",
            "user_agent": "TEXT NULL",
            "is_active": "TINYINT(1) NOT NULL DEFAULT 1",
            "created_at": "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"
        },
        "foreign_keys": {
            "fk_user_sessions_users": ("login_id", "kore_users(login_id) ON DELETE CASCADE ON UPDATE CASCADE")
        }
    },
    "daily_activity": {
        "columns": {
            "id": "INT NOT NULL AUTO_INCREMENT PRIMARY KEY",
            "login_id": "VARCHAR(20) NOT NULL",
            "activity_date": "DATE NOT NULL",
            "first_login_at": "DATETIME NOT NULL",
            "last_seen_at": "DATETIME NOT NULL",
            "total_active_sec": "INT NOT NULL DEFAULT 0",
            "login_count": "INT NOT NULL DEFAULT 1",
            "logout_count": "INT NOT NULL DEFAULT 0",
            "updated_at": "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        },
        "foreign_keys": {
            "fk_daily_activity_users": ("login_id", "kore_users(login_id) ON DELETE CASCADE ON UPDATE CASCADE")
        }
    },
    "visualizations": {
        "columns": {
            "id": "INT NOT NULL AUTO_INCREMENT PRIMARY KEY",
            "project_id": "VARCHAR(50) NOT NULL",
            "dataset_id": "INT NULL",
            "chart_type": "VARCHAR(50) NOT NULL",
            "chart_name": "VARCHAR(100) NOT NULL",
            "chart_config_json": "LONGTEXT NOT NULL",
            "created_by": "VARCHAR(20) NOT NULL",
            "created_at": "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"
        },
        "foreign_keys": {
            "fk_visualizations_projects": ("project_id", "projects(id) ON DELETE CASCADE ON UPDATE CASCADE"),
            "fk_visualizations_files": ("dataset_id", "uploaded_files(id) ON DELETE CASCADE ON UPDATE CASCADE"),
            "fk_visualizations_users": ("created_by", "kore_users(login_id) ON DELETE CASCADE ON UPDATE CASCADE")
        }
    },
    "predictions": {
        "columns": {
            "id": "INT NOT NULL AUTO_INCREMENT PRIMARY KEY",
            "project_id": "VARCHAR(50) NOT NULL",
            "model_id": "INT NOT NULL",
            "input_dataset": "VARCHAR(255) NULL",
            "output_dataset": "VARCHAR(255) NULL",
            "confidence": "FLOAT NULL",
            "generated_at": "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"
        },
        "foreign_keys": {
            "fk_predictions_projects": ("project_id", "projects(id) ON DELETE CASCADE ON UPDATE CASCADE"),
            "fk_predictions_models": ("model_id", "ml_saved_models(id) ON DELETE CASCADE ON UPDATE CASCADE")
        }
    },
    "project_reports": {
        "columns": {
            "id": "INT NOT NULL AUTO_INCREMENT PRIMARY KEY",
            "project_id": "VARCHAR(50) NOT NULL",
            "report_name": "VARCHAR(100) NOT NULL",
            "report_type": "VARCHAR(50) NOT NULL",
            "pdf_path": "VARCHAR(500) NOT NULL",
            "generated_by": "VARCHAR(20) NOT NULL",
            "generated_at": "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"
        },
        "foreign_keys": {
            "fk_project_reports_projects": ("project_id", "projects(id) ON DELETE CASCADE ON UPDATE CASCADE"),
            "fk_project_reports_users": ("generated_by", "kore_users(login_id) ON DELETE CASCADE ON UPDATE CASCADE")
        }
    },
    "project_exports": {
        "columns": {
            "id": "INT NOT NULL AUTO_INCREMENT PRIMARY KEY",
            "project_id": "VARCHAR(50) NOT NULL",
            "export_type": "VARCHAR(50) NOT NULL",
            "zip_path": "VARCHAR(500) NULL",
            "csv_path": "VARCHAR(500) NULL",
            "sql_path": "VARCHAR(500) NULL",
            "python_path": "VARCHAR(500) NULL",
            "notebook_path": "VARCHAR(500) NULL",
            "download_count": "INT NOT NULL DEFAULT 0",
            "created_at": "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"
        },
        "foreign_keys": {
            "fk_project_exports_projects": ("project_id", "projects(id) ON DELETE CASCADE ON UPDATE CASCADE")
        }
    },
    "project_statistics": {
        "columns": {
            "project_id": "VARCHAR(50) NOT NULL PRIMARY KEY",
            "dataset_count": "INT NOT NULL DEFAULT 0",
            "model_count": "INT NOT NULL DEFAULT 0",
            "chart_count": "INT NOT NULL DEFAULT 0",
            "report_count": "INT NOT NULL DEFAULT 0",
            "export_count": "INT NOT NULL DEFAULT 0",
            "storage_used": "VARCHAR(50) NOT NULL DEFAULT '0 KB'",
            "pipeline_completion": "INT NOT NULL DEFAULT 0",
            "quality_score": "FLOAT NULL",
            "updated_at": "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        },
        "foreign_keys": {
            "fk_project_stats_projects": ("project_id", "projects(id) ON DELETE CASCADE ON UPDATE CASCADE")
        }
    },
    "ai_chat_history": {
        "columns": {
            "id": "INT NOT NULL AUTO_INCREMENT PRIMARY KEY",
            "project_id": "VARCHAR(50) NOT NULL",
            "login_id": "VARCHAR(20) NOT NULL",
            "prompt": "TEXT NOT NULL",
            "response": "TEXT NOT NULL",
            "model": "VARCHAR(50) NULL",
            "tokens": "INT NULL",
            "created_at": "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"
        },
        "foreign_keys": {
            "fk_ai_chat_projects": ("project_id", "projects(id) ON DELETE CASCADE ON UPDATE CASCADE"),
            "fk_ai_chat_users": ("login_id", "kore_users(login_id) ON DELETE CASCADE ON UPDATE CASCADE")
        }
    },
    "project_pipeline": {
        "columns": {
            "id": "INT NOT NULL AUTO_INCREMENT PRIMARY KEY",
            "project_id": "VARCHAR(50) NOT NULL",
            "step_name": "VARCHAR(50) NOT NULL",
            "status": "ENUM('Not Started', 'In Progress', 'Completed') NOT NULL DEFAULT 'Not Started'",
            "updated_at": "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
        },
        "foreign_keys": {
            "fk_project_pipeline_projects": ("project_id", "projects(id) ON DELETE CASCADE ON UPDATE CASCADE")
        }
    },
    "simulation_sessions": {
        "columns": {
            "simulation_id": "VARCHAR(50) NOT NULL PRIMARY KEY",
            "login_id": "VARCHAR(20) NOT NULL",
            "dataset_id": "INT NULL",
            "status": "VARCHAR(20) NOT NULL DEFAULT 'idle'",
            "progress": "INT NOT NULL DEFAULT 0",
            "stage": "VARCHAR(50) NULL",
            "logs_path": "VARCHAR(500) NULL",
            "created_at": "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP",
            "updated_at": "DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
            "completed_at": "DATETIME NULL"
        },
        "foreign_keys": {
            "fk_simulation_users": ("login_id", "kore_users(login_id) ON DELETE CASCADE ON UPDATE CASCADE"),
            "fk_simulation_files": ("dataset_id", "uploaded_files(id) ON DELETE CASCADE ON UPDATE CASCADE")
        }
    },
    "dataset_profiles": {
        "columns": {
            "id": "INT AUTO_INCREMENT PRIMARY KEY",
            "project_id": "VARCHAR(50) NOT NULL",
            "dataset_id": "INT NOT NULL",
            "profile_json": "LONGTEXT NOT NULL",
            "created_at": "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"
        },
        "foreign_keys": {
            "fk_dataset_profiles_projects": ("project_id", "projects(id) ON DELETE CASCADE ON UPDATE CASCADE"),
            "fk_dataset_profiles_files": ("dataset_id", "uploaded_files(id) ON DELETE CASCADE ON UPDATE CASCADE")
        }
    },
    "feature_engineering": {
        "columns": {
            "id": "INT AUTO_INCREMENT PRIMARY KEY",
            "project_id": "VARCHAR(50) NOT NULL",
            "dataset_id": "INT NOT NULL",
            "recipe_json": "LONGTEXT NOT NULL",
            "created_at": "TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"
        },
        "foreign_keys": {
            "fk_feature_eng_projects": ("project_id", "projects(id) ON DELETE CASCADE ON UPDATE CASCADE"),
            "fk_feature_eng_files": ("dataset_id", "uploaded_files(id) ON DELETE CASCADE ON UPDATE CASCADE")
        }
    }
}
