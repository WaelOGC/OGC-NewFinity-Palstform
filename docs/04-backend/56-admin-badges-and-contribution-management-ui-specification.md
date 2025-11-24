# OGC NewFinity — Admin Badges & Contribution Management UI Specification (v1.0)



## 1. Introduction

This document defines the full UI/UX specification for the **Admin Badges & Contribution Management System** inside the OGC NewFinity Admin Panel.



Admin users must be able to:

- Create, update, and delete badges  

- Assign badges manually  

- View all user badges  

- Manage system-generated contributions  

- Correct or adjust contribution values  

- Review contribution logs  

- Audit reward-related activity  



Badges and contributions are central to the ecosystem's engagement model, reward incentives, and reputation scoring.  

The admin interface must therefore be precise, clear, and secure.



---



# 2. Routing & Navigation



### Main Routes:

- `/admin/badges`  

- `/admin/badges/create`  

- `/admin/badges/:id/edit`  

- `/admin/contributions`  

- `/admin/contributions/user/:userId`  



---



# 3. Badges Management Interface



## 3.1 Badges List Page



### Header:

- Title: **"Badges"**  

- CTA: **Create Badge**  



### Table Columns:

- Badge icon  

- Badge name  

- Category  

- Level (optional)  

- Visibility (Public / Hidden)  

- Assigned count  

- Created date  

- Actions  



### Filters:

- Category  

- Visibility  

- Level  

- Date range  



### Row Actions:

- Edit  

- Assign to user  

- Delete (requires confirmation)  



---



## 3.2 Create / Edit Badge Page



### Page Layout:

| Badge Details |

| Badge Icon & Visuals |

| Rules & Eligibility |

| Visibility Settings |

| Save / Update Buttons |

yaml

Copy code



### Fields:

- Badge name (required)  

- Category  

- Description (markdown-enabled)  

- Level (optional: bronze/silver/gold/etc.)  

- Icon upload  

- Auto-assignment conditions (future)  



### Visibility:

- Public (any user can see it)  

- Hidden (only admins see it)  



### Save Actions:

- Save  

- Save & Publish  



---



## 3.3 Badge Icon Upload Requirements



- PNG/SVG preferred  

- Max size: 1MB  

- Auto-resize preview  

- Crop UI (future)  



---



## 3.4 Badge Deletion



Deleting a badge requires:

- Confirmation modal  

- "Type DELETE" input  

- Audit log entry  

- Removal from all users  



---



# 4. Manual Badge Assignment



Admin can assign badges manually to users.



### Route:

`/admin/badges/assign`



### Modal Fields:

- User  

- Badge  

- Reason  

- Notes  



### Actions:

- Assign Badge  

- Cancel  



Upon success:

- Notification displayed  

- Entry logged in audit trail  



---



# 5. Contributions Management



This system tracks all user participation events across the platform.



Examples:

- Submission points  

- Challenge participation  

- Approved contributions  

- Admin manual adjustments  

- System auto-generated events  



---



## 5.1 Contributions List Page



### Table Columns:

- Contribution ID  

- User  

- Type (Submission / Reward / Mining / Manual / System)  

- Points / Token value  

- Related challenge or entity  

- Timestamp  

- System-generated (Yes/No)  

- Actions  



### Filters:

- Contribution type  

- Date  

- User  

- Points range  

- System vs manual  



### Row Actions:

- View details  

- Adjust contribution  

- Flag contribution  



---



# 5.2 Contribution Details Modal



Shows:

- User info  

- Contribution type  

- Points or token value  

- Associated challenge  

- Submission ID  

- Description  

- Metadata  

- Audit logs  



### Actions:

- Make adjustment  

- Add admin note  

- Flag as suspicious  



---



# 6. Manual Contribution Adjustment



Used to correct mistakes or special cases.



### Form Fields:

- User  

- Adjustment amount (positive or negative)  

- Type:

  - Correction  

  - Bonus  

  - Penalty  

  - Reversal  

- Reason  

- Admin internal note  



### Safety:

- "This action is irreversible" warning  

- Required checkbox  

- Audit log entry  



---



# 7. User Contribution History Page



Route:

`/admin/contributions/user/:userId`



### Page Sections:

- User Summary Card  

- Contribution History Table  

- Graph (future)  

- Total contributions  

- Recent badges earned  



### Table Columns:

- Contribution ID  

- Type  

- Value  

- Timestamp  

- Related Challenge  

- Notes  



---



# 8. Flags & Suspicious Activity



Admins can flag:

- Fake contributions  

- Duplicate rewards  

- Repeated exploitation patterns  

- Abnormal contribution spikes  

- Algorithmic farming (future)  



### Flags Table:

- Contribution ID  

- User  

- Reason  

- Reviewed by  

- Status (Open/Resolved)  



### Actions:

- Resolve flag  

- Add note  

- Adjust contribution  



---



# 9. Error & Empty States



### Empty:

- "No badges created yet."  

- "No contributions found."  

- "No entries match your filters."  



### Error:

> "Unable to load badge or contribution data."



Admin should see "Retry" button for all major errors.



---



# 10. Visual Styling (Admin Theme)



### Style:

- Dark admin palette  

- Sharp separators  

- High-density table layout  

- Minimal neon, only for accents  

- Red for destructive actions  

- Teal for positive / confirm actions  



### Badge Icons:

- Displayed in high resolution  

- Neon outline glow on hover (subtle)  



### Contribution Values:

- Positive = teal  

- Negative = neon pink/red  



---



# 11. Responsive Behavior



### Desktop:

Full functionality with multi-column views.



### Tablet:

Scrollable tables, collapsed filters.



### Mobile:

Read-only view (admin actions disabled).



---



# 12. Future Enhancements



- Auto-assigned badges based on rules  

- AI-driven badge suggestions  

- Contribution analytics dashboard  

- Badge categories + sorting enhancements  

- Bulk badge assignment  

- Gamified achievement system  

- Public badge gallery  



---



# 13. Conclusion



This specification defines the complete Admin Badges & Contribution Management system UI.  

It ensures clarity, auditability, and precision across all engagement and reward operations within the OGC NewFinity ecosystem.

