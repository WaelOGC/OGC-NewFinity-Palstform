# OGC NewFinity — Component Interaction & Motion Specification (v1.0)



## 1. Introduction

This document defines the interaction design, animations, transitions, micro-interactions, and motion rules across all OGC NewFinity front-end interfaces.



Motion design expresses the brand:

- Futuristic  

- Clean  

- Neon-accented  

- Smooth  

- Lightweight  

- High-performance  



These rules apply to:

- Buttons  

- Cards  

- Modals  

- Navigation  

- Tables  

- Charts  

- Dashboard widgets  

- AI Agent (Amy)  

- Wallet dashboard  

- Admin panel  



---



# 2. Motion Principles



### **2.1 Consistency**

All components follow the same motion logic:

- Same easing curves  

- Same timing patterns  

- Similar hover & active responses  



### **2.2 Subtle, not distracting**

Motion supports UX — it does not overshadow content.



### **2.3 Smooth and fluid**

Animations should feel:

- Light  

- Responsive  

- Guided  



### **2.4 High performance**

- Avoid reflow-heavy animations  

- Use opacity, transform, and scale  

- Prefer GPU acceleration  



---



# 3. Global Motion Tokens



--motion-fast: 120ms ease-out;

--motion-medium: 200ms ease;

--motion-slow: 320ms ease-in-out;



--ease-standard: cubic-bezier(0.25, 0.1, 0.25, 1);

--ease-smooth: cubic-bezier(0.45, 0.05, 0.55, 0.95);

--ease-accelerate:cubic-bezier(0.4, 0.0, 1, 1);

--ease-decelerate:cubic-bezier(0.0, 0.0, 0.2, 1);



--motion-scale-small: 1.02;

--motion-scale-medium:1.04;



yaml

Copy code



---



# 4. Component-Level Interaction Patterns



## 4.1 Buttons



### Hover:

- Slight scale → `scale(1.02)`  

- Glow effect intensifies  

- Border neon brightens  



### Active (click):

- Quick depress animation: `scale(0.97)`  

- Ripple (optional future)  



### Disabled:

- Reduced opacity (40%)  

- No glow  

- Cursor: not-allowed  



---



## 4.2 Cards



### Hover:

- Soft neon border appears  

- Shadow intensifies slightly  

- Lift animation: `translateY(-2px)`  



### Active:

- Slight press animation: `translateY(1px)`  



### Focus:

- Neon focus ring using theme token  



---



## 4.3 Modals



### Entrance Animation:

@keyframes modal-in {

from { opacity: 0; transform: scale(0.95); }

to { opacity: 1; transform: scale(1); }

}



shell

Copy code



### Exit Animation:

@keyframes modal-out {

from { opacity: 1; transform: scale(1); }

to { opacity: 0; transform: scale(0.97); }

}



yaml

Copy code



### Backdrop:

- Fade-in at 200ms  

- Slight blur background  



---



## 4.4 Navigation Components



### Sidebar:

- Active menu item glows softly  

- Hover → neon underline  

- Expand/collapse animated at 180ms  



### Topbar elements:

- Icons scale to 1.05 on hover  

- Profile dropdown slides down with fade  



---



## 4.5 Tables



### Hover row:

- Slight highlight glow  

- Soft background opacity change  



### Sorting icon:

- Rotates 180° with ease  



---



## 4.6 Tabs



### Active tab:

- Underline slides in with transform  

- Neon accent color  



### Switching tabs:

- Content fades up with 200ms transition  



---



## 4.7 Notifications Drawer



### Opening:

- Slide-in from right  

- Soft shadow expands  

- Items fade sequentially  



### Closing:

- Slide-out with reversed easing  



---



## 4.8 Charts (Dashboard)



### Initial render:

- Bar/line elements draw with 300–500ms animation  

- Numbers fade in sequentially  



### Hover interactions:

- Tooltip fades in with scale-in  

- Data point glows slightly  



---



# 5. Motion Rules for Core Screens



## 5.1 Dashboard

- Cards fade-up on load  

- Charts animate once  

- Wallet stats count up (optional future)  



## 5.2 Challenge Hub

- Challenge cards animate grid-in  

- Filters animate slide-down  

- Voting button pulses lightly when enabled  



## 5.3 AI Agent

- Input panel expands smoothly  

- Output box fades in  

- Tool selection highlights with neon pulse  



## 5.4 Wallet Dashboard

- Token balance increments with number animation  

- Mining timeline slides horizontally  



---



# 6. Micro-Interactions



### Examples:

- Copy-to-clipboard → small checkmark animation  

- Form validation → shake or glow error border  

- Success toast → slides and fades into view  

- Loading spinner → neon rotating ring  



These should all use token-based timing.



---



# 7. Performance Guidelines



### Do:

- Use transform + opacity  

- Use CSS animations  

- Animate small, contained areas  

- Use requestAnimationFrame when needed  



### Avoid:

- Animating width/height frequently  

- Heavy box-shadow dynamic transitions  

- Layout-changing animations on large lists  

- Overly complex chained animations  



---



# 8. Accessibility & Reduced Motion



### If user enables "reduce motion":

- Disable scale animations  

- Replace transitions with fades  

- Remove parallax effects  



---



# 9. Future Motion Enhancements



- 3D card hover parallax (optional)  

- Magnetic button effects  

- Particle follow animations  

- AI-themed holographic transitions  

- Scroll-triggered reveal animations  



---



# 10. Conclusion

This specification defines the motion design and interaction patterns for all OGC NewFinity interfaces.  

Following these rules guarantees a consistent, futuristic experience across the entire platform.

