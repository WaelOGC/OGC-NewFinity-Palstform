# OGC NewFinity — Challenge API Contract (v1.0)



## 1. Introduction

The Challenge API Contract defines all backend endpoints responsible for challenge listings, categories, tracks, participation, statuses, timelines, and challenge detail retrieval.



This API is used by:

- Challenge Hub  

- Submission System  

- Voting System  

- Admin Panel  

- Contribution Engine  



This document represents the official contract for the Challenge ecosystem.



---



# 2. Base Path & Versioning



All Challenge API endpoints follow:



/api/v1/challenges/*



yaml

Copy code



---



# 3. Core Concepts



### **Challenge Categories**

Organize challenges into themes (ex: Design, Tech, Strategy).



### **Challenge Tracks**

Define targeted audiences:

- Students  

- Groups/Teams  

- Freelancers/Professionals  



### **Challenge States**

- draft  

- scheduled  

- open  

- voting  

- closed  



### **Eligibility Rules**

- Users must meet track requirements  

- Users must follow challenge instructions  

- Subscription tiers may unlock premium challenges  



---



# 4. Endpoints



---



## 4.1 GET `/challenges`

### Description

Returns a list of all active challenges, optionally filtered.



### Query Params

- `category` (optional)

- `track` (optional)

- `status` (optional)



### Success Response

```json
{
  "success": true,
  "challenges": [
    {
      "id": "string",
      "title": "string",
      "category": "string",
      "track": "students|groups|freelancers",
      "status": "open",
      "prize_pool": "string",
      "start_date": "ISO",
      "end_date": "ISO"
    }
  ]
}
```



---



## 4.2 GET `/challenges/:id`

### Description

Returns full challenge details.



### Success Response

{

"success": true,

"challenge": {

"id": "string",

"title": "string",

"description": "string",

"category": "string",

"track": "string",

"status": "open",

"prize_pool": "string",

"rules": "string",

"start_date": "ISO",

"end_date": "ISO",

"created_at": "ISO"

}

}



yaml

Copy code



### Error Codes

- `CHALLENGE_NOT_FOUND`



---



## 4.3 GET `/challenges/categories`

### Description

Returns all challenge categories.



### Success Response

{

"success": true,

"categories": [

"Design",

"Technology",

"Business",

"Creative"

]

}



yaml

Copy code



---



## 4.4 GET `/challenges/track/:track`

### Description

Returns challenges filtered by track.



### Success Response

{

"success": true,

"track": "students",

"challenges": [...]

}



yaml

Copy code



### Error Codes

- `CHALLENGE_INVALID_TRACK`



---



## 4.5 POST `/challenges/enter`

### Description

Registers a user's participation in a challenge.



### Headers

Authorization: `Bearer ACCESS_TOKEN`



### Request Body

{

"challenge_id": "string"

}



shell

Copy code



### Success Response

{

"success": true,

"message": "You have entered the challenge."

}



yaml

Copy code



### Error Codes

- `CHALLENGE_NOT_OPEN`

- `CHALLENGE_ALREADY_ENTERED`

- `CHALLENGE_NOT_ELIGIBLE`

- `CHALLENGE_ACCESS_DENIED` (subscription gated)



---



## 4.6 GET `/challenges/timeline/:id`

### Description

Returns the timeline associated with the challenge.



### Success Response

{

"success": true,

"timeline": {

"start_date": "ISO",

"submission_deadline": "ISO",

"voting_start": "ISO",

"voting_end": "ISO",

"close_date": "ISO"

}

}



yaml

Copy code



---



## 4.7 Admin Endpoints



### 4.7.1 POST `/challenges`

#### Description

Admin creates a new challenge.



#### Request Body

{

"title": "string",

"description": "string",

"category": "string",

"track": "students|groups|freelancers",

"prize_pool": "string",

"rules": "string",

"start_date": "ISO",

"end_date": "ISO"

}



shell

Copy code



#### Success Response

{

"success": true,

"id": "string"

}



yaml

Copy code



#### Error Codes

- `CHALLENGE_ADMIN_ONLY`



---



### 4.7.2 PUT `/challenges/:id`

#### Description

Admin updates an existing challenge.



#### Request Body

Same fields as creation.



### 4.7.3 POST `/challenges/:id/close`

#### Description

Admin closes an active challenge.



### Success Response

{

"success": true,

"message": "Challenge closed."

}



yaml

Copy code



---



# 5. Validation Rules



- Challenge must exist before joining  

- Track must be valid  

- Category must be admin-approved  

- User must meet eligibility conditions  

- Voting period must follow timeline  

- Admin operations require admin role  



---



# 6. Standard Error Response Format



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



# 7. Integration with Other Systems



### **Submissions API**

Users who enter must submit through Submission API.



### **Voting API**

Voting is handled via Submission API but depends on Challenge status.



### **Badges & Contributions**

Participation triggers contribution points.



### **Notifications**

Users receive:

- Entry confirmation  

- Phase changes  

- Challenge closure  



### **Wallet System**

Rewards distributed only after challenge closes.



---



# 8. Future Extensions



- Multi-round challenges  

- AI-generated challenge difficulty scaling  

- Smart-contract-based challenge verification  

- Team-based challenges with role assignments  

- Dynamic prize pools  

- Seasonal event challenges  



---



# 9. Conclusion

This API contract defines all backend interfaces related to challenge management.  

All frontend, backend, and admin features must follow this contract for consistent challenge behavior.

