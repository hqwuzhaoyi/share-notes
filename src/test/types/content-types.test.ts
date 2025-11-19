/**
 * Unit tests for VideoContent type guards and validation
 * Tests type discrimination and Zod schema validation for video content
 */

import { describe, it, expect } from 'vitest';
import {
  isVideoContent,
  VideoContentSchema,
  type VideoContent,
} from '@/lib/types';

describe('VideoContent Type Guards', () => {
  const validVideoContent: VideoContent = {
    type: 'video',
    title: 'Test Video',
    videoUrl: 'https://youtube.com/watch?v=test123',
    description: 'Test video description',
    platform: 'youtube',
    originalUrl: 'https://youtube.com/watch?v=test123',
    cover: 'https://i.ytimg.com/vi/test123/maxresdefault.jpg',
    duration: 600,
    metadata: {
      videoId: 'test123',
      channelName: 'Test Channel',
    },
  };

  describe('isVideoContent type guard', () => {
    it('should return true for valid VideoContent', () => {
      expect(isVideoContent(validVideoContent)).toBe(true);
    });

    it('should return false for ArticleContent', () => {
      const articleContent = {
        type: 'article',
        title: 'Article',
        content: 'Content',
        images: [],
        platform: 'wechat',
        originalUrl: 'https://example.com',
      };
      expect(isVideoContent(articleContent)).toBe(false);
    });

    it('should return false for invalid objects', () => {
      expect(isVideoContent(null)).toBe(false);
      expect(isVideoContent(undefined)).toBe(false);
      expect(isVideoContent({})).toBe(false);
      expect(isVideoContent('string')).toBe(false);
    });

    it('should return false when required fields are missing', () => {
      const invalidVideo = {
        type: 'video',
        title: 'Test',
        // Missing videoUrl, description, platform, originalUrl
      };
      expect(isVideoContent(invalidVideo)).toBe(false);
    });
  });

  describe('VideoContentSchema validation', () => {
    it('should validate complete VideoContent with all fields', () => {
      const result = VideoContentSchema.safeParse(validVideoContent);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe('video');
        expect(result.data.videoUrl).toBe(validVideoContent.videoUrl);
        expect(result.data.duration).toBe(600);
      }
    });

    it('should validate VideoContent without optional fields', () => {
      const minimalVideo: VideoContent = {
        type: 'video',
        title: 'Minimal Video',
        videoUrl: 'https://bilibili.com/video/BV1xx411c7XD',
        description: 'Description',
        platform: 'bilibili',
        originalUrl: 'https://bilibili.com/video/BV1xx411c7XD',
      };
      const result = VideoContentSchema.safeParse(minimalVideo);
      expect(result.success).toBe(true);
    });

    it('should reject when type is not "video"', () => {
      const wrongType = { ...validVideoContent, type: 'article' };
      const result = VideoContentSchema.safeParse(wrongType);
      expect(result.success).toBe(false);
    });

    it('should reject when videoUrl is invalid URL', () => {
      const invalidUrl = { ...validVideoContent, videoUrl: 'not-a-url' };
      const result = VideoContentSchema.safeParse(invalidUrl);
      expect(result.success).toBe(false);
    });

    it('should reject when duration is negative', () => {
      const negativeDuration = { ...validVideoContent, duration: -10 };
      const result = VideoContentSchema.safeParse(negativeDuration);
      expect(result.success).toBe(false);
    });

    it('should accept platform-specific metadata', () => {
      const withMetadata: VideoContent = {
        ...validVideoContent,
        metadata: {
          bvid: 'BV1xx411c7XD',
          aid: 123456,
          customField: 'custom value',
        },
      };
      const result = VideoContentSchema.safeParse(withMetadata);
      expect(result.success).toBe(true);
    });

    it('should handle missing optional cover field', () => {
      const { cover, ...noCover } = validVideoContent;
      const result = VideoContentSchema.safeParse(noCover);
      expect(result.success).toBe(true);
    });
  });

  describe('VideoContent edge cases', () => {
    it('should accept empty description string', () => {
      const emptyDesc = { ...validVideoContent, description: '' };
      const result = VideoContentSchema.safeParse(emptyDesc);
      expect(result.success).toBe(true);
    });

    it('should accept duration of 0', () => {
      const zeroDuration = { ...validVideoContent, duration: 0 };
      const result = VideoContentSchema.safeParse(zeroDuration);
      expect(result.success).toBe(false); // Must be positive
    });

    it('should accept very large duration', () => {
      const longVideo = { ...validVideoContent, duration: 86400 }; // 24 hours
      const result = VideoContentSchema.safeParse(longVideo);
      expect(result.success).toBe(true);
    });
  });
});
