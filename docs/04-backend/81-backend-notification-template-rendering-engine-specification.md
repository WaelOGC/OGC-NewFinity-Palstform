# OGC NewFinity — Backend Notification Template Rendering Engine Specification (v1.0)



## 1. Introduction

This document defines the backend architecture, rendering logic, templating rules, variable handling, and delivery preparation workflow for the **Notification Template Rendering Engine**, which powers all email and SMS content generation for the OGC NewFinity ecosystem.



This engine is responsible for:

- Loading templates  

- Merging variables  

- Rendering HTML emails  

- Rendering SMS text  

- Validating placeholders  

- Ensuring brand consistency  

- Preparing final payloads for the Notification Delivery Engine  



This module must be reliable, safe, and consistent across all notification types.



---



# 2. Rendering Engine Architecture Overview



The rendering pipeline includes:



1. Template Storage Layer  

2. Template Compiler  

3. Variable Resolver  

4. Sanitization Layer  

5. Preview Renderer  

6. Final Delivery Renderer  

7. Version Control (Admin Panel)  



The system supports:

- HTML email templates  

- Text-based SMS templates  

- Future push notification templates  



---



# 3. Template Storage Model



Templates stored in DB:



### `NotificationTemplate`

- id  

- name  

- type (email, sms)  

- category  

- body (string)  

- variables (JSON)  

- version  

- status (active/disabled)  

- createdAt  

- updatedAt  



### Example categories:

- Authentication  

- Subscription  

- Challenge Updates  

- Submission Results  

- Wallet Activity  

- Security Alerts  

- System Announcements  



---



# 4. Template Loading Logic



Template lookup follows the order:



1. Template ID (direct reference)  

2. Template name  

3. Template category default (fallback)  

4. System fallback template  



If no template can be found:

error.code = "TEMPLATE_NOT_FOUND"



yaml

Copy code



---



# 5. Template Variable Rules



Variables use the format:

{{variableName}}



markdown

Copy code



### Examples:

- `{{user.name}}`  

- `{{challenge.title}}`  

- `{{submission.status}}`  

- `{{reset.link}}`  

- `{{wallet.amount}}`  



### Variable Types:

- Strings  

- Numbers  

- URLs  

- Conditional blocks (future)  



Backend must ensure:

- All required variables are provided  

- Missing variables trigger error  

- No unsafe HTML injection  



Error for missing variable:

error.code = "MISSING_TEMPLATE_VARIABLE"



yaml

Copy code



---



# 6. Rendering Pipeline



### Step 1: Load Template  

Retrieve template by ID or category.



### Step 2: Validate Status  

Template must be active.



### Step 3: Validate Variables  

Ensure all required variables exist.



### Step 4: Merge Variables  

Replace placeholders with values.



### Step 5: Sanitize Output  

Prevent:

- XSS  

- HTML injection  

- Unsafe URLs  

- Broken HTML  



### Step 6: Return Rendered Message  

Used by Notification Delivery Engine.



---



# 7. Email Rendering Rules



### Email Body Requirements:

- Valid HTML  

- Inline CSS safe  

- No external CSS unless allowed  

- Buttons must follow design guidelines  

- Should include fallback text  



### Boilerplate Wrapper (Required):

All email HTML must be rendered inside a predefined wrapper to ensure brand consistency.



Wrapper includes:

- Header  

- Body container  

- Footer  

- Branding  

- Unsubscribe link (future)  



The rendering engine inserts the body content inside the wrapper automatically.



---



# 8. SMS Rendering Rules



SMS must:

- Be plain text only  

- Avoid long URLs (use shorten service in future)  

- Avoid emojis unless supported  

- Check final message length  

- Warn if message > 160 characters  



Error for oversized messages:

error.code = "SMS_TOO_LONG"



yaml

Copy code



SMS templates are simpler but require variable validation.



---



# 9. Template Versioning



Each template update creates a new version.



### Version fields:

- version number  

- body  

- variables  

- updatedBy  

- timestamp  



Admins may:

- View version history  

- Restore previous version  

- Duplicate versions  

- Compare differences  



Backend must:

- Preserve all versions permanently  

- Prevent deletion of used versions  



---



# 10. Preview Rendering



Admin Panel preview uses:

- Sample variable sets  

- Sample challenge/submission data  

- Real HTML rendering  

- Live mobile/desktop toggle  



Preview endpoint:

POST /api/v1/admin/templates/preview



yaml

Copy code



Errors return descriptive previews of:

- Missing variables  

- Invalid JSON  

- Malformed HTML  



---



# 11. Validation Layer



### Email Validation:

- HTML linting  

- Placeholder checks  

- Missing variable detection  

- Forbidden tag detection (`<script>`, `<iframe>` etc.)



### SMS Validation:

- Length check  

- Unsupported character check  

- Placeholder validation  



---



# 12. Integration with Notification Delivery Engine



After rendering, the output is passed to:



### Email Payload:

{

"to": user.email,

"subject": "Challenge Published!",

"html": "<html>...</html>",

"text": "Plain text version (optional)"

}



shell

Copy code



### SMS Payload:

{

"to": user.phone,

"message": "Your submission was approved!"

}



yaml

Copy code



Payloads must be complete and ready for immediate delivery.



---



# 13. Error Codes



| Code | Meaning |

|------|---------|

| TEMPLATE_NOT_FOUND | Template does not exist |

| TEMPLATE_DISABLED | Template exists but disabled |

| MISSING_TEMPLATE_VARIABLE | Required variable missing |

| INVALID_TEMPLATE_FORMAT | Template contains invalid syntax |

| HTML_RENDERING_ERROR | Template failed to render |

| SMS_TOO_LONG | SMS exceeded character limit |

| UNSAFE_CONTENT | Detected dangerous content |



---



# 14. Audit Logging Requirements



Every template rendering must be logged when:

- Template updated  

- Template restored  

- Preview generated  

- Template used for mass broadcast  



Audit entry includes:

- templateId  

- version  

- adminId  

- timestamp  

- action  

- metadata  



---



# 15. Performance Requirements



- Rendering must complete <100ms  

- Email wrapper insertion must be optimized  

- Template compile step cached  

- Settings and variables cached (short TTL)  

- Parallel rendering supported for batch notifications  



---



# 16. Future Enhancements



- Conditional logic inside templates (`{{#if}}`)  

- Template components/snippets  

- AI-assisted template generation  

- Multi-language template support  

- Auto-layout email builder  

- Theme switching (light/dark email themes)  



---



# 17. Conclusion



This document defines the complete Notification Template Rendering Engine for OGC NewFinity.  

It ensures consistent, safe, and branded content delivery across all user-facing and admin-facing notifications.

