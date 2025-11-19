# Implementation Plan: Parser Architecture Refactor

**Branch**: `003-parser-architecture-refactor` | **Date**: 2025-11-19 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-parser-architecture-refactor/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

This architectural refactor addresses critical technical debt in the Parser layer by introducing a content type system and extracting common parsing strategies. The primary requirement is to enable support for multiple content types (article, video, image-gallery, book, tweet) while reducing parser implementation complexity from 800+ lines to under 100 lines. The technical approach uses TypeScript discriminated unions for type safety, strategy pattern for HTML fetching and content extraction, and composition over inheritance to enable code reuse across platform parsers.

## Technical Context

**Language/Version**: TypeScript 5.x (existing project standard)
**Primary Dependencies**: Next.js 15.5.0, React 19.1.0, Zod 4.1.8 (for validation), Cheerio 1.1.2 (HTML parsing), Playwright 1.55.0 (browser automation), ofetch 1.4.1 (HTTP client)
**Storage**: N/A (stateless parsing system)
**Testing**: Vitest 3.2.4 (unit tests), existing integration test suite (test/test-api.js)
**Target Platform**: Next.js App Router API routes, deployed on Vercel Serverless
**Project Type**: Single (Next.js application with API routes)
**Performance Goals**: Parse content in <5 seconds p95, support concurrent requests via Vercel serverless scaling
**Constraints**: Backward compatibility required (existing API consumers must work unchanged), zero breaking changes to /api/parse endpoint
**Scale/Scope**: 3 existing platform parsers to refactor (Xiaohongshu, Bilibili, WeChat), support for 6+ new platforms (YouTube, Twitter, WeChat Read, etc.), 5 content types to support

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: ✅ **PASS** (No constitution file exists - no constraints to validate)

The project does not currently have a constitution file defined. Therefore, there are no architectural constraints to validate. All design decisions will follow the spec requirements and TypeScript/Next.js best practices.

**Post-Phase 1 Re-check**: Will verify backward compatibility requirement (FR-009) is satisfied by design artifacts.

## Project Structure

### Documentation (this feature)

```text
specs/003-parser-architecture-refactor/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
│   └── content-types.schema.json    # TypeScript type schemas
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── types/
│   │   ├── parser.ts              # Existing (to be extended)
│   │   ├── content.ts             # NEW: Content type definitions
│   │   └── formatter.ts           # Existing (to be updated for new types)
│   │
│   ├── parsers/
│   │   ├── index.ts               # ParserManager (to be refactored)
│   │   ├── base.ts                # BaseParser (to be extended)
│   │   ├── xiaohongshu.ts         # Existing (to be refactored)
│   │   ├── bilibili.ts            # Existing (to be refactored)
│   │   ├── wechat.ts              # Existing (to be refactored)
│   │   │
│   │   ├── strategies/            # NEW: Strategy pattern implementations
│   │   │   ├── html-fetcher.ts    # HtmlFetcher interface + implementations
│   │   │   └── content-detector.ts # ContentDetector interface + implementations
│   │   │
│   │   └── extractors/            # NEW: Content extraction strategies
│   │       ├── base.ts            # ContentExtractor<T> interface
│   │       ├── article-extractor.ts
│   │       ├── video-extractor.ts
│   │       ├── image-gallery-extractor.ts
│   │       └── [platform-specific extractors]
│   │
│   └── formatters/
│       ├── flomo-formatter.ts     # To be updated for new types
│       ├── notes-formatter.ts     # To be updated for new types
│       └── raw-formatter.ts       # To be updated for new types
│
└── test/
    ├── parsers/
    │   ├── xiaohongshu.test.ts    # Existing (to be updated)
    │   ├── content-types.test.ts  # NEW: Type system tests
    │   └── strategies.test.ts     # NEW: Strategy pattern tests
    │
    └── formatters/
        └── multi-type.test.ts     # NEW: Multi-type formatting tests
```

**Structure Decision**: Using existing single-project Next.js structure. All refactoring occurs within `src/lib/parsers/` with new subdirectories for strategies and extractors. This maintains consistency with the current codebase while clearly separating new architectural patterns from legacy code.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

N/A - No constitution violations to track.

## Phase 0: Research & Technical Decisions

**Objective**: Resolve all NEEDS CLARIFICATION items and establish technical patterns for implementation.

### Research Tasks

1. **Content Type Discrimination Pattern**
   - **Unknown**: How to implement TypeScript discriminated unions for 5+ content types while maintaining type safety across parser-formatter boundary
   - **Research needed**: TypeScript discriminated union best practices, Zod schema validation for runtime type checking
   - **Decision criteria**: Type safety, runtime validation performance, backward compatibility with existing ParsedContent

