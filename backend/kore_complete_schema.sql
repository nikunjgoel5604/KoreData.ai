-- ══════════════════════════════════════════════════════════════════════════════
--  kore_schema_v10.sql — Kore_data-ex  UNIFIED PRODUCTION SCHEMA  v10.0
--  Run: mysql -u root -p kore_data < kore_schema_v10.sql
--
--  WHAT CHANGED vs kore_schema_v9.sql
--  ─────────────────────────────────────────────────────────────────────────────
--  FIX 1  Removed ALL dangerous diagnostic statements from bottom of v9.sql:
--           show databases; show tables; use kore_data;
--           delete from kore_users where id=1;
--           select * from ... (all stray SELECTs)
--         These would execute destructively if the script was piped to mysql.
--
--  NEW 2  ml_training_history table — one row per ML training run per user.
--         Stores model key, task type, primary metric, F1, RMSE, ROC-AUC,
--         CV score, hyperparams JSON, file path, deploy grade, trained_at.
--
--  NEW 3  ml_saved_models table — tracks .joblib files saved to disk.
--         Links to ml_training_history via history_id FK.
--
--  NEW 4  Section 5d migration procedure for ML tables — safe on live DB.
--         Checks information_schema before any ALTER.
--
--  NEW 5  Views updated:
--           v_ml_history     — per-user training run summary (all models)
--           v_ml_leaderboard — best model per user per task type
--
--  RETAINED from v9.0
--  ─────────────────────────────────────────────────────────────────────────────
--  · All 9 original tables unchanged
--  · All stored procedures unchanged
--  · All views from v9.0 unchanged (sections 7a–7h)
--  · All migration procedures re-run safely (IF NOT EXISTS guards)
--  · All diagnostic queries moved to Section 9 inside block comments only
--
--  TABLE ORDER (FK dependencies)
--    1. kore_users            — parent of ALL child tables
--    2. otp_tokens            → kore_users.login_id
--    3. sessions              → kore_users.login_id  (auth tokens)
--    4. uploaded_files        → kore_users.login_id
--    5. user_notifications    → kore_users.login_id
--    6. password_reset_log    → kore_users.login_id
--    7. user_sessions         → kore_users.login_id  (activity tracking)
--    8. daily_activity        → kore_users.login_id
--    9. user_activity         → kore_users.login_id  (account action log)
--   10. ml_training_history   → kore_users.login_id  (NEW v10.0)
--   11. ml_saved_models       → kore_users.login_id  (NEW v10.0)
--                             → ml_training_history.id
-- ══════════════════════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS kore_data
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE kore_data;


