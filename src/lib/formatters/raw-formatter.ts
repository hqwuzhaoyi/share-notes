/**
 * Raw Formatter
 *
 * Returns unformatted structured data as JSON.
 * Useful for custom integrations and debugging.
 */

import { BaseOutputFormatter, type PlatformCapabilities, type FormattedOutput, type FormatterResult, Ok, Err } from '../types/formatter';
import type { ParsedContent } from '../types/parser';

/**
 * Raw format implementation
 *
 * Capabilities:
 * - Supports all content (returns as-is)
 * - Direct output (no URL scheme needed)
 * - No content length limit
 *
 * Output Format:
 * JSON-serialized ParsedContent object
 */
export class RawFormatter extends BaseOutputFormatter {
  readonly capabilities: PlatformCapabilities = {
    supportsImages: true,       // Returns image URLs as-is
    supportsDirectCreate: true, // No external app needed
    maxContentLength: undefined // No limit
  };

  format(content: ParsedContent): FormatterResult<FormattedOutput> {
    // Validate input using inherited method
    const validated = this.validateContent(content);
    if (!validated.success) return validated;

    try {
      // Serialize content to JSON
      const jsonContent = JSON.stringify(content, null, 2);

      return Ok({
        type: 'raw_content',
        value: jsonContent,
        fallback: undefined // No fallback needed for raw content
      });

    } catch (error) {
      return Err(
        'FORMATTING_FAILED',
        `Raw formatting failed: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }
}
