# OGC NewFinity — Cross-App Interface & Unified Experience Specification (v1.0)



## 1. Introduction

This document defines the cross-application UX rules, interface alignment standards, and unified user experience principles across all modules of the OGC NewFinity ecosystem.



NewFinity is structured as **multiple modular applications**, all operating under a single identity, authentication layer, and domain:



- Platform Dashboard  

- Challenge Hub  

- Submissions System  

- Wallet Dashboard  

- Subscription Center  

- Notification Center  

- Profile & Settings  

- Amy Agent (Standalone Workspace)  

- Admin Panel  



Even though each is an independent micro-application with its own UI layout, they must collectively feel like **one ecosystem**.



---



# 2. Core Unified Experience Principles



### 2.1 One Account → All Apps

A single login session provides access to:

- `/dashboard`  

- `/amy agent`  

- `/wallet`  

- `/challenges`  

- `/subscriptions`  

- `/submissions`  

- `/notifications`  

- `/profile`  



All share:

- Same JWT + Refresh cookie  

- Same user profile  

- Same permissions  

- Same subscription tier system  



Identity is unified.



---



### 2.2 One Domain → Multiple UX Surfaces

Each app is independent but lives under the same domain:



Examples:

newfinity.com/dashboard

newfinity.com/amy

newfinity.com/wallet

newfinity.com/challenges

newfinity.com/profile



yaml

Copy code



Apps must transition smoothly without forcing full reload or breaking user identity.



---



### 2.3 Consistent Design Language

All apps — even Amy and Wallet — must use:

- Dark background  

- White typography  

- Neon accents  

- Transparent surfaces  

- Same spacing system  

- Same animation curves  

- Same design tokens  



Each app may have its own **layout**, but not its own **visual identity**.



---



### 2.4 No Redundant Navigation

Each app has its own navigation, but they must share:

- Global Topbar (except Amy)  

- Notification Bell  

- Avatar Menu  

- App Switcher  



---



### 2.5 Smooth Transitions Between Apps

Moving between apps must feel like a natural flow, not a separate product.



Rules:

- Preserve session  

- Preserve user state where applicable  

- Avoid heavy loading screens  

- Use fade or soft neon transition (optional)  



---



# 3. Cross-App Navigation Architecture



The unified navigation system includes:



### 3.1 Global Topbar (Shared across all apps except Amy)

- NewFinity logo  

- Notification bell  

- App Switcher  

- Avatar menu  



### 3.2 Sidebar (Platform-specific only)

- Dashboard  

- Challenges  

- Submissions  

- Wallet  

- Subscription Center  

- Notifications  

- Settings  



Amy and Admin do **not** use this sidebar.



### 3.3 App Switcher (Critical Component)

Enables cross-app transitions:



Platform Dashboard → /dashboard

Amy Agent → /amy

Wallet Dashboard → /wallet

Admin Panel → /admin (RBAC)



yaml

Copy code



### 3.4 Route-Safe Transitions

Changing apps must:

- Not log user out  

- Not require a full re-auth  

- Preserve access tokens  

- Trigger minimal loading  



---



# 4. Cross-App UI Synchronization Rules



### 4.1 User Identity Sync

The same **name, avatar, role, subscription tier** must appear identically in:

- Topbar  

- App Switcher  

- Profile menus  

- Wallet and Amy (read-only identity)  



### 4.2 Notification Sync

All apps must read from the same notification endpoint.



Unread count must update in:

- Topbar bell  

- Drawer  

- Notification Center  

- Amy (future integration)  



---



### 4.3 Permission Sync

RBAC must behave identically across all apps:

- User  

- Pro  

- Enterprise  

- Admin  



If a user loses access (e.g., subscription downgrade), all apps must reflect the change immediately.



---



# 5. Visual Consistency Rules



### 5.1 Shared Design Tokens

Colors, spacing, radii, shadows, typography — all defined in:

`/docs/03-frontend/32-design-tokens-and-theme-specification.md`



All apps must use the same tokens — **no exceptions**.



---



### 5.2 Motion System Sync

Animations should share:

- Timing tokens  

- Easing curves  

- Glow behavior  

- Interaction rules  



Amy's animations may be calmer for workspace focus.



---



### 5.3 Typography Rules

Headers, body text, labels all follow the same scale.



---



### 5.4 Iconography

Icons must:

- Match style  

- Use neon accents  

- Be consistent across apps  



---



# 6. Unified Interaction Rules



### 6.1 Buttons

- Always use the shared Button component  

- Same hover, focus, disabled states  



### 6.2 Inputs and Forms

- Same form system  

- Same validation patterns  

- Same error/success messages  



### 6.3 Cards

- Transparent card surface  

- Neon border highlight  

- Rounded corners  



### 6.4 Tables

- Same table component  

- Same hover and responsive behavior  



### 6.5 Modals

- Centered  

- Same fade + scale animation  

- Backdrop blur  



---



# 7. App-Specific Independence Rules



Even though apps share a unified interface, some must remain visually independent:



### 7.1 Amy Agent (Standalone UI)

- Own topbar  

- Own layout  

- No sidebar  

- Workspace-first  

- Full-screen experience  



### 7.2 Wallet Dashboard

- Uses platform layout  

- But visually emphasizes teal/financial identity  



### 7.3 Admin Panel

- Stronger focus on data  

- Minimal glow  

- High-density layout  



### 7.4 Challenge Hub

- Content-oriented  

- Encourages exploration and participation  



---



# 8. Cross-App Branding Rules



### 8.1 Shared Brand Elements

- Logo  

- Typography  

- Palette  

- Glow effects  



### 8.2 App Identity Layers

Each app may introduce:

- Unique accent pattern  

- Page-level illustrations (future)  

- Slight variation in component density  



But NOT:

- New color tokens  

- New component architecture  

- New layout paradigms (except Amy workspace)  



---



# 9. Cross-App State Storage Rules



### Session:

Stored centrally → never per app.



### User data:

Cached globally (React context / server session).



### Temporary states:

Stored per app (e.g., Amy workspace draft prompt).



### App-to-App Context Passing:

Allowed via:

- URL parameters  

- Shared state hooks (future)  

- Temporary local storage keys  



Examples:

- Challenge page → Open Amy with pre-filled instructions  

- Submission → Open Amy to refine idea  



---



# 10. Error & Empty State Consistency



Error messages:

- Same structure  

- Same tone  

- Same colors  

- Same icon style  



Empty-state screens:

- Same visual template  

- Same iconography  

- Same messaging rules  



---



# 11. Performance Standards



All apps must:

- Use lazy-loading  

- Cache shared resources  

- Avoid redundant API calls  

- Use skeleton loaders  

- Reuse UI components  



---



# 12. Future Unified Elements



- Global command palette ("Cmd+K")  

- Cross-app search  

- Multi-app notifications hub  

- Activity feed unifying Wallet + Challenges + Amy  

- Unified achievements/badges profile  



---



# 13. Conclusion



This specification defines how separate applications inside the NewFinity ecosystem come together to deliver a single, cohesive, futuristic user experience.



Every new app, module, or feature added in the future must align with this unified system.

