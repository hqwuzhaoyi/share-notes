# Research & Technical Decisions: Parser Architecture Refactor

**Date**: 2025-11-19
**Status**: Complete
**Purpose**: Resolve technical unknowns from Phase 0 to enable Phase 1 design

---

## 1. Content Type Discrimination Pattern

### Research Question
How to implement TypeScript discriminated unions for 5+ content types while maintaining type safety across parser-formatter boundary?

### Decision: TypeScript Discriminated Unions + Zod Runtime Validation

**Rationale**:
- TypeScript discriminated unions provide compile-time type safety via the `type` literal field
- Zod schemas provide runtime validation to catch type errors at parser-formatter boundary
- Combination ensures both compile-time safety (development) and runtime safety (production)

### Implementation Pattern

```typescript
// src/lib/types/content.ts
export type ContentType = 'article' | 'video' | 'image-gallery' | 'book' | 'tweet';

export interface BaseContent {
  type: ContentType;
  title: string;
  platform: PlatformType;
  originalUrl: string;
  author?: string;
  publishedAt?: Date;
}

export interface ArticleContent extends BaseContent {
  type: 'article';  // Literal type for discrimination
  content: string;
  images: string[];
}

export interface VideoContent extends BaseContent {
  type: 'video';
  videoUrl: string;
  cover?: string;
  duration?: number;
  description: string;
  metadata?: Record<string, any>;
}

// Union type for all content
export type ParsedContent =
  | ArticleContent
  | VideoContent
  | ImageGalleryContent
  | BookContent
  | TweetContent;
```

### Zod Runtime Validation

```typescript
import { z } from 'zod';

const BaseContentSchema = z.object({
  type: z.enum(['article', 'video', 'image-gallery', 'book', 'tweet']),
  title: z.string().min(1),
  platform: z.string(),
  originalUrl: z.string().url(),
  author: z.string().optional(),
  publishedAt: z.date().optional()
});

const ArticleContentSchema = BaseContentSchema.extend({
  type: z.literal('article'),
  content: z.string().min(1),
  images: z.array(z.string().url())
});

const VideoContentSchema = BaseContentSchema.extend({
  type: z.literal('video'),
  videoUrl: z.string().url(),
  cover: z.string().url().optional(),
  duration: z.number().positive().optional(),
  description: z.string(),
  metadata: z.record(z.any()).optional()
});

export const ParsedContentSchema = z.discriminatedUnion('type', [
  ArticleContentSchema,
  VideoContentSchema,
  ImageGalleryContentSchema,
  BookContentSchema,
  TweetContentSchema
]);
```

### Type-Safe Pattern Matching

```typescript
// Formatters can use type narrowing
function formatContent(content: ParsedContent): string {
  switch (content.type) {
    case 'article':
      // TypeScript knows content is ArticleContent here
      return formatArticle(content.content, content.images);

    case 'video':
      // TypeScript knows content is VideoContent here
      return formatVideo(content.videoUrl, content.cover);

    case 'image-gallery':
      return formatGallery(content.images);

    case 'book':
      return formatBook(content.bookId, content.content);

    case 'tweet':
      return formatTweet(content.content, content.isThread);

    default:
      // Exhaustiveness check - TypeScript error if case missing
      const _exhaustive: never = content;
      throw new Error(`Unsupported content type: ${(_exhaustive as any).type}`);
  }
}
```

### Alternatives Considered

1. **Class Hierarchy**: Rejected - More verbose, harder to serialize/deserialize, no better type safety
2. **Type Guards Only**: Rejected - No runtime validation, relying on manual type checking error-prone
3. **Branded Types**: Rejected - Adds complexity without improving safety over discriminated unions

---

## 2. Strategy Pattern Implementation

### Research Question
Optimal way to implement HtmlFetcher and ContentExtractor strategies for maximum code reuse?

### Decision: Interface-Based Strategy Pattern + Constructor Injection

**Rationale**:
- Interfaces provide clear contracts without implementation coupling
- Constructor injection makes dependencies explicit and testable
- Composition over inheritance aligns with "favor composition" principle
- No need for complex DI framework - simple manual wiring sufficient for small number of strategies

### Implementation Pattern

#### Strategy Interfaces

