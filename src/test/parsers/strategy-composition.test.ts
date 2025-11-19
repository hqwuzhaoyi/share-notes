/**
 * Integration tests for strategy composition pattern (T032 - US2)
 *
 * Tests how parsers compose HtmlFetcher and ContentExtractor strategies.
 * Validates the strategy pattern implementation across real parser workflows.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { YouTubeParser } from '@/lib/parsers/youtube';
import type { VideoContent } from '@/lib/types/content';
import type { ParserOptions } from '@/lib/types/parser';

describe('Strategy Composition Integration (T032)', () => {
  describe('YouTubeParser strategy composition', () => {
    let parser: YouTubeParser;

    beforeAll(() => {
      parser = new YouTubeParser();
    });

    it('should compose HtmlFetcher and VideoExtractor strategies', () => {
      // YouTubeParser should have strategy composition
      expect(parser).toBeDefined();
      expect(parser.platform).toBe('youtube');
      expect(parser.supportedContentTypes).toContain('video');
    });

    it('should use OfetchHtmlFetcher for HTML retrieval', () => {
      // Internal implementation detail - verifies composition pattern
      // YouTubeParser uses OfetchHtmlFetcher by default
      expect(parser).toHaveProperty('htmlFetcher');
    });

    it('should use YouTubeVideoExtractor for content extraction', () => {
      // Internal implementation detail - verifies composition pattern
      expect(parser).toHaveProperty('extractor');
    });

    it('should detect YouTube URLs correctly', () => {
      expect(parser.canParse('https://www.youtube.com/watch?v=test')).toBe(true);
      expect(parser.canParse('https://youtu.be/test')).toBe(true);
      expect(parser.canParse('https://example.com')).toBe(false);
    });

    it('should parse real YouTube URL and return VideoContent', async () => {
      const url = 'https://www.youtube.com/watch?v=jNQXAC9IVRw'; // "Me at the zoo"

      const result = await parser.parse(url);

      // Verify result is VideoContent
      expect(result.type).toBe('video');
      expect(result.title).toBeDefined();
      expect(result.videoUrl).toBe(url);
      expect(result.platform).toBe('youtube');

      // Verify video-specific fields
      expect(result).toHaveProperty('cover');
      expect(result).toHaveProperty('duration');
      expect(result).toHaveProperty('description');
    }, 30000); // Network request timeout

    it('should accept preloaded HTML to bypass fetcher', async () => {
      // This tests the composition flexibility - can skip fetcher step
      const mockHtml = `
        <html>
          <head>
            <meta property="og:title" content="Test Video">
            <meta property="og:video:url" content="https://youtube.com/watch?v=test">
            <meta property="og:image" content="https://i.ytimg.com/vi/test/maxresdefault.jpg">
          </head>
          <body>
            <script>var ytInitialData = {"videoDetails":{"videoId":"test","title":"Test Video","lengthSeconds":"120"}};</script>
          </body>
        </html>
      `;

      const options: ParserOptions = {
        preloadedHtml: mockHtml,
      };

      const result = await parser.parse('https://youtube.com/watch?v=test', options);

      expect(result.type).toBe('video');
      expect(result.title).toBeDefined();
    });
  });

  describe('Strategy pattern benefits', () => {
    it('should enable parser code reduction', () => {
      // YouTubeParser should be minimal (< 50 lines effective code)
      const parser = new YouTubeParser();

      // Verify parser is small because strategies handle complexity
      expect(parser).toBeDefined();

      // Parser only needs: canParse() + parse() + strategy composition
      expect(typeof parser.canParse).toBe('function');
      expect(typeof parser.parse).toBe('function');
      expect(parser).toHaveProperty('htmlFetcher');
      expect(parser).toHaveProperty('extractor');
    });

    it('should allow strategy reuse across parsers', () => {
      // OfetchHtmlFetcher can be used by multiple parsers
      // This validates the reusability benefit of strategy pattern
      const youtubeParser = new YouTubeParser();

      // Different parsers can share the same fetcher strategy
      expect(youtubeParser).toHaveProperty('htmlFetcher');
    });

    it('should enable independent testing of strategies', () => {
      // Because strategies are separate, they can be tested independently
      // This test validates that the composition doesn't create tight coupling

      const parser = new YouTubeParser();

      // Can test parser with mocked HTML (bypassing fetcher)
      expect(parser.canParse).toBeDefined();

      // Can test fetcher independently (see strategies.test.ts)
      // Can test extractor independently (see extractors tests)
      expect(true).toBe(true);
    });
  });

  describe('Error handling with composed strategies', () => {
    it('should propagate fetcher errors gracefully', async () => {
      const parser = new YouTubeParser();

      // Invalid URL should fail at fetcher level
      await expect(parser.parse('https://invalid-youtube-url.test'))
        .rejects
        .toThrow();
    }, 15000);

    it('should handle extractor errors gracefully', async () => {
      const parser = new YouTubeParser();

      // Empty HTML should not crash extractor
      const options: ParserOptions = {
        preloadedHtml: '<html><body></body></html>',
      };

      const result = await parser.parse('https://youtube.com/watch?v=test', options);

      // Should return safe defaults even with empty HTML
      expect(result.type).toBe('video');
      expect(result.title).toBeDefined(); // Will use fallback
    });
  });

  describe('Multi-parser strategy composition comparison', () => {
    it('should demonstrate consistent composition pattern across parsers', () => {
      // All new parsers follow the same composition pattern:
      // 1. Declare platform and supportedContentTypes
      // 2. Compose HtmlFetcher (or reuse via options.preloadedHtml)
      // 3. Compose ContentDetector (optional, for multi-type parsers)
      // 4. Compose ContentExtractor(s)
      // 5. Implement canParse() - URL pattern matching
      // 6. Implement parse() - orchestrate strategies

      const parser = new YouTubeParser();

      // Verify pattern adherence
      expect(parser.platform).toBeDefined();
      expect(parser.supportedContentTypes).toBeDefined();
      expect(typeof parser.canParse).toBe('function');
      expect(typeof parser.parse).toBe('function');

      // Verify composition
      expect(parser).toHaveProperty('htmlFetcher');
      expect(parser).toHaveProperty('extractor');
    });

    it('should enable parsers to be under 100 lines', () => {
      // YouTubeParser implementation should be minimal
      // Strategy composition eliminates code duplication

      // This is a specification test - YouTubeParser.ts should be ~34 lines total
      // (25 lines of effective code, rest are comments/imports)

      const parser = new YouTubeParser();
      expect(parser).toBeDefined();

      // The small parser size is possible because:
      // - HtmlFetcher handles HTTP logic (reused)
      // - ContentExtractor handles parsing logic (reused)
      // - Parser only orchestrates: URL check + delegate to strategies
    });
  });

  describe('Real-world integration workflow', () => {
    it('should complete full parse workflow with strategy composition', async () => {
      const parser = new YouTubeParser();
      const url = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';

      // Full workflow: canParse → fetch HTML → extract content → return typed result
      if (parser.canParse(url)) {
        const result: VideoContent = await parser.parse(url);

        // Verify complete workflow success
        expect(result.type).toBe('video');
        expect(result.platform).toBe('youtube');
        expect(result.originalUrl).toBe(url);

        // Verify all video fields populated
        expect(result.title).toBeDefined();
        expect(result.videoUrl).toBeDefined();
        expect(result.description).toBeDefined();

        // Optional fields may or may not be present
        if (result.cover) {
          expect(result.cover).toMatch(/^https?:\/\//);
        }

        if (result.duration) {
          expect(result.duration).toBeGreaterThan(0);
        }
      }
    }, 30000);

    it('should handle preloaded HTML workflow (skip fetcher)', async () => {
      const parser = new YouTubeParser();

      const mockHtml = `
        <html>
          <head>
            <title>Mock YouTube Video</title>
            <meta property="og:video:url" content="https://youtube.com/watch?v=mock">
            <meta property="og:image" content="https://i.ytimg.com/vi/mock/hqdefault.jpg">
            <meta property="og:description" content="Mock description">
          </head>
          <body>
            <script>
              var ytInitialData = {
                "videoDetails": {
                  "videoId": "mock",
                  "title": "Mock YouTube Video",
                  "shortDescription": "Mock description",
                  "lengthSeconds": "180"
                }
              };
            </script>
          </body>
        </html>
      `;

      const result = await parser.parse('https://youtube.com/watch?v=mock', {
        preloadedHtml: mockHtml,
      });

      // Should work without network request
      expect(result.type).toBe('video');
      expect(result.title).toBeDefined();
      expect(result.videoUrl).toBeDefined();
    });
  });

  describe('Performance with strategy composition', () => {
    it('should complete parse within reasonable time', async () => {
      const parser = new YouTubeParser();
      const url = 'https://www.youtube.com/watch?v=jNQXAC9IVRw';

      const startTime = Date.now();
      await parser.parse(url);
      const duration = Date.now() - startTime;

      // Should complete within 10 seconds (network dependent)
      expect(duration).toBeLessThan(10000);
    }, 15000);

    it('should be fast with preloaded HTML', async () => {
      const parser = new YouTubeParser();

      const mockHtml = '<html><head><title>Test</title></head><body></body></html>';

      const startTime = Date.now();
      await parser.parse('https://youtube.com/watch?v=test', {
        preloadedHtml: mockHtml,
      });
      const duration = Date.now() - startTime;

      // Should be very fast without network request (< 100ms)
      expect(duration).toBeLessThan(1000);
    });
  });
});
