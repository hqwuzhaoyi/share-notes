# Parser Architecture Refactor - Developer Quickstart

**Goal**: Add a new platform parser in under 100 lines of code by reusing strategies.

---

## Adding a New Platform Parser (YouTube Example)

### Step 1: Create Content Detector (10 lines)

```typescript
// src/lib/parsers/strategies/content-detector.ts
export class YouTubeContentDetector implements ContentDetector {
  detect(url: string, html: string): ContentType {
    // YouTube is always video content
    return 'video';
  }
}
```

### Step 2: Create Content Extractor (40 lines)

```typescript
// src/lib/parsers/extractors/youtube-video-extractor.ts
import { ContentExtractor, VideoContent } from '@/lib/types';
import * as cheerio from 'cheerio';

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
    const duration = $('meta[itemprop="duration"]').attr('content');
    return duration ? this.parseIsoDuration(duration) : undefined;
  }

  private parseIsoDuration(isoDuration: string): number {
    // Parse ISO 8601 duration (e.g., "PT10M30S" -> 630 seconds)
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    return hours * 3600 + minutes * 60 + seconds;
  }
}
```

### Step 3: Create Platform Parser (30 lines)

```typescript
// src/lib/parsers/youtube.ts
import { BaseParser, ParsedContent, ParserOptions, VideoContent } from '@/lib/types';
import { OfetchHtmlFetcher } from './strategies/html-fetcher';
import { YouTubeContentDetector } from './strategies/content-detector';
import { YouTubeVideoExtractor } from './extractors/youtube-video-extractor';

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

### Step 4: Register Parser (5 lines)

```typescript
// src/lib/parsers/index.ts
import { YouTubeParser } from './youtube';

constructor() {
  // ... existing registrations
  this.parsers.set('youtube', new YouTubeParser());
}
```

### Step 5: Update Platform Type (1 line)

```typescript
// src/lib/types/parser.ts
export type PlatformType = 'xiaohongshu' | 'bilibili' | 'wechat' | 'youtube' | 'unknown';
```

**Total: ~86 lines of actual code** (detector 10 + extractor 40 + parser 30 + registration 5 + type 1)

---

## Handling Multiple Content Types (Xiaohongshu Example)

For platforms supporting multiple content types:

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

---

## Testing New Content Types

```typescript
// test/parsers/youtube.test.ts
import { describe, it, expect } from 'vitest';
import { parserManager } from '@/lib/parsers';

describe('YouTubeParser', () => {
  it('should extract video metadata', async () => {
    const url = 'https://youtube.com/watch?v=dQw4w9WgXcQ';
    const result = await parserManager.parse(url);

    expect(result.type).toBe('video');
    expect(result.platform).toBe('youtube');
    expect(result).toHaveProperty('videoUrl');
    expect(result).toHaveProperty('cover');
  });

  it('should handle missing duration gracefully', async () => {
    // Test with URL that has no duration metadata
  });
});
```

---

## Backward Compatibility

Existing code continues to work:

```typescript
// Legacy code - still works
const content: ParsedContent = await parserManager.parse(url);
console.log(content.title); // ✅ Works

// New code - can use type narrowing
if (content.type === 'video') {
  console.log(content.videoUrl); // ✅ TypeScript knows this exists
}
```

Legacy parsers automatically become ArticleContent:

```typescript
// Old parser returning legacy format
return {
  title, content, images, author, publishedAt,
  platform, originalUrl
};

// Wrapped with toArticleContent() helper:
return toArticleContent({
  title, content, images, author, publishedAt,
  platform, originalUrl
});

// Result: { type: 'article', title, content, images, ... }
```

---

## Reusable Strategies

### HTML Fetchers

```typescript
// Option 1: Use ofetch (fast, serverless-friendly)
const fetcher = new OfetchHtmlFetcher();

// Option 2: Use Playwright (for JavaScript-heavy sites)
const fetcher = new PlaywrightHtmlFetcher();

// Option 3: Environment-based selection
const fetcher = supportsPlaywrightBrowser()
  ? new PlaywrightHtmlFetcher()
  : new OfetchHtmlFetcher();
```

### Content Detectors

Create platform-specific detector:

```typescript
export class BilibiliContentDetector implements ContentDetector {
  detect(url: string, html: string): ContentType {
    // Bilibili is always video
    return 'video';
  }
}

export class WechatContentDetector implements ContentDetector {
  detect(url: string, html: string): ContentType {
    // Check for book/article indicators
    if (html.includes('weread') || url.includes('book')) {
      return 'book';
    }
    return 'article';
  }
}
```

---

## Common Patterns

### Extraction Helpers

```typescript
export abstract class BaseExtractor {
  protected extractTitle($: cheerio.CheerioAPI): string {
    return $('meta[property="og:title"]').attr('content') ||
           $('title').text() ||
           'Untitled';
  }

  protected extractCover($: cheerio.CheerioAPI): string | undefined {
    return $('meta[property="og:image"]').attr('content') ||
           $('meta[name="twitter:image"]').attr('content');
  }

  protected cleanText(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }
}
```

### Error Handling

```typescript
export class XhsVideoExtractor implements ContentExtractor<VideoContent> {
  extract(html: string, url: string): VideoContent {
    try {
      const $ = cheerio.load(html);
      // ... extraction logic

      return {
        type: 'video',
        // ... required fields
      };
    } catch (error) {
      console.error(`XhsVideoExtractor failed:`, error);
      throw new Error(`Failed to extract Xiaohongshu video: ${error}`);
    }
  }
}
```

---

## Summary

**Before Refactor**: 808 lines per parser (XiaohongshuParser example)
**After Refactor**: ~86 lines per parser (reusing strategies)

**Code Reduction**: ~90% reduction in parser-specific code

**Developer Experience**: Add new platform in under 4 hours (vs 2-3 days before)
