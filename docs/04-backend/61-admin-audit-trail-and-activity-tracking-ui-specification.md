# OGC NewFinity — Admin Audit Trail & Activity Tracking UI Specification (v1.0)



## 1. Introduction

This document defines the **Admin Audit Trail & Activity Tracking UI**, the central system that records every administrative and system-level action across the OGC NewFinity ecosystem.



The audit system enables administrators to:

- Track sensitive changes  

- Trace system actions back to the responsible admin  

- Investigate incidents or suspicious activity  

- Review all modifications to challenges, users, wallets, rewards, submissions, API limits, and more  

- Maintain a verifiable activity history for compliance and internal governance  



This is a mission-critical component for operational integrity.



---



# 2. Routing & Navigation



### Main Route:

`/admin/audit`



### Subroutes:

- `/admin/audit` → Audit Trail Overview  

- `/admin/audit/:id` → Detailed Audit Entry  

- `/admin/audit/admin/:adminId` → Admin Activity Profile  

- `/admin/audit/changes/:entityType/:entityId` → Entity-specific change history  



---



# 3. Audit Trail Overview Page



### Header:

- Title: **"Audit Trail"**  

- Description: Complete administrative and system activity history  



### Table Columns:

- Audit ID  

- Admin User  

- Action  

- Category (User / Submission / Challenge / Wallet / Subscription / System / Rate Limits / Badge / Notification / Logs)  

- Before → After summary  

- IP address  

- Timestamp  

- Actions  



### Filters:

- Category  

- Admin user  

- Entity type  

- Date range  

- Severity  



### Search:

- Search across messages, admin names, entity IDs  



---



# 4. Audit Entry Detail View



Route:

`/admin/audit/:id`



### Sections:

- Audit Summary  

- Admin Details  

- Entity Details  

- Before/After Deep Comparison  

- Metadata (JSON)  

- Related events  



---



## 4.1 Audit Summary



Fields:

- Audit ID  

- Action name  

- Category  

- Timestamp  

- IP address  

- Device (if captured)  

- Severity level  



Severity Levels:

- Low (normal)  

- Medium (permission action)  

- High (restricted action)  

- Critical (deletions, financial changes, system changes)  



---



## 4.2 Admin Details



Displays:

- Admin name  

- Email  

- Role  

- Admin profile link  



---



## 4.3 Entity Details



Shows the object affected:

- User  

- Submission  

- Challenge  

- Notification  

- Badge  

- Wallet  

- Subscription  

- System configuration  



Fields:

- Entity ID  

- Entity name/label  

- Link to entity page  



---



## 4.4 Before/After Comparison



### UI:

A two-column diff viewer:



| BEFORE CHANGE | AFTER CHANGE |

yaml

Copy code



Behaviors:

- Highlight differences  

- Collapsible sections  

- JSON mode toggle  

- Option to expand nested objects  



---



## 4.5 Metadata Viewer



A JSON viewer that shows:

- Raw audit payload  

- Request metadata  

- Admin note (if any)  

- Additional flags  

- System version identifier  



"Copy JSON" button included.



---



## 4.6 Related Events



Shows linked audit entries by:

- Same entity  

- Same admin  

- Same Request ID  

- Same category  



Useful for reconstructing entire workflows.



---



# 5. Admin Activity Profile Page



Route:

`/admin/audit/admin/:adminId`



Displays:

- Admin Summary Card  

- Activity Metrics  

- Recent Actions  

- Category Breakdown  

- Suspicious or excessive action warnings  



### Tables:

- Actions performed  

- Deletions  

- Approvals  

- Rejections  

- Edits  



### Metrics:

- Avg. actions/day  

- High-impact actions  

- Logs correlated with this admin  



---



# 6. Entity Change History View



Route:

`/admin/audit/changes/:entityType/:entityId`



Examples:

- `/admin/audit/changes/user/9z3ff`  

- `/admin/audit/changes/challenge/123`  



Displays:

- Full chronological change list for the entity  

- Before/after values  

- Admin responsible  

- Timestamp  

- Linked actions  



---



# 7. Audit Categories



Categories ensure clarity:



### Core Categories:

- User  

- Submission  

- Challenge  

- Wallet  

- Subscription  

- Badge  

- Notification  

- Rate Limit  

- Role & Permission  

- System Settings  

- Admin Actions  

- Security Events  



Each category has its own icon & color in admin UI.



---



# 8. Security & Consistency Rules



### All high-impact actions must be logged:

- User suspension/deletion  

- Wallet adjustments  

- Reward distribution  

- Challenge publishing  

- Submission approval/rejection  

- Subscription tier upgrade  

- Notification broadcasts  

- Rate limit modifications  

- Badge creation or assignment  



### Logs are immutable:

- Cannot be edited  

- Cannot be deleted  

- Cannot be filtered out by other admins  

- System preserves full integrity  



### Retention:

- Minimum 5 years (configurable)  



---



# 9. Permissions



Only roles with "Audit Access" permission may view logs.



Critical logs require:

- Admin role level: Senior Admin or higher  

- MFA enforcement (future)  



---



# 10. Empty & Error States



### Empty:

> "No audit entries found for this filter."



### Error:

> "Unable to load audit logs. Try again later."



Retry option included.



---



# 11. Visual Styling (Admin Theme)



### Look & Feel:

- Dark admin theme  

- Sharp boundaries  

- Monospace text inside JSON viewer  

- Severity-based coloring:

  - Low → grey  

  - Medium → blue  

  - High → yellow  

  - Critical → neon red/pink  



### Components:

- Diff viewer  

- JSON viewer  

- Tabs  

- Alert banners  

- High-density tables  



---



# 12. Responsive Behavior



### Desktop:

Full diff viewer, JSON viewer, tables.



### Tablet:

Collapsible diff sections.



### Mobile:

Limited read-only mode.



---



# 13. Future Enhancements



- AI-powered anomaly detection ("Suspicious admin behavior detected")  

- Automated timeline reconstruction  

- Cross-log correlation visualization  

- Real-time streaming audit entries  

- "Explain this audit entry" via AI assistant  



---



# 14. Conclusion



This specification defines the complete **Admin Audit Trail & Activity Tracking UI** for OGC NewFinity.  

It ensures long-term transparency, governance, and operational accountability across all administrative actions.

