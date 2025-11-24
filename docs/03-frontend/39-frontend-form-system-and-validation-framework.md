# OGC NewFinity — Frontend Form System & Validation Framework (v1.0)

## 1. Introduction

This document defines the Frontend Form System used across all interfaces in the OGC NewFinity platform.  

It standardizes:

- Form structure  

- Field components  

- Validation rules  

- Error handling  

- Interaction patterns  

- Visual layout  

- Submit behavior  

- Accessibility requirements  

This ensures consistent UX for:

- Authentication  

- Profile settings  

- Subscriptions & payments  

- Challenge creation  

- Submissions  

- AI tools (input forms)  

- Admin panel form workflows  

---

# 2. Form System Goals

### The system must be:

- **Predictable**  

- **Consistent**  

- **Reusable**  

- **Token-driven**  

- **Minimalistic**  

- **High-clarity**  

- **Fully accessible**  

### All forms MUST:

- Use the same input components  

- Use the same validation patterns  

- Handle errors identically  

- Display feedback in a uniform manner  

---

# 3. Form Architecture & Structure

Every form follows the same internal structure:

<FormWrapper> <FormHeader /> (optional) <FormFields /> (inputs) <FormFooter /> (buttons, hints) </FormWrapper> ```

Structure Breakdown

FormWrapper → handles layout, spacing, and submission logic

FormHeader → title + subtitle (optional)

FormFields → reusable input components

FormFooter → primary action + secondary links

4. Global Form Components

4.1 Input Field Component (<Input />)

Label

Helper text

Error state

Icons (optional)

Variant: text/email/password/number

4.2 Textarea Component (<Textarea />)

Auto-resizing

Error handling

Character counter (optional)

4.3 Select Component (<Select />)

Custom dropdown

Searchable options (admin use)

4.4 Toggle/Switch Component

Used for:

Settings

Admin feature toggles

4.5 File Upload Component (<FileInput />)

Supports:

Images

Videos

PDFs

Validation rules

Used heavily in:

Submissions

Challenge creation

Admin editing

4.6 Form Buttons

Primary action

Secondary outline

Full-width on mobile

5. Validation Framework

Validation Rules Are:

Token-based

Declarative

Centralized in /utils/validators.js

Core Validators

scss

Copy code

isRequired(value)

isEmail(value)

minLength(value, n)

maxLength(value, n)

isNumber(value)

isURL(value)

isValidWalletAddress(value)

isImageFile(file)

isVideoFile(file)

6. Standard Validation Messages

Global Rules

Error messages must be:

Clear

Short

Non-technical

Examples:

Required

"Please fill out this field."

Email

"Please enter a valid email address."

Password

"Password must be at least 8 characters."

URL

"Please enter a valid link."

File Upload

"The selected file format is not supported."

Wallet Address

"This wallet address is not valid."

7. Error Display Rules

Errors must:

Appear below the field

Use neon-pink or warning-red

Include a small icon (optional)

Remain visible until corrected

Shake effect on submit if the field is invalid

8. Form Submission Workflow

8.1 On submit:

Validate fields

If any invalid →

Prevent submit

Highlight fields

Show field-level error messages

If valid →

Disable submit button

Show loading state

Send API request

8.2 On success:

Show success toast

Redirect if needed

Clear form

8.3 On failure:

Show API error message

Populate field-specific errors (if provided)

Re-enable button

9. Loading & Disabled States

Submit Button (loading):

css

Copy code

cursor: wait;

opacity: 0.6;

pointer-events: none;

Inputs disabled:

Lower opacity

Disable focus glow

Do not allow typing

10. Responsive Form Behavior

Mobile:

Full width elements

Single column only

Clear spacing

Tablet:

Slightly wider layouts

Two-column forms allowed for settings/admin

Desktop:

Two-column or card-based forms

11. Accessibility Requirements

Every input must have a <label>

Error text announced via screen reader

Keyboard navigation support

Focus ring visible at all times

Form submitted with Enter key

12. Form Layout Patterns

12.1 Card Form Layout (most common)

Used for:

Login

Registration

Profile

Subscriptions

12.2 Two-Column Admin Form

Used for:

Challenge creation

User role editing

Badge creation

12.3 Modal Form

Used for:

Deleting submissions

Manual reward assignment

Approving content

12.4 Full-Width Workspace Forms

Used for:

AI Agent prompts

Submission builder

Wallet address linking

13. Special Form Types

AI Prompt Forms

Must resize with content

Should show token usage meta (optional)

File Upload Forms

Must validate file size & MIME type

Must show preview if file is image

Must show upload progress (future)

Admin Review Forms

Include audit info

Confirmations required

Danger actions in red

14. Form Theming

All forms follow the global design tokens:

dark background

white text

neon borders & glows

rounded corners

soft shadows

States:

Normal → minimal borders

Focus → neon teal glow

Error → neon pink/red glow

Disabled → muted

15. Future Enhancements

Form autosave

AI-assisted auto-fill

Smart validation hints

CAPTCHA integration (admin-controlled)

Multi-step wizard forms

Drag-and-drop file upload interface

16. Conclusion

This specification defines the complete form & validation framework for OGC NewFinity.

All forms, modal actions, admin tools, and interactive screens must follow this system for consistency, accessibility, and exceptional UX quality.

