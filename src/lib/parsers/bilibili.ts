import { ofetch } from 'ofetch';
import * as cheerio from 'cheerio';
import { AbstractBaseParser } from './base';
import { ParsedContent, ParserOptions } from '../types/parser';

export class BilibiliParser extends AbstractBaseParser {
  platform = 'bilibili' as const;

  canParse(url: string): boolean {
    return /bilibili\.com|b23\.tv|bili\.com/i.test(url);
  }

  async parse(url: string, options?: ParserOptions): Promise<ParsedContent> {
    const opts = this.mergeOptions(options);

    try {
      // 首先尝试解析短链接
      const actualUrl = await this.resolveUrl(url);
      
      // 尝试使用ofetch获取页面
      const html = await ofetch(actualUrl, {
        timeout: opts.timeout,
        headers: {
          ...opts.headers,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Sec-Fetch-Dest': 'document',
          'Sec-Fetch-Mode': 'navigate',
          'Sec-Fetch-Site': 'none',
          'Upgrade-Insecure-Requests': '1',
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        },
        retry: 2,
        retryDelay: 1000,
      });

      const $ = cheerio.load(html);
      return this.extractBilibiliContent($, actualUrl);

    } catch (error) {
      // 如果ofetch失败，尝试使用Playwright
      try {
        const { PlaywrightParser } = await import('./playwright-parser');
        const playwright = new PlaywrightParser();
        playwright.platform = this.platform;
        return await playwright.parse(url, { ...opts, usePlaywright: true });
      } catch (playwrightError) {
        throw new Error(`BilibiliParser failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  private async resolveUrl(url: string): Promise<string> {
    // 如果是短链接，需要解析
    if (url.includes('b23.tv')) {
      try {
        const response = await ofetch(url, {
          redirect: 'manual',
          timeout: 5000
        });
        // 获取重定向地址
        return response.url || url;
      } catch {
        // 如果解析失败，返回原URL
        return url;
      }
    }
    return url;
  }

  private extractBilibiliContent($: cheerio.CheerioAPI, originalUrl: string): ParsedContent {
    // 提取标题
    const title = this.extractBilibiliTitle($);
    
    // 提取内容描述
    const content = this.extractBilibiliDescription($);
    
    // 提取封面图片
    const images = this.extractBilibiliImages($);
    
    // 提取UP主信息
    const author = this.extractBilibiliAuthor($);
    
    // 提取发布时间
    const publishedAt = this.extractBilibiliPublishDate($);

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

  private extractBilibiliTitle($: cheerio.CheerioAPI): string {
    const titleSelectors = [
      // 视频标题
      'h1[title]',
      '.video-title',
      // Meta标签
      'meta[property="og:title"]',
      'meta[name="title"]',
      // 页面标题
      'title',
      // 移动端标题
      '.m-video-info .title'
    ];

    for (const selector of titleSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        let title = '';
        
        if (selector === 'h1[title]') {
          title = element.attr('title') || element.text();
        } else if (selector.includes('meta')) {
          title = element.attr('content') || '';
        } else {
          title = element.text().trim();
        }
        
        if (title) {
          // 清理B站标题
          title = title
            .replace(/^\s*【.*?】\s*/, '') // 移除开头的【标签】
            .replace(/\s*_哔哩哔哩.*$/, '') // 移除B站后缀
            .replace(/\s*-\s*bilibili.*$/, '')
            .trim();
          
          if (title.length > 5) {
            return title;
          }
        }
      }
    }

    return 'B站视频';
  }

  private extractBilibiliDescription($: cheerio.CheerioAPI): string {
    const descSelectors = [
      // 视频简介
      '.video-desc .desc-info',
      '.video-info .desc',
      // Meta描述
      'meta[property="og:description"]',
      'meta[name="description"]',
      // 移动端描述
      '.m-video-info .desc',
      // 动态描述
      '.bili-dyn-content__desc',
      // 备用选择器
      '.desc-info-text',
      '.intro'
    ];

    for (const selector of descSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        let desc = '';
        
        if (selector.includes('meta')) {
          desc = element.attr('content') || '';
        } else {
          desc = element.text().trim();
        }
        
        if (desc && desc.length > 10) {
          return desc.length > 300 ? desc.substring(0, 300) + '...' : desc;
        }
      }
    }

    return '暂无简介';
  }

  private extractBilibiliImages($: cheerio.CheerioAPI): string[] {
    const images: string[] = [];

    // Open Graph图片（视频封面）
    $('meta[property="og:image"]').each((_, el) => {
      const content = $(el).attr('content');
      if (content) images.push(content);
    });

    // 视频封面
    $('.video-cover img, .bili-video-card__cover img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src');
      if (src) images.push(src);
    });

    // 页面中的其他图片
    $('img[src*="bfs.biliimg.com"], img[src*="bilibili.com"]').each((_, el) => {
      const src = $(el).attr('src');
      if (src && !src.includes('avatar') && !src.includes('face')) {
        images.push(src);
      }
    });

    // 处理相对路径和协议
    return [...new Set(images.map(img => {
      if (img.startsWith('//')) {
        return 'https:' + img;
      }
      if (img.startsWith('/')) {
        return 'https://www.bilibili.com' + img;
      }
      return img;
    }))];
  }

  private extractBilibiliAuthor($: cheerio.CheerioAPI): string | undefined {
    const authorSelectors = [
      // UP主名称
      '.up-info .up-name',
      '.video-info .up-name',
      '.username',
      '.author-name',
      // 移动端UP主
      '.m-video-info .up-name',
      // 动态发布者
      '.bili-dyn-author__name',
      // Meta作者
      'meta[name="author"]'
    ];

    for (const selector of authorSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const author = selector.includes('meta') 
          ? element.attr('content') 
          : element.text().trim();
        
        if (author && author.length > 0 && author.length < 50) {
          return author;
        }
      }
    }

    return undefined;
  }

  private extractBilibiliPublishDate($: cheerio.CheerioAPI): Date | undefined {
    const dateSelectors = [
      // 发布时间
      '.video-info .pubdate',
      '.video-data .pubdate',
      '.time',
      '.publish-time',
      // 移动端时间
      '.m-video-info .time',
      // 动态时间
      '.bili-dyn-time',
      // Meta时间
      'meta[property="article:published_time"]'
    ];

    for (const selector of dateSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        let dateStr = '';
        
        if (selector.includes('meta')) {
          dateStr = element.attr('content') || '';
        } else {
          dateStr = element.text().trim() || element.attr('data-ts') || element.attr('datetime') || '';
        }
        
        if (dateStr) {
          // 处理时间戳
          if (/^\d{10}$/.test(dateStr)) {
            return new Date(parseInt(dateStr) * 1000);
          }
          
          // 处理常见日期格式
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