2. **Strategy Pattern Implementation**
   - **Unknown**: Optimal way to implement HtmlFetcher and ContentExtractor strategies for maximum code reuse
   - **Research needed**: TypeScript strategy pattern implementations, dependency injection approaches, factory pattern alternatives
   - **Decision criteria**: Code clarity, testability, ease of adding new strategies

3. **Backward Compatibility Mapping**
   - **Unknown**: How to automatically map legacy ParsedContent format to new ArticleContent type without breaking existing API consumers
   - **Research needed**: Type adapter patterns, TypeScript type guards, runtime type coercion approaches
   - **Decision criteria**: Zero breaking changes, performance overhead, code maintainability

4. **Extractor Composition**
   - **Unknown**: How to compose multiple extractors for platforms that support multiple content types (e.g., Xiaohongshu has both image galleries and videos)
   - **Research needed**: Composite pattern, chain of responsibility pattern, content type detection heuristics
   - **Decision criteria**: Accuracy of content type detection, fallback behavior, code complexity

5. **Formatter Adaptation**
   - **Unknown**: How formatters should handle new content types they don't explicitly support
   - **Research needed**: Graceful degradation patterns, fallback formatting strategies, type-based routing
   - **Decision criteria**: User experience for unsupported types, error handling, extensibility

### Expected Research Outcomes

**Output**: `research.md` containing:
- Selected TypeScript patterns with code examples
- Strategy pattern implementation approach with interfaces
- Backward compatibility mapping strategy with migration path
- Content type detection algorithm with pseudocode
- Formatter fallback behavior specification

## Phase 1: Design & Contracts

**Prerequisites**: `research.md` complete with all technical decisions documented

### 1. Data Model Design (`data-model.md`)

**Input**: Feature spec entities + research decisions

**Output**: `data-model.md` containing:

#### Content Type System

- **BaseContent** interface:
  - Fields: type (discriminator), title, platform, originalUrl, author?, publishedAt?
  - Validation rules: title non-empty, platform from PlatformType enum, originalUrl valid URL format
  - State: Immutable value object (no state transitions)

- **ArticleContent** (extends BaseContent):
  - Fields: type='article', content (string), images (string[])
  - Validation: content non-empty, images must be valid URLs
  - Backward compatibility: Maps from legacy ParsedContent automatically

- **VideoContent** (extends BaseContent):
  - Fields: type='video', videoUrl (string), cover? (string), duration? (number), description (string), metadata? (object)
  - Validation: videoUrl required and valid, duration >0 if present, metadata extensible for platform-specific data
  - Platform examples: YouTube (metadata.videoId), Bilibili (metadata.bvid, metadata.aid)

- **ImageGalleryContent** (extends BaseContent):
  - Fields: type='image-gallery', images (string[]), description (string)
  - Validation: images array non-empty, all image URLs valid

- **BookContent** (extends BaseContent):
  - Fields: type='book', bookId (string), chapterTitle? (string), content (string), cover? (string)
  - Validation: bookId non-empty, content non-empty

- **TweetContent** (extends BaseContent):
  - Fields: type='tweet', content (string), images (string[]), isThread (boolean), threadTweets? (TweetContent[])
  - Validation: content non-empty for non-thread tweets, threadTweets valid if isThread=true

#### Strategy Interfaces

- **HtmlFetcher** interface:
  - Method: fetch(url: string, options?: ParserOptions): Promise<string>
  - Implementations: PlaywrightHtmlFetcher, OfetchHtmlFetcher
  - Selection logic: Environment-based (Playwright for local, ofetch for Vercel)

- **ContentDetector** interface:
  - Method: detect(url: string, html: string): ContentType
  - Platform-specific implementations: XhsContentDetector, BilibiliContentDetector, etc.
  - Fallback: Default to 'article' if detection fails

- **ContentExtractor<T extends BaseContent>** interface:
  - Method: extract(html: string, url: string): T
  - Implementations: One per content type per platform (e.g., XhsVideoExtractor, BilibiliVideoExtractor)
  - Error handling: Return partial content with logged warnings for missing fields

#### Relationships

```
BaseContent (interface)
  ├─> ArticleContent
  ├─> VideoContent
  ├─> ImageGalleryContent
  ├─> BookContent
  └─> TweetContent

BaseParser (abstract class)
  └─> uses: HtmlFetcher, ContentDetector, Map<ContentType, ContentExtractor<T>>

HtmlFetcher (interface)
  ├─> PlaywrightHtmlFetcher
  └─> OfetchHtmlFetcher

ContentDetector (interface)
  └─> Platform-specific implementations

ContentExtractor<T> (interface)
  └─> Content-type + platform-specific implementations
```

### 2. API Contracts (`/contracts/`)

**Input**: Functional requirements from spec

**Output**: `contracts/content-types.schema.json` containing:

