/**
 * YouTube Video Content Extractor
 * Extracts video-specific metadata from YouTube video pages
 */

import * as cheerio from 'cheerio';
import type { VideoContent } from '@/lib/types';
import type { ContentExtractor } from './base';

export class YouTubeVideoExtractor implements ContentExtractor<VideoContent> {
  extract(html: string, url: string): VideoContent {
    const $ = cheerio.load(html);

    // Extract title
    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="title"]').attr('content') ||
      $('title').text().replace(' - YouTube', '').trim() ||
      'YouTube Video';

    // Extract cover/thumbnail
    const cover =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content');

    // Extract description
    const description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      '';

    // Video URL is the page URL (YouTube uses embedded player)
    const videoUrl = url;

    // Extract duration if available
    const duration = this.extractDuration($);

    // Extract author/channel
    const author =
      $('link[itemprop="name"]').attr('content') ||
      $('meta[name="author"]').attr('content') ||
      undefined;

    // Extract video ID and metadata
    const metadata = this.extractMetadata($, url);

    return {
      type: 'video',
      title: this.cleanText(title),
      videoUrl,
      cover,
      duration,
      description: this.cleanText(description),
      platform: 'youtube',
      originalUrl: url,
      author,
      metadata,
    };
  }

  private extractDuration($: cheerio.CheerioAPI): number | undefined {
    // Try to extract from meta tags (ISO 8601 duration format)
    const durationMeta = $('meta[itemprop="duration"]').attr('content');
    if (durationMeta) {
      return this.parseIsoDuration(durationMeta);
    }

    // Try to extract from JSON-LD structured data
    const jsonLdScript = $('script[type="application/ld+json"]').html();
    if (jsonLdScript) {
      try {
        const data = JSON.parse(jsonLdScript);
        if (data.duration) {
          return this.parseIsoDuration(data.duration);
        }
      } catch (error) {
        // Ignore JSON parse errors
      }
    }

    return undefined;
  }

  private parseIsoDuration(isoDuration: string): number | undefined {
    // Parse ISO 8601 duration format (e.g., "PT10M30S" -> 630 seconds)
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return undefined;

    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);

    const totalSeconds = hours * 3600 + minutes * 60 + seconds;
    return totalSeconds > 0 ? totalSeconds : undefined;
  }

  private extractMetadata($: cheerio.CheerioAPI, url: string): Record<string, any> {
    const metadata: Record<string, any> = {};

    // Extract video ID from URL
    const videoId = this.extractVideoId(url);
    if (videoId) {
      metadata.videoId = videoId;
    }

    // Try to extract channel information
    const channelName = $('link[itemprop="name"]').attr('content');
    if (channelName) {
      metadata.channelName = channelName;
    }

    const channelUrl = $('link[itemprop="url"]').attr('href');
    if (channelUrl) {
      const channelIdMatch = channelUrl.match(/\/channel\/([^/]+)/);
      if (channelIdMatch) {
        metadata.channelId = channelIdMatch[1];
      }
    }

    return metadata;
  }

  private extractVideoId(url: string): string {
    // Handle various YouTube URL formats
    // Standard: youtube.com/watch?v=VIDEO_ID
    let match = url.match(/[?&]v=([^&]+)/);
    if (match) return match[1];

    // Short URL: youtu.be/VIDEO_ID
    match = url.match(/youtu\.be\/([^?]+)/);
    if (match) return match[1];

    // Embed URL: youtube.com/embed/VIDEO_ID
    match = url.match(/\/embed\/([^?]+)/);
    if (match) return match[1];

    return '';
  }

  private cleanText(text: string): string {
    return text.replace(/\s+/g, ' ').trim();
  }
}
