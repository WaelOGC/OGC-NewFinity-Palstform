# OGC NewFinity — Frontend Error Handling & UX Messaging Rules (v1.0)



## 1. Introduction

This document defines the user-facing error handling, warnings, confirmations, alerts, and UI message patterns across the OGC NewFinity platform.



The goal:

- Provide clear communication  

- Avoid technical jargon  

- Maintain consistent tone  

- Support fast debugging  

- Keep the experience predictable  

- Match the platform's futuristic, plasma UI identity  



These rules apply to:

- Authentication screens  

- Dashboard components  

- AI Agent (Amy)  

- Wallet dashboard  

- Challenge & submission flows  

- Subscription pages  

- Admin panel  

- Global UI components  



---



# 2. Messaging Tone & Style



### 2.1 Tone

Messages must be:

- Professional  

- Direct  

- Clear  

- Human-friendly  



### 2.2 Avoid

- Developer language  

- Confusing technical details  

- Blame-focused messages  

- Generic "Error occurred" placeholders  



### 2.3 Must Include

- What happened  

- Why it happened (in simple terms)  

- What the user can do next  



---



# 3. Message Categories



### **3.1 Errors**

Used when an action cannot be completed.



Examples:

- Invalid form input  

- Failed API request  

- Missing data  

- Permission denied  



### **3.2 Warnings**

Used for cautionary actions:

- Leaving a page with unsaved data  

- High-impact operations  

- Approaching subscription limits  



### **3.3 Success Messages**

Confirm completed actions:

- Saved successfully  

- Submitted successfully  

- Payment processed  



### **3.4 Informational Messages**

Helpful neutral information:

- AI usage update  

- Wallet synced  

- Challenge timeline reminders  



---



# 4. Standard UI Message Components



### **4.1 Toasts**

Used for quick, transient feedback.



- Duration: 2.5–4s  

- Types: success, error, warning, info  

- Plasma color accents (fluid gradients, soft radiance)  

- Slide-in + fade animation  



### **4.2 Inline Form Errors**

Displayed under inputs.



Rules:

- Always visible on error  

- One short sentence max  

- Icon optional  



### **4.3 Alert Bars**

Top-page banners for important events.



Used for:

- Payment failures  

- System maintenance  

- Critical account alerts  



### **4.4 Modals (Confirmation Required)**

Used for:

- Deleting data  

- Submitting challenges  

- Canceling subscription  

- Admin-level actions  



---



# 5. Standard Error Messages



### Authentication

- "Incorrect email or password."

- "Your session has expired. Please log in again."

- "This link is no longer valid."



### Form Validation

- "This field is required."

- "Please enter a valid email address."

- "Password must be at least 8 characters."



### API Failures

- "We couldn't load your data. Please try again."

- "Something went wrong. Try again shortly."



### Wallet

- "Unable to sync wallet. Please try again later."

- "This wallet address is not valid."



### AI Agent

- "Your request exceeded the allowed limit."

- "This tool is not available in your subscription plan."



### Challenges & Submissions

- "Submissions for this challenge are closed."

- "You've already submitted an entry."



---



# 6. Success Messages



### Generic

- "Saved successfully."

- "Your changes have been applied."



### Wallet

- "Wallet synced successfully."

- "Reward added to your balance."



### AI Agent

- "Your result is ready."



### Challenges / Submissions

- "Submission received. Awaiting review."

- "Vote counted."



---



# 7. Warning Messages



### Navigation

- "You have unsaved changes. Leave anyway?"



### Subscription

- "Your subscription expires soon."



### Voting

- "Voting is not open yet."



### Admin

- "This action cannot be undone."



---



# 8. Loading & Skeleton States



### Requirements:

- Every API call must show loading feedback  

- Skeleton loaders for:

  - Dashboard cards

  - Tables

  - Charts

  - Submissions

- Never show a blank screen  

- Use plasma-accented skeleton gradients (fluid gradients, soft radiance)  



---



# 9. Retry Logic



If an operation fails:

- Provide a "Try Again" button  

- If repeated failure → show suggestion  

- Never auto-retry more than once  



---



# 10. Empty States



Each major section must have a clear, polished empty state.



Examples:



### Wallet

- "No transactions yet."



### AI Agent

- "Choose a tool and begin creating."



### Challenges

- "No active challenges available."



### Submissions

- "You haven't submitted anything yet."



### Notifications

- "No notifications at the moment."



---



# 11. Accessibility Requirements



- All error messages must be screen-reader friendly  

- Color cannot be the only indicator  

- Icons + text required for critical states  

- Focus indicators on interactive elements  



---



# 12. Animation Rules for UX Feedback



### Error

- Light shake or glow  

- Fast timing (120–200ms)



### Success

- Soft fade-up  

- Color shift to plasma green (soft radiance)  



### Warning

- Pulse animation at low intensity  



### Info

- Gentle fade  



All must use CSS tokens from the Motion Specification.



---



# 13. Future Enhancements



- AI-suggested solutions for user errors  

- Predictive UX messaging  

- Smart autofill for forms  

- Holographic alert animations (experimental)  

- Real-time socket-based inline error detection  



---



# 14. Conclusion

This specification defines the complete user-facing messaging and error-handling framework for OGC NewFinity interfaces.  

Following these rules ensures a consistent, professional, and intuitive user experience at all times.

