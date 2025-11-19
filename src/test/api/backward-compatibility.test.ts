/**
 * T046: Backward Compatibility Tests
 *
 * Verifies that legacy ParsedContent fields remain accessible after refactoring
 * to multi-type content system. Ensures existing API consumers continue to work.
 *
 * @see specs/003-parser-architecture-refactor/contracts/api-contracts.md
 */

import { describe, it, expect } from 'vitest';
import type { ArticleContent } from '@/lib/types/content';
import type { LegacyParsedContent } from '@/lib/types/parser';

describe('Backward Compatibility (T046)', () => {
  // ============================================================================
  // Legacy Type Alias Compatibility
  // ============================================================================
  describe('LegacyParsedContent type alias', () => {
    it('should be compatible with ArticleContent', () => {
      const article: ArticleContent = {
        type: 'article',
        title: 'Test Article',
        content: 'Article content',
        images: ['https://example.com/image.jpg'],
        platform: 'wechat',
        originalUrl: 'https://mp.weixin.qq.com/s/test',
      };

      // LegacyParsedContent should accept ArticleContent
      const legacy: LegacyParsedContent = article;

      expect(legacy.title).toBe('Test Article');
      expect(legacy.content).toBe('Article content');
      expect(legacy.images).toHaveLength(1);
      expect(legacy.platform).toBe('wechat');
      expect(legacy.originalUrl).toBe('https://mp.weixin.qq.com/s/test');
    });

    it('should support all legacy fields', () => {
      const legacy: LegacyParsedContent = {
        type: 'article',
        title: 'Legacy Article',
        content: 'Content',
        images: [],
        platform: 'xiaohongshu',
        originalUrl: 'https://xiaohongshu.com/explore/test',
        author: 'Test Author',
        publishedAt: new Date('2024-01-01'),
      };

      // All legacy fields should be accessible
      expect(legacy.title).toBe('Legacy Article');
      expect(legacy.content).toBe('Content');
      expect(legacy.images).toEqual([]);
      expect(legacy.platform).toBe('xiaohongshu');
      expect(legacy.originalUrl).toBeDefined();
      expect(legacy.author).toBe('Test Author');
      expect(legacy.publishedAt).toBeInstanceOf(Date);
    });
  });

  // ============================================================================
  // ArticleContent Backward Compatibility
  // ============================================================================
  describe('ArticleContent maintains legacy structure', () => {
    it('should have all required legacy fields', () => {
      const article: ArticleContent = {
        type: 'article',
        title: 'Test',
        content: 'Content',
        images: [],
        platform: 'bilibili',
        originalUrl: 'https://bilibili.com/test',
      };

      // Required fields from legacy ParsedContent
      expect(article).toHaveProperty('type');
      expect(article).toHaveProperty('title');
      expect(article).toHaveProperty('content');
      expect(article).toHaveProperty('images');
      expect(article).toHaveProperty('platform');
      expect(article).toHaveProperty('originalUrl');

      // Type should be 'article'
      expect(article.type).toBe('article');
    });

    it('should support optional legacy fields', () => {
      const article: ArticleContent = {
        type: 'article',
        title: 'Test',
        content: 'Content',
        images: ['https://example.com/img.jpg'],
        platform: 'wechat',
        originalUrl: 'https://mp.weixin.qq.com/s/test',
        author: 'Author Name',
        publishedAt: new Date(),
      };

      // Optional fields should work
      expect(article.author).toBeDefined();
      expect(article.publishedAt).toBeInstanceOf(Date);
    });

    it('should allow images array to be empty', () => {
      const article: ArticleContent = {
        type: 'article',
        title: 'No Images',
        content: 'Text only',
        images: [],
        platform: 'wechat',
        originalUrl: 'https://mp.weixin.qq.com/s/test',
      };

      expect(article.images).toEqual([]);
      expect(article.images.length).toBe(0);
    });

    it('should allow images array with multiple URLs', () => {
      const article: ArticleContent = {
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

      expect(article.images.length).toBe(3);
      expect(article.images[0]).toBe('https://example.com/1.jpg');
    });
  });

  // ============================================================================
  // Platform Type Backward Compatibility
  // ============================================================================
  describe('PlatformType maintains legacy values', () => {
    it('should support all legacy platform values', () => {
      const platforms: ArticleContent['platform'][] = [
        'xiaohongshu',
        'bilibili',
        'wechat',
        'unknown',
      ];

      platforms.forEach(platform => {
        const article: ArticleContent = {
          type: 'article',
          title: 'Test',
          content: 'Content',
          images: [],
          platform,
          originalUrl: 'https://example.com',
        };

        expect(article.platform).toBe(platform);
      });
    });

    it('should support new platform values', () => {
      const newPlatforms: ArticleContent['platform'][] = [
        'youtube',
        'twitter',
        'wechat-read',
      ];

      newPlatforms.forEach(platform => {
        const article: ArticleContent = {
          type: 'article',
          title: 'Test',
          content: 'Content',
          images: [],
          platform,
          originalUrl: 'https://example.com',
        };

        expect(article.platform).toBe(platform);
      });
    });
  });

  // ============================================================================
  // Field Type Compatibility
  // ============================================================================
  describe('Field types remain compatible', () => {
    it('should accept string for title', () => {
      const article: ArticleContent = {
        type: 'article',
        title: 'String Title',
        content: 'Content',
        images: [],
        platform: 'wechat',
        originalUrl: 'https://example.com',
      };

      expect(typeof article.title).toBe('string');
    });

    it('should accept string for content', () => {
      const article: ArticleContent = {
        type: 'article',
        title: 'Test',
        content: 'String Content',
        images: [],
        platform: 'wechat',
        originalUrl: 'https://example.com',
      };

      expect(typeof article.content).toBe('string');
    });

    it('should accept string array for images', () => {
      const article: ArticleContent = {
        type: 'article',
        title: 'Test',
        content: 'Content',
        images: ['url1', 'url2'],
        platform: 'wechat',
        originalUrl: 'https://example.com',
      };

      expect(Array.isArray(article.images)).toBe(true);
      expect(article.images.every(img => typeof img === 'string')).toBe(true);
    });

    it('should accept Date for publishedAt', () => {
      const now = new Date();
      const article: ArticleContent = {
        type: 'article',
        title: 'Test',
        content: 'Content',
        images: [],
        platform: 'wechat',
        originalUrl: 'https://example.com',
        publishedAt: now,
      };

      expect(article.publishedAt).toBeInstanceOf(Date);
      expect(article.publishedAt).toBe(now);
    });
  });

  // ============================================================================
  // Object Structure Compatibility
  // ============================================================================
  describe('Object structure remains compatible', () => {
    it('should support destructuring legacy fields', () => {
      const article: ArticleContent = {
        type: 'article',
        title: 'Test Title',
        content: 'Test Content',
        images: ['img1.jpg', 'img2.jpg'],
        platform: 'xiaohongshu',
        originalUrl: 'https://xiaohongshu.com/test',
        author: 'Test Author',
      };

      const { title, content, images, platform, originalUrl, author } = article;

      expect(title).toBe('Test Title');
      expect(content).toBe('Test Content');
      expect(images).toHaveLength(2);
      expect(platform).toBe('xiaohongshu');
      expect(originalUrl).toBe('https://xiaohongshu.com/test');
      expect(author).toBe('Test Author');
    });

    it('should support spread operator', () => {
      const baseArticle: Omit<ArticleContent, 'type'> = {
        title: 'Base Title',
        content: 'Base Content',
        images: [],
        platform: 'bilibili',
        originalUrl: 'https://bilibili.com/test',
      };

      const article: ArticleContent = {
        type: 'article',
        ...baseArticle,
        author: 'New Author',
      };

      expect(article.type).toBe('article');
      expect(article.title).toBe('Base Title');
      expect(article.content).toBe('Base Content');
      expect(article.author).toBe('New Author');
    });

    it('should support Object.assign pattern', () => {
      const article: ArticleContent = Object.assign(
        {},
        {
          type: 'article' as const,
          title: 'Assigned Title',
          content: 'Assigned Content',
          images: [],
          platform: 'wechat' as const,
          originalUrl: 'https://example.com',
        },
        {
          author: 'Assigned Author',
        }
      );

      expect(article.type).toBe('article');
      expect(article.title).toBe('Assigned Title');
      expect(article.author).toBe('Assigned Author');
    });
  });

  // ============================================================================
  // Null/Undefined Handling
  // ============================================================================
  describe('Null/undefined handling remains compatible', () => {
    it('should allow undefined for optional fields', () => {
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

    it('should allow omitting optional fields', () => {
      const article: ArticleContent = {
        type: 'article',
        title: 'Test',
        content: 'Content',
        images: [],
        platform: 'wechat',
        originalUrl: 'https://example.com',
        // author and publishedAt omitted
      };

      expect(article.author).toBeUndefined();
      expect(article.publishedAt).toBeUndefined();
    });
  });

  // ============================================================================
  // Type Discriminator Non-Breaking
  // ============================================================================
  describe('Type discriminator is non-breaking', () => {
    it('should always have type="article" for ArticleContent', () => {
      const article: ArticleContent = {
        type: 'article',
        title: 'Test',
        content: 'Content',
        images: [],
        platform: 'wechat',
        originalUrl: 'https://example.com',
      };

      expect(article.type).toBe('article');
      expect(article).toHaveProperty('type');
    });

    it('should not interfere with legacy field access', () => {
      const article: ArticleContent = {
        type: 'article',
        title: 'Test',
        content: 'Content',
        images: [],
        platform: 'wechat',
        originalUrl: 'https://example.com',
      };

      // type field should not prevent access to other fields
      expect(article.title).toBe('Test');
      expect(article.content).toBe('Content');
      expect(article.images).toEqual([]);

      // Should be able to access all fields together
      const allFields = {
        type: article.type,
        title: article.title,
        content: article.content,
        images: article.images,
        platform: article.platform,
        originalUrl: article.originalUrl,
      };

      expect(allFields.type).toBe('article');
      expect(allFields.title).toBe('Test');
    });
  });
});
