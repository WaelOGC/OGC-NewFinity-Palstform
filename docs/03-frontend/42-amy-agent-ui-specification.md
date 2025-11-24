# OGC NewFinity — Amy Agent (AI Workspace) UI Specification (v1.0)



## 1. Introduction



This document defines the complete UI/UX specification for **Amy Agent**, the AI Workspace of the OGC NewFinity ecosystem.



Amy is a **standalone, full-screen AI studio** that lives under the same domain and authentication system as the rest of the platform, but operates as its **own dedicated application**.



Key principles:

- One user account across all services  

- Same auth layer, same identity, shared tokens  

- Separate frontends for: Platform, Amy, Wallet, Admin, etc.  

- Amy uses a **workspace model**, not a dashboard model  



Amy is designed for:

- Writing & content creation  

- Analysis & transformation  

- Planning & ideation  

- Technical assistance  

- Future multimodal tools  



This specification defines structure, layout, components, interactions, and visual behavior across the Amy AI workspace.



---



## 2. High-Level UX Concept



Amy is not "just a page"; it is a **creative control room**:



- Full-screen workspace  

- Dedicated AI tools panel  

- Input/Output split view  

- History of sessions  

- Tool presets & templates  

- Minimal navigation noise  

- Maximum focus on the work surface  



The experience must feel:

- Fast  

- Futuristic  

- Focused  

- Reliable  

- Stable across long sessions  



---



## 3. Application Entry & Routing



Amy Agent is accessed as a **separate app surface** under the same domain.



### Example Routes



- `/amy` — Main landing workspace  

- `/amy/tool/:toolId` — Specific tool workspace  

- `/amy/history` — Conversation and job history  

- `/amy/templates` — Presets and workflows (future)  

- `/amy/settings` — Amy-specific preferences  



Authentication is handled by the shared Auth layer:

- Users must be logged in  

- RBAC and subscription tiers are enforced (Free, Pro, Enterprise)  



If unauthenticated:

- Redirect to global login  

- Redirect back to `/amy` after successful auth  



---



## 4. Layout Architecture — Full-Screen Workspace



Amy uses a **3-zone workspace layout**:



| TOPBAR (AMY HEADER) |

| TOOL RAIL | WORKSPACE |

| (LEFT) | (CENTER + OPTIONAL RIGHT UTILITY PANEL) |

markdown

Copy code



### 4.1 Zones Overview



1. **Topbar (Header)**  

   - Amy logo / icon  

   - Active tool name  

   - Global AI usage indicator (tokens, rate, or status)  

   - Quick links: History, Templates, Settings  

   - User avatar + dropdown  



2. **Left Tool Rail**  

   - Vertical list of Amy tools  

   - Icons + labels on desktop  

   - Icons only on narrow viewports  

   - Persistent selection highlight  



3. **Main Workspace**  

   - Tool-specific UI  

   - Input panel  

   - Output panel  

   - Additional configuration area  

   - Optional right-hand "Meta / Info" panel  



---



## 5. Topbar Specification



### Content:



- **Left side:**

  - Amy logo / icon  

  - Text label: "Amy Agent"  

  - Current tool name (e.g., "Content Writer", "Analyzer", "Planner", etc.)  



- **Center (optional):**

  - Breadcrumb or context (tool category, workspace name)  



- **Right side:**

  - AI usage indicator (e.g., "Standard / Pro / Enterprise" or a simple usage bar)  

  - Navigation links:

    - `History`  

    - `Templates` (future)  

    - `Settings`  

  - User avatar dropdown  



### Behavior:



- Fixed at top  

- Slight transparency + subtle neon underline  

- Height: ~64px  

- Dark background using tokens, white text  



---



## 6. Left Tool Rail (Tool Selector)



The left rail is Amy's **primary navigation** inside the AI workspace.



### Content:



Each tool appears as an item with:

- Icon  

- Short label  

- Optional badge (e.g., "Pro")  



Example tools:

- "Ask Amy" (general assistant)  

- "Content Writer"  

- "Analyzer & Summarizer"  

- "Strategy & Planning"  

- "Developer Helper"  

- Future creative / multimodal tools  



### Behavior:



- Vertical rail fixed on the left  

- Selected tool highlighted with neon border and background glow  

- Hover: slight scale + glow  

- Click: switches workspace content (no full-page reload)  

- On mobile: collapses into an icon button → opens a slide-in tool selector  



---



## 7. Main Workspace Layout



Inside the workspace, each tool follows a **two-panel structure** with optional meta panel:



| TOPBAR |

| TOOL RAIL | INPUT PANEL | OUTPUT PANEL | META (opt)|

markdown

Copy code



At minimum:

- One panel for user input  

- One panel for AI output  



### 7.1 Input Panel



Used for:

- Prompts  

- Instructions  

- Context  

- Optional advanced settings  



Features:

- Large textarea or editor  

- Label + helper text  

- Optional fields: tone, length, style, audience, etc.  

- "Clear" action  

- "Run / Generate" primary button  



