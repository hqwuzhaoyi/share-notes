# Data Model: Output Formatter Refactoring

**Feature**: 002-formatter-refactor
**Phase**: Phase 1 - Design
**Date**: 2025-11-18

## Overview

This document defines the core data structures for the refactored formatter system. The model follows the Strategy Pattern with explicit capability declarations, enabling type-safe platform extensibility.

---

## Core Entities

### 1. PlatformCapabilities

**Purpose**: Declares what a formatting platform supports

**Type**: Interface

```typescript
export interface PlatformCapabilities {
  /**
   * Whether platform supports embedding images in formatted output
   * - true: Platform can display/embed images (e.g., Flomo)
   * - false: Platform only supports image URLs as text (e.g., Apple Notes)
   */
  supportsImages: boolean;

  /**
   * Whether platform supports direct content creation via URL scheme
   * - true: Platform has native URL scheme (e.g., flomo://create)
   * - false: Requires iOS Shortcuts bridge (e.g., shortcuts://run-shortcut)
   */
  supportsDirectCreate: boolean;

  /**
   * Maximum content length after URL encoding
   * - undefined: No explicit limit known
   * - number: Conservative safe limit in characters (after encodeURIComponent)
   */
  maxContentLength?: number;
}
```

**Validation Rules**:
- `supportsImages` and `supportsDirectCreate` MUST be boolean
- `maxContentLength` if present MUST be positive integer
- Validated at registration time (fail-fast)

**Example Values**:

```typescript
// Flomo capabilities
{
  supportsImages: true,
  supportsDirectCreate: true,
  maxContentLength: 50000
}

// Apple Notes capabilities
{
  supportsImages: false,
  supportsDirectCreate: false, // Requires Shortcuts
  maxContentLength: 30000
}

// Raw formatter capabilities
{
  supportsImages: true,
  supportsDirectCreate: true,
  maxContentLength: undefined // No limit
}
```

---

### 2. FormattedOutput

**Purpose**: Unified output structure from all formatters

**Type**: Interface

```typescript
export interface FormattedOutput {
  /**
   * Output type indicating how content should be delivered
   * - url_scheme: Direct platform URL (e.g., flomo://create?content=...)
   * - shortcut_trigger: iOS Shortcuts invocation (e.g., shortcuts://run-shortcut?...)
   * - raw_content: Unformatted structured data
   */
  type: 'url_scheme' | 'shortcut_trigger' | 'raw_content';

  /**
   * Primary formatted value
   * - url_scheme: Complete URL string
   * - shortcut_trigger: Shortcuts URL with parameters
   * - raw_content: JSON-serializable object
   */
  value: string;

  /**
   * Optional fallback format if primary method unavailable
   * - Typically plain text representation
   * - Used when primary format fails (e.g., URL too long)
   */
  fallback?: string;
}
```

**Invariants**:
- `type` MUST be one of the three defined literals
- `value` MUST be non-empty string
- `fallback` if present MUST differ from `value`

**Usage Scenarios**:

```typescript
// URL scheme output (Flomo)
{
  type: 'url_scheme',
  value: 'flomo://create?content=...',
  fallback: 'Plain text version...'
}

// Shortcut trigger (Apple Notes)
{
  type: 'shortcut_trigger',
  value: 'shortcuts://run-shortcut?name=SaveToNotes&input=text&text=...',
  fallback: 'Content to save:\n...'
}

// Raw content
{
  type: 'raw_content',
  value: '{"title":"...","content":"..."}',
  fallback: undefined
}
```

---

### 3. FormatterError

**Purpose**: Structured error type for formatter failures

**Type**: Class (extends Error)

```typescript
export type FormatterErrorCode =
  | 'FORMATTING_FAILED'       // General formatting error
  | 'INVALID_CONTENT'         // Content validation failed
  | 'UNSUPPORTED_FEATURE'     // Requested feature not supported
  | 'URL_ENCODING_ERROR';     // URL encoding failed

export class FormatterError extends Error {
  /**
   * Machine-readable error code
   */
  readonly code: FormatterErrorCode;

  /**
   * Optional underlying cause
   */
  readonly cause?: unknown;

  constructor(
    code: FormatterErrorCode,
    message: string,
    cause?: unknown
  ) {
    super(message);
    this.name = 'FormatterError';
    this.code = code;
    this.cause = cause;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FormatterError);
    }
  }
}
```

