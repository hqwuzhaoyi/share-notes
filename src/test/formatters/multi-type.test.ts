/**
 * T047: Formatter Multi-Type Fallback Tests
 *
 * Verifies that formatters gracefully handle all content types,
 * including unknown/future types, without throwing errors.
 *
 * @see specs/003-parser-architecture-refactor/contracts/formatter-contracts.md
 */

import { describe, it, expect } from 'vitest';
import { FlomoFormatter } from '@/lib/formatters/flomo-formatter';
import { NotesFormatter } from '@/lib/formatters/notes-formatter';
import { RawFormatter } from '@/lib/formatters/raw-formatter';
import type {
  ArticleContent,
  VideoContent,
  ImageGalleryContent,
  BookContent,
  TweetContent,
} from '@/lib/types/content';

describe('Formatter Multi-Type Support (T047)', () => {
  // ============================================================================
  // FlomoFormatter Multi-Type Support
  // ============================================================================
  describe('FlomoFormatter handles all content types', () => {
    const formatter = new FlomoFormatter();

    it('should format ArticleContent', () => {
      const article: ArticleContent = {
        type: 'article',
        title: 'Test Article',
        content: 'Article content here',
        images: ['https://example.com/image.jpg'],
        platform: 'wechat',
        originalUrl: 'https://mp.weixin.qq.com/s/test',
      };

      const result = formatter.format(article);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('url_scheme');
        expect(result.data.value).toContain('flomo://create');
        const decoded = decodeURIComponent(result.data.value);
        expect(decoded).toContain('Test Article');
        expect(result.data.fallback).toContain('Article content');
      }
    });

    it('should format VideoContent', () => {
      const video: VideoContent = {
        type: 'video',
        title: 'Test Video',
        videoUrl: 'https://youtube.com/watch?v=test123',
        description: 'Video description',
        platform: 'youtube',
        originalUrl: 'https://youtube.com/watch?v=test123',
        cover: 'https://i.ytimg.com/vi/test123/maxresdefault.jpg',
        duration: 600,
      };

      const result = formatter.format(video);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('url_scheme');
        expect(result.data.value).toContain('flomo://create');
        const decoded = decodeURIComponent(result.data.value);
        expect(decoded).toContain('Test Video');
        expect(result.data.fallback).toContain('Video description');
      }
    });

    it('should format ImageGalleryContent', () => {
      const gallery: ImageGalleryContent = {
        type: 'image-gallery',
        title: 'Test Gallery',
        images: [
          'https://example.com/1.jpg',
          'https://example.com/2.jpg',
          'https://example.com/3.jpg',
        ],
        description: 'Gallery description',
        platform: 'xiaohongshu',
        originalUrl: 'https://xiaohongshu.com/explore/test',
      };

      const result = formatter.format(gallery);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('url_scheme');
        expect(result.data.value).toContain('flomo://create');
        const decoded = decodeURIComponent(result.data.value);
        expect(decoded).toContain('Test Gallery');
        expect(result.data.fallback).toContain('Gallery description');
      }
    });

    it('should format BookContent', () => {
      const book: BookContent = {
        type: 'book',
        title: 'Test Book',
        bookId: 'book123',
        content: 'Book highlights and notes',
        platform: 'wechat-read',
        originalUrl: 'https://weread.qq.com/book/book123',
        cover: 'https://example.com/book-cover.jpg',
        author: 'Book Author',
      };

      const result = formatter.format(book);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('url_scheme');
        expect(result.data.value).toContain('flomo://create');
        const decoded = decodeURIComponent(result.data.value);
        expect(decoded).toContain('Test Book');
        expect(result.data.fallback).toContain('Book highlights');
      }
    });

    it('should format TweetContent', () => {
      const tweet: TweetContent = {
        type: 'tweet',
        title: 'Tweet Thread',
        content: 'Thread content here',
        images: ['https://pbs.twimg.com/media/test.jpg'],
        platform: 'twitter',
        originalUrl: 'https://twitter.com/user/status/123',
        isThread: true,
        author: 'Twitter User',
      };

      const result = formatter.format(tweet);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('url_scheme');
        expect(result.data.value).toContain('flomo://create');
        const decoded = decodeURIComponent(result.data.value);
        expect(decoded).toContain('Tweet Thread');
        expect(result.data.fallback).toContain('Thread content');
      }
    });

    it('should handle content with no images', () => {
      const article: ArticleContent = {
        type: 'article',
        title: 'No Images',
        content: 'Text only content',
        images: [],
        platform: 'wechat',
        originalUrl: 'https://example.com',
      };

      const result = formatter.format(article);

      expect(result.success).toBe(true);
      if (result.success) {
        const decoded = decodeURIComponent(result.data.value);
        expect(decoded).toContain('Text only content');
      }
    });

    it('should handle content with empty description/content', () => {
      const gallery: ImageGalleryContent = {
        type: 'image-gallery',
        title: 'Gallery',
        images: ['https://example.com/img.jpg'],
        description: '',
        platform: 'xiaohongshu',
        originalUrl: 'https://example.com',
      };

      const result = formatter.format(gallery);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.value).toContain('Gallery');
      }
    });
  });

  // ============================================================================
  // NotesFormatter Multi-Type Support
  // ============================================================================
  describe('NotesFormatter handles all content types', () => {
    const formatter = new NotesFormatter();

    it('should format ArticleContent', () => {
      const article: ArticleContent = {
        type: 'article',
        title: 'Test Article',
        content: 'Article content',
        images: [],
        platform: 'wechat',
        originalUrl: 'https://mp.weixin.qq.com/s/test',
      };

      const result = formatter.format(article);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('url_scheme');
        expect(result.data.value).toContain('mobilenotes://create');
        const decoded = decodeURIComponent(result.data.value);
        expect(decoded).toContain('Test Article');
      }
    });

    it('should format VideoContent', () => {
      const video: VideoContent = {
        type: 'video',
        title: 'Video Title',
        videoUrl: 'https://youtube.com/watch?v=test',
        description: 'Video desc',
        platform: 'youtube',
        originalUrl: 'https://youtube.com/watch?v=test',
      };

      const result = formatter.format(video);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('url_scheme');
        expect(result.data.value).toContain('mobilenotes://create');
        const decoded = decodeURIComponent(result.data.value);
        expect(decoded).toContain('Video Title');
      }
    });

    it('should format ImageGalleryContent', () => {
      const gallery: ImageGalleryContent = {
        type: 'image-gallery',
        title: 'Gallery',
        images: ['https://example.com/img.jpg'],
        description: 'Desc',
        platform: 'xiaohongshu',
        originalUrl: 'https://example.com',
      };

      const result = formatter.format(gallery);

      expect(result.success).toBe(true);
      if (result.success) {
        const decoded = decodeURIComponent(result.data.value);
        expect(decoded).toContain('Gallery');
      }
    });

    it('should format BookContent', () => {
      const book: BookContent = {
        type: 'book',
        title: 'Book Title',
        bookId: 'book123',
        content: 'Book content',
        platform: 'wechat-read',
        originalUrl: 'https://weread.qq.com/book/123',
      };

      const result = formatter.format(book);

      expect(result.success).toBe(true);
      if (result.success) {
        const decoded = decodeURIComponent(result.data.value);
        expect(decoded).toContain('Book Title');
      }
    });

    it('should format TweetContent', () => {
      const tweet: TweetContent = {
        type: 'tweet',
        title: 'Tweet',
        content: 'Tweet content',
        images: [],
        platform: 'twitter',
        originalUrl: 'https://twitter.com/user/status/123',
        isThread: false,
      };

      const result = formatter.format(tweet);

      expect(result.success).toBe(true);
      if (result.success) {
        const decoded = decodeURIComponent(result.data.value);
        expect(decoded).toContain('Tweet content');
      }
    });

    it('should not include images in URL (Notes does not support)', () => {
      const article: ArticleContent = {
        type: 'article',
        title: 'Article',
        content: 'Content',
        images: [
          'https://example.com/1.jpg',
          'https://example.com/2.jpg',
        ],
        platform: 'xiaohongshu',
        originalUrl: 'https://example.com',
      };

      const result = formatter.format(article);

      expect(result.success).toBe(true);
      if (result.success) {
        // Notes formatter should not include image URLs in the URL scheme
        // (as per NotesFormatter capabilities: supportsImages: false)
        expect(result.data.value).not.toContain('example.com/1.jpg');
      }
    });
  });

  // ============================================================================
  // RawFormatter Multi-Type Support
  // ============================================================================
  describe('RawFormatter handles all content types', () => {
    const formatter = new RawFormatter();

    it('should format ArticleContent as JSON', () => {
      const article: ArticleContent = {
        type: 'article',
        title: 'Test',
        content: 'Content',
        images: [],
        platform: 'wechat',
        originalUrl: 'https://example.com',
      };

      const result = formatter.format(article);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('raw_content');
        const parsed = JSON.parse(result.data.value);
        expect(parsed.type).toBe('article');
        expect(parsed.title).toBe('Test');
      }
    });

    it('should format VideoContent as JSON', () => {
      const video: VideoContent = {
        type: 'video',
        title: 'Video',
        videoUrl: 'https://youtube.com/watch?v=test',
        description: 'Desc',
        platform: 'youtube',
        originalUrl: 'https://youtube.com/watch?v=test',
      };

      const result = formatter.format(video);

      expect(result.success).toBe(true);
      if (result.success) {
        const parsed = JSON.parse(result.data.value);
        expect(parsed.type).toBe('video');
        expect(parsed.videoUrl).toBe('https://youtube.com/watch?v=test');
      }
    });

    it('should preserve all fields in JSON output', () => {
      const book: BookContent = {
        type: 'book',
        title: 'Book',
        bookId: 'book123',
        content: 'Content',
        platform: 'wechat-read',
        originalUrl: 'https://example.com',
        cover: 'https://example.com/cover.jpg',
        author: 'Author',
        publishedAt: new Date('2024-01-01'),
      };

      const result = formatter.format(book);

      expect(result.success).toBe(true);
      if (result.success) {
        const parsed = JSON.parse(result.data.value);
        expect(parsed.type).toBe('book');
        expect(parsed.bookId).toBe('book123');
        expect(parsed.cover).toBe('https://example.com/cover.jpg');
        expect(parsed.author).toBe('Author');
        expect(parsed.publishedAt).toBeDefined();
      }
    });

    it('should handle nested objects in metadata', () => {
      const video: VideoContent = {
        type: 'video',
        title: 'Video',
        videoUrl: 'https://youtube.com/watch?v=test',
        description: 'Desc',
        platform: 'youtube',
        originalUrl: 'https://youtube.com/watch?v=test',
        metadata: {
          videoId: 'test',
          channelName: 'Channel',
          nested: {
            key: 'value',
          },
        },
      };

      const result = formatter.format(video);

      expect(result.success).toBe(true);
      if (result.success) {
        const parsed = JSON.parse(result.data.value);
        expect(parsed.metadata).toBeDefined();
        expect(parsed.metadata.videoId).toBe('test');
        expect(parsed.metadata.nested.key).toBe('value');
      }
    });
  });

  // ============================================================================
  // Content Length Limits
  // ============================================================================
  describe('Formatters respect content length limits', () => {
    it('FlomoFormatter should truncate content exceeding maxContentLength', () => {
      const formatter = new FlomoFormatter();
      const longContent = 'a'.repeat(60000); // Exceeds 50000 limit

      const article: ArticleContent = {
        type: 'article',
        title: 'Long Article',
        content: longContent,
        images: [],
        platform: 'wechat',
        originalUrl: 'https://example.com',
      };

      const result = formatter.format(article);

      expect(result.success).toBe(true);
      if (result.success) {
        // URL should be truncated to fit within platform limits
        expect(result.data.value.length).toBeLessThan(60000);
      }
    });

    it('NotesFormatter should truncate content exceeding maxContentLength', () => {
      const formatter = new NotesFormatter();
      const longContent = 'b'.repeat(40000); // Exceeds 30000 limit

      const article: ArticleContent = {
        type: 'article',
        title: 'Long Article',
        content: longContent,
        images: [],
        platform: 'wechat',
        originalUrl: 'https://example.com',
      };

      const result = formatter.format(article);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.value.length).toBeLessThan(40000);
      }
    });

    it('RawFormatter should not truncate (no limit)', () => {
      const formatter = new RawFormatter();
      const longContent = 'c'.repeat(100000);

      const article: ArticleContent = {
        type: 'article',
        title: 'Very Long Article',
        content: longContent,
        images: [],
        platform: 'wechat',
        originalUrl: 'https://example.com',
      };

      const result = formatter.format(article);

      expect(result.success).toBe(true);
      if (result.success) {
        const parsed = JSON.parse(result.data.value);
        expect(parsed.content.length).toBe(100000);
      }
    });
  });

  // ============================================================================
  // Error Handling
  // ============================================================================
  describe('Formatters handle edge cases gracefully', () => {
    it('should handle content with special characters', () => {
      const formatter = new FlomoFormatter();

      const article: ArticleContent = {
        type: 'article',
        title: 'Special <>&"\'',
        content: 'Content with\nnewlines\tand\ttabs',
        images: [],
        platform: 'wechat',
        originalUrl: 'https://example.com?foo=bar&baz=qux',
      };

      const result = formatter.format(article);

      expect(result.success).toBe(true);
    });

    it('should handle content with Unicode characters', () => {
      const formatter = new NotesFormatter();

      const article: ArticleContent = {
        type: 'article',
        title: '测试标题 🎉',
        content: '中文内容 emoji 🚀',
        images: [],
        platform: 'xiaohongshu',
        originalUrl: 'https://example.com',
      };

      const result = formatter.format(article);

      expect(result.success).toBe(true);
      if (result.success) {
        const decoded = decodeURIComponent(result.data.value);
        expect(decoded).toContain('测试标题');
      }
    });

    it('should handle very long image URLs', () => {
      const formatter = new FlomoFormatter();
      const longUrl = `https://example.com/${'a'.repeat(500)}.jpg`;

      const article: ArticleContent = {
        type: 'article',
        title: 'Test',
        content: 'Content',
        images: [longUrl],
        platform: 'xiaohongshu',
        originalUrl: 'https://example.com',
      };

      const result = formatter.format(article);

      expect(result.success).toBe(true);
    });
  });
});
