# OGC NewFinity — Knowledge Base Structure & Article Templates (v1.0)

## 1. Introduction

This document defines the structure, format, taxonomy, and authoring standards for the OGC NewFinity Knowledge Base (KB).

It ensures consistency, clarity, accessibility, and efficient content discovery for all user support materials.

The Knowledge Base provides:

- Self-service learning
- Fast troubleshooting
- Clear feature explanations
- Unified writing style
- Multilingual support

This applies to help articles, troubleshooting guides, feature explanations, platform FAQs, and long-form educational content.

## 2. Knowledge Base Objectives

### 2.1 User-Focused Goals

- Make help resources easy to find
- Provide clear answers to common questions
- Reduce support requests
- Offer multilingual support
- Educate users on best practices

### 2.2 Platform Goals

- Centralize documentation
- Maintain structured content
- Accelerate onboarding and support
- Enable scalable content updates

## 3. Knowledge Base Structure

### 3.1 Recommended Folder Structure

```
/knowledge-base/
   getting-started/
   account-management/
   challenges/
   submissions/
   rewards/
   troubleshooting/
   security/
   advanced/
```

### 3.2 Content Types

- How-to Guides
- Step-by-Step Tutorials
- Troubleshooting Guides
- Feature Overviews
- FAQs
- Policy Explanations

### 3.3 Article Naming Convention

Use kebab-case:

- `how-to-submit-a-challenge.md`
- `reset-account-password.md`
- `troubleshoot-upload-errors.md`

## 4. Article Template Standards

### 4.1 Standard Article Template

```markdown
# Title of the Article

## 1. Overview

Brief explanation of what this article covers and who it is for.

## 2. Prerequisites

- Requirements (if any)
- Accounts, permissions, or tools needed

## 3. Step-by-Step Instructions

1. Step one
2. Step two
3. Step three

## 4. Common Issues & Solutions

- Issue 1 → Solution
- Issue 2 → Solution

## 5. Additional Notes

Extra context, warnings, or tips.

## 6. Related Articles

- Link to related article 1
- Link to related article 2
```

### 4.2 FAQ Template

```markdown
# Frequently Asked Questions

## Q1: Question here?

Answer here.

## Q2: Question here?

Answer here.
```

### 4.3 Troubleshooting Template

```markdown
# Troubleshooting Guide: {Problem Name}

## 1. Symptoms

- What the user sees
- Error messages

## 2. Likely Causes

- Cause 1
- Cause 2

## 3. Step-by-Step Fix

1. Step one
2. Step two

## 4. When to Contact Support

Provide escalation guidelines.
```

## 5. Writing & Style Guidelines

### 5.1 Tone

- Clear
- Friendly
- Helpful
- Non-technical when possible

### 5.2 Formatting Rules

- Use Markdown only
- Use numbered lists for steps
- Use bullet points for concepts
- Use short paragraphs
- Include screenshots or diagrams (optional)

### 5.3 Accessibility

- Screen-reader friendly
- High-contrast formatting
- Alt text for images
- Avoid jargon

## 6. Localization & Internationalization

### 6.1 Translation Requirements

All KB articles must be translated to:

- English
- Arabic
- French
- Spanish

### 6.2 Localized KB Structure

Each language gets its own folder:

- `/knowledge-base/en/`
- `/knowledge-base/ar/`
- `/knowledge-base/fr/`
- `/knowledge-base/es/`

### 6.3 Content Adaptation

- Avoid region-specific references
- Use globally understandable examples
- Translate screenshots when necessary

## 7. Content Governance

### 7.1 Versioning Rules

Each article must include:

- Version number
- Modified by
- Last updated date
- Summary of changes

### 7.2 Workflow

- Draft
- Internal review
- Editorial pass
- Localization
- QA testing
- Publishing

### 7.3 Archiving

- Outdated articles moved to `/archive/`
- Redirects added where necessary

## 8. Search & Discoverability

### 8.1 SEO Structure

Articles must include:

- Clear H1 title
- Logical headings
- Relevant keywords
- Meta description (future automation)

### 8.2 Internal Linking

Each article should:

- Link to related content
- Link to tutorials, challenge guides, or onboarding content

### 8.3 Tagging System

Recommended tags:

- account
- security
- challenges
- errors
- beginner
- advanced

## 9. Performance Requirements

- Pages must load fast
- Images optimized
- Cache-friendly content delivery
- Lazy-loaded multimedia (future)

## 10. Future Enhancements

- AI-powered KB search
- Dynamic FAQ generation
- Interactive troubleshooting flows
- User feedback scoring on articles
- Auto-translation with human review

## 11. Conclusion

This document defines the Knowledge Base Structure & Article Templates for OGC NewFinity, ensuring unified documentation standards, global scalability, and a world-class support experience for all users.

