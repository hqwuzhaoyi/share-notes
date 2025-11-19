/**
 * Content Extraction Strategy Pattern
 *
 * Generic interface for extracting structured content from raw HTML.
 * Type parameter T ensures type-safe extraction for specific content types.
 *
 * @see specs/003-parser-architecture-refactor/data-model.md
 */

import type { BaseContent } from '@/lib/types/content';

/**
 * Generic interface for content extraction strategies
 * Type parameter T must extend BaseContent for type safety
 *
 * Naming convention: {Platform}{Type}Extractor
 * Examples: XhsVideoExtractor, BilibiliVideoExtractor, WechatArticleExtractor
 */
export interface ContentExtractor<T extends BaseContent> {
  /**
   * Extract structured content from HTML
   * @param html - Raw HTML content
   * @param url - Original URL for context
   * @returns Typed content object
   * @throws Error only for complete extraction failure
   *
   * Partial data handling: Return object with available fields, log warnings for missing data
   */
  extract(html: string, url: string): T;
}
