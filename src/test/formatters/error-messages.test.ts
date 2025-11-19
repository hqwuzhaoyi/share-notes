/**
 * Error Message Validation Tests
 *
 * Verifies FR-011, FR-012, SC-005: Error messages are actionable and helpful.
 * Tests that errors guide developers toward resolution.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { formatterRegistry } from '../../lib/formatters/formatter-registry';
import { BaseOutputFormatter, FormatterError, type PlatformCapabilities, type FormattedOutput, type FormatterResult, Ok, Err } from '../../lib/types/formatter';
import type { ParsedContent } from '../../lib/types/parser';

// Mock formatter for testing
class MockFormatter extends BaseOutputFormatter {
  constructor(public readonly capabilities: PlatformCapabilities) {
    super();
  }

  format(content: ParsedContent): FormatterResult<FormattedOutput> {
    return Ok({
      type: 'raw_content',
      value: JSON.stringify(content)
    });
  }
}

describe('Error Message Validation', () => {
  beforeEach(() => {
    // Clear registry before each test
    formatterRegistry.clear();
  });

  describe('FR-011: Unknown platform error messages', () => {
    it('provides actionable error with available platforms', () => {
      // Register some formatters
      formatterRegistry.register('flomo', new MockFormatter({
        supportsImages: true,
        supportsDirectCreate: true,
        maxContentLength: 50000
      }));
      formatterRegistry.register('notes', new MockFormatter({
        supportsImages: false,
        supportsDirectCreate: false,
        maxContentLength: 30000
      }));

      // Try to get unknown platform
      expect(() => formatterRegistry.get('notion')).toThrow(
        /Unknown platform "notion"\. Available: flomo, notes/
      );
    });

    it('error message helps user discover correct platform names', () => {
      formatterRegistry.register('flomo', new MockFormatter({
        supportsImages: true,
        supportsDirectCreate: true
      }));

      try {
        formatterRegistry.get('flomooo'); // Typo
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error instanceof Error).toBe(true);
        expect((error as Error).message).toContain('Unknown platform "flomooo"');
        expect((error as Error).message).toContain('Available: flomo');
      }
    });
  });

  describe('FR-012: Exception wrapping in FormatterError', () => {
    it('wraps underlying exceptions with context', () => {
      const originalError = new Error('Network timeout');
      const formatterError = new FormatterError(
        'FORMATTING_FAILED',
        'Failed to format content for Flomo',
        originalError
      );

      expect(formatterError.code).toBe('FORMATTING_FAILED');
      expect(formatterError.message).toBe('Failed to format content for Flomo');
      expect(formatterError.cause).toBe(originalError);
      expect(formatterError.name).toBe('FormatterError');
    });

    it('preserves stack trace for debugging', () => {
      const error = new FormatterError(
        'URL_ENCODING_ERROR',
        'Failed to encode URL'
      );

      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('FormatterError');
    });

    it('provides machine-readable error codes', () => {
      const errorCodes: Array<[string, string]> = [
        ['FORMATTING_FAILED', 'General formatting error'],
        ['INVALID_CONTENT', 'Content validation failed'],
        ['UNSUPPORTED_FEATURE', 'Feature not supported'],
        ['URL_ENCODING_ERROR', 'URL encoding failed']
      ];

      errorCodes.forEach(([code, description]) => {
        const error = new FormatterError(
          code as any,
          description
        );
        expect(error.code).toBe(code);
        expect(error.message).toBe(description);
      });
    });
  });

  describe('SC-005: Malformed registration error messages', () => {
    it('rejects empty platform name with clear error', () => {
      expect(() =>
        formatterRegistry.register('', new MockFormatter({
          supportsImages: true,
          supportsDirectCreate: true
        }))
      ).toThrow(/Invalid platform: must be non-empty string/);
    });

    it('rejects invalid platform type with clear error', () => {
      expect(() =>
        formatterRegistry.register(null as any, new MockFormatter({
          supportsImages: true,
          supportsDirectCreate: true
        }))
      ).toThrow(/Invalid platform: must be non-empty string/);
    });

    it('rejects formatter without capabilities', () => {
      const badFormatter = {} as BaseOutputFormatter;
      expect(() =>
        formatterRegistry.register('bad', badFormatter)
      ).toThrow(/Invalid formatter for "bad": must have capabilities/);
    });

    it('rejects non-boolean supportsImages with type info', () => {
      const badFormatter = new MockFormatter({
        supportsImages: 'yes' as any,
        supportsDirectCreate: true
      });

      expect(() =>
        formatterRegistry.register('bad', badFormatter)
      ).toThrow(/bad: supportsImages must be boolean, got string/);
    });

    it('rejects non-boolean supportsDirectCreate with type info', () => {
      const badFormatter = new MockFormatter({
        supportsImages: true,
        supportsDirectCreate: 1 as any
      });

      expect(() =>
        formatterRegistry.register('bad', badFormatter)
      ).toThrow(/bad: supportsDirectCreate must be boolean, got number/);
    });

    it('rejects negative maxContentLength with clear error', () => {
      const badFormatter = new MockFormatter({
        supportsImages: true,
        supportsDirectCreate: true,
        maxContentLength: -100
      });

      expect(() =>
        formatterRegistry.register('bad', badFormatter)
      ).toThrow(/bad: maxContentLength must be positive number, got -100/);
    });

    it('rejects zero maxContentLength', () => {
      const badFormatter = new MockFormatter({
        supportsImages: true,
        supportsDirectCreate: true,
        maxContentLength: 0
      });

      expect(() =>
        formatterRegistry.register('bad', badFormatter)
      ).toThrow(/bad: maxContentLength must be positive number, got 0/);
    });

    it('accepts undefined maxContentLength (no limit)', () => {
      const validFormatter = new MockFormatter({
        supportsImages: true,
        supportsDirectCreate: true,
        maxContentLength: undefined
      });

      expect(() =>
        formatterRegistry.register('valid', validFormatter)
      ).not.toThrow();
    });
  });

  describe('Result type error handling', () => {
    it('Ok helper creates success result', () => {
      const result = Ok({ test: 'data' });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({ test: 'data' });
      }
    });

    it('Err helper creates error result with code', () => {
      const result = Err('INVALID_CONTENT', 'Content is empty');
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.code).toBe('INVALID_CONTENT');
        expect(result.error.message).toBe('Content is empty');
      }
    });

    it('Err helper preserves cause for debugging', () => {
      const originalError = new Error('Database error');
      const result = Err('FORMATTING_FAILED', 'Failed to save', originalError);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.cause).toBe(originalError);
      }
    });
  });
});