### 7.2 Output Panel



Displays:

- AI response(s)  

- Variations (if tool supports)  

- Copy buttons  

- Save / export options (future)  



Features:

- Scrollable content  

- Mono or content-optimized typography depending on tool type  

- Option to "Pin" outputs or keep multiple results in a list  



### 7.3 Optional Meta / Utility Panel



Used for:

- Token usage meta (future)  

- Prompt settings summary  

- Tool tips & guidance  

- AI usage metrics per tool  

- Saved presets for that tool (future)  



---



## 8. Core Screens & Modes



### 8.1 `/amy` — Default Workspace View



Displays:

- Recently used tool (auto-selected)  

- If first visit → simple "Welcome to Amy" intro with quick CTA:

  - "Start with Ask Amy"  

  - "Start with Content Writer"  

  - "Start with Analyzer"  



### 8.2 Tool Workspace Screen (`/amy/tool/:toolId`)



Each tool defines:

- Tool-specific label & description  

- Customized placeholder for the input panel  

- Optional tool form (dropdowns, toggles, checkboxes) for configuration  

- Standard Output area with consistent styling  



### 8.3 History Screen (`/amy/history`)



Shows:

- List of recent sessions / conversations  

- Each item: tool icon, brief summary, timestamp  

- Filter by tool  

- Click to re-open a past session in the workspace  



### 8.4 Templates Screen (Future) (`/amy/templates`)



Displays:

- Pre-built prompt templates  

- Categories (Content, Strategy, Code, etc.)  

- "Use this template" action that loads into the input panel  



### 8.5 Settings Screen (`/amy/settings`)



Contains:

- Preferences (e.g., default tool, default output format)  

- Display settings (density, font size options, future)  

- AI behavior preferences (formal/creative defaults, future)  



---



## 9. Interaction Patterns



### 9.1 Run / Generate Button



- Primary button at bottom or top-right of input panel  

- Label: "Run", "Generate", "Ask Amy" depending on tool  

- Shows loading spinner while AI is processing  

- Disabled while a request is running  



### 9.2 Streaming Responses (Future)



When streaming is available:

- Output panel shows content incrementally  

- Loading indicator visible at top of output area  

- "Stop" button appears while streaming  



### 9.3 Result Management



For each result:

- "Copy" button  

- (Future) "Save" button  

- (Future) "Send to Platform / Wallet / Challenge" actions  



---



## 10. Error & State Handling (Amy)



### Loading States:

- Input disabled during request  

- Output panel shows subtle "Working with you…" message  



### Error States:

- Network / API failure:

  - "We couldn't process your request. Please try again."  

- Tier restriction:

  - "This tool is only available on your current subscription plan."  



Errors should:

- Use standard toast + inline message combo  

- Never reveal internal technical errors  



---



## 11. Visual Design Guidelines



Amy shares the global theme but emphasizes a **focused studio feel**.



### Colors:

- Dark workspace background  

- White text  

- Neon accents used on:

  - Tool rail selection  

  - Primary buttons  

  - Input focus rings  



### Layout:

- Generous padding around the workspace  

- Inputs and output panels separated visually via borders & subtle glow  



### Motion:

- Smooth transitions when switching tools  

- Panels fade/slide in  

- No aggressive animation during AI streaming  



---



## 12. Responsive Behavior (Amy)



### Desktop:

- Full 3-zone layout (Tool Rail + Input + Output [+ Meta])  

- Panels side-by-side  



### Tablet:

- Tool rail collapses to icons  

- Input and Output may stack vertically or use a reduced side-by-side layout  



### Mobile:

- Tool rail hidden behind toggle  

- Input at top, Output below  

- Buttons full-width  

- History accessible via topbar  



---



## 13. Integration with Other NewFinity Services



Even though Amy is **a separate workspace**, the user identity and ecosystem are shared:



### From Platform:

- "Ask Amy" shortcuts may deep-link to `/amy` with prefilled context (future).  



### From Wallet:

- AI tools (future) might analyze transactions or mining stats (via secure context passing).  



### From Challenges / Submissions:

- Users might open Amy to brainstorm submission ideas.  



All such cross-links must:

- Navigate to `/amy`  

- Optionally pass initial context/payload  

- Respect user's subscription and rate limits  



---



## 14. Future Extensions



- Multimodal Amy (image/audio/video tools)  

- Multi-step workflows & pipelines  

- Agent-like memory per user session  

- Sharing & collaboration (send results to other users)  

- "Send to Platform" integration hooks  

- Amy-specific keyboard shortcuts  



---



## 15. Conclusion



This specification defines the official UI and behavioral blueprint for the **Amy Agent AI Workspace** within the OGC NewFinity ecosystem.



Amy is:

- A full-screen AI studio  

- A separate, focused environment  

- Fully aligned with NewFinity's brand  

- Powered by the shared identity, subscription, and rate-limit systems  



All Amy-related frontend work must comply with this specification to ensure a consistent, scalable, and future-proof AI experience.

