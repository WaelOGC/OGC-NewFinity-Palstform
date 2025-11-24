# OGC NewFinity — Admin Submission Review System UI Specification (v1.0)



## 1. Introduction

This document defines the full admin-side **Submission Review System**, used by administrators to evaluate, approve, reject, comment on, and manage user submissions across all OGC NewFinity challenges.



The review system must be:

- Fast  

- Accurate  

- Clean  

- Safe for irreversible actions  

- Optimized for high-volume moderation  

- Fully auditable  



This specification is mission-critical, as it governs how every submission enters the ecosystem.



---



# 2. Core Review System Features



Admin reviewers must be able to:

- View submission content  

- Preview uploaded files (image, PDF, video)  

- Review submission metadata  

- Assign status (Approved / Rejected / Pending)  

- Provide rejection reason  

- Add internal notes  

- Assign rewards (if applicable)  

- Flag suspicious submissions  

- View submission history  

- Navigate between pending submissions quickly  



---



# 3. Navigation & Routing



### Main Route:

`/admin/review`



### Subroutes:

- `/admin/review` → Review Queue  

- `/admin/review/:submissionId` → Submission Review Page  

- `/admin/review/history` → Review History  

- `/admin/review/flags` → Flagged Items  



---



# 4. Review Queue Page



This page lists all submissions that require review.



### Header:

- Title: **"Review Queue"**  

- Filter bar  

- Search bar  



### Table Columns:

- Submission ID  

- User name  

- Challenge title  

- Status  

- Timestamp  

- Actions (Review button)  



### Filters:

- Status (Pending / Approved / Rejected)  

- Challenge  

- User  

- Date range  



### Search:

- Full-text search across users + titles  



### Row Action:

- **Review** → opens detailed review screen  



---



# 5. Submission Review Page



A two-panel layout:



| SUBMISSION CONTENT (Left) |

| REVIEW PANEL (Right) |

yaml

Copy code



---



## 5.1 Left Panel — Submission Content Viewer



Must support viewing:

- Text submissions  

- Images (PNG/JPG)  

- PDFs (inline viewer)  

- Videos (embedded player)  

- ZIP downloads (no preview)  



### UI Requirements:

- Large preview area  

- Scrollable content  

- Metadata section (below or beside)  



### Metadata Includes:

- Submission ID  

- User info  

- Challenge name  

- Timestamp  

- File type / size  

- Submission version (future)  



---



## 5.2 Right Panel — Review Panel



### Contains:

- Status selector (radio buttons or segmented control):

  - Approved  

  - Rejected  

  - Pending  



### Rejection Fields:

- Rejection reason (textarea)  

- Quick-reason presets (optional future)  



### Internal Notes:

- Notes field for admins only  

- Not visible to user  



### Reward Assignment (Optional for challenge):

- Token amount  

- Badge to assign  

- Additional points  



### Action Buttons:

- **Approve Submission** (primary)  

- **Reject Submission** (danger)  

- **Save as Pending**  

- **Flag for Audit**  



All actions require loading states and confirmation rules.



---



# 6. Flagging System



Admins can flag submissions for:

- Suspicious behavior  

- Copyright issues  

- Inappropriate content  

- Duplicate content  

- Technical validation issues  



### UI:

- "Flag for Audit" button  

- Required selection of flag type  

- Optional comment  



### Flags Page:

`/admin/review/flags`



Columns:

- Submission ID  

- User  

- Flag type  

- Reviewer  

- Status (Open / Resolved)  

- Actions  



---



# 7. Bulk Review Tools (Future)



To support large-scale operations:

- Select multiple submissions  

- Approve in bulk  

- Reject in bulk  

- Export reports  



Safety rules apply:

- Bulk rejection requires explicit confirmation  



---



# 8. Review History Page



Route:

`/admin/review/history`



### Table Columns:

- Submission ID  

- User  

- Challenge  

- Old status → new status  

- Reviewer  

- Timestamp  



Allows:

- Filtering  

- Exporting  

- Searching  



Users cannot see review history; admins only.



---



# 9. Safety & Confirmation Rules



### Approve:

- Immediate commit  

- Confirmation modal optional (configurable)  



### Reject:

- Requires message  

- Confirmation modal mandatory  



### Delete Submission (future):

- Requires double-confirmation  

- "Type DELETE to continue"  



### Flag:

- Requires reason selection  



---



# 10. Empty States



### No submissions to review:

> "You have no pending submissions."



### No flagged items:

> "No flagged submissions."



### No history:

> "No submissions have been reviewed yet."



All empty states must use the admin empty-state template.



---



# 11. Error Handling



### If content fails to load:

Display:

> "We couldn't load the submission preview."



Provide:

- Retry button  

- Download original file (if exists)  



### If action fails:

Show admin error banner:

> "Action failed. Please try again or check system logs."



---



# 12. Visual Styling (Admin Theme)



### Overall:

- Minimal neon  

- High-density layout  

- Strong spacing hierarchy  

- Clear dividers  

- Card-style review panel  



### Colors:

- White / light text  

- Dark background  

- Subtle neon teal for accents  

- Red neon for rejection actions  



### Buttons:

- Primary = Approve (teal)  

- Danger = Reject (red/pink neon)  

- Neutral = Pending  



---



# 13. Responsive Behavior



### Desktop:

- Full-feature review interface  

- Two-panel layout  



### Tablet:

- Stack panels vertically  

- Collapse metadata into tabs  



### Mobile:

- View-only mode (no admin actions)  



---



# 14. Future Enhancements



- AI-powered pre-screening  

- Duplicate submission detection  

- Plagiarism check integration  

- Auto-approve low-risk submissions  

- AI-based rejection reason suggestions  

- Admin keyboard shortcuts:

  - A → Approve  

  - R → Reject  

  - P → Pending  



---



# 15. Conclusion



This specification defines the **complete submission review workflow** for administrators in OGC NewFinity.  

All admin review tools must follow these UI/UX rules to ensure accuracy, safety, and efficiency at scale.

