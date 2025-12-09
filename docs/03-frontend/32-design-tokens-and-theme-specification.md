# OGC NewFinity — Design Tokens & Theme Specification (v1.0)



## 1. Introduction

This document defines the full design token system for the OGC NewFinity platform.  

Design tokens ensure:

- Consistent design across all apps  

- Faster UI development  

- Scalable brand identity  

- Easy theme management  

- Clean separation of design & implementation  



These tokens apply to:

- Platform Dashboard  

- Admin Dashboard  

- AI Agent UI  

- Challenge Hub  

- Wallet Dashboard  

- All shared UI elements  



---



# 2. Color Tokens



## 2.1 Brand Palette (User-Approved)

--color-plasma-teal: #00FFC6;

--color-sunburst: #FFBC25;

--color-deep-violet: #5864FF;

--color-electric-pink:#FF3CAC;



shell

Copy code



## 2.2 Neutral Palette

--color-white: #FFFFFF;

--color-black: #000000;

--color-dark-100: #0A0A0A;

--color-dark-200: #121212;

--color-dark-300: #1A1A1A;

--color-dark-400: #1F1F1F;



shell

Copy code



## 2.3 Semantic Colors

--color-success: #00FF9D;

--color-warning: #FFBC25;

--color-error: #FF4E4E;

--color-info: #4DDCFF;



yaml

Copy code



---



# 3. Typography Tokens



## 3.1 Font Families

--font-primary: "Inter", "Poppins", sans-serif;

--font-mono: "Roboto Mono", monospace;



shell

Copy code



## 3.2 Font Sizes

--text-xs: 12px;

--text-sm: 14px;

--text-md: 16px;

--text-lg: 18px;

--text-xl: 20px;

--text-2xl: 24px;

--text-3xl: 30px;

--text-4xl: 36px;



shell

Copy code



## 3.3 Line Heights

--leading-tight: 1.1;

--leading-normal:1.4;

--leading-relaxed:1.6;



yaml

Copy code



---



# 4. Spacing & Sizing Tokens



## 4.1 Spacing Scale

--space-1: 4px;

--space-2: 8px;

--space-3: 12px;

--space-4: 16px;

--space-5: 20px;

--space-6: 24px;

--space-8: 32px;

--space-10:40px;



shell

Copy code



## 4.2 Border Radius

--radius-sm: 6px;

--radius-md: 12px;

--radius-lg: 16px;

--radius-xl: 24px;



shell

Copy code



## 4.3 Layout Widths

--max-width-content: 1280px;

--max-width-wide: 1600px;



yaml

Copy code



---



# 5. Shadow & Glow Tokens



## 5.1 Soft Shadows

--shadow-soft: 0 4px 20px rgba(0,0,0,0.35);



shell

Copy code



## 5.2 Plasma Glows

--glow-teal: 0 0 12px rgba(0,255,198,0.8);

--glow-pink: 0 0 12px rgba(255,60,172,0.8);

--glow-violet: 0 0 12px rgba(88,100,255,0.8);



shell

Copy code



## 5.3 Focus Outline

--focus-outline: 0 0 0 2px rgba(0,255,198,0.6);



yaml

Copy code



---



# 6. Gradient Tokens



## Official Gradients

--gradient-primary: linear-gradient(135deg, #00FFC6, #5864FF);

--gradient-secondary: linear-gradient(135deg, #FF3CAC, #5864FF);

--gradient-warning: linear-gradient(135deg, #FFBC25, #FF3CAC);

--gradient-success: linear-gradient(135deg, #00FFC6, #4DDCFF);



yaml

Copy code



Used for:

- Buttons  

- Cards  

- Line accents  

- Sections backgrounds  



---



# 7. Animation Tokens



--transition-fast: 150ms ease;

--transition-medium: 250ms ease;

--transition-slow: 400ms ease;



--fade-in: fade-in 0.3s ease;

--fade-up: fade-up 0.4s ease;

--scale-in: scale-in 0.25s ease;



--hover-glow: 0 0 12px currentColor;



css

Copy code



Animation Keyframes:

```css
@keyframes fade-in { 
  from { opacity: 0; } 
  to { opacity: 1; } 
}

@keyframes fade-up { 
  from { opacity: 0; transform: translateY(10px); } 
  to { opacity: 1; transform: translateY(0); } 
}

@keyframes scale-in { 
  from { transform: scale(0.95); } 
  to { transform: scale(1); } 
}
```

Copy code



---



# 8. Component-Level Token Usage



### Buttons

- Use plasma borders & internal glow tokens  

- Hover = glow intensifies  

- Disabled = reduced opacity  



### Cards

- Transparent dark surfaces  

- Soft shadow  

- Rounded corners  

- Subtle plasma internal glow with diffused depth  



### Modals

- Backdrop blur  

- Fade-in animation  



### Inputs

- Minimal borders  

- Plasma focus rings with internal glow  



### Tables

- Dark rows with plasma hover highlights (soft pulsing)  



---



# 9. Theme Architecture



Files:

styles/

globals.css

tokens.css

components.css



yaml

Copy code



### globals.css

- Resets  

- Global typography  

- Body background  

- Scrollbar styling  



### tokens.css

- Everything in this document  

- Pure design tokens only  



### components.css

- Button styling  

- Card styling  

- Modal styling  

- Etc.  

- Uses only tokens, no hard-coded values  



---



# 10. Dark Theme Rules (Mandatory)



- All backgrounds are transparent or dark  

- White text only  

- No bright backgrounds  

- Strong contrast via plasma borders & internal glow  



This matches the user's vision and platform identity.



---



# 11. Future Theme Extensions



- Light mode (optional future)  

- High-contrast accessibility mode  

- Animation intensity selector  

- Theme presets for seasonal events  

- AI-generated palette variants  



---



# 12. Conclusion

This theme specification defines the visual language and foundational design rules for all OGC NewFinity interfaces.  

Every component, page, and UI pattern must use these tokens to ensure brand consistency and scalable, maintainable UI architecture.

