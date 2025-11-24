# OGC NewFinity — Logging & Monitoring Stack Deployment Guide (v1.0)

## 1. Introduction

This document defines the deployment architecture, setup steps, logging pipeline, metric collection rules, and monitoring dashboards required for the OGC NewFinity logging & monitoring stack.

The stack ensures:

- Full visibility into system health
- Real-time operational monitoring
- Centralized log aggregation
- Alerting for critical events
- Performance analytics
- Fault diagnosis and audit tracking

This applies to backend services, worker queues, schedulers, admin tools, and infrastructure.

## 2. Logging & Monitoring Goals

The system must provide:

- Error visibility
- Performance metrics
- API-level monitoring
- Worker queue insights
- Search/index health
- Database & Redis status
- Uptime alerts
- Traffic analytics

All logs and metrics must be stored securely and retained according to policy.

## 3. Monitoring Stack Components

### 3.1 Metrics Monitoring

Recommended tools:

- Prometheus (metrics collection)
- Grafana (dashboards and alerts)

### 3.2 Log Aggregation

Options:

- Loki (lightweight, ideal choice)
- Elastic Stack (Elasticsearch + Logstash + Kibana)

### 3.3 Alerting

- Grafana Alerting
- PagerDuty (future)
- Email/Slack notifications

### 3.4 Uptime Monitoring

- UptimeRobot
- Health endpoint polling
- Status page integration (future)

## 4. Metrics Collection Setup

### 4.1 Required Metrics

Backend must export:

- Request latency
- Request count
- Error rate
- CPU usage
- Memory usage
- Queue jobs pending/completed
- Database connection count
- Redis latency

### 4.2 Prometheus Configuration

Add scrape config:

```yaml
scrape_configs:
  - job_name: ogc-backend
    static_configs:
      - targets: ['backend:3000']
```

### 4.3 Node Exporter

Install on servers to expose:

- CPU
- Disk
- RAM
- Network I/O

## 5. Logging Architecture

### 5.1 Log Categories

- Access logs
- Error logs
- Worker logs
- Queue event logs
- Blockchain listener logs
- Authentication logs
- Security logs
- Admin activity logs

### 5.2 Log Format

Use structured JSON logs:

```json
{
  "timestamp": "2025-01-01T12:00:00Z",
  "level": "error",
  "service": "backend-core",
  "message": "Database timeout",
  "metadata": { "query": "SELECT..." }
}
```

### 5.3 Log Retention

- Hot logs: 7 days
- Warm logs: 30 days
- Archived logs: 180+ days

## 6. Loki Deployment Guide

### 6.1 Docker Compose Example

```yaml
services:
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
  promtail:
    image: grafana/promtail:latest
    volumes:
      - /var/log:/var/log
```

### 6.2 Promtail Configuration

```yaml
scrape_configs:
  - job_name: system
    static_configs:
      - targets:
          - localhost
        labels:
          job: varlogs
          __path__: /var/log/*log
```

## 7. Grafana Dashboards

### 7.1 Required Dashboards

- Backend API performance
- Worker queue status
- Redis health & latency
- MySQL database metrics
- Storage (S3) usage
- Challenge activity metrics
- AI engine usage metrics

### 7.2 Custom Panels

Include:

- Error heatmap
- Request distribution
- Top endpoints
- Slow queries

### 7.3 Dashboard Permissions

- Read-only for most users
- Admin-only for editing

## 8. Alerting System

### 8.1 Alert Types

- High error rate
- Slow API latency
- Worker queue backlog
- Redis connection failures
- Database connection spikes
- High CPU or RAM usage
- Payment/webhook failures
- Blockchain event listener downtime

### 8.2 Alert Delivery

- Email
- Slack
- SMS (future)
- PagerDuty (future)

### 8.3 Alert Rules

Alerts must include:

- Severity level
- Timestamp
- Affected service
- Suggested remediation

## 9. Uptime Monitoring

### 9.1 Health Endpoints

Monitor:

- `/api/health/liveness`
- `/api/health/readiness`
- `/api/health/status`

### 9.2 Uptime Targets

- API uptime ≥ 99.9%
- Worker uptime ≥ 99.5%
- Scheduler uptime ≥ 99.5%

### 9.3 Status Page (future)

Public availability dashboard.

## 10. Security Requirements

- Logs cannot include secrets
- Sensitive data must be masked
- Encrypted log storage
- Limited access to dashboards
- Log tampering protection
- IP filtering for monitoring tools

## 11. Deployment Requirements

### 11.1 Scaling

- Grafana horizontally scalable
- Loki horizontally scalable
- Prometheus federation (future)

### 11.2 Storage Durability

- RAID or EBS-like volumes
- Snapshot backups

### 11.3 Performance Targets

- Query dashboard < 1 second
- Log ingestion < 200 ms
- Metrics scrape interval: 10–30 seconds

## 12. Future Enhancements

- Distributed tracing (OpenTelemetry)
- AI-based anomaly detection
- Log correlation with user sessions
- Incident response playbooks
- Audit dashboard for security events

## 13. Conclusion

This guide defines the Logging & Monitoring Stack for OGC NewFinity, ensuring full observability, system reliability, and rapid detection of operational issues across the entire ecosystem.

