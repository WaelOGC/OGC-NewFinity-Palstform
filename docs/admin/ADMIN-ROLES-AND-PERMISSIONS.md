# OGC NewFinity — Admin Roles and Permissions (Vision Document)

**Version:** v1.0

**Status:** Vision / Planning Document — Not Implemented

**Maintained by:** OGC Technologies

**Last Updated:** 2024

> **Note:** This document outlines the planned role system and permission structure for the Admin Control Panel. This is conceptual planning only — no implementation has begun.

---

## 1. Purpose

This document defines the planned role hierarchy and permission system for the OGC NewFinity Platform Admin Control Panel.

This vision document describes how different user roles will interact with administrative tools and what level of access each role will have.

---

## 2. Planned Role Hierarchy

### 2.1 Founder

**Conceptual Definition:** Platform founders and core decision-makers.

**Planned Capabilities:**
- Full access to all admin modules
- Platform-wide configuration changes
- Feature flag management and rollout control
- Strategic analytics and insights
- Financial oversight and token management
- Advanced system settings
- Role assignment and management
- Complete audit log access

**Visibility Scope:**
- All platform data and analytics
- All user information and activity
- All financial transactions
- All system configurations

**Status:** Planned / Not Implemented

---

### 2.2 Core Team

**Conceptual Definition:** Core team members with high-level operational responsibilities.

**Planned Capabilities:**
- Access to most admin modules (except some advanced configurations)
- User management and moderation
- Content publishing and management
- Analytics and reporting access
- Support workflow tools
- Feature flag viewing (limited modification)

**Visibility Scope:**
- Cross-user analytics
- User profiles and activity
- Content and submissions
- Support tickets and communications

**Status:** Planned / Not Implemented

---

### 2.3 Admin

**Conceptual Definition:** Full platform administrators with comprehensive operational access.

**Planned Capabilities:**
- User management (search, view, update roles, modify status)
- Content moderation and approval
- Challenge management
- Badge and contribution adjustments
- System logs access
- Analytics dashboards
- Notification management

**Visibility Scope:**
- All user data (except sensitive financial details)
- All content and submissions
- Moderation queues
- Activity logs
- Challenge data

**Status:** Planned / Not Implemented

---

### 2.4 Moderator

**Conceptual Definition:** Community moderators focused on content quality and user behavior.

**Planned Capabilities:**
- Content review and moderation
- User behavior monitoring
- Report triage and resolution
- Flag management
- Limited user profile access (view-only for moderation purposes)
- Moderation queue access

**Visibility Scope:**
- Pending submissions and content
- User reports and flags
- Public user profiles
- Moderation history

**Status:** Planned / Not Implemented

---

### 2.5 Creator

**Conceptual Definition:** Content creators with elevated permissions for content publishing.

**Planned Capabilities:**
- Content publishing tools
- Article creation and editing
- Media management
- Limited analytics for own content
- Submission management for own content

**Visibility Scope:**
- Own content analytics
- Own submissions and drafts
- Public platform content

**Status:** Planned / Not Implemented

---

### 2.6 Standard User

**Conceptual Definition:** Regular platform users with no admin access.

**Planned Capabilities:**
- Standard user dashboard access
- Personal profile management
- Challenge participation
- Content submission

**Visibility Scope:**
- Own data only
- Public platform content

**Status:** Implemented (Standard User Role)

---

### 2.7 Commenter

**Conceptual Definition:** Users with limited interaction capabilities (restricted accounts).

**Planned Capabilities:**
- View-only access to most content
- Limited commenting
- No submission capabilities

**Visibility Scope:**
- Public content only
- Limited feature access

**Status:** Planned / Not Implemented

---

### 2.8 Suspended

**Conceptual Definition:** Users with temporarily restricted access.

**Planned Capabilities:**
- Login access maintained
- Severely limited platform interaction
- Account review pending

**Visibility Scope:**
- Own profile only
- Cannot access most platform features

**Status:** Planned / Not Implemented

---

### 2.9 Banned

**Conceptual Definition:** Users permanently excluded from platform access.

**Planned Capabilities:**
- No platform access
- Account locked

**Visibility Scope:**
- No access

**Status:** Planned / Not Implemented

---

