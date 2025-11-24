# OGC NewFinity — Challenge Hub UI Specification (v1.0)



## 1. Introduction

This document defines the UI/UX architecture, components, layout system, and interaction flow for the **Challenge Hub**, one of the core modules of the OGC NewFinity platform.



The Challenge Hub is where users:

- Discover challenges  

- View categories & tracks  

- Read rules & requirements  

- Submit entries  

- Track participation status  

- Explore winners  

- View deadlines & timelines  



This is a dedicated interface separate from Amy, Wallet, and Admin systems.



---



## 2. High-Level UX Goals



The Challenge Hub must be:

- Clear  

- Motivating  

- Organized  

- Easy to browse  

- Mobile-friendly  

- Futuristic with neon accents  



The experience should feel like a **competition center**, delivering energy, clarity, and engagement.



---



## 3. Page Structure Overview



The Challenge Hub uses the **standard platform dashboard layout**:



| TOPBAR |

| SIDEBAR | MAIN CONTENT |

markdown

Copy code



Inside the main content, UI is organized into:



1. **Categories / Tracks Navigation**  

2. **Challenge Cards Grid**  

3. **Filters, Sorting & Search**  

4. **Detailed Challenge View Page**  

5. **Challenge Timeline Section**  

6. **Submission CTA (Submit Entry)**  

7. **Winners & Results Section**  



---



## 4. Challenge Hub Main Page Layout



### Sections:



### **4.1 Page Header**

Contains:

- Title: "Challenge Hub"  

- Subtitle (optional)  

- Right-side actions: sorting dropdown, filter button  



### **4.2 Category Filter Bar**

Horizontal filter strip with:

- Category tabs (e.g., Creative, Tech, Group, School Students, etc.)

- Active tab highlight  

- Scrollable on mobile  



### **4.3 Challenge Cards Grid**

Displays all currently available challenges.



Grid layout:

- Desktop: 3–4 columns  

- Tablet: 2–3 columns  

- Mobile: 1 column  



Each challenge card must include:

- Category label  

- Challenge name  

- Prize / reward information  

- Deadline countdown  

- Status pill (Open / Closed / Upcoming)  

- "View Challenge" button  



Hover effect:

- Neon glow  

- Soft lift animation  



---



## 5. Challenge Card Specification



### Content:

- Challenge title  

- Category  

- Short description (1–2 lines)  

- Deadline date  

- Reward amount (OGC tokens or points)  

- Difficulty level (optional)  

- Hero icon  



### Interaction:

- Hover → scale(1.02)  

- Click → open detailed challenge page  

- Status:

  - **Open** → neon teal  

  - **Upcoming** → gold  

  - **Closed** → muted grey  



---



## 6. Filters & Sorting



### Sorting Options:

- Latest  

- Deadline (soonest first)  

- Reward amount  

- Popularity (future)  



### Filters:

- Category  

- Track  

- Difficulty (optional)  

- Status (Open, Upcoming, Closed)  



### Mobile Behavior:

- Sorting + Filters collapse into a single button  

- Opens full-screen drawer  



---



## 7. Challenge Details Page



The page structure:



| Challenge Title + Status + Category |

| Summary Cards (Deadline, Reward, etc.) |

| Challenge Description Section |

| Requirements & Rules Section |

| Timeline Section |

| Submit Button |

| Winning Criteria (Optional) |

| Winners Section (If Finished) |

yaml

Copy code



### 7.1 Header Area

Shows:

- Challenge title  

- Category  

- Status pill  

- Favorite icon (future)  



### 7.2 Summary Cards

Small info cards showing:

- Deadline countdown  

- Reward amount  

- Challenge type (solo, group, student track…)  

- Participation count  



### 7.3 Detailed Description

Must support markdown-like content:

- Images  

- Headings  

- Lists  

- Highlights  



### 7.4 Requirements Section

Displays:

- Submission format  

- Allowed file types  

- Minimum/maximum word count (if applicable)  

- Eligibility requirements  



### 7.5 Timeline Section

A dedicated horizontal timeline showing:

- Challenge opening date  

- Submission window  

- Review period  

- Voting (if applicable)  

- Winner announcement date  



### 7.6 Submission CTA

Large button:

**"Submit Your Entry"**

Styled with neon accent.



Disabled states:

- If challenge is closed  

- If user already submitted  



### 7.7 Winners Section

Displayed only after challenge completion:

- Winner cards  

- Runner-up list  

- Awarded tokens or recognition  



---



## 8. Submission Workflow (Frontend Overview)



The submission workflow is defined in a separate document, but this page must:



### Show submission status:

- Not submitted  

- Submitted (pending review)  

- Approved (visible publicly)  

- Rejected (with reason)  



### Provide action buttons:

- Submit entry  

- View submitted entry  

- Edit (if allowed)  



---



## 9. Empty States



### No challenges:

"New challenges are coming soon."



### No challenges in selected category:

"No challenges available in this category."



### Challenge closed:

"This challenge is no longer accepting submissions."



---



## 10. Notifications Integration



Challenge events trigger notifications:

- Challenge opening  

- Deadline approaching  

- Submission reviewed  

- Voting started  

- Winner announcement  



UI must provide quick access to these via the global notification drawer.



---



## 11. Mobile UX



### Challenge Cards:

- Full width  

- Larger icons  

- Simplified layout  



### Filters:

- Full-screen filter modal  



### Challenge Details:

- Timeline becomes vertical  

- Summary cards become horizontal scroll  



---



## 12. Visual Styling



### Colors:

- White text  

- Dark backgrounds  

- Category pills use neon colors  

- Status colors:

  - Open → teal  

  - Upcoming → gold  

  - Closed → grey  



### Cards:

- Transparent  

- Glow on hover  

- Soft shadow  



### Typography:

- Bold titles  

- Clean paragraphs  

- High contrast  



---



## 13. Future Enhancements



- Leaderboards  

- Community voting  

- Partner challenges  

- AI-assisted challenge creation (admin)  

- Public submission gallery  

- Bookmark/favorite feature  



---



## 14. Conclusion



This specification defines the official UI/UX standard for the Challenge Hub of OGC NewFinity.  

All challenge components must follow this structure to ensure a consistent, engaging, and scalable user experience.

