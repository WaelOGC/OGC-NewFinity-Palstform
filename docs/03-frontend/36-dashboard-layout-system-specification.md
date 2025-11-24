# OGC NewFinity — Dashboard Layout System Specification (v1.0)



## 1. Introduction

This document defines the complete layout framework for all dashboard screens in the OGC NewFinity platform.  

The layout system ensures:

- Consistent structure across all dashboard pages  

- Predictable user experience  

- Clear hierarchy  

- Smooth responsive behavior  

- Easy scalability for new modules  

- Clean separation of navigation, content, and utility zones  



This layout applies to:

- Main Platform Dashboard  

- Challenge Hub  

- AI Agent (Amy)  

- Wallet Dashboard  

- Profile & Settings  

- Notifications  

- Subscription Center  

- Admin Panel (adapted)  



---



# 2. Dashboard Layout Structure



The core layout follows a **3-zone structure**:



| TOPBAR (global) |

| SIDEBAR | MAIN CONTENT |

| (left) | (scrollable) |

yaml

Copy code



### Zones:

1. **Topbar** → fixed, global quick-access actions  

2. **Sidebar** → navigation, consistent across all pages  

3. **Main Content Area** → scrollable per-page content  



---



# 3. Topbar Specification



### Height:

--topbar-height: 64px;



markdown

Copy code



### Required Elements:

- Platform logo / icon  

- Page title (optional dynamic)  

- Notification bell  

- User avatar + dropdown  

- Search bar (optional future)  



### Behavior:

- Fixed at top  

- Slight transparency  

- Blur effect  

- Subtle neon bottom border  



---



# 4. Sidebar Specification



### Widths:

Desktop: 260px

Collapsed: 80px

Tablet: collapsed by default

Mobile: hidden (drawer)



markdown

Copy code



### Required Items:

- Dashboard link  

- Wallet  

- Challenges  

- AI Agent  

- Submissions  

- Notifications  

- Subscriptions  

- Profile  

- Logout  



### Hover Effects:

- Neon glow  

- Slight scale-up of icon  

- Animated underline  



### Active State:

- Left accent bar using gradient tokens  

- Background: transparent + neon glow  



---



# 5. Main Content Area



### Rules:

- Always scrollable  

- Padding uses responsive tokens:

Mobile: var(--space-4)

Tablet: var(--space-6)

Desktop: var(--space-8)

Wide: var(--space-10)



shell

Copy code



### Max Width:

--content-max-width: 1280px;



yaml

Copy code



### Sections:

- Top-level page heading  

- Filter/toolbar (if needed)  

- Cards grid  

- Tables  

- Charts  

- Detail views  

- Action buttons  



---



# 6. Standard Page Layout Types



### **6.1 Dashboard Overview Layout**

Used for:

- Home dashboard  

- Quick summaries  



Structure:

SectionHeader

Grid of stats

Grid of cards

Charts row

Recent activity



yaml

Copy code



---



### **6.2 Card-Driven Layout**

Used for:

- Wallet  

- AI Agent  

- Subscriptions  



Structure:

SectionHeader

CardRow

CardRow

OptionalTable



yaml

Copy code



---



### **6.3 Two-Column Layout**

Used for:

- Profile  

- Settings  

- Challenge details  



Structure:

LeftColumn: Navigation / secondary menu

RightColumn: Content



yaml

Copy code



---



### **6.4 Table-Centric Layout**

Used for:

- Transactions  

- Submissions list  

- Admin tables  



Features:

- Sticky header  

- Pagination  

- Filters  

- Sorting  



---



### **6.5 Full-Width Content Layout**

Used for:

- AI tool workspaces  

- Detailed challenge view  

- Submission viewer  



Content may exceed the container width and require:

- Horizontal scrolling  

- Flexible layout grids  



---



# 7. Responsive Behavior



### Desktop

- Full sidebar  

- High-density grid  

- Full charts & tables  



### Tablet

- Sidebar collapses  

- 1–2 card columns  

- Tools simplified  



### Mobile

- Sidebar hidden  

- Hamburger menu  

- Cards vertically stacked  

- Tables convert to accordions  

- AI workspace becomes full-screen vertical  



---



# 8. Standard Spacing Rules



### Between Sections:

margin-top: var(--space-10);



shell

Copy code



### Between Cards:

gap: var(--space-6);



shell

Copy code



### Between Form Fields:

gap: var(--space-4);



shell

Copy code



### Page Title Margin:

margin-bottom: var(--space-6);



yaml

Copy code



---



# 9. Page Header Pattern



Every page uses:



### **SectionHeader component**

Contains:

- Title  

- Subtitle (optional)  

- Right-side actions (filters, buttons, tabs)  



### Animation:

- Fade-up with slight delay  



---



# 10. Dashboard Grid Rules



### Grid Options:

- 12-column grid on desktop  

- 6–8 columns tablet  

- Single-column mobile  



### Recommended Sizes:

- Stat card: 3 columns  

- Medium card: 4–6 columns  

- Large chart: 8–12 columns  



---



# 11. Component Placement Rules



### Notifications Drawer

- Right side of screen  

- Overlays content  

- Scrollable  



### Modals

- Always centered  

- Background blur  

- Full-screen on mobile  



### Toasts

- Bottom-right on desktop  

- Bottom-center on mobile  



### Tables

- Expand horizontally on desktop  

- Collapse vertically on mobile  



---



# 12. Page-Specific Layouts



## 12.1 Wallet Dashboard

- Balance cards row  

- Earnings chart  

- Mining timeline  

- Transactions table  



## 12.2 AI Agent

- Tool selector  

- Two-column workspace (desktop)  

- Input → Output  



## 12.3 Challenge Hub

- Category filters  

- Challenge cards grid  

- Timeline widget  



## 12.4 Submissions

- User submissions grid  

- Submission details modal  



## 12.5 Notifications

- Full list  

- Filters tabs  



---



# 13. Performance Requirements



- Virtualized tables for large lists  

- Lazy-loaded charts  

- Card grids rendered only when visible  

- Memoized heavy components  



---



# 14. Accessibility Requirements



- Keyboard-friendly navigation  

- Focus ring tokens  

- ARIA labeling on navigation  

- Skip-to-content link  



---



# 15. Future Enhancements



- Drag-and-drop rearrangeable dashboard  

- User-customizable card layouts  

- Animated dashboards  

- Real-time sockets for live data  



---



# 16. Conclusion

This specification defines the official dashboard layout and page structure architecture for OGC NewFinity.  

All frontend modules must follow these rules to maintain consistency, efficiency, and scalable UI design.

