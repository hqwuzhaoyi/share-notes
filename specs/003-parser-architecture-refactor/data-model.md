# Data Model: Parser Architecture Refactor

**Date**: 2025-11-19
**Status**: Complete
**Based on**: research.md technical decisions

---

## Content Type Hierarchy

### BaseContent (Interface)

**Purpose**: Common interface for all content types, providing type discrimination and shared fields.

**Fields**:
- `type: ContentType` - Discriminator field for TypeScript type narrowing (REQUIRED)
- `title: string` - Content title (REQUIRED, min length: 1)
- `platform: PlatformType` - Source platform (REQUIRED)
- `originalUrl: string` - Source URL (REQUIRED, must be valid URL)
- `author?: string` - Content author/creator (OPTIONAL)
- `publishedAt?: Date` - Publication timestamp (OPTIONAL)

**Validation Rules**:
- Title must be non-empty after trimming
- Platform must be valid PlatformType enum value
- Original URL must be valid HTTP/HTTPS URL
- No null values allowed (use undefined for optional fields)

**State**: Immutable value object - no state transitions

**TypeScript Definition**:
```typescript
interface BaseContent {
  type: ContentType;
  title: string;
  platform: PlatformType;
  originalUrl: string;
  author?: string;
  publishedAt?: Date;
}
```

---

### ArticleContent (Extends BaseContent)

**Purpose**: Text-based articles with optional images (blogs, news articles, public account posts).

**Additional Fields**:
- `content: string` - Article text content (REQUIRED, min length: 1)
- `images: string[]` - Array of image URLs (REQUIRED, can be empty array)

**Validation Rules**:
- Content must be non-empty after trimming
- Each image URL must be valid HTTP/HTTPS URL
- Images array limited to 50 items max (performance)

**Backward Compatibility**:
- Maps from legacy `ParsedContent` format automatically
- When `type` field missing, assumed to be ArticleContent

**TypeScript Definition**:
```typescript
interface ArticleContent extends BaseContent {
  type: 'article';
  content: string;
  images: string[];
}
```

**Example**:
```json
{
  "type": "article",
  "title": "深度解析：iOS 解析器架构",
  "content": "本文介绍了一种新的解析器架构...",
  "images": ["https://example.com/image1.jpg"],
  "platform": "wechat",
  "originalUrl": "https://mp.weixin.qq.com/...",
  "author": "技术博主",
  "publishedAt": "2025-11-19T10:00:00Z"
}
```

---

### VideoContent (Extends BaseContent)

**Purpose**: Video content from video platforms (YouTube, Bilibili, Xiaohongshu video).

**Additional Fields**:
- `videoUrl: string` - Direct video URL or platform video page (REQUIRED)
- `cover?: string` - Video cover/thumbnail image URL (OPTIONAL)
- `duration?: number` - Video duration in seconds (OPTIONAL, >0)
- `description: string` - Video description/summary (REQUIRED, can be empty string)
- `metadata?: Record<string, any>` - Platform-specific metadata (OPTIONAL)

**Validation Rules**:
- VideoUrl must be valid HTTP/HTTPS URL
- Duration must be positive number if present
- Cover must be valid image URL if present
- Metadata is extensible for platform-specific fields

**Platform-Specific Metadata Examples**:
- **YouTube**: `{ videoId: string, channelId?: string, channelName?: string }`
- **Bilibili**: `{ bvid: string, aid?: number, cid?: number }`
- **Xiaohongshu**: `{ noteId: string, userId?: string }`

**TypeScript Definition**:
```typescript
interface VideoContent extends BaseContent {
  type: 'video';
  videoUrl: string;
  cover?: string;
  duration?: number;
  description: string;
  metadata?: Record<string, any>;
}
```

**Example**:
```json
{
  "type": "video",
  "title": "如何构建高性能解析器",
  "videoUrl": "https://bilibili.com/video/BV1xx411c7XD",
  "cover": "https://i0.hdslb.com/bfs/archive/cover.jpg",
  "duration": 600,
  "description": "本视频详细讲解解析器设计模式",
  "platform": "bilibili",
  "originalUrl": "https://bilibili.com/video/BV1xx411c7XD",
  "author": "技术UP主",
  "metadata": {
    "bvid": "BV1xx411c7XD",
    "aid": 123456
  }
}
```

---

### ImageGalleryContent (Extends BaseContent)

**Purpose**: Image-focused content (Xiaohongshu posts, Instagram-like content).

**Additional Fields**:
- `images: string[]` - Array of image URLs (REQUIRED, min length: 1)
- `description: string` - Gallery description/caption (REQUIRED, can be empty)

**Validation Rules**:
- Images array must contain at least 1 image
- Each image URL must be valid HTTP/HTTPS URL
- Images limited to 50 items max
- Description can be empty string but not null/undefined

**TypeScript Definition**:
```typescript
interface ImageGalleryContent extends BaseContent {
  type: 'image-gallery';
  images: string[];
  description: string;
}
```

