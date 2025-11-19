/**
 * Zod Runtime Validation Schemas for Content Types
 *
 * Provides runtime validation for content types at the parser-formatter boundary.
 * All schemas correspond to TypeScript interfaces in content.ts
 *
 * @see src/lib/types/content.ts
 * @see specs/003-parser-architecture-refactor/contracts/content-types.schema.json
 */

import { z } from 'zod';

/**
 * Content type discriminator schema
 */
export const ContentTypeSchema = z.enum([
  'article',
  'video',
  'image-gallery',
  'book',
  'tweet',
]);

/**
 * Platform type schema (must match parser.ts PlatformType)
 */
export const PlatformTypeSchema = z.enum([
  'xiaohongshu',
  'bilibili',
  'wechat',
  'wechat-read',
  'youtube',
  'twitter',
  'unknown',
]);

/**
 * Base content schema
 * Validates common fields shared across all content types
 */
export const BaseContentSchema = z.object({
  type: ContentTypeSchema,
  title: z.string().min(1, 'Title must be non-empty'),
  platform: PlatformTypeSchema,
  originalUrl: z.string().url('Original URL must be a valid URL'),
  author: z.string().optional(),
  publishedAt: z.date().optional(),
});

/**
 * Article content schema
 * Validates article-specific fields
 */
export const ArticleContentSchema = BaseContentSchema.extend({
  type: z.literal('article'),
  content: z.string().min(1, 'Article content must be non-empty'),
  images: z
    .array(z.string().url('Image URL must be valid'))
    .max(50, 'Images array limited to 50 items'),
});

/**
 * Video content schema
 * Validates video-specific fields with platform metadata
 */
export const VideoContentSchema = BaseContentSchema.extend({
  type: z.literal('video'),
  videoUrl: z.string().url('Video URL must be valid'),
  cover: z.string().url('Cover URL must be valid').optional(),
  duration: z.number().positive('Duration must be positive').optional(),
  description: z.string(),
  metadata: z.record(z.string(), z.any()).optional(),
});

/**
 * Image gallery content schema
 * Validates image gallery fields
 */
export const ImageGalleryContentSchema = BaseContentSchema.extend({
  type: z.literal('image-gallery'),
  images: z
    .array(z.string().url('Image URL must be valid'))
    .min(1, 'Images array must contain at least 1 image')
    .max(50, 'Images array limited to 50 items'),
  description: z.string(),
});

/**
 * Book content schema
 * Validates book-specific fields
 */
export const BookContentSchema = BaseContentSchema.extend({
  type: z.literal('book'),
  bookId: z.string().min(1, 'Book ID must be non-empty'),
  chapterTitle: z.string().optional(),
  content: z.string().min(1, 'Book content must be non-empty'),
  cover: z.string().url('Cover URL must be valid').optional(),
});

/**
 * Tweet content schema
 * Validates tweet-specific fields with optional thread support
 */
export const TweetContentSchema: z.ZodType<any> = BaseContentSchema.extend({
  type: z.literal('tweet'),
  content: z.string().min(1, 'Tweet content must be non-empty'),
  images: z.array(z.string().url('Image URL must be valid')),
  isThread: z.boolean(),
  threadTweets: z.lazy(() => z.array(TweetContentSchema).max(50)).optional(),
});

/**
 * Discriminated union schema for all content types
 * Validates parsed content at runtime using type discriminator
 */
export const ParsedContentSchema = z.union([
  ArticleContentSchema,
  VideoContentSchema,
  ImageGalleryContentSchema,
  BookContentSchema,
  TweetContentSchema,
]);

/**
 * Type guard: Check if content is ArticleContent
 */
export function isArticleContent(content: unknown): content is z.infer<typeof ArticleContentSchema> {
  return ArticleContentSchema.safeParse(content).success;
}

/**
 * Type guard: Check if content is VideoContent
 */
export function isVideoContent(content: unknown): content is z.infer<typeof VideoContentSchema> {
  return VideoContentSchema.safeParse(content).success;
}

/**
 * Type guard: Check if content is ImageGalleryContent
 */
export function isImageGalleryContent(content: unknown): content is z.infer<typeof ImageGalleryContentSchema> {
  return ImageGalleryContentSchema.safeParse(content).success;
}

/**
 * Type guard: Check if content is BookContent
 */
export function isBookContent(content: unknown): content is z.infer<typeof BookContentSchema> {
  return BookContentSchema.safeParse(content).success;
}

/**
 * Type guard: Check if content is TweetContent
 */
export function isTweetContent(content: unknown): content is z.infer<typeof TweetContentSchema> {
  return TweetContentSchema.safeParse(content).success;
}
