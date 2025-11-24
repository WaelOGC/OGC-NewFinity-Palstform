# OGC NewFinity — Badge & Contribution API Contract (v1.0)



## 1. Introduction

The Badge & Contribution API Contract defines all backend endpoints responsible for:

- Contribution point accumulation  

- Point history retrieval  

- Badge unlock logic  

- Badge assignment  

- Tier multipliers  

- Admin badge control  

- User progression tracking  



This API is directly used by:

- Challenge System  

- Submission System  

- AI Usage Engine  

- Wallet Mining Engine  

- Admin Panel  

- Notifications System  



---



# 2. Base Path & Versioning



All endpoints follow:



/api/v1/contributions/*

/api/v1/badges/*



yaml

Copy code



Responses are **JSON**.



---



# 3. Contribution System Concepts



### Contribution Point Sources

- Challenge participation  

- Submissions  

- Voting  

- AI tool usage  

- Wins & placements  

- Daily login (optional future)  



### Multipliers

Based on subscription tier:

- Free: 1×  

- Pro: 1.5×  

- Enterprise: 2×  



### Contribution Fields

Each contribution record contains:

- id  

- user_id  

- action_type  

- points  

- metadata (JSON)  

- created_at  



---



# 4. Badge System Concepts



### Badge Tiers

- common  

- rare  

- epic  

- legendary  



### Badge Unlock Types

- Automatic (points-based)  

- Conditional (milestones)  

- Admin-assigned  

- Special badges  



---



# 5. Endpoints — Contributions



---



## 5.1 GET `/contributions`

### Description

Returns contribution history of authenticated user.



### Response

{

"success": true,

"contributions": [

{

"id": "string",

"action_type": "submission",

"points": 25,

"multiplier": 1.5,

"total": 37.5,

"metadata": {},

"created_at": "ISO"

}

]

}



yaml

Copy code



---



## 5.2 GET `/contributions/stats`

### Description

Returns aggregated contribution stats for the user.



### Response

{

"success": true,

"stats": {

"total_points": 1520,

"badge_count": 7,

"rank": "Gold",

"multiplier": 1.5

}

}



yaml

Copy code



---



## 5.3 POST `/contributions/add`

### Description

Internal-only endpoint (used by platform systems).



### Request Body

{

"user_id": "string",

"action_type": "string",

"base_points": number,

"metadata": {}

}



shell

Copy code



### Response

{

"success": true,

"points_awarded": 37.5

}



yaml

Copy code



### Notes

- Multiplier applied automatically  

- Trigger badge evaluation  

- Trigger notifications  



---



# 6. Endpoints — Badges



---



## 6.1 GET `/badges`

### Description

Returns all available badges.



### Response

{

"success": true,

"badges": [

{

"id": "string",

"name": "Contributor I",

"tier": "common",

"description": "Earn 500 points.",

"icon_url": "string"

}

]

}



yaml

Copy code



---



## 6.2 GET `/badges/mine`

### Description

Returns badges earned by authenticated user.



### Response

{

"success": true,

"earned": [

{

"id": "string",

"badge_id": "string",

"earned_at": "ISO"

}

]

}



yaml

Copy code



---



## 6.3 POST `/badges/evaluate`

### Description

Platform-internal endpoint that evaluates badge unlock conditions after contribution events.



### Request Body

{

"user_id": "string"

}



shell

Copy code



### Response

{

"success": true,

"new_badges": [

{

"badge_id": "string"

}

]

}



yaml

Copy code



---



## 6.4 Admin: POST `/badges/assign`

### Description

Admin assigns a badge manually.



### Request Body

{

"user_id": "string",

"badge_id": "string",

"reason": "string"

}



shell

Copy code



### Response

{

"success": true,

"message": "Badge assigned."

}



yaml

Copy code



### Error Codes

- `BADGE_ADMIN_ONLY`

- `USER_NOT_FOUND`

- `BADGE_NOT_FOUND`



---



# 7. Error Response Format



{

"success": false,

"error": {

"code": "ERROR_CODE",

"message": "Readable error message"

}

}



yaml

Copy code



---



# 8. Security Requirements



- Admin routes protected by RBAC  

- Contribution actions validated before awarding  

- Users cannot manipulate contribution points  

- Badge unlock logic must be server-side only  



---



# 9. System Integrations



### Challenge System

- Adds points for submissions, votes, wins  

- Triggers badge evaluations  



### AI Agent

- Adds points for AI usage  

- Triggers analytics  



### Wallet Mining Engine

- Converts contribution points → tokens  



### Notifications

Triggers:

- New badge unlocked  

- Contribution milestone reached  



### Admin Panel

- Badge management  

- Contribution audit logs  



---



# 10. Future Extensions



- Seasonal score resets  

- Badge rarity drops (NFT-based)  

- Public user profiles with badge display  

- Contribution leaderboards  

- Prestige tier system  



---



# 11. Conclusion

This API Contract defines all backend interfaces for managing badges, contributions, and user progression.  

All challenge, AI, wallet, and admin systems depend on this contract.