```typescript
// src/lib/parsers/strategies/html-fetcher.ts
export interface HtmlFetcher {
  fetch(url: string, options?: ParserOptions): Promise<string>;
}

export class PlaywrightHtmlFetcher implements HtmlFetcher {
  async fetch(url: string, options?: ParserOptions): Promise<string> {
    // Playwright implementation (reuses existing xiaohongshu logic)
    const browser = await chromium.launch({ headless: true });
    try {
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: options?.timeout });
      return await page.content();
    } finally {
      await browser.close();
    }
  }
}

export class OfetchHtmlFetcher implements HtmlFetcher {
  async fetch(url: string, options?: ParserOptions): Promise<string> {
    return await ofetch(url, {
      timeout: options?.timeout || 15000,
      headers: options?.headers || {}
    });
  }
}
```

#### Content Detector Strategy

```typescript
// src/lib/parsers/strategies/content-detector.ts
export interface ContentDetector {
  detect(url: string, html: string): ContentType;
}

export class XhsContentDetector implements ContentDetector {
  detect(url: string, html: string): ContentType {
    // Check for video player markers
    if (html.includes('video-player') || html.includes('"type":"video"')) {
      return 'video';
    }
    // Default to image gallery for Xiaohongshu
    return 'image-gallery';
  }
}

export class BilibiliContentDetector implements ContentDetector {
  detect(url: string, html: string): ContentType {
    // Bilibili is always video
    return 'video';
  }
}
```

#### Content Extractor Strategy

```typescript
// src/lib/parsers/extractors/base.ts
export interface ContentExtractor<T extends BaseContent> {
  extract(html: string, url: string): T;
}

// Platform + Type-specific implementation
export class XhsVideoExtractor implements ContentExtractor<VideoContent> {
  extract(html: string, url: string): VideoContent {
    const $ = cheerio.load(html);

    return {
      type: 'video',
      title: this.extractTitle($),
      videoUrl: this.extractVideoUrl($),
      cover: this.extractCover($),
      description: this.extractDescription($),
      platform: 'xiaohongshu',
      originalUrl: url
    };
  }

  private extractTitle($: cheerio.CheerioAPI): string {
    return $('meta[property="og:title"]').attr('content') || 'Xiaohongshu Video';
  }

  private extractVideoUrl($: cheerio.CheerioAPI): string {
    // Extract from video player config or meta tags
    return $('video source').attr('src') || '';
  }

  // ... other extraction methods
}
```

#### Parser Using Strategies

```typescript
export class XiaohongshuParser extends BaseParser {
  private htmlFetcher: HtmlFetcher;
  private contentDetector: ContentDetector;
  private extractors: Map<ContentType, ContentExtractor<any>>;

  constructor() {
    super();
    // Dependency injection via constructor
    this.htmlFetcher = supportsPlaywrightBrowser()
      ? new PlaywrightHtmlFetcher()
      : new OfetchHtmlFetcher();

    this.contentDetector = new XhsContentDetector();

    this.extractors = new Map([
      ['video', new XhsVideoExtractor()],
      ['image-gallery', new XhsImageGalleryExtractor()]
    ]);
  }

  async parse(url: string, options?: ParserOptions): Promise<ParsedContent> {
    // Step 1: Fetch HTML (delegates to strategy)
    const html = await this.htmlFetcher.fetch(url, options);

    // Step 2: Detect content type (delegates to strategy)
    const contentType = this.contentDetector.detect(url, html);

    // Step 3: Extract content (delegates to strategy)
    const extractor = this.extractors.get(contentType);
    if (!extractor) {
      throw new Error(`No extractor for content type: ${contentType}`);
    }

    return extractor.extract(html, url);
  }
}
```

### Testability Benefits

```typescript
// Easy to mock strategies for testing
describe('XiaohongshuParser', () => {
  it('should parse video content', async () => {
    const mockFetcher: HtmlFetcher = {
      fetch: jest.fn().mockResolvedValue('<html>...</html>')
    };
    const parser = new XiaohongshuParser();
    // Inject mock via constructor or setter
    // ...
  });
});
```

### Alternatives Considered

1. **Factory Pattern**: Rejected - Adds indirection without improving testability
2. **Dependency Injection Framework**: Rejected - Overkill for small number of strategies, adds complexity
3. **Service Locator**: Rejected - Global state, harder to test, unclear dependencies

---

## 3. Backward Compatibility Mapping

### Research Question
How to automatically map legacy ParsedContent format to new ArticleContent type without breaking existing API consumers?

### Decision: Type Alias + Runtime Type Guard + Automatic Mapping

**Rationale**:
- Maintains existing `ParsedContent` type name (no breaking changes)
- Automatically adds `type: 'article'` field to legacy objects
- Zero migration required for existing API consumers
- Type guards enable gradual migration to typed content

