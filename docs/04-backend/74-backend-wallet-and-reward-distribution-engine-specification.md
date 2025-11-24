# OGC NewFinity — Backend Wallet & Reward Distribution Engine Specification (v1.0)



## 1. Introduction

This document defines the full backend logic, architecture, financial safety rules, and workflow for the **Wallet & Reward Distribution Engine** that powers the economic layer of OGC NewFinity.



The engine supports:

- OGC balance tracking  

- Reward issuance  

- Contribution-based minting  

- Challenge reward payouts  

- Transaction logs  

- Withdrawal requests (future)  

- Fraud detection (future)  

- Admin adjustments  



This is the financial backbone of the ecosystem and must be extremely secure.



---



# 2. Wallet Architecture Overview



Each user has:

- A **primary wallet** (off-chain balance)

- A transaction history  

- Pending reward queue  

- Balance freeze logic (future)  



Wallet operations integrate with:

- Challenge Engine  

- Submission Engine  

- Contribution Engine  

- Admin Panel  



---



# 3. Wallet Model



### Required fields:

- id  

- userId (1:1)  

- balance (numeric)  

- pendingBalance  

- lastSync (future blockchain sync)  

- createdAt  

- updatedAt  



### Balance Types:

1. **Available balance**  

2. **Pending balance** (unreleased rewards)



---



# 4. Transaction Model



A transaction record must include:



- id  

- walletId  

- type (reward, mining, adjustment, admin)  

- amount  

- delta (positive or negative)  

- status (completed, pending, failed)  

- metadata (JSONB)  

- relatedSubmissionId (optional)  

- relatedChallengeId (optional)  

- createdAt  



### Transaction Types:

- `reward.distribution`

- `reward.bonus`

- `contribution.mining`

- `admin.adjustment`

- `system.compensation`

- `challenge.winnerReward`  



---



# 5. Reward Issuance Pipeline



Rewards are **not created directly** by the Challenge or Submission modules.



Instead:

1. Challenge Engine triggers event:  

   `wallet.rewardIssued`

2. Wallet Engine receives event  

3. Validates:

   - User eligibility  

   - Submission status  

   - Reward amount  

   - Duplicates  

4. Creates transaction  

5. Applies balance updates  

6. Sends notification  

7. Logs audit entry  



---



# 6. Reward Calculation (Rule-Based)



Reward amounts may come from:

- Challenge reward configuration  

- Contribution score  

- Badge multipliers  

- Bonus events  

- Manual admin overrides  



### Formula example (simplified):

finalReward = baseReward + bonus - penalties



yaml

Copy code



Backend must prevent:

- Negative rewards  

- Overflow  

- Duplicate issuance  



---



# 7. Pending vs Available Balances



### Pending Balance:

- Holds rewards waiting for validation  

- Used for anti-fraud  

- Released after approval window  



### Available Balance:

- Spendable by the user  

- Used for future marketplace features  

- Used for ecosystem utility tools  



Transition:

pending → available



yaml

Copy code



---



# 8. Fraud & Abuse Protections



The engine must detect:

- Duplicate submissions  

- Fake accounts  

- Rapid multi-account submissions  

- Abnormal reward spikes  

- Suspicious challenge participation  



Flagged events logged in:

- Security logs  

- Admin panel  

- Audit trail  



Rewards for flagged accounts go to **pending**.



---



# 9. Admin Controls



Admins can:

- Manually adjust balances  

- Create reward transactions  

- Freeze accounts  

- Reverse transactions  

- Review flagged wallet activity  

- Export reports  



Sensitive actions require:

- Confirmation  

- Reason field  

- Logged audit entry  



---



# 10. Event Integration



Wallet Engine consumes events:



### From Challenge Engine:

- `challenge.completed`

- `challenge.winnerSelected`

- `challenge.rewardIssued`



### From Submission Engine:

- `submission.approved`



### From Contribution Engine:

- `contribution.pointsEarned`

- `mining.event`



### From Admin Panel:

- `admin.adjustBalance`



All events must be validated before creating any transactions.



---



# 11. Wallet Operations



### 11.1 Add Balance

wallet.addBalance(amount, metadata)



shell

Copy code



### 11.2 Subtract Balance

wallet.subtractBalance(amount, metadata)



yaml

Copy code



Rules:

- Never allow negative balances  

- Overdraft → ERROR  



### 11.3 Transfer (future)

Internal wallet-to-wallet transfers may be added later.



---



# 12. Transaction Safety Rules



### Required:

- Atomic DB transactions  

- Prisma `transaction()` wrapper  

- Full audit trail  

- Read-only logs for admins  

- Duplicate prevention  



### Forbidden:

- Losing or skipping transactions  

- Race conditions  

- Reprocessing events  



Each transaction must be **idempotent**.



---



# 13. Error Codes



| Code | Meaning |

|------|---------|

| WALLET_NOT_FOUND | Missing wallet |

| INSUFFICIENT_BALANCE | Subtraction exceeds balance |

| INVALID_TRANSACTION_TYPE | Unsupported transaction type |

| DUPLICATE_TRANSACTION | Event already processed |

| FRAUD_SUSPECTED | Suspicious activity |

| REWARD_NOT_ALLOWED | Reward rules violated |



---



# 14. Notification Integration



Wallet Engine produces events for Notification Engine:



### Examples:

- `wallet.rewardIssued`

- `wallet.rewardAvailable`

- `wallet.adjustment`

- `wallet.flagged`

- `wallet.transactionCompleted`



Notifications must be:

- In-app  

- Email (optional)  



---



# 15. Audit Logging Requirements



Audit logs must include:

- Transaction ID  

- Admin actions  

- Before/after balance  

- IP address  

- Metadata  

- Trigger event  

- Timestamp  



All logs immutably stored.



---



# 16. Performance Requirements



- Scalable to millions of transactions  

- Indexed DB fields (walletId, userId, createdAt)  

- Must handle reward bursts (challenge completions)  

- Queued processing recommended  

- Low-latency balance reads  

- Optimized transaction history queries  



---



# 17. Future Enhancements



- Blockchain sync module (OGC chain)  

- Multi-wallet support  

- Reward formulas powered by AI  

- Scheduled payouts  

- Webhook integration  

- Wallet analytics for admins  



---



# 18. Conclusion



This document defines the complete backend Wallet & Reward Distribution Engine.  

It ensures secure, accurate, and scalable handling of all economic operations across the OGC NewFinity ecosystem.

