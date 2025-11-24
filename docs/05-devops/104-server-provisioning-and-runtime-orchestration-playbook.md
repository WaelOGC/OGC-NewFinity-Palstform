# OGC NewFinity — Server Provisioning & Runtime Orchestration Playbook (v1.0)

## 1. Introduction

This document defines the full playbook for provisioning servers, configuring environments, orchestrating runtime services, and managing operational lifecycle tasks for OGC NewFinity.

The playbook ensures:

- Standardized provisioning
- Predictable deployments
- Secure runtime operations
- Repeatable infrastructure setup
- High availability and uptime
- Efficient scaling procedures

This applies to all backend services, workers, schedulers, and supporting infrastructure.

## 2. Provisioning Overview

### 2.1 Provisioning Goals

- Create secure and consistent server environments
- Automate machine bootstrap steps
- Minimize manual configuration
- Ensure reproducible deployments
- Support scaling across multiple nodes

### 2.2 Provisioning Targets

Servers for:

- Backend API
- Worker queue services
- Scheduler/cron jobs
- Admin panel
- Blockchain listener
- Search/index processor

## 3. Base Server Requirements

### 3.1 Minimum Specs

- 2+ vCPU
- 4–8 GB RAM
- 80–160 GB SSD storage
- Ubuntu LTS (recommended)
- IPv4 & IPv6 enabled

### 3.2 Required Packages

- Node.js (LTS)
- Nginx
- PM2 or Docker
- Redis client tools
- MariaDB/MySQL client tools
- Git
- Fail2Ban
- UFW firewall

### 3.3 Optional Packages

- Docker & Docker Compose
- Certbot (if SSL managed locally)
- jq / yq for config parsing

## 4. Provisioning Steps (Base Server)

### 4.1 System Update

```bash
apt update && apt upgrade -y
```

### 4.2 Create Deployment User

```bash
adduser deploy
usermod -aG sudo deploy
```

### 4.3 SSH Hardening

- Disable root login
- Use SSH keys only
- Change default port (optional)

### 4.4 Firewall Setup

```bash
ufw allow 22
ufw allow http
ufw allow https
ufw enable
```

### 4.5 Install Node.js

Using NodeSource or NVM (LTS version recommended).

## 5. Runtime Orchestration

### 5.1 PM2-Based Orchestration

PM2 manages:

- Backend API service
- Worker queue service
- Scheduler/cron worker
- Blockchain listener

PM2 ecosystem file:

```
ecosystem.config.js
```

Must support:

- Auto-restart
- Log rotation
- Zero-downtime reload

### 5.2 Docker Orchestration (Optional)

Docker Compose coordinates:

- Backend containers
- Worker containers
- Redis
- Admin panel (future)

### 5.3 Kubernetes (Future)

Cluster-managed orchestration for:

- Auto-scaling
- Multi-region deployments
- Resilient service mesh
- Canary rollouts

## 6. Backend Deployment Workflow

### 6.1 Deployment Steps

1. Pull latest artifact or Git commit
2. Install dependencies
3. Run environment validation
4. Build service (if applicable)
5. Run database migrations
6. Restart required services
7. Run smoke tests

### 6.2 Required Commands

```bash
pm2 reload ecosystem.config.js
pm2 logs --lines 50
pm2 status
```

## 7. Worker & Scheduler Orchestration

### 7.1 Worker Requirements

Workers must:

- Run independently
- Auto-restart on failure
- Not block API requests
- Store queue state safely

### 7.2 Scheduler Requirements

Schedulers:

- Run periodic tasks
- Use cron expressions
- Ensure no overlapping jobs
- Maintain logs of all executions

## 8. Database Provisioning

### 8.1 Initial Setup

- Create DB user
- Enforce strict permissions
- Enable slow query logs
- Configure backups

### 8.2 Connection Pooling

Backend must use:

- 10–50 connections max
- Automatic retry behavior

### 8.3 Migration Rules

- All migrations run in staging first
- No destructive migrations without backups
- Ensure schema consistency

## 9. Storage Provisioning

### 9.1 Bucket Setup

- Create primary buckets
- Create archive buckets
- Define lifecycle rules

### 9.2 Access Rules

- Use API keys
- Never expose root credentials
- Enforce bucket-level permissions

## 10. Cache & Queue Provisioning

### 10.1 Redis Setup

- Enable persistence (AOF recommended)
- Configure max memory policy
- Set eviction strategy: `allkeys-lru`

### 10.2 Queue Worker Setup

Workers must use:

- Rate-limited Redis connections
- Separate namespaces
- Dedicated queues for email, jobs, processing

## 11. Monitoring & Alerting Setup

### 11.1 Required Metrics

- CPU, RAM, disk usage
- API latency
- Worker queue backlog
- Redis health
- DB performance
- Storage availability

### 11.2 Alerts

Alerts must trigger for:

- High error rate
- Slow API response
- Queue stalls
- Disk nearing capacity
- Out-of-memory events

## 12. Backup & Recovery

### 12.1 Daily Database Backups

- Automated snapshotting
- Encrypted backups
- Retention 30–180 days

### 12.2 Storage Backup

- Archive buckets
- Object versioning

### 12.3 Recovery Plan

1. Restore DB
2. Restore bucket snapshot
3. Reindex search engine
4. Reload services
5. Validate data integrity

## 13. Security Requirements

- Enforce SSH key authentication
- Firewall on all servers
- Disable unused ports
- Automatic security updates
- Limit sudo access
- Use secure secrets storage
- Log all admin activity

## 14. Future Enhancements

- Automated provisioning scripts
- Terraform or Pulumi infrastructure-as-code
- Kubernetes migration
- Predictive resource management
- Centralized configuration service

## 15. Conclusion

This playbook defines the server provisioning and runtime orchestration standards for OGC NewFinity, ensuring consistent, secure, and scalable infrastructure across all environments.

