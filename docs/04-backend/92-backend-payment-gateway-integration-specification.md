# OGC NewFinity — Backend Payment Gateway Integration Specification (v1.0)

## 1. Introduction

This document defines the integration architecture, payment flow rules, provider requirements, webhook handling, and security protocols for the Payment Gateway used within the OGC NewFinity backend.

The Payment Integration Engine ensures:

- Secure payment processing
- Subscription billing support
- Token purchase compatibility (future)
- Reliable webhook verification
- Idempotent transaction handling
- Seamless platform-wide financial operations

This specification applies to all payments related to subscriptions, upgrades, renewals, and platform services.

## 2. Supported Payment Providers

### 2.1 Primary Provider

- Stripe API (recommended)

### 2.2 Secondary Providers (Optional Future)

- CoinPayments (crypto support)
- PayPal
- Checkout.com

### 2.3 Dev & Sandbox Modes

- Local test provider
- Stripe test mode

All providers must support:

- Webhooks
- Recurring billing
- Refund processing
- PCI-compliant payment flows

## 3. Payment Flow Overview

### 3.1 User Payment Steps

1. User selects plan
2. Backend generates payment session
3. User completes payment at provider
4. Provider sends webhook
5. Backend validates payment & updates subscription
6. User gains access to features immediately

### 3.2 Required Flows

- One-time payments
- Recurring subscription payments
- Upgrades/downgrades
- Billing cycle changes
- Automatic renewal
- Failed payment retries

## 4. Payment Session Creation

Endpoint example:

```
POST /api/v1/payments/session
```

### 4.1 Request Requirements

- planId
- userId
- redirect URLs
- metadata (subscription or upgrade info)

### 4.2 Response

- paymentSessionUrl
- sessionId
- providerType
- expiration timestamp

## 5. Webhook Processing

### 5.1 Required Webhook Events

- payment_success
- payment_failed
- invoice_paid
- invoice_payment_failed
- subscription_canceled
- subscription_renewed
- dispute_opened (optional)

### 5.2 Webhook Verification Rules

- Validate provider signature
- Validate event timestamp
- Validate event type
- Prevent replay attacks
- Match sessionId & metadata

### 5.3 Webhook Behavior

- Never trust client-side payment confirmation
- Only webhooks confirm payment success
- Webhook events must be idempotent

## 6. Idempotency & Transaction Safety

### 6.1 Idempotency Rules

When processing payments:

- Use eventId from provider
- Ignore repeated events
- Store processed events in payment_events table

### 6.2 Duplicate Payment Protection

- Use a unique transactionKey per billing cycle
- Never create duplicate transactions
- Handle failed retry events safely

## 7. Subscription Management

### 7.1 Subscription States

- active
- past_due
- unpaid
- canceled
- trialing
- expired

### 7.2 Required Behaviors

- Auto-renewal
- Grace period handling
- Soft cancellation
- Prorated upgrades
- Billing cycle alignment

### 7.3 Backend Enforcement

After payment confirmation:

- Activate plan
- Set expiration date
- Enable feature access
- Log billing event

## 8. Refunds & Cancellations

### 8.1 Refund Types

- Partial refunds
- Full refunds
- Multiple refund events

### 8.2 Required Logging

Refund logs must contain:

- userId
- amount
- provider eventId
- reason
- timestamp

### 8.3 Subscription Behavior

Refund actions may:

- Cancel access
- Downgrade plan
- Require admin approval

## 9. Security Requirements

### 9.1 PCI Compliance

The backend must:

- Never store card numbers
- Never store CVV
- Store only payment metadata

### 9.2 API Security

- All payment endpoints require authentication
- Admin actions require elevated privileges

### 9.3 Rate Limiting

Enforce rate limits on:

- Payment session creation
- Webhook endpoints
- Retry events

## 10. Database Tables (Minimum Required)

### payments

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| userId | uuid | Linked user |
| sessionId | string | Provider session |
| status | string | success/failed/pending |
| amount | decimal | Payment amount |
| provider | string | stripe/coinpayments/etc |
| transactionKey | string | Idempotency key |
| createdAt | datetime | Creation time |

### subscriptions

| Field | Type | Description |
|-------|------|-------------|
| id | uuid | Primary key |
| userId | uuid | Linked user |
| planId | string | Selected plan |
| status | string | active/canceled/etc |
| expiresAt | datetime | Expiration date |

### payment_events

Stores processed webhook events to prevent duplicates.

## 11. Logging Requirements

Must log:

- payment session creation
- webhook events
- subscription activations
- failure reasons
- retry attempts
- refunds

All logs must include:

- eventId
- provider
- userId
- timestamp

## 12. Performance Requirements

- Payment session creation < 200 ms
- Webhook processing < 50 ms
- Idempotent validation < 5 ms
- System must support 10,000+ payments per day

## 13. Future Enhancements

- Token payments (ERC-20 OGCFinity)
- Smart contract-based billing
- Multi-currency support
- Fraud detection integration
- BI dashboards for financial analytics

## 14. Conclusion

This document defines the complete Payment Gateway Integration architecture for OGC NewFinity, ensuring secure billing, reliable subscription management, and scalable financial operations across the platform.

