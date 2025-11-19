/**
 * Bilibili Video Content Extractor
 * Extracts video-specific metadata from Bilibili video pages
 */

import * as cheerio from 'cheerio';
import type { VideoContent } from '@/lib/types';
import type { ContentExtractor } from './base';

export class BilibiliVideoExtractor implements ContentExtractor<VideoContent> {
  extract(html: string, url: string): VideoContent {
    const $ = cheerio.load(html);

    // Extract title
    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('h1[title]').attr('title') ||
      $('title').text().replace(/_哔哩哔哩_bilibili/, '').trim() ||
      'Bilibili视频';

    // Extract cover image
    const cover =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[itemprop="image"]').attr('content');

    // Extract description
    const description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      '';

    // Extract video URL (Bilibili uses player page)
    const videoUrl = url; // Bilibili video page URL

    // Extract duration if available
    const duration = this.extractDuration($);

    // Extract author/uploader
    const author =
      $('meta[name="author"]').attr('content') ||
      $('.up-name').text().trim() ||
      $('.username').text().trim() ||
      undefined;

    // Extract Bilibili-specific metadata
    const metadata = this.extractMetadata($, url);

    return {
      type: 'video',
      title: this.cleanText(title),
      videoUrl,
      cover,
      duration,
      description: this.cleanText(description),
      platform: 'bilibili',
      originalUrl: url,
      author,
      metadata,
    };
  }

  private extractDuration($: cheerio.CheerioAPI): number | undefined {
    // Try to extract from meta tags
    const durationMeta = $('meta[property="video:duration"]').attr('content');
    if (durationMeta) {
      const seconds = parseInt(durationMeta, 10);
      return seconds > 0 ? seconds : undefined;
    }

    // Try to extract from duration display (e.g., "10:30")
    const durationText = $('.duration').text().trim();
    if (durationText) {
      return this.parseDurationText(durationText);
    }

    return undefined;
  }

  private parseDurationText(text: string): number | undefined {
    // Parse format like "10:30" or "1:10:30"
    const parts = text.split(':').map((p) => parseInt(p, 10));

    if (parts.length === 2) {
      // MM:SS
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3) {
      // HH:MM:SS
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }

    return undefined;
  }

  private extractMetadata($: cheerio.CheerioAPI, url: string): Record<string, any> {
    const metadata: Record<string, any> = {};

    // Extract BV ID (Bilibili's video identifier)
    const bvidMatch = url.match(/\/video\/(BV[\w]+)/);
    if (bvidMatch) {
      metadata.bvid = bvidMatch[1];
    }

    // Extract AV ID if present in URL
    const avidMatch = url.match(/av(\d+)/);
    if (avidMatch) {
      metadata.aid = parseInt(avidMatch[1], 10);
    }

    // Try to extract from page data
    const pageData = $('script:contains("window.__INITIAL_STATE__")').html();
    if (pageData) {
      try {
        const stateMatch = pageData.match(/window\.__INITIAL_STATE__=({.+?});/);
        if (stateMatch) {
          const state = JSON.parse(stateMatch[1]);
          if (state.videoData) {
            metadata.aid = state.videoData.aid;
            metadata.cid = state.videoData.cid;
          }
        }
      } catch (error) {
        // Ignore JSON parse errors
      }
    }

    return metadata;
  }

  private cleanText(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }
}
