-- User Activation and Terms & Conditions Schema
-- Run this migration to add account activation and terms acceptance features
-- 
-- IMPORTANT: This script uses MySQL-compatible syntax.
-- If columns already exist, you may see errors. Check column existence first if needed.
-- For production, consider wrapping each ALTER TABLE in a stored procedure that checks first.

-- Add status column to User table
-- Note: MySQL doesn't support IF NOT EXISTS in ALTER TABLE, so check manually if needed
ALTER TABLE User 
  ADD COLUMN status VARCHAR(50) NOT NULL DEFAULT 'pending_verification' 
    COMMENT 'Account status: pending_verification, active, disabled';

-- Add terms acceptance columns to User table
ALTER TABLE User 
  ADD COLUMN termsAccepted TINYINT(1) NOT NULL DEFAULT 0,
  ADD COLUMN termsAcceptedAt TIMESTAMP NULL DEFAULT NULL,
  ADD COLUMN termsVersion VARCHAR(20) NULL DEFAULT NULL 
    COMMENT 'Version of terms accepted (e.g., v1.0)',
  ADD COLUMN termsSource VARCHAR(50) NULL DEFAULT NULL 
    COMMENT 'Source of terms acceptance: email_password, google, x, linkedin, discord, github';

-- Add index on status for faster queries
-- Note: MySQL doesn't support IF NOT EXISTS for indexes, so check manually if needed
ALTER TABLE User ADD INDEX idx_user_status (status);

-- Create ActivationToken table for email verification
CREATE TABLE IF NOT EXISTS ActivationToken (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  userId BIGINT UNSIGNED NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE COMMENT 'Hashed activation token',
  used TINYINT(1) NOT NULL DEFAULT 0,
  expiresAt DATETIME NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_userId (userId),
  INDEX idx_expiresAt (expiresAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Update existing users to active status (they were created before activation was required)
-- This is safe to run multiple times
UPDATE User SET status = 'active' WHERE status IS NULL OR status = '';

