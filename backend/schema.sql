-- ══════════════════════════════════════════════════════════════════════════════
--  schema.sql — Kore_data-ex  v7.0
--  Run: mysql -u root -p kore_data < schema.sql
--
--  CHANGES vs v5.1
--  ─────────────────────────────────────────────────────────────────────────────
--  v6.0  Added user_notifications table
--
--  v7.0  Password system — OTP-verified password auth
--        ┌──────────────────────────────────────────────────────────────────┐
--        │  SAFE FOR LIVE DATABASE                                          │
--        │  Existing users will NOT be touched.                            │
--        │  All ALTER TABLE statements use IF NOT EXISTS guards.           │
--        └──────────────────────────────────────────────────────────────────┘
--
--  TABLE CHANGES
--    · kore_users  — ADD COLUMN password_hash VARCHAR(255) NULL
--    · otp_tokens  — ADD COLUMN purpose ENUM(...) DEFAULT 'login'
--
--  NEW TABLES
--    · user_notifications  (v6.0)
--    · password_reset_log  (v7.0 — audit trail)
--
--  NEW VIEWS
--    · v_active_otps   — updated to include purpose + seconds_remaining
--    · v_user_summary  — updated to include has_password flag
--    · v_password_set  — users who have set a password
--    · v_otp_purpose   — active OTP count grouped by purpose
--
--  NEW STORED PROCEDURES
--    · sp_request_otp(login_id, otp, method, contact, purpose, expiry_min)
--    · sp_verify_otp(login_id, otp, purpose)
--    · sp_set_password(login_id, hash, action, ip)
--    · sp_login_password(email)
--    · sp_forgot_password(email)
--    · sp_resend_otp(login_id, new_otp, purpose, expiry_min)
--    · sp_cleanup_otps()
--
--  RETAINED from v5.1
--    · No SET GLOBAL event_scheduler (no Railway SUPER privilege needed)
--    · GROUP BY includes all non-aggregated columns (ONLY_FULL_GROUP_BY safe)
--    · No diagnostic show databases / show tables / stray DELETEs
-- ══════════════════════════════════════════════════════════════════════════════

CREATE DATABASE IF NOT EXISTS kore_data
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE kore_data;
show tables;
select * from kore_users;
delete from kore_users where id = 5;


