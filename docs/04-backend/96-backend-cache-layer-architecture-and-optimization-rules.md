# OGC NewFinity — Backend Cache Layer Architecture & Optimization Rules (v1.0)

## 1. Introduction

This document defines the caching architecture, TTL policies, invalidation rules, performance strategies, and dependency layers for the OGC NewFinity backend.

The Cache Layer ensures:

- Faster API response times
- Reduced database load
- Predictable high-traffic performance
- Temporary storage for computed data
- Scalable state management across services

This specification applies to all backend services under `/api/v1/*`.

## 2. Cache Architecture Overview

### 2.1 Cache Provider

Supports:

- Redis (primary)
- In-memory fallback (development)

### 2.2 Cache Types

- Request Cache — short-lived API responses
- Object Cache — user profiles, tokens, metadata
- Computed Cache — AI results, search highlights
- Session Cache — temporary session data
- Rate-limit Cache — counters for throttling
- Queue State Cache — job progress and status

## 3. Cache Keys & Namespacing

### 3.1 Namespace Structure

```
ogc:{service}:{entity}:{id}
```

Examples:

- `ogc:user:profile:12345`
- `ogc:wallet:summary:12345`
- `ogc:challenge:list:active`

### 3.2 Key Requirements

- Must avoid collisions
- Must use consistent formatting
- Must support wildcard invalidation

## 4. TTL (Time-To-Live) Rules

### 4.1 Default TTLs

| Cache Type | TTL |
|------------|-----|
| Request cache | 10–30 seconds |
| Object cache | 5 minutes |
| Search cache | 30–60 seconds |
| Session cache | 15–30 minutes |
| Queue state | 5 minutes |
| Rate-limit keys | Reset per minute |

### 4.2 No-Expiry Keys

- System configuration
- Platform constants
- Feature flags
- AI service metadata

These must be manually invalidated.

## 5. Cache Invalidation Strategy

### 5.1 Immediate Invalidation

Triggered when:

- A user updates their profile
- A wallet sync is completed
- Subscriptions are upgraded/downgraded
- A challenge is submitted or updated

### 5.2 Batch Invalidation

Used for:

- Bulk content updates
- Admin moderation actions
- System-wide resets

### 5.3 Stale-While-Revalidate (SWR)

Steps:

1. Return cached response immediately
2. Recompute in background
3. Store fresh result

## 6. High-Traffic Optimization Rules

### 6.1 Hot Keys

Frequently accessed keys must:

- Use extended TTL
- Be cached in memory + Redis (hybrid mode)
- Avoid invalidation unless critical

### 6.2 Thundering Herd Protection

Techniques:

- Request coalescing
- Lock-key usage
- Distributed mutex for heavy refresh tasks

### 6.3 Pagination Caching

Cache:

- `page=1` → short TTL
- `page>1` → longer TTL

## 7. Rate Limiting Integration

The cache layer stores:

- Request counters
- Sliding windows
- Global throttling rules

Rate-limit keys:

```
ogc:ratelimit:{userId or ip}:{route}
```

TTL resets every 60 seconds.

## 8. Queue & Worker Integration

Workers use the cache to:

- Track job status
- Track progress updates
- Store temporary job metadata
- Debounce repeated updates

Sync behavior:

- When job completes → cache invalidated
- Retries update cached status

## 9. Cache Failure Handling

### 9.1 Failover Rules

If Redis is unavailable:

- Switch to in-memory cache
- Reduce TTLs
- Log provider outage
- Trigger admin alerts

### 9.2 Graceful Degradation

API must continue functioning with:

- Slower DB queries
- Limited caching capabilities

## 10. Logging Requirements

Log on every:

- Cache miss
- Cache hit
- Invalidation event
- Redis connection error
- Hot-key anomaly

Log data includes:

- key name
- ttl
- service
- userId (if applicable)

## 11. Performance Requirements

- Cache retrieval < 2 ms
- Cache write < 5 ms
- Must handle 50k+ cache operations/min
- Cache hit rate target:
  - Minimum 80% global
  - Minimum 90% for high-traffic endpoints

## 12. Security Requirements

- No sensitive data stored in cache
- User tokens must be encrypted
- Prevent cache poisoning attacks
- Enforce strict key sanitization

## 13. Future Enhancements

- Distributed caching across regions
- AI-assisted cache optimization
- Real-time cache analytics dashboard
- Predictive TTL tuning
- Multi-layer caching with CDN integration

## 14. Conclusion

This document defines the Cache Layer Architecture & Optimization Rules for the OGC NewFinity backend, ensuring high availability, low latency, and scalable performance across all services.

