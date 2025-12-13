-- ============================================================================
-- Account System Phase 7: Admin RBAC + Feature Flags + Audit Logs
-- Migration: account-system-phase7-admin-rbac-and-audit.sql
-- 
-- This migration creates tables for:
-- 1. Multi-role support with expiry (user_roles)
-- 2. Per-user feature flags (user_feature_flags)
-- 3. Immutable admin audit logs (admin_audit_logs)
--
-- All changes are additive and non-destructive.
-- Legacy fields (User.role, User.featureFlags JSON) remain for compatibility.
-- ============================================================================

SET @dbname = DATABASE();
SET @tablename = 'User';

-- ============================================================================
-- STEP 1: Create user_roles table (multi-role support with expiry)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `user_roles` (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  role VARCHAR(50) NOT NULL COMMENT 'Role name: FOUNDER, CORE_TEAM, ADMIN, MODERATOR, CREATOR, STANDARD_USER',
  assigned_by BIGINT UNSIGNED NULL COMMENT 'Admin user ID who assigned this role',
  assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP NULL DEFAULT NULL COMMENT 'Role expiration timestamp (NULL = permanent)',
  INDEX idx_user_id (user_id),
  INDEX idx_role (role),
  INDEX idx_expires_at (expires_at),
  INDEX idx_user_role (user_id, role),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES `User`(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_roles_assigned_by FOREIGN KEY (assigned_by) REFERENCES `User`(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- STEP 2: Create user_feature_flags table (per-user feature flags)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `user_feature_flags` (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id BIGINT UNSIGNED NOT NULL,
  flag VARCHAR(100) NOT NULL COMMENT 'Feature flag name (e.g., ENABLE_ADVANCED_ANALYTICS)',
  enabled TINYINT(1) NOT NULL DEFAULT 0 COMMENT '0 = disabled, 1 = enabled',
  updated_by BIGINT UNSIGNED NULL COMMENT 'Admin user ID who updated this flag',
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_user_flag (user_id, flag),
  INDEX idx_user_id (user_id),
  INDEX idx_flag (flag),
  INDEX idx_enabled (enabled),
  CONSTRAINT fk_user_feature_flags_user FOREIGN KEY (user_id) REFERENCES `User`(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_feature_flags_updated_by FOREIGN KEY (updated_by) REFERENCES `User`(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- STEP 3: Create admin_audit_logs table (immutable admin action logs)
-- ============================================================================

CREATE TABLE IF NOT EXISTS `admin_audit_logs` (
  id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  actor_id BIGINT UNSIGNED NOT NULL COMMENT 'Admin user ID who performed the action',
  actor_role VARCHAR(50) NOT NULL COMMENT 'Role of actor at time of action',
  action VARCHAR(100) NOT NULL COMMENT 'Action type (e.g., ROLE_UPDATED, STATUS_UPDATED, FEATURE_FLAG_UPDATED, ACCESS_DENIED)',
  target_type VARCHAR(50) NULL COMMENT 'Target entity type (e.g., USER, CONTENT, SYSTEM)',
  target_id VARCHAR(255) NULL COMMENT 'Target entity ID (can be user ID, content ID, etc.)',
  metadata JSON NULL COMMENT 'Action metadata including before/after state',
  ip_address VARCHAR(45) NULL COMMENT 'IP address of request',
  user_agent TEXT NULL COMMENT 'User agent string',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_actor_id (actor_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at),
  INDEX idx_target (target_type, target_id),
  INDEX idx_actor_created (actor_id, created_at DESC),
  CONSTRAINT fk_admin_audit_logs_actor FOREIGN KEY (actor_id) REFERENCES `User`(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- Migration Complete
-- ============================================================================
-- 
-- Tables created:
-- ✅ user_roles - Multi-role support with expiry
-- ✅ user_feature_flags - Per-user feature flags
-- ✅ admin_audit_logs - Immutable admin action audit trail
--
-- Legacy compatibility:
-- ✅ User.role column remains (fallback for single-role)
-- ✅ User.featureFlags JSON column remains (merged with table flags)
--
-- ============================================================================
