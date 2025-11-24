# OGC NewFinity — Subscription Center UI Specification (v1.0)



## 1. Introduction

This document defines the full UI/UX for the **Subscription Center**, where users manage their NewFinity subscription tier, billing details, usage limits, and plan upgrades.



This interface is separate from:

- Wallet Dashboard  

- Amy Workspace  

- Challenge Hub  

- Admin Panel  



But it shares the same global identity, layout structure, and frontend architecture.



The Subscription Center must feel:

- Professional  

- Trustworthy  

- Clean and transparent  

- Fully aligned with neon-dark branding  



---



## 2. Primary User Goals

The Subscription Center allows users to:

- View current subscription plan  

- Compare plans (Free, Pro, Enterprise)  

- Upgrade / downgrade  

- View billing history (future)  

- View usage limits (AI, submissions, storage, etc.)  

- Update payment method  

- Cancel subscription  

- Renew subscription  



---



## 3. Page Structure Overview



Layout uses the **standard platform dashboard** arrangement:



| TOPBAR |

| SIDEBAR | MAIN CONTENT |

yaml

Copy code



The main content includes:



1. Current Plan Summary  

2. Usage & Limits Section  

3. Plan Comparison Table  

4. Upgrade CTA  

5. Billing history (future)  

6. Payment method management (future)  



---



# 4. Current Plan Summary Section



### Location:

At the top of the page.



### Components:

- Plan name (Free / Pro / Enterprise)  

- Status badge: Active / Expired / Trial  

- Renewal date  

- Price & billing cycle  

- Quick-action buttons  



### Quick Actions:

- **Upgrade Plan** (if Free or Pro)  

- **Manage Billing**  

- **Cancel Subscription** (Pro / Enterprise)  



### Visual Style:

- Transparent card  

- Neon border based on tier:

  - Free → grey  

  - Pro → neon teal  

  - Enterprise → neon violet  



- Smooth hover animation  

- Clear typography  



---



# 5. Usage & Limits Section



This section shows real-time usage for:



### AI Tools:

- Requests per day  

- Token usage (future)  

- Tool access level  



### Challenges:

- Maximum submissions per month  

- Access to advanced tracks  



### Wallet:

- Mining rewards limits (future)  

- Off-chain credit limits  



### File Storage (future):

- Upload limits  

- Total storage  



### UI Components:

- Progress bars  

- Icons  

- Tooltips explaining limits  

- Color-coded warnings:

  - Green → within limits  

  - Yellow → approaching limit  

  - Red → limit reached  



---



# 6. Plan Comparison Table



A large, responsive comparison matrix featuring:



### Columns:

- Free  

- Pro  

- Enterprise  



### Rows (Example Feature Categories):

- AI access  

- Monthly AI usage  

- Challenge participation  

- Submission limits  

- Wallet bonus rewards  

- Support level  

- File upload limits  

- Priority rendering (future)  

- Early access to features  



### UI Features:

- Highlight user's current plan  

- "Upgrade" button inside Pro & Enterprise columns  

- Neon accent separators  

- Mobile → collapses into vertical comparison blocks  



---



# 7. Upgrade Flow



When the user selects **Upgrade**:



### Step 1: Select Plan

- Show plan cards  

- Display main differences  

- Highlight value  



### Step 2: Payment & Billing

- Payment method input form  

- Card number, expiry, CVC  

- Billing address (optional)  

- Tax/VAT fields (future)  



### Step 3: Confirmation

- Order summary  

- Total amount  

- Billing cycle  

- "Confirm & Pay" button  



### Step 4: Success Page

Displays:

- Checkmark animation  

- "Your plan has been upgraded!"  

- "Go to Subscription Center" button  



---



# 8. Cancel Subscription Flow



### Step 1 — Confirmation Modal:

- "Are you sure you want to cancel?"  

- Warning about losing Pro features  

- Required checkbox:  

  "I understand that my plan will revert to Free."



### Step 2 — Feedback (optional):

- "Why are you canceling?" (multiple choice)



### Step 3 — Success:

- "Your subscription has been canceled."  

- Plan reverts to Free  



### UI Notes:

- Destructive action styled with neon red/pink  

- Clear emphasis on consequences  



---



# 9. Billing History (Future)



Table columns:

- Date  

- Invoice #  

- Amount  

- Status  

- Download PDF  



---



# 10. Payment Method Management (Future)



Form includes:

- Card number  

- Expiration  

- CVC  

- Billing address  

- Update / Remove card  



Success states:

- "Payment method updated successfully."  



---



# 11. Empty States



### No subscription:

"You're currently using the Free plan."



### No billing history:

"No invoices available yet."



### No active payment method:

"No payment method is added."



---



# 12. Visual Styling Guidelines



### Colors:

- Dark backgrounds  

- White text  

- Neon teal / pink / yellow / violet accents  

- Tier color-coding  



### Typography:

- Clean, modern sans-serif  

- Strong hierarchy  



### Components:

- Transparent cards  

- Neon hover glow  

- Rounded corners  

- Consistent spacing  



---



# 13. Responsive Behavior



### Desktop:

- Full comparison table  

- Two-column layout for usage & limits  



### Tablet:

- Comparison table collapses into stacked rows  

- Usage cards become a grid  



### Mobile:

- Single column layout  

- Side-by-side scroll for plan comparison  

- Full-width CTAs  



---



# 14. Future Enhancements



- Coupon/Promo code input  

- Annual billing discounts summary  

- AI plan optimizer ("Which plan do I need?" tool)  

- Usage forecasting graphs  

- Renewal reminders in-app  

- In-app subscription recovery (failed payments)  



---



# 15. Conclusion



This specification defines the official UI/UX rules for the OGC NewFinity Subscription Center.  

All subscription screens, flows, and user interactions must follow this structure for consistency, clarity, and long-term scalability.

