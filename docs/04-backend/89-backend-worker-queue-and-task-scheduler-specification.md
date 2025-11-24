# OGC NewFinity — Backend Worker Queue & Task Scheduler Specification (v1.0)

## 1. Introduction

This document defines the architecture, processing rules, retry logic, scheduling system, and operational guarantees for the Worker Queue & Task Scheduler used across the OGC NewFinity backend.

The Worker Queue Engine coordinates background jobs, long-running operations, delayed tasks, and periodic system routines in a predictable and scalable manner.

The goals of this engine are:

- Offload heavy operations from API requests
- Ensure reliable task execution
- Support retries and dead-letter queues
- Maintain ordering when required
- Enable scheduled and recurring jobs
- Provide full operational transparency for admins

## 2. Queue Engine Responsibilities

The Worker Queue handles:

- Email sending
- Background data processing
- Challenge scoring tasks
- Badge assignment tasks
- Cleanup jobs (sessions, logs)
- Notification dispatching
- Webhook delivery
- Payment confirmations
- Blockchain sync operations

Each job is processed asynchronously without blocking API endpoints.

## 3. Core Queue Architecture

### 3.1 Queue Types

The system supports multiple queues:

- **default** — general tasks
- **email** — email sending tasks
- **priority** — mission-critical jobs
- **slow-jobs** — heavy tasks
- **scheduled** — delayed & timed tasks

### 3.2 Job Structure

Each job contains:

```json
{
  "id": "uuid",
  "type": "email.send",
  "payload": {},
  "attempt": 1,
  "maxAttempts": 5,
  "delayMs": 0,
  "createdAt": "2025-01-01T10:00:00Z"
}
```

### 3.3 Worker Processes

- Each queue has dedicated workers.
- Workers scale independently.
- Priority queues override other job types.

## 4. Retry & Failure Rules

### 4.1 Automatic Retries

A job is retried when:

- External provider fails
- Network timeouts occur
- Retry-safe errors are thrown

### 4.2 Retry Backoff Strategy

- Retry #1 → immediate
- Retry #2 → 1 second
- Retry #3 → 5 seconds
- Retry #4 → 30 seconds
- Retry #5 → 5 minutes

### 4.3 Dead-Letter Queue (DLQ)

If a job reaches maxAttempts:

- Move job to dlq
- Log detailed error
- Mark job as "failed-permanently"
- Admin visibility required

## 5. Task Scheduler System

### 5.1 Scheduler Capabilities

The scheduler supports:

- Recurring tasks
- Cron-style expressions
- Fixed delays
- One-time scheduled tasks

### 5.2 Scheduled Job Types

Examples:

- Daily cleanup
- Weekly analytics generation
- Monthly billing
- Subscription renewal verification
- Token staking reward calculations
- Abandoned challenge cleanup

### 5.3 Cron Syntax Examples

| Task | Cron |
|------|------|
| Daily cleanup | 0 3 * * * |
| Hourly sync | 0 * * * * |
| Every 5 minutes | */5 * * * * |

## 6. Processing Guarantees

### 6.1 At-Least-Once Delivery

Every job is guaranteed to be attempted until:

- Completed successfully, or
- Moved to DLQ

### 6.2 Ordering Rules

- Email queue: unordered
- Slow jobs: unordered
- Priority queue: strict ordering

### 6.3 Isolation

Failure in one queue must not affect other queues.

## 7. Monitoring & Administration

Admins must be able to view:

- Queue lengths
- Pending jobs
- Failed jobs
- DLQ size
- Worker health
- Scheduler status
- Job histories

Admin endpoint:

```
GET /api/v1/admin/system/queues
```

## 8. Logging Requirements

Each job execution logs:

- jobId
- job type
- attempts
- processing time
- workerId
- error details (internal only)

Failures also log:

- stack traces
- payload (sanitized)
- provider response codes

## 9. Performance Requirements

- Job enqueue < 1 ms
- Job execution overhead < 5 ms
- Scheduler drift < 500 ms
- Must support 10k+ jobs per hour

Queues must remain non-blocking even during peak load.

## 10. Future Enhancements

- Distributed workers (multi-region)
- Adaptive retry strategies
- Job priority auto-adjustment
- Predictive load balancing
- Failover scheduler
- Queue analytics dashboard

## 11. Conclusion

This specification defines the Worker Queue & Task Scheduler for OGC NewFinity.

It ensures efficient background processing, reliable task execution, operational transparency, and a scalable foundation for platform-wide automation.

