/**
 * Central export point for all type definitions
 * Provides clean import paths for type consumers
 */

// Content type system
export type {
  ContentType,
  BaseContent,
  ArticleContent,
  VideoContent,
  ImageGalleryContent,
  BookContent,
  TweetContent,
  ParsedContent,
} from './content';

export {
  toArticleContent,
  hasTextContent,
  hasImages,
  getTextContent,
  getImages,
} from './content';

// Content validation schemas
export {
  ContentTypeSchema,
  PlatformTypeSchema,
  BaseContentSchema,
  ArticleContentSchema,
  VideoContentSchema,
  ImageGalleryContentSchema,
  BookContentSchema,
  TweetContentSchema,
  ParsedContentSchema,
  isArticleContent,
  isVideoContent,
  isImageGalleryContent,
  isBookContent,
  isTweetContent,
} from './content-schemas';

// Legacy parser types (maintained for backward compatibility)
export type {
  ParserOptions,
  PlatformType,
  OutputFormat,
  ParseRequest,
  ParseResult,
  FallbackInfo,
} from './parser';

export { BaseParser } from './parser';

// Formatter types
export type {
  PlatformCapabilities,
  FormattedOutput,
  FormatterResult,
  FormatterError,
  FormatterErrorCode,
} from './formatter';

export { BaseOutputFormatter, Ok, Err } from './formatter';
