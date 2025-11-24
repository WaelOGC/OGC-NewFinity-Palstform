# OGC NewFinity — Backend Email Queue & Bulk Delivery Engine Specification (v1.0)

## 1. Introduction

This document defines the architecture, queueing rules, batching logic, retry strategy, and throughput guarantees for the Email Queue & Bulk Delivery Engine used across the OGC NewFinity backend.

The Email Delivery Engine ensures:

- Reliable email sending
- High-volume batch dispatching
- Provider failover
- Background processing to avoid blocking API requests
- Scalable delivery pipelines
- Consistent formatting and templating

## 2. Email Delivery Responsibilities

The Email Queue handles:

- Account verification emails
- Password reset emails
- Subscription confirmations
- Payment receipts
- Challenge notifications
- Admin alerts
- Bulk promotional campaigns
- System-wide announcements

All operations run asynchronously.

## 3. Email Queue Architecture

### 3.1 Dedicated Email Queue

A dedicated queue named `email` isolates delivery tasks from other worker activity.

### 3.2 Email Job Structure

```json
{
  "id": "uuid",
  "type": "email.send",
  "template": "welcome",
  "to": "user@example.com",
  "payload": {},
  "attempt": 1,
  "maxAttempts": 5,
  "priority": "normal",
  "createdAt": "2025-01-01T10:00:00Z"
}
```

### 3.3 Providers

Supported providers:

- Primary Email Provider (SMTP or API)
- Secondary (fallback) provider
- Internal sandbox provider (for dev/test)

## 4. Bulk Delivery Engine

### 4.1 Batching Rules

Bulk operations must:

- Use batches of 100–500 emails
- Avoid rate-limit violations
- Respect provider cooldown periods
- Maintain delivery order for campaign blocks

### 4.2 Bulk Job Types

- Subscription renewal waves
- Challenge event announcements
- System-wide alerts
- Marketing rounds

### 4.3 Throughput Requirements

- Minimum 50,000 emails/day
- Scale workers dynamically
- Support parallel batch pipelines

## 5. Template Engine

### 5.1 Standard Template Structure

All templates require:

- Header
- Body
- CTA button (if applicable)
- Footer
- Unsubscribe footer (for bulk campaigns)

### 5.2 Personalization Tokens

Supported tokens include:

- `{{name}}`
- `{{plan}}`
- `{{resetLink}}`
- `{{challengeName}}`
- `{{amount}}`

### 5.3 Rendering Rules

- Preprocessing before queuing
- Strict HTML sanitization
- Text-only fallback

## 6. Retry & Provider Failover

### 6.1 Retry Triggers

Retry when:

- Provider API error
- Network timeout
- Email rejected for retry-safe reasons

### 6.2 Backoff Strategy

- Retry #1 → immediate
- Retry #2 → 1 second
- Retry #3 → 10 seconds
- Retry #4 → 1 minute
- Retry #5 → 10 minutes

### 6.3 Provider Failover

If the primary provider fails consistently:

- Switch to secondary provider
- Log provider outage internally
- Continue delivery without interruption

## 7. Delivery Guarantees

### 7.1 At-Least-Once Delivery

Every email is attempted until:

- Successfully delivered, or
- Sent to the dead-letter queue

### 7.2 Duplicate Protection

Each job contains a unique checksum to prevent accidental re-sending.

## 8. Dead-Letter Queue (DLQ)

Emails are moved to DLQ if:

- Max attempts reached
- Payload invalid
- Template missing
- Provider permanently rejects

Admins can review and optionally re-queue.

## 9. Administration & Monitoring

Admins must view:

- Email queue length
- Failed attempts
- Batch performance
- Provider health status
- Campaign progress
- Rate-limit warning indicators

Admin endpoint:

```
GET /api/v1/admin/system/email
```

## 10. Logging Requirements

Logs include:

- jobId
- template name
- to address (partially masked)
- attempts
- provider used
- error messages (internal only)
- batch identifiers

Repeated failures trigger alerts.

## 11. Performance Requirements

- Must handle 100+ emails/second during peak
- Queue enqueue time < 1 ms
- Batch execution overhead < 5 ms
- Delivery time balanced across providers

## 12. Future Enhancements

- Multi-provider load balancing
- AI-based subject line optimization
- Engagement tracking (open/click)
- Smart delivery scheduling based on timezones
- Drag-and-drop template builder

## 13. Conclusion

This specification defines the Email Queue & Bulk Delivery Engine for OGC NewFinity, ensuring reliable email delivery, scalable operational capacity, and automated bulk communication for platform-wide events and updates.

