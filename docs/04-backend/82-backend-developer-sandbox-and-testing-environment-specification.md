# OGC NewFinity — Backend Developer Sandbox & Testing Environment Specification (v1.0)



## 1. Introduction

This document defines the architecture, rules, tooling, and operational workflows for the **Developer Sandbox & Testing Environment** of the OGC NewFinity platform.



This environment exists to:

- Enable safe backend development  

- Provide accurate staging of core systems  

- Support automated testing  

- Allow developers to validate APIs without affecting production  

- Provide isolated data and storage  

- Ensure consistent, controlled environments for all contributors  



This is the foundation for stable backend development and QA.



---



# 2. Environment Types



The system supports four environment layers:



| Environment | Purpose |

|------------|---------|

| **development** | Local dev environment used by developers |

| **sandbox** | Cloud-based safe environment for testing APIs |

| **staging** | Pre-production environment mirroring production |

| **production** | Live system for real users |



Each environment has different rules for:

- Logging  

- Rate limiting  

- Data persistence  

- Access restrictions  

- Provider integrations  



---



# 3. Environment Separation Rules



### 1. **Strict Data Isolation**

No environment can share:

- Database instances  

- Storage buckets  

- Cache keys  

- Config secrets  



### 2. **Strict Service Isolation**

Microservices or backend modules must never cross-environment.



### 3. **Separate Authentication Keys**

- Dev keys  

- Sandbox keys  

- Staging keys  

- Production keys  



### 4. **No user data ever flows from production to sandbox/dev**

Unless anonymized (future).



---



# 4. Developer Environment (Local)



Developers run local services using:



- Node.js backend  

- Prisma ORM  

- SQLite (default) or Postgres test container  

- Local Redis (optional)  

- Mock providers (email, SMS, storage)  

- Hot reload (via Nodemon or similar tools)  



### Developer Environment Behavior:

- No rate limits  

- Full logging  

- Debug mode enabled  

- Relaxed validation rules  

- Artificial error injection supported  



---



# 5. Sandbox Environment (Cloud)



The Sandbox Environment is the "safe real API" environment used for:



- API testing  

- Integration testing  

- UI testing  

- Mobile app testing  

- Documentation development  

- Tooling verification  



### Sandbox Rules:

- Uses isolated database  

- Uses isolated buckets  

- Uses safe email/SMS provider (test mode)  

- Wallet rewards always mocked  

- Challenges/submissions are fake  

- Real-time logs visible to developers  

- Resettable daily (future)  



Errors are always verbose in sandbox.



---



# 6. Staging Environment (Pre-Production)



The staging environment mirrors production:



### Staging Rules:

- Production-grade database engine  

- Production-grade storage  

- All features active  

- Logging only partially verbose  

- Rate limits active  

- Email/SMS in test mode  

- Smart anonymized data (future)  

- Used for final QA  

- Only internal team access  



This environment represents the "final checkpoint" before deployment.



---



# 7. Production Environment



### Production Rules:

- Strict validation  

- Strict rate limits  

- Minimal logging (no sensitive data)  

- All secrets active  

- Real notifications  

- Immutable audit trail  

- No direct DB access except by system admins  



This environment is the final, customer-facing system.



---



# 8. Environment Configuration Structure



Environments follow a unified configuration schema:



config/

development.json

sandbox.json

staging.json

production.json



yaml

Copy code



Each file includes:

- Database config  

- Cache config  

- File storage config  

- Email/SMS providers  

- Feature flags  

- Rate limits  

- Security settings  



### Sensitive keys stored in:

- Environment variables  

- Secret manager (future)  



---



# 9. Provider Behavior per Environment



| Provider | Development | Sandbox | Staging | Production |

|---------|-------------|---------|---------|-----------|

| Email | Mock only | Test mode | Test mode | Live |

| SMS | Mock only | Test mode | Test mode | Live |

| Storage | Local / mock | Cloud test bucket | Prod-like bucket | Production bucket |

| Wallet | Mock | Mock | Real logic, test tokens | Real logic, real tokens |

| AI Gateway | Mock | Limited real | Real | Real |



---



# 10. Automated Testing Framework



Testing system includes:



### Unit Tests

- Run locally and in CI  

- Validate core backend logic  



### Integration Tests

- Run against sandbox environment  

- Validate API-to-module interactions  



### End-to-End Tests

- Run against staging  

- Validate full system behavior  



### Mock Tools

Developers can mock:

- AI responses  

- Email/SMS  

- File uploads  

- Challenge states  

- Submissions  



---



# 11. Test Data Model



Sandbox/Staging test data includes:

- Demo users  

- Demo wallets  

- Demo challenges  

- Demo submissions  

- Demo notifications  



Production data is **never used**.



---



# 12. Developer Sandbox Tools (Future)



- Sandbox Dashboard  

- Reset Sandbox Data  

- API Key Generator for Devs  

- Live Log Stream  

- Endpoint Inspector  

- Error Injection Tools  



These tools will streamline development and QA.



---



# 13. CI/CD Integration



CI/CD runs pipeline stages:



1. Install dependencies  

2. Linting  

3. Unit tests  

4. Integration tests (sandbox)  

5. Build artifacts  

6. Push to staging  

7. QA approval  

8. Deploy to production  



Testing failures block deployment.



---



# 14. Error Handling Differences by Environment



| Environment | Error Detail | Verbosity |

|-------------|--------------|-----------|

| Development | Full stack trace | High |

| Sandbox | Full stack trace | High |

| Staging | Partial stack trace | Medium |

| Production | Sanitized error | Low |



Example production error:

{

"success": false,

"error": {

"code": "SYSTEM_ERROR",

"message": "An unexpected error occurred. Please try again later."

}

}



yaml

Copy code



---



# 15. Logging Differences by Environment



### Development:

- Everything logged  

- Full details  

- Real-time logs  



### Sandbox:

- Most logs enabled  

- API logs verbose  

- Security logs visible  



### Staging:

- Logs partially masked  

- Only system admins may view  



### Production:

- Logs heavily masked  

- Only high-level diagnostics  



---



# 16. Performance Expectations



- Local dev system must start in <3 seconds  

- Sandbox API must maintain <150ms average latency  

- Staging must match production latency (<100ms)  

- Test suite must run in <60 seconds  



---



# 17. Safety Rules



- No production secrets in sandbox/dev  

- No cross-environment data movement  

- Staging reset must require admin approval  

- Sandbox reset must be safe and automated (future)  

- No sensitive logs in staging/production  



---



# 18. Future Enhancements



- AI-assisted debugging  

- Visual flow inspector  

- Replay system for API calls  

- Environment sync system (schema only)  

- Auto-generation of test data sets  

- Developer proxies for mobile testing  



---



# 19. Conclusion



This document defines the full Developer Sandbox & Testing Environment for OGC NewFinity.  

It enables safe, structured, scalable, and professional backend development and QA operations.