### Implementation Pattern

#### Type Alias for Backward Compatibility

```typescript
// src/lib/types/parser.ts (existing file)

// Legacy interface (DEPRECATED but maintained for compatibility)
export interface LegacyParsedContent {
  title: string;
  content: string;
  images: string[];
  author?: string;
  publishedAt?: Date;
  platform: PlatformType;
  originalUrl: string;
}

// New type system
import type { ParsedContent as NewParsedContent } from './content';

// Main export - now union of all content types
export type ParsedContent = NewParsedContent;

// Backward compatibility helper
export function toLegacyFormat(content: ParsedContent): LegacyParsedContent {
  if (content.type === 'article') {
    return {
      title: content.title,
      content: content.content,
      images: content.images,
      author: content.author,
      publishedAt: content.publishedAt,
      platform: content.platform,
      originalUrl: content.originalUrl
    };
  }

  // For non-article types, convert to article-like format
  return {
    title: content.title,
    content: JSON.stringify(content),
    images: [],
    author: content.author,
    publishedAt: content.publishedAt,
    platform: content.platform,
    originalUrl: content.originalUrl
  };
}
```

#### Automatic Type Field Addition

```typescript
// Helper function for legacy parsers
export function toArticleContent(legacy: Omit<ArticleContent, 'type'>): ArticleContent {
  return {
    ...legacy,
    type: 'article'
  };
}

// Used in parsers during migration:
export class WechatParser extends BaseParser {
  async parse(url: string, options?: ParserOptions): Promise<ParsedContent> {
    // Extract content
    const title = ...;
    const content = ...;
    const images = ...;

    // Automatically convert to ArticleContent
    return toArticleContent({
      title,
      content,
      images,
      platform: this.platform,
      originalUrl: url,
      author,
      publishedAt
    });
  }
}
```

#### Runtime Type Guard

```typescript
// Type guard for runtime checking
export function isArticleContent(content: ParsedContent): content is ArticleContent {
  return content.type === 'article';
}

export function isVideoContent(content: ParsedContent): content is VideoContent {
  return content.type === 'video';
}

// Usage in formatters
export class FlomoFormatter extends BaseOutputFormatter {
  format(content: ParsedContent): FormatterResult<FormattedOutput> {
    if (isArticleContent(content)) {
      // TypeScript knows content.content exists
      return this.formatArticle(content.content, content.images);
    } else if (isVideoContent(content)) {
      // TypeScript knows content.videoUrl exists
      return this.formatVideo(content.videoUrl, content.description);
    }

    // Fallback for unknown types
    return this.formatGeneric(content.title);
  }
}
```

#### Migration Path

**Phase 1 (Immediate)**: Add type field to all new parsers
**Phase 2 (Next sprint)**: Refactor existing parsers to use `toArticleContent()`
**Phase 3 (Future)**: Remove `toLegacyFormat()` helper after 6 months

### API Response Example

```typescript
// Legacy API response (before refactor)
{
  "success": true,
  "data": {
    "title": "Article Title",
    "content": "Article content...",
    "images": ["url1", "url2"],
    "platform": "xiaohongshu",
    "originalUrl": "https://..."
  }
}

// New API response (after refactor)
{
  "success": true,
  "data": {
    "type": "article",  // NEW FIELD - only addition
    "title": "Article Title",
    "content": "Article content...",
    "images": ["url1", "url2"],
    "platform": "xiaohongshu",
    "originalUrl": "https://..."
  }
}

// Video content response (new)
{
  "success": true,
  "data": {
    "type": "video",
    "title": "Video Title",
    "videoUrl": "https://...",
    "cover": "https://...",
    "description": "Video description",
    "platform": "bilibili",
    "originalUrl": "https://..."
  }
}
```

**Compatibility guarantee**: Existing clients checking `data.title`, `data.content`, `data.images` continue to work unchanged.

### Alternatives Considered

1. **Versioned API**: Rejected - Requires maintaining two endpoints, complicates deployment
2. **Feature Flags**: Rejected - Adds runtime complexity, doesn't solve type safety
3. **Breaking Change**: Rejected - Violates FR-009 requirement for zero breaking changes

---

## 4. Extractor Composition

### Research Question
How to compose multiple extractors for platforms that support multiple content types?

### Decision: Map-Based Strategy Selection + Content Type Detection

**Rationale**:
- Map provides O(1) lookup for extractor selection
- ContentDetector encapsulates type detection logic per platform
- Fallback to 'article' type ensures graceful degradation
- Clear separation: detection logic separate from extraction logic

