/**
 * URL Extraction Types
 *
 * Types for extracting Xiaohongshu URLs from share text.
 * Integrates with existing parser infrastructure.
 */

/**
 * Primary result of URL extraction
 */
export interface ExtractionResult {
  /** Whether extraction succeeded */
  success: boolean;

  /** The extracted clean URL (only present if success=true) */
  extractedUrl?: string;

  /** Original input text for logging/debugging */
  originalInput: string;

  /** Method used for extraction (for monitoring) */
  extractionMethod: ExtractionMethod;

  /** Time taken for extraction in milliseconds */
  extractionTimeMs: number;

  /** Error details (only present if success=false) */
  error?: ExtractionError;

  /** Metadata for observability */
  metadata: ExtractionMetadata;
}

/**
 * Extraction method used
 */
export type ExtractionMethod = 'passthrough' | 'regex' | 'ai';

/**
 * Structured extraction error
 */
export interface ExtractionError {
  /** Machine-readable error code for monitoring */
  code: ExtractionErrorCode;

  /** Human-readable error message */
  message: string;

  /** Actionable hint for user to fix the issue */
  hint: string;
}

/**
 * Extraction error codes
 */
export type ExtractionErrorCode =
  | 'NO_URL_FOUND'
  | 'INVALID_URL'
  | 'NON_XIAOHONGSHU_URL'
  | 'EXTRACTION_FAILED';

/**
 * Metadata for observability
 */
export interface ExtractionMetadata {
  /** Length of input text in characters */
  inputLength: number;

  /** Number of URLs found in the input */
  urlsFound: number;

  /** Number of Xiaohongshu URLs found */
  xhsUrlsFound: number;

  /** Whether AI fallback was attempted */
  aiAttempted: boolean;

  /** ISO 8601 timestamp of extraction attempt */
  timestamp: string;
}

/**
 * Configuration options for extraction
 */
export interface ExtractionOptions {
  /** Enable AI fallback if regex fails */
  enableAI?: boolean;

  /** Maximum time to spend on extraction (ms) */
  timeoutMs?: number;
}
