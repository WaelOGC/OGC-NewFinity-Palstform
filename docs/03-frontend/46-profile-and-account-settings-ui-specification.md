# OGC NewFinity — Profile & Account Settings UI Specification (v1.0)



## 1. Introduction

This document defines the UI/UX design, structure, components, and interaction patterns for the **Profile & Account Settings** section of the OGC NewFinity platform.



This area enables users to:

- View and edit personal information  

- Update email and password  

- Manage display preferences  

- Control notification preferences  

- Manage connected services (Amy, Wallet, future extensions)  

- Configure privacy & security options  

- Access account deletion options  



Profile Settings must be:

- Clean  

- Organized  

- Secure  

- Transparent  

- Fully aligned with the global neon-dark theme  



---



## 2. Routing & Structure



### Route:

`/profile`



### Layout:

Standard platform layout:

| TOPBAR |

| SIDEBAR | MAIN CONTENT |

markdown

Copy code



### Structure:

- Left: Vertical settings menu  

- Right: Editable content panel  



---



## 3. Settings Menu (Left Sidebar)



### Menu Items:

1. **Profile Information**

2. **Account Security**

3. **Notification Preferences**

4. **Connected Services**

5. **Display & Accessibility**

6. **Privacy Settings**

7. **Danger Zone**



### Behavior:

- Selected item highlighted with neon accent  

- Icons displayed beside each menu item  

- Mobile → collapses into a dropdown  



---



## 4. Profile Information Page



### Fields:

- Profile photo  

- Full name  

- Username (future)  

- Email (read-only if email verification required)  

- Country (optional)  

- Bio / About (textarea)  



### Actions:

- Upload/change avatar  

- Save changes  



### Avatar Upload:

- Drag-and-drop  

- Preview  

- Accepts JPG/PNG  

- Auto-crop (future)  



---



## 5. Account Security Page



### Sections:



#### **5.1 Change Password**

Fields:

- Current password  

- New password  

- Confirm new password  



Validation:

- Min 8 characters  

- Must match  

- Error messages consistent with Form Validation Framework  



#### **5.2 Two-Factor Authentication (Future)**

- Enable/disable 2FA  

- QR code modal  

- Recovery codes  



#### **5.3 Login Activity**

Table of:

- Login timestamp  

- Device  

- IP address  

- Location (approx.)  



---



## 6. Notification Preferences



Page with toggle switches for:



### System Notifications:

- Account updates  

- Subscription reminders  

- Wallet sync errors  

- Challenge status updates  

- Submission review notifications  

- Rewards earned  

- Amy AI usage warnings  



### Delivery Channels:

- In-app notifications  

- Email (future)  

- SMS (future)  



Design:

- Toggle component  

- Short description  

- Optional grouping  



---



## 7. Connected Services Page



This manages NewFinity services linked to the user account.



### Sections:



#### **7.1 Amy Agent**

- Status: Enabled  

- Usage info  

- Manage preferences (link to `/amy/settings`)  



#### **7.2 Wallet**

- On-chain address (read-only)  

- Sync button  

- Wallet linking (future multi-wallet support)  

- Status messages  



#### **7.3 External Logins (Future)**

Show connected accounts:

- Google  

- Microsoft  

- Apple  



---



## 8. Display & Accessibility



### Options:



#### **8.1 Theme Mode**

- Dark (default)  

- Light (future)  



#### **8.2 Font Size**

- Small  

- Medium  

- Large  



#### **8.3 Motion Preferences**

- Reduce motion  

- Disable neon pulses  



#### **8.4 Layout Density (Future)**

- Compact  

- Comfortable  



---



## 9. Privacy Settings



### Sections:



#### **9.1 Public Profile Visibility**

- On/off switch  

- Explanation tooltip  



#### **9.2 Data Sharing Preferences**

- Analytics opt-in/out  

- Research participation opt-in/out  



#### **9.3 Download Your Data (Future)**

- Export account data  

- Export submissions  



#### **9.4 Request Account Deletion**

- Opens Danger Zone flow  



---



## 10. Danger Zone



A separate red-themed section.



### Options:

- Delete account  

- Revoke access to connected services  

- Reset user data (future)  



### Delete Account Flow:

1. Warning modal  

2. Required confirmation checkbox  

3. Multi-step confirmation  

4. Grace period description  



Design:

- Red neon accents  

- Strong warning emphasis  



---



## 11. General UI Components Used



- Cards  

- Sections with headings  

- Form fields  

- Toggle switches  

- Modals  

- Password input component  

- Status labels  

- Avatar picker  



All components follow global neon-dark design tokens.



---



## 12. Responsive Behavior



### Desktop:

- Left menu + right content  

- Two-column forms (optional)  



### Tablet:

- Menu collapses  

- Single-column form  



### Mobile:

- Menu becomes dropdown  

- Full-width forms  

- Avatar uploader becomes centered block  



---



## 13. Visual & Motion Design



### Colors:

- White text  

- Transparent dark cards  

- Neon highlights  

- Red for danger zone  



### Motion:

- Smooth fade-up for content  

- Highlight animation on selected menu item  

- Soft hover glow  



---



## 14. Future Enhancements



- Integrated NewFinity Avatar Generator  

- Deep profile customization  

- AI-assisted bio generator  

- Achievements & reputation display  

- Analytics of user engagement  



---



## 15. Conclusion



This specification defines the complete Profile & Account Settings UI for OGC NewFinity.  

It ensures a clear, secure, and consistent experience, fully aligned with global frontend architecture and design tokens.