### Implementation Pattern

```typescript
export class XiaohongshuParser extends BaseParser {
  platform = 'xiaohongshu' as const;
  supportedContentTypes = ['video', 'image-gallery'] as const;

  private htmlFetcher: HtmlFetcher;
  private contentDetector: ContentDetector;
  private extractors: Map<ContentType, ContentExtractor<any>>;

  constructor() {
    super();
    this.htmlFetcher = new PlaywrightHtmlFetcher();
    this.contentDetector = new XhsContentDetector();

    // Register extractors for each supported type
    this.extractors = new Map([
      ['video', new XhsVideoExtractor()],
      ['image-gallery', new XhsImageGalleryExtractor()]
    ]);
  }

  async parse(url: string, options?: ParserOptions): Promise<ParsedContent> {
    const html = await this.htmlFetcher.fetch(url, options);

    // Detect content type from HTML
    const contentType = this.contentDetector.detect(url, html);

    // Select appropriate extractor
    const extractor = this.extractors.get(contentType);
    if (!extractor) {
      console.warn(`No extractor for ${contentType}, falling back to image-gallery`);
      return this.extractors.get('image-gallery')!.extract(html, url);
    }

    return extractor.extract(html, url);
  }
}
```

### Content Type Detection Algorithm

```typescript
export class XhsContentDetector implements ContentDetector {
  detect(url: string, html: string): ContentType {
    // Priority 1: Check URL pattern
    if (url.includes('/video/') || url.match(/\/explore\/[a-z0-9]+\?xhsshare=video/)) {
      return 'video';
    }

    // Priority 2: Check HTML structure
    const isVideo =
      html.includes('"type":"video"') ||
      html.includes('class="video-player"') ||
      html.includes('<video') ||
      /<meta[^>]*og:type[^>]*video/i.test(html);

    if (isVideo) {
      return 'video';
    }

    // Priority 3: Check meta tags
    const metaType = html.match(/<meta[^>]*property="og:type"[^>]*content="([^"]+)"/);
    if (metaType && metaType[1] === 'video') {
      return 'video';
    }

    // Default: Image gallery (most common for Xiaohongshu)
    return 'image-gallery';
  }
}
```

### Fallback Behavior

```typescript
export abstract class BaseParser {
  protected getExtractorWithFallback(
    contentType: ContentType,
    extractors: Map<ContentType, ContentExtractor<any>>
  ): ContentExtractor<any> {
    // Try exact match
    let extractor = extractors.get(contentType);
    if (extractor) return extractor;

    // Fallback: Try 'article' type
    extractor = extractors.get('article');
    if (extractor) {
      console.warn(`No extractor for ${contentType}, using article extractor`);
      return extractor;
    }

    // Last resort: Use first available extractor
    const firstExtractor = extractors.values().next().value;
    console.error(`No article extractor, using first available: ${contentType}`);
    return firstExtractor;
  }
}
```

### Alternatives Considered

1. **Chain of Responsibility**: Rejected - Overkill, adds traversal overhead, less clear than map lookup
2. **Composite Pattern**: Rejected - Would merge extraction logic, reduces clarity
3. **Single Generic Extractor**: Rejected - Leads to complex conditional logic within extractor

---

## 5. Formatter Adaptation

### Research Question
How formatters should handle new content types they don't explicitly support?

### Decision: Type-Switch with Graceful Fallback + Default Formatting

**Rationale**:
- Type switch provides explicit handling for known types
- Fallback to generic formatting ensures no errors for unknown types
- Logged warnings alert developers to missing type support
- Extensible - new formatters can add support incrementally

### Implementation Pattern

