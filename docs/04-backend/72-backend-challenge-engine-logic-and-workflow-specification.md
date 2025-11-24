# OGC NewFinity — Backend Challenge Engine Logic & Workflow Specification (v1.0)



## 1. Introduction

This document defines the complete backend logic, workflows, rules, and system behaviors for the **Challenge Engine** powering the NewFinity ecosystem.



The Challenge Engine governs:

- Challenge creation  

- Challenge lifecycle  

- Tracks & categories  

- Participant management  

- Submission gating  

- Deadlines & reminders  

- Reward logic (integration only, not distribution)  

- Admin workflow  



This is the authoritative backend blueprint for challenge functionality.



---



# 2. Challenge Architecture Overview



A challenge consists of:

- Metadata (title, description, category)  

- Timeline (start → deadline → review → closure)  

- Tracks (optional)  

- Participation rules  

- Submission rules  

- Reward rules  

- Admin ownership  

- System notifications  



---



# 3. Challenge Lifecycle States



Challenges move through defined states:



| State | Meaning |

|-------|---------|

| **draft** | Created by admin, not public |

| **published** | Visible and open for participation |

| **open** | Actively receiving submissions |

| **closed** | Submission deadline passed |

| **review** | Judges/admins reviewing entries |

| **completed** | Winners finalized, rewards triggered |

| **archived** | Hidden, preserved for records |



Backend must enforce allowed transitions:



draft → published → open → closed → review → completed → archived



sql

Copy code



Illegal transitions must trigger:

error.code = "INVALID_CHALLENGE_STATE"



yaml

Copy code



---



# 4. Challenge Creation Logic



### Endpoint:

POST /api/v1/admin/challenges



yaml

Copy code



Required fields:

- title  

- description  

- category  

- startAt  

- deadlineAt  

- tracks (optional)  

- eligibility rules  

- visibility (public/private)  



Backend validations:

- deadline must be after start  

- title max length  

- category must exist  

- admin must have permissions  



---



# 5. Challenge Publishing Rules



When a challenge is moved from `draft` → `published`, backend must:



### Validate:

- Required fields present  

- Timeline valid  

- Minimum content included  



### Trigger:

- Email notifications to subscribers (optional)  

- In-app announcement  

- Activity log entry  

- Challenge published event  



---



# 6. Opening Challenge for Submissions



When the challenge reaches `startAt`:

- System automatically transitions to `open`

- Users may submit entries

- Submissions must validate challenge rules



If startAt is changed manually:

- System recalculates schedule



---



# 7. Deadline Handling Logic



At `deadlineAt`:

- Backend transitions to `closed`

- Submission endpoint is disabled

- Late submissions rejected:

error.code = "SUBMISSION_DEADLINE_PASSED"



yaml

Copy code



### Reminder Logic:

Backend automatically sends:

- 24-hour reminder  

- 1-hour reminder  

- Final 10-minute reminder (optional)



---



# 8. Review Phase Workflow



When challenge enters `review`:



### System actions:

- Lock all submissions  

- Admins/judges gain review access  

- Reviewer assignment (future)  

- Scoring system loading (future)  



Reviewers may:

- Approve  

- Reject  

- Flag  

- Comment  



All actions logged.



---



# 9. Completion Logic



When challenge is marked **completed**:

- Winners are finalized  

- Reward events are triggered for Wallet module  

- Notifications dispatched  

- Challenge becomes read-only  



### Reward Trigger:

Challenge Engine ONLY triggers events:

wallet.rewardIssued



yaml

Copy code

Reward calculation is managed by Wallet Module.



---



# 10. Tracks & Categories



### Categories:

- Defined in static config (admin can extend)

- Used for filtering, analytics, UI grouping



### Tracks:

- Optional  

- Sub-competitions inside a challenge  

- Can have separate winners  



Backend responsibilities:

- Track validation  

- Track assignment per submission  



---



# 11. Participation Rules



Backend must enforce participation constraints:



Examples:

- Subscription tier required  

- Max submissions per user  

- Duplicate prevention  

- Banned user restrictions  

- Region restrictions (future)  



Errors:

error.code = "NOT_ELIGIBLE"



yaml

Copy code



---



# 12. Submission Gating



Submission is allowed only when:

- Challenge is `open`  

- User meets eligibility  

- User has not exceeded allowed submissions  

- File type matches rules  



If challenge requires mandatory metadata, backend must enforce schema.



---



# 13. Admin Tools & Workflow



Admins may:

- Edit draft challenge  

- Publish challenge  

- Adjust timelines  

- View participants  

- Disable challenge  

- Force close challenge  

- Extend deadlines  

- Send announcements  

- View analytics (future)



Restricted actions require:

- Admin role  

- Confirmation  

- Audit log entry  



---



# 14. Notification Integration



Backend triggers:



### When published:

- `challenge.published`



### Before deadline:

- `challenge.deadlineReminder`



### When closed:

- `submission.windowClosed`



### When winners selected:

- `challenge.completed`



Notification Engine handles delivery.



---



# 15. Event Emission



Challenge Engine emits structured events:



{

event: "challenge.published",

challengeId: "...",

timestamp: "..."

}



yaml

Copy code



Events consumed by:

- Notification Engine  

- Wallet Engine  

- Admin Logs  

- Analytics (future)  



---



# 16. Audit Logging Requirements



Every admin action is logged:

- Create challenge  

- Edit challenge  

- Publish  

- Close  

- Review operations  

- Finalization  

- Reward issuance trigger  



Logs include:

- Admin ID  

- Before/after JSON  

- IP address  



---



# 17. Error Codes



| Code | Meaning |

|------|---------|

| INVALID_CHALLENGE_STATE | Invalid lifecycle transition |

| DEADLINE_INVALID | Invalid timeline |

| NOT_ELIGIBLE | User not allowed to participate |

| SUBMISSION_DEADLINE_PASSED | Too late to submit |

| TRACK_INVALID | Track does not exist |

| CHALLENGE_NOT_FOUND | Invalid challenge ID |

| ACTION_NOT_ALLOWED | Permission denied |



---



# 18. Performance Requirements



- Submission reads must be fast  

- Challenge list endpoints must support:

  - Pagination  

  - Filtering  

  - Search  

  - Caching (future)  

- Review phase queries optimized  

- Large challenges (10k+ participants) must remain stable  



---



# 19. Future Enhancements



- Judge dashboard  

- Scoring engine  

- AI-assisted review  

- Automated qualification checks  

- Multi-round challenge structure  

- Team-based challenges  

- Jury panel system  

- Audit-grade challenge certificates  



---



# 20. Conclusion



This document defines the complete backend logic powering challenges in OGC NewFinity.  

It ensures reliability, fairness, automation, and future-ready extensibility.

