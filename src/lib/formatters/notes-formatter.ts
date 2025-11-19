/**
 * Apple Notes Formatter
 *
 * Formats content for Apple Notes app using mobilenotes://create URL scheme.
 * Images are included as text URLs (Notes doesn't support image embedding).
 */

import { BaseOutputFormatter, type PlatformCapabilities, type FormattedOutput, type FormatterResult, Ok, Err } from '../types/formatter';
import type { ParsedContent } from '../types/parser';
import type { AIEnhancedContent } from '../types/ai';
import { truncateForURL } from '../utils/url-truncate';

/**
 * Apple Notes platform formatter implementation
 *
 * Capabilities:
 * - Does NOT support image embedding (images as text URLs instead)
 * - Direct URL scheme support (mobilenotes://create)
 * - Content length limit: 30,000 characters (more conservative than Flomo)
 *
 * URL Scheme Format:
 * mobilenotes://create?note=<encoded_text>
 */
export class NotesFormatter extends BaseOutputFormatter {
  readonly capabilities: PlatformCapabilities = {
    supportsImages: false,  // Images shown as text URLs
    supportsDirectCreate: true,
    maxContentLength: 30000
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

      // Build Notes content
      let notesContent = '';

      // Title (plain text, no Markdown)
      if (displayTitle) {
        notesContent += `${displayTitle}\n\n`;
      }

      // Main content (summary or original)
      if (displayContent) {
        notesContent += `${displayContent}\n\n`;
      }

      // AI enhancements: categories
      if (useAIContent && aiContent.categories && aiContent.categories.length > 0) {
        notesContent += `分类: ${aiContent.categories.join(', ')}\n`;
      }

      // AI enhancements: tags
      if (useAIContent && aiContent.tags && aiContent.tags.length > 0) {
        notesContent += `标签: ${aiContent.tags.join(', ')}\n\n`;
      }

      // Images as text URLs (Notes doesn't support image embedding)
      if (content.images.length > 0) {
        notesContent += '📷 图片链接：\n';
        content.images.forEach((img, index) => {
          notesContent += `${index + 1}. ${img}\n`;
        });
        notesContent += '\n';
      }

      // Author information
      if (content.author) {
        notesContent += `作者: ${content.author}\n`;
      }

      // Original URL
      notesContent += `链接: ${content.originalUrl}\n`;

      // Timestamp
      notesContent += `时间: ${new Date().toLocaleString('zh-CN')}`;

      // AI enhancement indicator
      if (useAIContent) {
        notesContent += '\nAI增强内容';
      }

      // Truncate content if needed
      const safeContent = truncateForURL(notesContent, this.capabilities.maxContentLength!);

      // Validate truncated content is not empty
      if (!safeContent || safeContent === '...' || safeContent.trim() === '') {
        return Err(
          'INVALID_CONTENT',
          'Content became empty after truncation to fit URL length limit'
        );
      }

      // Build Notes URL scheme
      const encodedContent = encodeURIComponent(safeContent);
      const notesUrl = `mobilenotes://create?note=${encodedContent}`;

      // Build fallback plain text
      const fallbackText = this.buildFallback(displayTitle, displayContent, content);

      return Ok({
        type: 'url_scheme',
        value: notesUrl,
        fallback: fallbackText
      });

    } catch (error) {
      return Err(
        'FORMATTING_FAILED',
        `Notes formatting failed: ${error instanceof Error ? error.message : String(error)}`,
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
    if (original.images.length > 0) {
      fallback += `图片:\n${original.images.map((img, i) => `${i + 1}. ${img}`).join('\n')}\n\n`;
    }
    fallback += `链接: ${original.originalUrl}`;
    return fallback;
  }
}