## 3. Planned Account Statuses

### 3.1 Active

**Definition:** Normal, fully functional account status.

**Capabilities:** Full access according to role permissions.

**Status:** Implemented

---

### 3.2 Suspended

**Definition:** Temporary restriction due to policy violation or review.

**Capabilities:** Limited access, cannot participate in challenges or submit content.

**Planned Duration:** Temporary (defined by admin or automated rules).

**Status:** Planned / Not Implemented

---

### 3.3 Banned

**Definition:** Permanent account restriction.

**Capabilities:** No platform access.

**Planned Duration:** Permanent (unless appealed and reviewed).

**Status:** Planned / Not Implemented

---

## 4. Conceptual Permission Framework

### 4.1 How Roles Affect Visibility (Planned)

The planned role system will control:

- **Module Visibility:** Different roles see different admin modules
- **Data Access:** Roles determine what data can be viewed
- **Action Permissions:** Roles determine what actions can be performed
- **Audit Requirements:** Higher privilege actions require additional logging

**Example Conceptual Flow:**
1. User logs into admin panel
2. System checks role and permissions
3. Admin panel displays only modules accessible to that role
4. Actions are validated against role permissions before execution
5. All actions are logged with role information

**Status:** Planned / Not Implemented

---

### 4.2 Permission Extensibility (Planned)

The permission system is envisioned to be extensible to support:

- **Custom Role Creation:** Future ability to create custom roles with specific permission sets
- **Granular Permissions:** Fine-grained control over specific actions and data access
- **Temporary Elevation:** Temporary permission grants for specific tasks
- **Permission Inheritance:** Roles can inherit permissions from other roles
- **Conditional Permissions:** Permissions that activate under specific conditions

**Status:** Planned / Not Implemented (Future Expansion)

---

## 5. Role Assignment and Management (Planned)

### 5.1 Role Assignment Workflow (Conceptual)

**Planned Process:**
1. Founder or Core Team member initiates role change
2. System validates permission to assign target role
3. Confirmation required for role changes
4. Change is logged in roles_log
5. User receives notification of role change
6. User permissions update on next login

**Status:** Planned / Not Implemented

---

### 5.2 Role Hierarchy Rules (Conceptual)

**Planned Rules:**
- Only higher-tier roles can assign lower-tier roles
- Role demotion requires confirmation and justification
- Role promotion may require multiple approvals for sensitive roles
- All role changes are permanent until manually changed

**Status:** Planned / Not Implemented

---

## 6. Security Considerations (Planned)

### 6.1 Permission Validation

**Planned Implementation Concepts:**
- All admin actions validate permissions before execution
- Frontend UI hides actions user cannot perform
- Backend enforces permissions regardless of frontend state
- Failed permission checks are logged for security review

**Status:** Planned / Not Implemented

---

### 6.2 Audit Trail

**Planned Requirements:**
- All permission checks are logged
- All role changes are logged with who made the change
- All permission-denied attempts are logged
- Audit logs are immutable and retained per compliance requirements

**Status:** Planned / Not Implemented

---

## 7. Implementation Status

**Current Status:** Vision Document Only

**Current Implementation:**
- Basic admin role exists (`role === "admin"`)
- Standard user role exists
- Account statuses may exist in database schema

**Not Yet Implemented:**
- Role hierarchy system
- Granular permission framework
- Role-based module visibility
- Advanced account statuses
- Permission inheritance

**No Timeline Provided:** Implementation will proceed based on business priorities and resource availability.

---

## 8. Related Documents

- `ADMIN-CONTROL-PANEL-OVERVIEW.md` — Admin Control Panel vision
- `ADMIN-DASHBOARD-MODULES.md` — Module-by-module access definitions
- `/docs/admin/admin-tools-overview.md` — Current admin tools documentation
- `/docs/01-core-systems/11-admin-panel-specification-and-operational-workflows.md` — Operational workflows
- `/docs/00-foundations/04-user-roles-permission-matrix.md` — User roles foundation

---

## 9. Document Maintenance

This is a living document that will be updated as the role and permission vision evolves.

**Update Triggers:**
- New roles are conceptualized
- Permission requirements change
- Security requirements evolve
- Access control needs are identified

---

**End of Document**
