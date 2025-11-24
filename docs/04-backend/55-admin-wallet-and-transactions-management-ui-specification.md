# OGC NewFinity — Admin Wallet & Transactions Management UI Specification (v1.0)



## 1. Introduction

This document describes the **Admin Wallet & Transactions Management UI**, which provides administrators with full visibility into wallet activity, including:



- On-chain + off-chain token balances  

- Reward distributions  

- Mining contribution logs  

- Manual adjustments  

- Transaction audits  

- Wallet sync issues  

- Suspicious activity flags  



Admins require fast, reliable, and secure access to wallet data to ensure accuracy and system integrity.



---



# 2. Routing & Navigation



### Main Route:

`/admin/wallet`



### Subroutes:

- `/admin/wallet` → Wallet Overview  

- `/admin/wallet/transactions` → Transaction History  

- `/admin/wallet/rewards` → Reward Management  

- `/admin/wallet/mining` → Mining Activity  

- `/admin/wallet/adjust` → Manual Adjustments  

- `/admin/wallet/sync-log` → Sync Issues / Events  



---



# 3. Wallet Overview Page



### Purpose:

Provide a high-level summary of system-wide wallet status.



### Components:

- Total tokens in circulation  

- Total off-chain balance  

- Total rewards distributed  

- Pending rewards  

- Mining contributions today  

- Wallet sync status card  



### Visual:

- Admin-style stat widgets  

- Compact layout  

- Minimal neon  



---



# 4. Transactions Page



### Table Columns:

- Transaction ID  

- User  

- Type (Reward / Mining / Manual / Airdrop / Adjustment)  

- Amount  

- Status (Success / Failed / Pending)  

- Timestamp  

- Actions  



### Filters:

- Transaction type  

- Status  

- Amount range  

- Date range  

- User  



### Search:

- Transaction ID  

- User name/email  



### Row Actions:

- View Details  

- Flag Transaction  

- Re-run sync (for failed on-chain operations)  



---



# 5. Transaction Details Modal



### Fields:

- Transaction ID  

- User ID + profile link  

- Type  

- Amount  

- Status  

- Error message (if failed)  

- Metadata (on-chain hash, block number, etc.)  

- Timestamp  

- Admin notes  



### Actions:

- Add Note  

- Reprocess Transaction (if allowed)  

- Flag for Investigation  



---



# 6. Reward Management Page



Admin can view and manage reward distributions.



### Table Columns:

- Reward ID  

- User  

- Challenge (if applicable)  

- Amount  

- Status  

- Type (Manual / Auto / Challenge Reward)  

- Timestamp  



### Actions:

- Issue manual reward  

- Revoke reward  

- View reward history  

- Flag anomalies  



---



## 6.1 Issue Manual Reward (Modal)



Fields:

- User  

- Amount  

- Reason / description  

- Related challenge (optional)  

- Internal note  



Safety:

- Confirmation modal  

- Logged to audit log  



---



# 7. Mining Activity Page



### Table Columns:

- Mining Event ID  

- User  

- Contribution type  

- Token amount earned  

- Timestamp  

- Associated action (submission, challenge, etc.)  

- System-generated or manual  



### Filters:

- Date  

- Contribution type  

- User  

- Token amount range  



### Admin Actions:

- Correct mining reward (manual adjustment)  

- Flag suspicious contributions  



---



# 8. Manual Adjustments Page



Used for:

- Correcting user balances  

- Fixing duplicate transactions  

- Adjusting errors from failed sync  



### Form Fields:

- User  

- Adjustment amount (positive or negative)  

- Reason  

- Category (Correction / Refund / Reversal / Bonus)  

- Internal note  



### Actions:

- Apply Adjustment  

- Cancel  



Safety rules:

- Confirmation modal  

- Logged in audit trail  

- Negative balances prohibited  



---



# 9. Sync Log Page



Tracks on-chain/off-chain synchronization.



### Table Columns:

- Sync Event ID  

- Status (Success / Failure / Warning)  

- Error code  

- Timestamp  

- User  

- Related transaction ID  



### Detail View:

- Full sync payload  

- Error logs  

- Retry button (if allowed)  



### Alerts:

- Repeated sync failures  

- Network issues  

- Rate-limit triggers  



---



# 10. Flags & Suspicious Activity



Admin must be able to:

- Flag transactions  

- Flag users from wallet page  

- Mark suspicious behaviors  

- Create audit tasks  



### Flag Page:

Columns:

- Item ID  

- User  

- Reason  

- Reviewer  

- Status  

- Actions  



---



# 11. Empty & Error States



### Empty:

- "No transactions found."  

- "No mining activity."  

- "No sync issues."  



### Error:

> "Unable to load wallet data. Try again."



### Critical System Error:

Admin-only red banner:

> "Wallet subsystem encountered an error. Check DevOps logs immediately."



---



# 12. Visual Styling (Admin Theme)



Use admin system look:

- Dark backgrounds  

- Minimal neon  

- High density  

- Sharp dividers  

- Table-first layout  



Key accents:

- Teal for positive states  

- Yellow for warnings  

- Red for errors  



Buttons:

- Approve = green/teal  

- Reject/Remove/Revoke = red/pink neon  



---



# 13. Responsive Behavior



### Desktop:

Full functionality, multi-columns.



### Tablet:

Collapsible sidebar, horizontal scroll tables.



### Mobile:

View-only.  

No destructive actions permitted on mobile.



---



# 14. Future Enhancements



- AI-powered anomaly detection  

- Transaction clustering  

- Heatmaps for reward distribution  

- Wallet health scoring  

- Automated sync repair  

- Bulk adjustments system  



---



# 15. Conclusion



This document defines the full Admin Wallet & Transactions Management system for OGC NewFinity.  

The admin interface ensures financial transparency, secure reward distribution, and robust auditing for all wallet-related operations.

