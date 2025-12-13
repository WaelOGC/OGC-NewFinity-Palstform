# Known Bugs & Issues

This document tracks known bugs and issues that are documented but not yet resolved. Issues marked as "non-blocking" can be addressed after core platform features are completed.

---

## Admin Users – Last Login / Role / Status Not Updating

**Area:** Backend / Database  
**Severity:** Low  
**Status:** Known issue – non-blocking  
**Affects:** Admin Dashboard → Users Management  
**First observed:** Current development cycle

### Description

Admin Users API intermittently returns null or fallback values for:

- `lastLoginAt`
- `roles`
- `accountStatus`

This results in the Admin UI displaying:

- "Never" for Last Login
- "Unknown" for Account Status
- Empty roles

The frontend rendering and normalization logic is confirmed to be correct.

### What Was Attempted

- Safe SQL migrations for `lastLoginAt`, `status`, and `role` columns
- Runtime schema resolver supporting multiple table/column variants
- Login flow update with fallback to `updatedAt` when `lastLoginAt` column missing
- Admin list/detail queries with schema-drift tolerance
- Smoke tests confirming resolver output

### Current Hypothesis

The issue is likely caused by one or more of:

- Mismatch between the database actually used by the backend and the database where migrations were applied
- Existing legacy user records without updated timestamps
- Environment-specific schema differences

### Decision

This issue is **not blocking** core development. It will be revisited after main platform features are completed and the database schema is stabilized.

### Future Fix Notes (do not implement now)

- Hard-verify active DB schema via admin diagnostic endpoint
- Add explicit admin debug view for raw user fields
- Reconcile legacy user records with normalized schema
