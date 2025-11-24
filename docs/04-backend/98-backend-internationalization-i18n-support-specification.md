# OGC NewFinity — Backend Internationalization (i18n) Support Specification (v1.0)

## 1. Introduction

This document defines the backend architecture, translation handling, locale rules, content formatting, and API requirements for implementing internationalization (i18n) across OGC NewFinity services.

The i18n Engine enables:

- Multi-language content delivery
- Region-specific formatting
- Locale-aware message generation
- Translation versioning
- Backend-driven language negotiation

This framework ensures OGC NewFinity can support global expansion.

## 2. Supported Locales

### 2.1 Initial Supported Languages

- English (en)
- Arabic (ar)
- French (fr)
- Spanish (es)

### 2.2 Expansion-Ready Architecture

Additional locales can be added without backend changes.

### 2.3 Locale Codes

All locale identifiers must follow:

- ISO 639-1 (language)
- ISO 3166-1 alpha-2 (region, optional)

Examples:

- `en-US`
- `en-GB`
- `ar-SA`

## 3. Translation Model

### 3.1 Translation Storage Method

Translations stored in:

```
/translations/{locale}.json
```

Example file:

```json
{
  "auth.login.success": "Login successful",
  "auth.login.failed": "Invalid credentials"
}
```

### 3.2 Required Capabilities

- Key-based translation
- Fallback locale system
- Versioned translation files
- Support for dynamic placeholders

Example:

```
"subscription.active": "Your plan is active until {{date}}"
```

## 4. Backend i18n Logic

### 4.1 Locale Resolution Order

The backend determines user locale in the following priority:

1. User profile settings
2. Accept-Language HTTP header
3. Application default locale

### 4.2 Fallback Rules

If translation is missing:

- Use fallback locale (en)
- Log missing key (debug only)

### 4.3 Dynamic Parameter Injection

Backend supports:

- String interpolation
- Nested objects
- Conditional phrasing (future)

## 5. API Requirements

### 5.1 Locale-Aware Responses

Endpoints returning user-visible text must:

- Accept optional `?lang=` parameter
- Produce locale-matched strings
- Apply fallback when needed

### 5.2 Metadata Response Rules

Include:

- `content-language` header
- `requested-locale`
- `resolved-locale`

### 5.3 Error Message Localization

All error messages must use translation keys.

Example:

```
"errors.auth.invalid-token"
```

Backend maps translation automatically.

## 6. Database Localization Rules

### 6.1 Localized Fields

Entities requiring localization:

- Challenge titles
- Challenge descriptions
- Badge names
- Badge descriptions
- System content blocks

### 6.2 Storage Models

Two models supported:

**Model A — Key-Based Content Localization**

Content reference stored:

```
contentKey: "challenge.title.123"
```

Translations defined in JSON files.

**Model B — Multi-Lingual Column Structure**

Example:

- `title_en`
- `title_ar`
- `title_fr`

Used for high-performance entities.

## 7. Formatting Rules (Locale Aware)

Backend must format:

- Dates
- Times
- Numbers
- Currency
- Ordinals (future)

### 7.1 Date Format Rules

- Use ISO internally
- Format only at API edge based on locale

### 7.2 Number Format Rules

Example differences:

- `1,234.56` (en)
- `1.234,56` (de)

## 8. File Structure

Expected structure:

```
/translations/
   en.json
   ar.json
   fr.json
   es.json

/services/
   i18n/
      i18n.js
      resolver.js
      formatter.js
```

## 9. Logging Requirements

Log:

- Missing translation keys
- Invalid locale requests
- Deprecated translation keys
- Fallback events

All logs must include:

- userId
- requestedLocale
- resolvedLocale
- timestamp

## 10. Performance Requirements

- Translation lookup < 1 ms
- Formatter operations < 2 ms
- Locale negotiation < 1 ms
- Must support 100k+ i18n lookups/day
- Caching recommended for repeated keys.

## 11. Security & Compliance

- Translation files must be read-only in production
- No user-generated translation keys allowed
- Prevent injection via placeholders
- Validate lang input parameter

## 12. Future Enhancements

- Machine translation fallback
- Real-time translation sync
- Admin translation dashboard
- Region-specific content overrides
- Pluralization support
- Gendered-language support

## 13. Conclusion

This document defines the internationalization (i18n) architecture for the OGC NewFinity backend, enabling multilingual support, global-ready content formatting, and scalable localization workflows for future expansion.

