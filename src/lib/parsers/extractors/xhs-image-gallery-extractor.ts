/**
 * Xiaohongshu Image Gallery Extractor
 *
 * Extracts image-gallery content from Xiaohongshu HTML.
 * Handles image-focused posts with descriptions (similar to Instagram posts).
 */

import * as cheerio from 'cheerio';
import type { ContentExtractor } from './base';
import type { ImageGalleryContent } from '@/lib/types/content';

export class XhsImageGalleryExtractor implements ContentExtractor<ImageGalleryContent> {
  extract(html: string, url: string): ImageGalleryContent {
    const $ = cheerio.load(html);

    return {
      type: 'image-gallery' as const,
      title: this.extractTitle($),
      images: this.extractImages($),
      description: this.extractDescription($),
      platform: 'xiaohongshu',
      originalUrl: url,
      author: this.extractAuthor($),
      publishedAt: new Date(), // XHS date extraction is complex, use current time
    };
  }

  private extractTitle($: cheerio.CheerioAPI): string {
    const selectors = [
      'meta[property="og:title"]',
      'title',
      '.note-title',
      '.title',
      '.desc',
      '.content',
      '.note-content'
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        let title = selector.includes('meta')
          ? element.attr('content')
          : element.text();

        if (title && title.trim()) {
          title = title.trim();
          if (title.length > 50) {
            title = title.substring(0, 50) + '...';
          }
          if (!title.includes('小红书') || title.length > 10) {
            return this.cleanText(title);
          }
        }
      }
    }

    return '小红书图集';
  }

  private extractDescription($: cheerio.CheerioAPI): string {
    $('script, style, nav, header, footer, .sidebar, .related').remove();

    const selectors = [
      '.note-content',
      '.content',
      '.desc',
      '.text-content',
      '[data-v-] .content',
      '[data-v-] .desc',
      '.post-content'
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        let text = element.text().trim();
        if (text && text.length > 10) {
          text = text
            .replace(/分享图片|分享视频|小红书|App|点赞|收藏|评论|关注/g, '')
            .replace(/\s+/g, ' ')
            .trim();

          if (text.length > 10) {
            return this.cleanText(text);
          }
        }
      }
    }

    // Check for login/error pages
    const allText = $('body').text().trim();

    if (allText.includes('请先登录') ||
        allText.includes('需要登录') ||
        allText.includes('登录小红书')) {
      return '该内容需要登录小红书才能访问';
    }

    if (allText.includes('你访问的页面不见了') ||
        allText.includes('页面不存在') ||
        allText.includes('内容已删除')) {
      return '该小红书笔记已不存在或已被删除';
    }

    // Fallback: use cleaned body text
    if (allText.length > 20) {
      const cleanedText = allText
        .replace(/分享图片|分享视频|小红书|App|点赞|收藏|评论|关注|返回上一页/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (cleanedText.length > 10) {
        return cleanedText.substring(0, 300);
      }
    }

    return '小红书图集';
  }

  private extractImages($: cheerio.CheerioAPI): string[] {
    const images: string[] = [];

    // Extract Open Graph images (usually complete content image list)
    const ogImages: string[] = [];
    $('meta[property="og:image"]').each((_, el) => {
      const content = $(el).attr('content');
      if (content) {
        ogImages.push(content);
      }
    });

    ogImages.forEach(ogImg => {
      if (this.isContentImage(ogImg)) {
        images.push(this.normalizeImageUrl(ogImg));
      }
    });

    // If we have enough og:images, prioritize them
    if (images.length >= 3) {
      return [...new Set(images)].slice(0, 9);
    }

    // Extract images from swiper-slide (note content images)
    $('.swiper-slide img').each((_, el) => {
      const $img = $(el);
      const src = $img.attr('src')
        || $img.attr('data-src')
        || $img.attr('data-original')
        || $img.attr('data-lazy-src');

      if (src && this.isContentImage(src)) {
        const normalized = this.normalizeImageUrl(src);
        if (!images.includes(normalized)) {
          images.push(normalized);
        }
      }
    });

    // Additional image sources
    $('.note-slider-img, .img-container img').each((_, el) => {
      const $img = $(el);
      const src = $img.attr('src') || $img.attr('data-src');

      if (src && this.isContentImage(src)) {
        const normalized = this.normalizeImageUrl(src);
        if (!images.includes(normalized)) {
          images.push(normalized);
        }
      }
    });

    // Images with "sns-webpic" (common XHS content images)
    $('img[src*="sns-webpic"], img[src*="webpic-qc"]').each((_, el) => {
      const $img = $(el);
      const src = $img.attr('src');

      if (src && this.isContentImage(src)) {
        const normalized = this.normalizeImageUrl(src);
        if (!images.includes(normalized)) {
          images.push(normalized);
        }
      }
    });

    // All xiaohongshu domain images as fallback
    $('img').each((_, el) => {
      const $img = $(el);
      const src = $img.attr('src') || $img.attr('data-src');

      if (src && (src.includes('xiaohongshu') || src.includes('xhscdn') || src.includes('sns-webpic'))) {
        if (this.isContentImage(src)) {
          const normalized = this.normalizeImageUrl(src);
          if (!images.includes(normalized)) {
            images.push(normalized);
          }
        }
      }
    });

    // For image-gallery, we need at least 1 image
    // If no images found, return empty array and let caller handle it
    return [...new Set(images)].slice(0, 9);
  }

  private extractAuthor($: cheerio.CheerioAPI): string | undefined {
    const selectors = [
      '.author-name',
      '.username',
      '.user-name',
      '.nickname',
      '[data-v-] .author',
      '[data-v-] .username',
      'meta[name="author"]'
    ];

    for (const selector of selectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const author = selector.includes('meta')
          ? element.attr('content')
          : element.text().trim();

        if (author && author.length > 0 && author.length < 50) {
          if (!author.includes('小红书') && author !== '用户') {
            return this.cleanText(author);
          }
        }
      }
    }

    return undefined;
  }

  private isContentImage(url: string): boolean {
    if (!url) return false;

    // Must be from xiaohongshu domains
    if (!url.includes('xiaohongshu')
      && !url.includes('xhscdn')
      && !url.includes('sns-webpic')
      && !url.includes('picasso-static')) {
      return false;
    }

    // Filter out avatars, icons, logos
    if (url.includes('avatar')
      || url.includes('icon')
      || url.includes('logo')
      || url.includes('/40/')
      || url.includes('/32/')
      || url.includes('/48/')
      || url.match(/\/(16|24|32|40|48)x\1/)) {
      return false;
    }

    return true;
  }

  private normalizeImageUrl(url: string): string {
    if (!url) return '';

    try {
      if (url.startsWith('//')) {
        return 'https:' + url;
      } else if (url.startsWith('/')) {
        return 'https://xiaohongshu.com' + url;
      }
      return url;
    } catch {
      return url;
    }
  }

  private cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  }
}
