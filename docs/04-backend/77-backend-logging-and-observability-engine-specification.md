# OGC NewFinity — Backend Logging & Observability Engine Specification (v1.0)



## 1. Introduction

This document defines the complete backend logging, monitoring, metrics, tracing, and observability architecture for the OGC NewFinity platform.



The goal of the Observability Engine is to ensure:

- Full visibility into system behavior  

- Fast debugging  

- Predictable performance  

- Proactive detection of issues  

- Reliable auditability  

- Secure log retention  

- Scalable analytics  



This engine powers both internal admin tools and automated system stability processes.



---



# 2. Observability Components



The Observability Layer includes:



1. **API Request Logging**  

2. **Error Logging**  

3. **Security Logging**  

4. **Admin Activity Logging (Audit Trail)**  

5. **Rate Limit Logging**  

6. **Background Worker Logs**  

7. **System Health Metrics**  

8. **Performance Monitoring**  

9. **Distributed Tracing (future)**  



---



# 3. Logging Architecture Overview



The logging pipeline is:



Backend Services

↓

Log Formatter (JSON)

↓

Log Router

↓

Log Storage

↓

Admin Panel Log Viewer

↓

Export / Analytics (future)



yaml

Copy code



### Required:

- All logs stored in a centralized location  

- All logs structured in JSON  

- No plaintext sensitive data  



### Optional future:

- Elastic / OpenSearch integration  

- Loki + Promtail stack  



---



# 4. Log Types & Structure



## 4.1 API Request Logs



Captured for every request:



{

"type": "api",

"timestamp": "...",

"method": "GET",

"route": "/api/v1/challenges",

"status": 200,

"durationMs": 43,

"userId": "optional",

"ip": "...",

"userAgent": "...",

"metadata": { ... }

}



yaml

Copy code



---



## 4.2 Error Logs



{

"type": "error",

"timestamp": "...",

"errorCode": "SUBMISSION_LIMIT_REACHED",

"message": "User exceeded submission limit",

"stack": "...",

"userId": "optional",

"route": "...",

"metadata": { ... }

}



yaml

Copy code



Stack traces must be stored, but revealed only to System Admins.



---



## 4.3 Security Logs



Critical security events:



- Login failures  

- Token reuse detections  

- Suspicious behavior  

- Brute-force attempts  

- Blocked IPs  

- Suspended account attempts  

- Overflow reward attempts  

- Admin privilege escalation attempts  



Log structure:



{

"type": "security",

"severity": "critical",

"event": "TOKEN_REUSE",

"userId": "...",

"ip": "...",

"details": { ... },

"timestamp": "..."

}



yaml

Copy code



---



## 4.4 Audit Trail Logs



Captures all admin actions.



{

"type": "audit",

"adminId": "...",

"action": "WALLET_ADJUST",

"entityType": "wallet",

"entityId": "...",

"before": { masked },

"after": { masked },

"ip": "...",

"timestamp": "..."

}



yaml

Copy code



Audit logs must be immutable.



---



## 4.5 Rate Limit Logs



Stores events when a request hits a limit.



{

"type": "rateLimit",

"userId": "...",

"route": "...",

"limit": "...",

"timestamp": "...",

"ip": "..."

}



yaml

Copy code



---



## 4.6 Worker Logs



Background workers store:

- Job start  

- Job completion  

- Errors  

- Retries  

- Dead-letter events  



---



# 5. Metrics & Health System



## 5.1 System Health Metrics



Metrics include:

- CPU usage  

- Memory usage  

- API latency  

- Queue depth  

- Email/SMS failure rate  

- File processing failure rate  

- AI requests per minute  

- Database connection count  

- Uptime  



Metrics must be:

- Captured at fixed intervals  

- Displayed in Admin Panel (future)  



---



## 5.2 Performance Metrics



Track:

- Endpoint-level latency  

- DB query performance  

- Cache hit rate (future)  

- Submission processing duration  

- Challenge reward distribution duration  

- Notification throughput  



Performance trends visible in future dashboards.



---



# 6. Retention & Storage



Retention policy:

- API logs: 30–90 days  

- Security logs: 180+ days  

- Audit logs: permanent  

- Error logs: 90–180 days  



Storage:

- Separate tables for each log type  

- Sharding recommended if logs exceed limits  



Sensitive values must be **masked**, including:

- Passwords  

- Access tokens  

- Email contents  

- Personal identifiable data  



---



# 7. Log Viewing in Admin Panel



Features supported:

- Filtering  

- Searching  

- Severity filters  

- Time range filters  

- Pagination  

- Export (future)  

- Restricted visibility based on role  

- Quick links to related user/challenge/submission  



### Strong security rule:

Only System Admin and Super Admin may view full logs.



Moderators may see:

- Submission logs  

- API logs (redacted)  



Support Admins may see:

- User logs (redacted)  



---



# 8. Alert System Integration



Future integration with:

- Error spike alerts  

- Suspicious behavior alerts  

- Rate limit spike alerts  

- Service degradation alerts  

- Queue backlog alerts  



Alerts may appear:

- In Dashboard  

- In Notification Center (admin-only)  

- By email (optional)  



---



# 9. Distributed Tracing (Future)



Future support for:

- Request ID propagation  

- Service call graphs  

- Performance flame charts  



Trace ID attached to every log:

"traceId": "uuid"



yaml

Copy code



---



# 10. Error Codes (Observability)



| Code | Meaning |

|------|---------|

| LOG_WRITE_FAILED | Log could not be stored |

| MASKING_FAILED | Sensitive data masking failed |

| ALERT_TRIGGER_FAILED | Alert could not be delivered |

| METRIC_UPDATE_FAILED | Failed to update system metric |



---



# 11. Performance Requirements



- Logging must not slow down API responses  

- Must use async, non-blocking log writing  

- High throughput:

  - > 2000 logs/sec sustained  

- DB writes optimized with batching (future)  

- Indexing required on:

  - timestamp  

  - userId  

  - adminId  

  - type  



---



# 12. Future Enhancements



- Full observability dashboard  

- OpenTelemetry integration  

- Real-time monitoring  

- AI-powered anomaly detection  

- Log sampling for high-volume services  

- Cross-service trace correlation  



---



# 13. Conclusion



This document defines the complete Logging & Observability Engine for OGC NewFinity.  

It ensures transparency, security, performance monitoring, and operational reliability across the entire backend ecosystem.

