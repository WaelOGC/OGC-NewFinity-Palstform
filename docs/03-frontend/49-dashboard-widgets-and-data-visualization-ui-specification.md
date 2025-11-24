# OGC NewFinity — Dashboard Widgets & Data Visualization UI Specification (v1.0)



## 1. Introduction

This document defines the UI/UX standards, layout patterns, interaction rules, and styling for **Dashboard Widgets** and **Data Visualization Components** across the OGC NewFinity ecosystem.



This applies to:

- Platform Dashboard  

- Wallet Dashboard  

- Challenge Hub analytics  

- Subscription usage charts  

- Activity summaries  

- Future reporting modules  



The goal is to ensure every chart, card, metric widget, and visualization follows a unified, futuristic, neon-tech aesthetic while remaining clean, readable, and high-performance.



---



## 2. Dashboard Widget Types



Widgets fall into the following categories:



### **2.1 Stat Widgets**

Simple KPI-style metrics:

- Total balance  

- Submissions count  

- Rewards earned  

- Daily activity  

- AI usage  



### **2.2 Chart Widgets**

- Line charts  

- Bar charts  

- Area charts  

- Pie/donut charts  

- Sparkline mini-charts  



### **2.3 Activity Widgets**

- Recent activity list  

- Mining timeline  

- Challenge participation history  



### **2.4 Compact Widgets**

- Notification summary  

- Quick shortcuts  

- Status indicators  



### **2.5 Interactive Widgets**

(Future)

- AI insight widgets  

- Predictive analytics  



---



## 3. Stat Widget Specification



Stat widgets must display:

- Icon  

- Title  

- Primary value  

- Secondary info (optional)  



### Visual Requirements:

- Transparent dark background  

- Neon border or glow accent  

- Large numeric typography  

- Icon on the left, stats on the right  

- Hover lift: `translateY(-2px)`  

- Animated value count-up (optional future)  



### Sizes:

- Small (1 column)  

- Medium (2 columns)  

- Large (full width)  



---



## 4. Chart Widget Specification



All charts must follow these rules:



### **4.1 Chart Library**

- Use a lightweight charting library (Recharts or Chart.js recommended)

- Neon line & accent colors  

- Smooth animation on load  

- Responsive behavior  



### **4.2 Line Chart Style**

- Gradient neon line  

- Glow on hover  

- Minimal gridlines  

- Rounded points  

- Tooltip with subtle background blur  



### **4.3 Bar Chart Style**

- Rounded bars  

- Neon color accents  

- Hover highlight  

- Soft shadows  



### **4.4 Donut / Pie Chart Style**

- Glow effects on selected segment  

- Inner value displayed in center  

- Minimal slices  



### **4.5 Sparkline Charts**

- Tiny line chart for quick stats  

- No axes  

- Neon micro-glow  

- Smooth curves  



---



## 5. Widget Layout Structure



Dashboard widgets follow a **12-column responsive grid**.



### Desktop:

- 3–4 widgets per row depending on size  

- Charts take 6–12 columns  

- Stat cards take 3–4 columns  



### Tablet:

- 2–3 widgets per row  

- Wider charts stack vertically  



### Mobile:

- All widgets full-width  

- Charts scrollable if needed  



Spacing:

gap: var(--space-6);

padding: var(--space-6);



yaml

Copy code



---



## 6. Interactive Behavior



### Hover Effects:

- Soft neon border glow  

- Slight scale  

- Tooltip reveal  



### Animations:

- Chart draw animation (200–600ms)  

- Fade-up for widget load  

- Count-up animation for numeric KPIs  



### Click Behavior (Optional):

Widgets may act as links to:

- Wallet  

- Challenges  

- Notifications  

- Submissions  

- Activity pages  



---



## 7. Wallet-Specific Visualizations



These widgets use the global standard but include wallet-specific styling:



### **7.1 Token Earnings Chart**

- Neon teal line  

- Daily/weekly/monthly selector  

- Glow effect intensity based on value  



### **7.2 Mining Timeline**

- Horizontal timeline  

- Neon dots representing events  

- Hover reveals event type/date  



### **7.3 Rewards Summary Widget**

- Shows total earned OGC  

- Earnings breakdown by category  



---



## 8. Challenge Hub Widgets



### **8.1 Participation Summary**

- Number of active challenges  

- Submissions count  

- Upcoming deadlines  



### **8.2 Challenge Performance Chart (Future)**

- Submission score progression  

- Voting distribution  

- Results summary  



---



## 9. Subscription Usage Widgets



### **9.1 AI Usage Bar**

- Displays how close user is to their limit  

- Neon color transitions:  

  - Green → safe  

  - Yellow → mid  

  - Red → near limit  



### **9.2 Feature Access Matrix (Future)**

- Grid visualizing available tools per plan  



---



## 10. Notification & Activity Widgets



### **10.1 Activity Feed Card**

- List of recent events  

- Icons per category  

- Hover details  



### **10.2 Notification Summary Card**

- Count of unread notifications  

- Categorized icons  



---



## 11. Error & Empty States



### Chart loading failure:

Show an error card:

> **"We couldn't load this data. Try again."**



### No activity:

> "No recent activity found."



### No statistics:

> "No data available for this period."



Empty-state cards must follow the standard empty-state design from previous documents.



---



## 12. Visual Design Standards



### Colors:

- White text  

- Transparent cards  

- Neon accents (#00FFC6 / #5864FF / #FFBC25 / #FF3CAC)  

- Charts use brand colors  



### Shadows & Borders:

- `var(--shadow-soft)`  

- `var(--glow-teal)`  

- `var(--glow-violet)`  



### Typography:

- Use global text tokens  

- Numeric values should be bold and large  



---



## 13. Performance Requirements



- Avoid heavy chart libraries  

- Use skeleton loaders while loading data  

- Only animate on first render  

- Virtualized lists for activity feed  



---



## 14. Future Enhancements



- AI-powered insights panel  

- User-customizable widget layouts  

- Drag-and-drop dashboard personalization  

- Preset dashboard configurations  

- Cross-service analytics (wallet + challenges + AI usage)  



---



## 15. Conclusion



This specification defines the complete data visualization and dashboard widget system for OGC NewFinity.  

Every metric, chart, and widget across the platform must follow this structure for brand consistency and long-term scalability.

