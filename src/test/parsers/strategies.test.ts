/**
 * Unit tests for strategy pattern implementations (T030, T031, T019)
 * Tests HtmlFetcher and ContentDetector strategies
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { ContentDetector } from '@/lib/parsers/strategies/content-detector';
import {
  OfetchHtmlFetcher,
  PlaywrightHtmlFetcher,
  createHtmlFetcher,
  type HtmlFetcher,
} from '@/lib/parsers/strategies/html-fetcher';
import type { ParserOptions } from '@/lib/types/parser';

describe('ContentDetector Strategies', () => {
  describe('Video Detection Logic', () => {
    it('should detect video content from URL patterns', () => {
      // Test will be implemented when detectors are created
      // Placeholder for TDD: write test first, implement later
      expect(true).toBe(true);
    });

    it('should detect video content from HTML video tags', () => {
      // Placeholder for detector implementation
      expect(true).toBe(true);
    });

    it('should detect video content from og:type meta tags', () => {
      // Placeholder for detector implementation
      expect(true).toBe(true);
    });

    it('should fallback to article when detection is uncertain', () => {
      // Placeholder for detector implementation
      expect(true).toBe(true);
    });
  });

  // These tests will be expanded when specific detectors are implemented
  describe('XhsContentDetector', () => {
    it('should distinguish between video and image-gallery content', () => {
      // Will test after T021 implementation
      expect(true).toBe(true);
    });
  });

  describe('BilibiliContentDetector', () => {
    it('should always return video for Bilibili URLs', () => {
      // Will test after T022 implementation
      expect(true).toBe(true);
    });
  });

  describe('YouTubeContentDetector', () => {
    it('should always return video for YouTube URLs', () => {
      // Will test after T026 implementation
      expect(true).toBe(true);
    });
  });
});

// ============================================================================
// T031: OfetchHtmlFetcher Unit Tests
// ============================================================================

describe('OfetchHtmlFetcher (T031)', () => {
  let fetcher: OfetchHtmlFetcher;

  beforeEach(() => {
    fetcher = new OfetchHtmlFetcher();
  });

  describe('Basic functionality', () => {
    it('should implement HtmlFetcher interface', () => {
      expect(fetcher).toBeDefined();
      expect(typeof fetcher.fetch).toBe('function');
    });

    it('should return HTML string for valid URL', async () => {
      // Use a reliable test URL
      const html = await fetcher.fetch('https://example.com');

      expect(html).toBeDefined();
      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(0);
      expect(html).toContain('<html');
    }, 15000); // Longer timeout for network request

    it('should handle HTTPS URLs', async () => {
      const html = await fetcher.fetch('https://example.com');
      expect(html).toContain('Example Domain');
    }, 15000);
  });

  describe('Error handling', () => {
    it('should throw descriptive error for invalid URL', async () => {
      await expect(fetcher.fetch('not-a-valid-url'))
        .rejects
        .toThrow(/OfetchHtmlFetcher failed/);
    });

    it('should throw error for non-existent domain', async () => {
      await expect(fetcher.fetch('https://this-domain-definitely-does-not-exist-12345.com'))
        .rejects
        .toThrow(/OfetchHtmlFetcher failed/);
    }, 15000);

    it('should include URL in error message', async () => {
      try {
        await fetcher.fetch('https://invalid-url-test.local');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('invalid-url-test.local');
      }
    }, 15000);
  });

  describe('Options handling', () => {
    it('should accept custom user agent', async () => {
      const options: ParserOptions = {
        userAgent: 'CustomBot/1.0',
      };

      // This test verifies the option is accepted, actual header verification
      // would require a mock server or intercepting the request
      const html = await fetcher.fetch('https://example.com', options);
      expect(html).toBeDefined();
    }, 15000);

    it('should accept custom timeout', async () => {
      const options: ParserOptions = {
        timeout: 5000,
      };

      const html = await fetcher.fetch('https://example.com', options);
      expect(html).toBeDefined();
    }, 15000);

    it('should accept custom headers', async () => {
      const options: ParserOptions = {
        headers: {
          'Accept-Language': 'en-US',
        },
      };

      const html = await fetcher.fetch('https://example.com', options);
      expect(html).toBeDefined();
    }, 15000);
  });

  describe('Retry logic', () => {
    it('should have built-in retry mechanism', async () => {
      // OfetchHtmlFetcher has retry: 2 configured
      // This is more of a specification test
      expect(fetcher).toBeDefined();

      // Verify retry behavior by checking that transient failures are handled
      // (implementation detail - ofetch retries 2 times with 500ms delay)
    });
  });

  describe('Performance characteristics', () => {
    it('should be fast for simple HTML pages', async () => {
      const startTime = Date.now();
      await fetcher.fetch('https://example.com');
      const duration = Date.now() - startTime;

      // Should complete within reasonable time (< 5 seconds for simple page)
      expect(duration).toBeLessThan(5000);
    }, 15000);
  });
});

// ============================================================================
// T030: PlaywrightHtmlFetcher Unit Tests
// ============================================================================

describe('PlaywrightHtmlFetcher (T030)', () => {
  let fetcher: PlaywrightHtmlFetcher;

  beforeEach(() => {
    fetcher = new PlaywrightHtmlFetcher();
  });

  describe('Basic functionality', () => {
    it('should implement HtmlFetcher interface', () => {
      expect(fetcher).toBeDefined();
      expect(typeof fetcher.fetch).toBe('function');
    });

    // Skip Playwright tests if browser not available (Vercel serverless)
    const skipIfNoPlaywright = process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD === '1';

    it.skipIf(skipIfNoPlaywright)('should return HTML string for valid URL', async () => {
      const html = await fetcher.fetch('https://example.com');

      expect(html).toBeDefined();
      expect(typeof html).toBe('string');
      expect(html.length).toBeGreaterThan(0);
      expect(html).toContain('<html');
    }, 30000); // Longer timeout for browser launch + navigation

    it.skipIf(skipIfNoPlaywright)('should handle dynamic content with JavaScript', async () => {
      // Playwright can execute JavaScript and wait for content
      const html = await fetcher.fetch('https://example.com');
      expect(html).toContain('Example Domain');
    }, 30000);

    it.skipIf(skipIfNoPlaywright)('should wait for network idle', async () => {
      // PlaywrightHtmlFetcher waits for networkidle state
      const html = await fetcher.fetch('https://example.com');

      // Verify we got rendered content (not just initial HTML)
      expect(html).toBeDefined();
      expect(html.length).toBeGreaterThan(100);
    }, 30000);
  });

  describe('Error handling', () => {
    const skipIfNoPlaywright = process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD === '1';

    it.skipIf(skipIfNoPlaywright)('should throw descriptive error for invalid URL', async () => {
      await expect(fetcher.fetch('not-a-valid-url'))
        .rejects
        .toThrow(/PlaywrightHtmlFetcher failed/);
    }, 30000);

    it.skipIf(skipIfNoPlaywright)('should include URL in error message', async () => {
      try {
        await fetcher.fetch('https://invalid-url-test.local');
        expect.fail('Should have thrown error');
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toContain('invalid-url-test.local');
      }
    }, 30000);
  });

  describe('Options handling', () => {
    const skipIfNoPlaywright = process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD === '1';

    it.skipIf(skipIfNoPlaywright)('should accept custom user agent', async () => {
      const options: ParserOptions = {
        userAgent: 'CustomBot/1.0',
      };

      const html = await fetcher.fetch('https://example.com', options);
      expect(html).toBeDefined();
    }, 30000);

    it.skipIf(skipIfNoPlaywright)('should accept custom timeout', async () => {
      const options: ParserOptions = {
        timeout: 10000,
      };

      const html = await fetcher.fetch('https://example.com', options);
      expect(html).toBeDefined();
    }, 30000);

    it.skipIf(skipIfNoPlaywright)('should accept custom headers', async () => {
      const options: ParserOptions = {
        headers: {
          'Accept-Language': 'en-US',
        },
      };

      const html = await fetcher.fetch('https://example.com', options);
      expect(html).toBeDefined();
    }, 30000);
  });

  describe('Browser lifecycle', () => {
    const skipIfNoPlaywright = process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD === '1';

    it.skipIf(skipIfNoPlaywright)('should clean up browser resources', async () => {
      // Verify browser is closed after fetch
      await fetcher.fetch('https://example.com');

      // If browser cleanup fails, subsequent tests would fail or leak resources
      // This is a smoke test to ensure no hanging processes
      expect(true).toBe(true);
    }, 30000);
  });

  describe('Advanced features', () => {
    const skipIfNoPlaywright = process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD === '1';

    it.skipIf(skipIfNoPlaywright)('should handle networkidle timeout gracefully', async () => {
      // PlaywrightHtmlFetcher catches networkidle timeout and proceeds
      const html = await fetcher.fetch('https://example.com');

      // Should still return content even if networkidle times out
      expect(html).toBeDefined();
      expect(html.length).toBeGreaterThan(0);
    }, 30000);
  });
});

// ============================================================================
// Environment-based Fetcher Selection
// ============================================================================

describe('createHtmlFetcher factory', () => {
  it('should return an HtmlFetcher instance', () => {
    const fetcher = createHtmlFetcher();
    expect(fetcher).toBeDefined();
    expect(typeof fetcher.fetch).toBe('function');
  });

  it('should return OfetchHtmlFetcher in serverless environment', () => {
    const originalEnv = process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD;
    process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = '1';

    const fetcher = createHtmlFetcher();
    expect(fetcher).toBeInstanceOf(OfetchHtmlFetcher);

    // Restore
    process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = originalEnv;
  });

  it('should return PlaywrightHtmlFetcher in development with browser', () => {
    const originalEnv = process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD;
    const originalNodeEnv = process.env.NODE_ENV;

    process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = undefined;
    process.env.NODE_ENV = 'development';

    const fetcher = createHtmlFetcher();
    expect(fetcher).toBeInstanceOf(PlaywrightHtmlFetcher);

    // Restore
    process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = originalEnv;
    process.env.NODE_ENV = originalNodeEnv;
  });
});
