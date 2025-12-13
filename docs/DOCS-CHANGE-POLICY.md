# DOCS-CHANGE-POLICY.md
OGC NewFinity Platform — Documentation Change Governance (v1.0)

## 1. Purpose
This policy defines how documentation evolves within the OGC NewFinity Platform.
Documentation is treated as a system asset and must preserve historical context and architectural integrity.

## 2. Core Principle — Additive Only
All documentation changes must be additive.

Forbidden:
- Deleting content
- Rewriting existing meaning
- Silent edits
- Destructive refactors

Allowed:
- Appending new sections
- Adding clarifications as extensions
- Explicit deprecations
- Versioned expansions

Nothing is removed. Context is preserved.

## 3. Versioning Rules
Documentation uses semantic versioning:

vMAJOR.MINOR

- MAJOR: Structural or conceptual expansion
- MINOR: Additions or clarifications

Version updates must be explicit in document headers.

## 4. Extensions Model
All new ideas must be added as numbered extensions.

Format:
## Extension X — Title

Extensions must not modify earlier sections and must explicitly reference any superseded logic.

## 5. Deprecation Rules
Deprecated content is never deleted.

Required format:
> ⚠️ Deprecated as of vX.Y  
> Reason: explanation  
> Replacement: reference

## 6. Cross-Document Authority
Each domain has a single authoritative document.
Other documents may reference but never redefine authority.

## 7. Enforcement
- Undocumented changes are invalid
- Documentation governs code, not the reverse
- This policy applies to all content in /docs

## 8. Status
Policy Status: Active  
Enforcement: Strict