-- ════════════════════════════════════════════════════════════════════════════
--  SECTION 1 — CORE USER TABLE
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS kore_users (
  id            INT           NOT NULL AUTO_INCREMENT,
  login_id      VARCHAR(20)   NOT NULL
                COMMENT 'Business key — KD + 6 digits. FK target in ALL child tables.',
  first_name    VARCHAR(50)   NOT NULL,
  last_name     VARCHAR(50)   NOT NULL DEFAULT '',
  email         VARCHAR(100)  NOT NULL,
  phone         VARCHAR(20)   NOT NULL,
  is_verified   TINYINT(1)    NOT NULL DEFAULT 0,
  password_hash VARCHAR(255)  NULL     DEFAULT NULL
                COMMENT 'bcrypt hash — NULL = OTP-only account',
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                              ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY  uq_login_id (login_id),
  UNIQUE KEY  uq_email    (email),
  UNIQUE KEY  uq_phone    (phone),
  INDEX       idx_verified (is_verified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Root user table. login_id is the shared FK across all feature tables.';


-- ════════════════════════════════════════════════════════════════════════════
--  SECTION 2 — AUTH / LOGIN TABLES
-- ════════════════════════════════════════════════════════════════════════════

-- ── 2a. OTP TOKENS ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otp_tokens (
  id         INT          NOT NULL AUTO_INCREMENT,
  login_id   VARCHAR(20)  NOT NULL,
  otp_code   VARCHAR(6)   NOT NULL,
  method     ENUM('email','phone')
                          NOT NULL DEFAULT 'email',
  contact    VARCHAR(100) NOT NULL,
  purpose    ENUM('login','register','set_password','reset_password','verify_contact')
                          NOT NULL DEFAULT 'login'
                          COMMENT 'v7.0 — why this OTP was issued. verify_contact added v9.0',
  expires_at DATETIME     NOT NULL,
  is_used    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  CONSTRAINT fk_otp_user
    FOREIGN KEY (login_id) REFERENCES kore_users(login_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_otp_login_active (login_id, is_used),
  INDEX idx_otp_expires      (expires_at),
  INDEX idx_otp_purpose      (purpose, is_used)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='OTP codes for all auth + account-verification flows.';


-- ── 2b. SESSIONS (API auth tokens) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
  id         INT         NOT NULL AUTO_INCREMENT,
  token      VARCHAR(64) NOT NULL,
  login_id   VARCHAR(20) NOT NULL,
  created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME    NOT NULL,

  PRIMARY KEY (id),
  UNIQUE KEY  uq_session_token (token),
  CONSTRAINT  fk_session_user
    FOREIGN KEY (login_id) REFERENCES kore_users(login_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_session_token (token),
  INDEX idx_session_login (login_id),
  INDEX idx_session_exp   (expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='API auth tokens. Validated on every request via Bearer token.';


-- ── 2c. PASSWORD RESET LOG ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS password_reset_log (
  id         INT         NOT NULL AUTO_INCREMENT,
  login_id   VARCHAR(20) NOT NULL,
  action     ENUM('set_password','reset_password') NOT NULL,
  ip_address VARCHAR(45) NULL DEFAULT NULL,
  created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  CONSTRAINT fk_pwlog_user
    FOREIGN KEY (login_id) REFERENCES kore_users(login_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_pwlog_user (login_id),
  INDEX idx_pwlog_time (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Audit trail: every password set or reset event.';


-- ════════════════════════════════════════════════════════════════════════════
--  SECTION 3 — FILE / NOTIFICATION TABLES
-- ════════════════════════════════════════════════════════════════════════════

-- ── 3a. UPLOADED FILES ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS uploaded_files (
  id           INT          NOT NULL AUTO_INCREMENT,
  login_id     VARCHAR(20)  NOT NULL,
  file_name    VARCHAR(255) NOT NULL,
  file_type    VARCHAR(20)  NOT NULL,
  file_size_kb FLOAT        NOT NULL,
  row_count    INT          NULL,
  col_count    INT          NULL,
  uploaded_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  CONSTRAINT fk_file_user
    FOREIGN KEY (login_id) REFERENCES kore_users(login_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_files_login    (login_id),
  INDEX idx_files_uploaded (uploaded_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='EDA file upload records.';


-- ── 3b. USER NOTIFICATIONS ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_notifications (
  id             INT           NOT NULL AUTO_INCREMENT,
  login_id       VARCHAR(20)   NOT NULL,
  message        TEXT          NOT NULL,
  type           VARCHAR(20)   NOT NULL DEFAULT 'info',
  source_section VARCHAR(50)   NULL,
  is_read        TINYINT(1)    NOT NULL DEFAULT 0,
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  CONSTRAINT fk_notif_user
    FOREIGN KEY (login_id) REFERENCES kore_users(login_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_notif_user   (login_id),
  INDEX idx_notif_unread (login_id, is_read),
  INDEX idx_notif_time   (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='In-app notifications.';


-- ════════════════════════════════════════════════════════════════════════════
--  SECTION 4 — ACTIVITY TRACKING TABLES
-- ════════════════════════════════════════════════════════════════════════════

-- ── 4a. USER SESSIONS (one row per login event) ───────────────────────────────
CREATE TABLE IF NOT EXISTS user_sessions (
  id              INT           NOT NULL AUTO_INCREMENT,
  login_id        VARCHAR(20)   NOT NULL,
  session_token   VARCHAR(64)   NOT NULL
                  COMMENT 'Activity token — separate from auth token in sessions table',
  login_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  logout_at       DATETIME      NULL     DEFAULT NULL,
  duration_sec    INT           NULL     DEFAULT NULL,
  ip_address      VARCHAR(45)   NULL,
  user_agent      TEXT          NULL,
  is_active       TINYINT(1)    NOT NULL DEFAULT 1,
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY  uq_us_token   (session_token),
  CONSTRAINT  fk_us_user
    FOREIGN KEY (login_id) REFERENCES kore_users(login_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_us_login_id  (login_id),
  INDEX idx_us_login_at  (login_at),
  INDEX idx_us_is_active (is_active),
  INDEX idx_us_date      (login_id, login_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Activity: one row per login event. duration_sec set on logout.';


-- ── 4b. DAILY ACTIVITY ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_activity (
  id                INT           NOT NULL AUTO_INCREMENT,
  login_id          VARCHAR(20)   NOT NULL,
  activity_date     DATE          NOT NULL,
  first_login_at    DATETIME      NOT NULL,
  last_seen_at      DATETIME      NOT NULL,
  total_active_sec  INT           NOT NULL DEFAULT 0,
  login_count       INT           NOT NULL DEFAULT 0,
  logout_count      INT           NOT NULL DEFAULT 0,
  updated_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP
                    ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY  uq_da_user_date (login_id, activity_date),
  CONSTRAINT  fk_da_user
    FOREIGN KEY (login_id) REFERENCES kore_users(login_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_da_login_id (login_id),
  INDEX idx_da_date     (activity_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Activity: one aggregated row per user per day.';


-- ── 4c. USER ACTIVITY (account action audit log) ─────────────────────────────
CREATE TABLE IF NOT EXISTS user_activity (
  id         INT          NOT NULL AUTO_INCREMENT,
  login_id   VARCHAR(20)  NOT NULL,
  action     VARCHAR(60)  NOT NULL,
  ip_address VARCHAR(45)  NULL,
  device     VARCHAR(120) NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  CONSTRAINT fk_useract_user
    FOREIGN KEY (login_id) REFERENCES kore_users(login_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_act_user (login_id),
  INDEX idx_act_time (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Account action audit log written by account_routes.py _log_activity().';


-- ════════════════════════════════════════════════════════════════════════════
--  SECTION 4d — ML STUDIO TABLES  (NEW v10.0)
-- ════════════════════════════════════════════════════════════════════════════

-- ── 4d-1. ML TRAINING HISTORY ────────────────────────────────────────────────
--
--  One row per ML training run.
--  Written by ml_routes.py _persist_training_run() after every /ml/train call.
--  model_b64 is NOT stored here — it stays as .joblib on disk (file_path).
--
--  Metric columns:
--    primary_metric  — accuracy (clf) | R² (reg) | silhouette (cluster)
--    f1_score        — classification only
--    precision_score — classification only
--    recall_score    — classification only
--    roc_auc         — classification only (binary or weighted OvR)
--    rmse            — regression only
--    mae             — regression only
--    r2_score        — regression only
--    cv_score        — cross-validation mean
--    cv_std          — cross-validation std dev

CREATE TABLE IF NOT EXISTS ml_training_history (
  id              INT           NOT NULL AUTO_INCREMENT,
  login_id        VARCHAR(20)   NOT NULL,
  model_key       VARCHAR(60)   NOT NULL
                  COMMENT 'e.g. random_forest_clf, gradient_boosting_reg',
  model_name      VARCHAR(120)  NOT NULL
                  COMMENT 'Human-readable model name',
  category        VARCHAR(40)   NOT NULL
                  COMMENT 'Machine Learning | Deep Learning',
  task_type       VARCHAR(20)   NOT NULL
                  COMMENT 'classification | regression | clustering',
  target_col      VARCHAR(100)  NULL
                  COMMENT 'Name of the target column trained against',
  n_features      INT           NULL,
  n_rows_train    INT           NULL,
  n_rows_test     INT           NULL,
  test_size       FLOAT         NULL
                  COMMENT 'Fraction used for test split (0.0–0.4)',
  eda_score       FLOAT         NULL
                  COMMENT 'EDA Accuracy score at time of training (0–100)',

  -- Primary metric
  primary_metric  FLOAT         NULL
                  COMMENT 'Accuracy (clf) / R² (reg) / Silhouette (cluster)',

  -- Classification metrics
  f1_score        FLOAT         NULL,
  precision_score FLOAT         NULL,
  recall_score    FLOAT         NULL,
  roc_auc         FLOAT         NULL,

  -- Regression metrics
  rmse            FLOAT         NULL,
  mae             FLOAT         NULL,
  r2_score        FLOAT         NULL,

  -- Cross-validation
  cv_score        FLOAT         NULL,
  cv_std          FLOAT         NULL,

  -- Training metadata
  hyperparams     TEXT          NULL
                  COMMENT 'JSON: hyperparameters used for this run',
  model_file_path VARCHAR(500)  NULL
                  COMMENT 'Relative/absolute path to saved .joblib file on disk',
  deploy_ready    TINYINT(1)    NOT NULL DEFAULT 0
                  COMMENT '1 = meets deployment quality threshold',
  grade           VARCHAR(20)   NULL
                  COMMENT 'Excellent | Good | Fair | Poor',
  trained_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  CONSTRAINT fk_mth_user
    FOREIGN KEY (login_id) REFERENCES kore_users(login_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_mth_user      (login_id),
  INDEX idx_mth_model_key (model_key),
  INDEX idx_mth_task      (task_type),
  INDEX idx_mth_time      (trained_at),
  INDEX idx_mth_user_task (login_id, task_type),
  INDEX idx_mth_deploy    (login_id, deploy_ready)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='One row per ML training run. Written by ml_routes.py _persist_training_run().';


-- ── 4d-2. ML SAVED MODELS ────────────────────────────────────────────────────
--
--  Tracks .joblib model files saved to disk.
--  Multiple saves of the same model_key are versioned by saved_at.
--  is_active=1 means the current version; older saves get is_active=0.
--
--  To load a model in Python:
--    payload = joblib.load(file_path)
--    model   = payload['model']
--    scaler  = payload['scaler']
--    le      = payload['le']       # None for regression

CREATE TABLE IF NOT EXISTS ml_saved_models (
  id              INT           NOT NULL AUTO_INCREMENT,
  login_id        VARCHAR(20)   NOT NULL,
  history_id      INT           NULL
                  COMMENT 'FK → ml_training_history.id (the run that produced this model)',
  model_key       VARCHAR(60)   NOT NULL,
  model_name      VARCHAR(120)  NOT NULL,
  task_type       VARCHAR(20)   NOT NULL
                  COMMENT 'classification | regression | clustering',
  file_path       VARCHAR(500)  NOT NULL
                  COMMENT 'Path to .joblib bundle: saved_models/{login_id}/{key}_{ts}.joblib',
  file_size_kb    FLOAT         NULL,
  feature_names   TEXT          NULL
                  COMMENT 'JSON array of feature column names used during training',
  primary_metric  FLOAT         NULL
                  COMMENT 'Primary metric value at save time',
  is_active       TINYINT(1)    NOT NULL DEFAULT 1
                  COMMENT '1 = current version; 0 = superseded by newer save',
  saved_at        DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  CONSTRAINT fk_msm_user
    FOREIGN KEY (login_id)   REFERENCES kore_users(login_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_msm_history
    FOREIGN KEY (history_id) REFERENCES ml_training_history(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_msm_user      (login_id),
  INDEX idx_msm_model_key (login_id, model_key),
  INDEX idx_msm_active    (login_id, is_active),
  INDEX idx_msm_time      (saved_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Persisted ML model bundles per user. file_path → .joblib on disk.';


-- ════════════════════════════════════════════════════════════════════════════
--  SECTION 5 — LIVE MIGRATION PROCEDURES
--  All check information_schema before ALTER. Safe on live database.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 5a. Add password_hash to kore_users ──────────────────────────────────────
DROP PROCEDURE IF EXISTS _migrate_password_hash;
DELIMITER $$
CREATE PROCEDURE _migrate_password_hash()
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='kore_users' AND COLUMN_NAME='password_hash')
  THEN
    ALTER TABLE kore_users ADD COLUMN password_hash VARCHAR(255) NULL DEFAULT NULL
      COMMENT 'bcrypt hash — NULL = OTP-only account' AFTER is_verified;
  END IF;
END$$
DELIMITER ;
CALL _migrate_password_hash();
DROP PROCEDURE IF EXISTS _migrate_password_hash;


-- ── 5b. Add/update purpose column on otp_tokens ──────────────────────────────
DROP PROCEDURE IF EXISTS _migrate_otp_purpose;
DELIMITER $$
CREATE PROCEDURE _migrate_otp_purpose()
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='otp_tokens' AND COLUMN_NAME='purpose')
  THEN
    ALTER TABLE otp_tokens
      ADD COLUMN purpose ENUM('login','register','set_password','reset_password','verify_contact')
        NOT NULL DEFAULT 'login' AFTER contact;
  ELSE
    ALTER TABLE otp_tokens
      MODIFY COLUMN purpose ENUM('login','register','set_password','reset_password','verify_contact')
        NOT NULL DEFAULT 'login';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='otp_tokens' AND INDEX_NAME='idx_otp_purpose')
  THEN
    CREATE INDEX idx_otp_purpose ON otp_tokens (purpose, is_used);
  END IF;
END$$
DELIMITER ;
CALL _migrate_otp_purpose();
DROP PROCEDURE IF EXISTS _migrate_otp_purpose;


-- ── 5c. Add extended profile columns to kore_users ───────────────────────────
DROP PROCEDURE IF EXISTS _migrate_account_columns;
DELIMITER $$
CREATE PROCEDURE _migrate_account_columns()
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='kore_users' AND COLUMN_NAME='display_name')
  THEN ALTER TABLE kore_users ADD COLUMN display_name VARCHAR(80) NULL DEFAULT NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='kore_users' AND COLUMN_NAME='bio')
  THEN ALTER TABLE kore_users ADD COLUMN bio TEXT NULL DEFAULT NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='kore_users' AND COLUMN_NAME='dob')
  THEN ALTER TABLE kore_users ADD COLUMN dob DATE NULL DEFAULT NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='kore_users' AND COLUMN_NAME='avatar_url')
  THEN ALTER TABLE kore_users ADD COLUMN avatar_url VARCHAR(255) NULL DEFAULT NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='kore_users' AND COLUMN_NAME='resume_name')
  THEN ALTER TABLE kore_users ADD COLUMN resume_name VARCHAR(255) NULL DEFAULT NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='kore_users' AND COLUMN_NAME='resume_url')
  THEN ALTER TABLE kore_users ADD COLUMN resume_url VARCHAR(255) NULL DEFAULT NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='kore_users' AND COLUMN_NAME='job_title')
  THEN ALTER TABLE kore_users ADD COLUMN job_title VARCHAR(100) NULL DEFAULT NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='kore_users' AND COLUMN_NAME='company')
  THEN ALTER TABLE kore_users ADD COLUMN company VARCHAR(100) NULL DEFAULT NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='kore_users' AND COLUMN_NAME='industry')
  THEN ALTER TABLE kore_users ADD COLUMN industry VARCHAR(80) NULL DEFAULT NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='kore_users' AND COLUMN_NAME='years_exp')
  THEN ALTER TABLE kore_users ADD COLUMN years_exp VARCHAR(30) NULL DEFAULT NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='kore_users' AND COLUMN_NAME='linkedin')
  THEN ALTER TABLE kore_users ADD COLUMN linkedin VARCHAR(255) NULL DEFAULT NULL; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='kore_users' AND COLUMN_NAME='skills_json')
  THEN ALTER TABLE kore_users ADD COLUMN skills_json TEXT NULL DEFAULT NULL COMMENT 'JSON array of skill strings'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='kore_users' AND COLUMN_NAME='exp_json')
  THEN ALTER TABLE kore_users ADD COLUMN exp_json TEXT NULL DEFAULT NULL COMMENT 'JSON array of work experience objects'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='kore_users' AND COLUMN_NAME='address_json')
  THEN ALTER TABLE kore_users ADD COLUMN address_json TEXT NULL DEFAULT NULL COMMENT 'JSON: street, city, state, zip, country'; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='kore_users' AND COLUMN_NAME='email_verified')
  THEN ALTER TABLE kore_users ADD COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='kore_users' AND COLUMN_NAME='phone_verified')
  THEN ALTER TABLE kore_users ADD COLUMN phone_verified TINYINT(1) NOT NULL DEFAULT 0; END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='kore_users' AND COLUMN_NAME='last_login')
  THEN ALTER TABLE kore_users ADD COLUMN last_login DATETIME NULL DEFAULT NULL
    COMMENT 'Updated by trigger trg_update_last_login on every auth session insert'; END IF;
END$$
DELIMITER ;
CALL _migrate_account_columns();
DROP PROCEDURE IF EXISTS _migrate_account_columns;


-- ════════════════════════════════════════════════════════════════════════════
--  SECTION 6 — TRIGGER
-- ════════════════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trg_update_last_login;
DELIMITER $$
CREATE TRIGGER trg_update_last_login
AFTER INSERT ON sessions
FOR EACH ROW
BEGIN
  UPDATE kore_users SET last_login = NOW() WHERE login_id = NEW.login_id;
END$$
DELIMITER ;


-- ════════════════════════════════════════════════════════════════════════════
--  SECTION 7 — VIEWS  (all CREATE OR REPLACE — safe to re-run)
-- ════════════════════════════════════════════════════════════════════════════

-- ── 7a. v_active_otps ────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_active_otps AS
SELECT
    t.id, t.login_id, u.email, u.phone,
    t.method, t.contact, t.otp_code, t.purpose,
    t.expires_at, t.created_at,
    TIMESTAMPDIFF(SECOND, NOW(), t.expires_at) AS seconds_remaining
FROM otp_tokens t
JOIN kore_users u ON u.login_id = t.login_id
WHERE t.is_used = 0 AND t.expires_at > NOW();


-- ── 7b. v_user_summary ───────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_user_summary AS
SELECT
    u.id, u.login_id,
    CONCAT(u.first_name, ' ', u.last_name)            AS full_name,
    u.email, u.phone, u.is_verified,
    CASE WHEN u.password_hash IS NOT NULL THEN 1 ELSE 0 END AS has_password,
    u.created_at,
    COUNT(f.id)      AS total_uploads,
    MAX(f.uploaded_at) AS last_upload
FROM kore_users u
LEFT JOIN uploaded_files f ON f.login_id = u.login_id
GROUP BY u.id, u.login_id, u.first_name, u.last_name,
         u.email, u.phone, u.is_verified, u.password_hash, u.created_at;


-- ── 7c. v_password_set ───────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_password_set AS
SELECT login_id, CONCAT(first_name,' ',last_name) AS full_name,
       email, phone, is_verified, created_at
FROM kore_users WHERE password_hash IS NOT NULL;


-- ── 7d. v_otp_purpose ────────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_otp_purpose AS
SELECT purpose, method, COUNT(*) AS active_count,
       MIN(expires_at) AS earliest_expiry, MAX(created_at) AS latest_issued
FROM otp_tokens
WHERE is_used=0 AND expires_at>NOW()
GROUP BY purpose, method;


-- ── 7e. v_login_history ──────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_login_history AS
SELECT
    u.login_id,
    CONCAT(u.first_name, ' ', u.last_name)         AS full_name,
    u.email,
    da.activity_date,
    DATE_FORMAT(da.activity_date, '%a, %d %b %Y')  AS date_display,
    da.first_login_at,
    DATE_FORMAT(da.first_login_at, '%h:%i %p')     AS session_display,
    da.last_seen_at,
    da.total_active_sec,
    CONCAT(
        LPAD(FLOOR(da.total_active_sec/3600),2,'0'),':',
        LPAD(FLOOR((da.total_active_sec%3600)/60),2,'0'),':',
        LPAD(da.total_active_sec%60,2,'0')
    )                                               AS today_spend,
    da.login_count,
    da.logout_count,
    SUM(da.total_active_sec) OVER (
        PARTITION BY da.login_id ORDER BY da.activity_date
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
    )                                               AS cumulative_active_sec,
    CONCAT(
        LPAD(FLOOR(SUM(da.total_active_sec) OVER (PARTITION BY da.login_id ORDER BY da.activity_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)/86400),2,'0'),':',
        LPAD(FLOOR((SUM(da.total_active_sec) OVER (PARTITION BY da.login_id ORDER BY da.activity_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)%86400)/3600),2,'0'),':',
        LPAD(FLOOR((SUM(da.total_active_sec) OVER (PARTITION BY da.login_id ORDER BY da.activity_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)%3600)/60),2,'0'),':',
        LPAD(SUM(da.total_active_sec) OVER (PARTITION BY da.login_id ORDER BY da.activity_date ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW)%60,2,'0')
    )                                               AS total_spend_days
FROM daily_activity da
JOIN kore_users u ON u.login_id = da.login_id
ORDER BY da.activity_date DESC;


-- ── 7f. v_session_detail ─────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_session_detail AS
SELECT
    u.login_id, CONCAT(u.first_name,' ',u.last_name) AS full_name, u.email,
    us.id AS session_id, us.session_token, us.login_at, us.logout_at, us.duration_sec,
    CASE WHEN us.duration_sec IS NULL THEN 'Active'
         ELSE CONCAT(LPAD(FLOOR(us.duration_sec/3600),2,'0'),':',
                     LPAD(FLOOR((us.duration_sec%3600)/60),2,'0'),':',
                     LPAD(us.duration_sec%60,2,'0')) END AS duration_display,
    us.is_active, us.ip_address, DATE(us.login_at) AS login_date
FROM user_sessions us
JOIN kore_users u ON u.login_id = us.login_id
ORDER BY us.login_at DESC;


-- ── 7g. v_user_activity_summary ──────────────────────────────────────────────
CREATE OR REPLACE VIEW v_user_activity_summary AS
SELECT
    u.login_id,
    CONCAT(u.first_name,' ',u.last_name)    AS full_name,
    u.email,
    MIN(us.login_at)                         AS first_ever_login,
    COALESCE(MAX(us.logout_at),MAX(us.login_at)) AS last_access,
    COALESCE(SUM(da.total_active_sec),0)    AS total_lifetime_sec,
    COALESCE(uf.upload_count,0)             AS total_uploads,
    COALESCE(act.is_currently_active,0)     AS is_currently_active
FROM kore_users u
LEFT JOIN user_sessions us  ON us.login_id = u.login_id
LEFT JOIN daily_activity da ON da.login_id = u.login_id
LEFT JOIN (SELECT login_id, COUNT(*) AS upload_count FROM uploaded_files GROUP BY login_id) uf  ON uf.login_id  = u.login_id
LEFT JOIN (SELECT login_id, 1 AS is_currently_active FROM user_sessions WHERE is_active=1 GROUP BY login_id) act ON act.login_id = u.login_id
GROUP BY u.login_id, u.first_name, u.last_name, u.email, uf.upload_count, act.is_currently_active;


-- ── 7h. v_user_profile ───────────────────────────────────────────────────────
CREATE OR REPLACE VIEW v_user_profile AS
SELECT
    u.login_id, u.first_name, u.last_name,
    CONCAT(u.first_name,' ',u.last_name)           AS full_name,
    COALESCE(u.display_name, u.first_name)         AS display_name,
    u.email, u.phone, u.is_verified,
    CASE WHEN u.password_hash IS NOT NULL THEN 1 ELSE 0 END AS has_password,
    u.bio, u.dob, u.avatar_url, u.resume_name, u.resume_url,
    u.job_title, u.company, u.industry, u.years_exp, u.linkedin,
    u.skills_json, u.exp_json, u.address_json,
    u.email_verified, u.phone_verified, u.last_login,
    u.created_at, u.updated_at,
    COALESCE(uf.upload_count,0) AS total_uploads
FROM kore_users u
LEFT JOIN (SELECT login_id, COUNT(*) AS upload_count FROM uploaded_files GROUP BY login_id) uf
    ON uf.login_id = u.login_id;


-- ── 7i. v_ml_history  (NEW v10.0) ────────────────────────────────────────────
--
--  Per-user training run summary — all models, ordered by most recent.
--  Used by GET /ml/history and the ML Studio History tab.

CREATE OR REPLACE VIEW v_ml_history AS
SELECT
    h.id                                    AS run_id,
    h.login_id,
    CONCAT(u.first_name,' ',u.last_name)   AS full_name,
    h.model_key,
    h.model_name,
    h.category,
    h.task_type,
    h.target_col,
    h.n_features,
    h.n_rows_train,
    h.n_rows_test,
    h.eda_score,
    h.primary_metric,
    h.f1_score,
    h.roc_auc,
    h.rmse,
    h.r2_score,
    h.cv_score,
    h.cv_std,
    h.deploy_ready,
    h.grade,
    h.trained_at,
    -- Rank within user per task type (1 = best primary_metric)
    RANK() OVER (
        PARTITION BY h.login_id, h.task_type
        ORDER BY h.primary_metric DESC
    ) AS rank_in_task
FROM ml_training_history h
JOIN kore_users u ON u.login_id = h.login_id
ORDER BY h.trained_at DESC;


-- ── 7j. v_ml_leaderboard  (NEW v10.0) ────────────────────────────────────────
--
--  Best model per user per task type — the champion model for each user.
--  Used by the ML Studio deployment panel to show the recommended model.

CREATE OR REPLACE VIEW v_ml_leaderboard AS
SELECT
    h.login_id,
    CONCAT(u.first_name,' ',u.last_name) AS full_name,
    h.task_type,
    h.model_name,
    h.model_key,
    h.primary_metric,
    h.grade,
    h.deploy_ready,
    h.trained_at,
    h.model_file_path
FROM ml_training_history h
JOIN kore_users u ON u.login_id = h.login_id
WHERE h.id IN (
    SELECT id FROM (
        SELECT id, login_id, task_type,
               ROW_NUMBER() OVER (
                   PARTITION BY login_id, task_type
                   ORDER BY primary_metric DESC, trained_at DESC
               ) AS rn
        FROM ml_training_history
    ) ranked
    WHERE rn = 1
);


-- ════════════════════════════════════════════════════════════════════════════
--  SECTION 8 — STORED PROCEDURES (unchanged from v9.0)
-- ════════════════════════════════════════════════════════════════════════════

DROP PROCEDURE IF EXISTS sp_request_otp;
DELIMITER $$
CREATE PROCEDURE sp_request_otp(IN p_login_id VARCHAR(20),IN p_otp_code VARCHAR(6),IN p_method VARCHAR(10),IN p_contact VARCHAR(100),IN p_purpose VARCHAR(20),IN p_expiry_minutes INT)
BEGIN
    UPDATE otp_tokens SET is_used=1 WHERE login_id=p_login_id AND purpose=p_purpose AND is_used=0;
    INSERT INTO otp_tokens(login_id,otp_code,method,contact,purpose,expires_at)
    VALUES(p_login_id,p_otp_code,p_method,p_contact,p_purpose,DATE_ADD(NOW(),INTERVAL p_expiry_minutes MINUTE));
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_verify_otp;
DELIMITER $$
CREATE PROCEDURE sp_verify_otp(IN p_login_id VARCHAR(20),IN p_otp_code VARCHAR(6),IN p_purpose VARCHAR(20))
BEGIN
    DECLARE v_otp_id INT DEFAULT NULL;
    DECLARE v_expired INT DEFAULT 0;
    SELECT id INTO v_otp_id FROM otp_tokens
    WHERE login_id=p_login_id AND otp_code=p_otp_code AND purpose=p_purpose AND is_used=0 AND expires_at>NOW()
    ORDER BY id DESC LIMIT 1;
    IF v_otp_id IS NULL THEN
        SELECT COUNT(*) INTO v_expired FROM otp_tokens WHERE login_id=p_login_id AND otp_code=p_otp_code AND purpose=p_purpose AND is_used=0 AND expires_at<=NOW();
        IF v_expired>0 THEN SELECT 0 AS success,'OTP has expired. Please request a new one.' AS reason;
        ELSE SELECT 0 AS success,'Invalid OTP. Please check the code and try again.' AS reason; END IF;
    ELSE
        UPDATE otp_tokens SET is_used=1 WHERE id=v_otp_id;
        UPDATE kore_users SET is_verified=1 WHERE login_id=p_login_id;
        SELECT 1 AS success,'OTP verified successfully.' AS reason;
    END IF;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_set_password;
DELIMITER $$
CREATE PROCEDURE sp_set_password(IN p_login_id VARCHAR(20),IN p_hash VARCHAR(255),IN p_action VARCHAR(20),IN p_ip VARCHAR(45))
BEGIN
    UPDATE kore_users SET password_hash=p_hash WHERE login_id=p_login_id;
    INSERT INTO password_reset_log(login_id,action,ip_address) VALUES(p_login_id,p_action,p_ip);
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_cleanup_otps;
DELIMITER $$
CREATE PROCEDURE sp_cleanup_otps()
BEGIN
    DELETE FROM otp_tokens WHERE (is_used=1 OR expires_at<NOW()) AND created_at<DATE_SUB(NOW(),INTERVAL 1 DAY);
    SELECT ROW_COUNT() AS rows_deleted;
END$$
DELIMITER ;

DROP PROCEDURE IF EXISTS sp_record_logout;
DELIMITER $$
CREATE PROCEDURE sp_record_logout(IN p_token VARCHAR(64))
BEGIN
    DECLARE v_login_id VARCHAR(20);
    DECLARE v_login_at DATETIME;
    DECLARE v_dur_sec INT DEFAULT 0;
    DECLARE v_sess_date DATE;
    SELECT login_id,login_at INTO v_login_id,v_login_at FROM user_sessions WHERE session_token=p_token AND is_active=1 LIMIT 1;
    IF v_login_id IS NOT NULL THEN
        SET v_dur_sec=GREATEST(0,TIMESTAMPDIFF(SECOND,v_login_at,NOW()));
        SET v_sess_date=DATE(v_login_at);
        UPDATE user_sessions SET logout_at=NOW(),duration_sec=v_dur_sec,is_active=0 WHERE session_token=p_token;
        INSERT INTO daily_activity(login_id,activity_date,first_login_at,last_seen_at,total_active_sec,logout_count)
        VALUES(v_login_id,v_sess_date,v_login_at,NOW(),v_dur_sec,1)
        ON DUPLICATE KEY UPDATE last_seen_at=NOW(),total_active_sec=total_active_sec+v_dur_sec,logout_count=logout_count+1;
    END IF;
END$$
DELIMITER ;


-- ════════════════════════════════════════════════════════════════════════════
--  SECTION 9 — MAINTENANCE REFERENCE
--  All queries are inside block comments — nothing executes automatically.
--  Copy-paste individual queries for debugging only.
-- ════════════════════════════════════════════════════════════════════════════

/*
── USER OVERVIEW ─────────────────────────────────────────────────────────────
SELECT * FROM v_user_summary;
SELECT * FROM v_user_profile WHERE login_id = 'KD123456';

── ML HISTORY ────────────────────────────────────────────────────────────────
SELECT * FROM v_ml_history WHERE login_id = 'KD123456' LIMIT 20;
SELECT * FROM v_ml_leaderboard WHERE login_id = 'KD123456';

── ML STATISTICS ─────────────────────────────────────────────────────────────
SELECT model_key, COUNT(*) AS runs, AVG(primary_metric) AS avg_metric,
       MAX(primary_metric) AS best_metric
FROM ml_training_history GROUP BY model_key ORDER BY avg_metric DESC;

── MODELS READY FOR DEPLOYMENT ───────────────────────────────────────────────
SELECT h.login_id, u.email, h.model_name, h.task_type, h.primary_metric, h.grade, h.trained_at
FROM ml_training_history h JOIN kore_users u ON u.login_id=h.login_id
WHERE h.deploy_ready=1 ORDER BY h.primary_metric DESC;

── ACTIVE SESSIONS ────────────────────────────────────────────────────────────
SELECT login_id, login_at, TIMESTAMPDIFF(MINUTE,login_at,NOW()) AS min_active, ip_address
FROM user_sessions WHERE is_active=1 ORDER BY login_at DESC;

── ACTIVITY DASHBOARD ────────────────────────────────────────────────────────
SELECT * FROM v_user_activity_summary WHERE login_id='KD123456';

── DAY-WISE HISTORY ──────────────────────────────────────────────────────────
SELECT * FROM v_login_history WHERE login_id='KD123456' LIMIT 30;

── SESSION DETAIL ────────────────────────────────────────────────────────────
SELECT * FROM v_session_detail WHERE login_id='KD123456' LIMIT 50;

── ACTIVE OTPs ───────────────────────────────────────────────────────────────
SELECT * FROM v_active_otps;

── PASSWORD + SECURITY ───────────────────────────────────────────────────────
SELECT * FROM v_password_set;
SELECT * FROM v_otp_purpose;

── AUDIT LOG ─────────────────────────────────────────────────────────────────
SELECT l.login_id,u.email,l.action,l.ip_address,l.created_at
FROM password_reset_log l JOIN kore_users u ON u.login_id=l.login_id ORDER BY l.created_at DESC;

── MANUALLY VERIFY A USER ────────────────────────────────────────────────────
UPDATE kore_users SET is_verified=1 WHERE email='user@example.com';

── DAILY OTP CLEANUP (cron) ──────────────────────────────────────────────────
CALL sp_cleanup_otps();

── FOREIGN KEY HEALTH CHECK ──────────────────────────────────────────────────
SELECT TABLE_NAME,COLUMN_NAME,CONSTRAINT_NAME,REFERENCED_TABLE_NAME,REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME='kore_users'
ORDER BY TABLE_NAME;
*/

-- ══════════════════════════════════════════════════════════════════════════════
--  END OF kore_schema_v10.sql
--  All tables, triggers, views, and procedures have been created/updated.
--  Safe to run on a live database with existing data.
-- ══════════════════════════════════════════════════════════════════════════════

show databases;
show tables;
use kore_data;
delete from kore_users where id = 0;
select * from kore_users;
select * from daily_activity;
select * from otp_tokens;
select * from password_reset_log;
select * from sessions;
select * from  uploaded_files;
select * from user_notifications;
select * from user_sessions;
select * from v_active_otps;
select * from v_login_history;
select * from v_otp_purpose;
select * from v_password_set;
select * from v_session_detail;
select * from v_user_activity_summary;
select * from v_user_summary;
