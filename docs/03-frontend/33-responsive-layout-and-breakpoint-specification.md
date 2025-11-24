# OGC NewFinity — Responsive Layout & Breakpoint Specification (v1.0)



## 1. Introduction

This document defines the responsive layout system used in all OGC NewFinity front-end interfaces.  

It ensures consistent behavior across:

- Desktop  

- Tablet  

- Mobile  

- Ultra-wide screens  



This specification applies to:

- Main Platform Dashboard  

- Admin Panel  

- Challenge Hub  

- Wallet Dashboard  

- AI Agent (Amy)  

- Profile & Subscriptions  



The goal: **predictable, scalable, and visually stable layouts across all viewports.**



---



# 2. Breakpoint Tokens



--bp-xs: 360px; /* Small mobile /

--bp-sm: 480px; / Standard mobile /

--bp-md: 768px; / Tablet portrait /

--bp-lg: 1024px; / Tablet landscape / small desktop /

--bp-xl: 1280px; / Standard desktop /

--bp-2xl: 1440px; / Large desktop /

--bp-3xl: 1600px; / Ultra-wide */



yaml

Copy code



These breakpoints match modern device classes and ensure optimal rendering.



---



# 3. Container Width Rules



### Desktop (≥ 1280px)

max-width: 1280px;

margin: auto;

padding: 0 var(--space-6);



shell

Copy code



### Large Desktop (≥ 1440px)

max-width: 1440px;



yaml

Copy code



### Ultra-wide (≥ 1600px)

Layouts should:

- Maintain max width  

- Add side gradients or empty breathing space  



---



# 4. Grid System



### 12-column responsive grid

Used across dashboards and admin screens.



columns: 12;

gutter-width: var(--space-4);



yaml

Copy code



### Mobile Grid (≤ 480px)

- Collapse to 1–2 columns  

- Vertical stacking  

- Minimal padding  



### Tablet Grid (768px)

- 6–8 columns  

- Sidebar collapses to icon-only  



### Desktop Grid (1280px+)

- Full 12-column grid  

- Standard feature layout  



---



# 5. Spacing Behavior per Breakpoint



| Breakpoint | Page Padding | Card Padding | Component Spacing |

|-----------|--------------|--------------|-------------------|

| XS | 12px | 12px | Tight |

| SM | 16px | 16px | Medium |

| MD | 20px | 20px | Standard |

| LG | 24px | 24px | Comfortable |

| XL & above | 32px | 24–32px | Spacious |



All components must use spacing tokens — **no hard-coded values**.



---



# 6. Typography Scaling



### Mobile (≤ 480px)

text-xl → text-lg

text-3xl → text-2xl

text-4xl → text-3xl



yaml

Copy code



### Tablet

Standard text sizes.



### Desktop

Use full scale:

- Headers large  

- Body readable  



---



# 7. Sidebar Responsiveness



### Desktop

- Full sidebar  

- Icons + labels  



### Tablet

- Collapsed sidebar  

- Icons only  

- Expandable drawer on hover  



### Mobile

- Hidden by default  

- Opens via hamburger menu  



---



# 8. Topbar Behavior



### Desktop

- Full topbar  

- Notification bell  

- Avatar dropdown  



### Mobile

- Condensed  

- Overflow menu  

- Icon-based navigation  



---



# 9. Card Behavior



### Desktop

- Grid of cards  

- Hover effects  

- Embellished neon borders  



### Mobile

- Cards stack vertically  

- Glow effects reduced  

- Buttons full-width  



---



# 10. Charts & Data Visualization



### Mobile

- Scrollable horizontally  

- Minimal labels  



### Tablet

- Moderate label density  



### Desktop

- Full chart rendering  

- Legends + tooltips  



---



# 11. Tables



### Mobile

- Collapse into vertical rows  

- Use accordion pattern  

- Label-value blocks  



### Tablet

- 2–4 visible columns  

- Horizontal scroll  



### Desktop

- Full table  

- Sortable columns  

- Pagination visible  



---



# 12. Image & Media Scaling



Rules:

- Use `object-fit: cover`  

- Responsive aspect ratio (`aspect-ratio` token)  

- Auto-compress for mobile  

- Lazy-load on large lists  



---



# 13. Form Responsiveness



### Mobile

- Single column  

- Full-width inputs  

- Larger touch zones  



### Desktop

- Two-column forms where applicable  



---



# 14. Component Responsiveness Summary



| Component | Desktop | Mobile |

|----------|---------|--------|

| Sidebar | Expanded | Hidden |

| Cards | Grid | Vertical stack |

| Charts | Full | Scrollable |

| Tables | Full | Accordion |

| Header Text | Larger | Scaled down |

| Buttons | Standard | Full-width |

| Modals | Centered | Fullscreen slide-up |



---



# 15. Future Extensions



- React Native unified breakpoint map  

- Fluid typography system  

- AI-assisted layout autoscaling  

- Multi-pane layouts for ultra-wide monitors  

- Dynamic grid rearrangement based on user behavior  



---



# 16. Conclusion

This specification defines how the entire NewFinity interface adapts to all screen sizes.  

By following these rules, the platform remains clean, accessible, and visually consistent across devices.

