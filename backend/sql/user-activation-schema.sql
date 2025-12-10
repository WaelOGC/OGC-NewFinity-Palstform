-- User Activation and Terms & Conditions Schema
-- Run this migration to add account activation and terms acceptance features

-- Add new columns to User table
ALTER TABLE User 
  ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending_verification' 
    COMMENT 'Account status: pending_verification, active, disabled',
  ADD COLUMN IF NOT EXISTS termsAccepted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS termsAcceptedAt TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS termsVersion VARCHAR(20) NULL 
    COMMENT 'Version of terms accepted (e.g., v1.0)',
  ADD COLUMN IF NOT EXISTS termsSource VARCHAR(50) NULL 
    COMMENT 'Source of terms acceptance: email_password, google, x, linkedin, discord, github';

-- Add index on status for faster queries
ALTER TABLE User ADD INDEX IF NOT EXISTS idx_status (status);

-- Create ActivationToken table for email verification
CREATE TABLE IF NOT EXISTS ActivationToken (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  userId BIGINT UNSIGNED NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  used BOOLEAN DEFAULT FALSE,
  expiresAt TIMESTAMP NOT NULL,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  INDEX idx_token (token),
  INDEX idx_userId (userId),
  INDEX idx_expiresAt (expiresAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Update existing users to active status (they were created before activation was required)
UPDATE User SET status = 'active' WHERE status IS NULL OR status = '';

