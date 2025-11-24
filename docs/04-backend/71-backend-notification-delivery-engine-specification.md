# OGC NewFinity — Backend Notification Delivery Engine Specification (v1.0)



## 1. Introduction

This document defines the full backend architecture, behavior, delivery logic, and performance guidelines for the **Notification Delivery Engine** that powers all user-facing notifications across the OGC NewFinity ecosystem.



The engine supports:

- In-app notifications  

- Email notifications  

- SMS notifications (limited)  

- Admin broadcast messages  

- System-generated alerts  

- Challenge, wallet, and submission events  

- AI-generated notifications (future)  



This engine must be:

- Fast  

- Reliable  

- Async-first  

- Fully logged  

- Secure  

- Scalable  



---



# 2. Notification Delivery Model



### Types of Notifications:

1. **In-App** → stored in DB + real-time (future WebSocket)

2. **Email** → via email provider

3. **SMS** → via SMS provider (optional)

4. **Push Notifications** (future)

5. **System Announcements** → delivered universally



### Notification Priorities:

- **High**: Security alerts, password resets

- **Medium**: Challenge updates, submission decisions

- **Low**: Tips, informational content



---



# 3. Notification Flow Overview



Event Trigger → Payload Builder → Delivery Queue → Provider Adapter → Delivery Log → In-App Record



yaml

Copy code



### Key stages:



1. **Trigger Event**

   - Submission approved

   - Challenge published

   - User receives reward

   - Subscription updated

   - Admin sends broadcast



2. **Payload Generation**

   - Template lookup  

   - Variable injection  

   - Personalization



3. **Queueing**

   - All outbound deliveries are queued  

   - Ensures non-blocking API performance  



4. **Provider Delivery**

   - Email → SMTP / API  

   - SMS → Provider API  

   - In-App → DB write  

   - Websocket (future)  



5. **Logging & Analytics**

   - Delivery status  

   - Response codes  

   - Failures  



---



# 4. Database Model Requirements



### `Notification` table:

- id  

- userId  

- type (in_app, email, sms)  

- title  

- body  

- payload JSON  

- readAt  

- createdAt  



### `NotificationDeliveryLog` table:

- id  

- notificationId  

- provider  

- status (sent, delivered, failed)  

- errorMessage  

- timestamp  

- metadata JSON  



### `SystemAnnouncement` table (future)

- id  

- message  

- severity  

- visibility rules  

- startAt  

- endAt  



---



# 5. In-App Notification Delivery



### Direct DB write:

- Title  

- Body  

- Payload (JSON)  

- HasRead flag  

- Notification category  



### Must support:

- Pagination  

- Filters  

- Read/unread state changes  

- Bulk mark-as-read  

- Soft-delete (future)



---



# 6. Email Delivery Pipeline



### Email Payload Structure:

{

templateId: "CHALLENGE_PUBLISHED",

variables: {

userName: "John",

challengeName: "...",

link: "..."

}

}



yaml

Copy code



### Backend tasks:

- Load template  

- Inject variables  

- Render HTML  

- Send via provider  

- Log result  



### Required features:

- Retry failed emails  

- Fallback provider (future)  

- Rate limit protection  

- Sandbox override for testing  



---



# 7. SMS Delivery Pipeline



### Use cases:

- OTP  

- Urgent alerts  

- Subscription issues  



SMS is limited, minimal, and must follow:

- Character limit check  

- UTF-8 warnings  

- Template only (no raw content)  

- Delivery logs required  



---



# 8. Event Triggers & Handlers



### Core Events:

- `submission.approved`

- `submission.rejected`

- `challenge.published`

- `challenge.deadlineReminder`

- `wallet.rewardIssued`

- `wallet.miningEvent`

- `subscription.renewed`

- `subscription.expired`

- `notification.adminBroadcast`

- `security.loginAlert`



Each trigger must fire:

- Payload builder  

- Delivery scheduler  

- Logging  



---



# 9. Notification Queue (Async Layer)



### Required Queue Behavior:

- Rate-controlled  

- Retries with exponential backoff  

- Dead-letter queue for failures  

- Parallel workers  

- Queue separation:

  - emailQueue

  - smsQueue

  - inAppQueue  



### Worker responsibilities:

- Validate payload  

- Call provider  

- Update delivery log  



---



# 10. Provider Adapters



### Email:

- SMTP adapter  

- API-based adapter (SendGrid, Mailgun, etc.)  

- Must support:

  - HTML emails  

  - Tracking (future)  

  - Failure detection  



### SMS:

- Twilio or equivalent  

- Must support:

  - Status callbacks  

  - Partial delivery logs  



### In-App:

- Database write  

- Real-time push (future)  



---



# 11. Admin Broadcast Support



Admins may send:

- System announcements  

- Targeted notifications  

- Tier-specific notifications  

- Challenge-specific announcements  



Backend must:

- Validate audience (all users, tier, specific user, challenge participants)  

- Queue mass deliveries  

- Prevent dangerous actions without confirmation  



---



# 12. Notification Templates



Templates stored in DB or filesystem.



### Template Requirements:

- Must use placeholders  

- Must be valid HTML for email  

- Must support preview (admin panel)  

- Must allow versioning  



---



# 13. Delivery Retry Logic



### Email / SMS:

- 3 retries  

- Exponential backoff: 5s → 30s → 2m  

- Move to dead-letter queue on failure  

- Alert admin if >20% fail  



### In-App:

- Retries only on DB error  



---



# 14. Logging Requirements



### Must log:

- Successful sends  

- Provider failures  

- Retry attempts  

- Template issues  

- Undeliverable messages  



Logs feed into:

- Observability  

- Admin logs  

- Security logs  



---



# 15. Error Codes



| Code | Meaning |

|------|---------|

| TEMPLATE_INVALID | Template missing or corrupted |

| DELIVERY_FAILED | Provider did not accept message |

| INVALID_PAYLOAD | Missing required variables |

| AUDIENCE_EMPTY | No users to notify |

| PROVIDER_ERROR | Downstream failure |

| RATE_LIMITED | Delivery throttled |



---



# 16. Performance Requirements



- High throughput for bulk sends  

- Queue-based processing  

- No blocking API calls  

- Email rendering optimized  

- Load-sensitive throttling  



---



# 17. Future Enhancements



- Real-time WebSockets for in-app notifications  

- Analytics dashboard for notification performance  

- Multi-language templates  

- Multi-provider failover  

- AI-generated notifications  

- Category-based user preferences  



---



# 18. Conclusion



This specification defines the entire backend notification delivery system for OGC NewFinity.  

It ensures safe, scalable, reliable communication across all modules of the ecosystem.

