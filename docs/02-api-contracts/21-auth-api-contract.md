# OGC NewFinity — Auth API Contract (v1.0)



## 1. Introduction

This document defines the full Authentication API Contract for the OGC NewFinity backend.  

It includes all endpoints, request/response formats, validation rules, JWT structures, cookies, error codes, and security requirements.



The Auth API handles:

- Registration  

- Login  

- Token issuance  

- Token refresh  

- Logout  

- Password reset  

- Session verification  



---



# 2. Base Path & Versioning

All authentication endpoints follow:



/api/v1/auth/*



yaml

Copy code



All responses are **JSON**.



---



# 3. Authentication Models



### Access Token

- Short-lived (~15 minutes)

- JWT

- Stored in memory on the client



### Refresh Token

- Long-lived (7–30 days)

- Stored in **httpOnly**, **secure**, **sameSite=strict** cookie

- Used only to refresh Access Token



---



# 4. Endpoints



---



## 4.1 POST `/auth/register`



### Description

Create a new user account.



### Request Body

{

"email": "string",

"password": "string",

"name": "string"

}



markdown

Copy code



### Validation

- Email: required, valid format  

- Password: min 8 characters  

- Name: required  



### Success Response

{

"success": true,

"message": "Registration successful. Please verify your email."

}



yaml

Copy code



### Error Codes

- `AUTH_EMAIL_IN_USE`

- `AUTH_INVALID_EMAIL`

- `AUTH_WEAK_PASSWORD`



---



## 4.2 POST `/auth/login`



### Description

Authenticate a user and issue tokens.



### Request Body

{

"email": "string",

"password": "string"

}



shell

Copy code



### Success Response

{

"success": true,

"access_token": "JWT_STRING",

"user": {

"id": "string",

"email": "string",

"role": "standard|pro|enterprise|admin",

"name": "string"

}

}



yaml

Copy code



The response also sends a **httpOnly Refresh Token cookie**.



### Error Codes

- `AUTH_INVALID_CREDENTIALS`

- `AUTH_ACCOUNT_NOT_FOUND`

- `AUTH_ACCOUNT_DISABLED`



---



## 4.3 POST `/auth/refresh`



### Description

Exchange Refresh Token for a new Access Token.



### Request Body

None (cookie-only).



### Success Response

{

"success": true,

"access_token": "NEW_JWT"

}



yaml

Copy code



### Error Codes

- `AUTH_REFRESH_EXPIRED`

- `AUTH_REFRESH_INVALID`

- `AUTH_REFRESH_REVOKED`



---



## 4.4 POST `/auth/logout`



### Description

Invalidate the user's Refresh Token and clear cookie.



### Success Response

{

"success": true,

"message": "Logged out successfully."

}



yaml

Copy code



---



## 4.5 POST `/auth/forgot-password`



### Description

Send a reset password email.



### Request Body

{

"email": "string"

}



shell

Copy code



### Success Response

{

"success": true,

"message": "Password reset instructions sent."

}



yaml

Copy code



### Error Codes

- `AUTH_EMAIL_NOT_FOUND`



---



## 4.6 POST `/auth/reset-password`



### Description

Apply a new password using a reset token.



### Request Body

{

"token": "string",

"new_password": "string"

}



markdown

Copy code



### Validation

- Token must be valid and unexpired  

- New password must meet requirements  



### Success Response

{

"success": true,

"message": "Password updated successfully."

}



yaml

Copy code



### Error Codes

- `AUTH_RESET_TOKEN_INVALID`

- `AUTH_RESET_TOKEN_EXPIRED`



---



## 4.7 GET `/auth/me`



### Description

Return authenticated user profile.



### Headers

Authorization: `Bearer ACCESS_TOKEN`



### Success Response

{

"success": true,

"user": {

"id": "string",

"email": "string",

"name": "string",

"role": "standard|pro|enterprise|admin"

}

}



yaml

Copy code



### Error Codes

- `AUTH_ACCESS_EXPIRED`

- `AUTH_ACCESS_INVALID`



---



# 5. Standard Error Response Format



All error responses follow:



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



# 6. Security Requirements



- All passwords hashed with bcrypt/argon2  

- Refresh Tokens stored only in httpOnly cookies  

- Tokens rotated on every refresh  

- Suspicious login attempts logged  

- Brute-force prevention (rate limiting)  

- Admin-only endpoints blocked at middleware  



---



# 7. Future Extensions



- MFA / 2FA verification  

- Login alerts  

- Email verification workflow  

- OAuth / Google login  

- Wallet signature login (for governance phase)



---



# 8. Conclusion

This API contract defines the complete Authentication system for OGC NewFinity.  

All backend and frontend components must adhere strictly to this contract.