**Error Code Semantics**:

| Code | Meaning | Example Scenario |
|------|---------|------------------|
| `FORMATTING_FAILED` | Generic formatting failure | Unexpected exception during formatting |
| `INVALID_CONTENT` | Content doesn't meet requirements | Empty title and content, exceeds length limit |
| `UNSUPPORTED_FEATURE` | Feature not available for platform | Requesting images on non-image platform |
| `URL_ENCODING_ERROR` | URL encoding/truncation failed | Truncation algorithm error |

---

### 4. FormatterResult<T>

**Purpose**: Type-safe result wrapper (success or error)

**Type**: Discriminated Union

```typescript
export type FormatterResult<T> =
  | { success: true; data: T }
  | { success: false; error: FormatterError };
```

**Helper Functions**:

```typescript
export const Ok = <T>(data: T): FormatterResult<T> => ({
  success: true,
  data
});

export const Err = (
  code: FormatterErrorCode,
  message: string,
  cause?: unknown
): FormatterResult<never> => ({
  success: false,
  error: new FormatterError(code, message, cause)
});
```

**Usage Pattern**:

```typescript
const result = formatter.format(content);

if (result.success) {
  console.log('Output:', result.data.value);
} else {
  console.error(`[${result.error.code}]`, result.error.message);
}
```

**Type Safety Benefits**:
- Compiler enforces checking `success` property before accessing `data`
- Impossible to forget error handling
- Explicit error propagation through call chain

---

### 5. BaseOutputFormatter

**Purpose**: Abstract base class for all platform formatters

**Type**: Abstract Class

```typescript
export abstract class BaseOutputFormatter {
  /**
   * Platform capabilities declaration
   * MUST be implemented by subclasses as readonly property
   */
  abstract readonly capabilities: PlatformCapabilities;

  /**
   * Core formatting method
   * MUST return Result type for type-safe error handling
   */
  abstract format(content: ParsedContent): FormatterResult<FormattedOutput>;

  /**
   * Validate content meets formatter requirements
   * Protected method shared by all formatters
   */
  protected validateContent(content: ParsedContent): FormatterResult<ParsedContent> {
    // Empty content check
    if (!content.title && !content.content) {
      return Err(
        'INVALID_CONTENT',
        'Content must have title or content'
      );
    }

    // Length limit check (if applicable)
    if (this.capabilities.maxContentLength) {
      const totalLength = (content.title?.length ?? 0) + (content.content?.length ?? 0);
      if (totalLength > this.capabilities.maxContentLength) {
        return Err(
          'INVALID_CONTENT',
          `Content exceeds max length: ${totalLength} > ${this.capabilities.maxContentLength}`
        );
      }
    }

    return Ok(content);
  }

  /**
   * Clean and normalize text content
   * Protected utility shared by all formatters
   */
  protected cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')           // Multiple spaces → single space
      .replace(/\n\s*\n/g, '\n\n')    // Multiple newlines → double newline
      .trim();
  }

  /**
   * Validate image URL format
   * Protected utility shared by all formatters
   */
  protected isValidImageUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }
}
```

**Design Principles**:
- **Template Method Pattern**: Base class defines workflow, subclasses implement specifics
- **Shared Utilities**: Common operations (validation, text cleaning) in base class
- **Type Safety**: Abstract methods enforce contract implementation

**Subclass Example**:

```typescript
export class FlomoFormatter extends BaseOutputFormatter {
  readonly capabilities: PlatformCapabilities = {
    supportsImages: true,
    supportsDirectCreate: true,
    maxContentLength: 50000
  };

  format(content: ParsedContent): FormatterResult<FormattedOutput> {
    // Use inherited validation
    const validated = this.validateContent(content);
    if (!validated.success) return validated;

    // Use inherited utilities
    const cleanedContent = this.cleanText(content.content);
    const validImages = content.images.filter(img => this.isValidImageUrl(img));

    // Platform-specific formatting logic
    // ...
  }
}
```

