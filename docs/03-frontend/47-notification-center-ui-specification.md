# OGC NewFinity — Notification Center UI Specification (v1.0)



## 1. Introduction

This document defines the full UI/UX specification for the **Notification Center**, the central hub where users receive and manage notifications across the entire NewFinity ecosystem.



Notifications originate from:

- Challenge Hub  

- Submissions & review system  

- Amy Agent  

- Wallet (rewards, sync issues)  

- Subscription system  

- Platform system alerts  

- Admin broadcasts  



The Notification Center must:

- Be clean  

- Be organized  

- Support filtering  

- Sync with global notification drawer  

- Provide clear message structure  

- Support mobile-first usage  



---



## 2. Notification System Architecture (Frontend)



The frontend includes:



1. **Notification Bell (Topbar)**  

2. **Notification Drawer (Quick View)**  

3. **Full Notification Center (Main Page)**  

4. **Read/Unread States**  

5. **Filters & Categories**  

6. **Pagination & History**  

7. **Action Buttons (Mark as Read, Clear, etc.)**  



---



## 3. Notification Bell (Topbar)



### Location:

Topbar, right side near user avatar.



### Behavior:

- Displays unread count (badge)  

- Badge color: neon pink / neon teal  

- Clicking opens the Notification Drawer  



### Unread Badge:

- Round pill with white text  

- Animated pulse when a new notification arrives (future upgrade)  



---



## 4. Notification Drawer



### Purpose:

Quick access to recent notifications without leaving the current screen.



### Layout:

A right-side sliding drawer containing:

- Header: "Notifications"  

- Filters: All / Unread  

- Notification list (scrollable)  

- CTA: "View All" → Notification Center page  



### Notification Item Structure:

- Icon based on category (challenge, wallet, AI, etc.)  

- Title  

- Short message  

- Timestamp  

- Unread indicator  



### Interaction:

- Click → opens full Notification Center  

- Swipe left (mobile) → mark as read  

- "Mark all as read" button inside drawer  



---



## 5. Notification Center (Main Page)



### Route:

`/notifications`



### Page Structure:



| PAGE HEADER |

| FILTER BAR (categories) |

| NOTIFICATION LIST |

| PAGINATION / LOAD MORE |

yaml

Copy code



---



## 5.1 Page Header

- Title: **"Notifications"**  

- Subtitle optional  

- Right-side actions:  

  - "Mark all as read"  

  - "Clear read notifications" (optional future)  



---



## 5.2 Category Filter Bar



Categories include:

- All  

- System  

- Challenges  

- Submissions  

- Wallet  

- Subscription  

- AI  

- Badges  



### Behavior:

- Horizontal pill-style filters  

- Neon highlight on active tab  

- Scrollable on mobile  

- Filters notifications in real-time  



---



## 5.3 Notification List Layout



Each notification is rendered as a **notification card**.



### Notification Card Structure:

- Left: Category icon  

- Body:

  - Title  

  - Short message  

  - Timestamp  

- Right:

  - Unread dot (if unread)  

  - Arrow icon (optional expand view)  



### Card Behavior:

- Click → opens expanded detail modal or challenge/submission page  

- Hover → slight glow  

- Unread state → bold title + neon accent  



### Card States:

#### **Unread**

- Strong neon accent  

- Bold title  



#### **Read**

- Reduced contrast  

- No neon border  



---



## 6. Expanded Notification View (Optional Modal)



Displayed when user clicks a notification.



Contains:

- Icon  

- Title  

- Full message  

- Timestamp  

- Related action button (e.g., "View Challenge", "View Submission")  



Button examples:

- "Open Challenge"  

- "Review Submission Result"  

- "Open Wallet"  

- "Open Amy Workspace"  



---



## 7. Pagination & History



### Pagination Options:

- Classic "Load More" button  

or  

- Infinite scroll  



### Archive:

A future feature allowing long-term storage.



---



## 8. Empty States



### No notifications:

"You have no notifications yet."



### No notifications in this category:

"No notifications found in this category."



### All notifications read:

"You're all caught up."



---



## 9. Visual Styling



### Color Palette:

- Dark backgrounds  

- White text  

- Category icons colored per system  

- Unread: neon teal or neon pink accent  

- Hover glow effect  



### Spacing:

- Comfortable padding  

- 12px–20px vertical spacing  



### Icons:

Categories map to specific icons:

- System → ⚙️  

- Challenges → 🚀  

- Submissions → 📤  

- Wallet → 💰  

- Subscription → ⭐  

- AI → 🤖  

- Badges → 🏅  



Icons must match the futuristic style.



---



## 10. Responsive Behavior



### Desktop:

- Two-column layout optional (future)  

- Drawer opens alongside content  



### Tablet:

- Drawer occupies 70% of screen width  



### Mobile:

- Drawer becomes full-screen  

- Notification cards become large, touch-friendly  

- Filter bar scrolls horizontally  



---



## 11. Motion & Interaction Design



### Drawer:

- Slide-in from right  

- Smooth 200–250ms animation  



### Cards:

- Glow on hover  

- Scale-in for unread-to-read transition  



### Badge:

- Pulse animation on new notification  



---



## 12. Future Enhancements



- Socket-based real-time notifications  

- Notification categories per-tool (Amy Workspaces)  

- Smart grouping: "3 new submissions updates"  

- AI-powered notification summaries  

- Email + SMS channels settings  

- Prioritized notification ranking  



---



## 13. Conclusion



This specification defines the complete Notification Center UI for OGC NewFinity.  

All notification-related displays, interactions, and components must follow this structure to ensure clarity, responsiveness, and a unified experience across the platform.

