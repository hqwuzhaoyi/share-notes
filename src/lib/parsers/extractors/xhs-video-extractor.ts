/**
 * Xiaohongshu Video Content Extractor
 * Extracts video-specific metadata from Xiaohongshu video pages
 */

import * as cheerio from 'cheerio';
import type { VideoContent } from '@/lib/types';
import type { ContentExtractor } from './base';

export class XhsVideoExtractor implements ContentExtractor<VideoContent> {
  extract(html: string, url: string): VideoContent {
    const $ = cheerio.load(html);

    // Extract note ID from URL
    const noteId = this.extractNoteId(url);

    // Extract basic metadata
    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('title').text() ||
      '小红书视频';

    const cover =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content');

    const description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      '';

    // Try to extract video URL from various sources
    const videoUrl = this.extractVideoUrl($, url);

    // Try to extract duration if available
    const duration = this.extractDuration($);

    // Extract author information
    const author =
      $('meta[name="author"]').attr('content') ||
      $('.author-name').text().trim() ||
      undefined;

    return {
      type: 'video',
      title: this.cleanText(title),
      videoUrl,
      cover,
      duration,
      description: this.cleanText(description),
      platform: 'xiaohongshu',
      originalUrl: url,
      author,
      metadata: {
        noteId,
      },
    };
  }

  private extractNoteId(url: string): string {
    const match = url.match(/\/explore\/([a-f0-9]+)/i);
    return match ? match[1] : '';
  }

  private extractVideoUrl($: cheerio.CheerioAPI, fallbackUrl: string): string {
    // Try to find video URL in various places
    const videoSrc =
      $('video source').attr('src') ||
      $('video').attr('src') ||
      $('meta[property="og:video"]').attr('content');

    // If no direct video URL found, return the page URL
    // (some platforms require authentication or use streaming)
    return videoSrc || fallbackUrl;
  }

  private extractDuration($: cheerio.CheerioAPI): number | undefined {
    // Try to extract duration from meta tags or video element
    const durationMeta = $('meta[property="video:duration"]').attr('content');
    if (durationMeta) {
      const seconds = parseInt(durationMeta, 10);
      return seconds > 0 ? seconds : undefined;
    }

    const videoDuration = $('video').attr('duration');
    if (videoDuration) {
      const seconds = parseFloat(videoDuration);
      return seconds > 0 ? seconds : undefined;
    }

    return undefined;
  }

  private cleanText(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }
}
