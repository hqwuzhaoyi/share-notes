/**
 * Flomo Formatter
 *
 * Formats content for Flomo note-taking app using flomo://create URL scheme.
 * Supports image embedding via JSON array parameter.
 */

import { BaseOutputFormatter, type PlatformCapabilities, type FormattedOutput, type FormatterResult, Ok, Err } from '../types/formatter';
import type { ParsedContent } from '../types/parser';
import type { AIEnhancedContent } from '../types/ai';
import { truncateForURL } from '../utils/url-truncate';

/**
 * Flomo platform formatter implementation
 *
 * Capabilities:
 * - Supports image embedding via image_urls parameter
 * - Direct URL scheme support (flomo://create)
 * - Content length limit: 50,000 characters (conservative)
 *
 * URL Scheme Format:
 * flomo://create?content=<encoded_text>&image_urls=<json_array>
 */
export class FlomoFormatter extends BaseOutputFormatter {
  readonly capabilities: PlatformCapabilities = {
    supportsImages: true,
    supportsDirectCreate: true,
    maxContentLength: 50000
  };

  format(content: ParsedContent): FormatterResult<FormattedOutput> {
    // Validate input using inherited method
    const validated = this.validateContent(content);
    if (!validated.success) return validated;

    try {
      // Detect AI-enhanced content
      const aiContent = content as AIEnhancedContent;
      const useAIContent = aiContent.aiEnhanced;

      // Select title and content (AI-enhanced or original)
      const displayTitle = useAIContent && aiContent.optimizedTitle
        ? aiContent.optimizedTitle
        : content.title;

      const displayContent = useAIContent && aiContent.summary
        ? aiContent.summary
        : content.content;

      // Build Flomo content
      let flomoContent = '';

      // Title (Markdown heading level 2)
      if (displayTitle) {
        flomoContent += `## ${displayTitle}\n\n`;
      }

      // Main content (summary or original)
      if (displayContent) {
        flomoContent += `${displayContent}\n\n`;
      }

      // AI enhancements: categories
      if (useAIContent && aiContent.categories && aiContent.categories.length > 0) {
        flomoContent += `🏷️ ${aiContent.categories.join(' · ')}\n`;
      }

      // AI enhancements: tags
      if (useAIContent && aiContent.tags && aiContent.tags.length > 0) {
        flomoContent += `#${aiContent.tags.join(' #')}\n\n`;
      }

      // Author information
      if (content.author) {
        flomoContent += `👤 ${content.author}\n`;
      }

      // Original URL
      flomoContent += `🔗 ${content.originalUrl}\n`;

      // Timestamp
      flomoContent += `⏰ ${new Date().toLocaleString('zh-CN')}`;

      // AI enhancement indicator
      if (useAIContent) {
        flomoContent += '\n✨ AI增强';
      }

      // Truncate content if needed
      const safeContent = truncateForURL(flomoContent, this.capabilities.maxContentLength!);

      // Validate truncated content is not empty
      if (!safeContent || safeContent === '...' || safeContent.trim() === '') {
        return Err(
          'INVALID_CONTENT',
          'Content became empty after truncation to fit URL length limit'
        );
      }

      // Filter valid image URLs
      const validImages = content.images.filter(img => this.isValidImageUrl(img));

      // Build Flomo URL scheme
      const encodedContent = encodeURIComponent(safeContent);
      const encodedImages = validImages.length > 0
        ? encodeURIComponent(JSON.stringify(validImages))
        : '';

      let flomoUrl = `flomo://create?content=${encodedContent}`;
      if (encodedImages) {
        flomoUrl += `&image_urls=${encodedImages}`;
      }

      // Build fallback plain text
      const fallbackText = this.buildFallback(displayTitle, displayContent, content);

      return Ok({
        type: 'url_scheme',
        value: flomoUrl,
        fallback: fallbackText
      });

    } catch (error) {
      return Err(
        'FORMATTING_FAILED',
        `Flomo formatting failed: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  /**
   * Build fallback plain text representation
   * @private
   */
  private buildFallback(title: string, content: string, original: ParsedContent): string {
    let fallback = '';
    if (title) fallback += `${title}\n\n`;
    if (content) fallback += `${content}\n\n`;
    fallback += `链接: ${original.originalUrl}`;
    return fallback;
  }
}
