# Documentation Change Policy

**Authoritative Policy for All Documentation Changes**  
**Version 1.0**  
**Effective Date: 2024**

---

## 1️⃣ Purpose & Scope

### Why This Policy Exists

This policy was established to prevent unintended deletion, replacement, or loss of core project documentation. Documentation within this repository represents the project's institutional memory, design decisions, architectural intent, and operational knowledge. It is not disposable text that can be casually rewritten or replaced.

A previous documentation task resulted in the unintended deletion and replacement of core admin documentation. This policy ensures such incidents never occur again.

### Scope

This policy applies to **all documentation** located under `/docs/**` and any documentation-related files within the OGC NewFinity Platform repository, including:

- All Markdown files (`.md`)
- Documentation directories and subdirectories
- README files
- Specification documents
- Architecture documentation
- Process and workflow documentation
- API documentation
- Vision and planning documents

### Documentation as Project Memory

Documentation in this repository is considered:

- **Project Memory**: Historical record of decisions, implementations, and evolution
- **Design Intent**: Authoritative source of why systems were built the way they were
- **Institutional Knowledge**: Critical information that must persist across team changes
- **Reference Material**: Source of truth for developers, administrators, and stakeholders

Documentation is **not** disposable content that can be replaced with "improved" versions. It must be preserved and extended, never deleted or rewritten.

---

## 2️⃣ Core Principle — Preserve First, Extend Second

### Primary Principle

**Existing documentation must never be deleted or replaced.**

All future documentation work must be **additive by default**. New content extends existing documentation; it does not replace it.

### Operational Rules

- ✅ **Allowed**: Appending new sections, adding extensions, clarifying with additional notes
- ⚠️ **Restricted**: Editing existing text for clarity (requires explicit approval)
- ❌ **Forbidden**: Deletions, replacements, restructuring, consolidation, or rewriting

### Refactoring and Rewriting

Refactoring or rewriting existing documentation is **forbidden** unless explicitly approved by the project owner. Approval must be obtained **before** any destructive changes are considered, let alone executed.

---

## 3️⃣ Change Classification System

All documentation changes must be classified into one of three categories:

### ✅ Additive Changes (Default / Allowed)

**Definition**: Changes that add new content without removing or altering existing content.

**Examples**:
- Appending new sections to existing documents
- Adding notes, extensions, or clarifications
- Creating new documentation files for new topics
- Adding examples, use cases, or implementation notes
- Extending existing sections with additional detail

**Process**: Additive changes may proceed without special approval, provided they follow the Unified-File & Numbered Extension Strategy (Section 4).

### ⚠️ Modifying Changes (Restricted)

**Definition**: Changes that edit existing text for clarity, correction, or minor updates while preserving the original intent and structure.

**Examples**:
- Fixing typographical errors
- Clarifying ambiguous wording
- Updating outdated references (e.g., version numbers, URLs)
- Correcting factual errors

**Process**: Modifying changes require:
1. Explicit identification of what is being modified and why
2. Preservation of original intent and meaning
3. Review and approval before execution
4. Documentation of the change reason

**Note**: If uncertainty exists about whether a change is "modifying" or "destructive," treat it as destructive and seek approval.

### ❌ Destructive Changes (Forbidden)

**Definition**: Changes that remove, replace, restructure, consolidate, or fundamentally alter existing documentation.

**Examples**:
- Deleting sections, paragraphs, or entire files
- Replacing content with "improved" versions
- Restructuring document organization
- Merging files or consolidating content
- Rewriting sections to "improve clarity" (unless content is preserved)
- Removing "outdated" or "redundant" content

**Process**: Destructive changes are **forbidden by default**. They may only proceed if:
1. Explicit approval is obtained from the project owner
2. The original content is archived before deletion
3. A clear migration plan is documented
4. The change is reviewed and approved by stakeholders

**Violation**: Any destructive change executed without explicit approval is a policy violation and must be immediately reversed.

---

## 4️⃣ Unified-File & Numbered Extension Strategy

### Core Principle

Core topics (e.g., Admin, Auth, Governance, Architecture) should live in **a single primary document** whenever possible. New ideas, extensions, or future expansions must be added as **numbered sections** within that document.

### Strategy Details

**Example Structure**:

