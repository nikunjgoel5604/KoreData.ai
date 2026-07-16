-- ══════════════════════════════════════════════════════════════════════
--  account_schema.sql — Kore_data-ex  Account System Additions  v1.0
--
--  Run AFTER schema.sql:
--    mysql -u root -p kore_data < account_schema.sql
--
--  SAFE for live databases:
--    All ALTER TABLE statements use IF NOT EXISTS guards via stored
--    procedures so existing data is never touched.
-- ══════════════════════════════════════════════════════════════════════

USE kore_data;

-- ─── Add extended profile columns to kore_users ───────────────────────

DROP PROCEDURE IF EXISTS _acct_migrate;

DELIMITER $$
CREATE PROCEDURE _acct_migrate()
BEGIN

  -- display_name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'kore_users' AND COLUMN_NAME = 'display_name'
  ) THEN
    ALTER TABLE kore_users ADD COLUMN display_name VARCHAR(80) NULL DEFAULT NULL AFTER last_name;
  END IF;

  -- bio
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'kore_users' AND COLUMN_NAME = 'bio'
  ) THEN
    ALTER TABLE kore_users ADD COLUMN bio TEXT NULL DEFAULT NULL;
  END IF;

  -- dob
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'kore_users' AND COLUMN_NAME = 'dob'
  ) THEN
    ALTER TABLE kore_users ADD COLUMN dob DATE NULL DEFAULT NULL;
  END IF;

  -- avatar_url
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'kore_users' AND COLUMN_NAME = 'avatar_url'
  ) THEN
    ALTER TABLE kore_users ADD COLUMN avatar_url VARCHAR(255) NULL DEFAULT NULL;
  END IF;

  -- resume_name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'kore_users' AND COLUMN_NAME = 'resume_name'
  ) THEN
    ALTER TABLE kore_users ADD COLUMN resume_name VARCHAR(255) NULL DEFAULT NULL;
  END IF;

  -- resume_url
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'kore_users' AND COLUMN_NAME = 'resume_url'
  ) THEN
    ALTER TABLE kore_users ADD COLUMN resume_url VARCHAR(255) NULL DEFAULT NULL;
  END IF;

  -- job_title
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'kore_users' AND COLUMN_NAME = 'job_title'
  ) THEN
    ALTER TABLE kore_users ADD COLUMN job_title VARCHAR(100) NULL DEFAULT NULL;
  END IF;

  -- company
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'kore_users' AND COLUMN_NAME = 'company'
  ) THEN
    ALTER TABLE kore_users ADD COLUMN company VARCHAR(100) NULL DEFAULT NULL;
  END IF;

  -- industry
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'kore_users' AND COLUMN_NAME = 'industry'
  ) THEN
    ALTER TABLE kore_users ADD COLUMN industry VARCHAR(80) NULL DEFAULT NULL;
  END IF;

  -- years_exp
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'kore_users' AND COLUMN_NAME = 'years_exp'
  ) THEN
    ALTER TABLE kore_users ADD COLUMN years_exp VARCHAR(30) NULL DEFAULT NULL;
  END IF;

  -- linkedin
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'kore_users' AND COLUMN_NAME = 'linkedin'
  ) THEN
    ALTER TABLE kore_users ADD COLUMN linkedin VARCHAR(255) NULL DEFAULT NULL;
  END IF;

  -- skills_json (JSON array of strings)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'kore_users' AND COLUMN_NAME = 'skills_json'
  ) THEN
    ALTER TABLE kore_users ADD COLUMN skills_json TEXT NULL DEFAULT NULL
      COMMENT 'JSON array of skill strings';
  END IF;

  -- exp_json (JSON array of experience objects)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'kore_users' AND COLUMN_NAME = 'exp_json'
  ) THEN
    ALTER TABLE kore_users ADD COLUMN exp_json TEXT NULL DEFAULT NULL
      COMMENT 'JSON array: [{company, role, start, end}]';
  END IF;

  -- address_json (JSON object)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'kore_users' AND COLUMN_NAME = 'address_json'
  ) THEN
    ALTER TABLE kore_users ADD COLUMN address_json TEXT NULL DEFAULT NULL
      COMMENT 'JSON object: {street, city, state, zip, country}';
  END IF;

  -- email_verified
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'kore_users' AND COLUMN_NAME = 'email_verified'
  ) THEN
    ALTER TABLE kore_users ADD COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 0;
  END IF;

  -- phone_verified
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'kore_users' AND COLUMN_NAME = 'phone_verified'
  ) THEN
    ALTER TABLE kore_users ADD COLUMN phone_verified TINYINT(1) NOT NULL DEFAULT 0;
  END IF;

  -- last_login
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'kore_users' AND COLUMN_NAME = 'last_login'
  ) THEN
    ALTER TABLE kore_users ADD COLUMN last_login DATETIME NULL DEFAULT NULL;
  END IF;

END$$
DELIMITER ;

CALL _acct_migrate();
DROP PROCEDURE IF EXISTS _acct_migrate;


-- ─── user_activity table ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_activity (
  id         INT          NOT NULL AUTO_INCREMENT,
  login_id   VARCHAR(20)  NOT NULL,
  action     VARCHAR(60)  NOT NULL,
  ip_address VARCHAR(45)  NULL DEFAULT NULL,
  device     VARCHAR(120) NULL DEFAULT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  CONSTRAINT fk_activity_user
    FOREIGN KEY (login_id) REFERENCES kore_users(login_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_act_user (login_id),
  INDEX idx_act_time (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Stores login / profile-change audit trail per user.';


-- ─── Trigger: update last_login on session INSERT ─────────────────────

DROP TRIGGER IF EXISTS trg_update_last_login;

DELIMITER $$
CREATE TRIGGER trg_update_last_login
AFTER INSERT ON sessions
FOR EACH ROW
BEGIN
  UPDATE kore_users SET last_login = NOW() WHERE login_id = NEW.login_id;
END$$
DELIMITER ;


-- ─── View: full user profile ──────────────────────────────────────────

CREATE OR REPLACE VIEW v_user_profile AS
SELECT
    u.id,
    u.login_id,
    CONCAT(u.first_name, ' ', COALESCE(u.last_name, ''))  AS full_name,
    u.first_name,
    u.last_name,
    COALESCE(u.display_name, u.first_name)                 AS display_name,
    u.email,
    u.phone,
    u.dob,
    u.bio,
    u.avatar_url,
    u.job_title,
    u.company,
    u.industry,
    u.years_exp,
    u.linkedin,
    u.resume_name,
    u.skills_json,
    u.exp_json,
    u.address_json,
    u.is_verified,
    u.email_verified,
    u.phone_verified,
    CASE WHEN u.password_hash IS NOT NULL THEN 1 ELSE 0 END AS has_password,
    u.last_login,
    u.created_at,
    (SELECT COUNT(*) FROM uploaded_files f WHERE f.login_id = u.login_id) AS total_uploads
FROM kore_users u;