#### TypeScript Type Schemas

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "definitions": {
    "ContentType": {
      "type": "string",
      "enum": ["article", "video", "image-gallery", "book", "tweet"]
    },
    "PlatformType": {
      "type": "string",
      "enum": ["xiaohongshu", "bilibili", "wechat", "youtube", "twitter", "wechat-read", "unknown"]
    },
    "BaseContent": {
      "type": "object",
      "required": ["type", "title", "platform", "originalUrl"],
      "properties": {
        "type": { "$ref": "#/definitions/ContentType" },
        "title": { "type": "string", "minLength": 1 },
        "platform": { "$ref": "#/definitions/PlatformType" },
        "originalUrl": { "type": "string", "format": "uri" },
        "author": { "type": "string" },
        "publishedAt": { "type": "string", "format": "date-time" }
      }
    },
    "ArticleContent": {
      "allOf": [
        { "$ref": "#/definitions/BaseContent" },
        {
          "properties": {
            "type": { "const": "article" },
            "content": { "type": "string", "minLength": 1 },
            "images": {
              "type": "array",
              "items": { "type": "string", "format": "uri" }
            }
          },
          "required": ["content", "images"]
        }
      ]
    },
    "VideoContent": {
      "allOf": [
        { "$ref": "#/definitions/BaseContent" },
        {
          "properties": {
            "type": { "const": "video" },
            "videoUrl": { "type": "string", "format": "uri" },
            "cover": { "type": "string", "format": "uri" },
            "duration": { "type": "number", "minimum": 0 },
            "description": { "type": "string" },
            "metadata": { "type": "object" }
          },
          "required": ["videoUrl", "description"]
        }
      ]
    }
    // Similar for ImageGalleryContent, BookContent, TweetContent
  }
}
```

#### Parser Strategy Contracts

```typescript
// contracts/parser-strategies.ts (conceptual - not JSON)

interface HtmlFetcherContract {
  fetch(url: string, options?: ParserOptions): Promise<string>
  // Pre-condition: url must be valid URL string
  // Post-condition: Returns HTML string or throws error with descriptive message
  // Error cases: Network timeout, HTTP error status, invalid URL
}

interface ContentDetectorContract {
  detect(url: string, html: string): ContentType
  // Pre-condition: url valid, html non-empty
  // Post-condition: Returns ContentType enum value
  // Fallback: Returns 'article' if detection fails
  // No errors thrown - always returns a type
}

interface ContentExtractorContract<T extends BaseContent> {
  extract(html: string, url: string): T
  // Pre-condition: html non-empty, url valid
  // Post-condition: Returns typed content object
  // Partial data: Returns object with available fields, logs warnings for missing data
  // Error cases: Throws only for complete extraction failure
}
```

#### API Endpoint Contracts

**Existing /api/parse endpoint** (NO CHANGES):

```
POST /api/parse
Request: {
  "url": string,
  "output_format"?: "flomo" | "notes" | "raw",
  "ai_enhance"?: boolean,
  "ai_options"?: object
}

Response: {
  "success": boolean,
  "data": ParsedContent,  // Now union of all content types
  "ios_url"?: string,
  "parsed_at": Date
}
```

**Backward compatibility**: Response `data` field structure remains identical for article-type content, new fields appear only for new content types.

### 3. Developer Quickstart (`quickstart.md`)

**Output**: `quickstart.md` containing:

```markdown
# Parser Architecture Refactor - Developer Quickstart

## Adding a New Platform Parser (< 100 lines)

### Step 1: Define Content Detector

```typescript
// src/lib/parsers/strategies/content-detector.ts
export class YouTubeContentDetector implements ContentDetector {
  detect(url: string, html: string): ContentType {
    // YouTube is always video content
    return 'video';
  }
}
```

### Step 2: Create Content Extractor

```typescript
// src/lib/parsers/extractors/youtube-video-extractor.ts
export class YouTubeVideoExtractor implements ContentExtractor<VideoContent> {
  extract(html: string, url: string): VideoContent {
    const $ = cheerio.load(html);

    return {
      type: 'video',
      title: $('meta[property="og:title"]').attr('content') || 'YouTube Video',
      videoUrl: url,
      cover: $('meta[property="og:image"]').attr('content'),
      duration: this.extractDuration($),
      description: $('meta[property="og:description"]').attr('content') || '',
      platform: 'youtube',
      originalUrl: url,
      metadata: {
        videoId: this.extractVideoId(url)
      }
    };
  }

  private extractVideoId(url: string): string {
    const match = url.match(/[?&]v=([^&]+)/);
    return match ? match[1] : '';
  }

  private extractDuration($: cheerio.CheerioAPI): number | undefined {
    // Extract from meta tags or schema.org markup
    const duration = $('meta[itemprop="duration"]').attr('content');
    // Parse ISO 8601 duration format
    return duration ? this.parseIsoDuration(duration) : undefined;
  }
}
```

