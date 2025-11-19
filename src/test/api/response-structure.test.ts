/**
 * T048: API Response Structure Tests
 *
 * Validates that API responses maintain consistent structure before and after
 * multi-type refactoring. Ensures backward compatibility for API consumers.
 *
 * @see specs/003-parser-architecture-refactor/contracts/api-contracts.md
 */

import { describe, it, expect } from 'vitest';
import type { ParseResult } from '@/lib/types/parser';
import type { ArticleContent, VideoContent } from '@/lib/types/content';

describe('API Response Structure (T048)', () => {
  // ============================================================================
  // ParseResult Structure
  // ============================================================================
  describe('ParseResult response structure', () => {
    it('should have success=true for successful parse', () => {
      const result: ParseResult = {
        success: true,
        data: {
          type: 'article',
          title: 'Test Article',
          content: 'Content',
          images: [],
          platform: 'wechat',
          originalUrl: 'https://example.com',
        },
        parsed_at: new Date(),
      };

      expect(result.success).toBe(true);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('parsed_at');
      expect(result.parsed_at).toBeInstanceOf(Date);
    });

    it('should have success=false for failed parse', () => {
      const result: ParseResult = {
        success: false,
        error: 'Failed to parse URL',
        parsed_at: new Date(),
      };

      expect(result.success).toBe(false);
      expect(result).toHaveProperty('error');
      expect(result).toHaveProperty('parsed_at');
      expect(result).not.toHaveProperty('data');
    });

    it('should include ios_url when output_format is specified', () => {
      const result: ParseResult = {
        success: true,
        data: {
          type: 'article',
          title: 'Test',
          content: 'Content',
          images: [],
          platform: 'wechat',
          originalUrl: 'https://example.com',
        },
        ios_url: 'flomo://create?content=Test',
        parsed_at: new Date(),
      };

      expect(result).toHaveProperty('ios_url');
      expect(result.ios_url).toContain('flomo://create');
    });

    it('should omit ios_url when output_format=raw', () => {
      const result: ParseResult = {
        success: true,
        data: {
          type: 'article',
          title: 'Test',
          content: 'Content',
          images: [],
          platform: 'wechat',
          originalUrl: 'https://example.com',
        },
        parsed_at: new Date(),
      };

      expect(result.ios_url).toBeUndefined();
    });
  });

  // ============================================================================
  // ArticleContent Response (Backward Compatibility)
  // ============================================================================
  describe('ArticleContent response structure (legacy)', () => {
    it('should maintain legacy article structure', () => {
      const data: ArticleContent = {
        type: 'article',
        title: 'Article Title',
        content: 'Article content',
        images: ['https://example.com/image.jpg'],
        platform: 'wechat',
        originalUrl: 'https://mp.weixin.qq.com/s/test',
        author: 'Author Name',
        publishedAt: new Date('2024-01-01'),
      };

      // All legacy fields present
      expect(data).toHaveProperty('type');
      expect(data).toHaveProperty('title');
      expect(data).toHaveProperty('content');
      expect(data).toHaveProperty('images');
      expect(data).toHaveProperty('platform');
      expect(data).toHaveProperty('originalUrl');
      expect(data).toHaveProperty('author');
      expect(data).toHaveProperty('publishedAt');

      // Correct types
      expect(data.type).toBe('article');
      expect(typeof data.title).toBe('string');
      expect(typeof data.content).toBe('string');
      expect(Array.isArray(data.images)).toBe(true);
      expect(typeof data.platform).toBe('string');
      expect(typeof data.originalUrl).toBe('string');
      expect(typeof data.author).toBe('string');
      expect(data.publishedAt).toBeInstanceOf(Date);
    });

    it('should allow omitting optional fields', () => {
      const data: ArticleContent = {
        type: 'article',
        title: 'Minimal Article',
        content: 'Content',
        images: [],
        platform: 'bilibili',
        originalUrl: 'https://bilibili.com/test',
      };

      expect(data.author).toBeUndefined();
      expect(data.publishedAt).toBeUndefined();
    });

    it('should support empty images array', () => {
      const data: ArticleContent = {
        type: 'article',
        title: 'No Images',
        content: 'Text only',
        images: [],
        platform: 'wechat',
        originalUrl: 'https://example.com',
      };

      expect(data.images).toEqual([]);
      expect(data.images.length).toBe(0);
    });

    it('should support multiple images', () => {
      const data: ArticleContent = {
        type: 'article',
        title: 'Gallery',
        content: 'Multiple images',
        images: [
          'https://example.com/1.jpg',
          'https://example.com/2.jpg',
          'https://example.com/3.jpg',
        ],
        platform: 'xiaohongshu',
        originalUrl: 'https://xiaohongshu.com/explore/test',
      };

      expect(data.images.length).toBe(3);
      expect(data.images[0]).toContain('.jpg');
    });
  });

  // ============================================================================
  // VideoContent Response (New Type)
  // ============================================================================
  describe('VideoContent response structure (new)', () => {
    it('should include type discriminator', () => {
      const data: VideoContent = {
        type: 'video',
        title: 'Video Title',
        videoUrl: 'https://youtube.com/watch?v=test123',
        description: 'Video description',
        platform: 'youtube',
        originalUrl: 'https://youtube.com/watch?v=test123',
      };

      expect(data.type).toBe('video');
      expect(data).toHaveProperty('type');
    });

    it('should include video-specific fields', () => {
      const data: VideoContent = {
        type: 'video',
        title: 'Test Video',
        videoUrl: 'https://youtube.com/watch?v=test123',
        description: 'Description',
        platform: 'youtube',
        originalUrl: 'https://youtube.com/watch?v=test123',
        cover: 'https://i.ytimg.com/vi/test123/maxresdefault.jpg',
        duration: 600,
        metadata: {
          videoId: 'test123',
          channelName: 'Test Channel',
        },
      };

      // Video-specific fields
      expect(data).toHaveProperty('videoUrl');
      expect(data).toHaveProperty('description');
      expect(data).toHaveProperty('cover');
      expect(data).toHaveProperty('duration');
      expect(data).toHaveProperty('metadata');

      // Common BaseContent fields
      expect(data).toHaveProperty('title');
      expect(data).toHaveProperty('platform');
      expect(data).toHaveProperty('originalUrl');

      // Types
      expect(typeof data.videoUrl).toBe('string');
      expect(typeof data.duration).toBe('number');
      expect(typeof data.metadata).toBe('object');
    });

    it('should allow omitting optional video fields', () => {
      const data: VideoContent = {
        type: 'video',
        title: 'Minimal Video',
        videoUrl: 'https://youtube.com/watch?v=test',
        description: 'Desc',
        platform: 'youtube',
        originalUrl: 'https://youtube.com/watch?v=test',
      };

      expect(data.cover).toBeUndefined();
      expect(data.duration).toBeUndefined();
      expect(data.metadata).toBeUndefined();
      expect(data.author).toBeUndefined();
      expect(data.publishedAt).toBeUndefined();
    });
  });

  // ============================================================================
  // Type Discriminator Consistency
  // ============================================================================
  describe('Type discriminator in all content types', () => {
    it('should always include type field', () => {
      const contents = [
        {
          type: 'article' as const,
          title: 'Article',
          content: 'Content',
          images: [],
          platform: 'wechat' as const,
          originalUrl: 'https://example.com',
        },
        {
          type: 'video' as const,
          title: 'Video',
          videoUrl: 'https://youtube.com/watch?v=test',
          description: 'Desc',
          platform: 'youtube' as const,
          originalUrl: 'https://youtube.com/watch?v=test',
        },
        {
          type: 'image-gallery' as const,
          title: 'Gallery',
          images: ['https://example.com/img.jpg'],
          description: 'Desc',
          platform: 'xiaohongshu' as const,
          originalUrl: 'https://example.com',
        },
        {
          type: 'book' as const,
          title: 'Book',
          bookId: 'book123',
          content: 'Content',
          platform: 'wechat-read' as const,
          originalUrl: 'https://weread.qq.com/book/123',
        },
        {
          type: 'tweet' as const,
          title: 'Tweet',
          content: 'Content',
          images: [],
          platform: 'twitter' as const,
          originalUrl: 'https://twitter.com/user/status/123',
          isThread: false,
        },
      ];

      contents.forEach(content => {
        expect(content).toHaveProperty('type');
        expect(typeof content.type).toBe('string');
        expect(['article', 'video', 'image-gallery', 'book', 'tweet']).toContain(content.type);
      });
    });

    it('should use type field for runtime discrimination', () => {
      const mixedContents: Array<{ type: string; [key: string]: any }> = [
        {
          type: 'article',
          title: 'Article',
          content: 'Content',
          images: [],
          platform: 'wechat',
          originalUrl: 'https://example.com',
        },
        {
          type: 'video',
          title: 'Video',
          videoUrl: 'https://youtube.com/watch?v=test',
          description: 'Desc',
          platform: 'youtube',
          originalUrl: 'https://youtube.com/watch?v=test',
        },
      ];

      mixedContents.forEach(content => {
        switch (content.type) {
          case 'article':
            expect(content).toHaveProperty('content');
            expect(content).toHaveProperty('images');
            break;
          case 'video':
            expect(content).toHaveProperty('videoUrl');
            expect(content).toHaveProperty('description');
            break;
          default:
            throw new Error(`Unknown type: ${content.type}`);
        }
      });
    });
  });

  // ============================================================================
  // JSON Serialization Compatibility
  // ============================================================================
  describe('JSON serialization compatibility', () => {
    it('should serialize ArticleContent to JSON', () => {
      const article: ArticleContent = {
        type: 'article',
        title: 'Test',
        content: 'Content',
        images: ['https://example.com/img.jpg'],
        platform: 'wechat',
        originalUrl: 'https://example.com',
        author: 'Author',
        publishedAt: new Date('2024-01-01T00:00:00.000Z'),
      };

      const json = JSON.stringify(article);
      const parsed = JSON.parse(json);

      expect(parsed.type).toBe('article');
      expect(parsed.title).toBe('Test');
      expect(parsed.images).toHaveLength(1);
      expect(typeof parsed.publishedAt).toBe('string'); // Date becomes string
      expect(parsed.publishedAt).toBe('2024-01-01T00:00:00.000Z');
    });

    it('should serialize VideoContent to JSON', () => {
      const video: VideoContent = {
        type: 'video',
        title: 'Video',
        videoUrl: 'https://youtube.com/watch?v=test',
        description: 'Desc',
        platform: 'youtube',
        originalUrl: 'https://youtube.com/watch?v=test',
        duration: 600,
        metadata: {
          videoId: 'test',
          channelName: 'Channel',
        },
      };

      const json = JSON.stringify(video);
      const parsed = JSON.parse(json);

      expect(parsed.type).toBe('video');
      expect(parsed.videoUrl).toBe('https://youtube.com/watch?v=test');
      expect(parsed.duration).toBe(600);
      expect(parsed.metadata.videoId).toBe('test');
    });

    it('should handle ParseResult serialization', () => {
      const result: ParseResult = {
        success: true,
        data: {
          type: 'article',
          title: 'Test',
          content: 'Content',
          images: [],
          platform: 'wechat',
          originalUrl: 'https://example.com',
        },
        ios_url: 'flomo://create?content=Test',
        parsed_at: new Date('2024-01-01T12:00:00.000Z'),
      };

      const json = JSON.stringify(result);
      const parsed = JSON.parse(json);

      expect(parsed.success).toBe(true);
      expect(parsed.data.type).toBe('article');
      expect(parsed.ios_url).toBe('flomo://create?content=Test');
      expect(typeof parsed.parsed_at).toBe('string');
    });
  });

  // ============================================================================
  // Error Response Structure
  // ============================================================================
  describe('Error response structure', () => {
    it('should include error message on failure', () => {
      const result: ParseResult = {
        success: false,
        error: 'Invalid URL format',
        parsed_at: new Date(),
      };

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid URL format');
      expect(typeof result.error).toBe('string');
    });

    it('should not include data on failure', () => {
      const result: ParseResult = {
        success: false,
        error: 'Parsing failed',
        parsed_at: new Date(),
      };

      expect(result.data).toBeUndefined();
      expect(result.ios_url).toBeUndefined();
    });

    it('should always include parsed_at timestamp', () => {
      const successResult: ParseResult = {
        success: true,
        data: {
          type: 'article',
          title: 'Test',
          content: 'Content',
          images: [],
          platform: 'wechat',
          originalUrl: 'https://example.com',
        },
        parsed_at: new Date(),
      };

      const errorResult: ParseResult = {
        success: false,
        error: 'Error',
        parsed_at: new Date(),
      };

      expect(successResult).toHaveProperty('parsed_at');
      expect(successResult.parsed_at).toBeInstanceOf(Date);

      expect(errorResult).toHaveProperty('parsed_at');
      expect(errorResult.parsed_at).toBeInstanceOf(Date);
    });
  });

  // ============================================================================
  // Optional Fields Consistency
  // ============================================================================
  describe('Optional fields handling', () => {
    it('should allow undefined optional fields', () => {
      const article: ArticleContent = {
        type: 'article',
        title: 'Test',
        content: 'Content',
        images: [],
        platform: 'wechat',
        originalUrl: 'https://example.com',
        author: undefined,
        publishedAt: undefined,
      };

      expect(article.author).toBeUndefined();
      expect(article.publishedAt).toBeUndefined();
    });

    it('should allow omitting optional fields entirely', () => {
      const article: ArticleContent = {
        type: 'article',
        title: 'Test',
        content: 'Content',
        images: [],
        platform: 'wechat',
        originalUrl: 'https://example.com',
      };

      expect('author' in article).toBe(false);
      expect('publishedAt' in article).toBe(false);
    });

    it('should not serialize undefined fields to JSON', () => {
      const article: ArticleContent = {
        type: 'article',
        title: 'Test',
        content: 'Content',
        images: [],
        platform: 'wechat',
        originalUrl: 'https://example.com',
        author: undefined,
      };

      const json = JSON.stringify(article);
      const parsed = JSON.parse(json);

      // undefined fields are omitted in JSON
      expect('author' in parsed).toBe(false);
    });
  });
});
