# OGC NewFinity — Admin Subscription Management UI Specification (v1.0)



## 1. Introduction

This document defines the complete admin-side **Subscription Management UI** for the OGC NewFinity platform.



Admin users must be able to:

- View all user subscriptions  

- Edit/upgrade/downgrade user plans  

- Adjust billing cycles  

- Apply promotional access  

- View subscription history  

- Cancel or revoke subscriptions  

- Handle failed payments (future)  

- Manage enterprise-level licenses (future)  



This is part of the Admin Panel ecosystem and must follow all admin UI rules:  

minimal glow, high data density, safe confirmations, and audit logs.



---



# 2. Routing & Navigation



### Main Route:

`/admin/subscriptions`



### Subroutes:

- `/admin/subscriptions` → Subscription Overview  

- `/admin/subscriptions/:userId` → User Subscription Details  

- `/admin/subscriptions/enterprise` (future)  

- `/admin/subscriptions/logs` → Subscription Activity Log  



---



# 3. Subscription Overview Page



### Purpose:

Provide admin with a global view of the subscription ecosystem.



### Page Components:

- Total active subscriptions  

- Plan distribution (Free / Pro / Enterprise)  

- Subscription activity summary  

- Failed payment alerts (future)  



### Table Columns:

- User  

- Email  

- Current Tier  

- Renewal Date  

- Status (Active / Expired / Canceled / Trial)  

- Payment Status (future)  

- Actions  



### Filters:

- Subscription Tier  

- Status  

- Renewal Date Range  

- Country (optional future)  



### Search:

- Search by name or email  



### Row Actions:

- View subscription  

- Modify plan  

- Cancel subscription  

- Extend subscription  

- Apply promotion  



---



# 4. User Subscription Details Page



Route:

`/admin/subscriptions/:userId`



### Sections:



| Subscription Summary Card |

| Billing & Renewal Settings |

| Plan Change Form |

| Subscription History Logs |

yaml

Copy code



---



## 4.1 Subscription Summary Card



Displays:

- Current tier  

- Status  

- Renewal date  

- Billing cycle (monthly/annual)  

- Next invoice amount (future)  

- Last updated  

- Quick actions:

  - Upgrade  

  - Downgrade  

  - Cancel  

  - Extend  



---



## 4.2 Billing & Renewal Settings



Fields:

- Renewal date  

- Billing cycle  

- Auto-renew toggle (future)  

- Discount or promotion fields (future)  



Actions:

- Save billing settings  

- Reset to default  



---



## 4.3 Plan Change Form



Admins can manually:

- Upgrade subscription (Free → Pro → Enterprise)  

- Downgrade subscription  

- Grant temporary premium access  

- Set custom expiration date  



Fields:

- New tier  

- Duration (e.g., 30 days / 60 days / custom)  

- Reason (internal note)  



Safety:

- Confirmation modal required  

- Must log every change  



---



## 4.4 Cancel Subscription Flow



Cancellation Steps:

1. Confirmation modal  

2. Required checkbox ("I understand the user will lose premium features")  

3. Optional cancellation reason  

4. Final action button: "Cancel Subscription"  



User account becomes Free tier immediately or at end-of-cycle (admin configurable).



---



## 4.5 Subscription History Log



Displays chronological subscription events:



Columns:

- Event  

- Old tier  

- New tier  

- Admin  

- Timestamp  

- Notes  



Examples:

- "Admin upgraded user from Free to Pro"  

- "Subscription expired automatically"  

- "Admin extended subscription by 30 days"  



---



# 5. Promotions & Custom Access (Future)



Admin may:

- Apply promotional codes  

- Grant temporary access  

- Create enterprise plans  

- Override pricing (internal testing only)  



UI Elements (future-ready):

- Promo field  

- Access duration picker  

- Enterprise seat manager  



---



# 6. Payment Failure Handling (Future)



Future version of the UI will support:

- Viewing failed payments  

- Retrying charges  

- Notifying users  

- Locking plans until recovery  

- Viewing payment provider logs  



Placeholder section must be included in UI even if inactive.



---



# 7. Admin Audit & Logging Rules



Every action MUST generate a log entry:

- Tier changes  

- Cancellations  

- Extensions  

- Promotions  

- Manual adjustments  



Audit log includes:

- Admin ID  

- Timestamp  

- Old values → new values  

- IP address  

- Notes  



---



# 8. Empty & Error States



### Empty States:

- "No subscriptions found."  

- "User has no subscription activity."  

- "No logs recorded for this period."  



### Error State:

Show admin error card:

> "Unable to load subscription data."



Retry button must be included.



---



# 9. Visual Styling (Admin Theme)



### Styling Rules:

- Minimal neon  

- High-density tables  

- Sharp dividers  

- Teal for positive changes  

- Yellow for warnings  

- Red for cancellations  



### Components:

- Cards  

- Tables  

- Tabs  

- Form fields  

- Confirmation modals  



Everything follows the admin styling language.



---



# 10. Responsive Behavior



### Desktop:

Full functionality.



### Tablet:

Collapsible left menu and horizontal scroll.



### Mobile:

View-only mode, no destructive actions.



---



# 11. Future Enhancements



- Seat-based enterprise licensing  

- Auto-tier recommendations  

- AI-powered subscription risk analysis  

- Cohort analysis dashboards  

- Cross-service usage insights  

- Automated renewal failure workflows  



---



# 12. Conclusion



This specification defines the complete Admin Subscription Management UI for OGC NewFinity.  

It ensures consistent, accurate, and safe handling of subscription data across the platform.