```markdown
# Core Topic Document

## Section 150 — Existing content
[Original content preserved]

## Section 151 — New Addition
[New content added here]

## Section 152 — Future Enhancement
[Planned or future content]
```

### Mandatory Process Before Adding New Content

Before adding a new numbered section:

1. **Full Document Review**: The entire document must be reviewed (scanned) to ensure the idea does not already exist
2. **Redundancy Check**: Verify that similar concepts are not already documented elsewhere
3. **Reference, Not Duplication**: If related content exists, reference it rather than duplicating it
4. **Number Assignment**: Assign the next sequential section number
5. **Clear Labeling**: Clearly label new sections with their purpose (e.g., "Extension", "Planned", "Future", "Enhancement")

### Benefits

This strategy ensures:

- **Historical Continuity**: Original content and context are preserved
- **No Fragmentation**: Related content stays together in a single source of truth
- **No Accidental Loss**: Context and relationships are maintained
- **Clear Evolution**: The history of ideas and decisions is visible in the document structure
- **Easy Navigation**: Sequential numbering makes it easy to find and reference sections

### When to Create New Files

New files should only be created when:

- The topic is entirely new and does not fit into an existing core document
- The topic is sufficiently distinct that it warrants separate documentation
- The topic is large enough that it would make a core document unwieldy

**Note**: When creating new files, ensure they reference related documentation and do not duplicate existing content.

---

## 5️⃣ Protected Documentation Domains

The following documentation categories are **additive-only**. These domains may only be extended, never rewritten, deleted, or replaced:

### Protected Categories

1. **Admin & Control Panel Documentation**
   - Admin tools and interfaces
   - Admin roles and permissions
   - Admin workflows and processes
   - Admin dashboard specifications

2. **Architecture & System Foundations**
   - System architecture overviews
   - Platform foundations
   - Core system specifications
   - Design patterns and principles

3. **Security, Authentication, Authorization**
   - Authentication systems
   - Security architectures
   - Authorization models
   - Security policies and procedures

4. **Governance, Tokenomics, Policies**
   - Governance systems
   - Tokenomics specifications
   - Policy documents
   - Regulatory and compliance documentation

5. **Roadmaps, Phases, and Vision Documents**
   - Product roadmaps
   - Development phases
   - Vision and planning documents
   - Strategic direction documents

### Extension Requirements for Protected Domains

For protected documentation domains:

- ✅ New sections may be added following the numbered extension strategy
- ✅ Clarifications and examples may be appended
- ✅ Future enhancements may be documented in designated sections
- ❌ Historical sections may not be modified or deleted
- ❌ Original content may not be replaced with "improved" versions
- ❌ Documents may not be restructured or consolidated

---

## 6️⃣ Mandatory Rules for AI Tools (Cursor / LLMs)

This section provides explicit instructions for any AI tool (including Cursor, LLMs, or automated documentation generators) working with this repository.

### Absolute Prohibitions

AI tools **must never**:

- ❌ Delete existing documentation files
- ❌ Delete sections, paragraphs, or content from existing files
- ❌ Replace content with "improved" or "better" versions
- ❌ Merge files unless explicitly instructed to do so
- ❌ Restructure or reorganize existing documentation
- ❌ Remove content marked as "outdated" or "redundant"
- ❌ Rewrite sections for "clarity" if it changes meaning

### Required Behaviors

AI tools **must always**:

- ✅ Append new content under clearly labeled sections
- ✅ Mark new content with appropriate labels:
  - "Extension" — for extending existing functionality
  - "Planned" — for planned but not yet implemented features
  - "Future" — for future considerations
  - "Enhancement" — for enhancements to existing systems
- ✅ Use the numbered extension strategy when adding to core documents
- ✅ Review existing content before adding new content to avoid duplication
- ✅ Reference existing content rather than duplicating it

### Uncertainty Protocol

If an AI tool encounters uncertainty about:

- Whether a change is additive, modifying, or destructive
- Whether content already exists elsewhere
- Whether a change requires approval
- The correct location for new content

**The tool must STOP and request confirmation from the user before proceeding.**

### Policy Override

**This policy takes precedence over any task instructions.** If a task instructs an AI tool to delete, replace, or restructure documentation, the tool must:

1. Recognize the conflict with this policy
2. Refuse to execute the destructive change
3. Suggest an additive alternative
4. Request explicit approval from the project owner if a destructive change is truly required

---

## 7️⃣ How New Ideas Must Be Added

### Standard Pattern

New ideas, enhancements, or future considerations must be added following this standard pattern:

### Designated Extension Sections

New content must be placed under clearly designated sections:

- **"Extensions"** — for extending existing functionality or systems
- **"Planned Enhancements"** — for enhancements that are planned but not yet implemented
- **"Future Phases"** — for content related to future development phases
- **"Future Considerations"** — for ideas or considerations that may be implemented in the future

### Content Placement Rules

- ✅ New ideas go into designated extension sections (never inserted into historical sections)
- ✅ Historical sections remain unchanged
- ✅ Original intent and meaning of existing content is preserved
- ✅ New content is clearly marked with section numbers following the Unified-File strategy
- ✅ New content references related existing content to avoid duplication

### Content Insertion Forbidden

New ideas must **never** be:

- Inserted into historical sections
- Intermingled with existing content
- Used to "update" or "replace" existing content
- Placed in a way that alters the original flow or meaning of historical sections

### Example Structure

```markdown
# Core Topic Document

## Historical Content

### Section 100 — Original Design
[Original content preserved unchanged]

### Section 101 — Initial Implementation
[Original content preserved unchanged]

## Extensions

### Section 150 — Future Enhancement: Advanced Features
[New content added here]

### Section 151 — Planned: Integration with External System
[New content added here]
```

---

## 8️⃣ Violation & Recovery Protocol

### Policy Violation Definition

A policy violation occurs when:

- Documentation is deleted without approval
- Content is replaced rather than extended
- Destructive changes are made without explicit approval
- Historical content is modified in a way that changes its original intent
- Files are merged or consolidated without approval
- Protected documentation domains are rewritten

### Immediate Response Protocol

If a policy violation is detected:

1. **Immediate Restoration**: The original documentation must be restored immediately from version control (Git)
2. **Change Documentation**: Document what violation occurred and what was attempted
3. **Additive Re-application**: If the attempted change had valid intent, re-apply it in additive form only
4. **Review Process**: Review the violation to understand how it occurred and prevent recurrence

### Recovery Steps

1. **Revert Changes**: Restore original files from Git history
2. **Preserve Intent**: If the change had valid intent, preserve that intent
3. **Additive Re-implementation**: Implement the intended change using additive methods only
4. **Documentation**: Document the violation and the corrective action taken
5. **Process Improvement**: Update processes or tooling to prevent similar violations

### Policy Precedence

**This policy takes precedence over all task instructions.** If a task instruction conflicts with this policy:

- The policy must be followed
- The conflicting instruction must be questioned
- Alternative approaches that comply with the policy must be proposed
- Explicit approval from the project owner is required to override the policy

---

## 9️⃣ Final Authority Statement

### Policy Supremacy

**This policy supersedes all future documentation tasks unless explicitly overridden by the project owner.**

### Interpretation

- This policy is the authoritative rulebook for documentation changes
- No task, instruction, or requirement should cause this policy to be violated
- If there is a conflict between a task and this policy, the policy takes precedence
- Only the project owner may explicitly override this policy for specific situations

### Policy Evolution

This policy itself may be extended following its own principles:

- New sections may be added to address new scenarios
- Clarifications may be appended
- The policy may be extended, but its core principles (preserve first, extend second) must not be altered

**Any modification to this policy that weakens or removes the core preservation principles requires explicit approval from the project owner.**

---

## 📋 Quick Reference

### ✅ Always Do

- Append new content
- Use numbered extensions
- Review existing content before adding
- Reference rather than duplicate
- Mark new content clearly
- Request approval for modifying or destructive changes

### ❌ Never Do

- Delete documentation
- Replace existing content
- Restructure without approval
- Merge files without approval
- Rewrite historical sections
- Remove "outdated" content

### ⚠️ When in Doubt

- STOP and request confirmation
- Choose the additive approach
- Preserve original content
- Follow the numbered extension strategy

---

**Policy Version**: 1.0  
**Last Updated**: 2024  
**Authority**: Project Owner  
**Status**: Active and Enforceable