```typescript
export class FlomoFormatter extends BaseOutputFormatter {
  readonly capabilities: PlatformCapabilities = {
    supportsImages: true,
    supportsDirectCreate: true,
    maxContentLength: 5000
  };

  format(content: ParsedContent): FormatterResult<FormattedOutput> {
    // Validate first
    const validated = this.validateContent(content);
    if (!validated.success) return validated;

    try {
      // Type-specific formatting
      switch (content.type) {
        case 'article':
          return this.formatArticle(content);

        case 'video':
          return this.formatVideo(content);

        case 'image-gallery':
          return this.formatImageGallery(content);

        case 'book':
          return this.formatBook(content);

        case 'tweet':
          return this.formatTweet(content);

        default:
          // Fallback for unknown types
          console.warn(`Flomo: Unknown content type ${(content as any).type}, using generic format`);
          return this.formatGeneric(content);
      }
    } catch (error) {
      return Err('FORMATTING_FAILED', `Flomo formatting failed: ${error}`, error);
    }
  }

  private formatArticle(content: ArticleContent): FormatterResult<FormattedOutput> {
    const text = `${content.title}\n\n${content.content}`;
    const images = content.images.slice(0, 9);
    const imageLinks = images.length > 0
      ? `\n\nImages: ${images.join('\n')}`
      : '';

    const fullContent = text + imageLinks;
    const truncated = truncateForURL(fullContent, this.capabilities.maxContentLength!);

    return Ok({
      type: 'url_scheme',
      value: `flomo://create?content=${encodeURIComponent(truncated)}`
    });
  }

  private formatVideo(content: VideoContent): FormatterResult<FormattedOutput> {
    const text = [
      content.title,
      content.description,
      `\nWatch: ${content.videoUrl}`,
      content.cover ? `Cover: ${content.cover}` : ''
    ].filter(Boolean).join('\n\n');

    const truncated = truncateForURL(text, this.capabilities.maxContentLength!);

    return Ok({
      type: 'url_scheme',
      value: `flomo://create?content=${encodeURIComponent(truncated)}`
    });
  }

  private formatGeneric(content: BaseContent): FormatterResult<FormattedOutput> {
    // Fallback formatting - use only base fields
    const text = `${content.title}\n\nSource: ${content.originalUrl}`;
    const truncated = truncateForURL(text, this.capabilities.maxContentLength!);

    return Ok({
      type: 'url_scheme',
      value: `flomo://create?content=${encodeURIComponent(truncated)}`,
      fallback: `⚠️ Generic format used for content type: ${content.type}`
    });
  }
}
```

### Progressive Enhancement Strategy

```typescript
// Formatters can gradually add type support
export class NotesFormatter extends BaseOutputFormatter {
  readonly capabilities: PlatformCapabilities = {
    supportsImages: false,  // Notes via URL scheme doesn't support images
    supportsDirectCreate: false,
    maxContentLength: 10000
  };

  format(content: ParsedContent): FormatterResult<FormattedOutput> {
    // Phase 1: Only support article
    if (content.type === 'article') {
      return this.formatArticle(content);
    }

    // Phase 2: Add video support later
    // if (content.type === 'video') {
    //   return this.formatVideo(content);
    // }

    // Fallback for all other types
    return this.formatGeneric(content);
  }
}
```

### User Experience for Unsupported Types

```typescript
// Example: User tries to format book content to flomo
const bookContent: BookContent = {
  type: 'book',
  title: 'Chapter 5: The Parser',
  bookId: 'book123',
  content: '...',
  platform: 'wechat-read',
  originalUrl: 'https://...'
};

const result = flomoFormatter.format(bookContent);

// Result:
// {
//   type: 'url_scheme',
//   value: 'flomo://create?content=Chapter%205%3A%20The%20Parser%0A%0ASource%3A%20https%3A%2F%2F...',
//   fallback: '⚠️ Generic format used for content type: book'
// }

// User sees: "Chapter 5: The Parser\n\nSource: https://..."
// Developer sees warning in logs: "Flomo: Unknown content type book, using generic format"
```

### Alternatives Considered

1. **Strict Type Checking**: Rejected - Blocks users from trying new content types with existing formatters
2. **Error Throwing**: Rejected - Poor user experience, breaks existing flows
3. **Adapter Pattern**: Rejected - Over-engineering, fallback is simpler

---

## Summary of Decisions

| Research Area | Decision | Key Benefit |
|---------------|----------|-------------|
| Content Type System | TypeScript Discriminated Unions + Zod | Compile-time + runtime type safety |
| Strategy Pattern | Interface-based + Constructor Injection | Testability, explicit dependencies |
| Backward Compatibility | Type Alias + Automatic Mapping | Zero breaking changes |
| Extractor Composition | Map-Based Selection + Detection Strategy | O(1) lookup, clear separation of concerns |
| Formatter Adaptation | Type-Switch + Graceful Fallback | Progressive enhancement, no errors |

All technical decisions support the core goals:
- ✅ Type safety across parser-formatter boundary
- ✅ Code reuse (70% reduction goal)
- ✅ Backward compatibility (zero breaking changes)
- ✅ Extensibility (<100 lines per new parser)
- ✅ Graceful degradation (no errors for unknown types)

**Next Phase**: Use these decisions to design data models, contracts, and quickstart guide in Phase 1.
