# OGC NewFinity — Backend Fraud Detection & Abuse Prevention Engine (v1.0)

## 1. Introduction

This document defines the fraud detection architecture, abuse prevention rules, suspicious-activity triggers, rate-control mechanisms, and anomaly-monitoring logic for the OGC NewFinity backend.

The Fraud Detection & Abuse Prevention Engine ensures:

- Protection against malicious behavior
- Early detection of suspicious actions
- Controlled platform usage
- Automated mitigation and enforcement
- Secure user and system operations

This specification applies to all backend services under `/api/v1/*`.

## 2. Threat Categories

### 2.1 Account-Level Threats

- Brute-force login attempts
- Credential stuffing
- Suspicious password resets
- Account takeover indicators

### 2.2 Transaction-Level Threats

- Repeated failed payments
- Refund abuse
- Suspicious token transfers (future)
- Subscription manipulation attempts

### 2.3 API Misuse & Abuse

- Automated scraping
- Excessive API requests
- Rate-limit bypass attempts
- Abuse of free-tier features

### 2.4 Platform Manipulation

- Challenge voting abuse
- Fake submissions
- Multi-account exploitation
- Reward farming (future)

## 3. Detection Architecture Overview

### 3.1 Multi-Layer Detection System

The system uses:

- Real-time event analysis
- Historical behavior patterns
- Risk scoring
- Rate-limit signals
- IP reputation checks
- Device fingerprinting (future)

### 3.2 Detection Layers

- Request Layer — examines each request
- Session Layer — aggregates short-term behavior
- User Layer — evaluates long-term patterns
- System Layer — monitors global anomalies

## 4. Suspicious Activity Rules

### 4.1 Authentication Events

Trigger suspicion if:

- 5+ failed logins within 5 minutes
- Repeated login attempts from different countries
- Login from high-risk IP ranges
- Sudden device fingerprint changes

### 4.2 Payment Events

Suspicious patterns include:

- Multiple failed payment attempts
- Repeated refund requests
- Mismatched billing info
- Payment method cycling
- Dispute-prone accounts

### 4.3 Challenge & Submission Events

Flags include:

- Multiple accounts submitting identical content
- Vote boosting via bots
- Rapid-fire submissions
- Suspicious voting patterns

### 4.4 API Misuse Events

- Exceeding rate limits
- Repeated requests to restricted endpoints
- Enumeration attempts
- Invalid session reuse

## 5. Risk Scoring System

### 5.1 Risk Levels

- Low — normal activity
- Medium — unusual but not critical
- High — likely abuse
- Critical — immediate action required

### 5.2 Scoring Criteria

Risk score is calculated based on:

- Frequency of actions
- Severity of violations
- Historical user behavior
- IP and device reputation
- Cross-service correlation

### 5.3 Automated Actions by Risk Level

| Level | Action |
|-------|--------|
| Low | Log only |
| Medium | Temporary rate limit |
| High | Account restrictions |
| Critical | Auto-lock + admin alert |

## 6. Rate Limiting & Throttling

### 6.1 Per-User Limits

Applies to:

- Login attempts
- API calls
- Submissions
- Payment actions

### 6.2 Per-IP Limits

Protects against:

- Botnets
- High-volume scrapers
- Shared abusive IPs

### 6.3 Adaptive Throttling

System automatically:

- Reduces limits for high-risk users
- Applies dynamic slowdowns
- Flags repeated limit hits

## 7. Fraud Mitigation Actions

### 7.1 Soft Actions

- Warning notifications
- Captcha challenge
- Increased rate-limit enforcement
- Session reset

### 7.2 Hard Actions

- Temporary account lock
- IP block
- Blocked payment attempts
- Challenge submission freeze
- Admin escalation

### 7.3 Permanent Actions

- Account termination
- Device fingerprint ban
- Blacklist entry

## 8. Logging & Audit Trail

All suspicious events must be logged with:

- userId
- ipAddress
- action type
- riskScore
- triggered rule
- timestamp
- corrective action (if any)

### 8.1 Administrative Audit Requirements

- Access via admin dashboard
- Exportable CSV logs
- Filters for category, time, and severity

## 9. Database Tables

### fraud_events

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| userId | uuid | Affected user |
| ip | string | IP address |
| eventType | string | login, payment, submission, etc. |
| riskScore | int | Computed score |
| severity | string | low/medium/high/critical |
| details | json | Additional context |
| createdAt | datetime | Timestamp |

### blocked_entities

Stores lists of:

- banned IPs
- blocked accounts
- flagged devices

## 10. Performance Requirements

- Fraud evaluation < 10 ms
- Rate-limit checks < 2 ms
- Risk scoring < 5 ms
- Must support 5,000+ checks/second

## 11. Future Enhancements

- Machine learning anomaly detection
- Cross-platform fraud intelligence
- Honeypot endpoints
- Token-based anti-spam filters
- Real-time visual fraud dashboard

## 12. Conclusion

This document defines the Fraud Detection & Abuse Prevention Engine for OGC NewFinity, ensuring platform safety, abuse resilience, and long-term system integrity.