---

### 6. FormatterRegistry

**Purpose**: Central registry managing all formatter instances

**Type**: Class (module-level singleton)

```typescript
class FormatterRegistry {
  /**
   * Internal storage: platform name → formatter instance
   * Private to enforce registration through public API
   */
  private readonly formatters = new Map<string, BaseOutputFormatter>();

  /**
   * Register a formatter for a platform
   *
   * @param platform - Unique platform identifier (e.g., 'flomo', 'notes')
   * @param formatter - Formatter instance implementing BaseOutputFormatter
   * @returns true if registered, false if already exists (idempotent)
   * @throws {Error} if platform or formatter invalid
   */
  register(platform: string, formatter: BaseOutputFormatter): boolean {
    // Fail-fast validation
    if (!platform || typeof platform !== 'string') {
      throw new Error(`Invalid platform: must be non-empty string`);
    }

    if (!formatter || !formatter.capabilities) {
      throw new Error(`Invalid formatter for "${platform}": must have capabilities`);
    }

    // Idempotent: first registration wins (HMR-safe)
    if (this.formatters.has(platform)) {
      return false;
    }

    this.formatters.set(platform, formatter);
    return true;
  }

  /**
   * Get formatter for a platform
   *
   * @param platform - Platform identifier
   * @returns Formatter instance
   * @throws {Error} if platform not registered
   */
  get(platform: string): BaseOutputFormatter {
    const formatter = this.formatters.get(platform);
    if (!formatter) {
      const available = Array.from(this.formatters.keys()).join(', ');
      throw new Error(
        `Unknown platform "${platform}". Available: ${available}`
      );
    }
    return formatter;
  }

  /**
   * Check if platform is registered
   */
  has(platform: string): boolean {
    return this.formatters.has(platform);
  }

  /**
   * Get all registered platform names
   */
  getPlatforms(): readonly string[] {
    return Array.from(this.formatters.keys());
  }

  /**
   * Get capabilities for all registered platforms
   * Used by /api/formatters endpoint
   */
  listCapabilities(): Record<string, PlatformCapabilities> {
    const result: Record<string, PlatformCapabilities> = {};
    for (const [platform, formatter] of this.formatters) {
      result[platform] = formatter.capabilities;
    }
    return result;
  }

  /**
   * Clear all registrations (testing only)
   * @internal
   */
  clear(): void {
    this.formatters.clear();
  }
}

// Module-level singleton export
export const formatterRegistry = new FormatterRegistry();
```

**State Transitions**:

```
[Empty Registry]
    ↓ register('flomo', FlomoFormatter)
[flomo: FlomoFormatter]
    ↓ register('notes', NotesFormatter)
[flomo: FlomoFormatter, notes: NotesFormatter]
    ↓ register('flomo', AnotherFormatter) → returns false (idempotent)
[flomo: FlomoFormatter, notes: NotesFormatter] (unchanged)
```

**Invariants**:
- Platform names are unique (enforced by Map)
- All registered formatters have valid capabilities (enforced at registration)
- First registration wins (idempotent behavior)

---

## Entity Relationships

