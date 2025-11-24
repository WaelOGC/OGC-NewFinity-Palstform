# OGC NewFinity — Subscription System Specification (v1.0)



## 1. Introduction

This document defines the complete subscription model for the OGC NewFinity ecosystem, including plan types, access levels, usage limits, billing logic, eligibility rules, and platform-wide feature gating.



The subscription system controls access to:

- AI tools  

- Rate limits  

- Challenge categories  

- Analytics  

- Wallet features  

- Enterprise extensions  



This is the master reference for backend, frontend, payment integration, and UI/UX teams.



---



# 2. Subscription Plans Overview



OGC NewFinity supports **three main subscription tiers**:



1. **Free Plan**  

2. **Pro Plan**  

3. **Enterprise Plan**



Each plan offers increasing levels of access, benefits, and system privileges.



---



# 3. Plan Details



## 3.1 Free Plan (Default)



### Features

- Access to Free AI tools  

- Limited AI usage (daily limits)  

- Basic challenge participation  

- Voting with restrictions  

- Basic contribution earning  

- Basic badge eligibility  

- Wallet dashboard access  

- Notifications  

- Profile management  



### Restrictions

- No premium AI tools  

- No advanced analytics  

- No enterprise features  

- No priority support  

- Limited export options  

- Limited voting power  



### Target Users

- Students  

- Casual users  

- Visitors exploring the platform  



---



## 3.2 Pro Plan



### Features (includes all Free features)

- Full access to Pro-tier AI tools  

- Higher rate limits for AI  

- Access to premium challenge categories  

- Increased voting power  

- Higher contribution multipliers  

- Ability to save, bookmark, or export AI outputs  

- Access to Pro analytics  

- Priority processing for AI requests  

- Early access to new features  



### Restrictions

- No enterprise dashboards  

- No team management  

- No organization-level analytics  



### Target Users

- Freelancers  

- Creators  

- Professionals  

- Students in advanced roles  



---



## 3.3 Enterprise Plan



### Features (includes all Pro features)

- Unlimited AI usage (soft limits apply)  

- Enterprise-exclusive AI tools  

- Multi-seat team management (future)  

- Custom workflows (future)  

- Advanced data analytics  

- Extended export capabilities  

- Highest voting power  

- API access extensions  

- Dedicated support  

- Fastest AI rate limits  



### Target Users

- Organizations  

- Agencies  

- Educational institutions  

- Developers building large-scale content  



---



# 4. Feature Gating Matrix



| Feature | Free | Pro | Enterprise |

|--------|------|-----|------------|

| Basic AI Tools | ✔ | ✔ | ✔ |

| Pro AI Tools | ✖ | ✔ | ✔ |

| Enterprise AI Tools | ✖ | ✖ | ✔ |

| AI Rate Limits | Low | High | Maximum |

| Challenge Participation | ✔ Basic | ✔ All | ✔ All |

| Premium Challenges | ✖ | ✔ | ✔ |

| Voting Power | Limited | Standard | Highest |

| Contribution Multiplier | 1x | 1.5x | 2x |

| Save AI Outputs | ✖ | ✔ | ✔ |

| Export Tools | Limited | Standard | Extended |

| Analytics | Basic | Pro | Enterprise |

| Team Management | ✖ | ✖ | ✔ (future) |

| API Extensions | ✖ | ✖ | ✔ |

| Support Level | Standard | Priority | Dedicated |



---



# 5. Subscription Lifecycle



## 5.1 Start Subscription

1. User selects plan  

2. Payment session created via Stripe  

3. Webhook validates payment  

4. Subscription entry stored  

5. User gains access immediately  



## 5.2 Renewal Logic

- Automatic renewal each billing cycle  

- Failed payments trigger:

  - Grace period  

  - Email alerts  

  - Downgrade if unresolved  



## 5.3 Downgrade Flow

1. User requests downgrade  

2. Downgrade scheduled for next billing cycle  

3. Current premium features retained until cycle ends  



## 5.4 Cancellation Flow

- User may cancel at any time  

- Account moves to Free tier at end of billing cycle  



---



# 6. Billing & Payment Rules



### Payment Gateway

- Stripe recommended  

- CoinPayments optional for token-based payments  



### Supported Billing Models

- Monthly  

- Yearly (discounted)  



### Required Metadata for Each Transaction

- user_id  

- plan  

- amount  

- currency  

- reference_id  

- payment_method  

- payment_status  



### Webhook Handling

- Validate event signature  

- Update subscription status  

- Log all payment events  



---



# 7. Backend Integration Requirements



### Required Database Tables

- subscriptions  

- payments  

- users (role/plan field)  



### API Interactions

- `/subscriptions/plans`  

- `/subscriptions/current`  

- `/subscriptions/upgrade`  

- `/subscriptions/cancel`  

- `/subscriptions/history`  



### Business Logic

- Subscription influences:

  - AI rate limits  

  - Challenge access  

  - Feature visibility  

  - API rate limits  

  - Notification importance  

  - Export capabilities  



---



# 8. Frontend Integration Requirements



### UI Requirements

- Clear plan comparison page  

- Upgrade/downgrade modals  

- Payment success/failure screens  

- Plan-specific feature gating  

- Disabled UI states for restricted features  



### Dashboard Indicators

- Current plan badge  

- Usage limits (AI tokens, etc.)  

- Upgrade call-to-actions  



---



# 9. Email & Notification Triggers



- Subscription purchase confirmation  

- Renewal confirmation  

- Payment failure  

- Subscription cancellation  

- Plan upgrade  

- Expiration warning  



---



# 10. Future Subscription Expansions



- Organization-level billing  

- Usage-based billing  

- On-chain subscriptions  

- Smart-contract locking  

- Reward-based subscription discounts  

- Partnership bundles  



---



# 11. Conclusion

This specification defines the full subscription logic and behavior for OGC NewFinity.  

All frontend, backend, wallet, and AI services must enforce these rules to ensure consistent access, fair usage, and stable billing operations.

