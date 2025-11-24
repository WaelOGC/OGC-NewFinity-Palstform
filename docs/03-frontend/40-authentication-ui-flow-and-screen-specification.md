# OGC NewFinity — Authentication UI Flow & Screen Specification (v1.0)



## 1. Introduction

This document defines the complete Authentication UI flows, screens, interactions, validation, and UX rules for the OGC NewFinity platform.



Authentication covers:

- Login  

- Registration  

- Forgot password  

- Reset password  

- Email verification (future)  

- Session expiration handling  



This document ensures:

- Consistent visual identity  

- Predictable UX patterns  

- Accessibility requirements  

- Seamless routing between screens  

- Clear error & success messaging  



---



# 2. Authentication Screens Overview



### Required Screens:

1. **Login**  

2. **Register (Create Account)**  

3. **Forgot Password**  

4. **Reset Password**  

5. **Session Expired Screen**  

6. **Email Verification Screen (future)**  



Each screen uses:

- Card layout  

- Centered container  

- White text  

- Neon accents  

- Soft-glow focus states  

- Responsive behavior  



---



# 3. Page Layout Structure



Each auth page follows the same structure:



HEADER (logo)

FORM

(card, centered, max 420px)

-----------------------------------

LINKS / SECONDARY ACTION



yaml

Copy code



### Card Layout Rules:

- Max width: 420px  

- Padding: var(--space-8)  

- Rounded corners: var(--radius-lg)  

- Background: var(--color-dark-300) with slight transparency  

- Shadow: var(--shadow-soft)  

- Glow accents on hover  



---



# 4. Authentication Flows



---



## 4.1 Login Flow



### Flow Steps:

1. User enters email + password  

2. Validation rules applied  

3. If valid → POST /auth/login  

4. If success → redirect to `/dashboard`  

5. If failure → show error toast + field messages  



### Required Elements:

- Email input  

- Password input  

- "Show password" icon  

- "Forgot password?" link  

- "Create account" button  

- Primary **Login** button  



### Login Form Validation:

- Email → required + valid  

- Password → required  



### Error Messages:

- "Incorrect email or password."  

- "Your account could not be found."  



---



## 4.2 Registration Flow



### Flow Steps:

1. User enters name, email, password  

2. Validate fields  

3. Submit to `/auth/register`  

4. Show success page or message  

5. Optionally redirect to login  



### Required Inputs:

- Full name  

- Email  

- Password  



### Password Requirements:

- Min 8 characters  

- (Future) strength meter  



### Success UX:

Show a success card:

"You account has been created. You may now log in."



---



## 4.3 Forgot Password Flow



### Flow Steps:

1. User enters email  

2. Validation  

3. Show success toast:  

   "Password reset instructions have been sent."  

4. Redirect to login  



### Required Input:

- Email  



### Error States:

- Email not found  

- Invalid email  



---



## 4.4 Reset Password Flow



### Triggered By:

User clicks email link with a reset token.



### Flow Steps:

1. Validate token (backend)  

2. User enters new password  

3. Confirm password  

4. Submit  

5. Redirect to login with success message  



### Required Inputs:

- Password  

- Confirm password  



### Validation:

- Passwords must match  

- 8+ characters  



---



## 4.5 Session Expired Screen



Shown when:

- Access token expired  

- Refresh token invalid  



### UI:

- Message: "Your session has expired. Please log in again."  

- Login button  



### Behavior:

- No form fields  

- Simple one-action screen  



---



## 4.6 Email Verification Screen (Future)



Used after registration when email verification is enabled.



### UI Requirements:

- Success icon  

- Countdown or manual refresh  

- "Resend verification email" button  



---



# 5. Form Components (Auth-Specific)



### Input Fields:

- Larger padding  

- Rounded corners  

- Transparent backgrounds  

- Neon focus ring  



### Buttons:

- Full-width  

- High-visibility  

- Neon glows on hover  



### Helper Links:

- Underline on hover  

- Subtle fade animations  



---



# 6. Error Handling UI



### Inline Errors:

- Display below fields  

- Neon pink text or border  

- Icon optional  

- Never more than one sentence  



### Toast Errors:

- API failures  

- Auth expiration  

- Rate-limit errors  



### Token/Session Errors:

- Redirect to Session Expired screen  

- No technical details shown  



---



# 7. Success Messaging



### Login Success:

- Redirect to dashboard  

- Optional "Welcome back" toast  



### Registration Success:

- Card message + link to login  



### Reset Password Success:

- Toast: "Your password has been changed."  

- Redirect to login  



---



# 8. Page Transitions



### Auth screens animate:

- Fade-in  

- Scale-up (slight)  

- Neon glow border on form card  



### Buttons:

- glow intensifies on hover  

- subtle depress on click  



### Inputs:

- glow ring on focus  



All motion must follow the Motion Specification tokens.



---



# 9. Responsive Requirements



### Mobile:

- Form card becomes full-width  

- Reduced padding  

- Logo scaled down  

- Buttons full-width  



### Tablet:

- Centered card  

- Slightly wider forms  



### Desktop:

- Max width enforced  

- Neon accents at full effect  



---



# 10. Accessibility Requirements



- All fields labeled  

- All buttons have ARIA labels  

- Focus ring visible  

- Password toggle accessible via keyboard  

- Screen-reader text for errors  



---



# 11. Security Considerations (Frontend)



- No password hints returned from backend  

- No specific reason given for failed login  

- No autocomplete for sensitive fields  

- Minimal error detail to prevent enumeration  

- Session expiration handled gracefully  



---



# 12. Future Enhancements



- Social login integration  

- Multi-step onboarding  

- Email verification enforcement  

- Password strength meter  

- Biometrics (mobile app)  



---



# 13. Conclusion

This specification ensures the authentication experience is clean, secure, consistent, and user-friendly.  

All auth screens across NewFinity must follow these structures and UX rules.