### Step 3: Create Platform Parser

```typescript
// src/lib/parsers/youtube.ts
export class YouTubeParser extends BaseParser {
  platform = 'youtube' as const;
  supportedContentTypes = ['video'] as const;

  private htmlFetcher = new OfetchHtmlFetcher();
  private contentDetector = new YouTubeContentDetector();
  private extractor = new YouTubeVideoExtractor();

  canParse(url: string): boolean {
    return /youtube\.com|youtu\.be/i.test(url);
  }

  async parse(url: string, options?: ParserOptions): Promise<VideoContent> {
    const html = await this.htmlFetcher.fetch(url, options);
    return this.extractor.extract(html, url);
  }
}
```

### Step 4: Register Parser

```typescript
// src/lib/parsers/index.ts
import { YouTubeParser } from './youtube';

constructor() {
  // Existing registrations
  this.parsers.set('xiaohongshu', new XiaohongshuParser());
  this.parsers.set('bilibili', new BilibiliParser());

  // New platform
  this.parsers.set('youtube', new YouTubeParser());
}
```

**Total code**: ~80 lines (parser ~30, extractor ~40, detector ~10)

## Handling Multiple Content Types per Platform

For platforms like Xiaohongshu that support both videos and image galleries:

```typescript
export class XiaohongshuParser extends BaseParser {
  supportedContentTypes = ['video', 'image-gallery'] as const;

  private extractors = new Map<ContentType, ContentExtractor<any>>([
    ['video', new XhsVideoExtractor()],
    ['image-gallery', new XhsImageGalleryExtractor()]
  ]);

  async parse(url: string, options?: ParserOptions): Promise<ParsedContent> {
    const html = await this.htmlFetcher.fetch(url, options);
    const contentType = this.contentDetector.detect(url, html);

    const extractor = this.extractors.get(contentType);
    if (!extractor) {
      throw new Error(`Unsupported content type: ${contentType}`);
    }

    return extractor.extract(html, url);
  }
}
```

## Testing New Content Types

```typescript
// test/parsers/content-types.test.ts
describe('VideoContent parsing', () => {
  it('should extract video metadata from YouTube', async () => {
    const url = 'https://youtube.com/watch?v=example';
    const result = await parserManager.parse(url);

    expect(result.type).toBe('video');
    expect(result).toHaveProperty('videoUrl');
    expect(result).toHaveProperty('cover');
    expect(result.platform).toBe('youtube');
  });

  it('should handle missing duration gracefully', async () => {
    // Test partial metadata extraction
  });
});
```

## Backward Compatibility

Existing code using `ParsedContent` continues to work:

```typescript
// Legacy code - still works
const content: ParsedContent = await parserManager.parse(url);
console.log(content.title); // ✅ Works

// New code - can use type narrowing
if (content.type === 'video') {
  console.log(content.videoUrl); // ✅ TypeScript knows this exists
}
```

Automatic mapping for legacy article content:

```typescript
// Old parser returning legacy format
return {
  title, content, images, author, publishedAt,
  platform, originalUrl
};

// Automatically becomes ArticleContent:
// { type: 'article', title, content, images, ... }
```
```

### 4. Agent Context Update

**Action**: Run `.specify/scripts/bash/update-agent-context.sh claude`

This will update `CLAUDE.md` to include:
- New content type system (BaseContent, ArticleContent, VideoContent, etc.)
- Strategy pattern usage (HtmlFetcher, ContentDetector, ContentExtractor)
- Updated parser structure with strategies/ and extractors/ directories
- Quickstart reference for adding new platforms

**Expected Changes**:
```diff
## Architecture

### Core Components

src/lib/
  ├── types/
+ │   ├── content.ts             # Content type system
  ├── parsers/
+ │   ├── strategies/            # Reusable strategies
+ │   └── extractors/            # Content extractors
```

## Phase 1 Completion Checklist

- [ ] `research.md` contains all technical decisions with rationale
- [ ] `data-model.md` defines all 5 content types with validation rules
- [ ] `data-model.md` defines all strategy interfaces (HtmlFetcher, ContentDetector, ContentExtractor)
- [ ] `contracts/content-types.schema.json` provides JSON schema for all types
- [ ] `quickstart.md` demonstrates adding a new platform in <100 lines
- [ ] `CLAUDE.md` updated with new architecture patterns
- [ ] Constitution re-check passes (backward compatibility verified in design)

## Implementation Readiness

**Status After Phase 1**: READY for `/speckit.tasks` to generate task breakdown.

**Key Design Artifacts**:
- Type system fully specified with discriminated unions
- Strategy pattern interfaces defined and documented
- Backward compatibility strategy validated (automatic ArticleContent mapping)
- Developer quickstart demonstrates <100 line parser implementation

**Next Command**: `/speckit.tasks` to generate dependency-ordered implementation tasks.
