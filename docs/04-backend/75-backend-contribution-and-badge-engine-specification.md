# OGC NewFinity — Backend Contribution & Badge Engine Specification (v1.0)



## 1. Introduction

This document defines the backend logic, scoring rules, automation workflows, and badge assignment engine for the **Contribution & Badge System**, a core pillar of user progression in the OGC NewFinity ecosystem.



The engine powers:

- Contribution point generation  

- Engagement-based scoring  

- Challenge participation scoring  

- Automatic badge assignment  

- Manual badge assignment (admin)  

- Reward integration (Wallet Engine)  

- Achievement tracking  

- Long-term user progression  



---



# 2. Contribution Architecture



Contribution events are generated from:

- Challenges  

- Submissions  

- Profile completion  

- Daily activity (future)  

- Learning tasks (future)  

- System-recognized achievements  

- Admin actions  

- Bonus events  



The system must:

- Record contribution events  

- Calculate point values  

- Update user progression  

- Trigger badges  

- Trigger reward issuance events  



---



# 3. Contribution Event Model



Fields:

- id  

- userId  

- type (enum)  

- points  

- metadata (JSONB)  

- challengeId (optional)  

- submissionId (optional)  

- source ("system", "admin", "challengeEngine")  

- createdAt  



### Example event:

{

"type": "challenge.participation",

"points": 15,

"challengeId": "...",

"userId": "..."

}



markdown

Copy code



---



# 4. Contribution Types



### Core Categories:

- challenge.participation  

- challenge.win  

- submission.approved  

- profile.complete  

- system.bonus  

- admin.granted  

- referral.success (future)  

- daily.login (future)  

- milestone.reached  



### Rules:

Each type has:

- Base points  

- Bonus multipliers  

- Tier multipliers (Pro/Enterprise)  

- Frequency limits  



Example:

challenge.participation = 15 points

challenge.win = 100 points

submission.approved = 25 points

profile.complete = 10 points



yaml

Copy code



---



# 5. Scoring Logic



### Formula:

finalPoints = basePoints + bonus + tierMultiplier + metadataAdjustments



yaml

Copy code



Backend must prevent:

- Negative scoring  

- Duplicate event scoring  

- Exploitation (spam submissions, rapid events)  



Scoring must be **idempotent** to avoid double rewards.



---



# 6. Contribution Engine Workflow



Event Trigger

↓

Scoring Engine

↓

Contribution Record Created

↓

Update User Points

↓

Badge Evaluator

↓

Reward Issuance (Wallet Engine)

↓

Notification Engine



yaml

Copy code



Each stage must be logged.



---



# 7. User Contribution Progress Tracking



### Database Fields:

- totalPoints  

- monthlyPoints  

- streaks (future)  

- lastContributionAt  



System must support:

- Leaderboards (future)  

- Tier progression (future)  



---



# 8. Badge System Overview



Badges represent:

- Milestones  

- Achievements  

- Challenge-related wins  

- Contribution thresholds  

- Special recognitions  



Badges improve:

- User engagement  

- Profile prestige  

- Ecosystem progression  



---



# 9. Badge Model



Fields:

- id  

- name  

- slug  

- description  

- category  

- level (1–5 optional)  

- icon  

- visibility  

- criteria (JSONB)  

- createdAt  



---



# 10. Badge Categories



Examples:

- **Milestone Badges**

  - 100 points  

  - 500 points  

  - 1000 points  



- **Challenge Badges**

  - Participation  

  - Finalist  

  - Winner  



- **Profile Badges**

  - Profile completed  

  - Verified email  



- **Special Badges**

  - Early supporter  

  - Contributor  

  - Elite Creator  



---



# 11. Badge Criteria Logic



Badges are awarded when:

- Contribution thresholds reached  

- Specific event triggered  

- Challenge outcome achieved  

- Admin approval granted  



### Example criteria:

{

"type": "points.threshold",

"value": 100

}



yaml

Copy code



Another example:

{

"type": "challenge.win"

}



yaml

Copy code



Badges must be:

- Automatically assigned  

- Non-removable except by admin  



---



# 12. Badge Assignment Engine Workflow



Workflow:

1. New contribution event created  

2. Contribution updated  

3. Run badge evaluator  

4. Check all badges against user state  

5. Award new badges  

6. Notify user  

7. Log event  



Badge assignment must be **fast** and **scalable**.



---



# 13. Admin Controls



Admins can:

- Manually assign badges  

- Manually remove badges  

- Grant contribution points  

- Override scoring system  

- Change badge metadata  

- Trigger badge recalc for all users  



All actions logged via Audit Engine.



---



# 14. Notifications Integration



Trigger notifications for:

- New badge unlocked  

- Contribution earned  

- Milestones reached  

- Admin-granted badge  

- Streak achievements (future)  



Delivery handled by Notification Engine.



---



# 15. Reward Integration



Contribution Engine triggers events for Wallet Engine:



### Examples:

- Reward bonuses for reaching milestones  

- Reward bonuses for challenge winners  

- Monthly contribution awards  

- Mining-style rewards (gamified)  



Wallet Engine then:

- Creates transaction  

- Updates wallet balance  

- Notifies user  



Contribution Engine itself does **not** issue tokens.



---



# 16. Anti-Abuse Measures



System must detect and prevent:

- Spam submissions  

- Fake participation  

- Multi-account manipulation  

- Invalid metadata patterns  

- Rapid event generation  



Flagged users:

- Have rewards marked as pending  

- Are reviewed by admin  

- Appear in security logs  



---



# 17. Error Codes



| Code | Meaning |

|------|---------|

| BADGE_NOT_FOUND | Invalid badge ID |

| INVALID_CRITERIA | Badge logic invalid |

| DUPLICATE_EVENT | Contribution event already exists |

| INVALID_CONTRIBUTION_TYPE | Unsupported type |

| SCORING_ERROR | Scoring logic failure |

| USER_NOT_ELIGIBLE | User cannot receive badge |



---



# 18. Performance Requirements



- Must handle millions of contribution events  

- Badge evaluator must run in <100ms  

- Highly indexed tables:

  - userId  

  - type  

  - createdAt  



- Queued processing for high-load events  

- Fast batch recalc for admin operations  



---



# 19. Future Enhancements



- Achievement trees  

- Seasonal progression system  

- Contribution streaks  

- AI-based badge recommendations  

- Public leaderboard  

- Tier upgrades linked to contribution score  



---



# 20. Conclusion



This document defines the full backend Contribution & Badge Engine.  

It ensures reliable scoring, automated badge assignment, reward integration, and long-term user progression across the OGC NewFinity ecosystem.

