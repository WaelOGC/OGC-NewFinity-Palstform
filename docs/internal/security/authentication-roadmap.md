# OGC NewFinity — Authentication Roadmap & Engineering Notes

## Internal Development Documentation

This document contains engineering notes, pending work items, and implementation status for the authentication system.

---

## ⚠️ Pending OAuth Integration Confirmation — Discord, X (Twitter), GitHub

The OAuth strategies for Discord, X (Twitter), and GitHub are implemented in the backend but not fully validated. Current status:

### 🔍 Key Issues Still Pending

- Strategy registration requires final verification
- Environment variables must be confirmed for each provider
- Redirect URIs must be tested end-to-end
- Callback responses are failing due to unverified tokens or incomplete configurations
- Integration tests for all three providers have not yet been executed

### 🧩 Impact

- Social login & registration via Discord, X, and GitHub are currently disabled
- These providers should not be exposed to production or demo environments
- The onboarding flow must continue to rely on email/password + Google + LinkedIn until resolved

### 📝 Required Actions (Assigned to Backend Team)

- Validate all provider-specific environment variables
- Re-run OAuth flow testing in local and staging environments
- Confirm Passports strategies register without warnings
- Test callback signatures and token validation
- Enable providers only after full green-light confirmation

### 📌 Deadline

No strict deadline, but must be completed before Phase 2 Account Expansion begins.

---

## Additional Notes

_This section will be expanded with additional engineering notes and roadmap items as they arise._
