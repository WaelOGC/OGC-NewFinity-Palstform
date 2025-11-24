# OGC NewFinity — Badge & Contribution System Specification (v1.0)



## 1. Introduction

The Badge & Contribution System is the gamified engine of the OGC NewFinity ecosystem.  

It rewards users for participating, contributing, creating, voting, and completing meaningful actions within the platform.



This document defines:

- Contribution rules  

- Badge categories and tiers  

- Earning logic  

- Multipliers  

- System triggers  

- Integration points  

- Future expansions  



This is the unified reference for all gamification logic across the platform.



---



# 2. Contribution System Overview



Contribution points represent user activity and engagement.  

They are earned by:

- Participating in challenges  

- Submitting entries  

- Voting  

- Winning challenges  

- Using AI tools  

- Completing tasks  

- Engaging with platform features  



Contribution points:

- Increase user status  

- Unlock badges  

- Improve reward visibility  

- Strengthen user ranking  

- Boost mining and token rewards  



---



# 3. Contribution Earning Actions



| Action | Description | Points |

|--------|-------------|--------|

| Account creation | New user joins platform | +10 |

| Daily login | User logs in | +2 |

| Use AI tool | Any Amy Agent tool action | +5 |

| Submit AI task | Content generated and saved | +3 |

| Join challenge | Participate in any challenge | +15 |

| Submit challenge entry | Upload approved submission | +25 |

| Receive vote | Someone votes on user's entry | +1 |

| Vote on others | Vote on a competitor's submission | +1 |

| Win challenge | Ranked top 3 | +50 / +30 / +20 |

| Complete tutorial (future) | Onboarding tasks | +20 |



### Rules

- Points stack cumulatively  

- Abuse (spam votes, low-effort activity) is penalized  

- Daily caps exist for Free tier users  



---



# 4. Contribution Multipliers



Multipliers enhance contribution earnings based on subscription tier.



| User Type | Multiplier |

|-----------|------------|

| Free | 1.0x |

| Pro | 1.5x |

| Enterprise | 2.0x |



### Example  

If a Pro user earns 20 points →  

**20 × 1.5 = 30 total points**



---



# 5. Badge System Overview



Badges visually represent achievements, skill levels, and contributions.



Four badge tiers exist:



1. **Common**  

2. **Rare**  

3. **Epic**  

4. **Legendary**



Each badge has:

- Name  

- Description  

- Tier  

- Icon  

- Achievement condition  



---



# 6. Badge Categories



### **Category 1: Contribution Badges**

For engagement and activity.



Examples:

- **Contributor I / II / III** — Earn 500 / 1,000 / 5,000 points  

- **Voter** — Cast 50 votes  

- **Supporter** — Help raise visibility for others  



---



### **Category 2: Challenge Badges**

For challenge participation.



Examples:

- **Participant** — Join 5 challenges  

- **Rising Creator** — Submit 10 entries  

- **Top Performer** — Reach finals  

- **Champion** — Win 1st place  



---



### **Category 3: AI Usage Badges**

For using the Amy Agent tools.



Examples:

- **AI Explorer** — Use 10 AI tools  

- **AI Crafter** — Save 25 AI outputs  

- **AI Master** — Generate 100 tasks  



---



### **Category 4: Special Badges**

Awarded manually or for platform milestones.



Examples:

- **Beta Member**  

- **Early Adopter**  

- **Community VIP**  



These may be **admin-only** badges.



---



# 7. Badge Unlock Conditions



Badges are unlocked when:

- User meets point thresholds  

- User completes badge milestones  

- Admin manually assigns special badges  

- User achieves challenge results  

- User completes AI-related tasks  



### Workflow

1. System detects eligible action  

2. Evaluates badge conditions  

3. Assigns badge  

4. Stores in `user_badges`  

5. Sends notification  

6. Updates dashboard  



---



# 8. Integration With Other Systems



The Contribution & Badge System integrates with:



### **8.1 Challenge Hub**

- Votes  

- Submissions  

- Wins  

- Participation  

- Leaderboards  



### **8.2 Wallet**

- High contribution users earn increased mining rewards  

- Rewards influenced by user rank  



### **8.3 AI Tools**

- Track usage  

- Assign AI mastery badges  

- Log usage behavior  



### **8.4 Subscriptions**

- Multiplier based on subscription tier  



### **8.5 Admin Panel**

- Admin assigns certain badges  

- Admin reviews contribution behavior  

- Admin handles abuse cases  



---



# 9. Abuse & Fraud Prevention



### System Flags:

- Excessive voting  

- Duplicate submissions  

- Low-effort spam AI usage  

- Automated account activities  



### Admin Actions:

- Remove contributions  

- Remove badges  

- Restrict user  

- Ban in extreme cases  



All actions are logged.



---



# 10. Future Expansions



- NFT-based badges  

- Badge showcases on public profiles  

- Season-based contribution leaderboards  

- Dynamic badges that evolve over time  

- Team or organization badges  

- Smart-contract-verified achievements  



---



# 11. Conclusion

This specification defines the complete rules and behavior for the Contribution & Badge System.  

All platform features—Challenges, AI tools, Wallet, Admin Panel—must interact consistently with this system to maintain fairness, progression, and engagement.

