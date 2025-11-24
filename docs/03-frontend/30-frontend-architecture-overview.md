# OGC NewFinity — Frontend Architecture Overview (v1.0)



## 1. Introduction

This document defines the complete frontend architecture for the OGC NewFinity platform.  

It covers the structure, core principles, component hierarchy, state management strategy, routing, shared libraries, and integration rules for all frontend applications.



The frontend stack includes:

- React.js  

- Vite  

- Modern JavaScript (no TypeScript)  

- CSS Modules / Tailwind optional for Admin (user prefers custom CSS for main platform)  

- Axios / Fetch for API  

- Protected routes  

- Global UI components  



This architecture applies to:

- Main Platform Dashboard  

- Admin Dashboard  

- Authentication UI  

- Challenge Hub  

- AI Agent (Amy)  

- Wallet Dashboard  

- Profile & Settings  



---



# 2. Core Frontend Principles



### 2.1 Clean Code & Modularity

Every feature is broken into:

- Pages  

- Components  

- Hooks  

- Services  

- Context providers  

- Utilities  



### 2.2 Reusable UI Components

Create universal components:

- Buttons  

- Inputs  

- Modals  

- Cards  

- Tables  

- Notifications drawer  

- Loaders  



### 2.3 Separation of Concerns

- UI logic in components  

- Business logic in services  

- API logic in `/services/api/*`  

- State in context/hooks  



### 2.4 Theme Consistency

Use:

- Neon accents  

- Transparent backgrounds  

- White typography  

- Dark-mode optimized components  



---



# 3. Project Structure (Master Layout)



src/

│

├── assets/

│ ├── icons/

│ ├── images/

│ └── logos/

│

├── components/

│ ├── ui/

│ ├── forms/

│ ├── layout/

│ └── dashboard/

│

├── context/

│ ├── AuthContext.js

│ ├── ThemeContext.js

│ ├── NotificationContext.js

│ └── WalletContext.js

│

├── hooks/

│ ├── useAuth.js

│ ├── useFetch.js

│ ├── useNotifications.js

│ └── useDebounce.js

│

├── pages/

│ ├── auth/

│ ├── dashboard/

│ ├── wallet/

│ ├── challenges/

│ ├── submissions/

│ ├── ai/

│ ├── profile/

│ └── subscriptions/

│

├── router/

│ ├── AppRouter.jsx

│ ├── ProtectedRoute.jsx

│ └── AdminRoute.jsx

│

├── services/

│ ├── api/

│ │ ├── auth.js

│ │ ├── wallet.js

│ │ ├── challenges.js

│ │ ├── submissions.js

│ │ ├── subscription.js

│ │ ├── ai.js

│ │ ├── badges.js

│ │ ├── contributions.js

│ │ └── notifications.js

│ ├── http.js

│ └── storage.js

│

├── styles/

│ ├── globals.css

│ ├── tokens.css

│ └── components.css

│

├── utils/

│ ├── format.js

│ ├── validators.js

│ └── constants.js

│

└── main.jsx



markdown

Copy code



---



# 4. Routing Architecture



### Public Routes

- `/login`

- `/register`

- `/forgot-password`



### Protected Routes

- `/dashboard`

- `/wallet`

- `/challenges`

- `/challenges/:id`

- `/submissions`

- `/ai`

- `/profile`

- `/subscriptions`



### Admin Routes

- `/admin`

- `/admin/challenges`

- `/admin/submissions`

- `/admin/users`

- `/admin/badges`

- `/admin/logs`



Protected using `AdminRoute.jsx` with RBAC.



---



# 5. State Management Strategy



### Authentication

Stored in:

- `AuthContext`

- Access token in memory

- Refresh token in httpOnly cookie (backend only)



### Notifications

- Stored in `NotificationContext`

- Auto-fetch on interval

- Real-time update (future socket integration)



### Wallet Data

- `WalletContext`  

- Cached for performance  

- Sync triggered manually + scheduled  



### AI Usage

- Tool configuration in component state  

- Logs stored server-side  



---



# 6. UI/UX Foundations



### Design Principles:

- Futuristic neon  

- Transparent card components  

- White text contrast  

- Smooth animations  

- Minimal clutter  

- Fluid layout for 1440px → 360px  



### Global Components:

- `<Card />`

- `<Button />`

- `<Input />`

- `<Modal />`

- `<Sidebar />`

- `<Topbar />`

- `<NotificationDrawer />`

- `<LoadingSpinner />`



---



# 7. API Integration Layer



### Base Logic

All requests go through:

services/http.js



vbnet

Copy code



Features:

- Token injection  

- Error handling  

- Retry on 401 with refresh  

- Automatic logout if refresh fails  



Each API module is small and clean:

auth.js

wallet.js

challenges.js

submissions.js

...



yaml

Copy code



---



# 8. Error Handling (Frontend)



- Centralized error handler  

- Toast notifications for user feedback  

- Redirect to login on expired access tokens  

- Graceful failures with fallback UI  



---



# 9. Performance Considerations



- Vite bundling  

- Lazy loading pages  

- Memoized components  

- Debounced network requests  

- Minimal re-renders via context splitting  



---



# 10. Security Considerations



- No sensitive data stored in localStorage  

- All admin pages enforced client-side + server-side  

- Sanitization for user input  

- CSRF-safe refresh token pattern  



---



# 11. Future Extensions



- React Native shared component library  

- Micro-frontend separation  

- Theme switcher (light/dark)  

- Real-time sockets for notifications  

- AI chat widget  



---



# 12. Conclusion

This document defines the official frontend architecture for all OGC NewFinity applications.  

It ensures high maintainability, scalability, and consistent UI behavior across the ecosystem.

