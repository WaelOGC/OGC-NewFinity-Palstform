# OGC NewFinity — Subscription API Contract (v1.0)



## 1. Introduction

This document defines the complete Subscription API Contract for OGC NewFinity.  

It covers all endpoints responsible for subscription management, billing logic, plan upgrades/downgrades, payment cycles, and status tracking.



The Subscription API integrates with:

- Stripe (primary payment gateway)  

- OGC User System  

- Notification System  

- Subscription tier logic  

- AI usage limits  

- Platform feature gating  



---



# 2. Base Path & Versioning

All subscription endpoints follow:



/api/v1/subscriptions/*



yaml

Copy code



Responses are **JSON**.



---



# 3. Core Concepts



### **Subscription Plans**

- free  

- pro  

- enterprise  



### **Subscription Status**

- active  

- canceled  

- expired  



### **Billing Cycles**

- monthly  

- yearly (discounted)



### **Payment Provider**

- Stripe  

- (Optional future: OGC Token payments)



---



# 4. Endpoints



---



## 4.1 GET `/subscriptions/plans`

### Description

Returns the list of available subscription plans.



### Success Response

```json
{
  "success": true,
  "plans": [
    {
      "id": "free",
      "price": 0,
      "features": []
    },
    {
      "id": "pro",
      "price": 9.99,
      "features": []
    },
    {
      "id": "enterprise",
      "price": 49.99,
      "features": []
    }
  ]
}
```



---



## 4.2 GET `/subscriptions/current`

### Description

Returns the authenticated user's active subscription.



### Headers

Authorization: `Bearer ACCESS_TOKEN`



### Success Response

{

"success": true,

"subscription": {

"plan": "pro",

"status": "active",

"start_date": "ISO",

"end_date": "ISO"

}

}



yaml

Copy code



### Error Codes

- `SUBSCRIPTION_NOT_FOUND`



---



## 4.3 POST `/subscriptions/upgrade`

### Description

Creates a payment session to upgrade a user's plan.



### Request Body

{

"plan": "pro | enterprise",

"billing_cycle": "monthly | yearly"

}



shell

Copy code



### Success Response

{

"success": true,

"checkout_url": "https://stripe.com/checkout/..."

}



yaml

Copy code



### Error Codes

- `SUBSCRIPTION_INVALID_PLAN`

- `SUBSCRIPTION_ALREADY_ACTIVE`



---



## 4.4 POST `/subscriptions/cancel`

### Description

Cancels the user's subscription at the end of the current cycle.



### Success Response

{

"success": true,

"message": "Subscription cancellation scheduled."

}



yaml

Copy code



### Error Codes

- `SUBSCRIPTION_NOT_ACTIVE`



---



## 4.5 GET `/subscriptions/history`

### Description

Returns full subscription history for the user.



### Success Response

{

"success": true,

"history": [

{

"plan": "pro",

"amount": 9.99,

"currency": "USD",

"payment_status": "paid",

"start_date": "ISO",

"end_date": "ISO"

}

]

}



yaml

Copy code



---



## 4.6 POST `/subscriptions/webhook`

### Description  

Stripe webhook endpoint. Validates events and updates subscription status.



### Event Types Handled

- `checkout.session.completed`  

- `invoice.payment_succeeded`  

- `invoice.payment_failed`  

- `customer.subscription.deleted`  



### Response

{

"success": true

}



yaml

Copy code



### Error Codes

- `SUBSCRIPTION_WEBHOOK_INVALID`

- `SUBSCRIPTION_SIGNATURE_MISMATCH`



---



# 5. Validation Rules



### Input Validation

- Plan must be one of: free, pro, enterprise  

- Billing cycle must be monthly or yearly  

- User must be authenticated  



### Webhook Security

- Validate Stripe signature header  

- Reject unverified events  

- Log all webhook activity  



---



# 6. Standard Error Response Format



{

"success": false,

"error": {

"code": "ERROR_CODE",

"message": "Readable message"

}

}



yaml

Copy code



---



# 7. Subscription Enforcement Logic



### Free Plan

- No payments  

- No renewals  

- Basic features  



### Pro & Enterprise Plans

- Auto-renew via Stripe  

- Downgrade only takes effect next cycle  

- Payment failure triggers:

  - Email alert  

  - Grace period  

  - Downgrade to Free if unresolved  



---



# 8. Notifications Triggered

- Subscription activated  

- Payment success  

- Payment failure  

- Renewal complete  

- Subscription canceled  

- Subscription expired  



---



# 9. Future Extensions

- OGC Token payments  

- Usage-based billing  

- Family/Team subscriptions  

- API key upgrades  

- Discount codes  



---



# 10. Conclusion

This API contract defines all subscription-related backend operations.  

All billing flows, UI logic, payment processing, and user feature access must align with this contract.

