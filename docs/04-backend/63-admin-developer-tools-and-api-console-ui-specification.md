# OGC NewFinity — Admin Developer Tools & API Console UI Specification (v1.0)



## 1. Introduction

This document defines the UI/UX for the **Developer Tools & API Console** used by administrators and internal developers to test, debug, explore, and validate API endpoints and system behaviors within OGC NewFinity.



This module enables:

- API endpoint exploration  

- Request/response testing  

- Header and token validation  

- Real-time logging  

- Webhook testing  

- Internal API documentation preview  

- Sandbox mode for safe testing  



This is an internal-only tool accessible only by high-level admin roles.



---



# 2. Routing & Navigation



### Main Route:

`/admin/devtools`



### Subroutes:

- `/admin/devtools/api-console`  

- `/admin/devtools/webhooks`  

- `/admin/devtools/sandbox`  

- `/admin/devtools/env`  

- `/admin/devtools/internal-docs`  



---



# 3. Developer Tools Overview Page



### Contains:

- System overview  

- Recent API requests (admin-only feed)  

- Links to:

  - API Console  

  - Webhook Tester  

  - Sandbox Mode  

  - System Environment Viewer  

  - Internal API Documentation  



---



# 4. API Console



Route:

`/admin/devtools/api-console`



This is the most important developer tool.



### Layout:

| Endpoint Selector | Method Dropdown |

| Headers Panel | Auth Token Box |

| Request Body Editor (JSON) |

| Send Request Button |

| Response Viewer (JSON + Status + Time) |

yaml

Copy code



---



## 4.1 Endpoint Selector



Features:

- Autocomplete endpoint search  

- Grouped by services:

  - Auth  

  - Wallet  

  - Challenges  

  - Submissions  

  - Notifications  

  - AI Gateway  

  - Admin APIs  



---



## 4.2 Method Dropdown



Supported methods:

- GET  

- POST  

- PUT  

- PATCH  

- DELETE  



UI must prevent unsafe methods unless sandbox mode is enabled.



---



## 4.3 Headers Panel



Default headers prepopulated:

Content-Type: application/json

Authorization: Bearer <admin-token>



yaml

Copy code



Users can:

- Add/Remove header rows  

- Toggle headers on/off  



---



## 4.4 Auth Token Box



Admins can:

- Paste a token  

- Use active session token  

- Use test token (sandbox)  



Warnings appear if token is expired or invalid.



---



## 4.5 Request Body Editor



- JSON editor with syntax highlighting  

- Auto-format button  

- Error checker  

- Template examples for common requests  



---



## 4.6 Response Viewer



Displays:

- Status code  

- Response time  

- Headers  

- JSON payload  

- Raw data  



Features:

- Pretty JSON  

- Raw response toggle  

- Copy buttons  



---



# 5. Webhook Testing Tool



Route:

`/admin/devtools/webhooks`



### Features:

- Generate test webhook events  

- Choose event type:

  - Submission approved  

  - Reward distributed  

  - Subscription renewed  

  - Notification sent  

  - System alert  



Fields:

- Target URL  

- Secret token  

- Event payload editor  



Actions:

- Send test event  

- Send multiple events  

- View delivery logs  



Logs table:

- Delivery ID  

- Event type  

- Status  

- Response code  

- Response body  



---



# 6. Sandbox Mode



Sandbox mode prevents real data modification.



### Toggle:

`Enable Sandbox Mode`



When enabled:

- All write operations are redirected  

- No database modifications  

- No notifications sent  

- Wallet operations are simulated  

- Warning banner shown at top of screen  



Sandbox must mimic real responses for developer testing.



---



# 7. Environment Viewer



Route:

`/admin/devtools/env`



Displays:

- Current environment (DEV / STAGE / PROD)  

- API version  

- Build number  

- Feature flags  

- AI gateway model versions  

- Service statuses  



Security:

- Sensitive values must be masked  

- Only visible to super admins  



---



# 8. Internal API Documentation



Route:

`/admin/devtools/internal-docs`



Displays:

- Full internal API spec (auto-generated)  

- Endpoint descriptions  

- Input/output schemas  

- Error codes  

- Example requests  

- Example responses  

- Rate limit rules per endpoint  



Must stay visually aligned with:

- API Architecture & Endpoint Inventory document  

- All API Contract documents  



---



# 9. Safety Rules



### Dangerous operations require:

- Sandbox mode  

- Confirmation modal  

- Admin authentication  

- Two-step approval for destructive writes (future)  



### Logs required for:

- Every request  

- Every webhook event  

- Sandbox toggles  

- Endpoint changes  



---



# 10. Permission Levels



Only:

- Senior Admin  

- System Admin  

- Super Admin  



can access Developer Tools.



Other roles are strictly prohibited.



---



# 11. Empty & Error States



### Empty:

> "No requests sent yet."



### Error:

> "Unable to reach API endpoint."



Errors must show:

- Status  

- Response body  

- Recommendations  



---



# 12. Visual Styling (Admin Theme)



### Aesthetic:

- Professional dark admin UI  

- High-density data panels  

- Minimal neon accenting  

- JSON viewer with syntax highlighting  

- Warning banners for sandbox mode  



---



# 13. Responsive Behavior



### Desktop:

Full console experience.



### Tablet:

Console collapses panels.



### Mobile:

Blocked — Developer Tools are not accessible.



---



# 14. Future Enhancements



- Real-time API request stream  

- Performance benchmark tests  

- Load test simulator  

- AI-assisted request builder  

- Endpoint deprecation visualizer  

- Websocket tester  

- Database exploration (read-only)  



---



# 15. Conclusion



This specification defines the full Developer Tools & API Console interface used by OGC NewFinity administrators.  

It enables internal debugging, testing, and system validation while preserving safety and system integrity.

