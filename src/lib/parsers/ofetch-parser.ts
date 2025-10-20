import { ofetch } from 'ofetch';
import * as cheerio from 'cheerio';
import { AbstractBaseParser } from './base';
import { ParsedContent, ParserOptions, PlatformType } from '../types/parser';

export class OfetchParser extends AbstractBaseParser {
  platform: PlatformType = 'unknown';

  canParse(_url: string): boolean {
    // ofetch解析器可以作为通用解析器
    return true;
  }

  async parse(url: string, options?: ParserOptions): Promise<ParsedContent> {
    const opts = this.mergeOptions(options);
    
    try {
      // 使用ofetch获取HTML内容
      const html = await ofetch(url, {
        timeout: opts.timeout,
        headers: opts.headers,
        retry: 2,
        retryDelay: 1000,
      });

      // 使用cheerio解析HTML
      const $ = cheerio.load(html);
      
      // 提取基础内容
      const content = this.extractContent($, url);
      
      return content;
    } catch (error) {
      throw new Error(`OfetchParser failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private extractContent($: cheerio.CheerioAPI, originalUrl: string): ParsedContent {
    // 提取标题
    const title = this.extractTitle($);
    
    // 提取正文内容
    const content = this.extractMainContent($);
    
    // 提取图片
    const images = this.extractImages($);
    
    // 提取作者信息
    const author = this.extractAuthor($);
    
    // 提取发布时间
    const publishedAt = this.extractPublishDate($);

    return {
      title: this.cleanText(title),
      content: this.cleanText(content),
      images: this.filterImages(images),
      author: author ? this.cleanText(author) : undefined,
      publishedAt,
      platform: this.platform,
      originalUrl,
    };
  }

  private extractTitle($: cheerio.CheerioAPI): string {
    // 优先级顺序获取标题
    const titleSelectors = [
      'meta[property="og:title"]',
      'meta[name="twitter:title"]',
      'title',
      'h1',
      '.title',
      '.post-title',
      '.article-title'
    ];

    for (const selector of titleSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const title = selector.includes('meta') 
          ? element.attr('content') 
          : element.text();
        if (title && title.trim()) {
          return title.trim();
        }
      }
    }

    return '未知标题';
  }

  private extractMainContent($: cheerio.CheerioAPI): string {
    // 移除不需要的元素
    $('script, style, nav, header, footer, .ads, .advertisement').remove();
    
    // 常见的内容选择器
    const contentSelectors = [
      '.content',
      '.post-content',
      '.article-content',
      '.entry-content',
      '.main-content',
      'article',
      '.post-body',
      '.text-content'
    ];

    for (const selector of contentSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const text = element.text();
        if (text && text.trim().length > 50) {
          return text.trim();
        }
      }
    }

    // 如果没有找到特定的内容区域，尝试从body中提取
    const bodyText = $('body').text();
    if (bodyText && bodyText.trim().length > 100) {
      // 简单的内容清理和截取
      return bodyText.trim().substring(0, 2000);
    }

    return '无法提取内容';
  }

  private extractImages($: cheerio.CheerioAPI): string[] {
    const images: string[] = [];
    
    // Open Graph 图片
    $('meta[property="og:image"]').each((_, el) => {
      const content = $(el).attr('content');
      if (content) images.push(content);
    });

    // Twitter Card 图片
    $('meta[name="twitter:image"]').each((_, el) => {
      const content = $(el).attr('content');
      if (content) images.push(content);
    });

    // 内容中的图片
    $('img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src) {
        // 处理相对路径
        try {
          const url = new URL(src, window.location?.href || 'https://example.com');
          images.push(url.href);
        } catch {
          if (src.startsWith('http')) {
            images.push(src);
          }
        }
      }
    });

    // 去重并返回
    return [...new Set(images)];
  }

  private extractAuthor($: cheerio.CheerioAPI): string | undefined {
    const authorSelectors = [
      'meta[name="author"]',
      'meta[property="article:author"]',
      '.author',
      '.byline',
      '.post-author',
      '.author-name'
    ];

    for (const selector of authorSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const author = selector.includes('meta') 
          ? element.attr('content') 
          : element.text();
        if (author && author.trim()) {
          return author.trim();
        }
      }
    }

    return undefined;
  }

  private extractPublishDate($: cheerio.CheerioAPI): Date | undefined {
    const dateSelectors = [
      'meta[property="article:published_time"]',
      'meta[name="publish_date"]',
      'time[datetime]',
      '.publish-date',
      '.post-date',
      '.date'
    ];

    for (const selector of dateSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const dateStr = selector.includes('meta') 
          ? element.attr('content')
          : selector === 'time[datetime]'
            ? element.attr('datetime')
            : element.text();
        
        if (dateStr) {
          const date = new Date(dateStr);
          if (!isNaN(date.getTime())) {
            return date;
          }
        }
      }
    }

    return undefined;
  }
}