-- ════════════════════════════════════════════════════════════════════════════
--  SECTION 1 — TABLES
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1. USERS ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS kore_users (
  id            INT           NOT NULL AUTO_INCREMENT,
  login_id      VARCHAR(20)   NOT NULL,
  first_name    VARCHAR(50)   NOT NULL,
  last_name     VARCHAR(50)   DEFAULT '',
  email         VARCHAR(100)  NOT NULL,
  phone         VARCHAR(20)   NOT NULL,
  is_verified   TINYINT(1)    NOT NULL DEFAULT 0,
  password_hash VARCHAR(255)  NULL     DEFAULT NULL
                COMMENT 'bcrypt hash — NULL means OTP-only, no password set yet',
  created_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                                ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_login_id (login_id),
  UNIQUE KEY uq_email    (email),
  UNIQUE KEY uq_phone    (phone),
  INDEX idx_verified     (is_verified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='Core users. password_hash=NULL means OTP-only account.';


-- ── LIVE MIGRATION: add password_hash to existing kore_users ─────────────────
--  Safe on live DB — checks information_schema before altering.
--  Existing rows get password_hash = NULL (OTP-only, no data loss).

DROP PROCEDURE IF EXISTS _migrate_add_password_hash;

DELIMITER $$
CREATE PROCEDURE _migrate_add_password_hash()
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   information_schema.COLUMNS
    WHERE  TABLE_SCHEMA = DATABASE()
      AND  TABLE_NAME   = 'kore_users'
      AND  COLUMN_NAME  = 'password_hash'
  ) THEN
    ALTER TABLE kore_users
      ADD COLUMN password_hash VARCHAR(255) NULL DEFAULT NULL
        COMMENT 'bcrypt hash — NULL means OTP-only, no password set yet'
      AFTER is_verified;
  END IF;
END$$
DELIMITER ;

CALL _migrate_add_password_hash();
DROP PROCEDURE IF EXISTS _migrate_add_password_hash;


-- ── 2. OTP TOKENS ─────────────────────────────────────────────────────────────
--  v7.0: added `purpose` column to track WHY each OTP was issued.
--  purpose = 'login'          → OTP-based login
--  purpose = 'register'       → new account verification
--  purpose = 'set_password'   → user adding a password to their account
--  purpose = 'reset_password' → forgot password recovery

CREATE TABLE IF NOT EXISTS otp_tokens (
  id         INT          NOT NULL AUTO_INCREMENT,
  login_id   VARCHAR(20)  NOT NULL,
  otp_code   VARCHAR(6)   NOT NULL,
  method     ENUM('email','phone')
                          NOT NULL DEFAULT 'email',
  contact    VARCHAR(100) NOT NULL,
  purpose    ENUM('login','register','set_password','reset_password')
                          NOT NULL DEFAULT 'login'
                          COMMENT 'v7.0 — why this OTP was issued',
  expires_at DATETIME     NOT NULL,
  is_used    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  CONSTRAINT fk_otp_user
    FOREIGN KEY (login_id) REFERENCES kore_users(login_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_login_active (login_id, is_used),
  INDEX idx_expires      (expires_at),
  INDEX idx_purpose      (purpose, is_used)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  COMMENT='OTP tokens for all auth flows. Default purpose=login keeps old rows valid.';


-- ── LIVE MIGRATION: add purpose column to existing otp_tokens ────────────────

DROP PROCEDURE IF EXISTS _migrate_add_otp_purpose;

DELIMITER $$
CREATE PROCEDURE _migrate_add_otp_purpose()
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM   information_schema.COLUMNS
    WHERE  TABLE_SCHEMA = DATABASE()
      AND  TABLE_NAME   = 'otp_tokens'
      AND  COLUMN_NAME  = 'purpose'
  ) THEN
    ALTER TABLE otp_tokens
      ADD COLUMN purpose ENUM('login','register','set_password','reset_password')
        NOT NULL DEFAULT 'login'
        COMMENT 'v7.0 — why this OTP was issued'
      AFTER contact;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM   information_schema.STATISTICS
    WHERE  TABLE_SCHEMA = DATABASE()
      AND  TABLE_NAME   = 'otp_tokens'
      AND  INDEX_NAME   = 'idx_purpose'
  ) THEN
    CREATE INDEX idx_purpose ON otp_tokens (purpose, is_used);
  END IF;
END$$
DELIMITER ;

CALL _migrate_add_otp_purpose();
DROP PROCEDURE IF EXISTS _migrate_add_otp_purpose;


-- ── 3. SESSIONS ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS sessions (
  id         INT         NOT NULL AUTO_INCREMENT,
  token      VARCHAR(64) NOT NULL UNIQUE,
  login_id   VARCHAR(20) NOT NULL,
  created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME    NOT NULL,

  PRIMARY KEY (id),
  CONSTRAINT fk_session_user
    FOREIGN KEY (login_id) REFERENCES kore_users(login_id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_session_token (token),
  INDEX idx_session_login (login_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ── 4. UPLOADED FILES ────────────────────────────────────────────────────────

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ── 5. USER NOTIFICATIONS ─────────────────────────────────────────────────────
--  Added v6.0. Unchanged in v7.0.

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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ── 6. PASSWORD RESET LOG ─────────────────────────────────────────────────────
--  v7.0 NEW. Audit trail — does NOT affect login logic.

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
  COMMENT='Audit log: every password set or reset with timestamp and optional IP.';


-- ════════════════════════════════════════════════════════════════════════════
--  SECTION 2 — VIEWS
-- ════════════════════════════════════════════════════════════════════════════

-- ── v_active_otps ─────────────────────────────────────────────────────────────
--  All unexpired, unused OTP tokens. Includes purpose + seconds_remaining.

CREATE OR REPLACE VIEW v_active_otps AS
SELECT
    t.id,
    t.login_id,
    u.email,
    u.phone,
    t.method,
    t.contact,
    t.otp_code,
    t.purpose,
    t.expires_at,
    t.created_at,
    TIMESTAMPDIFF(SECOND, NOW(), t.expires_at) AS seconds_remaining
FROM otp_tokens t
JOIN kore_users u ON u.login_id = t.login_id
WHERE t.is_used    = 0
  AND t.expires_at > NOW();


-- ── v_user_summary ────────────────────────────────────────────────────────────
--  Per-user upload stats + has_password flag.
--  GROUP BY includes ALL non-aggregated columns (ONLY_FULL_GROUP_BY safe).

CREATE OR REPLACE VIEW v_user_summary AS
SELECT
    u.id,
    u.login_id,
    CONCAT(u.first_name, ' ', u.last_name)        AS full_name,
    u.email,
    u.phone,
    u.is_verified,
    CASE WHEN u.password_hash IS NOT NULL
         THEN 1 ELSE 0 END                         AS has_password,
    u.created_at,
    COUNT(f.id)                                    AS total_uploads,
    MAX(f.uploaded_at)                             AS last_upload
FROM kore_users u
LEFT JOIN uploaded_files f ON f.login_id = u.login_id
GROUP BY
    u.id,
    u.login_id,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    u.is_verified,
    u.password_hash,
    u.created_at;


-- ── v_password_set ────────────────────────────────────────────────────────────
--  v7.0 NEW. Quick list of users who have a password configured.

CREATE OR REPLACE VIEW v_password_set AS
SELECT
    login_id,
    CONCAT(first_name, ' ', last_name) AS full_name,
    email,
    phone,
    is_verified,
    created_at
FROM kore_users
WHERE password_hash IS NOT NULL;


-- ── v_otp_purpose ─────────────────────────────────────────────────────────────
--  v7.0 NEW. Count of currently active OTPs grouped by purpose.

CREATE OR REPLACE VIEW v_otp_purpose AS
SELECT
    purpose,
    method,
    COUNT(*)          AS active_count,
    MIN(expires_at)   AS earliest_expiry,
    MAX(created_at)   AS latest_issued
FROM otp_tokens
WHERE is_used    = 0
  AND expires_at > NOW()
GROUP BY purpose, method;


-- ════════════════════════════════════════════════════════════════════════════
--  SECTION 3 — STORED PROCEDURES
--  All use DROP + CREATE so re-running this file is always safe.
-- ════════════════════════════════════════════════════════════════════════════

-- ── sp_request_otp ────────────────────────────────────────────────────────────
--  Invalidates active OTPs for (login_id + purpose) then inserts a new one.

DROP PROCEDURE IF EXISTS sp_request_otp;

DELIMITER $$
CREATE PROCEDURE sp_request_otp (
  IN p_login_id       VARCHAR(20),
  IN p_otp_code       VARCHAR(6),
  IN p_method         VARCHAR(10),
  IN p_contact        VARCHAR(100),
  IN p_purpose        VARCHAR(20),
  IN p_expiry_minutes INT
)
BEGIN
  UPDATE otp_tokens
  SET    is_used = 1
  WHERE  login_id = p_login_id
    AND  purpose  = p_purpose
    AND  is_used  = 0;

  INSERT INTO otp_tokens
    (login_id, otp_code, method, contact, purpose, expires_at)
  VALUES
    (
      p_login_id,
      p_otp_code,
      p_method,
      p_contact,
      p_purpose,
      DATE_ADD(NOW(), INTERVAL p_expiry_minutes MINUTE)
    );
END$$
DELIMITER ;


-- ── sp_verify_otp ─────────────────────────────────────────────────────────────
--  Verifies an OTP for a specific purpose.
--  On success: marks OTP used + marks user verified.
--  Returns: success TINYINT (1/0) + reason VARCHAR.

DROP PROCEDURE IF EXISTS sp_verify_otp;

DELIMITER $$
CREATE PROCEDURE sp_verify_otp (
  IN p_login_id  VARCHAR(20),
  IN p_otp_code  VARCHAR(6),
  IN p_purpose   VARCHAR(20)
)
BEGIN
  DECLARE v_otp_id  INT DEFAULT NULL;
  DECLARE v_expired INT DEFAULT 0;

  SELECT id
  INTO   v_otp_id
  FROM   otp_tokens
  WHERE  login_id   = p_login_id
    AND  otp_code   = p_otp_code
    AND  purpose    = p_purpose
    AND  is_used    = 0
    AND  expires_at > NOW()
  ORDER  BY id DESC
  LIMIT  1;

  IF v_otp_id IS NULL THEN
    SELECT COUNT(*) INTO v_expired
    FROM   otp_tokens
    WHERE  login_id    = p_login_id
      AND  otp_code    = p_otp_code
      AND  purpose     = p_purpose
      AND  is_used     = 0
      AND  expires_at <= NOW();

    IF v_expired > 0 THEN
      SELECT 0 AS success, 'OTP has expired. Please request a new one.' AS reason;
    ELSE
      SELECT 0 AS success, 'Invalid OTP. Please check the code and try again.' AS reason;
    END IF;
  ELSE
    UPDATE otp_tokens SET is_used = 1 WHERE id = v_otp_id;
    UPDATE kore_users SET is_verified = 1 WHERE login_id = p_login_id;
    SELECT 1 AS success, 'OTP verified successfully.' AS reason;
  END IF;
END$$
DELIMITER ;


-- ── sp_set_password ───────────────────────────────────────────────────────────
--  Saves a bcrypt hash + writes an audit log entry.
--  Called by Python AFTER sp_verify_otp returns success=1.

DROP PROCEDURE IF EXISTS sp_set_password;

DELIMITER $$
CREATE PROCEDURE sp_set_password (
  IN p_login_id  VARCHAR(20),
  IN p_hash      VARCHAR(255),
  IN p_action    VARCHAR(20),
  IN p_ip        VARCHAR(45)
)
BEGIN
  UPDATE kore_users
  SET    password_hash = p_hash
  WHERE  login_id      = p_login_id;

  INSERT INTO password_reset_log (login_id, action, ip_address)
  VALUES (p_login_id, p_action, p_ip);
END$$
DELIMITER ;


-- ── sp_login_password ─────────────────────────────────────────────────────────
--  Fetches the user row for a password login.
--  Python reads password_hash and calls bcrypt.checkpw() itself.

DROP PROCEDURE IF EXISTS sp_login_password;

DELIMITER $$
CREATE PROCEDURE sp_login_password (
  IN p_email VARCHAR(100)
)
BEGIN
  SELECT
      login_id,
      first_name,
      last_name,
      email,
      phone,
      is_verified,
      password_hash
  FROM  kore_users
  WHERE email = p_email
  LIMIT 1;
END$$
DELIMITER ;


-- ── sp_forgot_password ────────────────────────────────────────────────────────
--  Checks if email exists. Returns found flag + user info.
--  Python uses this before sending a reset OTP.

DROP PROCEDURE IF EXISTS sp_forgot_password;

DELIMITER $$
CREATE PROCEDURE sp_forgot_password (
  IN p_email VARCHAR(100)
)
BEGIN
  DECLARE v_login_id VARCHAR(20)  DEFAULT NULL;
  DECLARE v_email    VARCHAR(100) DEFAULT NULL;

  SELECT login_id, email
  INTO   v_login_id, v_email
  FROM   kore_users
  WHERE  email = p_email
  LIMIT  1;

  IF v_login_id IS NULL THEN
    SELECT 0    AS found,
           NULL AS login_id,
           NULL AS email,
           'Email ID not registered with us.' AS message;
  ELSE
    SELECT 1          AS found,
           v_login_id AS login_id,
           v_email    AS email,
           'Email found. OTP will be sent.' AS message;
  END IF;
END$$
DELIMITER ;


-- ── sp_resend_otp ─────────────────────────────────────────────────────────────
--  Resends an OTP by reusing the method + contact from the last OTP
--  for the same (login_id, purpose). Delegates to sp_request_otp.

DROP PROCEDURE IF EXISTS sp_resend_otp;

DELIMITER $$
CREATE PROCEDURE sp_resend_otp (
  IN p_login_id       VARCHAR(20),
  IN p_new_otp_code   VARCHAR(6),
  IN p_purpose        VARCHAR(20),
  IN p_expiry_minutes INT
)
BEGIN
  DECLARE v_method  VARCHAR(10)  DEFAULT 'email';
  DECLARE v_contact VARCHAR(100) DEFAULT NULL;

  SELECT method, contact
  INTO   v_method, v_contact
  FROM   otp_tokens
  WHERE  login_id = p_login_id
    AND  purpose  = p_purpose
  ORDER  BY id DESC
  LIMIT  1;

  IF v_contact IS NULL THEN
    SELECT email INTO v_contact
    FROM   kore_users
    WHERE  login_id = p_login_id;
    SET v_method = 'email';
  END IF;

  CALL sp_request_otp(
    p_login_id,
    p_new_otp_code,
    v_method,
    v_contact,
    p_purpose,
    p_expiry_minutes
  );
END$$
DELIMITER ;


-- ── sp_cleanup_otps ───────────────────────────────────────────────────────────
--  Purges old used/expired OTP rows older than 1 day.
--  Run daily via Railway Cron Job:
--    mysql -h $MYSQLHOST -u $MYSQLUSER -p$MYSQLPASSWORD $MYSQLDATABASE
--          -e "CALL sp_cleanup_otps();"

DROP PROCEDURE IF EXISTS sp_cleanup_otps;

DELIMITER $$
CREATE PROCEDURE sp_cleanup_otps()
BEGIN
  DELETE FROM otp_tokens
  WHERE (is_used = 1 OR expires_at < NOW())
    AND created_at < DATE_SUB(NOW(), INTERVAL 1 DAY);

  SELECT ROW_COUNT() AS rows_deleted;
END$$
DELIMITER ;


-- ════════════════════════════════════════════════════════════════════════════
--  SECTION 4 — MAINTENANCE REFERENCE
-- ════════════════════════════════════════════════════════════════════════════
--
--  DAILY OTP CLEANUP (Railway Cron Job):
--    CALL sp_cleanup_otps();
--
--  SEE WHICH USERS HAVE SET A PASSWORD:
--    SELECT * FROM v_password_set;
--
--  SEE ACTIVE OTPs BY PURPOSE:
--    SELECT * FROM v_otp_purpose;
--
--  SEE ALL ACTIVE OTPs (with seconds remaining):
--    SELECT * FROM v_active_otps;
--
--  SEE PASSWORD RESET AUDIT LOG:
--    SELECT l.login_id, u.email, l.action, l.ip_address, l.created_at
--    FROM   password_reset_log l
--    JOIN   kore_users u ON u.login_id = l.login_id
--    ORDER  BY l.created_at DESC;
--
--  MANUALLY VERIFY A USER (if needed):
--    UPDATE kore_users SET is_verified = 1 WHERE email = 'user@example.com';
--
-- ════════════════════════════════════════════════════════════════════════════
