/**
 * URLExtractor - Extract Xiaohongshu URLs from share text
 *
 * Implements a three-tier extraction strategy:
 * 1. Passthrough: Clean URLs (<0.1ms)
 * 2. Regex: Pattern matching (<5ms)
 * 3. AI Fallback: LLM-based extraction (200-500ms, optional)
 */

import {
  ExtractionResult,
  ExtractionMethod,
  ExtractionError,
  ExtractionErrorCode,
  ExtractionMetadata,
  ExtractionOptions,
} from '../types/url-extractor';

export class URLExtractor {
  /** Regex pattern to match all URLs in text (stops at whitespace or Chinese punctuation) */
  private static readonly URL_PATTERN = /https?:\/\/[^\s\u3000-\u303F\uFF00-\uFFEF]+/g;

  /** Regex pattern to match Xiaohongshu domains */
  private static readonly XHS_DOMAIN_PATTERN = /(xiaohongshu\.com|xhslink\.com)/;

  /** Maximum input length (characters) */
  private static readonly MAX_INPUT_LENGTH = 5000;

  /**
   * Extract Xiaohongshu URL from input text or pass through clean URL
   *
   * @param input - Share text or clean URL
   * @param options - Extraction configuration options
   * @returns ExtractionResult with extracted URL or error details
   */
  extract(input: string, options?: ExtractionOptions): ExtractionResult {
    const startTime = Date.now();

    // Input validation
    if (!this.validateInput(input)) {
      return this.createError(
        'NO_URL_FOUND',
        input,
        startTime,
        0,
        0,
        false
      );
    }

    // Early passthrough detection (zero overhead for clean URLs)
    if (this.isCleanUrl(input)) {
      return this.createPassthrough(input, startTime);
    }

    // Regex extraction
    const urls = input.match(URLExtractor.URL_PATTERN) || [];
    const xhsUrls = urls.filter((url) =>
      URLExtractor.XHS_DOMAIN_PATTERN.test(url)
    );

    if (xhsUrls.length === 0) {
      if (urls.length > 0) {
        // Found URLs but none are Xiaohongshu
        return this.createError(
          'NON_XIAOHONGSHU_URL',
          input,
          startTime,
          urls.length,
          0,
          false
        );
      }
      // No URLs found at all
      return this.createError(
        'NO_URL_FOUND',
        input,
        startTime,
        0,
        0,
        false
      );
    }

    // Validate extracted URL
    const extractedUrl = xhsUrls[0]; // First XHS URL
    if (!this.validateExtractedUrl(extractedUrl)) {
      return this.createError(
        'INVALID_URL',
        input,
        startTime,
        urls.length,
        xhsUrls.length,
        false
      );
    }

    return this.createSuccess(
      extractedUrl,
      input,
      'regex',
      startTime,
      urls.length,
      xhsUrls.length
    );
  }

  /**
   * Validate input text meets requirements
   */
  private validateInput(input: string): boolean {
    if (!input || input.length === 0) return false;
    if (input.length > URLExtractor.MAX_INPUT_LENGTH) return false;
    if (input.trim().length === 0) return false;
    return true;
  }

  /**
   * Check if input is a clean URL (starts with http:// or https:// and has no trailing text)
   */
  private isCleanUrl(input: string): boolean {
    const trimmed = input.trim();

    // Must start with http:// or https://
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      return false;
    }

    // Check if there's whitespace in the middle (indicates trailing text)
    // A clean URL should not have spaces or Chinese punctuation
    const hasWhitespace = /[\s\u3000-\u303F\uFF00-\uFFEF]/.test(trimmed);
    return !hasWhitespace;
  }

  /**
   * Validate extracted URL format and domain
   */
  private validateExtractedUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);

      // Check protocol
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return false;
      }

      // Check domain
      const domain = urlObj.hostname.toLowerCase();
      if (
        !domain.includes('xiaohongshu.com') &&
        !domain.includes('xhslink.com')
      ) {
        return false;
      }

      return true;
    } catch {
      return false; // Malformed URL
    }
  }

  /**
   * Create success result for extraction
   */
  private createSuccess(
    extractedUrl: string,
    originalInput: string,
    method: ExtractionMethod,
    startTime: number,
    urlsFound: number,
    xhsUrlsFound: number
  ): ExtractionResult {
    const extractionTimeMs = Date.now() - startTime;

    return {
      success: true,
      extractedUrl,
      originalInput,
      extractionMethod: method,
      extractionTimeMs,
      metadata: this.createMetadata(
        originalInput,
        urlsFound,
        xhsUrlsFound,
        false
      ),
    };
  }

  /**
   * Create passthrough result for clean URLs
   */
  private createPassthrough(
    cleanUrl: string,
    startTime: number
  ): ExtractionResult {
    const extractionTimeMs = Date.now() - startTime;

    return {
      success: true,
      extractedUrl: cleanUrl.trim(),
      originalInput: cleanUrl,
      extractionMethod: 'passthrough',
      extractionTimeMs,
      metadata: this.createMetadata(cleanUrl, 1, 1, false),
    };
  }

  /**
   * Create error result for extraction failure
   */
  private createError(
    code: ExtractionErrorCode,
    originalInput: string,
    startTime: number,
    urlsFound: number,
    xhsUrlsFound: number,
    aiAttempted: boolean
  ): ExtractionResult {
    const extractionTimeMs = Date.now() - startTime;

    return {
      success: false,
      originalInput,
      extractionMethod: aiAttempted ? 'ai' : 'regex',
      extractionTimeMs,
      error: this.createErrorDetails(code),
      metadata: this.createMetadata(
        originalInput,
        urlsFound,
        xhsUrlsFound,
        aiAttempted
      ),
    };
  }

  /**
   * Create error details with message and hint
   */
  private createErrorDetails(code: ExtractionErrorCode): ExtractionError {
    const errorMessages: Record<
      ExtractionErrorCode,
      { message: string; hint: string }
    > = {
      NO_URL_FOUND: {
        message: 'No valid URL found in the provided text',
        hint: 'Please check the share text format and ensure it contains a Xiaohongshu URL',
      },
      INVALID_URL: {
        message: 'The extracted URL is not valid',
        hint: 'Ensure the URL starts with http:// or https://',
      },
      NON_XIAOHONGSHU_URL: {
        message: 'The URL is not from Xiaohongshu platform',
        hint: 'Only xiaohongshu.com and xhslink.com URLs are supported',
      },
      EXTRACTION_FAILED: {
        message: 'An error occurred during URL extraction',
        hint: 'Please try again or contact support if the issue persists',
      },
    };

    const { message, hint } = errorMessages[code];
    return { code, message, hint };
  }

  /**
   * Create extraction metadata for observability
   */
  private createMetadata(
    originalInput: string,
    urlsFound: number,
    xhsUrlsFound: number,
    aiAttempted: boolean
  ): ExtractionMetadata {
    return {
      inputLength: originalInput.length,
      urlsFound,
      xhsUrlsFound,
      aiAttempted,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Singleton instance for use across the application
 */
export const urlExtractor = new URLExtractor();
