# OGC NewFinity — Admin Data Tables & Moderation Tools UI Specification (v1.0)



## 1. Introduction

This document defines the full UI/UX system for **Admin Data Tables**, **Review Interfaces**, and **Moderation Tools** used in the OGC NewFinity Admin Panel.



Admin tools must support:

- Reviewing user submissions  

- Managing challenges  

- Handling user accounts  

- Issuing approvals/rejections  

- Monitoring wallet transactions  

- Reviewing notifications  

- Overseeing system logs  

- Managing badges & contributions  

- Adjusting subscriptions  

- Moderating platform activity  



The admin UI must prioritize:

- Clarity  

- Speed  

- High data density  

- Precision  

- Safety (confirmations, warnings, audit trails)  



---



## 2. Admin Panel Layout



### Layout Structure:

| ADMIN TOPBAR (Lightweight) |

| ADMIN SIDEBAR | MAIN CONTENT |

markdown

Copy code



### Admin Aesthetic:

- Less neon glow  

- More professional/minimal  

- Higher density tables  

- Clean neutral tones with subtle neon accents  

- Functional over expressive  



The admin panel visually differentiates itself from user-facing areas.



---



## 3. Data Table System (Core Component)



Admin Data Tables are the **backbone** of moderation and data management.



### 3.1 Table Features (Mandatory)

- Column sorting  

- Column resizing  

- Pagination  

- Search bar  

- Row selection (single or multiple)  

- Filters (date, status, category)  

- Status pill components  

- Icons for actions  

- Inline or modal actions  



### 3.2 Table Structure:

Columns must support:

- Text  

- Icons  

- Category labels  

- Status pills  

- Action buttons  

- Timestamps  

- Tooltips  



### 3.3 Table Density:

Admin tables use:

- Reduced padding (higher density)  

- Small text size  

- Compact rows  



---



## 4. Admin Filters & Search System



Filters appear above the table:

- Status (Approved / Pending / Rejected)  

- Category  

- Date range  

- User role (User / Pro / Enterprise)  

- Challenge ID  

- Submission type  



Search bar:

- Full-text search  

- Real-time filtering  

- Always visible  



---



## 5. Moderation Workflow UI



Moderation actions must follow structured, safe, auditable flows.



### 5.1 Review Queue Page

Dedicated tab: **"Review Queue"**



Displays items waiting for admin review:

- Submissions  

- Challenge applications  

- Reports (future)  

- Content flags (future)  



Each item shows:

- Thumbnail / icon  

- Title  

- User  

- Timestamp  

- Status  

- "Review" button  



---



## 6. Submission Review Interface



### Layout:

| Submission Content Viewer (left) |

| Review Panel (right) |

yaml

Copy code



### Submission Viewer May Display:

- Uploaded files (image, PDF, video)  

- Text entry  

- Metadata  

- User info  

- Timestamps  



### Review Panel (Right Side):

Contains:

- Status selector (Approve / Reject / Pending)  

- Rejection message input  

- Reward assignment (optional)  

- Notes for internal use  

- Action buttons:

  - Approve Submission  

  - Reject Submission  

  - Save as Pending  

  - Flag for Audit  



---



## 7. Challenge Management Tools



Challenge admin pages include:

- Challenge list table  

- Challenge editor  

- Participant list  

- Submission list  

- Timeline editor  

- Reward settings  



### Challenge Editor:

Fields:

- Title  

- Category  

- Description  

- Requirements  

- Timeline dates  

- Reward structure  

- Status (Draft / Published / Closed)  



Admin actions:

- Publish  

- Archive  

- Duplicate challenge  

- Disable submissions  



---



## 8. User Management UI



Admin must be able to:

- View user details  

- Edit basic information  

- View subscription level  

- View account status  

- Reset password (admin-initiated)  

- Suspend account  

- Delete account  

- View user submissions  

- View user wallet info (read-only)  



### User Table Columns:

- Name  

- Email  

- Role  

- Subscription tier  

- Account status  

- Created date  

- Actions  



---



## 9. Wallet & Transactions Admin UI



### Table Fields:

- Transaction ID  

- User  

- Type (reward / mining / manual grant / adjustment)  

- Amount  

- Status  

- Timestamp  



Admin actions:

- Manual reward grant  

- Manual adjustment  

- Freeze wallet (rare, for fraud)  

- Sync wallet (admin override)  



---



## 10. Badge & Contribution Admin Tools



### Badge Management:

- Create badge  

- Edit badge  

- Assign badge manually  

- Disable badge  



### Contribution Review:

- Contribution logs table  

- Filters by challenge, user, or system-generated events  

- Ability to correct points manually  



---



## 11. Notification & System Alerts Admin UI



Admin can:

- Create system-wide announcements  

- Send targeted notifications  

- Review notification logs  

- Test notifications  



---



## 12. Logs & Observability Tools



Admin tools show:

- Request logs  

- Error logs  

- Audit logs  

- Login activity  

- Email/SMS sending logs (future)  



### Log Table Columns:

- Timestamp  

- Type  

- Severity  

- Message  

- Metadata (collapsible)  



---



## 13. Action Confirmation System



Every destructive or irreversible action requires:



### Confirmation Modal:

- Clear warning  

- Explanation of consequences  

- Required checkbox:

  "I understand the consequences."  



### Strongly Destructive Actions:

- Delete user  

- Delete submission  

- Delete challenge  

- Reset wallet  

- Remove rewards  



Require TWO steps:

1. Confirmation modal  

2. Re-enter "DELETE" text  



---



## 14. Empty & Error States



### Empty State Examples:

- "No submissions found."  

- "No users match your filters."  

- "The review queue is empty."  



### Error State:

Show card:

> "An unexpected error occurred. Try again."



---



## 15. Visual Styling (Admin Theme)



### Admin Visual Rules:

- Minimal neon glow  

- High-density tables  

- Cleaner typography  

- Less rounded corners (slightly sharper)  

- Light neon accents only for actions  

- Warning colors for destructive actions  



Tables:

- Clear borders  

- Hover highlight  

- Tight spacing  



Panels:

- Dark background  

- Light grey dividers  



---



## 16. Responsive Behavior



### Desktop:

- Full admin experience  

- Multi-column tables  



### Tablet:

- Table scrolls horizontally  



### Mobile:

- Most admin pages disabled or limited view-only  

(future: admin mobile app not required)  



---



## 17. Future Enhancements



- Bulk moderation  

- AI-assisted moderation tools  

- Automated detection for invalid submissions  

- Admin dashboards for system metrics  

- Real-time socket-based updates  

- Admin activity feed  



---



## 18. Conclusion



This specification defines the complete UI/UX system for Admin Data Tables and Moderation Tools within OGC NewFinity.



The admin environment must remain:

- Efficient  

- Safe  

- High-performance  

- Scalable  

- Consistent with platform architecture  



All admin features must follow this specification.

