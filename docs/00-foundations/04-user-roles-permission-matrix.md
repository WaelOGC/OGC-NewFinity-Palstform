# OGC NewFinity — User Roles & Permission Matrix (v1.0)



## 1. Introduction

This document defines all user roles within the OGC NewFinity ecosystem and outlines their associated permissions, access levels, and capabilities.  

It is a foundational reference for backend APIs, frontend UI visibility, admin tools, and governance planning.



The platform currently uses **three core roles**, with additional future roles for governance and enterprise operations.



---



## 2. Role Definitions



### **2.1 Standard User (Free Tier)**

The base account type for all users entering the ecosystem.



**Capabilities:**

- Access to Free-tier AI tools  

- Participate in challenges (limited categories)  

- Submit challenge entries  

- Vote on challenges (limited votes)  

- Earn basic contribution points  

- Receive notifications  

- View badges  

- Manage profile settings  



**Restrictions:**

- Limited AI usage  

- No advanced tools  

- No staking  

- No advanced analytics  

- Limited challenge access  

- Cannot manage other users  



---



### **2.2 Pro User**

Paid subscription users with enhanced access and higher resource limits.



**Capabilities (includes all Free abilities):**

- Access to Pro-tier AI tools  

- Higher rate limits  

- Access to premium challenge categories  

- Early access to new features  

- Priority customer support  

- Extended voting rights  

- Higher contribution multipliers  

- Ability to save AI outputs  

- Access to Pro-only analytics  



---



### **2.3 Enterprise User**

A subscription tier for businesses, organizations, and teams.



**Capabilities (includes all Pro abilities):**

- Unlimited AI access  

- Multi-user team management (future)  

- Custom AI workflows (future)  

- Access to enterprise dashboards  

- Extended data exports  

- Organizational analytics  

- Priority integration support  

- Faster rate limits  

- Private challenge hosting (future)  



---



### **2.4 Admin User**

Internal OGC Technologies account with platform-wide control.



**Capabilities:**

- Manage users  

- Assign/modify badges  

- Approve or reject challenge submissions  

- Manage challenges and categories  

- Modify platform content  

- Access full analytics  

- Manage subscription plans  

- Send notifications  

- View all logs (AI, challenges, contributions)  

- Override permissions  



**Restrictions:**

- Cannot perform token transfer actions on behalf of users  



---



## 3. Permission Matrix (Global Overview)



### **Legend**

- ✔ = Allowed  

- ✖ = Not allowed  

- ⚠ = Limited  



| Feature / Action | Standard User | Pro User | Enterprise User | Admin |

|------------------|---------------|----------|------------------|--------|

| Access Free AI Tools | ✔ | ✔ | ✔ | ✔ |

| Access Pro AI Tools | ✖ | ✔ | ✔ | ✔ |

| Access Enterprise Tools | ✖ | ✖ | ✔ | ✔ |

| AI Usage Rate Limits | ⚠ | High | Maximum | Unlimited |

| Join Challenges | ✔ | ✔ | ✔ | ✔ |

| Submit Challenge Entry | ✔ | ✔ | ✔ | ✔ |

| Vote on Submissions | ⚠ Limited | ✔ | ✔ | ✔ |

| Access Premium Challenges | ✖ | ✔ | ✔ | ✔ |

| Contribution Mining | ✔ | ✔ | ✔ | ✔ |

| Badge Earning | ✔ | ✔ | ✔ | ✔ |

| Staking (Future) | ✖ | ✔ | ✔ | ✔ |

| Access Wallet Dashboard | ✔ | ✔ | ✔ | ✔ |

| Access Amy Dashboard | ✔ Limited | ✔ Full | ✔ Full | ✔ Full |

| Access Admin Dashboard | ✖ | ✖ | ✖ | ✔ |

| Manage Users | ✖ | ✖ | ✖ | ✔ |

| Approve Submissions | ✖ | ✖ | ✖ | ✔ |

| Edit Challenges | ✖ | ✖ | ✖ | ✔ |

| Modify System Settings | ✖ | ✖ | ✖ | ✔ |



---



## 4. Role Hierarchy Model



Admin

└── Enterprise User

└── Pro User

└── Standard User



markdown

Copy code



The hierarchy determines:

- API access  

- Rate limits  

- Permissions escalation  

- UI visibility  

- Admin override logic  



---



## 5. Future Roles (Planned)



### **5.1 Governance Voter**

Token-based permission level allowing:

- Proposal voting  

- Delegation  

- Governance access  



### **5.2 Challenge Moderator**

Non-admin moderator for:

- Reviewing submissions  

- Managing categories  

- Reporting violations  



### **5.3 Organization Team Lead**

Enterprise user with:

- Team member management  

- Analytics for team activity  

- Workflow assignment  



---



## 6. Conclusion

This user role and permission matrix serves as the official reference for:

- Backend access control  

- UI logic  

- Feature gating  

- Subscription system development  

- Governance planning  



All future platform features must align with this structure.

