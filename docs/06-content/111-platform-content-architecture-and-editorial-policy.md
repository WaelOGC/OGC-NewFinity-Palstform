# OGC NewFinity — Platform Content Architecture & Editorial Policy (v1.0)

## 1. Introduction

This document defines the content structure, editorial workflows, formatting standards, publishing guidelines, and compliance rules for all content within the OGC NewFinity ecosystem.

The Content Architecture ensures:

- Consistency across all platform text
- Unified style and tone
- Easy localization and translation
- Structured content for all modules
- Clear publishing roles and workflows
- Compliance with legal and community guidelines

This applies to web content, challenge content, knowledge base entries, marketing pages, platform UI text, and educational material.

## 2. Content Types & Definitions

### 2.1 System Content

- UI labels
- Notifications
- Error messages
- Tooltips
- Button text
- System alerts

### 2.2 Challenge Content

- Challenge descriptions
- Rules
- Requirements
- Scoring guidance
- Category explanations

### 2.3 User-Education Content

- Tutorials
- Onboarding walkthroughs
- Help center articles
- FAQ sections

### 2.4 Platform Pages

- About
- Mission & Values
- Program overviews
- Legal pages

### 2.5 Marketing Content

- Landing pages
- SEO articles
- Social media content (future)

## 3. Content Architecture Structure

### 3.1 Modular Content Blocks

All content must be stored in structured blocks:

```
content/
   ui/
   challenges/
   onboarding/
   kb/
   seo/
   legal/
```

### 3.2 Key-Based Content Mapping

All system content must use a key-based structure:

- `"ui.button.save": "Save"`
- `"ui.error.connection": "Unable to connect"`
- `"challenge.rules.001": "All submissions must..."`

### 3.3 Versioning

Content files must support:

- Version tags
- Draft + Published states
- Planned localization keys

## 4. Editorial Workflow

### 4.1 Content Roles

- Content Writer — drafts and updates content
- Editor — verifies clarity, tone, accuracy
- Reviewer — checks compliance and technical correctness
- Publisher — approves and activates content

### 4.2 Publishing Process

- Draft created
- Internal review
- Legal/compliance check (if required)
- Final approval
- Publication
- Localization request sent to translators

### 4.3 Change Log Requirements

Every content update must include:

- Who updated it
- What changed
- Why the update was necessary
- Version number
- Timestamp

## 5. Editorial Guidelines & Tone

### 5.1 Tone of Voice

OGC NewFinity content must be:

- Clear
- Friendly
- Professional
- Motivational
- Inclusive
- Forward-thinking

### 5.2 Text Rules

- Avoid jargon where unnecessary
- Keep sentences short
- Use active voice
- Avoid ambiguity
- Maintain consistent terminology
- Avoid slang or overly casual language

### 5.3 Formatting Rules

- Use Markdown for structured content
- Headings follow H1 → H2 → H3 hierarchy
- Bullet lists for steps or rules
- Tables for structured data

## 6. Localization & Internationalization Support

### 6.1 Content Requirements

All user-facing text must use content keys

- Avoid embedding HTML in text blocks
- Avoid hard-coded strings in code

### 6.2 Translation Guidelines

Translators must receive:

- Source text
- Context notes
- Usage examples
- Tone guidelines

### 6.3 Locale Variants

Support for:

- en
- ar
- fr
- es

Future languages added via structured keys.

## 7. Compliance Requirements

### 7.1 Legal Compliance

All published content must comply with:

- Terms of Use
- Privacy Policy
- Token Disclaimer
- Community Standards

### 7.2 Content Restrictions

Forbidden:

- Defamatory material
- Misleading information
- Sensitive personal data
- Unsupported financial claims

### 7.3 Accessibility Standards

Must follow:

- WCAG 2.1 AA
- Clear headings
- Alt text for images
- High contrast requirements

## 8. SEO & Discoverability Rules

### 8.1 SEO Guidelines

- Titles ≤ 60 characters
- Descriptions ≤ 160 characters
- Include relevant keywords
- Avoid keyword stuffing
- Structured H1/H2 hierarchy

### 8.2 Open Graph Metadata

Required for:

- Social sharing cards
- Challenge previews
- Landing pages

### 8.3 Internal Linking

Each article should link to:

- Related challenges
- Relevant knowledge articles
- Onboarding material

## 9. Content Storage & Delivery

### 9.1 Storage Format

Use JSON, Markdown, or YAML depending on category.

### 9.2 Delivery Pipeline

- Backend serves localized content
- Frontend fetches based on lang
- Cached responses for performance

### 9.3 Version Safety

- Do not delete old versions
- Archive instead
- Rollback must be possible

## 10. Future Enhancements

- AI-based content quality scoring
- Automated translation workflows
- Multi-author collaboration tools
- Dynamic content personalization
- Interactive learning modules

## 11. Conclusion

This document defines the Platform Content Architecture & Editorial Policy for OGC NewFinity.

It ensures consistency, clarity, maintainability, and global readiness across all written content on the platform.

