# OGC NewFinity — Submissions UI Specification (v1.0)



## 1. Introduction

This document defines the full UI/UX specification for the **Submissions** section of the OGC NewFinity platform.



The Submissions interface enables users to:

- Create a submission  

- Upload files / type content  

- View submission status  

- Read review outcomes  

- Edit/update submissions (if allowed)  

- View previously approved entries  

- Explore public submission pages (future gallery)  



This UI is tightly linked to the Challenge Hub and must integrate smoothly with challenge rules, deadlines, and statuses.



---



## 2. High-Level UX Objectives



The Submissions interface must be:

- Clear  

- User-friendly  

- Motivational  

- Consistent across all challenges  

- Mobile-friendly  

- Secure (restricting edit access post-deadline)  

- Transparent with status & review outcomes  



---



## 3. Submissions Page Structure



The Submissions system uses the standard platform layout:



| TOPBAR |

| SIDEBAR | MAIN CONTENT |

markdown

Copy code



The main content includes:



1. User Submissions List  

2. Submission Status Indicators  

3. "Submit New Entry" Workflow  

4. Detailed Submission View  

5. Reviewer Feedback  

6. File Upload UI  

7. Public Submission View (for approved entries)  



---



# 4. Submissions List Page



### URL:

`/submissions`



### Page Header:

- Title: **"Your Submissions"**

- Subtitle: optional  

- Action button: "Submit New Entry"  



### List Layout:

Each submission appears as a **Submission Card** with:

- Challenge title  

- Category  

- Status pill  

- Submission date  

- Review status (pending/approved/rejected)  

- View button  



### Card Status Colors:

- **Pending Review** → yellow  

- **Approved** → neon teal  

- **Rejected** → neon pink/red  

- **Draft (Not Submitted)** → grey  



### Hover Effects:

- Soft glow  

- Lift animation  



---



## 5. Submission Status States



### **5.1 Not Submitted**

User has not submitted for this challenge.



Display:

- "You haven't submitted an entry yet."

- Button: "Submit Your Entry"



### **5.2 Pending Review**

Displayed after user submits.



Shows:

- Summary of submission  

- Timestamp  

- "Pending Review" status  

- Info: "Your submission is being reviewed."



### **5.3 Approved**

Shows:

- Approval message  

- Public submission link (future)  

- Tokens earned (if applicable)  



### **5.4 Rejected**

Shows:

- Rejection message  

- Reason from admin  

- Option to resubmit **only if allowed and challenge still open**



---



# 6. Submit Entry Workflow



Submission workflow is a **multi-step form** depending on challenge rules.



### Basic Flow:

Step 1 → Select Challenge

Step 2 → Fill Submission Details

Step 3 → Upload File(s) or Enter Text

Step 4 → Review & Submit



yaml

Copy code



### Detailed UI:



## 6.1 Step 1 — Select Challenge

Displays available challenges that accept submissions.



Grid layout:

- Challenge name  

- Category  

- Deadline  

- "Start Submission" button  



If accessed from a challenge detail page:

- Skip this step  

- Proceed directly to Step 2  



---



## 6.2 Step 2 — Submission Details Form



Fields depend on challenge type:



Common fields:

- Title  

- Description (Textarea)  

- Category (auto-filled)  

- Track (auto-filled)  



Validation:

- Title required  

- Description required  



---



## 6.3 Step 3 — Upload or Text Entry



Submission content can be:

- File Upload (images, PDF, video, ZIP depending on challenge rules)  

- Text Entry (long-form content)  

- Mixed content (future)  



### File Upload UI:

- Drag-and-drop zone  

- Accepted file types shown  

- Neon border + glow on hover  

- File preview  

- Remove/replace option  

- Max file size indicator  



### Text Entry UI:

- Large textarea editor  

- Word count  

- Formatting hints  

- Autosave (future)  



---



## 6.4 Step 4 — Review & Submit



Displays:

- Summary of all fields  

- Filename(s)  

- Description preview  



User actions:

- "Submit Entry" (primary)  

- "Back to Edit"  



After submission:

- Success screen  

- Status = Pending Review  



---



# 7. Detailed Submission View



Users can open a submission to view all details.



### Elements:

- Challenge name  

- Category  

- Status  

- Submission timestamp  

- File or text preview  

- Reviewer decision  

- Rejection reason (if applicable)  

- "Edit" button (only if allowed)  



---



# 8. Public Submission Viewer (Future)



Approved submissions can be made public.



### Public View Must Include:

- Submission title  

- User name (or display alias)  

- Challenge  

- File preview  

- Text content  

- Date submitted  

- Shares: "Share Link" button  



### Admin decides:

- Visibility  

- Review content  

- Public metadata  



---



# 9. Error & Empty States



### No Submissions:

"You haven't submitted any entries yet."



### Submission Deadline Passed:

"This challenge is no longer accepting submissions."



### Invalid File Format:

"File type not allowed."



### Upload Failed:

"We couldn't upload your file. Try again."



### Large File:

"File exceeds the maximum size limit."



---



# 10. Responsive Behavior



### Desktop:

- Multi-column layout  

- File upload previews large  

- Submission list shows full metadata  



### Tablet:

- 2-column submission grid  

- File previews medium size  



### Mobile:

- Single column  

- Steps collapse into vertical wizard  

- File upload full-width  

- Text editor optimized for touch  



---



# 11. Visual Styling



### Overall:

- Dark mode  

- Transparent card backgrounds  

- Neon accent colors  

- Clean typography  



### Status Pills:

- Approved → teal  

- Pending → gold  

- Rejected → neon pink/red  

- Draft → grey  



### Buttons:

- Strong neon CTA for submission  



---



# 12. Future Enhancements



- Version history  

- Draft autosave  

- "Edit after submit" with revision tracking  

- Multi-file structured submissions  

- Submission gallery view  

- Voting interface (if community voting added)  

- AI-assisted submission builder (Amy integration)  



---



# 13. Conclusion



This document defines the official UI/UX patterns for the Submissions system within OGC NewFinity.  

It ensures clarity, consistency, and accessibility for one of the platform's most important user-facing features.

