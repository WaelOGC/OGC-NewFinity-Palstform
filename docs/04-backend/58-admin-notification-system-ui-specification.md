# OGC NewFinity — Admin Notification System UI Specification (v1.0)



## 1. Introduction

This document defines the UI/UX rules for the **Admin Notification System** inside the OGC NewFinity Admin Panel.



The admin notification system enables administrators to:

- Create and send system-wide notifications  

- Send targeted notifications (specific user or segment)  

- Review notification logs  

- Track delivery and read status  

- Manage in-app announcements  

- Broadcast alerts for challenges, rewards, downtime, or major updates  



This system is the backbone of all platform communication.



---



# 2. Routing & Navigation



### Main Route:

`/admin/notifications`



### Subroutes:

- `/admin/notifications` → Notification List  

- `/admin/notifications/create` → New Notification  

- `/admin/notifications/logs` → Delivery Logs  

- `/admin/notifications/announcements` → System Announcements (future)  



---



# 3. Notification List Page



### Header:

- Title: **"Notifications"**  

- CTA: **Create Notification**  



### Table Columns:

- Notification ID  

- Title  

- Type (System / Targeted / Automated)  

- Audience (All users / Tier / Specific user)  

- Status (Sent / Scheduled / Draft)  

- Created by  

- Timestamp  

- Actions  



### Filters:

- Type  

- Audience  

- Status  

- Date range  



### Search:

- Title  

- ID  



---



# 4. Create Notification Page



Page layout:



| Notification Details |

| Audience Targeting |

| Notification Content |

| Scheduling (optional) |

| Action Buttons |

yaml

Copy code



---



## 4.1 Notification Details



Fields:

- Title (required)  

- Message preview (auto-generated from content)  

- Notification type:

  - System-wide  

  - Targeted  

  - Automated (future)  



---



## 4.2 Audience Targeting



Admins can select:



### **1. All Users**

- Sends globally



### **2. By Subscription Tier**

- Free  

- Pro  

- Enterprise  



### **3. By Role**

- User  

- Moderator  

- Admin  



### **4. Specific User**

Field: Email or user ID autocomplete



### **5. Segmented Delivery (future)**

Examples:

- Active creators  

- Dormant users  

- Challenge participants  



---



## 4.3 Notification Content



A rich text editor for message body:

- Headings  

- Paragraphs  

- Bullet points  

- Links  

- Highlight blocks  



Preview panel shows how the notification will appear to users.



---



## 4.4 Scheduling (Optional)



Fields:

- Send now  

- Schedule for later  

- Recurring (future)  



UI Elements:

- Date picker  

- Time picker  



Scheduled notifications display in "Scheduled" status until sent.



---



## 4.5 Action Buttons



- **Send Notification** (primary)  

- **Save as Draft**  

- **Cancel**  



Send requires:

- Validation of fields  

- Confirmation modal:

  - "Are you sure you want to send this notification?"  

  - Summary of audience size  



---



# 5. Notification Delivery Logs



Route:

`/admin/notifications/logs`



### Table Columns:

- Log ID  

- Notification ID  

- Delivery status  

- User  

- Timestamp  

- Error message (if failed)  



Delivery statuses:

- Sent  

- Delivered  

- Read  

- Failed  



### Filters:

- Status  

- Date  

- User  

- Notification ID  



---



# 6. System Announcements (Future)



Admin can create banner-style announcements that appear across user dashboards.



Fields:

- Title  

- Message  

- Severity (Info / Warning / Critical)  

- Background color  

- Start date  

- End date  

- Visibility rules  



Announcements display in global platform UI areas above main content.



---



# 7. Notification Preview



Admin can preview how notifications appear to users:



Views:

- In-app card  

- Notification drawer item  

- Detailed modal view  



Preview must match the Notification Center specification exactly.



---



# 8. Safety, Confirmation & Audit Rules



### Sending notifications:

Requires a confirmation modal.



### Editing notifications:

Only drafts can be edited.  

Sent notifications are immutable.



### Deleting notifications:

Allowed only for drafts.



### Audit Logs (mandatory):

Every admin action must be logged:

- Created notification  

- Modified draft  

- Sent notification  

- Deleted draft  

- Canceled scheduled notification  



Audit data includes:

- Admin ID  

- Timestamp  

- Action type  

- Before → After values  



---



# 9. Empty & Error States



### Empty:

- "No notifications created yet."  

- "No logs available."  



### Error:

> "Unable to load notifications."  

Provide retry button.



---



# 10. Visual Styling (Admin Theme)



### Aesthetic:

- Dark admin surface  

- Minimal neon  

- Compact spacing  

- Clear separators  

- Teal for actions  

- Red for destructive actions  



### Components:

- Tables  

- Cards  

- Form inputs  

- Rich text editor  

- Date-time pickers  

- Confirmation modals  



---



# 11. Responsive Behavior



### Desktop:

Full functionality.



### Tablet:

Collapsible filter panel + horizontal scrolling on logs table.



### Mobile:

View-only (admin actions disabled on mobile).



---



# 12. Future Enhancements



- Automated system notifications  

- Notification templates  

- AI-assisted content generation  

- Analytics dashboard:

  - Open rate  

  - Read rate  

  - Delivery success rate  

- Categorized notification campaigns  

- Push notification integration (mobile app future)  



---



# 13. Conclusion



This specification defines the complete **Admin Notification System UI** for OGC NewFinity.  

It enables safe, scalable, and effective communication across the platform through powerful admin tools.

