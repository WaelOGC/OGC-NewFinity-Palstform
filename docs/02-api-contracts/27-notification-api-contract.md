# OGC NewFinity — Notification API Contract (v1.0)



## 1. Introduction

This document defines the full Notification API Contract for the OGC NewFinity platform.  

It specifies backend endpoints for retrieving, marking, broadcasting, and managing user notifications.



This API integrates with:

- Subscription system  

- Challenge system  

- Submission & voting system  

- Wallet system  

- AI usage engine  

- Admin broadcast tools  

- Email notifications  



---



# 2. Base Path & Versioning



All Notification API endpoints follow:



/api/v1/notifications/*



yaml

Copy code



Responses are **JSON**.



---



# 3. Notification Model



Each notification contains:

- id  

- user_id  

- title  

- message  

- type  

- metadata (JSON)  

- is_read (boolean)  

- created_at (timestamp)  



### Notification Types

- system  

- challenge  

- submission  

- voting  

- wallet  

- subscription  

- ai  

- badge  



---



# 4. Endpoints



---



## 4.1 GET `/notifications`

### Description

Returns all notifications for the authenticated user (paginated).



### Query Parameters

- `page` (optional)  

- `limit` (optional)  

- `type` (optional filter)  



### Success Response

{

"success": true,

"notifications": [

{

"id": "string",

"title": "string",

"message": "string",

"type": "challenge",

"is_read": false,

"created_at": "ISO"

}

],

"pagination": {

"page": 1,

"limit": 20,

"total": 145

}

}



yaml

Copy code



---



## 4.2 POST `/notifications/read/:id`

### Description

Marks a single notification as read.



### Success Response

{

"success": true,

"message": "Notification marked as read."

}



yaml

Copy code



### Error Codes

- `NOTIFICATION_NOT_FOUND`



---



## 4.3 POST `/notifications/read-all`

### Description

Marks all notifications for the user as read.



### Success Response

{

"success": true,

"message": "All notifications marked as read."

}



yaml

Copy code



---



## 4.4 GET `/notifications/unread-count`

### Description

Returns the unread notification count.



### Success Response

{

"success": true,

"count": 5

}



yaml

Copy code



---



# 5. Admin Endpoints



(Admin role required)



---



## 5.1 POST `/notifications/broadcast`

### Description

Admin sends a notification to all users.



### Request Body

{

"title": "string",

"message": "string",

"type": "system"

}



shell

Copy code



### Success Response

{

"success": true,

"message": "Broadcast sent."

}



yaml

Copy code



---



## 5.2 POST `/notifications/send`

### Description

Admin sends a notification to a specific user.



### Request Body

{

"user_id": "string",

"title": "string",

"message": "string",

"type": "system|challenge|subscription|wallet|ai|badge"

}



shell

Copy code



### Success Response

{

"success": true,

"message": "Notification sent."

}



yaml

Copy code



---



# 6. Error Response Format



{

"success": false,

"error": {

"code": "ERROR_CODE",

"message": "Readable message"

}

}



markdown

Copy code



---



# 7. Security Requirements



- Admin actions require RBAC  

- Users may only access their own notifications  

- Broadcast messages logged automatically  

- Email notifications must be triggered when applicable  

- Sensitive metadata must be sanitized  



---



# 8. Notification Triggers by System



### **Auth**

- password reset  

- login alerts (future)



### **Subscription**

- payment success  

- payment failure  

- upgrade  

- cancellation  



### **Challenges**

- challenge opened  

- entry approved  

- entry rejected  

- voting started  

- challenge closing  



### **Submissions**

- new vote received  



### **Wallet**

- reward distribution  

- mining payout  

- sync error  



### **Badges**

- new badge unlocked  



### **AI Tools**

- usage limit reached  

- credits refreshed (future)  



---



# 9. Future Enhancements



- User notification preferences  

- Email batching  

- Push notifications (mobile)  

- Browser notifications  

- Notification categories in UI  

- AI-personalized notification summaries  



---



# 10. Conclusion

This API Contract defines all backend interfaces for handling notifications across the OGC NewFinity platform.  

All dashboards and system modules must follow this contract for consistent communication behavior.

