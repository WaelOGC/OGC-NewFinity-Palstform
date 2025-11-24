# OGC NewFinity — Admin System Logs & Observability UI Specification (v1.0)



## 1. Introduction

This document defines the full UI/UX structure for the **Admin System Logs & Observability** module within the OGC NewFinity Admin Panel.



Admins must be able to:

- Monitor platform health  

- Inspect system logs  

- Track API errors  

- View performance metrics  

- Filter log streams  

- Investigate incidents  

- Export logs for debugging  

- Monitor security events  

- Check integration failures (email/SMS/payment)  



This module supports operational stability and is essential for diagnosing issues across the ecosystem.



---



# 2. Routing & Navigation



### Main Route:

`/admin/logs`



### Subroutes:

- `/admin/logs` → Logs Overview  

- `/admin/logs/errors` → Error Logs  

- `/admin/logs/requests` → Request Logs  

- `/admin/logs/security` → Security Events  

- `/admin/logs/integrations` → Email/SMS/Payment Logs  

- `/admin/logs/system` → System Events  

- `/admin/logs/:id` → Log Detail Viewer  



---



# 3. Logs Overview Page



### Page Header:

- Title: **"System Logs"**  

- Subtitle: System-wide operational insights  



### Summary Cards:

- Total errors past 24h  

- API request volume  

- Success vs failure rate  

- Security alerts  

- Integration issues  



### Quick Filters:

- Last 1h  

- Last 24h  

- Last 7 days  

- Last 30 days  



---



# 4. Log Table (Universal Structure)



All log tables share the same structure:



### Table Columns:

- Log ID  

- Level (Info / Warning / Error / Critical)  

- Category (Auth / Wallet / API / System / AI / DB / Notification / Integration)  

- Message (shortened preview)  

- Timestamp  

- User (if relevant)  

- Request ID (optional)  

- Actions  



### Table Features:

- Column sorting  

- Search bar  

- Filters panel  

- Pagination  

- Row expansion  

- Horizontal scroll (if needed)  



### Filters:

- Level  

- Category  

- Date range  

- User  

- Keyword  



---



# 5. Log Detail Viewer



Route:

`/admin/logs/:id`



Shows full log details including:

- Log ID  

- Level  

- Category  

- Timestamp  

- Full message text  

- Metadata (JSON viewer)  

- Request details (method, route, status code, response time)  

- User info (ID, email, IP)  

- Stack trace (if error)  

- Error code  

- Related logs (via Request ID correlation)  



### UI:

- Collapsible sections  

- Syntax-highlighted JSON  

- "Copy JSON" button  

- "Export Log" button  



---



# 6. Error Logs Page



### Purpose:

Focus on everything classified as:

- Error  

- Critical  



### Additional Filtering:

- API endpoint  

- Error code  

- Service name  



### UI:

- Errors highlighted in neon red  

- Critical errors have stronger highlight  

- Batch export option  



---



# 7. Request Logs Page



Tracks every API request.



### Table Columns:

- Request ID  

- Method  

- Endpoint  

- Status code  

- Response time  

- User  

- Timestamp  



### Features:

- Slow request highlight (>500ms)  

- Detailed inspector  

- Aggregated stats (future)  



---



# 8. Security Events Page



Tracks authentication and security actions such as:

- Failed logins  

- Suspicious behavior  

- Repeated failed attempts  

- Flagged accounts  

- Banned devices  

- Token invalidation events  

- RBAC violations  



### Security-Specific Fields:

- IP address  

- Country  

- Device info  

- Event type  

- Severity  



### UI:

- Severity color coding (green → info; red → critical)  

- Quick filters: "Critical only", "Failed Logins", "Account Flags"  



---



# 9. Integration Logs Page



Covers external services like:

- Email provider  

- SMS provider  

- Payment processor  

- Storage/CDN  

- AI gateway errors (future)  



### Table Columns:

- Integration type  

- Request ID  

- Status  

- Endpoint  

- Payload preview  

- Error message (if failed)  

- Timestamp  



### Admin Actions:

- Retry sending (email/SMS only)  

- View payload  

- View failure stack  



---



# 10. System Events Page



Covers internal system-level activity:

- Cron events  

- Background jobs  

- Task scheduler events  

- Worker failures  

- Maintenance mode  

- Deployment logs (optional future)  



### UI:

- Timeline-style log viewer (optional)  

- Category-based filters  

- Success/failure indicators  



---



# 11. Observability Metrics (Future)



This module will later support:

- CPU/RAM usage  

- Worker queue depth  

- API response time heatmaps  

- Error rate charts  

- Throughput metrics  

- Wallet sync performance  

- Email/SMS delivery rate graph  

- AI processing latency  



### UI:

- Recharts or lightweight chart components  

- Neon-accented performance charts  

- Auto-refresh toggle  



---



# 12. Export & Developer Tools



Admins must be able to:

- Export selected logs  

- Export filtered logs  

- Export entire tables (CSV/JSON)  



### Advanced Developer Tools (Future):

- "Open in DevTools Mode"  

- Correlate logs by Request ID  

- Real-time streaming logs  

- In-browser log tailing  



---



# 13. Alerting (Future Integration)



Admin UI must support future alerting features:

- Trigger alerts when error thresholds are reached  

- Email/SMS alert integration  

- Alert rules engine  

- Auto-alert for wallet sync failures  

- AI anomaly detection  



---



# 14. Empty & Error States



### Empty:

- "No logs found for this filter."  

- "No system events recorded."



### Error:

> "Unable to load logs. Try again later."



Retry must be available.



---



# 15. Visual Styling (Admin Theme)



### Aesthetic:

- Dark admin palette  

- Minimal neon usage  

- Strong level-based coloring:

  - Info → teal  

  - Warning → yellow  

  - Error → red  

  - Critical → neon pink/red  



### Components:

- Table-heavy layout  

- JSON viewer  

- Tabs  

- Filter drawer  



---



# 16. Responsive Behavior



### Desktop:

Full functionality.



### Tablet:

Collapsible filters + horizontal scroll.



### Mobile:

View-only mode.



---



# 17. Future Enhancements



- Real-time live log streaming  

- Universal search across logs  

- Developer mode toggle  

- Error clustering  

- "Show similar logs" AI feature  

- Performance observability dashboards  



---



# 18. Conclusion



This specification defines the admin-facing System Logs & Observability UI.  

It ensures administrators can monitor platform health, debug issues, and maintain operational stability across the OGC NewFinity ecosystem.

