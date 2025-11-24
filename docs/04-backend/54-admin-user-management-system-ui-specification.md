# OGC NewFinity — Admin User Management System UI Specification (v1.0)



## 1. Introduction

This document outlines the full UI/UX specification for the **Admin User Management System** within the OGC NewFinity Admin Panel.



Admin User Management enables administrators to:

- View all platform users  

- Search, filter, and review profiles  

- Modify user roles  

- Adjust subscription tiers  

- Suspend or delete accounts  

- Review user submissions and activity  

- Manage user wallet details (read-only)  

- Perform administrative overrides  



It must be:

- Clear  

- Fast  

- Admin-focused  

- Audit-safe  

- Consistent with NewFinity's admin theme  



---



# 2. Routing & Navigation



### Main Route:

`/admin/users`



### Subroutes:

- `/admin/users/:id` → User Profile Overview  

- `/admin/users/:id/submissions`  

- `/admin/users/:id/activity`  

- `/admin/users/:id/wallet` (read-only)  

- `/admin/users/:id/settings`  

- `/admin/users/suspended` → Suspended Users  

- `/admin/users/roles` → Role Management (future)  



---



# 3. User List Page



### Page Header:

- Title: **"Users"**  

- Optional stats: total users, new users this week  



### Table Columns:

- Name  

- Email  

- Subscription Tier (Free / Pro / Enterprise)  

- Role (User / Admin)  

- Account Status (Active / Suspended)  

- Created Date  

- Last Login  

- Actions  



### Filters:

- Subscription Tier  

- Account Status  

- Role  

- Creation Date  

- Country (optional future)  



### Search:

- Full-text across name, email, ID  



### Row Actions:

- View Profile  

- Suspend  

- Delete  

- Edit  

- Change Subscription  



---



# 4. Admin User Profile Page



Route:

`/admin/users/:id`



Page Sections:



| User Summary Card |

| Account Settings |

| Subscription Panel |

| User Activity Logs |

| Submissions Overview |

| Wallet Overview (read-only) |

yaml

Copy code



---



## 4.1 User Summary Card



Displays:

- Profile image  

- Name  

- Email  

- Role  

- Subscription tier  

- Account status  

- Joined date  

- Last login  



Actions:

- Change role  

- Suspend / activate user  

- Reset password  

- Open user's wallet  

- Delete account (danger zone)  



---



## 4.2 Account Settings Panel



Fields:

- Full name  

- Email  

- Country  

- Bio  

- Display name (future)  

- Account status  



Actions:

- Save Changes  

- Revert Changes  



---



# 5. Subscription Management



Admins may:

- Upgrade subscription  

- Downgrade subscription  

- Assign trial access  

- Extend expiration  

- Revoke subscription  



Fields:

- Subscription tier  

- Expiration date  

- Billing cycle (future)  

- Notes for audit logs  



UI:

- Dropdown for tier  

- Date picker  

- "Apply Change" button  



Safety:

- Confirmation modal required  

- Logged in audit log  



---



# 6. Role Management



Admin can change user roles:

- User  

- Moderator (future)  

- Admin  



Rules:

- Admin cannot demote themselves  

- Only Super Admin (future) can create new admins  



UI:

- Dropdown  

- "Confirm Role Change" modal  



---



# 7. Suspension & Ban Tools



Options:

- **Suspend account**  

- **Reinstate account**  

- **Ban permanently** (future)  



Fields:

- Reason for suspension  

- Duration (temporary bans)  



UI:

- Red accent colors  

- Warning modal  

- Required confirmation checkbox  



Suspended account behavior:

- User cannot log in  

- User cannot interact with platform  

- Admin can still view their profile  



---



# 8. User Activity Page



Displays logs of:

- Login attempts  

- Password updates  

- Notifications  

- Submission actions  

- Challenge participation  

- Wallet sync events  



Columns:

- Type  

- Timestamp  

- Action detail  

- Metadata (expandable)  



---



# 9. Submissions Overview Page



Lists submissions by user.



Columns:

- Submission ID  

- Challenge  

- Status  

- Timestamp  

- Actions (View submission)  



---



# 10. Wallet Overview Page (Read-Only)



Admin sees:

- Total OGC balance  

- On-chain vs off-chain breakdown  

- Recent transactions  

- Reward history  

- Wallet sync issues  



Admin cannot:

- Modify wallet balance directly  

(except through reward manager in challenges)



---



# 11. Danger Zone



Contains the most destructive actions:



### Actions:

- Reset password  

- Force logout  

- Delete account  

- Purge user data (future)  



### Delete Account:

Requires:

1. Warning modal  

2. "Type DELETE" input  

3. Confirmation checkbox  

4. Audit-log recording  



Delete action removes:

- User profile  

- Submissions  

- Notifications  

- Wallet data (except immutable history)  



---



# 12. Empty & Error States



### Empty user list:

> "No users found."



### No submissions:

> "This user has no submissions."



### Suspension view empty:

> "No suspended users."



### Error state:

> "Something went wrong. Try again."  



---



# 13. Visual Styling (Admin Theme)



### Style:

- Clean  

- Minimal neon  

- High-density tables  

- Subtle teal accents  

- Strong dividers  

- Red for destructive actions  



### Components:

- Admin tables  

- Tab navigation  

- Cards  

- Form inputs  

- Confirmation modals  



---



# 14. Responsive Behavior



### Desktop:

- Full functionality  

- Multi-column tables  



### Tablet:

- Horizontal table scroll  

- Sidebar collapsed  



### Mobile:

- Read-only view of limited profile data  

(Admin actions disabled on mobile)  



---



# 15. Future Enhancements



- Advanced user analytics  

- Risk scoring  

- Automated moderation suggestions  

- Bulk actions  

- User segmentation & filtering  

- AI-powered fraud flagging  



---



# 16. Conclusion



This document defines the complete Admin User Management UI system.  

It ensures consistent, secure, and future-proof handling of user accounts across the OGC NewFinity ecosystem.

