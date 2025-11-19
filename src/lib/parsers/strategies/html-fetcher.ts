/**
 * HTML Fetching Strategy Pattern
 *
 * Provides abstract interface for fetching HTML content with different methods.
 * Implementations handle serverless (ofetch) vs browser automation (Playwright).
 *
 * @see specs/003-parser-architecture-refactor/data-model.md
 */

import { ofetch } from 'ofetch';
import type { ParserOptions } from '@/lib/types/parser';

/**
 * Abstract interface for HTML fetching strategies
 * Allows parsers to compose different fetching methods
 */
export interface HtmlFetcher {
  /**
   * Fetch HTML content from URL
   * @param url - Target URL to fetch
   * @param options - Parser options (timeout, headers, etc.)
   * @returns HTML content as string
   * @throws Error with descriptive message on network/timeout/HTTP errors
   */
  fetch(url: string, options?: ParserOptions): Promise<string>;
}

/**
 * Ofetch-based HTML fetcher
 * Fast, serverless-friendly HTTP client for static content
 * Recommended for: Vercel serverless, API endpoints, static pages
 */
export class OfetchHtmlFetcher implements HtmlFetcher {
  async fetch(url: string, options?: ParserOptions): Promise<string> {
    try {
      const headers: Record<string, string> = {
        'User-Agent':
          options?.userAgent ||
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        ...options?.headers,
      };

      const html = await ofetch<string>(url, {
        headers,
        timeout: options?.timeout || 10000,
        retry: 2,
        retryDelay: 500,
      });

      return html;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`OfetchHtmlFetcher failed for ${url}: ${errorMessage}`);
    }
  }
}

/**
 * Playwright-based HTML fetcher
 * Browser automation for JavaScript-heavy sites and anti-bot protection
 * Recommended for: Dynamic content, SPA pages, sites with bot detection
 *
 * Note: Not available in serverless environments (Vercel)
 * Use environment check before instantiation
 */
export class PlaywrightHtmlFetcher implements HtmlFetcher {
  async fetch(url: string, options?: ParserOptions): Promise<string> {
    try {
      // Dynamic import to avoid bundling in serverless
      const { chromium } = await import('playwright');

      const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const context = await browser.newContext({
        userAgent:
          options?.userAgent ||
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        extraHTTPHeaders: options?.headers || {},
      });

      const page = await context.newPage();

      // Navigate with timeout
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: options?.timeout || 30000,
      });

      // Wait for network idle for dynamic content
      await page.waitForLoadState('networkidle', {
        timeout: 5000,
      }).catch(() => {
        // Network idle timeout is acceptable - proceed with current content
      });

      const html = await page.content();

      await browser.close();

      return html;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`PlaywrightHtmlFetcher failed for ${url}: ${errorMessage}`);
    }
  }
}

/**
 * Environment-based fetcher selection
 * Automatically selects appropriate fetcher based on runtime environment
 *
 * @returns HtmlFetcher implementation suitable for current environment
 */
export function createHtmlFetcher(): HtmlFetcher {
  // Check if Playwright browser is available (not in serverless)
  const hasPlaywright = process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD !== '1';

  if (hasPlaywright && process.env.NODE_ENV === 'development') {
    return new PlaywrightHtmlFetcher();
  }

  return new OfetchHtmlFetcher();
}
