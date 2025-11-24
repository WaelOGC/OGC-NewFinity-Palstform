# OGC NewFinity — Backend Submission Processing Engine Specification (v1.0)



## 1. Introduction

This document defines the full backend logic, validation rules, workflows, and review processes for the **Submission Processing Engine** in the OGC NewFinity platform.



The engine manages:

- Submission intake  

- File validation  

- Metadata validation  

- Linking to challenges & tracks  

- Review workflow  

- Status transitions  

- Notifications  

- Reward triggers (integration only)  

- Moderation tools  



Submissions are one of the core pillars of the NewFinity ecosystem.



---



# 2. Submission Lifecycle



A submission progresses through the following states:



| State | Description |

|-------|-------------|

| **pending** | New submission awaiting validation |

| **validated** | Successfully validated, waiting for review |

| **rejected** | Validation failed or manually rejected |

| **underReview** | Admin/judge reviewing entry |

| **approved** | Accepted; may trigger rewards |

| **archived** | Permanently closed; read-only |



### Valid transitions:

pending → validated → underReview → approved → archived

pending → rejected → archived

validated → rejected → archived

underReview → rejected → archived



yaml

Copy code



Invalid transitions produce:

error.code = "INVALID_SUBMISSION_STATE"



yaml

Copy code



---



# 3. Submission Intake Logic



### Endpoint:

POST /api/v1/submissions



markdown

Copy code



### Required fields:

- challengeId  

- trackId (optional)  

- file(s) OR content  

- metadata JSON  



### Backend must:

- Ensure challenge is in `open` state  

- Validate user eligibility  

- Enforce submission limits  

- Validate file types  

- Validate file size  

- Store file in private bucket  

- Create DB submission entry  

- Trigger notification  

- Log event  



If submission window is closed:

error.code = "SUBMISSION_DEADLINE_PASSED"



yaml

Copy code



---



# 4. File Validation Rules



Accepted types:

- Images: jpg, jpeg, png, webp  

- Documents: pdf  

- Archives: zip  

- Videos: mp4 (limited support)



Rejected types:

- Executable formats  

- Scripts  

- Unsafe files  



Additional checks:

- Max file size depends on type  

- MIME type verification  

- File name sanitization  

- Storage path generation  



---



# 5. Metadata Validation



Metadata must be:

- JSON format  

- Schema-validated  

- Contextual to challenge category  

- Free of unsupported characters  

- Within size limits  



If metadata schema fails:

error.code = "METADATA_INVALID"



yaml

Copy code



---



# 6. Submission Record Structure



Required fields:

- id  

- userId  

- challengeId  

- trackId  

- status  

- fileId or fileIds  

- metadata (JSONB)  

- reviewComments (JSONB)  

- score (future)  

- createdAt  

- updatedAt  



Optional:

- autoValidation logs  



---



# 7. Auto-Validation Pipeline



Before human review, backend performs:



### 1. File validation  

### 2. Metadata schema validation  

### 3. Challenge rule validation  

### 4. Duplicate prevention  

### 5. Eligibility checks  



If auto-validation fails:

- Submission marked `rejected`

- Reason stored in logs

- User receives notification



Auto-validation must be fast (< 1 second avg).



---



# 8. Review Workflow Logic



### States involved:

- validated  

- underReview  

- approved  

- rejected  



### Review Flow:

1. Admin/judge loads submission  

2. Reviewer can:

   - Approve  

   - Reject  

   - Leave comments  

   - Flag (future)  

3. Action must be logged  

4. User notified of decision  



### Restrictions:

- Reviewer must have challenge permissions  

- Reviewer cannot approve own submission  



---



# 9. Approval Logic



When submission is **approved**:

- Trigger event: `submission.approved`

- Notify user  

- Notify challenge engine  

- Trigger reward issuance event (Wallet module)  

- Mark submission as locked  



Backend does NOT issue tokens directly.



---



# 10. Rejection Logic



Submission may be rejected due to:

- Invalid content  

- Rule violations  

- Incomplete metadata  

- Quality issues  

- Admin judgment  



Backend logs:

- Rejection reason  

- Reviewer ID  

- Timestamp  



User receives notification.



---



# 11. Admin Moderation Tools



Admins may:

- View all submissions  

- Filter by state, challenge, user  

- Sort by date, status  

- Bulk approve/reject (future)  

- Add internal comments  

- Review flagged submissions  

- Force change status (restricted)  

- Remove submission (restricted, soft-delete)



Soft-deletion recommended:

- Preserve audit trail  



---



# 12. Submission Limits & Enforcement



Backend enforces:

- Max submissions per challenge  

- Max submissions per track  

- Max submissions per user  

- "One submission only" mode  



If user exceeds limit:

error.code = "SUBMISSION_LIMIT_REACHED"



yaml

Copy code



---



# 13. Notification Integration



The Submission Engine triggers events consumed by the Notification Engine:



### On Submission:

- `submission.received`

- `submission.validated`

- `submission.rejected.auto`



### On Review:

- `submission.reviewStarted`

- `submission.approved`

- `submission.rejected`



These produce:

- In-app notifications  

- Emails (if configured)  



---



# 14. Event Emission



Events must include:

- submissionId  

- challengeId  

- userId  

- timestamp  

- state change  

- reviewerId (if applicable)  



Events consumed by:

- Challenge Engine  

- Wallet Engine (for rewards)  

- Notification Engine  

- Admin Logs  



---



# 15. Audit Logging Requirements



All actions must be logged:

- Submission upload  

- File validation failure  

- Auto-validation failure  

- Review actions  

- Status changes  

- Manual overrides  



Logs contain:

- Actor  

- IP  

- Before/after snapshot  

- Timestamp  



---



# 16. Error Codes



| Code | Meaning |

|------|---------|

| CHALLENGE_NOT_OPEN | Challenge not accepting submissions |

| SUBMISSION_LIMIT_REACHED | User exceeded max allowed submissions |

| METADATA_INVALID | Metadata schema failed |

| UNSUPPORTED_FILE_TYPE | Not allowed file format |

| FILE_TOO_LARGE | Exceeded maximum size |

| INVALID_SUBMISSION_STATE | Wrong state transition |

| SUBMISSION_NOT_FOUND | Invalid ID |

| REVIEW_NOT_ALLOWED | Reviewer lacks permission |



---



# 17. Performance Requirements



- Submissions list endpoint must handle 10k+ entries  

- Must support pagination  

- DB indexing on:

  - challengeId  

  - status  

  - createdAt  



- Submission upload pipeline must be non-blocking  

- Auto-validation must be < 1s  



---



# 18. Future Enhancements



- Scoring engine  

- AI-based validation  

- Automated plagiarism detection  

- Multi-file submissions  

- Team submissions  

- Submission versioning  

- Reviewer assignment automation  



---



# 19. Conclusion



This specification defines the complete backend Submission Processing Engine for OGC NewFinity.  

It ensures a secure, scalable, and fair submission workflow for all participants.

