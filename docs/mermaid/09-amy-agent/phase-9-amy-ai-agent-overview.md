# Phase 09 – Amy AI Agent Overview (OGC NewFinity Platform)

## Objective

Define the architecture, workflow, and service integration of the Amy AI Agent — the AI-driven assistant powering automation, content generation, and intelligent operations inside the OGC NewFinity Platform.

## Core Concept

Amy AI Agent acts as the user's intelligent interface for:

- Writing, design, and development tools  
- Business planning and analytics  
- AI-based automation tasks  
- Interaction with data models and APIs within the platform  

## System Structure

1. **Frontend Interface**

   - Built into user dashboards as a modular workspace.  
   - React-based UI with chat-style input and multi-tool panel.  

2. **Service Orchestration Layer**

   - Manages communication between the frontend and backend AI services.  
   - Handles session tokens, user context, and model selection.  

3. **AI Engine Layer**

   - Integrates with OpenAI, custom fine-tuned models, and future OGC AI endpoints.  
   - Modular structure for toolchains: writing, code, design, and research.  
   - Each service operates in a sandboxed runtime for safety.  

4. **Backend Controller**

   - Built on Node.js (Express) with async queue handling.  
   - Manages user sessions, request logging, and billing tokens.  

5. **Database Integration**

   - Stores prompts, outputs, logs, and AI usage statistics.  
   - Linked with `ai_logs` and `users` tables (Phase 07).  

## AI Tools Suite

- **Writing Tools:** Blog writer, summarizer, paraphraser.  
- **Design Tools:** Image concept generator, creative brief builder.  
- **Development Tools:** Code explainer, generator, and API doc assistant.  
- **Business Tools:** Project planner, market analysis assistant.  

## Governance & Access

- User access determined by subscription tier (Phase 8.3).  
- AI requests authenticated via user token.  
- Admin monitoring enabled through Governance module (Phase 06).  
- Logs automatically pushed to analytics (Phase 8.8).  

## Security Measures

- Input sanitization before model calls.  
- Output filtering for prohibited or sensitive content.  
- Token usage limits per subscription.  
- Pseudonymized storage of AI logs to protect user data.  

## Diagram Placeholder

Upcoming Mermaid diagrams:

- Amy AI System Architecture  
- AI Request Sequence Flow  
- Integration Map with APIs and Database  

## Deliverables

- Architecture and workflow diagrams  
- Model integration sequence  
- Data flow and orchestration map  
- Access policy schema  

## Dependencies

- Connects to Data Models (Phase 07) and API Contracts (Phase 08).  
- Uses the Security Framework (Phase 02) for content protection.  
- Reports analytics to Phase 8.8 (Usage API).  

## Status

Draft – Foundation complete; diagrams and model integration maps will follow in later steps.