**Example**:
```json
{
  "type": "image-gallery",
  "title": "周末户外探险",
  "images": [
    "https://xhscdn.com/image1.jpg",
    "https://xhscdn.com/image2.jpg",
    "https://xhscdn.com/image3.jpg"
  ],
  "description": "今天的天气真好，和朋友们一起去爬山",
  "platform": "xiaohongshu",
  "originalUrl": "https://xiaohongshu.com/explore/xxxxx"
}
```

---

### BookContent (Extends BaseContent)

**Purpose**: Book excerpts, chapters, reading notes (WeChat Read, Kindle).

**Additional Fields**:
- `bookId: string` - Platform-specific book identifier (REQUIRED)
- `chapterTitle?: string` - Chapter/section title (OPTIONAL)
- `content: string` - Excerpt or reading note content (REQUIRED, min length: 1)
- `cover?: string` - Book cover image URL (OPTIONAL)

**Validation Rules**:
- BookId must be non-empty
- Content must be non-empty after trimming
- Cover must be valid image URL if present

**TypeScript Definition**:
```typescript
interface BookContent extends BaseContent {
  type: 'book';
  bookId: string;
  chapterTitle?: string;
  content: string;
  cover?: string;
}
```

**Example**:
```json
{
  "type": "book",
  "title": "深入理解计算机系统",
  "bookId": "wechat-read-12345",
  "chapterTitle": "第三章：程序的机器级表示",
  "content": "本章介绍了处理器如何执行指令...",
  "cover": "https://wereader.com/cover.jpg",
  "platform": "wechat-read",
  "originalUrl": "https://weread.qq.com/..."
}
```

---

### TweetContent (Extends BaseContent)

**Purpose**: Social media posts, microblogs (Twitter/X, Weibo).

**Additional Fields**:
- `content: string` - Tweet text content (REQUIRED, min length: 1)
- `images: string[]` - Attached images (REQUIRED, can be empty)
- `isThread: boolean` - Whether this is part of a thread (REQUIRED)
- `threadTweets?: TweetContent[]` - Additional tweets if thread (OPTIONAL)

**Validation Rules**:
- Content must be non-empty after trimming
- Each image URL must be valid if present
- If isThread=true, threadTweets should be present
- Thread depth limited to 1 level (no nested threads)

**TypeScript Definition**:
```typescript
interface TweetContent extends BaseContent {
  type: 'tweet';
  content: string;
  images: string[];
  isThread: boolean;
  threadTweets?: TweetContent[];
}
```

**Example (Single Tweet)**:
```json
{
  "type": "tweet",
  "title": "刚刚发布了新的解析器库",
  "content": "经过两周的开发，我们的新解析器库终于上线了！支持5种内容类型 🎉",
  "images": ["https://twitter.com/image.jpg"],
  "isThread": false,
  "platform": "twitter",
  "originalUrl": "https://twitter.com/user/status/123"
}
```

**Example (Thread)**:
```json
{
  "type": "tweet",
  "title": "关于解析器架构的思考 (1/3)",
  "content": "今天想分享一下我们重构解析器的经验...",
  "images": [],
  "isThread": true,
  "threadTweets": [
    {
      "type": "tweet",
      "title": "关于解析器架构的思考 (2/3)",
      "content": "第一个关键决策是使用策略模式...",
      "images": [],
      "isThread": false,
      "platform": "twitter",
      "originalUrl": "https://twitter.com/user/status/124"
    }
  ],
  "platform": "twitter",
  "originalUrl": "https://twitter.com/user/status/123"
}
```

---

## Strategy Pattern Interfaces

### HtmlFetcher (Interface)

**Purpose**: Abstract interface for fetching HTML content with different methods.

**Method**:
- `fetch(url: string, options?: ParserOptions): Promise<string>`

**Implementations**:
1. **PlaywrightHtmlFetcher**: Uses Playwright browser automation (for dynamic content, anti-bot sites)
2. **OfetchHtmlFetcher**: Uses HTTP client (for static content, API endpoints)

**Selection Logic**:
```
IF environment supports Playwright (local dev, Docker)
  THEN use PlaywrightHtmlFetcher
  ELSE use OfetchHtmlFetcher (Vercel serverless)

OR

IF platform requires JavaScript execution (Xiaohongshu)
  THEN use PlaywrightHtmlFetcher
  ELSE use OfetchHtmlFetcher
```

**Error Handling**:
- Network timeout → throw with descriptive error
- HTTP error status → throw with status code
- Invalid URL → throw validation error

**TypeScript Definition**:
```typescript
interface ParserOptions {
  timeout?: number;
  headers?: Record<string, string>;
  usePlaywright?: boolean;
  preloadedHtml?: string;
}

interface HtmlFetcher {
  fetch(url: string, options?: ParserOptions): Promise<string>;
}
```

---

### ContentDetector (Interface)

**Purpose**: Determine content type from URL and HTML structure.

**Method**:
- `detect(url: string, html: string): ContentType`

