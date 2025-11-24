# Auto-Generated Diagrams — OGC NewFinity Platform

This document defines how automated Mermaid diagrams will be generated using scripts, Cursor Agent automation, or future CI/CD workflows.

---

## Purpose

Auto-generated diagrams ensure that architecture, API routes, database models, and component trees remain synchronized with the codebase.

---

## Types of Supported Auto-Diagrams

### 1. API Route Maps

Generated from backend route definitions:

- Endpoint
- Method
- Auth requirements
- Services involved

### 2. Database Schema Diagrams

Generated from Prisma schema:

- Models
- Relations
- Constraints
- Indexes

### 3. UI Component Tree

Generated from the React component structure:

- Layout components
- Page components
- Shared UI

### 4. System Sequence Diagrams

Generated from service interactions:

- Auth service
- Wallet service
- Amy AI Agent routing
- Challenge/Badge flow

---

## Output Folder Rules

Auto-generated diagrams must be stored in:

docs/automation/generated/

This folder will be created automatically by scripts or agents.

---

## Naming Rules

Generated files must follow:

`auto--<category>--<topic>.mmd`

Examples:

- auto--api--route-map.mmd  
- auto--db--schema.mmd  
- auto--ui--component-tree.mmd  

---

End of document.

