# OGC NewFinity — Backend Rate Limiting Engine Specification (v1.0)



## 1. Introduction

This document defines the backend logic, throttling algorithms, enforcement rules, and monitoring requirements for the **Rate Limiting Engine** inside the OGC NewFinity ecosystem.



This engine protects:

- API stability  

- Service availability  

- AI Gateway usage  

- Abuse prevention  

- Tier-based quotas  

- Emergency throttling  



The system must be precise, predictable, and scalable.



---



# 2. Rate Limiting Architecture Overview



The engine includes:



1. **Global Rate Limiting**  

2. **Per-Endpoint Limits**  

3. **Per-User Limits**  

4. **Per-Tier Limits** (Free, Pro, Enterprise)  

5. **AI Model Limits**  

6. **IP-Based Throttling**  

7. **Emergency Restriction Mode**  

8. **Admin Overrides**  

9. **Logging & Alerts**  



All limits must be configurable in the Admin Panel.



---



# 3. Storage & Caching Layer



The rate limiting engine uses a **counter-based** approach.



### Primary options:

- In-memory (dev)

- Redis (future production)



### Counters track:

- Requests per user  

- Requests per IP  

- Requests per endpoint  

- Request spikes  

- AI usage  



Counter reset intervals:

- 60 seconds (default)

- Custom per endpoint  



---



# 4. Enforcement Strategy



Rate limiting actions include:



### 1. **Allow**

User has remaining quota.



### 2. **Throttle**

Delay response slightly to smooth spikes.



### 3. **Block**

Immediately return:

429 Too Many Requests

{

"success": false,

"error": {

"code": "RATE_LIMITED",

"message": "You have exceeded your request limit. Please try again shortly."

}

}



yaml

Copy code



### 4. **Ban (Temporary)**

Triggered for:

- DDoS patterns  

- Suspicious traffic  

- AI abuse  



Duration:

- 5 minutes → 1 hour depending on severity  



---



# 5. Rate Limit Scopes



## 5.1 Global Limits

Default across entire platform.



Examples:

- 200 req/min per user  

- 600 req/min per IP  



## 5.2 Endpoint-Specific Limits

Critical endpoints have strict limits.



Examples:

- `/auth/login` → 5 req/min  

- `/auth/refresh` → 10 req/min  

- `/ai/generate` → Tier-based  

- `/wallet/transactions` → 20 req/min  

- `/submissions` → 10 req/min  



## 5.3 Tier-Based Limits

Each subscription tier has a different quota.



| Tier | API Limit | AI Limit | Notes |

|------|-----------|-----------|-------|

| Free | 60/min | 10/min | Strictest |

| Pro | 200/min | 40/min | Balanced |

| Enterprise | 500/min | 120/min | High throughput |



## 5.4 Per-User Limits

Each user has:

- Daily quota  

- Per-minute quota  

- AI quota  



## 5.5 IP-Based Limits

Used to detect bots, scripts, or malicious automation.



---



# 6. AI Gateway Rate Limits



AI usage requires stricter handling.



Tiers:

- Free → 10/min, 100/day  

- Pro → 40/min, 500/day  

- Enterprise → 120/min, 2000/day  



AI-related error:

error.code = "AI_RATE_LIMITED"



yaml

Copy code



AI abuse automatically triggers:

- User cooldown  

- Security logs  

- Admin alert  



---



# 7. Emergency Throttling Mode



In critical load conditions:

- Reduce all limits by 50–80%  

- Restrict AI endpoints first  

- Log activation  

- Send admin alert  

- Display system-wide notice (future)  



This mode can be:

- Automatic (load triggers)

- Manual (admin triggers)



Backend must enforce immediately.



---



# 8. Admin Overrides



Admins may:

- Disable limits temporarily  

- Edit endpoint limits  

- Edit user-specific limits  

- Reset counters  

- Apply cooldown to abusive users  

- Apply higher quotas to VIP users  



All actions must:

- Require confirmation  

- Be logged into Audit Trail  

- Trigger security-level logging  



---



# 9. Rate Limit Calculation Logic



### Token Bucket Method (recommended)



For each user/endpoint:

- bucket.capacity = max requests  

- bucket.tokens += refillRate * timeElapsed  

- bucket.tokens-- on each request  

- If tokens <= 0 → block  



### Sliding Window method (future option)



Used for:

- AI Gateway precision  

- Billing analytics  



---



# 10. Response Headers



When throttling applies, include:



X-RateLimit-Limit: 100

X-RateLimit-Remaining: 5

X-RateLimit-Reset: 27

Retry-After: 27



sql

Copy code



For AI-specific:

X-AI-Quota-Remaining

X-AI-Quota-Reset



yaml

Copy code



---



# 11. Logging Requirements



Must log:

- Rate limit hits  

- Blocked requests  

- Suspicious patterns  

- IP bans  

- Cooldowns applied  

- Emergency throttle activations  



Log fields include:

- userId  

- ip  

- route  

- method  

- tier  

- limit group  

- timestamp  



Rate limit logs appear in:

- Logging & Observability Engine  

- Admin Panel (Rate Limit Logs)  

- Security Panel  



---



# 12. Error Codes



| Code | Meaning |

|------|---------|

| RATE_LIMITED | User exceeded request limits |

| AI_RATE_LIMITED | User exceeded AI request limits |

| IP_RATE_LIMITED | IP triggered throttling |

| EMERGENCY_THROTTLE_ACTIVE | Emergency restriction mode enabled |

| USER_COOLDOWN_ACTIVE | User is temporarily restricted |

| INVALID_RATE_LIMIT_GROUP | Admin misconfigured limit set |



---



# 13. Performance Requirements



- Must handle > 5,000 requests per second (future scaling)  

- Redis recommended for production  

- Counters must reset precisely  

- Low latency (<1 ms for check)  

- Memory-safe counter management  



---



# 14. Future Enhancements



- Adaptive rate limiting (AI-based)  

- Usage-based billing  

- Auto-ban for extreme abuse  

- Global CDN-level throttling  

- Rate limit analytics dashboard  

- Automated tier upgrades based on usage  



---



# 15. Conclusion



This document defines the full backend Rate Limiting Engine for OGC NewFinity.  

It ensures protection against abuse, guarantees stability, and provides the necessary foundations for scalable, tier-based API usage control.

