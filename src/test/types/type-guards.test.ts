/**
 * Unit tests for Content Type Guards (T040 - US3)
 *
 * Tests all 5 type guard functions that enable TypeScript type narrowing:
 * - isArticleContent()
 * - isVideoContent()
 * - isImageGalleryContent()
 * - isBookContent()
 * - isTweetContent()
 */

import { describe, it, expect } from 'vitest';
import {
  isArticleContent,
  isVideoContent,
  isImageGalleryContent,
  isBookContent,
  isTweetContent,
  type ArticleContent,
  type VideoContent,
  type ImageGalleryContent,
  type BookContent,
  type TweetContent,
  type ParsedContent,
} from '@/lib/types/content';

describe('Content Type Guards (T040)', () => {
  // Sample content objects for testing
  const articleContent: ArticleContent = {
    type: 'article',
    title: 'Sample Article',
    content: 'Article content here',
    images: ['https://example.com/image.jpg'],
    platform: 'wechat',
    originalUrl: 'https://example.com/article',
    author: 'John Doe',
    publishedAt: new Date('2024-01-01'),
  };

  const videoContent: VideoContent = {
    type: 'video',
    title: 'Sample Video',
    videoUrl: 'https://youtube.com/watch?v=test123',
    description: 'Video description',
    platform: 'youtube',
    originalUrl: 'https://youtube.com/watch?v=test123',
    cover: 'https://i.ytimg.com/vi/test123/maxresdefault.jpg',
    duration: 600,
    metadata: { videoId: 'test123' },
  };

  const imageGalleryContent: ImageGalleryContent = {
    type: 'image-gallery',
    title: 'Sample Gallery',
    images: [
      'https://example.com/img1.jpg',
      'https://example.com/img2.jpg',
      'https://example.com/img3.jpg',
    ],
    description: 'Gallery description',
    platform: 'xiaohongshu',
    originalUrl: 'https://xiaohongshu.com/explore/123',
    author: 'Jane Smith',
  };

  const bookContent: BookContent = {
    type: 'book',
    title: 'Sample Book',
    bookId: 'book-12345',
    content: 'Book excerpt here',
    platform: 'wechat-read',
    originalUrl: 'https://weread.qq.com/book/123',
    chapterTitle: 'Chapter 1',
    cover: 'https://example.com/book-cover.jpg',
  };

  const tweetContent: TweetContent = {
    type: 'tweet',
    title: 'Sample Tweet',
    content: 'Tweet text here',
    images: [],
    isThread: false,
    platform: 'twitter',
    originalUrl: 'https://twitter.com/user/status/123',
    author: 'Alice',
  };

  describe('isArticleContent', () => {
    it('should return true for ArticleContent', () => {
      expect(isArticleContent(articleContent)).toBe(true);
    });

    it('should return false for other content types', () => {
      expect(isArticleContent(videoContent)).toBe(false);
      expect(isArticleContent(imageGalleryContent)).toBe(false);
      expect(isArticleContent(bookContent)).toBe(false);
      expect(isArticleContent(tweetContent)).toBe(false);
    });

    it('should return false for invalid objects', () => {
      expect(isArticleContent(null as any)).toBe(false);
      expect(isArticleContent(undefined as any)).toBe(false);
      expect(isArticleContent({} as any)).toBe(false);
      expect(isArticleContent({ type: 'unknown' } as any)).toBe(false);
    });

    it('should enable TypeScript type narrowing', () => {
      const content: ParsedContent = articleContent;

      if (isArticleContent(content)) {
        // TypeScript should know content is ArticleContent here
        expect(content.content).toBe('Article content here');
        expect(content.images).toHaveLength(1);
        // These properties should be accessible without type errors
        const _text: string = content.content;
        const _images: string[] = content.images;
      }
    });
  });

  describe('isVideoContent', () => {
    it('should return true for VideoContent', () => {
      expect(isVideoContent(videoContent)).toBe(true);
    });

    it('should return false for other content types', () => {
      expect(isVideoContent(articleContent)).toBe(false);
      expect(isVideoContent(imageGalleryContent)).toBe(false);
      expect(isVideoContent(bookContent)).toBe(false);
      expect(isVideoContent(tweetContent)).toBe(false);
    });

    it('should return false for invalid objects', () => {
      expect(isVideoContent(null as any)).toBe(false);
      expect(isVideoContent(undefined as any)).toBe(false);
      expect(isVideoContent({} as any)).toBe(false);
      expect(isVideoContent({ type: 'unknown' } as any)).toBe(false);
    });

    it('should enable TypeScript type narrowing', () => {
      const content: ParsedContent = videoContent;

      if (isVideoContent(content)) {
        // TypeScript should know content is VideoContent here
        expect(content.videoUrl).toBe('https://youtube.com/watch?v=test123');
        expect(content.duration).toBe(600);
        // These properties should be accessible without type errors
        const _videoUrl: string = content.videoUrl;
        const _duration: number | undefined = content.duration;
      }
    });
  });

  describe('isImageGalleryContent', () => {
    it('should return true for ImageGalleryContent', () => {
      expect(isImageGalleryContent(imageGalleryContent)).toBe(true);
    });

    it('should return false for other content types', () => {
      expect(isImageGalleryContent(articleContent)).toBe(false);
      expect(isImageGalleryContent(videoContent)).toBe(false);
      expect(isImageGalleryContent(bookContent)).toBe(false);
      expect(isImageGalleryContent(tweetContent)).toBe(false);
    });

    it('should return false for invalid objects', () => {
      expect(isImageGalleryContent(null as any)).toBe(false);
      expect(isImageGalleryContent(undefined as any)).toBe(false);
      expect(isImageGalleryContent({} as any)).toBe(false);
      expect(isImageGalleryContent({ type: 'unknown' } as any)).toBe(false);
    });

    it('should enable TypeScript type narrowing', () => {
      const content: ParsedContent = imageGalleryContent;

      if (isImageGalleryContent(content)) {
        // TypeScript should know content is ImageGalleryContent here
        expect(content.images).toHaveLength(3);
        expect(content.description).toBe('Gallery description');
        // These properties should be accessible without type errors
        const _images: string[] = content.images;
        const _description: string = content.description;
      }
    });
  });

  describe('isBookContent', () => {
    it('should return true for BookContent', () => {
      expect(isBookContent(bookContent)).toBe(true);
    });

    it('should return false for other content types', () => {
      expect(isBookContent(articleContent)).toBe(false);
      expect(isBookContent(videoContent)).toBe(false);
      expect(isBookContent(imageGalleryContent)).toBe(false);
      expect(isBookContent(tweetContent)).toBe(false);
    });

    it('should return false for invalid objects', () => {
      expect(isBookContent(null as any)).toBe(false);
      expect(isBookContent(undefined as any)).toBe(false);
      expect(isBookContent({} as any)).toBe(false);
      expect(isBookContent({ type: 'unknown' } as any)).toBe(false);
    });

    it('should enable TypeScript type narrowing', () => {
      const content: ParsedContent = bookContent;

      if (isBookContent(content)) {
        // TypeScript should know content is BookContent here
        expect(content.bookId).toBe('book-12345');
        expect(content.content).toBe('Book excerpt here');
        expect(content.chapterTitle).toBe('Chapter 1');
        // These properties should be accessible without type errors
        const _bookId: string = content.bookId;
        const _content: string = content.content;
        const _chapterTitle: string | undefined = content.chapterTitle;
      }
    });
  });

  describe('isTweetContent', () => {
    it('should return true for TweetContent', () => {
      expect(isTweetContent(tweetContent)).toBe(true);
    });

    it('should return false for other content types', () => {
      expect(isTweetContent(articleContent)).toBe(false);
      expect(isTweetContent(videoContent)).toBe(false);
      expect(isTweetContent(imageGalleryContent)).toBe(false);
      expect(isTweetContent(bookContent)).toBe(false);
    });

    it('should return false for invalid objects', () => {
      expect(isTweetContent(null as any)).toBe(false);
      expect(isTweetContent(undefined as any)).toBe(false);
      expect(isTweetContent({} as any)).toBe(false);
      expect(isTweetContent({ type: 'unknown' } as any)).toBe(false);
    });

    it('should enable TypeScript type narrowing', () => {
      const content: ParsedContent = tweetContent;

      if (isTweetContent(content)) {
        // TypeScript should know content is TweetContent here
        expect(content.content).toBe('Tweet text here');
        expect(content.isThread).toBe(false);
        expect(content.images).toEqual([]);
        // These properties should be accessible without type errors
        const _content: string = content.content;
        const _isThread: boolean = content.isThread;
        const _threadTweets: TweetContent[] | undefined = content.threadTweets;
      }
    });
  });

  describe('Type guard combinations', () => {
    it('should correctly identify content in switch statement', () => {
      const contents: ParsedContent[] = [
        articleContent,
        videoContent,
        imageGalleryContent,
        bookContent,
        tweetContent,
      ];

      contents.forEach(content => {
        switch (content.type) {
          case 'article':
            expect(isArticleContent(content)).toBe(true);
            expect(isVideoContent(content)).toBe(false);
            break;
          case 'video':
            expect(isVideoContent(content)).toBe(true);
            expect(isArticleContent(content)).toBe(false);
            break;
          case 'image-gallery':
            expect(isImageGalleryContent(content)).toBe(true);
            expect(isArticleContent(content)).toBe(false);
            break;
          case 'book':
            expect(isBookContent(content)).toBe(true);
            expect(isArticleContent(content)).toBe(false);
            break;
          case 'tweet':
            expect(isTweetContent(content)).toBe(true);
            expect(isArticleContent(content)).toBe(false);
            break;
        }
      });
    });

    it('should work correctly in if-else chains', () => {
      const testContent = (content: ParsedContent) => {
        if (isArticleContent(content)) {
          return 'article';
        } else if (isVideoContent(content)) {
          return 'video';
        } else if (isImageGalleryContent(content)) {
          return 'image-gallery';
        } else if (isBookContent(content)) {
          return 'book';
        } else if (isTweetContent(content)) {
          return 'tweet';
        }
        return 'unknown';
      };

      expect(testContent(articleContent)).toBe('article');
      expect(testContent(videoContent)).toBe('video');
      expect(testContent(imageGalleryContent)).toBe('image-gallery');
      expect(testContent(bookContent)).toBe('book');
      expect(testContent(tweetContent)).toBe('tweet');
    });

    it('should maintain mutual exclusivity', () => {
      const contents: ParsedContent[] = [
        articleContent,
        videoContent,
        imageGalleryContent,
        bookContent,
        tweetContent,
      ];

      // Each content should match exactly one type guard
      contents.forEach(content => {
        const matches = [
          isArticleContent(content),
          isVideoContent(content),
          isImageGalleryContent(content),
          isBookContent(content),
          isTweetContent(content),
        ].filter(Boolean);

        expect(matches).toHaveLength(1);
      });
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle objects with wrong type field gracefully', () => {
      const wrongType = { type: 'podcast' } as any;

      expect(isArticleContent(wrongType)).toBe(false);
      expect(isVideoContent(wrongType)).toBe(false);
      expect(isImageGalleryContent(wrongType)).toBe(false);
      expect(isBookContent(wrongType)).toBe(false);
      expect(isTweetContent(wrongType)).toBe(false);
    });

    it('should handle objects missing type field', () => {
      const noType = { title: 'Test' } as any;

      expect(isArticleContent(noType)).toBe(false);
      expect(isVideoContent(noType)).toBe(false);
      expect(isImageGalleryContent(noType)).toBe(false);
      expect(isBookContent(noType)).toBe(false);
      expect(isTweetContent(noType)).toBe(false);
    });

    it('should handle primitive values', () => {
      const primitives: any[] = [
        'string',
        42,
        true,
        Symbol('test'),
      ];

      primitives.forEach(value => {
        expect(isArticleContent(value)).toBe(false);
        expect(isVideoContent(value)).toBe(false);
        expect(isImageGalleryContent(value)).toBe(false);
        expect(isBookContent(value)).toBe(false);
        expect(isTweetContent(value)).toBe(false);
      });
    });

    it('should handle arrays', () => {
      const arr = [articleContent, videoContent] as any;

      expect(isArticleContent(arr)).toBe(false);
      expect(isVideoContent(arr)).toBe(false);
      expect(isImageGalleryContent(arr)).toBe(false);
      expect(isBookContent(arr)).toBe(false);
      expect(isTweetContent(arr)).toBe(false);
    });
  });

  describe('Real-world usage patterns', () => {
    it('should work with parser outputs', () => {
      // Simulating different parser outputs
      const parsedContents: ParsedContent[] = [
        articleContent,
        videoContent,
        imageGalleryContent,
      ];

      parsedContents.forEach(content => {
        // Type guards should work reliably for runtime checking
        const hasTextContent = isArticleContent(content) ||
                              isBookContent(content) ||
                              isTweetContent(content);

        const hasVideoUrl = isVideoContent(content);

        const hasImages = isArticleContent(content) ||
                         isImageGalleryContent(content) ||
                         isTweetContent(content);

        // Verify guards work correctly
        if (content.type === 'article') {
          expect(hasTextContent).toBe(true);
          expect(hasVideoUrl).toBe(false);
          expect(hasImages).toBe(true);
        } else if (content.type === 'video') {
          expect(hasTextContent).toBe(false);
          expect(hasVideoUrl).toBe(true);
          expect(hasImages).toBe(false);
        } else if (content.type === 'image-gallery') {
          expect(hasTextContent).toBe(false);
          expect(hasVideoUrl).toBe(false);
          expect(hasImages).toBe(true);
        }
      });
    });

    it('should work with formatter logic', () => {
      // Simulating formatter logic that needs type checking
      const formatContent = (content: ParsedContent): string => {
        if (isVideoContent(content)) {
          return `Video: ${content.title} (${content.duration}s)`;
        } else if (isImageGalleryContent(content)) {
          return `Gallery: ${content.title} (${content.images.length} images)`;
        } else if (isArticleContent(content)) {
          return `Article: ${content.title}`;
        } else if (isBookContent(content)) {
          return `Book: ${content.title} - ${content.chapterTitle || 'Unknown chapter'}`;
        } else if (isTweetContent(content)) {
          return `Tweet: ${content.content.substring(0, 50)}`;
        }
        return 'Unknown content type';
      };

      expect(formatContent(videoContent)).toBe('Video: Sample Video (600s)');
      expect(formatContent(imageGalleryContent)).toBe('Gallery: Sample Gallery (3 images)');
      expect(formatContent(articleContent)).toBe('Article: Sample Article');
      expect(formatContent(bookContent)).toBe('Book: Sample Book - Chapter 1');
      expect(formatContent(tweetContent)).toBe('Tweet: Tweet text here');
    });
  });
});
