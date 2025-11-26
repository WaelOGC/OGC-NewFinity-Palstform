# OGC NewFinity — Admin API Contract (v1.0)



## 1. Introduction

The Admin API Contract defines all backend endpoints restricted exclusively to Admin users.  

These endpoints control internal system operations, including user management, challenge moderation, submission approvals, badge assignment, reward distribution, analytics retrieval, and platform oversight.



This API is strictly protected by RBAC and logs every operation for audit purposes.



This is one of the highest-security modules in the entire OGC NewFinity backend.



---



# 2. Base Path & Versioning



All Admin endpoints follow:



/api/v1/admin/*



yaml

Copy code



Every endpoint **requires**:

- Admin role  

- Authenticated ACCESS_TOKEN  

- Logging of the action  



Responses are **JSON**.



---



# 3. Admin Permission Model



Admins can:

- Manage users  

- Approve/reject submissions  

- Create/edit/close challenges  

- Assign badges  

- Trigger rewards  

- Broadcast notifications  

- Review logs & analytics  

- Modify subscription statuses  

- Manage system-level settings (limited)  



Admins **cannot**:

- Access user passwords  

- Move tokens on behalf of users  

- Bypass JWT authentication  

- Disable logging for admin actions  



---



# 4. Endpoints



---



## 4.1 GET `/admin/users`

### Description

Returns paginated list of all users.



### Query Parameters

- `page`

- `limit`

- `role` (optional)



### Success Response

```json
{
  "success": true,
  "users": [
    {
      "id": "string",
      "email": "string",
      "role": "standard",
      "created_at": "ISO"
    }
  ]
}
```



yaml

Copy code



---



## 4.2 GET `/admin/users/:id`

### Description

Returns full user profile (including internal metadata).



### Success Response

{

"success": true,

"user": {

"id": "string",

"email": "string",

"role": "pro",

"badges": [...],

"submissions": [...],

"contributions": [...],

"created_at": "ISO"

}

}



yaml

Copy code



---



## 4.3 POST `/admin/users/update-role`

### Description

Admin updates user role.



### Request Body

{

"user_id": "string",

"role": "standard|pro|enterprise|admin"

}



shell

Copy code



### Success Response

{

"success": true,

"message": "User role updated."

}



yaml

Copy code



### Error Codes

- `ADMIN_CANNOT_DOWNGRADE_SELF`

- `USER_NOT_FOUND`



---



# 5. Challenge Management



---



## 5.1 GET `/admin/challenges`

### Description

Returns all challenges (including draft, scheduled, closed).



---



## 5.2 POST `/admin/challenges`

### Description

Create a new challenge.



### Request Body

(same structure as Challenge API creation endpoint)



### Success Response

{

"success": true,

"id": "string"

}



yaml

Copy code



---



## 5.3 PUT `/admin/challenges/:id`

### Description

Admin edits an existing challenge.



---



## 5.4 POST `/admin/challenges/:id/close`

### Description

Force-close a challenge.



---



# 6. Submission Moderation



---



## 6.1 GET `/admin/submissions/pending`

### Description

List all submissions waiting for review.



---



## 6.2 POST `/admin/submissions/:id/approve`

### Description

Approve submission and make it public.



---



## 6.3 POST `/admin/submissions/:id/reject`

### Request Body

{

"reason": "string"

}



yaml

Copy code



### Description

Rejects the submission and notifies user.



---



# 7. Badge Management



---



## 7.1 POST `/admin/badges/assign`

### Request Body

{

"user_id": "string",

"badge_id": "string",

"reason": "string"

}



yaml

Copy code



### Description

Assigns a badge manually.



---



# 8. Reward Distribution



---



## 8.1 POST `/admin/rewards`

### Description

Admin triggers token rewards for a challenge or event.



### Request Body

{

"user_id": "string",

"amount": "string",

"reason": "string"

}



yaml

Copy code



---



# 9. Notifications Control



---



## 9.1 POST `/admin/notifications/broadcast`

Broadcast to all users.



## 9.2 POST `/admin/notifications/send`

Send to a specific user.



---



# 10. System Logs & Analytics



---



## 10.1 GET `/admin/logs`

Returns platform logs (paginated).



### Response

{

"success": true,

"logs": [...]

}



yaml

Copy code



---



## 10.2 GET `/admin/analytics`

Returns key metrics for:

- users  

- submissions  

- challenges  

- AI usage  

- rewards  

- contributions  



---



# 11. Error Response Format



{

"success": false,

"error": {

"code": "ERROR_CODE",

"message": "Readable message"

}

}



yaml

Copy code



---



# 12. Security Requirements



- All admin actions MUST be logged  

- RBAC enforced at middleware  

- Sensitive fields must not be exposed  

- Admin sessions must use JWT + secure cookies  

- Rate limiting applies to prevent misuse  

- Challenge & reward edits protected by confirmation step  



---



# 13. Future Extensions



- Moderator role with limited permissions  

- Support team role  

- Automated moderation AI  

- Governance admin endpoints  

- Audit dashboards  

- High-security action approvals (multi-admin confirmation)  



---



# 14. Conclusion

This Admin API Contract defines all privileged backend operations within OGC NewFinity.  

It ensures consistent, secure, and auditable administrative behavior across the entire ecosystem.