**Platform-Specific Implementations**:
- `XhsContentDetector`: Xiaohongshu (video vs image-gallery)
- `BilibiliContentDetector`: Bilibili (always video)
- `WechatContentDetector`: WeChat (article vs book)
- `TwitterContentDetector`: Twitter (single tweet vs thread)

**Detection Algorithm (Priority Order)**:
1. Check URL pattern (e.g., `/video/` → video)
2. Check HTML structure (e.g., `<video>` tag → video)
3. Check meta tags (e.g., `og:type="video"` → video)
4. Default to 'article' if uncertain

**Fallback**: Always returns a ContentType (never throws errors)

**TypeScript Definition**:
```typescript
interface ContentDetector {
  detect(url: string, html: string): ContentType;
}
```

---

### ContentExtractor<T> (Generic Interface)

**Purpose**: Extract structured content of specific type from raw HTML.

**Method**:
- `extract(html: string, url: string): T extends BaseContent`

**Naming Convention**: `{Platform}{Type}Extractor`
- Examples: `XhsVideoExtractor`, `BilibiliVideoExtractor`, `WechatArticleExtractor`

**Error Handling**:
- Missing required fields → throw extraction error
- Missing optional fields → log warning, return undefined
- Partial data → return partial object with available fields

**Example Implementations**:
- `XhsVideoExtractor implements ContentExtractor<VideoContent>`
- `XhsImageGalleryExtractor implements ContentExtractor<ImageGalleryContent>`
- `BilibiliVideoExtractor implements ContentExtractor<VideoContent>`
- `WechatArticleExtractor implements ContentExtractor<ArticleContent>`

**TypeScript Definition**:
```typescript
interface ContentExtractor<T extends BaseContent> {
  extract(html: string, url: string): T;
}
```

---

## Type System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        ParsedContent                        │
│                      (Discriminated Union)                  │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴──────────────┐
                │                            │
         ┌──────▼─────┐              ┌──────▼────────┐
         │BaseContent │              │  ContentType  │
         │(interface) │              │    (enum)     │
         └──────┬─────┘              └───────────────┘
                │
    ┌───────────┼───────────┬───────────┬────────────┐
    │           │           │           │            │
┌───▼────┐  ┌──▼─────┐ ┌──▼──────┐ ┌──▼──────┐ ┌───▼────┐
│Article │  │ Video  │ │  Image  │ │  Book   │ │ Tweet  │
│Content │  │Content │ │ Gallery │ │ Content │ │Content │
└────────┘  └────────┘ └─────────┘ └─────────┘ └────────┘
```

## Strategy Pattern Diagram

```
┌─────────────────┐
│   BaseParser    │
│  (abstract)     │
└────────┬────────┘
         │ uses
    ┌────┼────┬──────────────────────────────┐
    │    │    │                              │
┌───▼────▼─┐  │                    ┌─────────▼─────────┐
│HtmlFetcher│  │                    │ContentDetector    │
│(interface)│  │                    │(interface)        │
└─────┬─────┘  │                    └─────────┬─────────┘
      │        │                              │
  ┌───┴───┐    │              ┌───────────────┴────────────┐
  │       │    │              │                            │
┌─▼─┐  ┌─▼─┐   │      ┌───────▼────────┐    ┌────────────▼─────┐
│PWF│  │OFT│   │      │XhsContentDetect│    │BiliContentDetect │
└───┘  └───┘   │      └────────────────┘    └──────────────────┘
               │
         ┌─────▼────────────┐
         │ContentExtractor  │
         │<T> (interface)   │
         └─────┬────────────┘
               │
    ┌──────────┴──────────┬──────────────────┐
    │                     │                  │
┌───▼────────┐  ┌─────────▼──────┐  ┌───────▼────────┐
│XhsVideo    │  │XhsImageGallery │  │BiliVideo       │
│Extractor   │  │Extractor       │  │Extractor       │
└────────────┘  └────────────────┘  └────────────────┘
```

---

## Relationship Summary

**Content Types**:
- 5 concrete content types extending BaseContent
- Discriminated by `type` field for type-safe pattern matching
- All immutable value objects

**Strategies**:
- 3 strategy interfaces: HtmlFetcher, ContentDetector, ContentExtractor<T>
- Multiple implementations per interface (platform/method specific)
- Composed via constructor injection in parsers

**Data Flow**:
```
URL → Parser.parse()
  ↓
1. HtmlFetcher.fetch() → HTML string
  ↓
2. ContentDetector.detect() → ContentType
  ↓
3. ContentExtractor<T>.extract() → BaseContent subtype
  ↓
Return typed ParsedContent
```

---

## Zod Schemas (Runtime Validation)

All content types have corresponding Zod schemas for runtime validation:
- `BaseContentSchema`
- `ArticleContentSchema`
- `VideoContentSchema`
- `ImageGalleryContentSchema`
- `BookContentSchema`
- `TweetContentSchema`
- `ParsedContentSchema` (discriminated union)

See `contracts/content-types.schema.json` for JSON Schema format.
