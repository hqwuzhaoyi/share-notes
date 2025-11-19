# Quickstart: Adding a New Platform Formatter

**Feature**: 002-formatter-refactor
**Audience**: Developers adding new platform support
**Prerequisites**: TypeScript basics, familiarity with project structure

---

## Overview

This guide shows you how to add support for a new note-taking platform (e.g., Notion, Obsidian, Bear) to the formatter system in **less than 50 lines of code**.

**Time to complete**: 15-20 minutes

---

## Step 1: Create Formatter Class

Create a new file: `src/lib/formatters/notion-formatter.ts`

```typescript
import { BaseOutputFormatter } from './base-formatter';
import { PlatformCapabilities, FormattedOutput, FormatterResult } from '../types/formatter';
import { ParsedContent } from '../types/parser';
import { Ok, Err } from '../types/formatter';
import { truncateForURL } from '../utils/url-truncate';

/**
 * Notion formatter implementation
 *
 * Notion API requirements:
 * - Supports rich text and images
 * - Requires API key authentication (out of scope for MVP)
 * - For now: use Notion's "Add to Notion" URL scheme
 */
export class NotionFormatter extends BaseOutputFormatter {
  // Step 1.1: Declare capabilities
  readonly capabilities: PlatformCapabilities = {
    supportsImages: true,            // Notion supports images
    supportsDirectCreate: false,      // Requires API/web interface
    maxContentLength: 100000          // Generous limit for Notion
  };

  // Step 1.2: Implement format method
  format(content: ParsedContent): FormatterResult<FormattedOutput> {
    // Validate input using inherited method
    const validated = this.validateContent(content);
    if (!validated.success) return validated;

    try {
      // Build Notion-compatible content
      const title = content.title || 'Untitled';
      const bodyContent = this.cleanText(content.content); // Use inherited utility

      // Notion's "Add to Notion" URL scheme (simplified)
      // Real implementation would use Notion API
      const notionContent = `${title}\n\n${bodyContent}`;

      // Truncate if needed
      const safeContent = truncateForURL(notionContent, this.capabilities.maxContentLength!);

      // For MVP: use web clipper URL
      const url = `https://www.notion.so/clipper?url=${encodeURIComponent(content.originalUrl)}&title=${encodeURIComponent(title)}`;

      return Ok({
        type: 'url_scheme', // Will change to 'shortcut_trigger' when API integrated
        value: url,
        fallback: `Notion: ${safeContent}`
      });

    } catch (error) {
      return Err(
        'FORMATTING_FAILED',
        `Notion formatting failed: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }
}
```

**Key Points**:
- Extend `BaseOutputFormatter` for shared utilities
- Declare capabilities honestly (Notion needs web/API, not direct URL scheme)
- Use `FormatterResult` for type-safe error handling
- Leverage inherited methods: `validateContent()`, `cleanText()`, `isValidImageUrl()`

---

## Step 2: Register Formatter

Edit: `src/lib/formatters/index.ts`

```typescript
import { formatterRegistry } from './formatter-registry';
import { FlomoFormatter } from './flomo-formatter';
import { NotesFormatter } from './notes-formatter';
import { NotionFormatter } from './notion-formatter'; // Import your formatter

/**
 * Register all formatters at module initialization
 * This runs once when the module is first imported
 */
const flomoFormatter = new FlomoFormatter();
const notesFormatter = new NotesFormatter();
const notionFormatter = new NotionFormatter(); // Instantiate

// Register formatters (idempotent - first wins)
formatterRegistry.register('flomo', flomoFormatter);
formatterRegistry.register('notes', notesFormatter);
formatterRegistry.register('notion', notionFormatter); // Register

// Re-export for convenience
export { formatterRegistry };
export type { FormatterRegistry } from './formatter-registry';
```

**That's it!** Your formatter is now registered and available.

---

## Step 3: Test Your Formatter

### 3.1 Create Unit Test

Create: `src/lib/formatters/__tests__/notion-formatter.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { NotionFormatter } from '../notion-formatter';
import type { ParsedContent } from '@/lib/types/parser';

describe('NotionFormatter', () => {
  const formatter = new NotionFormatter();

  const mockContent: ParsedContent = {
    title: 'Test Title',
    content: 'Test content with some text',
    images: ['https://example.com/image.jpg'],
    platform: 'xiaohongshu',
    originalUrl: 'https://xiaohongshu.com/explore/12345'
  };

  describe('capabilities', () => {
    it('declares correct capabilities', () => {
      expect(formatter.capabilities).toEqual({
        supportsImages: true,
        supportsDirectCreate: false,
        maxContentLength: 100000
      });
    });
  });

  describe('format', () => {
    it('formats valid content successfully', () => {
      const result = formatter.format(mockContent);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('url_scheme');
        expect(result.data.value).toContain('notion.so/clipper');
        expect(result.data.fallback).toContain('Test Title');
      }
    });

    it('returns error for empty content', () => {
      const emptyContent: ParsedContent = {
        ...mockContent,
        title: '',
        content: ''
      };

      const result = formatter.format(emptyContent);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_CONTENT');
      }
    });

    it('truncates content exceeding max length', () => {
      const longContent: ParsedContent = {
        ...mockContent,
        content: 'A'.repeat(200000) // Exceeds 100k limit
      };

      const result = formatter.format(longContent);

      // Should either succeed with truncation or fail with clear error
      if (result.success) {
        expect(result.data.value.length).toBeLessThan(150000); // URL encoded length
      } else {
        expect(result.error.code).toBe('INVALID_CONTENT');
      }
    });
  });
});
```

**Run tests**:
```bash
npm run test:unit -- notion-formatter.test.ts
```

### 3.2 Test via API

**Start development server**:
```bash
npm run dev
```

**Test with curl**:
```bash
curl -X POST http://localhost:4000/api/parse \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://xiaohongshu.com/explore/xxxxx",
    "output_format": "notion"
  }'
```

**Expected response**:
```json
{
  "success": true,
  "data": {
    "title": "小红书笔记标题",
    "content": "...",
    "platform": "xiaohongshu"
  },
  "ios_url": "https://www.notion.so/clipper?url=...",
  "parsed_at": "2025-11-18T10:30:00Z"
}
```

### 3.3 Query Capabilities

```bash
curl http://localhost:4000/api/formatters
```

**Expected response**:
```json
{
  "flomo": {
    "supportsImages": true,
    "supportsDirectCreate": true,
    "maxContentLength": 50000
  },
  "notes": {
    "supportsImages": false,
    "supportsDirectCreate": false,
    "maxContentLength": 30000
  },
  "notion": {
    "supportsImages": true,
    "supportsDirectCreate": false,
    "maxContentLength": 100000
  }
}
```

---

## Step 4: Verify Backward Compatibility

**Critical**: Ensure existing endpoints still work

```bash
# Test existing Flomo format
curl -X POST http://localhost:4000/api/parse \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://xiaohongshu.com/explore/xxxxx",
    "output_format": "flomo"
  }'

# Test existing Notes format
curl -X POST http://localhost:4000/api/parse \
  -H "Content-Type": application/json" \
  -d '{
    "url": "https://bilibili.com/video/xxxxx",
    "output_format": "notes"
  }'
```

**Run integration test suite**:
```bash
npm run test
```

**All existing tests must pass** ✅

---

## Advanced: Adding Image Support

If your platform supports image embedding, handle images in `format()`:

```typescript
format(content: ParsedContent): FormatterResult<FormattedOutput> {
  const validated = this.validateContent(content);
  if (!validated.success) return validated;

  try {
    // Filter valid image URLs using inherited utility
    const validImages = content.images.filter(img => this.isValidImageUrl(img));

    // Check capability
    if (validImages.length > 0 && !this.capabilities.supportsImages) {
      // Platform doesn't support images - include as text
      const imageText = '\n\nImages:\n' + validImages.map((url, i) =>
        `${i + 1}. ${url}`
      ).join('\n');

      // Add to content
      const contentWithImages = content.content + imageText;
      // ... continue formatting
    } else {
      // Platform supports images - embed them
      // ... platform-specific image embedding logic
    }

    return Ok({ /* ... */ });
  } catch (error) {
    return Err('FORMATTING_FAILED', `${error}`, error);
  }
}
```

---

## Advanced: Custom Validation

Add platform-specific validation beyond the base class:

```typescript
export class NotionFormatter extends BaseOutputFormatter {
  readonly capabilities: PlatformCapabilities = { /* ... */ };

  format(content: ParsedContent): FormatterResult<FormattedOutput> {
    // Use inherited validation
    const validated = this.validateContent(content);
    if (!validated.success) return validated;

    // Custom Notion-specific validation
    const customValidation = this.validateNotionRequirements(content);
    if (!customValidation.success) return customValidation;

    // ... formatting logic
  }

  private validateNotionRequirements(
    content: ParsedContent
  ): FormatterResult<ParsedContent> {
    // Example: Notion requires title
    if (!content.title) {
      return Err(
        'INVALID_CONTENT',
        'Notion requires a title'
      );
    }

    // Example: Check for Notion-incompatible characters
    if (content.title.includes('\x00')) {
      return Err(
        'INVALID_CONTENT',
        'Content contains invalid characters for Notion'
      );
    }

    return Ok(content);
  }
}
```

---

## Troubleshooting

### Issue: "Unknown platform 'notion'"

**Cause**: Formatter not registered

**Solution**:
1. Check `src/lib/formatters/index.ts` has `formatterRegistry.register('notion', notionFormatter)`
2. Restart dev server (`npm run dev`)
3. Verify registration: `curl http://localhost:4000/api/formatters`

### Issue: TypeScript error "Type 'NotionFormatter' does not satisfy..."

**Cause**: Missing abstract method implementation or incorrect types

**Solution**:
1. Ensure `format()` method signature matches: `format(content: ParsedContent): FormatterResult<FormattedOutput>`
2. Ensure `capabilities` property is `readonly`
3. Check imports are correct

### Issue: Tests fail with "Cannot find module"

**Cause**: Import paths incorrect

**Solution**:
1. Use `@/lib/...` alias for absolute imports
2. Check `tsconfig.json` paths configuration
3. Restart TypeScript server in IDE

---

## Checklist

Before submitting PR:

- [ ] Formatter class created in `src/lib/formatters/[platform]-formatter.ts`
- [ ] Capabilities declared honestly (no false claims)
- [ ] Formatter registered in `src/lib/formatters/index.ts`
- [ ] Unit tests created in `src/lib/formatters/__tests__/[platform]-formatter.test.ts`
- [ ] All unit tests pass: `npm run test:unit`
- [ ] API manually tested with curl/Postman
- [ ] Capability endpoint returns new platform
- [ ] Existing formatters still work (backward compatibility)
- [ ] All integration tests pass: `npm test`
- [ ] Code follows TypeScript strict mode (no `any` types)
- [ ] Error messages are clear and actionable

---

## Performance Expectations

| Metric | Target | Measured |
|--------|--------|----------|
| Registration validation | <50ms | ___ |
| Format operation | <10ms | ___ |
| Total request latency | <200ms | ___ |

**Measure with**:
```typescript
const start = performance.now();
const result = formatter.format(content);
const duration = performance.now() - start;
console.log(`Format took ${duration.toFixed(2)}ms`);
```

---

## Next Steps

1. ✅ Formatter implemented and tested
2. Consider adding AI enhancement support (see `src/lib/ai/`)
3. Add platform-specific documentation to `CLAUDE.md`
4. Update API documentation if capabilities have new fields

---

## Reference

- **Type Definitions**: `src/lib/types/formatter.ts`
- **Base Formatter**: `src/lib/formatters/base-formatter.ts`
- **Registry**: `src/lib/formatters/formatter-registry.ts`
- **Truncation Utility**: `src/lib/utils/url-truncate.ts`
- **Existing Examples**: `src/lib/formatters/flomo-formatter.ts`, `notes-formatter.ts`

---

## Questions?

- Check existing formatter implementations for patterns
- Review `research.md` for design decisions
- Review `data-model.md` for entity relationships
- Open GitHub issue for clarifications
