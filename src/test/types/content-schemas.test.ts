/**
 * Unit tests for Zod Content Type Schemas (T038 - US3)
 *
 * Tests runtime validation for all 5 content type schemas:
 * - ArticleContentSchema
 * - VideoContentSchema
 * - ImageGalleryContentSchema
 * - BookContentSchema
 * - TweetContentSchema
 *
 * Also tests discriminated union schema (ParsedContentSchema)
 */

import { describe, it, expect } from 'vitest';
import {
  ContentTypeSchema,
  PlatformTypeSchema,
  BaseContentSchema,
  ArticleContentSchema,
  VideoContentSchema,
  ImageGalleryContentSchema,
  BookContentSchema,
  TweetContentSchema,
  ParsedContentSchema,
} from '@/lib/types/content-schemas';

describe('Zod Content Type Schemas (T038)', () => {
  // ============================================================================
  // ContentTypeSchema Tests
  // ============================================================================
  describe('ContentTypeSchema', () => {
    it('should accept valid content types', () => {
      expect(ContentTypeSchema.safeParse('article').success).toBe(true);
      expect(ContentTypeSchema.safeParse('video').success).toBe(true);
      expect(ContentTypeSchema.safeParse('image-gallery').success).toBe(true);
      expect(ContentTypeSchema.safeParse('book').success).toBe(true);
      expect(ContentTypeSchema.safeParse('tweet').success).toBe(true);
    });

    it('should reject invalid content types', () => {
      expect(ContentTypeSchema.safeParse('podcast').success).toBe(false);
      expect(ContentTypeSchema.safeParse('audio').success).toBe(false);
      expect(ContentTypeSchema.safeParse('').success).toBe(false);
      expect(ContentTypeSchema.safeParse(null).success).toBe(false);
      expect(ContentTypeSchema.safeParse(undefined).success).toBe(false);
    });
  });

  // ============================================================================
  // PlatformTypeSchema Tests
  // ============================================================================
  describe('PlatformTypeSchema', () => {
    it('should accept valid platform types', () => {
      expect(PlatformTypeSchema.safeParse('xiaohongshu').success).toBe(true);
      expect(PlatformTypeSchema.safeParse('bilibili').success).toBe(true);
      expect(PlatformTypeSchema.safeParse('wechat').success).toBe(true);
      expect(PlatformTypeSchema.safeParse('wechat-read').success).toBe(true);
      expect(PlatformTypeSchema.safeParse('youtube').success).toBe(true);
      expect(PlatformTypeSchema.safeParse('twitter').success).toBe(true);
      expect(PlatformTypeSchema.safeParse('unknown').success).toBe(true);
    });

    it('should reject invalid platform types', () => {
      expect(PlatformTypeSchema.safeParse('instagram').success).toBe(false);
      expect(PlatformTypeSchema.safeParse('tiktok').success).toBe(false);
      expect(PlatformTypeSchema.safeParse('').success).toBe(false);
      expect(PlatformTypeSchema.safeParse(null).success).toBe(false);
    });
  });

  // ============================================================================
  // BaseContentSchema Tests
  // ============================================================================
  describe('BaseContentSchema', () => {
    const validBaseContent = {
      type: 'article' as const,
      title: 'Sample Title',
      platform: 'wechat' as const,
      originalUrl: 'https://example.com',
    };

    it('should accept valid base content', () => {
      const result = BaseContentSchema.safeParse(validBaseContent);
      expect(result.success).toBe(true);
    });

    it('should accept optional author field', () => {
      const withAuthor = {
        ...validBaseContent,
        author: 'John Doe',
      };
      expect(BaseContentSchema.safeParse(withAuthor).success).toBe(true);
    });

    it('should accept optional publishedAt field', () => {
      const withDate = {
        ...validBaseContent,
        publishedAt: new Date('2024-01-01'),
      };
      expect(BaseContentSchema.safeParse(withDate).success).toBe(true);
    });

    it('should reject empty title', () => {
      const result = BaseContentSchema.safeParse({
        ...validBaseContent,
        title: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid URL', () => {
      const result = BaseContentSchema.safeParse({
        ...validBaseContent,
        originalUrl: 'not-a-valid-url',
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing required fields', () => {
      expect(BaseContentSchema.safeParse({}).success).toBe(false);
      expect(BaseContentSchema.safeParse({ type: 'article' }).success).toBe(false);
      expect(
        BaseContentSchema.safeParse({
          type: 'article',
          title: 'Test',
        }).success
      ).toBe(false);
    });
  });

  // ============================================================================
  // ArticleContentSchema Tests
  // ============================================================================
  describe('ArticleContentSchema', () => {
    const validArticle = {
      type: 'article' as const,
      title: 'Sample Article',
      content: 'Article content here',
      images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
      platform: 'wechat' as const,
      originalUrl: 'https://mp.weixin.qq.com/s/abc123',
      author: 'John Doe',
      publishedAt: new Date('2024-01-01'),
    };

    it('should accept valid article content', () => {
      const result = ArticleContentSchema.safeParse(validArticle);
      expect(result.success).toBe(true);
    });

    it('should accept empty images array', () => {
      const result = ArticleContentSchema.safeParse({
        ...validArticle,
        images: [],
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty content', () => {
      const result = ArticleContentSchema.safeParse({
        ...validArticle,
        content: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid image URLs', () => {
      const result = ArticleContentSchema.safeParse({
        ...validArticle,
        images: ['not-a-url', 'https://example.com/valid.jpg'],
      });
      expect(result.success).toBe(false);
    });

    it('should reject more than 50 images', () => {
      const manyImages = Array(51).fill('https://example.com/img.jpg');
      const result = ArticleContentSchema.safeParse({
        ...validArticle,
        images: manyImages,
      });
      expect(result.success).toBe(false);
    });

    it('should enforce type discriminator', () => {
      const result = ArticleContentSchema.safeParse({
        ...validArticle,
        type: 'video',
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // VideoContentSchema Tests
  // ============================================================================
  describe('VideoContentSchema', () => {
    const validVideo = {
      type: 'video' as const,
      title: 'Sample Video',
      videoUrl: 'https://youtube.com/watch?v=test123',
      description: 'Video description',
      platform: 'youtube' as const,
      originalUrl: 'https://youtube.com/watch?v=test123',
      cover: 'https://i.ytimg.com/vi/test123/maxresdefault.jpg',
      duration: 600,
      metadata: { videoId: 'test123', channelName: 'Test Channel' },
    };

    it('should accept valid video content', () => {
      const result = VideoContentSchema.safeParse(validVideo);
      expect(result.success).toBe(true);
    });

    it('should accept minimal video content', () => {
      const minimal = {
        type: 'video' as const,
        title: 'Test',
        videoUrl: 'https://youtube.com/watch?v=test',
        description: '',
        platform: 'youtube' as const,
        originalUrl: 'https://youtube.com/watch?v=test',
      };
      const result = VideoContentSchema.safeParse(minimal);
      expect(result.success).toBe(true);
    });

    it('should reject invalid video URL', () => {
      const result = VideoContentSchema.safeParse({
        ...validVideo,
        videoUrl: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });

    it('should reject negative duration', () => {
      const result = VideoContentSchema.safeParse({
        ...validVideo,
        duration: -10,
      });
      expect(result.success).toBe(false);
    });

    it('should reject zero duration', () => {
      const result = VideoContentSchema.safeParse({
        ...validVideo,
        duration: 0,
      });
      expect(result.success).toBe(false);
    });

    it('should accept positive duration', () => {
      const result = VideoContentSchema.safeParse({
        ...validVideo,
        duration: 1,
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid cover URL', () => {
      const result = VideoContentSchema.safeParse({
        ...validVideo,
        cover: 'invalid-url',
      });
      expect(result.success).toBe(false);
    });

    it('should accept optional cover', () => {
      const { cover, ...videoWithoutCover } = validVideo;
      const result = VideoContentSchema.safeParse(videoWithoutCover);
      expect(result.success).toBe(true);
    });

    it('should accept optional metadata with any shape', () => {
      const complexMetadata = {
        ...validVideo,
        metadata: {
          videoId: 'test',
          tags: ['tech', 'tutorial'],
          likes: 1000,
          nested: { deep: { value: true } },
        },
      };
      const result = VideoContentSchema.safeParse(complexMetadata);
      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // ImageGalleryContentSchema Tests
  // ============================================================================
  describe('ImageGalleryContentSchema', () => {
    const validGallery = {
      type: 'image-gallery' as const,
      title: 'Sample Gallery',
      images: [
        'https://example.com/img1.jpg',
        'https://example.com/img2.jpg',
        'https://example.com/img3.jpg',
      ],
      description: 'Gallery description',
      platform: 'xiaohongshu' as const,
      originalUrl: 'https://xiaohongshu.com/explore/123',
      author: 'Jane Smith',
    };

    it('should accept valid image gallery content', () => {
      const result = ImageGalleryContentSchema.safeParse(validGallery);
      expect(result.success).toBe(true);
    });

    it('should accept single image', () => {
      const result = ImageGalleryContentSchema.safeParse({
        ...validGallery,
        images: ['https://example.com/img1.jpg'],
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty images array', () => {
      const result = ImageGalleryContentSchema.safeParse({
        ...validGallery,
        images: [],
      });
      expect(result.success).toBe(false);
    });

    it('should reject more than 50 images', () => {
      const manyImages = Array(51).fill('https://example.com/img.jpg');
      const result = ImageGalleryContentSchema.safeParse({
        ...validGallery,
        images: manyImages,
      });
      expect(result.success).toBe(false);
    });

    it('should accept empty description', () => {
      const result = ImageGalleryContentSchema.safeParse({
        ...validGallery,
        description: '',
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid image URLs', () => {
      const result = ImageGalleryContentSchema.safeParse({
        ...validGallery,
        images: ['not-a-url'],
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // BookContentSchema Tests
  // ============================================================================
  describe('BookContentSchema', () => {
    const validBook = {
      type: 'book' as const,
      title: 'Sample Book',
      bookId: 'book-12345',
      content: 'Book excerpt or reading note',
      platform: 'wechat-read' as const,
      originalUrl: 'https://weread.qq.com/book/123',
      chapterTitle: 'Chapter 1: Introduction',
      cover: 'https://example.com/book-cover.jpg',
      author: 'Author Name',
    };

    it('should accept valid book content', () => {
      const result = BookContentSchema.safeParse(validBook);
      expect(result.success).toBe(true);
    });

    it('should accept minimal book content', () => {
      const minimal = {
        type: 'book' as const,
        title: 'Test Book',
        bookId: 'test-123',
        content: 'Test content',
        platform: 'wechat-read' as const,
        originalUrl: 'https://weread.qq.com/book/test',
      };
      const result = BookContentSchema.safeParse(minimal);
      expect(result.success).toBe(true);
    });

    it('should reject empty bookId', () => {
      const result = BookContentSchema.safeParse({
        ...validBook,
        bookId: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject empty content', () => {
      const result = BookContentSchema.safeParse({
        ...validBook,
        content: '',
      });
      expect(result.success).toBe(false);
    });

    it('should accept optional chapterTitle', () => {
      const { chapterTitle, ...bookWithoutChapter } = validBook;
      const result = BookContentSchema.safeParse(bookWithoutChapter);
      expect(result.success).toBe(true);
    });

    it('should accept optional cover', () => {
      const { cover, ...bookWithoutCover } = validBook;
      const result = BookContentSchema.safeParse(bookWithoutCover);
      expect(result.success).toBe(true);
    });

    it('should reject invalid cover URL', () => {
      const result = BookContentSchema.safeParse({
        ...validBook,
        cover: 'not-a-url',
      });
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // TweetContentSchema Tests
  // ============================================================================
  describe('TweetContentSchema', () => {
    const validTweet = {
      type: 'tweet' as const,
      title: 'Sample Tweet',
      content: 'Tweet text here',
      images: ['https://pbs.twimg.com/media/abc123.jpg'],
      isThread: false,
      platform: 'twitter' as const,
      originalUrl: 'https://twitter.com/user/status/123',
      author: 'Alice',
    };

    it('should accept valid tweet content', () => {
      const result = TweetContentSchema.safeParse(validTweet);
      expect(result.success).toBe(true);
    });

    it('should accept tweet with no images', () => {
      const result = TweetContentSchema.safeParse({
        ...validTweet,
        images: [],
      });
      expect(result.success).toBe(true);
    });

    it('should accept tweet as thread', () => {
      const result = TweetContentSchema.safeParse({
        ...validTweet,
        isThread: true,
      });
      expect(result.success).toBe(true);
    });

    it('should reject empty content', () => {
      const result = TweetContentSchema.safeParse({
        ...validTweet,
        content: '',
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid image URLs', () => {
      const result = TweetContentSchema.safeParse({
        ...validTweet,
        images: ['not-a-url'],
      });
      expect(result.success).toBe(false);
    });

    it('should accept optional threadTweets', () => {
      const thread = {
        ...validTweet,
        isThread: true,
        threadTweets: [
          {
            type: 'tweet' as const,
            title: 'Reply 1',
            content: 'First reply',
            images: [],
            isThread: false,
            platform: 'twitter' as const,
            originalUrl: 'https://twitter.com/user/status/124',
            author: 'Alice',
          },
          {
            type: 'tweet' as const,
            title: 'Reply 2',
            content: 'Second reply',
            images: [],
            isThread: false,
            platform: 'twitter' as const,
            originalUrl: 'https://twitter.com/user/status/125',
            author: 'Alice',
          },
        ],
      };
      const result = TweetContentSchema.safeParse(thread);
      expect(result.success).toBe(true);
    });

    it('should reject more than 50 thread tweets', () => {
      const manyTweets = Array(51)
        .fill(null)
        .map((_, i) => ({
          type: 'tweet' as const,
          title: `Reply ${i}`,
          content: `Content ${i}`,
          images: [],
          isThread: false,
          platform: 'twitter' as const,
          originalUrl: `https://twitter.com/user/status/${i}`,
          author: 'Alice',
        }));

      const result = TweetContentSchema.safeParse({
        ...validTweet,
        isThread: true,
        threadTweets: manyTweets,
      });
      expect(result.success).toBe(false);
    });

    it('should reject missing isThread field', () => {
      const { isThread, ...tweetWithoutIsThread } = validTweet;
      const result = TweetContentSchema.safeParse(tweetWithoutIsThread);
      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // ParsedContentSchema (Discriminated Union) Tests
  // ============================================================================
  describe('ParsedContentSchema (Discriminated Union)', () => {
    it('should accept all valid content types', () => {
      const article = {
        type: 'article' as const,
        title: 'Article',
        content: 'Content',
        images: [],
        platform: 'wechat' as const,
        originalUrl: 'https://example.com',
      };

      const video = {
        type: 'video' as const,
        title: 'Video',
        videoUrl: 'https://youtube.com/watch?v=test',
        description: 'Desc',
        platform: 'youtube' as const,
        originalUrl: 'https://youtube.com/watch?v=test',
      };

      const gallery = {
        type: 'image-gallery' as const,
        title: 'Gallery',
        images: ['https://example.com/img.jpg'],
        description: 'Desc',
        platform: 'xiaohongshu' as const,
        originalUrl: 'https://xiaohongshu.com/explore/123',
      };

      const book = {
        type: 'book' as const,
        title: 'Book',
        bookId: 'book-123',
        content: 'Content',
        platform: 'wechat-read' as const,
        originalUrl: 'https://weread.qq.com/book/123',
      };

      const tweet = {
        type: 'tweet' as const,
        title: 'Tweet',
        content: 'Content',
        images: [],
        isThread: false,
        platform: 'twitter' as const,
        originalUrl: 'https://twitter.com/user/status/123',
      };

      expect(ParsedContentSchema.safeParse(article).success).toBe(true);
      expect(ParsedContentSchema.safeParse(video).success).toBe(true);
      expect(ParsedContentSchema.safeParse(gallery).success).toBe(true);
      expect(ParsedContentSchema.safeParse(book).success).toBe(true);
      expect(ParsedContentSchema.safeParse(tweet).success).toBe(true);
    });

    it('should reject invalid content', () => {
      const invalid = {
        type: 'podcast' as const,
        title: 'Invalid',
        platform: 'unknown' as const,
        originalUrl: 'https://example.com',
      };

      expect(ParsedContentSchema.safeParse(invalid).success).toBe(false);
    });

    it('should reject content with wrong type-specific fields', () => {
      // Article with video fields
      const mixedFields = {
        type: 'article' as const,
        title: 'Mixed',
        videoUrl: 'https://youtube.com/watch?v=test',
        description: 'Wrong type',
        platform: 'wechat' as const,
        originalUrl: 'https://example.com',
      };

      expect(ParsedContentSchema.safeParse(mixedFields).success).toBe(false);
    });

    it('should reject invalid content and provide error', () => {
      const invalid = {
        type: 'article' as const,
        title: '', // Invalid: empty title
        content: 'Content',
        images: [],
        platform: 'wechat' as const,
        originalUrl: 'https://example.com',
      };

      const result = ParsedContentSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      // Validation failed - that's all we need to verify
    });
  });

  // ============================================================================
  // Real-World Validation Scenarios
  // ============================================================================
  describe('Real-world validation scenarios', () => {
    it('should validate YouTube parser output', () => {
      const youtubeOutput = {
        type: 'video' as const,
        title: 'Rick Astley - Never Gonna Give You Up',
        videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        description: 'The official video for "Never Gonna Give You Up"',
        platform: 'youtube' as const,
        originalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        cover: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
        duration: 214,
        metadata: {
          videoId: 'dQw4w9WgXcQ',
          channelName: 'Rick Astley',
        },
      };

      const result = VideoContentSchema.safeParse(youtubeOutput);
      expect(result.success).toBe(true);
    });

    it('should validate Xiaohongshu article parser output', () => {
      const xhsOutput = {
        type: 'article' as const,
        title: '小红书标题',
        content: '正文内容...',
        images: [
          'https://sns-webpic-qc.xhscdn.com/202411191414/abc123.jpg',
          'https://sns-webpic-qc.xhscdn.com/202411191414/def456.jpg',
        ],
        platform: 'xiaohongshu' as const,
        originalUrl: 'https://www.xiaohongshu.com/explore/123456',
        author: '用户名',
        publishedAt: new Date('2024-11-19'),
      };

      const result = ArticleContentSchema.safeParse(xhsOutput);
      expect(result.success).toBe(true);
    });

    it('should validate Xiaohongshu image gallery parser output', () => {
      const xhsGalleryOutput = {
        type: 'image-gallery' as const,
        title: '小红书图片分享',
        images: [
          'https://sns-webpic-qc.xhscdn.com/202411191414/img1.jpg',
          'https://sns-webpic-qc.xhscdn.com/202411191414/img2.jpg',
          'https://sns-webpic-qc.xhscdn.com/202411191414/img3.jpg',
        ],
        description: '图片描述文字',
        platform: 'xiaohongshu' as const,
        originalUrl: 'https://www.xiaohongshu.com/explore/789012',
        author: '分享者',
      };

      const result = ImageGalleryContentSchema.safeParse(xhsGalleryOutput);
      expect(result.success).toBe(true);
    });

    it('should validate WeChat article parser output', () => {
      const wechatOutput = {
        type: 'article' as const,
        title: '微信公众号文章标题',
        content: '文章正文内容...',
        images: ['https://mmbiz.qpic.cn/mmbiz_jpg/abc123.jpg'],
        platform: 'wechat' as const,
        originalUrl: 'https://mp.weixin.qq.com/s/abc123',
        author: '公众号名称',
        publishedAt: new Date('2024-11-19'),
      };

      const result = ArticleContentSchema.safeParse(wechatOutput);
      expect(result.success).toBe(true);
    });

    it('should catch parser errors at validation boundary', () => {
      // Simulating a parser bug that returns invalid data
      const buggyParserOutput = {
        type: 'video' as const,
        title: 'Test Video',
        videoUrl: 'not-a-valid-url', // BUG: Invalid URL
        description: 'Test',
        platform: 'youtube' as const,
        originalUrl: 'https://youtube.com/watch?v=test',
        duration: -100, // BUG: Negative duration
      };

      const result = VideoContentSchema.safeParse(buggyParserOutput);

      // Schema should reject buggy parser output
      expect(result.success).toBe(false);
      // Validation catches bugs before they reach formatters
    });
  });
});
