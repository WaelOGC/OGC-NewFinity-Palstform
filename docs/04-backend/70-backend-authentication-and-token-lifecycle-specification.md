# OGC NewFinity — Backend Authentication & Token Lifecycle Specification (v1.0)



## 1. Introduction

This document defines the complete authentication system and token lifecycle rules for the OGC NewFinity backend.



The auth system must be:

- Secure  

- Modern  

- Scalable  

- Session-based (via cookies)  

- Compliant with best practices  

- Consistent across all services  

- Resistant to token theft and replay attacks  



The authentication architecture powers the entire OGC ecosystem including:

- Dashboard  

- Wallet  

- AI Workspace (Amy)  

- Challenges & Submissions  

- Admin Panel  



---



# 2. Authentication Architecture Overview



The system uses a **dual-token model**:



### 1. Access Token

- Short-lived  

- JWT  

- Stored in memory on the frontend  

- Sent via `Authorization: Bearer <token>`  

- Lifetime: **15 minutes**  



### 2. Refresh Token

- Long-lived  

- httpOnly secure cookie  

- Rotated on use  

- Lifetime: **7–30 days** (configurable)  

- Bound to device + IP (future)  



---



# 3. Login Flow



### Endpoint:

POST /api/v1/auth/login



shell

Copy code



### Request:

{

"email": "user@example.com",

"password": "mypassword"

}



markdown

Copy code



### Backend Actions:

1. Validate email/password  

2. Generate access token  

3. Generate refresh token  

4. Set refresh token cookie (httpOnly, secure, sameSite)  

5. Return access token + user info  



### Response:

{

"success": true,

"data": {

"accessToken": "...",

"user": { ... }

}

}



yaml

Copy code



---



# 4. Refresh Token Flow



### Endpoint:

POST /api/v1/auth/refresh



markdown

Copy code



### Backend Actions:

1. Verify refresh token  

2. Rotate token (new RT replaces old one)  

3. Issue new access token  

4. Set new refresh token cookie  



### Response:

{

"success": true,

"data": {

"accessToken": "..."

}

}



yaml

Copy code



---



# 5. Logout Flow



### Endpoint:

POST /api/v1/auth/logout



yaml

Copy code



Actions:

- Clear refresh token cookie  

- Invalidate refresh token in DB  

- No access token required  



---



# 6. Cookie Settings



Refresh token cookie attributes:



httpOnly: true

secure: true

sameSite: "strict"

path: "/"

maxAge: 30 days



yaml

Copy code



The cookie must **never** be accessible via JavaScript.



---



# 7. Token Structure (Access Token)



JWT payload contains:



{

"sub": userId,

"role": role,

"tier": subscriptionTier,

"iat": timestamp,

"exp": timestamp

}



yaml

Copy code



Rules:

- Must NOT contain personal data  

- Must expire quickly  

- Must be signed with a strong secret  



---



# 8. Refresh Token Storage & Rotation



Refresh tokens are stored in the database:



Fields:

- tokenHash (hashed)  

- userId  

- device info (future)  

- expiresAt  

- revoked: boolean  



Rotation rules:

- Every refresh request issues a NEW token  

- Old token becomes invalid  

- Attempting to reuse an old token triggers a **security alert**  



---



# 9. Session Management Rules



- One user may have multiple sessions (multiple devices)  

- Admin can view and revoke sessions  

- Sessions must show:

  - Device  

  - IP  

  - CreatedAt  

  - LastUsed  



---



# 10. Forgot Password Flow



### Endpoint:

POST /api/v1/auth/forgot-password



markdown

Copy code



Backend:

- Generate password-reset token  

- Send email with link  

- Store hashed reset token in DB  

- Expiration: 30 minutes  



### Reset Endpoint:

POST /api/v1/auth/reset-password



yaml

Copy code



---



# 11. Email Verification Flow



- User receives email with verification token  

- Token stored in DB (hashed)  

- Expiration: 24 hours  

- User must verify before accessing certain features  



### Endpoint:

POST /api/v1/auth/verify



yaml

Copy code



---



# 12. Role & Permission Enforcement (RBAC)



Roles:

- User  

- Pro  

- Enterprise  

- Admin  

- Super Admin  



Middleware:

- `requireAuth`  

- `requireRole('admin')`  

- `requireTier('pro')`  



Every protected route must include:

- Rate limits  

- RBAC enforcement  

- Logged events  



---



# 13. Security Requirements



### Mandatory:

- Hash passwords using bcrypt  

- Hash refresh tokens before storing  

- Block login after repeated failed attempts  

- Audit log every admin login  

- Track IP + user-agent metadata  

- Prevent token replay attacks  

- Validate token signature on every request  



### Forbidden:

- Storing passwords in plaintext  

- Storing raw refresh tokens  

- Allowing refresh tokens in localStorage  

- Allowing tokens via query params  



---



# 14. Token Expiration Rules



### Access token:

- 15 minutes  

- Non-refreshable  



### Refresh token:

- 7–30 days  

- Rotated on each use  



### Password reset:

- 30 minutes  



### Email verification:

- 24 hours  



---



# 15. Admin Authentication Rules



Admin login requires:

- Role = `admin` or higher  

- Future: 2FA / MFA  

- Admin actions logged in audit trail  

- Admin sessions treated differently  

- Admin tokens cannot be used for user endpoints  



---



# 16. Error Codes



| Code | Meaning |

|------|---------|

| INVALID_CREDENTIALS | Wrong email/password |

| TOKEN_EXPIRED | Access or refresh token expired |

| INVALID_TOKEN | Malformed or invalid token |

| TOKEN_REUSED | Replayed refresh token |

| UNVERIFIED_EMAIL | User email not verified |

| TOO_MANY_ATTEMPTS | Rate limited login |

| SESSION_REVOKED | Session no longer valid |



---



# 17. Logging Requirements



Log:

- All logins (success/failure)  

- Token refresh events  

- Token reuse attempts (critical)  

- Admin logins  

- Password reset requests  

- Verification token generation  

- Suspicious login behavior  



All logs feed into:

- Security logs  

- System logs  

- Audit logs  



---



# 18. Future Enhancements



- Device-based refresh token binding  

- Adaptive authentication (IP risk scanning)  

- WebAuthn / MFA  

- Session-level permissions  

- Automatic logout on password change  



---



# 19. Conclusion



This specification defines the full authentication and token lifecycle for OGC NewFinity.  

It ensures secure, scalable, and future-proof access to the entire ecosystem.

