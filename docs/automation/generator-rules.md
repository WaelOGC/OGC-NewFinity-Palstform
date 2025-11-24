# Diagram Generator Rules — OGC NewFinity Platform

These rules define how automated tools (scripts, Cursor Agents, CI pipelines) should generate and manage diagrams.

---

## 1. Generation Location

All auto-generated diagrams must be placed inside:

docs/automation/generated/

Do not place auto-generated files in the main documentation folders.

---

## 2. Naming Standards

Auto-generated diagrams use:

`auto--<category>--<topic>.mmd`

Examples:

- auto--api--route-tree.mmd
- auto--wallet--integration-flow.mmd
- auto--db--schema.mmd

---

## 3. Regeneration Rules

- Auto-generated files may be overwritten at any time.
- Human-edited diagrams must NEVER be overwritten.
- Automation must not delete manual diagrams.

---

## 4. Required Documentation Updates

Every automation cycle must:

1. Validate Mermaid syntax  
2. Update this list in docs/automation/auto-diagrams.md  
3. Add entries to docs/changelog.md if major updates occur  

---

## 5. Cursor Agent Compliance

Cursor Agents generating diagrams must follow:

- .cursor/context/naming-rules.md  
- .cursor/context/agent-guidelines.md  

---

End of rules.

