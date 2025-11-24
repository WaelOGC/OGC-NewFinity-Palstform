# Mermaid Diagram Validation Rules

Defines how CI/CD will validate Mermaid files.

---

## 1. Syntax Requirements

All diagrams must:

- Compile without errors

- Follow Mermaid v10+ syntax

- Use indentation properly

- Use sequenceDiagram, flowchart, classDiagram correctly

---

## 2. Format Requirements

Manual diagrams:

phase-X[.Y]--category--topic.mmd

Auto-generated diagrams:

`auto--<category>--<topic>.mmd`

---

## 3. Common Validation Errors

- Unclosed brackets

- Missing arrows (-->)

- Invalid participant names

