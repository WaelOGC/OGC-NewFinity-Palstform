# OGC NewFinity — Submission API Contract (v1.0)



## 1. Introduction

The Submission API Contract defines all backend endpoints related to challenge submissions, moderation, content validation, voting, and leaderboard tracking.



This API works closely with:

- Challenge API  

- Badge System  

- Contribution Engine  

- Notifications  

- Admin Panel  

- Wallet Reward System  



This is the official backend contract for the Submission & Voting system.



---



# 2. Base Path & Versioning



All submission endpoints follow:



/api/v1/submissions/*



yaml

Copy code



---



# 3. Core Submission Concepts



### **Submission Status**

- pending — waiting admin approval  

- approved — visible publicly  

- rejected — removed/violated  



### **Submission Content Types**

- image URL  

- video URL  

- file/document  

- text entry  

- external link  



### **Voting Rules**

- 1 vote per user per submission  

- Weighted votes:

  - Free: ×1  

  - Pro: ×1.5  

  - Enterprise: ×2  



### **Admin Moderation**

Admins must manually approve submissions.



---



# 4. Endpoints



---



## 4.1 POST `/submissions`

### Description

User submits an entry to a challenge.



### Headers

Authorization: `Bearer ACCESS_TOKEN`



### Request Body

{

"challenge_id": "string",

"content_url": "string",

"text_content": "string|null"

}



markdown

Copy code



### Validation Rules

- Challenge must be open  

- User must have entered the challenge  

- Only one submission unless challenge allows multiple  

- File links must be validated  



### Success Response

{

"success": true,

"submission_id": "string",

"message": "Submission received and pending review."

}



yaml

Copy code



### Error Codes

- `SUBMISSION_CHALLENGE_CLOSED`

- `SUBMISSION_ALREADY_EXISTS`

- `SUBMISSION_INVALID_CONTENT`

- `CHALLENGE_NOT_ENTERED`



---



## 4.2 GET `/submissions/user`

### Description

Returns all submissions created by the authenticated user.



### Success Response

{

"success": true,

"submissions": [

{

"id": "string",

"challenge_id": "string",

"status": "pending",

"votes": 0,

"content_url": "string",

"created_at": "ISO"

}

]

}



yaml

Copy code



---



## 4.3 GET `/submissions/:id`

### Description

Returns details of a single submission (approved only unless owner/admin).



### Success Response

{

"success": true,

"submission": {

"id": "string",

"challenge_id": "string",

"user_id": "string",

"status": "approved",

"votes": 15,

"content_url": "string",

"text_content": "string",

"created_at": "ISO"

}

}



yaml

Copy code



### Error Codes

- `SUBMISSION_NOT_FOUND`

- `SUBMISSION_NOT_APPROVED` (when not owner or admin)



---



## 4.4 POST `/submissions/:id/vote`

### Description

Adds a vote to a submission.



### Headers

Authorization: `Bearer ACCESS_TOKEN`



### Success Response

{

"success": true,

"message": "Vote counted.",

"weight": 1.5

}



yaml

Copy code



### Voting Logic

Weight = based on user tier:

- Free = 1  

- Pro = 1.5  

- Enterprise = 2  



### Error Codes

- `SUBMISSION_NOT_FOUND`

- `VOTE_ALREADY_CAST`

- `VOTE_NOT_ALLOWED` (challenge state invalid)

- `VOTE_SELF_NOT_ALLOWED` (no voting own submission)



---



## 4.5 GET `/submissions/challenge/:challenge_id`

### Description

Lists all approved submissions for a challenge.



### Success Response

{

"success": true,

"submissions": [

{

"id": "string",

"user_id": "string",

"votes": 20,

"content_url": "string"

}

]

}



yaml

Copy code



---



# 5. Admin Endpoints



---



## 5.1 GET `/submissions/pending`

### Description

Admin retrieves all submissions that require review.



### Success Response

{

"success": true,

"pending": [...]

}



yaml

Copy code



---



## 5.2 POST `/submissions/:id/approve`

### Description

Admin approves a submission.



### Success Response

{

"success": true,

"message": "Submission approved."

}



yaml

Copy code



---



## 5.3 POST `/submissions/:id/reject`

### Description

Admin rejects a submission.



### Request Body

{

"reason": "string"

}



shell

Copy code



### Success Response

{

"success": true,

"message": "Submission rejected."

}



yaml

Copy code



---



# 6. Contribution Integration



Actions and contribution points:

- Submit entry → +25  

- Receive a vote → +1  

- Vote on others → +1  

- Top 3 winners receive bonus  

- Multipliers apply based on subscription tier  



---



# 7. Notifications Integration



Events that trigger notifications:

- Submission received  

- Submission approved  

- Submission rejected  

- New vote received  

- Challenge voting phase begins  

- Challenge closing  



---



# 8. Leaderboard Logic



### Ranking Determined By:

- Weighted votes  

- Admin-approved status  

- Submission time (for tie-breaks)  



Returned via:

GET /submissions/challenge/:challenge_id



yaml

Copy code



---



# 9. Error Response Format



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



# 10. Security Requirements



- Users cannot vote for themselves  

- Users cannot bypass track/category limits  

- Admin-only actions strictly RBAC protected  

- All submission content must be validated  

- Suspicious patterns flagged for admin review  



---



# 11. Future Extensions



- Multi-round submissions  

- Team submissions  

- On-chain vote verification  

- Weighted challenge scoring beyond votes  

- AI-assisted moderation  

- Submission version history  



---



# 12. Conclusion

This API contract defines the complete submission and voting backend for OGC NewFinity.  

All platform features related to challenges must follow this specification.

