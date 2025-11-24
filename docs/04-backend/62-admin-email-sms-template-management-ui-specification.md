# OGC NewFinity — Admin Email/SMS Template Management UI Specification (v1.0)



## 1. Introduction

This document defines the complete **Admin Email & SMS Template Management UI** for OGC NewFinity.  

This module allows administrators to control all outbound communication templates sent by the platform, including:



- Authentication emails (verification, password reset)  

- Notification emails  

- Subscription-related emails  

- Challenge announcements  

- Reward notifications  

- Security alerts  

- SMS one-time codes (OTP)  

- Transaction alerts  

- System-wide broadcast templates  



This system must ensure templates are:

- Easy to manage  

- Versioned  

- Safe from accidental deletion  

- Reviewed before usage  

- Fully auditable  

- Styled consistently across the ecosystem  



---



# 2. Routing & Navigation



### Main Route:

`/admin/templates`



### Subroutes:

- `/admin/templates/email` → Email Templates  

- `/admin/templates/sms` → SMS Templates  

- `/admin/templates/email/:id` → Edit Email Template  

- `/admin/templates/sms/:id` → Edit SMS Template  

- `/admin/templates/history/:id` → Template Version History  



---



# 3. Templates Categories



Email and SMS templates are grouped into:



### Authentication  

- Verification email  

- Password reset  

- Email changed  

- Device login alert  



### Notifications  

- General notification  

- New challenge available  

- Submission status update  

- Reward received  



### Subscription  

- Plan upgrade  

- Plan downgrade  

- Payment failed (future)  

- Renewal reminders  



### Wallet (optional future)  

- Transaction updates  

- Reward distribution alerts  



### System  

- Downtime announcements  

- Security alerts  



All templates must appear under their relevant category.



---



# 4. Email Templates List Page



### Table Columns:

- Template name  

- Category  

- Status (Active / Disabled)  

- Last modified  

- Modified by  

- Actions  



### Actions:

- Edit  

- Duplicate  

- Preview  

- Disable/Enable  

- View history  



### Filters:

- Category  

- Status  

- Date range  



### Search:

- Template name  



---



# 5. SMS Templates List Page



Same structure, but SMS messages are:

- Shorter  

- Text-only  

- Often tied to OTP or alerts  



### Columns:

- Template  

- Category  

- Character count  

- Status  

- Last modified  

- Actions  



---



# 6. Template Editor (Email)



Route:

`/admin/templates/email/:id`



The editor must support:



## 6.1 Layout

| TEMPLATE INFO PANEL | RICH TEXT EDITOR |

| PREVIEW PANEL (LIVE PREVIEW) |

yaml

Copy code



---



## 6.2 Template Info Panel



Fields:

- Template name  

- Category  

- Description  

- Status (Active/Disabled)  

- Version number  

- Variables used in template  



### Variables:

Must support placeholders like:

{{user.name}}

{{user.email}}

{{challenge.title}}

{{submission.status}}

{{subscription.tier}}

{{verification.code}}

{{reset.link}}



yaml

Copy code



Admins must see **list of supported variables** automatically.



---



## 6.3 Email Body Editor



Editor features:

- Rich text formatting  

- Bold, italic, underline  

- Headings  

- Lists  

- Links  

- Code blocks  

- Button components  

- Image insertion  



### Template styling:

Must follow NewFinity email branding:

- Dark or light theme (auto-managed)  

- Neon accents  

- Rounded button style  

- High readability typography  



---



## 6.4 Live Preview Panel



- Renders exact final email output  

- Desktop and mobile toggle  

- Placeholder variables replaced with sample data  



Buttons:

- Preview Desktop  

- Preview Mobile  

- Full-screen preview  



---



# 7. Template Editor (SMS)



Route:

`/admin/templates/sms/:id`



### Fields:

- Template name  

- Category  

- Message (plain text)  

- Character count  

- Variables available  

- Status (Active/Disabled)  



### SMS-specific warnings:

- Character limit indicator  

- Unicode character warnings  

- Estimated number of SMS segments  



---



# 8. Version History



Route:

`/admin/templates/history/:id`



Version history table:

- Version number  

- Modified by  

- Timestamp  

- Summary of changes  

- "View version"  

- "Restore this version"  



### Version Viewer:

Shows:

- Before/after diff  

- Side-by-side compare  

- Variable list changes  



Restoring a version requires:

- Confirmation modal  

- Audit log entry  



---



# 9. Template Workflow Rules



### Create Template:

- Only admins  

- Must include required variables  

- Must be validated before activation  



### Edit Template:

- Requires version bump  

- Changes must be previewed  

- Email templates must have valid HTML  



### Disable Template:

- Safe action  

- Prevents template from being used  



### Delete Template:

- Only drafts can be deleted  

- Active templates cannot be deleted  

- All deletions are audited  



---



# 10. Safety & Validation Rules



### Prevent:

- Missing required variables  

- Invalid HTML  

- Broken email layout  

- SMS exceeding character limit  



### Show warnings for:

- Possible spam triggers  

- Images missing alt text  

- Hard-coded personal data  



---



# 11. Audit Logging



Every action must be logged:

- Template created  

- Template edited  

- Version restored  

- Template disabled  

- Template re-enabled  

- SMS template changed  

- Critical variables removed or added  



Audit entries include:

- Admin name  

- IP address  

- Timestamp  

- Old → new values  

- Template ID  



---



# 12. Empty & Error States



### Empty:

> "No templates created yet."



> "No versions available."



### Error:

> "Unable to load template data."



Retry button included.



---



# 13. Visual Styling (Admin Theme)



### Aesthetic:

- Dark admin style  

- Minimal glow  

- Sharp UI elements  

- Strong borders  

- Clean form fields  

- Neon teal accents  



### Preview:

- Uses official email rendering pipeline  

- Matches Notification Center visual language  



---



# 14. Responsive Behavior



### Desktop:

Full editor + preview.



### Tablet:

Stacked editor and preview.



### Mobile:

Read-only preview.



---



# 15. Future Enhancements



- Template categories with icons  

- AI-assisted template generation  

- Multi-language templates  

- Drag-and-drop email layout builder  

- Snippets/components library  

- A/B testing  

- Automatic rendering tests across email clients  



---



# 16. Conclusion



This specification defines the complete Email & SMS Template Management UI for the OGC NewFinity Admin Panel.  

It ensures consistent communication, safe editing, full auditing, and brand-aligned messaging across the ecosystem.

