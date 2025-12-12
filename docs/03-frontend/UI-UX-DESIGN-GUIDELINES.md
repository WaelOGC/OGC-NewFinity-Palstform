# OGC NewFinity Platform — UI/UX Design Guidelines

## 🚨 Global Requirement: Dark & Light Mode Support (MANDATORY)

**All UI and design work MUST fully support both Dark Mode and Light Mode simultaneously.**

This is a non-negotiable requirement for all components, pages, modals, forms, and design deliverables.

---

## 1. Core Principles

### 1.1 Theme-Aware Design
- **Never assume a default theme** — all UI must adapt dynamically
- **No hard-coded colors** — use CSS variables or theme tokens exclusively
- **Test in both themes** — verify appearance and accessibility in dark and light modes

### 1.2 Color System
- **Use CSS variables** — always reference `var(--bg-primary)`, `var(--text-main)`, etc.
- **Avoid fixed values** — no `#000`, `#fff`, `black`, `white` unless paired with theme conditionals
- **Semantic naming** — use tokens like `--bg-card`, `--text-muted`, `--border-card`

### 1.3 Component Requirements
All components must:
- ✅ Adapt backgrounds, borders, and text colors to theme
- ✅ Maintain legibility in both themes
- ✅ Preserve contrast ratios (WCAG AA minimum)
- ✅ Support interactive states (hover, focus, active) in both themes

---

## 2. CSS Variable System

### 2.1 Core Theme Variables

The platform uses a comprehensive CSS variable system defined in `frontend/src/index.css`:

#### Background Variables
```css
--bg-body          /* Main page background */
--bg-dashboard     /* Dashboard background */
--bg-header        /* Header background */
--bg-card          /* Card background */
--bg-card-soft     /* Subtle card background */
--sidebar-bg       /* Sidebar background */
```

#### Text Variables
```css
--text-main        /* Primary text color */
--text-muted       /* Secondary/muted text color */
```

#### Border Variables
```css
--border-card      /* Card borders */
```

#### Accent Variables
```css
--accent-primary    /* Primary accent (teal) */
--accent-secondary  /* Secondary accent (violet) */
--accent-warning    /* Warning color (yellow) */
--accent-danger     /* Error/danger color (pink) */
--chip-bg          /* Chip/badge background */
```

### 2.2 Usage Pattern

**✅ CORRECT:**
```css
.my-component {
  background: var(--bg-card);
  color: var(--text-main);
  border: 1px solid var(--border-card);
}

.my-button {
  background: var(--accent-primary);
  color: var(--text-main);
}
```

**❌ INCORRECT:**
```css
.my-component {
  background: #000;  /* Hard-coded color */
  color: white;      /* Hard-coded color */
}

.my-button {
  background: #00ffc6;  /* Should use --accent-primary */
}
```

### 2.3 Theme-Specific Overrides

When you need theme-specific styling, use the `[data-theme]` attribute selector:

```css
/* Base styles */
.my-component {
  background: var(--bg-card);
  color: var(--text-main);
}

/* Theme-specific adjustments (only when necessary) */
[data-theme="dark"] .my-component {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

[data-theme="light"] .my-component {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
```

---

## 3. Component Guidelines

### 3.1 Buttons
- Use `var(--accent-primary)` for primary actions
- Use `var(--bg-card)` with `var(--border-card)` for secondary buttons
- Ensure hover/focus states work in both themes
- Text must use `var(--text-main)` for contrast

### 3.2 Input Fields
- Background: `var(--bg-card)` or `var(--bg-card-soft)`
- Border: `var(--border-card)`
- Text: `var(--text-main)`
- Placeholder: `var(--text-muted)`
- Focus ring: use accent color with appropriate opacity

### 3.3 Cards & Panels
- Background: `var(--bg-card)`
- Border: `var(--border-card)`
- Text: `var(--text-main)` for headings, `var(--text-muted)` for secondary text
- Shadows should adapt to theme (darker in light mode, lighter in dark mode)

### 3.4 Modals & Dialogs
- Backdrop: semi-transparent overlay that works in both themes
- Modal background: `var(--bg-card)`
- Border: `var(--border-card)`
- All text uses theme variables

### 3.5 Navigation
- Header background: `var(--bg-header)`
- Links: `var(--text-main)` with accent color on hover/active
- Sidebar: `var(--sidebar-bg)` (may be theme-specific)

---

## 4. Icons & Illustrations

### 4.1 Icon Colors
- Use `var(--text-main)` or `var(--text-muted)` for icons
- Use `var(--accent-primary)` for accent icons
- Ensure icons remain visible in both themes

### 4.2 SVG Icons
- Use `currentColor` in SVG fills/strokes when possible
- For colored icons, use theme-aware CSS variables
- Consider dual-version SVGs if necessary for complex illustrations

