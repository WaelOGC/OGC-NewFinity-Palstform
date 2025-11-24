# OGC NewFinity — Backend API Standards & Conventions (v1.0)



## 1. Introduction

This document defines the official API standards, conventions, naming rules, versioning policies, and response formatting rules for all backend services inside the OGC NewFinity ecosystem.



These standards ensure:

- Consistency  

- Predictability  

- Professional-grade API architecture  

- Easy integration with frontends & future SDKs  

- Long-term maintainability  



All backend developers **must follow this document** for every API endpoint.



---



# 2. API Versioning



### Base Path Format:

/api/v1/<module>/<resource>



markdown

Copy code



Versioning rules:

- Only use `v1` during initial development  

- Introduce `v2`, `v3`, etc. for breaking changes  

- Never change existing behavior inside an active version  

- Provide deprecation warnings 60+ days before removal  



Examples:

/api/v1/auth/login

/api/v1/challenges/list

/api/v1/wallet/transactions



markdown

Copy code



---



# 3. Resource Naming Conventions



### Use **plural nouns** for resource names:

- `/users`

- `/challenges`

- `/submissions`

- `/notifications`

- `/wallet/transactions`



### Never use:

- `/user-list`

- `/getUsers`

- `/challengeItem`



### Only descriptive, REST-aligned resources.



---



# 4. HTTP Methods & Their Meanings



| Method | Purpose |

|--------|---------|

| **GET** | Fetch list or single resource |

| **POST** | Create resource or perform action |

| **PUT** | Replace entire resource |

| **PATCH** | Modify part of a resource |

| **DELETE** | Remove resource |



### Actions that are not CRUD:

Use `/action` subpath.



Examples:

POST /api/v1/wallet/transactions/reward

POST /api/v1/auth/refresh

POST /api/v1/challenges/:id/close



yaml

Copy code



---



# 5. Query Parameters



Use query parameters for:

- Pagination → `?page=1&limit=20`

- Filters → `?status=pending&category=ai`

- Sorting → `?sort=createdAt&order=desc`

- Searching → `?search=keyword`



All optional parameters **must** have default values:

- Default page: 1  

- Default limit: 20  



---



# 6. Path Parameter Standards



Path params must:

- Use lowercase

- Use hyphens only when needed

- Never use underscores



Correct:

/challenges/42

/users/abc123



makefile

Copy code



Incorrect:

/challenges/42/details

/users?id=123



yaml

Copy code



---



# 7. Request Body Standards



Always use:

- JSON only  

- Clear, simple structure  

- snake_case is forbidden  

- camelCase only  



Example:

{

"title": "AI Challenge",

"category": "technology",

"deadline": "2025-04-01T18:00:00Z"

}



yaml

Copy code



---



# 8. Standard API Response Structure



## Success Response Format:

{

"success": true,

"message": "Entity created successfully.",

"data": { ... }

}



yaml

Copy code



### Rules:

- Always include `success` boolean  

- Always include human-friendly `message`  

- `data` is optional for endpoints that do not return objects  



---



## Error Response Format:

{

"success": false,

"error": {

"code": "INVALID_INPUT",

"message": "Email address is required.",

"details": { ... }

}

}



yaml

Copy code



### Rules:

- `success = false`

- `error.code` = UPPER_SNAKE_CASE

- `error.message` = user-facing explanation

- `error.details` = optional metadata



---



# 9. Standard Error Codes



| Code | Meaning |

|------|---------|

| INVALID_INPUT | Missing or invalid fields |

| UNAUTHORIZED | Missing or invalid auth token |

| FORBIDDEN | Not enough permission |

| NOT_FOUND | Resource does not exist |

| RATE_LIMITED | Too many requests |

| SERVER_ERROR | Generic internal error |

| VALIDATION_ERROR | Schema validation failure |

| DUPLICATE | Unique constraint failed |

| CONFLICT | Action not allowed due to data state |



---



# 10. Pagination Format



Standard pagination response:

{

"success": true,

"data": [ ... ],

"pagination": {

"page": 1,

"limit": 20,

"total": 184,

"totalPages": 10

}

}



yaml

Copy code



---



# 11. Authentication Requirements



Protected routes must:

- Require `Authorization: Bearer <access_token>`

- Reject missing or invalid tokens

- Use refresh token for renewing access



### Forbidden:

- Passing tokens in query params  

- Using localStorage-only auth without cookies  

- Storing refresh tokens client-side  



---



# 12. Admin Route Standards



Admin routes must:

- Start with `/admin` prefix  

- Require elevated permissions  

- Use strict logging  

- Trigger audit trail entries  



Example:

POST /api/v1/admin/challenges/publish/:id



yaml

Copy code



---



# 13. File Upload Conventions



### Upload Endpoint:

POST /api/v1/files/upload



shell

Copy code



### Response:

{

"success": true,

"data": {

"fileUrl": "...",

"fileId": "..."

}

}



yaml

Copy code



Rules:

- Must use signed URLs for download  

- Large files must be streamed  

- No raw file content in JSON  



---



# 14. Rate Limiting Standards



Every endpoint must have:

- Global limiter  

- Tier-based limiter  

- Abuse detection fallback  



Example limits:

- Free: 60 req/min  

- Pro: 200 req/min  

- Enterprise: 500 req/min  



---



# 15. Logging Standards



Each API call must log:

- Timestamp  

- Endpoint  

- User ID (if available)  

- Response status code  

- IP address  

- Latency  

- Error (if any)  



Logs feed into Observability + Admin Log systems.



---



# 16. Naming Conventions



### Modules:

`auth`, `user`, `wallet`, `challenge`, etc.



### Files:

- `auth.controller.js`

- `auth.service.js`

- `auth.routes.js`



### Variables:

- `camelCase` only



### Constants:

- `UPPER_SNAKE_CASE`



---



# 17. Validation Conventions



Use structured schema validation:

- Zod (preferred)

- Joi (alternative)



Validation errors must produce:

{

"success": false,

"error": {

"code": "VALIDATION_ERROR",

"message": "Invalid email format."

}

}



yaml

Copy code



---



# 18. Deprecation Policy



Steps:

1. Mark endpoint as deprecated  

2. Add `X-Deprecated` header  

3. Provide alternative endpoint in message  

4. Remove only after a 60–90 day period  



---



# 19. Future Enhancements



- APISDK generation (JS/TS)  

- GraphQL gateway (optional future)  

- API playground (backend developer tool)  

- Webhook signature rules  

- Public API documentation (Swagger/OpenAPI)  



---



# 20. Conclusion



This document defines the official backend API standards for OGC NewFinity.  

Every endpoint, developer, and service must adhere to these conventions to maintain quality, predictability, and long-term scalability.

