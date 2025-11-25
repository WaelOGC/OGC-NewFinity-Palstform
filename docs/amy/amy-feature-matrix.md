# OGC NewFinity Platform — Amy Agent Feature Matrix

**Version:** v1.0

**Maintained by:** OGC Technologies

**Status:** Active Documentation (Internal)**

## 1. Purpose

This document provides a detailed feature matrix for all Amy Agent tools, organized by category, purpose, requirements, availability, reward profile, and subscription access level.

It expands the Amy System Specification by giving a clear, structured breakdown of:

- Tool behaviors
- Tool capabilities
- User-facing features
- Backend/AI requirements
- Phase 1 / Phase 2 / Phase 3 availability

This matrix becomes the master reference for AI tool development.

## 2. Feature Matrix Legend

| Column | Description |
|--------|-------------|
| Category | Tool category |
| Tool | Tool name |
| Description | What the tool does |
| Input | Required input |
| Output | Output type |
| Reward | Contribution points |
| Tier | Subscription requirement |
| Phase | 1 / 2 / 3 |
| Status | active / future |

## 3. Writing & Reading Tools

| Tool | Description | Input | Output | Reward | Tier | Phase | Status |
|------|-------------|-------|--------|--------|------|-------|--------|
| Article Writer | Generates structured articles | Topic | Multi-section text | +5 | Free | 1 | active |
| Email Writer | Writes professional emails | Context | Email text | +5 | Free | 1 | active |
| Text Summarizer | Summarizes long text | Long text input | Summary | +4 | Free | 1 | active |
| Grammar Fixer | Corrects grammar | Raw text | Corrected text | +3 | Free | 1 | active |
| Tone Converter | Changes tone | Text + tone | Rewritten text | +4 | Standard | 2 | future |
| Creative Story Generator | Generates creative writing | Prompt | Story | +6 | Free | 1 | active |

## 4. Code Tools

| Tool | Description | Input | Output | Reward | Tier | Phase | Status |
|------|-------------|-------|--------|--------|------|-------|--------|
| Code Generator | Writes code | Description | Code | +8 | Free | 1 | active |
| Code Debugger | Explains & fixes code | Code snippet | Explanation + fixed code | +8 | Free | 1 | active |
| SQL Assistant | Generates queries | Requirements | SQL query | +6 | Free | 1 | active |
| API Helper | Builds endpoint templates | Description | API example | +5 | Free | 1 | active |
| Regex Builder | Builds regex | Requirements | Regex | +4 | Free | 1 | active |
| Code Interpreter | Runs multi-step reasoning | Input + context | Explanation + output | +10 | Premium | 3 | future |

## 5. Creative Tools

| Tool | Description | Input | Output | Reward | Tier | Phase | Status |
|------|-------------|-------|--------|--------|------|-------|--------|
| Branding Concepts | Generates brand ideas | Theme | Concepts | +5 | Free | 1 | active |
| Image Description Generator | Describes images | Image/prompt | Description text | +3 | Free | 1 | active |
| Design Prompt Generator | Generates prompts | Idea | Detailed prompts | +5 | Free | 1 | active |
| Character Creator | Creates character descriptions | Attributes | Character profile | +6 | Free | 1 | active |

## 6. Business Tools

| Tool | Description | Input | Output | Reward | Tier | Phase | Status |
|------|-------------|-------|--------|--------|------|-------|--------|
| Market Analysis | Market insights | Industry | Research summary | +6 | Standard | 2 | future |
| Business Plan Builder | Create business plans | Idea | Multi-section plan | +8 | Premium | 3 | future |
| SWOT Analysis | SWOT chart | Business context | SWOT breakdown | +5 | Free | 1 | active |
| Product Strategy Writer | Product strategies | Idea | Strategy outline | +6 | Free | 1 | active |

## 7. Productivity Tools

| Tool | Description | Input | Output | Reward | Tier | Phase | Status |
|------|-------------|-------|--------|--------|------|-------|--------|
| Task Breakdown | Breaks down tasks | Goal | Task hierarchy | +4 | Free | 1 | active |
| Planner | Creates plans | Task + time | Schedule | +3 | Free | 1 | active |
| Note Converter | Converts messy notes | Raw notes | Clean summary | +3 | Free | 1 | active |
| Meeting Summarizer | Summaries meetings | Transcript | Summary | +4 | Standard | 2 | future |

## 8. OGC Platform Tools

| Tool | Description | Input | Output | Reward | Tier | Phase | Status |
|------|-------------|-------|--------|--------|------|-------|--------|
| Challenge Helper | Helps users understand challenges | Challenge ID | Instructions | +4 | Free | 1 | active |
| Badge Explainer | Explains badges | Badge ID | Explanation | +3 | Free | 1 | active |
| Contribution Insights | Shows contribution logic | User ID | Insights | +3 | Free | 1 | active |
| Wallet Insights | Wallet explanation | User ID | Breakdown | +3 | Free | 1 | active |

## 9. Utility Tools

| Tool | Description | Input | Output | Reward | Tier | Phase | Status |
|------|-------------|-------|--------|--------|------|-------|--------|
| Format Converter | Converts formats | Text | Reformatted text | +2 | Free | 1 | active |
| List Generator | Generates lists | Topic | Bullet list | +2 | Free | 1 | active |
| Keyword Extractor | Extracts keywords | Text | Keywords | +2 | Free | 1 | active |
| Cleaner (Remove Noise) | Cleans text | Messy text | Clean text | +2 | Free | 1 | active |

## 10. Future Tools (Phase 2–3)

### 10.1 Phase 2

- Smart re-run
- Project folders
- Favorites
- Multi-modal tools
- History
- Enhanced graphs

### 10.2 Phase 3

- Multi-step workflows
- Scheduling automations
- Variable-based tool chaining
- Marketplace (future)

## 11. Versioning & Maintenance

Update this document when:

- New tools are added
- Subscription tiers change
- Reward profiles evolve
- Automation features launch

Document changes in `/docs/changelog.md`.

## 12. Linked Documents

- `/docs/amy/amy-system-spec.md`
- `/docs/contribution/contribution-system-spec.md`
- `/docs/badges/badges-and-levels-spec.md`
- `/docs/specs/subscription-system-spec.md` (future)

