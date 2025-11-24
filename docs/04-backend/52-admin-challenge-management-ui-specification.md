# OGC NewFinity — Admin Challenge Management UI Specification (v1.0)



## 1. Introduction

This document defines the complete UI/UX for the **Admin Challenge Management System** within the OGC NewFinity Admin Panel.



Admin Challenge Management enables administrators to:

- Create new challenges  

- Edit existing challenges  

- Manage challenge lifecycle  

- Configure timelines  

- Define reward structures  

- Review participants  

- Manage submissions  

- Publish / unpublish / archive challenges  

- Audit challenge activity  



The UI must be powerful, clean, and optimized for operational speed.



---



# 2. Navigation & Routing



### Main Route:

`/admin/challenges`



### Subroutes:

- `/admin/challenges` → Challenge List  

- `/admin/challenges/create` → Create Challenge  

- `/admin/challenges/:id` → Challenge Dashboard  

- `/admin/challenges/:id/edit` → Challenge Editor  

- `/admin/challenges/:id/participants`  

- `/admin/challenges/:id/submissions`  

- `/admin/challenges/:id/timeline`  

- `/admin/challenges/:id/rewards`  



---



# 3. Challenge List Page



### Page Header:

- Title: **"Challenges"**  

- CTA button: **New Challenge** (neon accent)  



### Table Columns:

- Title  

- Category  

- Track  

- Status (Draft / Published / Closed / Archived)  

- Deadline  

- Submissions Count  

- Created At  

- Actions  



### Actions:

- View  

- Edit  

- Duplicate (copy challenge with same settings)  

- Publish / Unpublish  

- Archive  

- Delete  



### Filters:

- Category  

- Status  

- Track (Group / Student / Freelancer etc.)  

- Date range  



### Search:

- Searches title, category, description  



---



# 4. Create Challenge Page



### Page Layout:

| Challenge Information |

| Requirements & Rules |

| Timeline |

| Rewards & Scoring |

| Visibility & Settings |

| Save / Publish Buttons |

yaml

Copy code



---



## 4.1 Challenge Information Section



Fields:

- Title  

- Category  

- Track  

- Short description (max 150 characters)  

- Full description (markdown-enabled editor)  

- Challenge banner image  



Validation:

- Title required  

- Category required  

- Description required  

- Banner optional  



---



## 4.2 Requirements & Rules



Fields:

- Submission format  

- Allowed file types  

- Word count limits (if text)  

- Special restrictions  

- Eligibility requirements  



UI:

- Multi-field form  

- Add/remove rows dynamically  



---



## 4.3 Timeline Configuration



Timeline milestones:

- Challenge opens  

- Submission window  

- Review period  

- Winner announcement  



UI:

- Date pickers  

- Drag timeline bars (future enhancement)  

- Auto-validation:

  - Submission end > submission start  

  - Review start >= submission end  



---



## 4.4 Rewards & Scoring



Fields:

- Reward type (OGC tokens, points, recognition)  

- Amount  

- Multi-winner configuration  

- Optional scoring criteria  

- Judge panel management (future)  



UI:

- Dynamic reward tiers  

- Add/remove winners  

- Preview total reward amount  



---



## 4.5 Visibility & Settings



Options:

- Challenge Status (Draft / Published / Closed)  

- Allow multiple submissions per user  

- Allow submission editing before deadline  

- Auto-approve simple submissions (off by default)  



---



## 4.6 Actions



Buttons:

- **Save Draft**  

- **Publish Challenge**  

- **Preview Challenge**  

- **Cancel**  



Publish requires:

- All required fields completed  

- Timeline valid  



---



# 5. Challenge Dashboard (Admin View)



Route:

`/admin/challenges/:id`



Shows high-level overview.



### Sections:

- Challenge summary card  

- Status & timeline  

- Key metrics:

  - Participants  

  - Submissions  

  - Approved  

  - Rejected  

  - Pending review  

- Quick actions:

  - Edit Challenge  

  - Manage Timeline  

  - Manage Rewards  

  - View Submissions  

  - Close Challenge  

  - Archive  



---



# 6. Participants Page



### Table Columns:

- User name  

- Email  

- Tier (User / Pro / Enterprise)  

- Submission status  

- Submission ID  

- Joined date  

- Actions  



Actions:

- View user  

- View submission  

- Disqualify (with reason)  



---



# 7. Challenge Submissions Page



Important for admin review workflows.



Columns:

- Submission ID  

- User  

- Timestamp  

- Status  

- Score (optional)  

- Actions  



### Row Actions:

- Review  

- Approve  

- Reject  

- Flag for audit  

- Add reward  



### Bulk Actions:

- Approve selected  

- Reject selected  

- Export reports  



---



# 8. Timeline Manager



UI to adjust or fix timelines after creation.



Fields:

- Start Date  

- End Date  

- Review Period  

- Announcement Date  



Validation:

- Cannot move dates backward if submissions exist (except admin override)  



---



# 9. Reward Manager



Admin defines reward distribution.



Fields:

- Winner ranking  

- Token amount  

- Badge assignment  

- Notes  



Actions:

- Update rewards  

- Revoke rewards (requires confirmation)  



---



# 10. Editing an Existing Challenge



Editing requires:

- Draft or Published state  

- If Closed or Archived → read-only  



Editable fields:

- Title  

- Description  

- Requirements  

- Timeline  

- Rewards  

- Settings  



Non-editable fields:

- Category (after publish)  

- Track (after publish)  



---



# 11. Archive, Close & Delete Rules



### Archive:

- Challenge hidden from users  

- Submissions remain stored  

- Read-only mode  



### Close:

- Stops accepting submissions  

- Review can continue  

- Winners can be assigned  



### Delete:

- Requires double-confirmation  

- Deletes all submissions  

- Deletes rewards  

- Logged in audit log  



---



# 12. Error & Warning States



### Examples:

- "Timeline overlaps detected."  

- "You cannot modify this field after publishing."  

- "This challenge has active submissions."  

- "Reward amount cannot be zero."  

- "This action is irreversible."  



Use standard admin error cards.



---



# 13. Visual Styling (Admin)



- Minimal glow  

- High-density layout  

- Neutral dark palette  

- Strong dividers  

- Clear table lines  

- Button hierarchy:

  - Primary (actions)

  - Secondary (navigation)

  - Destructive (red neon edge)  



---



# 14. Responsive Behavior



### Desktop:

- Full functionality  

- Multi-column views  



### Tablet:

- Collapsible sidebar  

- Tables scroll horizontally  



### Mobile:

- Read-only mode for most views  



---



# 15. Future Enhancements



- Judge panel management  

- AI-assisted review scoring  

- Automated reward distribution  

- Bulk challenge creation from templates  

- Admin analytics (system KPIs)  



---



# 16. Conclusion



This specification defines the full Admin Challenge Management UI and workflow system for OGC NewFinity.  

It ensures consistent, efficient, and safe handling of operational tasks by administrators.

