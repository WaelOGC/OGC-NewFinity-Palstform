# OGC NewFinity — Environment Configuration & Secret Management Specification (v1.0)

## 1. Introduction

This document defines the rules, standards, and security requirements for environment configuration, secrets management, and runtime parameter control across all OGC NewFinity services.

The purpose is to ensure:

- Strict separation of environments
- Secure handling of sensitive data
- Predictable configuration loading
- Zero exposure of secrets
- Auditability and compliance

This system applies to all backend, frontend, worker, scheduler, and DevOps environments.

## 2. Environment Structure

OGC NewFinity uses the following environment tiers:

### 2.1 Local Development (.env.local)

- Developer-specific settings
- Mock providers
- Local DB + local storage
- No real secrets

### 2.2 Development Server (.env.dev)

- Shared testing environment
- Shared DB + shared storage
- Internal team access only

### 2.3 Staging Environment (.env.staging)

- Mirrors production
- Complete service integration
- Test payment & email providers
- Pre-release validation

### 2.4 Production Environment (.env.production)

- Hardened secrets
- Real payment/email providers
- Monitoring enabled
- No auto-debugging

Each environment must load a dedicated environment file.

## 3. Environment Variable Categories

### 3.1 Application Configuration

- `APP_ENV`
- `APP_PORT`
- `APP_URL`
- `NODE_ENV`

### 3.2 Database Configuration

- `DB_HOST`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `DB_PORT`
- Connection pool settings

### 3.3 JWT & Authentication

- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_EXPIRES_IN`
- `REFRESH_EXPIRES_IN`

### 3.4 Email Provider

- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_USERNAME`
- `EMAIL_PASSWORD`
- `EMAIL_FROM`

### 3.5 Payment Providers

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `PAYPAL_CLIENT_ID` (future)
- `PAYPAL_SECRET` (future)

### 3.6 Storage Provider

- `STORAGE_ENDPOINT`
- `STORAGE_BUCKET`
- `STORAGE_ACCESS_KEY`
- `STORAGE_SECRET_KEY`

### 3.7 AI Provider

- `OPENAI_API_KEY`
- `AI_MODEL_ID`

### 3.8 Miscellaneous

- Rate-limit config
- Worker concurrency
- Cache TTL overrides
- Feature flags

## 4. Secret Management Rules

### 4.1 No Secrets in Source Code

- No API keys in Git
- No hardcoded credentials
- No embedded secrets in CI/CD files

### 4.2 Approved Secret Storage Methods

- Encrypted environment files
- Secret manager (AWS, GCP, Vault)
- Encrypted CI/CD variables

### 4.3 Secret Rotation Requirements

- Rotate every 90 days
- Rotate after suspected breach
- Document rotation history

## 5. Secure Loading Rules

### 5.1 Load Order

Configuration loaded in this order:

1. Base config
2. Environment-specific config
3. Secret overrides
4. Runtime flags

### 5.2 Validation Requirements

Backend must fail immediately if:

- Required secrets are missing
- Values use default insecure settings
- Environment mismatch occurs

### 5.3 Type Enforcement

Each variable must be:

- Boolean
- Number
- String
- JSON (validated)

## 6. CI/CD Integration

### 6.1 Environment Injection

Deployed environments must load:

- Only the matching environment file
- No cross-environment overrides

### 6.2 Secret Injection

CI/CD must:

- Inject secrets from encrypted storage
- Never expose them in pipeline logs
- Mask secrets by default

### 6.3 Deployment Safety Checks

Deployment must fail if:

- A required key is missing
- A staging key appears in production
- Unsafe debug flags are enabled

## 7. Monitoring & Auditability

### 7.1 Configuration Change Logs

All changes to secrets/config must be logged:

- timestamp
- modifiedBy
- oldValue (masked)
- newValue (masked)

### 7.2 Secret Access Logs

- Who accessed secrets
- Which component requested them
- When and why

### 7.3 Alerting

Trigger alerts when:

- Secret is accessed unusually often
- A configuration appears malformed
- Multiple failed loads occur

## 8. Security Requirements

### 8.1 Encryption Requirements

- At-rest encryption (AES-256)
- In-transit encryption (TLS 1.2+)

### 8.2 Least Privilege Principle

- Services only receive the secrets they require
- No shared "super configuration"

### 8.3 Environment Protection

- Production secrets accessible to authorized DevOps only
- Strict RBAC controls

## 9. Performance Considerations

- Secret loading should add less than 1 ms overhead
- Configuration caching allowed after initial load
- Hot reload of config not permitted in production

## 10. Future Enhancements

- Fully automated secret rotation
- Hardware security modules (HSM)
- Multi-region synchronized secrets store
- Admin dashboard for config inspection

## 11. Conclusion

This document establishes the Environment Configuration & Secret Management Specification for OGC NewFinity.

It ensures safe, predictable, and secure management of sensitive configuration across all environments and services.

