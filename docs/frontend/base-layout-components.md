# OGC NewFinity Platform — Base Layout Components

**Version:** v1.0

**Maintained by:** OGC Technologies

**Status:** Active Documentation (Internal)

## 1. Purpose

This document defines the core components used across all platform layouts.

These components form the foundation of the UI and navigation system of the OGC NewFinity Platform.

These standards ensure consistency, predictable behavior, and maintainable frontend architecture.

## 2. Core Layout Components

Every layout is composed of a combination of the following core components.

### 2.1 Header Component

**File:** `components/Header.jsx`

**Responsibilities:**

- Display platform or account-level navigation
- Show user menu (avatar, profile, logout)
- Display notifications (future)
- Trigger theme switch (future)
- Render breadcrumbs for dashboard pages

**Notes:**

- Must auto-hide sensitive user details if unauthenticated
- Works differently inside PlatformLayout vs DashboardLayout

### 2.2 Sidebar Component

**File:** `components/Sidebar.jsx`

**Responsibilities:**

- Render dashboard navigation
- Handle active route highlighting
- Collapse/expand behavior
- Display user role badges (Admin, User)
- Display version number (optional)

**Sidebar variations:**

- Dashboard Sidebar: for main dashboard pages
- Wallet Sidebar: for wallet-related navigation
- Amy Sidebar: for AI tool navigation
- Admin Sidebar: for admin tools

**Rules:**

- Each variation lives in its own folder
- Must follow naming rules and layout mapping

### 2.3 Footer Component

**File:** `components/Footer.jsx`

**Responsibilities:**

- Basic footer for public pages
- Copyright & project information
- Not used in DashboardLayout
- Minimal design for clean layout

## 3. Shared Routing Components

### 3.1 ProtectedRoute Component

**File:** `components/ProtectedRoute.jsx`

**Purpose:** Wraps any route that requires valid authentication.

**Logic:**

- Check if user has a valid JWT 
- If not → redirect to `/login` 
- If yes → render the requested dashboard page

**Role Enforcement (optional):**

```jsx
<ProtectedRoute roles={["admin"]}>
    <AdminDashboard />
</ProtectedRoute>
```

### 3.2 Role Constants

**File:** `constants/roles.js`

**Contains:**

```javascript
export const ROLES = {
    USER: "user",
    ADMIN: "admin",
    PARTNER: "partner"
}
```

**Usage:**

Used throughout layouts, menu filters, admin checks, and route guards.

### 3.3 Theme Context Component

**File:** `context/ThemeContext.jsx` or `hooks/useTheme.js`

**Responsibilities:**

- Apply dark/light theme
- Maintain theme preference in local storage
- Inject theme classes at layout-level

**Requirement:** Applied at layout root level, not individual pages.

## 4. Component Structure Guidelines

All layout components must follow consistent structure:

### 4.1 File Naming Rules

- lowercase
- hyphens or camelCase approved
- never use spaces
- no timestamps

**Examples:**

- `Header.jsx`
- `PlatformLayout.jsx`
- `DashboardLayout.jsx`
- `WalletLayout.jsx`
- `AmyLayout.jsx`

### 4.2 Directory Structure

```
components/
    Header.jsx
    Footer.jsx
    Sidebar.jsx
components/sidebar/
    DashboardSidebar.jsx
    WalletSidebar.jsx
    AmySidebar.jsx
    AdminSidebar.jsx
components/protected/
    ProtectedRoute.jsx
```

Layouts call sidebar variations depending on the route.

## 5. Layout Lifecycle Rules

### 5.1 AuthLayout Lifecycle

1. Render container
2. Render form components
3. Execute minimal checks (no JWT)
4. Apply minimal styling

### 5.2 PlatformLayout Lifecycle

1. Load header
2. Load public routes
3. Load footer
4. Apply platform theme

### 5.3 DashboardLayout Lifecycle

1. Validate JWT
2. Load user profile
3. Render sidebar + dashboard header
4. Load dashboard routes
5. Apply dashboard theme

## 6. Component Reusability Requirements

- All shared logic (e.g., token refresh, theme) must be moved to `hooks/`
- Layout components must be dumb containers
- Route logic must NOT be inside layout files
- Complex UI should be extracted into child components
- Components must not import from pages

## 7. Versioning & Maintenance

Update this document when:

- New layout types are added
- Core components change
- Sidebar variations expand
- ProtectedRoute logic changes
- Theme system is upgraded

All changes must be logged in `/docs/changelog.md`.

## 8. Linked Documents

- `/docs/frontend/layouts-and-navigation.md`
- `/docs/frontend/dashboard-navigation.md` (future)
- `/docs/frontend/file-structure.md` (future)

END OF FILE CONTENT

