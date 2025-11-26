# OGC NewFinity — Global Styling & CSS Architecture (v1.0)



## 1. Introduction

This document defines the global CSS architecture, styling methodologies, file structure, naming conventions, and implementation rules for the entire OGC NewFinity frontend ecosystem.



The goals:

- Consistency  

- Scalability  

- Maintainability  

- Zero conflicts  

- Token-driven styling  

- Clean dark-theme visuals  

- Predictable component behavior  



This applies to:

- Platform Dashboard  

- Admin Panel  

- AI Agent (Amy)  

- Wallet Dashboard  

- Challenge Hub  

- Global UI components  



---



# 2. Styling Philosophy



### Core Principles:

- **Token-first design** (colors, spacing, radii, shadows)  

- **No inline styles** (except dynamic/reactive properties)  

- **BEM-inspired class names**  

- **Scoped component styles**  

- **Minimal global overrides**  

- **Dark theme as the baseline**  



### Do:

- Use CSS variables everywhere  

- Keep component styles isolated  

- Use consistent naming  



### Avoid:

- Hard-coded colors  

- Random class names  

- Overly deep selectors  

- Mixing layout + component logic  



---



# 3. Styling File Structure



styles/

│

├── globals.css # resets, root tokens, HTML/body rules

├── tokens.css # design tokens only

├── components.css # global component classes (buttons, modals)

└── utilities.css # helper classes (margin, padding, flex)



shell

Copy code



### Component-specific CSS

All components have their own file:



components/

ui/

Button.css

Card.css

Modal.css

layout/

Sidebar.css

Topbar.css

dashboard/

WalletBalanceCard.css

MiningTimeline.css



yaml

Copy code



No component shares its CSS file.



---



# 4. Global Reset & Normalization



### globals.css includes:

- CSS reset  

- Box-sizing border-box  

- Scrollbar theming  

- Dark theme body background  

- Typography defaults  

- Anti-aliasing  



Example structure:

```css
html {
  box-sizing: border-box;
}

*, *::before, *::after {
  box-sizing: inherit;
}

body {
  background: var(--color-dark-200);
  color: var(--color-white);
  font-family: var(--font-primary);
}
```



---



# 5. CSS Variable Strategy (Token-Driven)



All colors, spacing, radii, shadows, gradients, and motion values **MUST** come from:



tokens.css



makefile

Copy code



Example:

.card {

background: var(--color-dark-300);

border-radius: var(--radius-md);

box-shadow: var(--shadow-soft);

}



yaml

Copy code



No raw hex values allowed.



---



# 6. Naming Conventions (BEM Hybrid)



### Pattern:

.component-name__element--modifier



shell

Copy code



### Examples:

.card__header

.card__body

.card__footer--compact

.button--primary

.input__icon--left



yaml

Copy code



### Rules:

- Lowercase  

- Hyphen-separated  

- Reserved for structural styling  



---



# 7. Utility Classes



utilities.css contains lightweight helpers:



### Layout utilities:

.flex

.flex-center

.flex-between

.grid

.hidden



shell

Copy code



### Spacing utilities:

.mt-4

.mb-6

.px-6

.py-8



shell

Copy code



### Display utilities:

.inline-block

.block

.relative

.absolute



yaml

Copy code



These are optional but useful for layout tuning.



---



# 8. Component Styling Rules



### Buttons:

- Neon-glow hover  

- Token-based borders  

- Defined size presets (sm/md/lg)  

- Focus outline visible  



### Cards:

- Transparent/dark surfaces  

- Glow on hover  

- Soft outer shadow  



### Inputs:

- Minimal border  

- Neon focus ring  

- Error state: glow + message  



### Modals:

- Backdrop blur  

- fade-in / scale-in animations  

- Fullscreen on mobile  



### Tables:

- Zebra rows (subtle)  

- Hover highlight  

- Sticky header  



---



# 9. Layout Styling Rules



### Sidebar:

- Gradient accent on active item  

- Icon scaling  

- Collapsible behavior  



### Topbar:

- Slight transparency  

- Micro-shadow  

- Neon underline at bottom  



### Main Content:

- Token-based padding on all breakpoints  



---



# 10. Responsive CSS Approach



Use mobile-first breakpoints:

@media (min-width: var(--bp-sm)) {}

@media (min-width: var(--bp-md)) {}

@media (min-width: var(--bp-lg)) {}

@media (min-width: var(--bp-xl)) {}



yaml

Copy code



### Rules:

- Card grids adapt via CSS grid  

- Table collapse patterns use CSS + JS  

- Sidebar collapses on tablet  



---



# 11. Animation & Motion Styling



Animations follow the Motion Specification:



- fade-in  

- fade-up  

- scale-in  

- glow intensify  

- smooth transitions  



All animations must use tokens:

transition: var(--motion-medium);



yaml

Copy code



---



# 12. Accessibility Styling Rules



- Strong focus ring:  

outline: 2px solid var(--color-neon-teal);



yaml

Copy code



- Text size cannot be below 14px  

- Ensure contrast: white text on dark backgrounds  

- Disabled elements have reduced opacity  



---



# 13. Theming Architecture



The theme is defined by:

- Root-level CSS variables  

- Token overrides (future light mode)  



To switch themes:

[data-theme="light"] {

--color-dark-200: #ffffff;

--color-white: #000000;

...

}



yaml

Copy code



(For future use.)



---



# 14. Future Enhancements



- Light theme  

- Seasonal theme modes  

- Per-user theme customization  

- Theme switch toggle  

- CSS variable transitions  



---



# 15. Conclusion

This CSS architecture provides a scalable, consistent, and maintainable styling foundation for the entire OGC NewFinity platform.  

All UI elements must use this structure and token-driven approach to ensure full brand cohesion and future extensibility.