```
┌─────────────────────────────────────────────────────────┐
│ FormatterRegistry (Singleton)                           │
│ ┌─────────────────────────────────────────────────────┐ │
│ │ Map<string, BaseOutputFormatter>                     │ │
│ │   'flomo'  → FlomoFormatter                          │ │
│ │   'notes'  → NotesFormatter                          │ │
│ │   'raw'    → RawFormatter                            │ │
│ └─────────────────────────────────────────────────────┘ │
│                                                           │
│ + register(platform, formatter)                          │
│ + get(platform): BaseOutputFormatter                     │
│ + listCapabilities(): Record<string, Capabilities>       │
└─────────────────────────────────────────────────────────┘
                           │
                           │ contains
                           ↓
┌─────────────────────────────────────────────────────────┐
│ BaseOutputFormatter (Abstract)                          │
│                                                           │
│ + capabilities: PlatformCapabilities (abstract)          │
│ + format(ParsedContent): FormatterResult (abstract)      │
│ # validateContent(ParsedContent): FormatterResult        │
│ # cleanText(string): string                              │
│ # isValidImageUrl(string): boolean                       │
└─────────────────────────────────────────────────────────┘
                   ↑                    ↑
                   │ extends            │ extends
         ┌─────────┴─────────┐    ┌────┴─────────────┐
         │                   │    │                   │
┌────────┴─────────┐ ┌───────┴────────┐ ┌────────────┴────────┐
│ FlomoFormatter   │ │ NotesFormatter  │ │   RawFormatter      │
│                  │ │                 │ │                     │
│ capabilities: {} │ │ capabilities:{} │ │  capabilities: {}   │
│ format(): Result │ │ format(): Result│ │  format(): Result   │
└──────────────────┘ └─────────────────┘ └─────────────────────┘
         │                    │                     │
         │ returns            │ returns             │ returns
         ↓                    ↓                     ↓
┌─────────────────────────────────────────────────────────┐
│ FormattedOutput                                         │
│                                                           │
│ + type: 'url_scheme' | 'shortcut_trigger' | 'raw_content│
│ + value: string                                          │
│ + fallback?: string                                      │
└─────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Formatting Request Flow

```
[API Request] → [/api/parse route]
                      ↓
        formatterRegistry.get('flomo')
                      ↓
              [FlomoFormatter]
                      ↓
          formatter.format(content)
                      ↓
              [FormatterResult]
                   ↓     ↓
            success?    error?
               ↓           ↓
        [FormattedOutput] [FormatterError]
               ↓           ↓
        [API Response]  [Error Response]
```

### Capability Query Flow

```
[API Request] → [/api/formatters route]
                      ↓
        formatterRegistry.listCapabilities()
                      ↓
        {
          flomo: { supportsImages: true, ... },
          notes: { supportsImages: false, ... }
        }
                      ↓
              [API Response]
```

---

## Validation Rules Summary

| Entity | Validation | Timing |
|--------|-----------|--------|
| `PlatformCapabilities` | Boolean flags, positive maxLength | Registration |
| `FormattedOutput` | Non-empty value, valid type enum | Format time |
| `FormatterError` | Valid error code | Construction |
| `BaseOutputFormatter` | Capabilities declared, format() implemented | Registration |
| `FormatterRegistry` | Platform name non-empty, formatter valid | Registration |

---

## Type Safety Guarantees

1. **Compile-time**: TypeScript ensures all abstract methods implemented
2. **Registration-time**: Fail-fast validation catches malformed formatters
3. **Runtime**: Result types force error handling at call sites
4. **No implicit failures**: All errors explicit through FormatterError

---

## Migration Path from IOSFormatterImpl

**Old Structure** (monolithic):
```typescript
class IOSFormatterImpl implements IOSFormatter {
  formatFlomo(content: ParsedContent): string
  formatNotes(content: ParsedContent): string
}
```

**New Structure** (strategy pattern):
```typescript
class FlomoFormatter extends BaseOutputFormatter {
  format(content: ParsedContent): FormatterResult<FormattedOutput>
}

class NotesFormatter extends BaseOutputFormatter {
  format(content: ParsedContent): FormatterResult<FormattedOutput>
}
```

**Backward Compatibility Bridge**:
```typescript
// Temporary adapter during migration
class IOSFormatterAdapter implements IOSFormatter {
  formatFlomo(content: ParsedContent): string {
    const formatter = formatterRegistry.get('flomo');
    const result = formatter.format(content);

    if (result.success) {
      return result.data.value;
    } else {
      throw new Error(result.error.message); // Preserve old behavior
    }
  }

  formatNotes(content: ParsedContent): string {
    // Similar implementation
  }
}
```

---

## Next Steps

1. ✅ Data model defined
2. ⏭️ Generate API contracts (`contracts/formatter-api.yaml`)
3. ⏭️ Generate developer quickstart (`quickstart.md`)
4. ⏭️ Update agent context
