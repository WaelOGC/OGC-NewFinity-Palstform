# OGC NewFinity Platform — Amy Agent System Specification

**Version:** v1.0

**Maintained by:** OGC Technologies

**Status:** Active Documentation (Internal)**

## 1. Purpose

The Amy Agent is the unified AI system of the OGC NewFinity Platform.

Amy provides fast, modular, intelligent tools across writing, coding, business, creative design, productivity, and internal platform operations.

Amy is central to:

- User productivity
- Engagement
- Contribution scoring
- Badge progression
- Platform stickiness
- Future premium features (subscriptions)
- Automation (Phase 3)

This document defines Amy's full internal specification.

## 2. Amy System Overview

The Amy Agent consists of:

### 2.1 Tool Execution Engine

- Receives user input
- Routes requests to the correct AI model or handler
- Generates results
- Normalizes responses

### 2.2 Tool Registry

A structured list of all Amy tools.

Each tool includes:

- `id`
- `name`
- `category`
- `description`
- `input requirements`
- `output type`
- `reward profile`
- `subscription requirements`
- `status` (phase 1/2/3)

### 2.3 Interaction & Reward Engine

- Logs events
- Generates contribution points
- Updates badge progress
- Writes history (Phase 2)

### 2.4 Amy History Manager (Phase 2+)

Stores:

- Past requests
- Outputs
- Tool trace logs
- User notes

### 2.5 Automation Engine (Phase 3)

Allows:

- Multi-step workflows
- Scheduled tasks
- Complex recipes
- Auto-execution chains

## 3. Amy Phase Roadmap

**PHASE 1 — Present (MVP)**

- Instant tools
- No memory
- Only direct input/output
- Basic logging
- Contribution scoring
- Simple UI
- No advanced personalization

**PHASE 2 — Growth**

- Save history
- Re-run tools
- Favorites
- Amy skill levels (future)
- Smarter output formatting
- Multi-modal tools (image + text)
- Caching of prompts
- Subscription-enhanced tools

**PHASE 3 — Automation**

- Multi-step workflows
- Task scheduling ("Amy Automations")
- Workbench UI
- Save projects
- Agentic reasoning
- Tool chaining with variables
- Background tasks
- Team-based collaboration

## 4. Tool Categories (Master List)

### 4.1 Writing & Reading Tools

- Article writer
- Email writer
- Text summarizer
- Text expander
- Grammar fixer
- Tone converter

### 4.2 Code Tools

- Code generation
- Code debugging
- Code explanation
- API helper
- SQL assistant
- Regex builder

### 4.3 Creative Tools

- Design prompts
- Image descriptions
- Branding concepts
- Story prompts
- Character creation

### 4.4 Business Tools

- Market analysis
- Business planning
- Presentation builder
- SWOT analysis
- Product strategy

### 4.5 Productivity Tools

- Task breakdown
- Planning assistant
- Note converter
- Meeting summarizer
- Brainstorming generator

### 4.6 OGC System Tools

- Challenge helper
- Badge explainer
- Wallet info helper
- Contribution insights

### 4.7 Utility Tools

- Format converter
- Text cleaner
- List generator
- Keyword extractor

## 5. Amy Tool Specification (Template)

Each tool in the registry must define:

- `id`: unique ID
- `name`: tool name
- `category`: category label
- `description`: what the tool does
- `input_schema`: expected input fields
- `output_schema`: returned data
- `reward_profile`: contribution points
- `subscription`: required tier (free/standard/premium)
- `phase`: 1/2/3
- `status`: active/disabled

Tools must follow this specification.

## 6. Amy → Contribution → Wallet Flow

**Sequence:**

```
User runs a tool →
Amy executes model →
System logs action →
Contribution event created →
Contribution score increases →
Badges update →
Reward mapping (Phase 2+) →
Wallet updates
```

**Contribution Points (Default)**

| Tool Type | Points |
|-----------|--------|
| Writing | +5 |
| Code | +8 |
| Business | +6 |
| Design/Creative | +5 |
| Utility | +2 |
| OGC Platform Tool | +4 |

## 7. Amy UI Structure

Amy pages:

### 7.1 Main Page

`/ai-agent`

Contains:

- Categories
- Tool search
- Recently used tools (Phase 2)
- Favorites (Phase 2)

### 7.2 Tool Execution Page

`/ai-agent/:tool`

Contains:

- Tool header
- Input box
- Generate button
- Output container
- Retry button
- Copy/export actions
- Contribution earned summary

### 7.3 Amy History (Phase 2)

`/ai-agent/history`

- List of past tool sessions
- Re-run button
- Save results

## 8. Tool Execution Flow (Technical)

**Step-by-step:**

```
Frontend sends request →
Backend validates token →
Tool registry loads tool definition →
AI handler executes logic →
Response normalized →
Contribution event logged →
Badge progression checked →
Response delivered to frontend →
Frontend displays output
```

## 9. Backend Structure for Amy

**Controllers**

- Handle requests
- Validate inputs

**Services**

- Execute tool logic
- Route to correct AI model
- Apply reward logic

**Registry**

- Static JSON or DB-based
- Declares tool capabilities

**Logging**

- Writes to `ACTIVITY_LOG`

## 10. Security & Compliance

### 10.1 Input Sanitization

Strip:

- HTML
- Scripts
- Malicious payloads

### 10.2 Output Filtering

- Remove unsafe content
- No harmful instructions

### 10.3 Usage Limits (Phase 2+)

- Daily quota
- Premium unlimited usage

### 10.4 Admin Visibility

Admins can:

- View Amy usage
- Flag abusive activity
- Adjust contribution

## 11. Data Model

**Tools Table (Phase 2+)**

Stores tool definitions.

**Tool Logs**

Stored in `ACTIVITY_LOG` with event type:

- `AMY_TOOL_RUN`

**Amy History Table (Phase 2+)**

- `id`
- `user_id`
- `tool_id`
- `input`
- `output`
- `created_at`

## 12. Integration with Other Modules

| Module | Interaction |
|--------|-------------|
| Contribution | Logs events, increases score |
| Badges | Amy usage badges |
| Wallet | Rewards (Phase 2) |
| Challenges | AI challenge category |
| Admin | Moderation and logs |

## 13. Versioning & Maintenance

Update this document when:

- New tools are added
- Tool categories change
- Subscription tiers evolve
- Automation engine launches
- Logging structure changes

Log updates in `/docs/changelog.md`.

## 14. Linked Documents

- `/docs/contribution/contribution-system-spec.md`
- `/docs/badges/badges-and-levels-spec.md`
- `/docs/specs/subscription-system-spec.md` (future)
- `/docs/api/amy-api-blueprint.md` (future)
- `/docs/flows/platform-flows-overview.md`

