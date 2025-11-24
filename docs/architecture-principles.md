---
id: architecture-principles
title: OGC NewFinity Platform — Documentation Architecture Principles
sidebar_label: Architecture Principles
---

# OGC NewFinity Platform — Documentation Architecture Principles

These principles define how documentation must be designed, structured, and maintained across the OGC NewFinity Platform.  
All contributors must follow these standards to keep documentation scalable, readable, and future-proof.

---

## 1. Clarity First

Documentation must be immediately understandable by any developer, even without prior knowledge of the system.

Rules:

- Write in simple, direct language.
- Avoid unnecessary technical jargon.
- Provide context before details.

---

## 2. Single Source of Truth

Each topic should exist in only one place.

Rules:

- Do not duplicate content across files.
- Link to the correct source instead of rewriting information.
- Keep central indexes updated.

---

## 3. Predictable Structure

All documentation should follow a consistent pattern.

Rules:

- Use the existing folder hierarchy:  
  docs/  
  ├── mermaid/  
  ├── quickstart.md  
  ├── developer-onboarding.md  
  ├── structure-map.md  
  └── documentation-overview.md  
- Do not invent new folder patterns without approval.

---

## 4. Scalability

Documentation must support large, long-term projects.

Rules:

- Keep each file focused on a single topic.
- Use modular diagrams and subfolders.
- Avoid massive "everything in one file" documents.

---

## 5. Naming Consistency

All documentation and diagrams must follow strict naming conventions.

Rules:

- Mermaid diagrams:  
  phase-X[.Y]--category--topic.mmd
- File names: lowercase, no spaces, no timestamps.
- Folders: lowercase, descriptive, stable.

---

## 6. Visual Hierarchy

Documentation should be easy to scan quickly.

Rules:

- Use headings (H1–H3) consistently.
- Use bullet points for clarity.
- Use code blocks for structure trees.
- Use tables sparingly but effectively.

---

## 7. Accuracy and Alignment

Documentation must always reflect the current architecture.

Rules:

- Update diagrams when changing backend or frontend logic.
- Update docs when new services, modules, or flows are added.
- Maintain alignment between diagrams and actual implementation.

---

## 8. Version Awareness

Changes must be traceable.

Rules:

- All major changes must be recorded in docs/changelog.md.
- Do not delete previous changelog entries.
- Document versioning should be incremental and clear.

---

## 9. Automation Support

Documentation must work well with automation tools like Cursor.

Rules:

- Follow .cursor/context/naming-rules.md
- File structures and names must remain predictable.
- Avoid patterns that confuse automated agents.

---

## 10. Ownership

Documentation must always have an accountable owner.

Rules:

- Large changes require the documentation owner's approval.
- Contributors must follow existing rules.
- All updates must be organized and clean.

---

End of principles.

