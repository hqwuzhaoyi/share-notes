import { ofetch } from 'ofetch';
import * as cheerio from 'cheerio';
import { AbstractBaseParser } from './base';
import { ParsedContent, ParserOptions } from '../types/parser';

export class WechatParser extends AbstractBaseParser {
  platform = 'wechat' as const;

  canParse(url: string): boolean {
    return /mp\.weixin\.qq\.com/i.test(url);
  }

  async parse(url: string, options?: ParserOptions): Promise<ParsedContent> {
    const opts = this.mergeOptions(options);

    try {
      // 微信公众号文章通常可以直接用ofetch获取
      const html = await ofetch(url, {
        timeout: opts.timeout,
        headers: {
          ...opts.headers,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3',
          'Accept-Encoding': 'gzip, deflate',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Upgrade-Insecure-Requests': '1',
          // 使用移动端User-Agent，微信文章对移动端更友好
          'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1 MicroMessenger/8.0.42'
        },
        retry: 2,
        retryDelay: 1000,
      });

      const $ = cheerio.load(html);
      return this.extractWechatContent($, url);

    } catch (error) {
      // 如果ofetch失败，尝试使用Playwright
      try {
        const { PlaywrightParser } = await import('./playwright-parser');
        const playwright = new PlaywrightParser();
        playwright.platform = this.platform;
        return await playwright.parse(url, { 
          ...opts, 
          usePlaywright: true,
          headers: {
            ...opts.headers,
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1 MicroMessenger/8.0.42'
          }
        });
      } catch (playwrightError) {
        throw new Error(`WechatParser failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  private extractWechatContent($: cheerio.CheerioAPI, originalUrl: string): ParsedContent {
    // 提取标题
    const title = this.extractWechatTitle($);
    
    // 提取正文内容
    const content = this.extractWechatMainContent($);
    
    // 提取图片
    const images = this.extractWechatImages($);
    
    // 提取作者信息
    const author = this.extractWechatAuthor($);
    
    // 提取发布时间
    const publishedAt = this.extractWechatPublishDate($);

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

  private extractWechatTitle($: cheerio.CheerioAPI): string {
    const titleSelectors = [
      // 文章标题
      '#activity-name',
      '.rich_media_title',
      'h1.rich_media_title',
      // Meta标签
      'meta[property="og:title"]',
      'meta[name="twitter:title"]',
      // 页面标题
      'title'
    ];

    for (const selector of titleSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const title = selector.includes('meta') 
          ? element.attr('content') 
          : element.text().trim();
        
        if (title && title.length > 5) {
          // 清理微信文章标题
          return title
            .replace(/^\s*【.*?】\s*/, '') // 移除开头的【标签】
            .trim();
        }
      }
    }

    return '微信公众号文章';
  }

  private extractWechatMainContent($: cheerio.CheerioAPI): string {
    // 移除不需要的元素
    $('script, style, .rich_media_tool, .qr_code_pc_outer, .reward_qrcode_area').remove();

    const contentSelectors = [
      // 文章内容区域
      '#js_content',
      '.rich_media_content',
      '.rich_media_area_primary',
      // 备用选择器
      '.main-content',
      '.article-content'
    ];

    for (const selector of contentSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        let text = element.text().trim();
        
        if (text && text.length > 50) {
          // 清理微信文章特有的无用文本
          text = text
            .replace(/长按二维码关注.*?$|扫描二维码关注.*?$/gm, '')
            .replace(/点击上方.*?关注我们|关注我们获取更多.*?$/gm, '')
            .replace(/\s+/g, ' ')
            .trim();
          
          // 限制内容长度，避免过长
          if (text.length > 2000) {
            text = text.substring(0, 2000) + '...';
          }
          
          return text;
        }
      }
    }

    return '无法提取文章内容';
  }

  private extractWechatImages($: cheerio.CheerioAPI): string[] {
    const images: string[] = [];

    // 文章封面图片
    $('meta[property="og:image"]').each((_, el) => {
      const content = $(el).attr('content');
      if (content) images.push(content);
    });

    // 文章内的图片
    $('#js_content img, .rich_media_content img').each((_, el) => {
      const $img = $(el);
      const src = $img.attr('src') || $img.attr('data-src') || $img.attr('data-w-src');
      
      if (src) {
        // 微信图片通常以mmbiz开头或包含wx_fmt
        if (src.includes('mmbiz') || src.includes('wx_fmt') || src.startsWith('http')) {
          try {
            const url = new URL(src, 'https://mp.weixin.qq.com');
            // 过滤掉二维码等小图片
            if (!src.includes('qr_code') && !src.includes('qrcode')) {
              images.push(url.href);
            }
          } catch {
            if (src.startsWith('http')) {
              images.push(src);
            }
          }
        }
      }
    });

    // 去重并返回
    return [...new Set(images)];
  }

  private extractWechatAuthor($: cheerio.CheerioAPI): string | undefined {
    const authorSelectors = [
      // 公众号名称
      '.rich_media_meta_nickname',
      '#js_name',
      '.account_nickname',
      // 作者署名
      '.rich_media_meta .rich_media_meta_text',
      // Meta标签
      'meta[name="author"]'
    ];

    for (const selector of authorSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const author = selector.includes('meta') 
          ? element.attr('content') 
          : element.text().trim();
        
        if (author && author.length > 0 && author.length < 100) {
          return author;
        }
      }
    }

    return undefined;
  }

  private extractWechatPublishDate($: cheerio.CheerioAPI): Date | undefined {
    const dateSelectors = [
      // 发布时间
      '#publish_time',
      '.rich_media_meta_text',
      '.time',
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
          const text = element.text().trim();
          // 匹配常见的时间格式
          const timeMatch = text.match(/(\d{4}-\d{2}-\d{2}|\d{4}年\d{1,2}月\d{1,2}日)/);
          if (timeMatch) {
            dateStr = timeMatch[1];
          }
        }
        
        if (dateStr) {
          // 处理中文日期格式
          if (dateStr.includes('年')) {
            dateStr = dateStr.replace(/年/g, '-').replace(/月/g, '-').replace(/日/g, '');
          }
          
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