/**
 * Content Type System for Parser Architecture
 *
 * This module defines the core content type system using TypeScript discriminated unions.
 * Each content type extends BaseContent and includes a type discriminator for type-safe handling.
 *
 * @see specs/003-parser-architecture-refactor/data-model.md
 */

import type { PlatformType } from './platform';

/**
 * Discriminator for content type
 * Used in discriminated unions for type-safe pattern matching
 */
export type ContentType = 'article' | 'video' | 'image-gallery' | 'book' | 'tweet';

/**
 * Base interface for all content types
 * Provides common fields shared across all parsed content
 */
export interface BaseContent {
  /** Content type discriminator for TypeScript type narrowing */
  type: ContentType;

  /** Content title (required, non-empty) */
  title: string;

  /** Source platform identifier */
  platform: PlatformType;

  /** Original source URL */
  originalUrl: string;

  /** Content author/creator (optional) */
  author?: string;

  /** Publication timestamp (optional) */
  publishedAt?: Date;
}

/**
 * Article content type
 * Text-based articles with optional images (blogs, news articles, public account posts)
 */
export interface ArticleContent extends BaseContent {
  type: 'article';

  /** Article text content (required, non-empty) */
  content: string;

  /** Array of image URLs (required, can be empty array) */
  images: string[];
}

/**
 * Video content type
 * Video content from video platforms (YouTube, Bilibili, Xiaohongshu video)
 */
export interface VideoContent extends BaseContent {
  type: 'video';

  /** Direct video URL or platform video page (required) */
  videoUrl: string;

  /** Video cover/thumbnail image URL (optional) */
  cover?: string;

  /** Video duration in seconds (optional, must be >0) */
  duration?: number;

  /** Video description/summary (required, can be empty string) */
  description: string;

  /** Platform-specific metadata (optional, extensible) */
  metadata?: Record<string, any>;
}

/**
 * Image gallery content type
 * Image-focused content (Xiaohongshu posts, Instagram-like content)
 */
export interface ImageGalleryContent extends BaseContent {
  type: 'image-gallery';

  /** Array of image URLs (required, min length: 1) */
  images: string[];

  /** Gallery description/caption (required, can be empty) */
  description: string;
}

/**
 * Book content type
 * Book excerpts, chapters, reading notes (WeChat Read, Kindle)
 */
export interface BookContent extends BaseContent {
  type: 'book';

  /** Platform-specific book identifier (required, non-empty) */
  bookId: string;

  /** Chapter/section title (optional) */
  chapterTitle?: string;

  /** Excerpt or reading note content (required, non-empty) */
  content: string;

  /** Book cover image URL (optional) */
  cover?: string;
}

/**
 * Tweet/social media content type
 * Social media posts, microblogs (Twitter/X, Weibo)
 */
export interface TweetContent extends BaseContent {
  type: 'tweet';

  /** Tweet text content (required, non-empty) */
  content: string;

  /** Attached images (required, can be empty) */
  images: string[];

  /** Whether this is part of a thread (required) */
  isThread: boolean;

  /** Additional tweets if thread (optional) */
  threadTweets?: TweetContent[];
}

/**
 * Discriminated union of all content types
 * Enables type-safe pattern matching across the parser-formatter boundary
 */
export type ParsedContent =
  | ArticleContent
  | VideoContent
  | ImageGalleryContent
  | BookContent
  | TweetContent;

/**
 * Backward compatibility helper: Convert legacy ParsedContent to ArticleContent
 * Maps old format (without type discriminator) to new ArticleContent type
 *
 * @param legacy - Legacy parsed content object
 * @returns ArticleContent with type discriminator
 */
export function toArticleContent(legacy: Omit<ArticleContent, 'type'>): ArticleContent {
  return {
    ...legacy,
    type: 'article',
  };
}

// ============================================================================
// Type Guards (T041 - US3)
// ============================================================================

/**
 * Type guard: Check if content is ArticleContent
 * Enables TypeScript to narrow the union type to ArticleContent
 *
 * @param content - Parsed content to check
 * @returns True if content is ArticleContent
 */
export function isArticleContent(content: ParsedContent): content is ArticleContent {
  return content?.type === 'article';
}

/**
 * Type guard: Check if content is VideoContent
 * Enables TypeScript to narrow the union type to VideoContent
 *
 * @param content - Parsed content to check
 * @returns True if content is VideoContent
 */
export function isVideoContent(content: ParsedContent): content is VideoContent {
  return content?.type === 'video';
}

/**
 * Type guard: Check if content is ImageGalleryContent
 * Enables TypeScript to narrow the union type to ImageGalleryContent
 *
 * @param content - Parsed content to check
 * @returns True if content is ImageGalleryContent
 */
export function isImageGalleryContent(content: ParsedContent): content is ImageGalleryContent {
  return content?.type === 'image-gallery';
}

/**
 * Type guard: Check if content is BookContent
 * Enables TypeScript to narrow the union type to BookContent
 *
 * @param content - Parsed content to check
 * @returns True if content is BookContent
 */
export function isBookContent(content: ParsedContent): content is BookContent {
  return content?.type === 'book';
}

/**
 * Type guard: Check if content is TweetContent
 * Enables TypeScript to narrow the union type to TweetContent
 *
 * @param content - Parsed content to check
 * @returns True if content is TweetContent
 */
export function isTweetContent(content: ParsedContent): content is TweetContent {
  return content?.type === 'tweet';
}

/**
 * Type guard: Check if content has text content field
 */
export function hasTextContent(content: ParsedContent): content is ArticleContent | BookContent | TweetContent {
  return content.type === 'article' || content.type === 'book' || content.type === 'tweet';
}

/**
 * Type guard: Check if content has images field
 */
export function hasImages(content: ParsedContent): content is ArticleContent | ImageGalleryContent | TweetContent {
  return content.type === 'article' || content.type === 'image-gallery' || content.type === 'tweet';
}

/**
 * Safe accessor: Get text content or description
 */
export function getTextContent(content: ParsedContent): string {
  switch (content.type) {
    case 'article':
    case 'book':
    case 'tweet':
      return content.content;
    case 'video':
    case 'image-gallery':
      return content.description;
    default:
      const _exhaustive: never = content;
      return '';
  }
}

/**
 * Safe accessor: Get images array
 */
export function getImages(content: ParsedContent): string[] {
  switch (content.type) {
    case 'article':
    case 'tweet':
    case 'image-gallery':
      return content.images;
    case 'video':
      return content.cover ? [content.cover] : [];
    case 'book':
      return content.cover ? [content.cover] : [];
    default:
      const _exhaustive: never = content;
      return [];
  }
}
