# OGC NewFinity Platform — Subscription API Blueprint

**Version:** v1.0

**Maintained by:** OGC Technologies

**Status:** Active Documentation (Internal; API Contract)**

## 1. Purpose

This API blueprint defines all endpoints involved in the Subscription System, including:

- Activation
- Upgrade
- Downgrade
- Cancelation
- Grace period
- Billing integration (webhooks)
- Admin-level subscription controls

This blueprint follows the logic defined in:

- `/docs/specs/subscription-system-spec.md`

## 2. Base URL

- `/api/subscription`
- `/api/admin/subscription`
- `/api/webhooks/subscription`

**Authentication:**

- User endpoints require JWT
- Admin endpoints require admin role
- Webhooks require provider signature verification

## 3. Endpoints — USER

### 3.1 GET /api/subscription

Returns the user's current subscription status.

**Response (200)**

```json
{
  "status": "success",
  "subscription": {
    "tier": "standard",
    "state": "active",
    "renewal_date": "2025-01-20",
    "created_at": "2025-01-01"
  }
}
```

### 3.2 POST /api/subscription/activate

Activates a new subscription (initial purchase).

**Payload**

```json
{
  "tier": "standard",
  "payment_method_id": "pm_123"
}
```

**Response (201)**

```json
{
  "status": "success",
  "message": "Subscription activated.",
  "tier": "standard"
}
```

### 3.3 POST /api/subscription/upgrade

Upgrades from lower tier → higher tier.

**Payload**

```json
{
  "new_tier": "premium"
}
```

**Response (200)**

```json
{
  "status": "success",
  "message": "Subscription upgraded to premium."
}
```

### 3.4 POST /api/subscription/downgrade

Schedules a downgrade for the next billing cycle.

**Payload**

```json
{
  "new_tier": "standard"
}
```

**Response (200)**

```json
{
  "status": "success",
  "message": "Subscription will downgrade at the end of the billing cycle."
}
```

### 3.5 POST /api/subscription/cancel

Cancels subscription at end of billing cycle.

**Response (200)**

```json
{
  "status": "success",
  "message": "Subscription canceled and will remain active until renewal date."
}
```

## 4. Endpoints — BILLING WEBHOOKS (Stripe / PayPal)

### 4.1 POST /api/webhooks/subscription

Triggered by Stripe/PayPal events.

**Example events:**

- `subscription_created`
- `subscription_updated`
- `subscription_canceled`
- `payment_failed`
- `invoice.paid`

**Example Payload**

```json
{
  "event_type": "payment_failed",
  "data": {
    "user_id": "123",
    "reason": "insufficient_funds"
  }
}
```

**Response (200)**

```json
{ "status": "received" }
```

Webhook handler updates:

- subscription status
- grace period
- billing logs

## 5. Endpoints — ADMIN

### 5.1 GET /api/admin/subscription/users

List all subscriptions.

**Response (200)**

```json
{
  "status": "success",
  "subscriptions": [
    {
      "user_id": "123",
      "tier": "premium",
      "status": "active",
      "renewal_date": "2025-01-20"
    }
  ]
}
```

### 5.2 POST /api/admin/subscription/modify

Admin manually modifies subscription tier.

**Payload**

```json
{
  "user_id": "123",
  "new_tier": "premium"
}
```

**Response (200)**

```json
{
  "status": "success",
  "message": "Subscription updated by admin."
}
```

### 5.3 POST /api/admin/subscription/credit

Admin gives free time or credits.

**Payload**

```json
{
  "user_id": "123",
  "days": 30
}
```

**Response (200)**

```json
{
  "status": "success",
  "message": "Subscription extended and credited."
}
```

## 6. Subscription States & Validation

**Valid States**

- `active`
- `trial`
- `grace`
- `expired`
- `canceled`

**State Transitions**

Examples:

- `trial` → `active`
- `active` → `grace` (payment failed)
- `grace` → `expired` (after grace period)
- `active` → `canceled` (scheduled)

Incorrect transitions result in:

```json
{
  "status": "error",
  "message": "Invalid subscription state transition."
}
```

## 7. Common Error Responses

**400 Bad Request**

```json
{ "status": "error", "message": "Invalid subscription tier." }
```

**401 Unauthorized**

```json
{ "status": "error", "message": "Authentication required." }
```

**403 Forbidden**

```json
{ "status": "error", "message": "Admin permission required." }
```

**404 Not Found**

```json
{ "status": "error", "message": "Subscription not found." }
```

**409 Conflict**

```json
{ "status": "error", "message": "Subscription already active." }
```

**500 Internal Error**

```json
{ "status": "error", "message": "Unexpected server error." }
```

## 8. Linked Documents

- `/docs/specs/subscription-system-spec.md`
- `/docs/admin/admin-tools-overview.md`
- `/docs/database/schema-overview.md`
- `/docs/amy/amy-system-spec.md`

