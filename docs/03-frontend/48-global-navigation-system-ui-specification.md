# OGC NewFinity — Global Navigation System UI Specification (v1.0)



## 1. Introduction

This document defines the **Global Navigation System** used across the entire OGC NewFinity platform.



The navigation system provides a unified, consistent way for users to move between:

- Platform Dashboard  

- Challenge Hub  

- Submissions  

- Wallet  

- Subscription Center  

- Notification Center  

- Amy (AI Workspace)  

- Profile & Settings  



NewFinity uses **modular apps under one domain**, so navigation must feel globally connected while respecting the independence of each sub-application.



---



## 2. Core Navigation Components



The global navigation system consists of:



1. **Topbar (Global Header)**  

2. **Sidebar (Platform Dashboard Navigation)**  

3. **App Switcher (Cross-App Navigation)**  

4. **Notification Bell**  

5. **User Menu (Avatar Dropdown)**  

6. **Mobile Navigation Drawer**  



---



## 3. Topbar (Global Header)



### Displayed Across:

- Platform Dashboard  

- Challenge Hub  

- Wallet  

- Submissions  

- Notification Center  

- Subscription Center  

- Profile  

- Admin Panel (variation)  



### Not Displayed on:

- Amy Agent Workspace (Amy has its own header)  

- Authentication pages  



### Topbar Items:



**Left Side**

- NewFinity logo  

- Optional breadcrumb / page title  



**Center (optional)**

- Search bar (future)  



**Right Side**

- Notification bell  

- App Switcher  

- User avatar dropdown  



### Behavior:

- Fixed at top  

- Slight transparency  

- Neon glow underline  

- Smooth show/hide on scroll (future)  



---



## 4. Sidebar (Platform Navigation)



### Sidebar is active only inside:

- Platform Dashboard  

- Challenges  

- Submissions  

- Wallet  

- Subscription Center  

- Notification Center  

- Settings  



### NOT used for:

- Amy Agent  

- Public pages  

- Admin (admin has its own sidebar)  



### Sidebar Components:

- Dashboard  

- Challenges  

- Submissions  

- Wallet  

- Amy (redirects to `/amy`, launching the workspace)  

- Notifications  

- Subscription Center  

- Profile  

- Settings  

- Logout  



### Styles:

- Dark translucent background  

- Neon hover glow  

- Active item has left neon accent bar  

- Smooth collapse animation  



### Collapsed State:

- Icons only  

- Tooltip shows label  

- Triggered automatically on tablet  



---



## 5. App Switcher (Cross-App Navigation)



This is one of the most important parts of the global system.



### Purpose:

Allows user to jump between separate applications under the same domain:

- Platform  

- Amy Agent  

- Wallet  

- Admin (if permissions allow)  



### Location:

Topbar, next to notification bell.



### UI:

- Icon-based grid menu  

- Neon hover glow  

- Tooltip for each app  

- Similar to Google Workspace app switcher  



### Example Items:

- **Platform** → `/dashboard`  

- **Amy Agent** → `/amy`  

- **Wallet** → `/wallet`  

- **Admin Panel** → `/admin` (RBAC)  



---



## 6. Notification Bell



Specifications already defined in Notification UI document, but in navigation:



- Always visible in topbar  

- Unread badge displays count  

- Opens Notification Drawer  



---



## 7. User Menu (Avatar Dropdown)



Triggered by clicking the user avatar.



Menu Items:

- Account Profile  

- Subscription Center  

- Settings  

- Logout  



Future items:

- Switch account (if multi-login)  

- Manage connected services  



Behavior:

- Smooth dropdown animation  

- Click-away closes menu  



---



## 8. Mobile Navigation System



### Mobile Navigation Components:

- Hamburger menu (top-left)  

- Slide-in sidebar  

- Bottom navigation (optional future)  



### Behavior:

- Full-screen drawer  

- Large, touch-friendly items  

- Search injected into drawer  

- Neon accents reduced for clarity  



---



## 9. Navigation Between Separate Apps



NewFinity supports **modular micro-app navigation**:



### Navigation Rules:

- Switching between `/dashboard` and `/amy` **must NOT reload the session**  

- Authentication is shared  

- JWT + Refresh cookies remain valid  

- Navigation feels instant (SPA-like behavior)  



### UI Requirements:

- App Switcher highlights current app  

- Navigation is asynchronous  

- Loading indicator appears if needed  



---



## 10. Active State Rules



### Sidebar active logic:

- Exact or nested route match  

- Example: `/challenges/123` keeps "Challenges" highlighted  



### Topbar active logic:

- Page title updates dynamically  

- Breadcrumb shown only when context needed  



### App Switcher active logic:

- Icon highlighted when app is active  



---



## 11. Deep-Linking



All major sections must support direct links:

- `/challenge/:id`  

- `/submissions/:id`  

- `/wallet`  

- `/notifications`  

- `/subscriptions`  

- `/profile`  

- `/settings`  



These links must load the correct sidebar state and page header.



---



## 12. Motion & Interaction



### Sidebar:

- Slide open/close  

- Neon accent animation  



### Topbar:

- Slight fade-in on scroll restore  

- Hover glow for interactive icons  



### App Switcher:

- Scale-in menu  

- Neon icon highlights  



---



## 13. Accessibility Rules



- Keyboard navigation must work for all menus  

- Focus ring visible  

- Up/Down arrows cycle menu items  

- Escape closes:

  - Drawer  

  - App Switcher  

  - User menu  



---



## 14. Future Enhancements



- Quick search ("command palette")  

- Recently visited section  

- Cross-app context transfer  

- Multi-account switching  



---



## 15. Conclusion



This specification defines the full Global Navigation System for the OGC NewFinity ecosystem.  

It ensures consistent, intuitive movement across multiple apps while maintaining a unified brand identity.

