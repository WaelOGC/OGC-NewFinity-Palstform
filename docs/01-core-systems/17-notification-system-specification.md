# OGC NewFinity — Notification System Specification (v1.0)



## 1. Introduction

The Notification System is responsible for delivering real-time and asynchronous communication across the entire OGC NewFinity ecosystem.  

It informs users about updates, rewards, AI usage, challenge results, subscription changes, and system messages.



This document defines:

- Notification types  

- Delivery channels  

- Triggers  

- UI behavior  

- Backend logic  

- Storage structure  

- Admin controls  

- Future expansion  



---



# 2. Notification Channels



### **2.1 In-App Notifications**

- Delivered inside the platform  

- Displayed via the top navigation bell icon  

- Stored in the database  

- Marked as read/unread  



### **2.2 Email Notifications**

- Sent through the verified email provider  

- Used for important account and payment events  

- Must follow branding standards  



---



# 3. Notification Types



### **3.1 System Notifications**

- Maintenance updates  

- Platform announcements  

- New feature releases  

- Policy updates  



### **3.2 Challenge Notifications**

- New challenge opened  

- Submission approved  

- Submission rejected  

- Voting opened  

- Challenge closed  

- Winners announced  

- Rewards distributed  



### **3.3 AI Usage Notifications**

- AI tool reached limit  

- AI credits refreshed  

- High-volume usage alerts  

- Saved output confirmation  



### **3.4 Subscription Notifications**

- Subscription activated  

- Payment success  

- Payment failure  

- Subscription expiring soon  

- Subscription downgraded  



### **3.5 Badge & Contribution Notifications**

- New badge unlocked  

- Contribution points earned  

- Level progression  

- Milestone achievements  



### **3.6 Wallet Notifications**

- Rewards received  

- Mining payout completed  

- Transaction synced  

- Balance threshold alerts  



---



# 4. Notification Trigger Events



### **4.1 User Actions**

- Joining a challenge  

- Voting  

- Using AI tools  

- Upgrading subscription  

- Completing profile  



### **4.2 System Actions**

- Reward distribution  

- Automatic mining payout  

- Subscription renewal  

- Scheduled challenge closing  



### **4.3 Admin Actions**

- Submission approval/rejection  

- Badge assignment  

- Manual notifications  

- System maintenance toggles  



---



# 5. Notification Payload Structure



Every notification must follow this schema:



{

id: string,

user_id: string,

title: string,

message: string,

type: string,

metadata: JSON,

is_read: boolean,

created_at: datetime

}



markdown

Copy code



### Required Fields

- `title`  

- `message`  

- `type`  

- `is_read`  

- `created_at`  



---



# 6. Backend Notification Flow



### **6.1 Trigger Event**

A backend event occurs (ex: challenge approved).



### **6.2 Notification Builder**

- System compiles payload  

- Attaches metadata  

- Assigns type  



### **6.3 Database Insert**

Notification stored in `notifications` table.



### **6.4 Delivery**

- In-App: visible immediately  

- Email: sent depending on notification type  



---



# 7. Frontend Notification Behavior



### **7.1 Notification Bell Icon**

- Shows unread count  

- Lights up with neon animation  



### **7.2 Notification Panel**

- Drop-down or side panel  

- Chronological order  

- Filters by type  

- "Mark all as read" option  



### **7.3 Single Notification View**

- Title  

- Message  

- Timestamp  

- Link to related action (ex: "View Submission")  



### **7.4 Interaction Rules**

- Clicking marks as read  

- Read notifications remain stored  

- Old notifications auto-archived after 90 days (future feature)  



---



# 8. Admin Notification Tools



Admins can:

- Broadcast system-wide notifications  

- Send targeted messages  

- Approve automated notifications  

- Disable or modify default triggers  

- Override notification content  



Admin logs store:

- Who sent the notification  

- Type  

- Timestamp  

- Payload metadata  



---



# 9. Email Notification Requirements



Emails must include:

- Clear subject  

- OGC branding  

- Mobile-friendly layout  

- Fallback plain-text version  

- No excessive decorative elements  



Mandatory email events:

- Account verification  

- Password reset  

- Payment confirmations  

- Subscription changes  



---



# 10. Notification Rate Limits & Safeguards



### Prevent notification spam:

- AI usage alerts capped daily  

- Contribution notifications rolled up (ex: "+50 new points")  

- System announcements grouped  

- Email notifications have hourly caps  



---



# 11. Integration With Other Systems



### **AI Tools**

- Usage warnings  

- Saved result confirmations  



### **Challenges**

- Submission updates  

- Challenge phases  



### **Subscriptions**

- Renewal & billing notifications  



### **Wallet**

- Mining payouts  

- Reward distributions  



### **Badges & Contributions**

- Badge unlocks  

- Level-ups  



---



# 12. Future Enhancements



- Push notifications (mobile app)  

- Browser notifications  

- SMS alerts  

- AI-personalized notification summaries  

- User-defined notification preferences  



---



# 13. Conclusion

This specification defines how notifications operate across the entire ecosystem.  

It ensures consistent, reliable, and structured communication with users while supporting future scalability.

