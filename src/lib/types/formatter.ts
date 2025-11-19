/**
 * Formatter Type Definitions
 *
 * Core type system for the formatter refactoring (Feature 002).
 * Defines capabilities, outputs, errors, and results for platform formatters.
 */

import type { ParsedContent } from './parser';

/**
 * Platform capability declaration
 *
 * Each formatter declares its capabilities upfront, enabling:
 * - Client capability discovery via API
 * - Fail-fast validation at registration time
 * - Clear platform feature matrix
 */
export interface PlatformCapabilities {
  /**
   * Whether platform supports embedding images in formatted output
   * - true: Platform can display/embed images (e.g., Flomo)
   * - false: Platform only supports image URLs as text (e.g., Apple Notes)
   */
  supportsImages: boolean;

  /**
   * Whether platform supports direct content creation via URL scheme
   * - true: Platform has native URL scheme (e.g., flomo://create)
   * - false: Requires iOS Shortcuts bridge (e.g., shortcuts://run-shortcut)
   */
  supportsDirectCreate: boolean;

  /**
   * Maximum content length after URL encoding
   * - undefined: No explicit limit known
   * - number: Conservative safe limit in characters (after encodeURIComponent)
   */
  maxContentLength?: number;
}

/**
 * Formatted output structure from all formatters
 *
 * Unified output contract enabling consistent handling across platforms.
 */
export interface FormattedOutput {
  /**
   * Output type indicating how content should be delivered
   * - url_scheme: Direct platform URL (e.g., flomo://create?content=...)
   * - shortcut_trigger: iOS Shortcuts invocation (e.g., shortcuts://run-shortcut?...)
   * - raw_content: Unformatted structured data
   */
  type: 'url_scheme' | 'shortcut_trigger' | 'raw_content';

  /**
   * Primary formatted value
   * - url_scheme: Complete URL string
   * - shortcut_trigger: Shortcuts URL with parameters
   * - raw_content: JSON-serializable object
   */
  value: string;

  /**
   * Optional fallback format if primary method unavailable
   * - Typically plain text representation
   * - Used when primary format fails (e.g., URL too long)
   */
  fallback?: string;
}

/**
 * Formatter error codes
 *
 * Machine-readable error codes for structured error handling.
 */
export type FormatterErrorCode =
  | 'FORMATTING_FAILED'       // General formatting error
  | 'INVALID_CONTENT'         // Content validation failed
  | 'UNSUPPORTED_FEATURE'     // Requested feature not supported
  | 'URL_ENCODING_ERROR';     // URL encoding failed

/**
 * Structured error class for formatter failures
 *
 * Extends Error with machine-readable code and optional cause.
 */
export class FormatterError extends Error {
  /**
   * Machine-readable error code
   */
  readonly code: FormatterErrorCode;

  /**
   * Optional underlying cause
   */
  readonly cause?: unknown;

  constructor(
    code: FormatterErrorCode,
    message: string,
    cause?: unknown
  ) {
    super(message);
    this.name = 'FormatterError';
    this.code = code;
    this.cause = cause;

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FormatterError);
    }
  }
}

/**
 * Result type for type-safe error handling
 *
 * Forces explicit error handling at compile time:
 * - Success branch: { success: true, data: T }
 * - Error branch: { success: false, error: FormatterError }
 */
export type FormatterResult<T> =
  | { success: true; data: T }
  | { success: false; error: FormatterError };

/**
 * Helper: Create success result
 */
export const Ok = <T>(data: T): FormatterResult<T> => ({
  success: true,
  data
});

/**
 * Helper: Create error result
 */
export const Err = (
  code: FormatterErrorCode,
  message: string,
  cause?: unknown
): FormatterResult<never> => ({
  success: false,
  error: new FormatterError(code, message, cause)
});

/**
 * Base class for all platform formatters
 *
 * Implements Template Method pattern:
 * - Abstract methods: capabilities, format() (platform-specific)
 * - Shared utilities: validateContent(), cleanText(), isValidImageUrl()
 */
export abstract class BaseOutputFormatter {
  /**
   * Platform capabilities declaration
   * MUST be implemented by subclasses as readonly property
   */
  abstract readonly capabilities: PlatformCapabilities;

  /**
   * Core formatting method
   * MUST return Result type for type-safe error handling
   */
  abstract format(content: ParsedContent): FormatterResult<FormattedOutput>;

  /**
   * Validate content meets basic structural requirements
   * Protected method shared by all formatters
   *
   * Note: Length validation should be done in format() method after
   * content construction and truncation, not here. This is because:
   * 1. URL encoding expands content (Chinese/emoji 3x)
   * 2. Different formatters add different metadata
   * 3. Truncation happens at formatting time
   */
  protected validateContent(content: ParsedContent): FormatterResult<ParsedContent> {
    // Basic structural check - must have some content
    if (!content.title && !content.content) {
      return Err(
        'INVALID_CONTENT',
        'Content must have title or content'
      );
    }

    return Ok(content);
  }

  /**
   * Clean and normalize text content
   * Protected utility shared by all formatters
   */
  protected cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')           // Multiple spaces → single space
      .replace(/\n\s*\n/g, '\n\n')    // Multiple newlines → double newline
      .trim();
  }

  /**
   * Validate image URL format
   * Protected utility shared by all formatters
   */
  protected isValidImageUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }
}
