# OGC NewFinity — Authentication & Security Architecture (v1.0)



## 1. Introduction

This document defines the full authentication model, token lifecycle, session handling, access control structure, and security protocols for the OGC NewFinity ecosystem.  

It is the core reference for backend developers, frontend engineers, API maintainers, and future governance teams.



The system is built on **JWT-based authentication**, with layered security models and future support for multi-factor authentication.



---



# 2. Core Authentication Components



OGC NewFinity uses three main authentication elements:



1. **Access Token (Short-Lived)**  

2. **Refresh Token (Long-Lived)**  

3. **Session State + Role Permissions**



These tokens control authentication across:

- Core Platform  

- Wallet Dashboard  

- Amy Agent Dashboard  

- Admin Dashboard  



---



# 3. Authentication Flow



## 3.1 Login Process

1. User submits credentials  

2. Backend verifies email + password  

3. Backend issues:

   - **Access Token** (expires ~15 minutes)  

   - **Refresh Token** (expires ~7–30 days)  

4. Frontend stores Access Token in memory  

5. Refresh Token is stored in an **HTTP-only secure cookie**  

6. User is redirected to the platform dashboard  



---



## 3.2 Token Refresh Process

1. Access Token expires  

2. Frontend sends silent request to `/auth/refresh`  

3. Backend validates Refresh Token from cookie  

4. New Access Token is issued  

5. Refresh Token is rotated or extended  



### Security Rules

- Refresh token must never be accessible via JavaScript  

- Refresh tokens must be tied to:  

  - user_id  

  - device  

  - expiration  

- Refresh token rotation invalidates old tokens  



---



## 3.3 Logout Process

1. User triggers logout  

2. Backend deletes session + refresh token  

3. Frontend removes Access Token  

4. User is redirected to login  



---



# 4. Access Token Details



### Purpose

Authorize user actions quickly without exposing sensitive long-term credentials.



### Format

- JWT  

- Includes:

  - user_id  

  - role  

  - permissions  

  - expiration  



### Lifetime

- ~15 minutes  

- Must be renewed via Refresh Token  



### Storage

- In-memory variable  

- Never stored in localStorage or sessionStorage (security requirement)  



---



# 5. Refresh Token Details



### Purpose

Allow long-term authenticated sessions.



### Format

- JWT or UUID  

- Stored as **httpOnly**, **secure**, **sameSite=strict** cookie  



### Lifetime

- 7–30 days  

- Rotated frequently  



### Rules

- Cannot be accessed by JavaScript  

- Cannot be sent to third-party origins  

- Must match server-stored session fingerprint  



---



# 6. Role-Based Access Control (RBAC)



### Roles

- standard  

- pro  

- enterprise  

- admin  



### Enforcement

Role determines:

- API access  

- UI visibility  

- Rate limits  

- Feature restrictions  

- Admin-only capabilities  



### Implementation

RBAC checks occur at:

- Backend route middleware  

- Frontend navigation guards  

- Admin panel operations  



---



# 7. Security Protocols



## 7.1 Password Security

- Argon2 or bcrypt hashing  

- Salted hashes  

- Strong password policy  

- No plaintext storage  



---



## 7.2 API Rate Limiting

Applied to:

- Auth endpoints  

- AI endpoints  

- Challenge endpoints  



Rate limits vary by:

- Subscription tier  

- IP  

- Request type  



---



## 7.3 Input Sanitization

All incoming payloads must be sanitized to prevent:

- SQL injection  

- XSS  

- CSRF  

- Malformed input  



---



## 7.4 Origin & CORS Security

- Only platform domains allowed  

- Wallet dashboard and Amy dashboard allowed  

- Strict HTTPS enforcement  



---



## 7.5 Session Protections

- Token invalidation on password change  

- Device-based session tracking  

- Force logout from all sessions (admin)  



---



## 7.6 Audit Logs

Admins must have access to:

- Login attempts  

- Password reset attempts  

- Token refresh operations  

- Admin actions  



---



# 8. Multi-Factor Authentication (Planned)



### MFA Options

- Email-based OTP  

- Authenticator app (TOTP)  

- Wallet-based verification (future governance)



### MFA Enforcement Levels

- Optional for normal users  

- Mandatory for admins  

- Optional for enterprise users  



---



# 9. Governance & Smart Contract Security (Future)



Upcoming phases will integrate:

- Token-based authentication  

- On-chain identity validation  

- DAO-level proposal actions  

- Signature-based login options  



---



# 10. Conclusion

This authentication and security architecture forms the backbone of the OGC NewFinity platform.  

All backend services, frontend flows, and admin functions must adhere to these standards to ensure user safety, platform integrity, and long-term scalability.

