# OGC NewFinity — Security Hardening & Firewall Configuration Standards (v1.0)

## 1. Introduction

This document defines the mandatory security hardening rules, network protection policies, firewall configurations, and operational security (OpSec) standards required to safeguard the OGC NewFinity platform across all environments.

These standards ensure:

- Strong system security
- Reduced attack surface
- Protection against unauthorized access
- Network isolation
- Compliance with best practices
- Defense against common threats

This applies to backend servers, workers, schedulers, databases, caches, storage systems, and DevOps tooling.

## 2. Core Security Principles

### 2.1 Least Privilege

Only grant the minimum required permissions to each service, user, and process.

### 2.2 Defense in Depth

Multiple layers of protection:

- Firewall
- Authentication
- Encryption
- Logging
- Monitoring

### 2.3 Zero Trust Model

Treat all internal traffic as untrusted until validated.

### 2.4 Secure-by-Default

Disable unused features, services, and ports.

## 3. Server Hardening Requirements

### 3.1 OS-Level Security

- Use Ubuntu LTS
- Apply automatic security updates
- Disable unused services
- Lock down system binaries
- Enforce password complexity rules
- Enforce sudo auditing

### 3.2 SSH Hardening

- SSH key authentication only
- Disable root login
- Change default port (optional)
- Fail2Ban active for SSH
- IP whitelisting for admin SSH

### 3.3 File System Security

- Use noexec on temporary directories
- Enable disk encryption (when supported)
- Remove world-writable permissions

## 4. Firewall Configuration

### 4.1 Required Policy

Firewall must follow a deny-all policy by default.

### 4.2 Allowed Inbound Ports

| Port | Purpose |
|------|---------|
| 22 | SSH (restricted) |
| 80 | HTTP |
| 443 | HTTPS |
| 3000 | Backend API (internal only) |
| 3306 | MySQL (internal only) |
| 6379 | Redis (internal only) |

### 4.3 Blocked Ports

- All unused ports
- All outbound SMTP (unless email provider allows via API)
- All peer-to-peer ports

### 4.4 UFW Example

```
ufw default deny incoming
ufw default allow outgoing

ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp

ufw enable
```

## 5. Network Segmentation

### 5.1 Isolation Zones

- Public zone (API, frontend)
- Private zone (backend services)
- Protected zone (DB, Redis, internal workers)

### 5.2 Access Rules

- DB accessible only from backend network
- Redis accessible only from backend network
- Storage connections secured via private endpoints

## 6. Application-Level Hardening

### 6.1 HTTP Security Headers

- Strict-Transport-Security
- X-Frame-Options
- X-Content-Type-Options
- Content-Security-Policy
- Referrer-Policy

### 6.2 Rate Limiting

- Apply per-IP and per-user limits
- Enforce sliding window strategies
- Protect authentication endpoints with stricter limits

### 6.3 Input Sanitization

- Sanitize all inputs
- Enforce schema validation
- Reject malformed requests

## 7. Authentication & Access Control

### 7.1 Token Security

- Short-lived access tokens
- Rotating refresh tokens
- Strict token revocation logic

### 7.2 Password Standards

- Minimum length 12
- Bcrypt hashing
- No plaintext storage

### 7.3 RBAC (Role-Based Access Control)

Roles:

- user
- admin
- system

## 8. Dependency & Package Security

### 8.1 Mandatory Requirements

- Use npm audit in CI
- Block vulnerable versions
- Lock file integrity checks (package-lock.json)
- Use approved internal libraries

### 8.2 Third-Party Code Rules

- No direct inclusion of unverified code
- No external scripts executed at runtime
- All libraries must pass security scanning

## 9. Container & Runtime Hardening

### 9.1 Docker Security

- Use minimal base images
- Drop root privileges
- Read-only filesystem where possible
- No embedded secrets in images

### 9.2 PM2 Security

- Lock ecosystem config permissions
- Enforce log rotation
- Restrict process restarts

## 10. Database Security Standards

### 10.1 MySQL Hardening

- Use strong DB passwords
- Enforce local-network access only
- Disable anonymous users
- Enable slow-query logging

### 10.2 Connection Protection

- Enforce SSL connections (when supported)
- Connection pooling limits

## 11. Logging & Audit Requirements

### 11.1 System Logs

Events logged:

- Login attempts
- Privileged commands
- Firewall actions
- Service restarts
- Deployment events

### 11.2 Immutable Logs

Logs must:

- Be tamper-protected
- Be archived to long-term storage
- Use append-only storage when possible

## 12. Security Monitoring

### 12.1 Monitoring Targets

- CPU spike alerts
- Unauthorized SSH access attempts
- Firewall block counts
- Suspicious API activity
- Anomalous login patterns

### 12.2 Automated Alerts

Alert channels:

- Email
- Slack
- PagerDuty (future)

Severity levels:

- Warning
- High
- Critical

## 13. Penetration Testing (Future Standard)

Requirements:

- Annual penetration testing
- Automated vulnerability scans
- OWASP Top-10 compliance reviews
- Dependency vulnerability audit reports

## 14. Future Enhancements

- Zero-trust service mesh
- Adaptive firewall rules using AI
- Multi-region security compliance benchmarking
- Automated threat isolation

## 15. Conclusion

This document defines the full Security Hardening & Firewall Configuration Standards for OGC NewFinity, providing strong system protection, minimal attack surface, and multi-layer defense across all infrastructure components.

