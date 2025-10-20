import { chromium, Browser, Page } from 'playwright';
import * as cheerio from 'cheerio';
import { AbstractBaseParser } from './base';
import { ParsedContent, ParserOptions, PlatformType } from '../types/parser';

export class PlaywrightParser extends AbstractBaseParser {
  platform: PlatformType = 'unknown';
  private browser: Browser | null = null;

  canParse(_url: string): boolean {
    // Playwright解析器可以处理任何URL
    return true;
  }

  async parse(url: string, options?: ParserOptions): Promise<ParsedContent> {
    const opts = this.mergeOptions(options);
    
    try {
      // 启动浏览器
      await this.initBrowser();
      
      if (!this.browser) {
        throw new Error('Failed to initialize browser');
      }

      const page = await this.browser.newPage();
      
      try {
        // 设置请求头和User-Agent
        await page.setExtraHTTPHeaders(opts.headers || {});
        
        // 设置视口大小（模拟移动设备）
        await page.setViewportSize({ width: 375, height: 812 });
        
        // 导航到目标页面
        await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: opts.timeout,
        });
        
        // 等待内容加载
        await this.waitForContent(page);
        
        // 获取页面HTML
        const html = await page.content();
        
        // 使用cheerio解析HTML
        const $ = cheerio.load(html);
        
        // 提取内容
        const content = this.extractContent($, url);
        
        return content;
      } finally {
        await page.close();
      }
    } catch (error) {
      throw new Error(`PlaywrightParser failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async initBrowser(): Promise<void> {
    if (this.browser) return;
    
    try {
      this.browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });
    } catch (error) {
      console.error('Failed to launch browser:', error);
      throw error;
    }
  }

  private async waitForContent(page: Page): Promise<void> {
    try {
      // 等待常见的内容加载完成
      await Promise.race([
        // 等待图片加载
        page.waitForLoadState('networkidle', { timeout: 5000 }),
        // 等待特定元素
        page.waitForSelector('article, .content, .post, main', { timeout: 3000 }),
        // 最多等待3秒
        page.waitForTimeout(3000)
      ]);
      
      // 滚动页面以触发懒加载
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight / 2);
      });
      
      // 等待一下让懒加载的内容显示
      await page.waitForTimeout(1000);
    } catch {
      // 忽略等待超时，继续解析现有内容
    }
  }

  private extractContent($: cheerio.CheerioAPI, originalUrl: string): ParsedContent {
    // 提取标题
    const title = this.extractTitle($);
    
    // 提取正文内容
    const content = this.extractMainContent($);
    
    // 提取图片
    const images = this.extractImages($, originalUrl);
    
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
    $('script, style, nav, header, footer, .ads, .advertisement, .sidebar').remove();
    
    const contentSelectors = [
      '.content',
      '.post-content', 
      '.article-content',
      '.entry-content',
      '.main-content',
      'article',
      '.post-body',
      '.text-content',
      '.note-text',
      '.desc'
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

    // 备用方案：从body中提取文本
    const bodyText = $('body').text();
    if (bodyText && bodyText.trim().length > 100) {
      return bodyText.trim().substring(0, 2000);
    }

    return '无法提取内容';
  }

  private extractImages($: cheerio.CheerioAPI, baseUrl: string): string[] {
    const images: string[] = [];
    
    // Open Graph 图片
    $('meta[property="og:image"]').each((_, el) => {
      const content = $(el).attr('content');
      if (content) images.push(content);
    });

    // 内容中的图片
    $('img').each((_, el) => {
      const src = $(el).attr('src') || $(el).attr('data-src') || $(el).attr('data-original');
      if (src) {
        try {
          const url = new URL(src, baseUrl);
          images.push(url.href);
        } catch {
          if (src.startsWith('http')) {
            images.push(src);
          }
        }
      }
    });

    return [...new Set(images)];
  }

  private extractAuthor($: cheerio.CheerioAPI): string | undefined {
    const authorSelectors = [
      'meta[name="author"]',
      'meta[property="article:author"]', 
      '.author',
      '.byline',
      '.post-author',
      '.author-name',
      '.username',
      '.user-name'
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
      '.date',
      '.time'
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

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}