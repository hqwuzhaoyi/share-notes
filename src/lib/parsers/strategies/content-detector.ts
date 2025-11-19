/**
 * Content Type Detection Strategy Pattern
 *
 * Provides platform-specific logic for determining content type from URL and HTML.
 * Each platform implements its own detection heuristics.
 *
 * @see specs/003-parser-architecture-refactor/data-model.md
 */

import type { ContentType } from '@/lib/types/content';

/**
 * Abstract interface for content type detection strategies
 * Enables platform-specific detection logic composition
 */
export interface ContentDetector {
  /**
   * Detect content type from URL and HTML structure
   * @param url - Original URL
   * @param html - HTML content to analyze
   * @returns ContentType enum value
   *
   * Fallback behavior: Returns 'article' if detection fails
   * Never throws errors - always returns a valid ContentType
   */
  detect(url: string, html: string): ContentType;
}

/**
 * Xiaohongshu content detector
 * Distinguishes between video and image-gallery content types
 */
export class XhsContentDetector implements ContentDetector {
  detect(url: string, html: string): ContentType {
    try {
      // Check URL pattern for video indicators
      if (url.includes('/video/') || url.includes('&type=video')) {
        return 'video';
      }

      // Check HTML for video player indicators
      if (
        html.includes('video-player') ||
        html.includes('xhs-video') ||
        html.includes('"type":"video"') ||
        html.includes('data-v-') // Vue component for video player
      ) {
        return 'video';
      }

      // Check for image gallery indicators (default for Xiaohongshu posts)
      if (
        html.includes('imageList') ||
        html.includes('carousel') ||
        html.includes('swiper')
      ) {
        return 'image-gallery';
      }

      // Default to image-gallery for Xiaohongshu (most common content type)
      return 'image-gallery';
    } catch (error) {
      // Fallback on any detection error
      return 'image-gallery';
    }
  }
}

/**
 * Bilibili content detector
 * Always returns video (Bilibili is video-only platform)
 */
export class BilibiliContentDetector implements ContentDetector {
  detect(_url: string, _html: string): ContentType {
    // Bilibili is video-only platform
    return 'video';
  }
}

/**
 * YouTube content detector
 * Always returns video (YouTube is video-only platform)
 */
export class YouTubeContentDetector implements ContentDetector {
  detect(_url: string, _html: string): ContentType {
    // YouTube is video-only platform
    return 'video';
  }
}