### 4.3 Image Assets
- Ensure images have appropriate backgrounds or transparency
- Test images in both themes for visibility

---

## 5. Accessibility Requirements

### 5.1 Contrast Ratios
- **Minimum WCAG AA** (4.5:1 for normal text, 3:1 for large text)
- Test contrast in both dark and light themes
- Use tools like WebAIM Contrast Checker

### 5.2 Focus Indicators
- Visible in both themes
- Use accent colors: `var(--accent-primary)` with appropriate opacity
- Minimum 2px outline width

### 5.3 Interactive States
- Hover, focus, active states must be clear in both themes
- Use opacity changes, color shifts, or shadows
- Test keyboard navigation in both themes

---

## 6. Styling Best Practices

### 6.1 CSS Architecture
```css
/* ✅ Good: Theme-aware component */
.user-card {
  background: var(--bg-card);
  color: var(--text-main);
  border: 1px solid var(--border-card);
  padding: var(--space-4);
  border-radius: var(--radius-md);
}

.user-card__title {
  color: var(--text-main);
  font-size: var(--text-lg);
}

.user-card__subtitle {
  color: var(--text-muted);
  font-size: var(--text-sm);
}
```

### 6.2 Avoiding Hard-Coded Values
- ❌ Don't use: `background: #fff`, `color: black`, `border: 1px solid #000`
- ✅ Do use: `background: var(--bg-card)`, `color: var(--text-main)`, `border: 1px solid var(--border-card)`

### 6.3 Transitions
- Add smooth transitions for theme changes:
```css
.component {
  background: var(--bg-card);
  color: var(--text-main);
  transition: background-color 0.3s ease, color 0.3s ease;
}
```

---

## 7. Testing Checklist

Before considering any UI component complete:

- [ ] Component renders correctly in dark mode
- [ ] Component renders correctly in light mode
- [ ] All text is legible in both themes
- [ ] Interactive states (hover, focus, active) work in both themes
- [ ] Contrast ratios meet WCAG AA standards in both themes
- [ ] Icons and images are visible in both themes
- [ ] No hard-coded colors (use CSS variables)
- [ ] Theme transitions are smooth
- [ ] Keyboard navigation works in both themes

---

## 8. Common Patterns

### 8.1 Status Badges
```css
.status-badge {
  background: var(--chip-bg);
  color: var(--text-main);
  border: 1px solid var(--border-card);
  padding: 4px 12px;
  border-radius: 12px;
}

.status-badge--success {
  background: var(--accent-primary);
  color: var(--text-main);
}
```

### 8.2 Dividers
```css
.divider {
  border-top: 1px solid var(--border-card);
  margin: var(--space-4) 0;
}
```

### 8.3 Loading States
```css
.loading-spinner {
  border: 2px solid var(--border-card);
  border-top-color: var(--accent-primary);
}
```

---

## 9. Migration Guide

If you encounter components with hard-coded colors:

1. **Identify hard-coded values** — search for `#`, `rgb(`, `rgba(`, `black`, `white`
2. **Map to theme variables** — find the appropriate CSS variable
3. **Replace systematically** — update all instances
4. **Test both themes** — verify appearance and functionality
5. **Check contrast** — ensure accessibility standards are met

---

## 10. Design Deliverables

When creating UI mockups, wireframes, or design specifications:

- **Describe both themes** — explain how components appear in dark and light modes
- **Provide color tokens** — specify which CSS variables to use
- **Include contrast notes** — document accessibility considerations
- **Show variations** — demonstrate hover, focus, and active states in both themes

---

## 11. Resources

### Theme System Files
- `frontend/src/context/ThemeContext.jsx` — Theme context provider
- `frontend/src/index.css` — Core theme variables
- `frontend/src/components/**/*.css` — Component-specific theme styles

### Design Tokens
- `docs/03-frontend/32-design-tokens-and-theme-specification.md` — Full token specification

### Testing Tools
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- Chrome DevTools: Inspect element → Computed → Check color contrast

---

## 12. Enforcement

This guideline applies to:
- ✅ All new UI components
- ✅ All new pages and layouts
- ✅ All design mockups and specifications
- ✅ All CSS/styling updates
- ✅ All component refactors
- ✅ All design system updates

**No exceptions.** Every UI element must support both dark and light modes.

---

## 13. Questions & Support

If you're unsure about:
- Which CSS variable to use → Check `frontend/src/index.css`
- How to implement theme support → Review existing components
- Accessibility requirements → Refer to WCAG 2.1 AA standards
- Design patterns → See examples in `frontend/src/components/`

---

**Last Updated:** 2025-01-27  
**Version:** 1.0  
**Status:** Active & Mandatory
