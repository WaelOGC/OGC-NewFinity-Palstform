# OGC NewFinity — UI Components Reference (v1.0)



## 1. Introduction

This document defines the reusable UI components used throughout the OGC NewFinity frontend ecosystem.  

It ensures:

- Visual consistency  

- Faster development  

- Clean architecture  

- Themed UI across dashboards  

- Reusable patterns for future features  

- Scalable component library  



All components follow:

- Dark theme  

- White typography  

- Neon accents  

- Transparent cards  

- Smooth micro-interactions  

- Flexible layout for desktop & mobile  



---



# 2. Component Categories



### 2.1 Base Components

Fundamental building blocks:

- Buttons  

- Inputs  

- Textareas  

- Selects  

- Switch toggles  



### 2.2 Layout Components

Used for structure and page layout:

- Sidebar  

- Topbar  

- Footer  

- PageContainer  

- SectionHeader  



### 2.3 Interactive Components

- Modal  

- Drawer  

- Tabs  

- Accordion  

- Tooltip  

- Dropdown  



### 2.4 Display Components

- Card  

- StatCard  

- Table  

- Badge  

- Chip  

- ProgressBar  

- Avatar  



### 2.5 Feedback Components

- Toast  

- NotificationBadge  

- Spinner  

- SkeletonLoader  



### 2.6 Dashboard Components

Core platform widgets:

- WalletBalanceCard  

- TokenEarningsChart  

- MiningTimeline  

- ChallengeCard  

- SubmissionPreview  

- AIToolPanel  

- SubscriptionPlanCard  



---



# 3. Component Design Standards



### 3.1 Visual Identity

All components adhere to:

- Transparent or soft-blur backgrounds  

- White font color only  

- Neon accent palette (user-provided):

  - #00FFC6  

  - #FFBC25  

  - #5864FF  

  - #FF3CAC  

- Rounded corners (12–16px)  

- Soft glow hover effects  

- Minimal borders  



### 3.2 Interaction Rules

- Smooth 180–240ms animations  

- Hover states required  

- Focus states visible  

- Mobile-friendly touch zones  

- Error states with clear color feedback  



---



# 4. Component Specifications



Below is a detailed specification of every global UI component.



---



## 4.1 Buttons



### Variants:

- Primary  

- Secondary  

- Outline  

- Ghost  

- IconButton  



### Features:

- Neon glow hover  

- Loading state  

- Disabled state  



### Props:

label

onClick

icon

variant

size

loading

disabled



yaml

Copy code



---



## 4.2 Input Fields



Types:

- Text  

- Email  

- Password  

- Number  



Features:

- Floating label  

- Error message  

- Validation state  

- Optional icons  



---



## 4.3 Card



Standard card for all sections.



### Variants:

- Default  

- Highlight  

- Accent (neon border)  



### Props:

title

children

icon

footer

interactive



yaml

Copy code



---



## 4.4 Modal



Neon-themed translucent modal.



Features:

- Close button  

- Overlay click to close  

- Keyboard (ESC) support  

- Scroll-lock  



---



## 4.5 Tabs



Used for switching between dashboard sections.



Types:

- Horizontal tabs  

- Underline tabs  



---



## 4.6 Table



Used for:

- Transactions  

- Submission lists  

- Admin data tables  



Features:

- Sortable columns  

- Pagination  

- Neon highlight for selected rows  



---



## 4.7 Sidebar



Contains:

- Navigation links  

- Active state highlight  

- Collapsed mode for mobile  

- User info panel  



---



## 4.8 Notification Drawer



Contains:

- List of unread/read notifications  

- Filters by type  

- Quick "mark all as read"  



Integration:

- Uses Notification API endpoints  

- Real-time updates (future via sockets)  



---



## 4.9 ChallengeCard



Displays:

- Challenge name  

- Category  

- Track  

- Status  

- Prize pool  

- Button for entering  



---



## 4.10 Wallet Components



### WalletBalanceCard

- Shows on-chain balance  

- Off-chain balance  

- Total balance  



### MiningTimeline

- Visual history of mining events  



### TokenEarningsChart

- Graph for token generation trends  



---



## 4.11 AI Components



### AIToolPanel

- Tool selector  

- Input editor  

- Output container  

- Model information  

- Token usage bar  



### AIToolCard

- Used in Amy Agent landing page  



---



## 4.12 SubscriptionPlanCard



Displays:

- Price  

- Features  

- Billing cycle  

- CTA button  



---



# 5. Component Naming Conventions



### File Naming:

Button.jsx

Card.jsx

Sidebar.jsx

WalletBalanceCard.jsx

AIToolPanel.jsx



shell

Copy code



### CSS Naming:

Button.css

Card.css

Sidebar.css



shell

Copy code



### Folder Structure:

components/

ui/

layout/

dashboard/

forms/



yaml

Copy code



---



# 6. Reusability Rules



- No duplicated components  

- Shared components stay in `/components/ui`  

- Dashboard widgets in `/components/dashboard`  

- Admin-specific components in `/admin/components` (future expansion)  

- All components accept flexible children  



---



# 7. Accessibility Standards



- Keyboard navigable  

- ARIA labels for interactive elements  

- Sufficient text contrast (white text on dark)  

- Accessible focus indicators  



---



# 8. Future Component Expansions



- DataGrid Pro (advanced table)  

- Drag-and-drop components  

- AI chat widget  

- Profile card generator  

- Multi-select dropdown  

- 3D parallax UI blocks (optional)  



---



# 9. Conclusion

This component reference defines the reusable building blocks of the OGC NewFinity frontend.  

All future UI work must follow these standards to maintain a consistent user experience and a scalable codebase.

