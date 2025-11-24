# OGC NewFinity — Navigation Flow & User Journey Maps (v1.0)



## 1. Introduction

This document outlines the full navigation structure and user journey flows throughout the OGC NewFinity ecosystem.  

It defines how users move between dashboards, features, and screens, ensuring clarity, consistency, and seamless UX across all touchpoints.



This is the master reference for UI/UX design, frontend development, and onboarding optimization.



---



# 2. Global Navigation Model



OGC NewFinity operates across three interconnected dashboards:



1. **Core Platform Dashboard**  

2. **Wallet Dashboard**  

3. **Amy Agent Dashboard**



All dashboards share:

- Unified login  

- Top header (balance, profile, notifications)  

- Left sidebar navigation  

- Consistent layout structure  

- Shared user data  



---



# 3. High-Level Navigation Overview



### Core Platform

- Dashboard Overview  

- Wallet  

- Amy Agent  

- Challenges  

- Contributions  

- Badges  

- Subscriptions  

- Notifications  

- Settings  



### Wallet Dashboard

- Overview  

- Transactions  

- Earnings  

- Mining History  

- Staking (future)  



### Amy Agent Dashboard

- Text Tools  

- Creative Tools  

- Business Tools  

- Coding Tools  

- Document Tools  

- Analytics  

- Usage History  



---



# 4. User Journey Maps



Below are detailed journey flows for each major user action.



---



## 4.1 New User Registration Journey



1. **Landing Page → Sign Up**

2. Enter email + password  

3. Receive verification email  

4. Verify account  

5. Automatic redirect → Login  

6. User logs in  

7. Redirect → Core Platform Dashboard  

8. First-time onboarding tooltip sequence  

9. User explores Dashboard features  



**Outcome:** User onboarded into the ecosystem.



---



## 4.2 Login Journey



1. User enters credentials  

2. Auth service validates  

3. Access Token + Refresh Token issued  

4. User routed to Dashboard  

5. Header loads:

   - Token balance  

   - Notifications  

   - Profile info  



**Outcome:** Session established.



---



## 4.3 Subscription Upgrade Journey



1. User opens **Subscriptions** page  

2. Chooses Pro or Enterprise plan  

3. Payment session created  

4. User completes payment  

5. Subscription status updated  

6. Unlock premium features  

7. Confirmation notification sent  



**Outcome:** New subscription level activated.



---



## 4.4 Challenge Participation Journey



1. User opens **Challenges**  

2. Selects category or track  

3. Reads challenge rules  

4. Joins challenge  

5. Uploads submission  

6. Submission enters "pending approval"  

7. Admin approves  

8. Submission becomes public  

9. Users vote  

10. Rewards distributed when challenge ends  



**Outcome:** Submission completed, voted on, rewarded.



---



## 4.5 AI Tool Usage Journey (Amy Agent)



1. User selects Amy Agent dashboard  

2. Chooses AI tool (Text, Business, Design, etc.)  

3. Enters prompt  

4. AI processes request  

5. Response displayed  

6. User can:

   - Copy  

   - Save  

   - Regenerate  

   - Export  



7. AI usage logged in `ai_logs`  



**Outcome:** AI-assisted content generation.



---



## 4.6 Contribution Earning Journey



### Ways to Earn

- Using AI tools  

- Joining challenges  

- Voting  

- Submitting entries  

- Completing tasks  

- Participating in community  



### Flow

1. User performs qualifying action  

2. Contribution logged  

3. Points calculated  

4. Badge or level updated  

5. User notified  



**Outcome:** Contributions fuel progression.



---



## 4.7 Badge Unlock Journey



1. User meets badge requirement  

2. Backend checks eligibility  

3. Badge assigned  

4. Entry added to `user_badges`  

5. Notification sent  

6. Badge appears in Dashboard  



**Outcome:** User rewarded with achievements.



---



## 4.8 Wallet Sync & Token Journey



1. User visits Wallet Dashboard  

2. Backend syncs on-chain & off-chain data  

3. Token balance updated  

4. Mining history displayed  

5. User reviews earnings & transactions  



**Outcome:** Wallet state synchronized and visible.



---



## 4.9 Notification Journey



1. System event triggers notification  

2. Notification stored in database  

3. Badge icon in header shows unread count  

4. User opens Notifications panel  

5. User marks as read  



**Outcome:** User stays informed.



---



# 5. Multi-Dashboard Navigation Flow



Login

└── Core Platform Dashboard

├── Wallet Dashboard (external)

└── Amy Agent Dashboard (external)



yaml

Copy code



Each external dashboard:

- Shares the same user session  

- Syncs data with the platform  

- Returns user back to Core Dashboard  



---



# 6. Error & Edge Case Flows



### 6.1 Expired Token

- User attempts action  

- Access Token invalid  

- Silent refresh attempt  

- If Refresh Token valid → new Access Token  

- If Refresh Token expired → logout → login screen  



### 6.2 Invalid Submission

- User submits invalid file  

- Error displayed  

- Submission prevented  

- User corrects input  



### 6.3 Payment Failure

- Payment unsuccessful  

- User notified  

- Subscription unchanged  



### 6.4 Unauthorized Access

- User attempts restricted page  

- Redirect to "Access Denied"  

- CTA: Upgrade or return  



---



# 7. Future Journey Extensions



- Governance voting journey  

- Team management journey  

- AI marketplace journey  

- NFT badge unlocking  

- DAO participation flows  



---



# 8. Conclusion

These navigation flows and journey maps ensure every user interaction across the ecosystem is predictable, intuitive, and scalable.  

All UI/UX designs and development tasks must follow these paths for consistency.

