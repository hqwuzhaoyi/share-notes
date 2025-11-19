/**
 * YouTube Parser
 * Demonstrates new architecture pattern with strategy composition
 * Target: Under 100 lines of code (excluding extractors)
 */

import { BaseParser } from '@/lib/types/parser';
import type { ParserOptions } from '@/lib/types/parser';
import type { VideoContent } from '@/lib/types';
import { OfetchHtmlFetcher } from './strategies/html-fetcher';
import { YouTubeContentDetector } from './strategies/content-detector';
import { YouTubeVideoExtractor } from './extractors/youtube-video-extractor';

export class YouTubeParser extends BaseParser {
  platform = 'youtube' as const;
  supportedContentTypes = ['video'] as const;

  // Strategy composition
  private htmlFetcher = new OfetchHtmlFetcher();
  private contentDetector = new YouTubeContentDetector();
  private extractor = new YouTubeVideoExtractor();

  canParse(url: string): boolean {
    return /youtube\.com|youtu\.be/i.test(url);
  }

  async parse(url: string, options?: ParserOptions): Promise<VideoContent> {
    // Use preloaded HTML if available (iOS shortcut optimization)
    const html = options?.preloadedHtml || (await this.htmlFetcher.fetch(url, options));

    // Extract content using video extractor
    return this.extractor.extract(html, url);
  }
}
