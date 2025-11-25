# OGC NewFinity Platform — Frontend File Structure

**Version:** v1.0

**Maintained by:** OGC Technologies

**Status:** Active Documentation (Internal)

## 1. Purpose

This document defines the official frontend folder structure used in the OGC NewFinity Platform.

It ensures consistency, clarity, and maintainability across all React + Vite projects in the ecosystem.

This structure is strictly enforced for all contributors and automated tools.

## 2. High-Level Structure Overview

The frontend uses a clean, modular folder architecture, aligned with modern React best practices.

```
frontend/
│
├── index.html
├── vite.config.js
├── package.json
├── public/
│
└── src/
    ├── layouts/
    ├── pages/
    ├── components/
    ├── api/
    ├── assets/
    ├── constants/
    ├── hooks/
    ├── context/
    ├── styles/
    └── utils/
```

Each folder has a dedicated responsibility and must not be misused.

## 3. Layouts Folder

**src/layouts/**

- `AuthLayout.jsx`
- `PlatformLayout.jsx`
- `DashboardLayout.jsx`
- `wallet/`
  - `WalletLayout.jsx`
- `amy/`
  - `AmyLayout.jsx`
- `admin/`
  - `AdminLayout.jsx`

**Purpose:**

Defines global page containers and UI structure for each platform area.

**Rules:**

- Must contain only layout components
- Business logic belongs in hooks
- Routing logic belongs in pages

**Linked documentation:**

- `/docs/frontend/layouts-and-navigation.md`
- `/docs/frontend/base-layout-components.md`

## 4. Pages Folder

**src/pages/**

- `index.jsx`
- `about.jsx`
- `login.jsx`
- `register.jsx`
- `dashboard/`
  - `overview.jsx`
  - `profile.jsx`
  - `security.jsx`
- `wallet/`
  - `index.jsx`
  - `earnings.jsx`
  - `history.jsx`
  - `contribution.jsx`
  - `badges.jsx`

**Purpose:**

Each file represents a route in the platform.

**Rules:**

- Pages must be simple, declarative components
- No heavy business logic
- No deeply nested component trees
- Routing file (e.g., App.jsx) maps pages to layouts

## 5. Components Folder

**src/components/**

- `Header.jsx`
- `Footer.jsx`
- `Sidebar.jsx`
- `sidebar/`
  - `DashboardSidebar.jsx`
  - `WalletSidebar.jsx`
  - `AmySidebar.jsx`
  - `AdminSidebar.jsx`
- `protected/`
  - `ProtectedRoute.jsx`

**Purpose:**

Reusable UI components across layouts and pages.

**Rules:**

- Components must be reusable and stateless when possible
- Use hooks for data fetching and logic
- Do not import entire pages into components

## 6. API Folder

**src/api/**

- `client.js`
- `auth.js`
- `wallet.js`
- `amy.js`

**Purpose:**

Centralized API services for interacting with backend endpoints.

**Rules:**

- Each file targets a single backend domain
- All requests must pass through client.js
- Error handling and token refresh handled centrally

## 7. Assets Folder

**src/assets/**

- `images/`
- `icons/`
- `logos/`

**Purpose:**

Contains static images and branding files.

**Rules:**

- Do not store JS or JSON here
- Keep branding files organized

## 8. Constants Folder

**src/constants/**

- `roles.js`
- `routes.js`
- `config.js`
- `navigation.js`

**Purpose:**

Stores static values, enums, and global config.

**Rules:**

- Must not depend on business logic
- Keep files small and focused

## 9. Hooks Folder

**src/hooks/**

- `useAuth.js`
- `useTheme.js`
- `useWallet.js`
- `useAmy.js`

**Purpose:**

Reusable logic extracted from pages and components.

**Examples:**

- Authentication
- Token refresh
- Wallet sync
- Amy tool execution

## 10. Context Folder

**src/context/**

- `AuthContext.jsx`
- `ThemeContext.jsx`
- `WalletContext.jsx`
- `AmyContext.jsx`

**Purpose:**

Platform-wide React contexts for state that spans multiple components.

**Rules:**

- Never store large datasets here
- Keep contexts focused (Auth, Theme, Wallet, Amy)
- Heavy logic must go inside hooks, not context files

## 11. Styles Folder

**src/styles/**

- `global.css`
- `variables.css`
- `layout.css`
- `dashboard.css`

**Purpose:**

Global CSS files, variables, and layout styles.

**Rules:**

- Only CSS files allowed
- No inline JS styling
- Use variables.css for theme consistency

## 12. Utils Folder

**src/utils/**

- `format.js`
- `validators.js`
- `helpers.js`

**Purpose:**

Shared pure functions.

**Rules:**

- Must not import components
- Keep functions small and tested
- No side effects

## 13. Versioning & Maintenance

Update this document when:

- New modules are added
- Folder structure changes
- Navigation changes require new page folders

Log changes in `docs/changelog.md`.

## 14. Linked Documents

- `/docs/frontend/layouts-and-navigation.md`
- `/docs/frontend/base-layout-components.md`
- `/docs/frontend/dashboard-navigation.md`

