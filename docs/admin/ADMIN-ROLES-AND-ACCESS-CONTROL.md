# ADMIN-ROLES-AND-ACCESS-CONTROL.md
OGC NewFinity Platform — Admin Roles & Access Control (v1.0)

## 1. Purpose
This document defines the authoritative role taxonomy, permission model, access control logic, and accountability rules for the OGC NewFinity Admin Control Panel.

It governs who can access what, under which conditions, and how all actions are audited.

---

## 2. Admin Role Taxonomy

### 2.1 Core Roles

#### FOUNDER
- Absolute authority across the platform
- Cannot be overridden or restricted
- Holds all permissions and feature flags by default

#### CORE_TEAM
- Strategic and operational authority
- Can manage admins, systems, content, and integrations
- Cannot remove or override FOUNDER privileges

#### ADMIN
- Platform operations authority
- Manages users, moderation, content, and configuration
- Cannot manage founders or platform ownership settings

#### MODERATOR
- Community and content moderation authority
- Limited to enforcement, review, and reporting actions

#### CREATOR
- Content publishing and challenge-related permissions
- No administrative or enforcement authority

#### STANDARD_USER
- No admin access

---

## 3. Permission Matrix

### 3.1 Permission Categories
- USER_MANAGEMENT
- ROLE_MANAGEMENT
- CONTENT_PUBLISHING
- CONTENT_MODERATION
- SYSTEM_CONFIGURATION
- FEATURE_FLAG_CONTROL
- ANALYTICS_VIEW
- INTEGRATION_MANAGEMENT
- AUDIT_LOG_VIEW

### 3.2 Role → Permission Mapping (Conceptual)

| Role        | Core Permissions |
|------------|-----------------|
| FOUNDER    | All permissions |
| CORE_TEAM  | All except ownership transfer |
| ADMIN      | User, content, moderation, analytics |
| MODERATOR  | Moderation, limited analytics |
| CREATOR   | Content publishing |
| STANDARD  | None |

---

## 4. Feature Flags & Conditional Access

- Feature flags enable or disable specific capabilities per role or per user
- Flags may override default permissions temporarily
- Flags must always be auditable and reversible

Examples:
- ENABLE_ADVANCED_ANALYTICS
- ENABLE_BETA_ADMIN_MODULES
- ENABLE_EMERGENCY_ACTIONS

---

## 5. Temporary & Delegated Access

### 5.1 Time-Boxed Roles
- Roles may be assigned with an expiration timestamp
- Automatically revoked upon expiry
- Used for audits, incidents, or temporary assignments

### 5.2 Emergency Access
- Short-lived elevated permissions
- Requires explicit reason and approval
- Always logged and reviewed post-incident

---

## 6. Audit & Accountability Rules

### 6.1 Logged Actions
Every admin action must log:
- Actor (admin ID)
- Role at time of action
- Action type
- Target (user, content, system)
- Timestamp
- Metadata (before / after state)

### 6.2 Non-Repudiation
- Admin actions are immutable
- Logs cannot be edited or deleted
- Founders have read-only visibility into all logs

---

## 7. Enforcement Principles
- Access is denied by default
- Permissions must be explicit
- UI visibility does not imply authorization
- Backend enforcement is authoritative

---

## 8. Status
Document Status: Active  
Governance Level: Authoritative  
Change Model: Additive extensions only
