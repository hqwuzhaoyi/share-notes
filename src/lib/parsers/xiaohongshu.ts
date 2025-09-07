import { chromium } from 'playwright';
import * as cheerio from 'cheerio';
import { AbstractBaseParser } from './base';
import { ParsedContent, ParserOptions } from '../types/parser';

export class XiaohongshuParser extends AbstractBaseParser {
  platform = 'xiaohongshu' as const;

  canParse(url: string): boolean {
    return /xiaohongshu\.com|xhslink\.com|xhscdn\.com/i.test(url);
  }

  async parse(url: string, options?: ParserOptions): Promise<ParsedContent> {
    const opts = this.mergeOptions({ 
      ...options, 
      usePlaywright: true, // 小红书必须使用Playwright
      timeout: 15000 // 增加超时时间
    });

    // 如果options中包含预取的HTML内容，直接使用
    if (options?.preloadedHtml) {
      console.log('📄 使用预取的HTML内容进行解析...');
      return this.parseFromHtml(options.preloadedHtml, url);
    }

    let browser: any = null;
    let page: any = null;

    try {
      // 启动浏览器，添加反检测参数
      browser = await chromium.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-blink-features=AutomationControlled',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor,ScriptStreaming',
          '--no-first-run',
          '--no-default-browser-check',
          '--disable-default-apps',
          '--disable-popup-blocking',
          '--disable-translate',
          '--disable-background-timer-throttling',
          '--disable-renderer-backgrounding',
          '--disable-backgrounding-occluded-windows',
          '--disable-client-side-phishing-detection',
          '--disable-sync',
          '--metrics-recording-only',
          '--no-report-upload',
          '--disable-ipc-flooding-protection'
        ]
      });

      // 使用Playwright内置的iPhone设备模拟
      const iPhoneDevice = {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        viewport: { width: 375, height: 812 },
        deviceScaleFactor: 3,
        isMobile: true,
        hasTouch: true
      };

      page = await browser.newPage(iPhoneDevice);
      
      // 注入反检测JavaScript
      await page.addInitScript(() => {
        // 隐藏webdriver属性
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });
        
        // 修复Chrome检测
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        });
        
        // 修复语言检测
        Object.defineProperty(navigator, 'languages', {
          get: () => ['zh-CN', 'zh', 'en'],
        });
        
        // 修复权限API
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters: any) => (
          parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission } as any) :
            originalQuery(parameters)
        );
      });
      
      // 确保浏览器和页面连接正常
      if (!browser.isConnected() || page.isClosed()) {
        throw new Error('浏览器或页面连接异常');
      }

      // 设置真实的Chrome Mobile headers
      await page.setExtraHTTPHeaders({
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'max-age=0',
        'Sec-Ch-Ua': '"Chromium";v="118", "Google Chrome";v="118", "Not=A?Brand";v="99"',
        'Sec-Ch-Ua-Mobile': '?1',
        'Sec-Ch-Ua-Platform': '"iOS"',
        'Sec-Fetch-Dest': 'document',
        'Sec-Fetch-Mode': 'navigate',
        'Sec-Fetch-Site': 'none',
        'Sec-Fetch-User': '?1',
        'Upgrade-Insecure-Requests': '1',
        'X-Requested-With': 'com.android.browser'
      });

      // 多重策略访问页面
      let finalUrl = url;
      let success = false;
      
      // 策略1: 直接访问
      try {
        console.log(`🔄 策略1 - iPhone Safari直接访问: ${url}`);
        
        const response = await page.goto(url, {
          waitUntil: 'domcontentloaded',
          timeout: 8000,
        });
        
        finalUrl = page.url();
        console.log(`📍 最终URL: ${finalUrl}`);
        console.log(`📊 响应状态码: ${response?.status()}`);
        
        // 检查是否被重定向到登录页面
        if (!finalUrl.includes('/login') && response?.status() === 200) {
          success = true;
          console.log(`✅ 策略1成功访问`);
        } else {
          console.log(`⚠️ 策略1被重定向到登录页面`);
        }
        
      } catch (error) {
        console.warn(`❌ 策略1失败: ${error}`);
      }
      
      // 策略2: 更换设备类型为Android Chrome
      if (!success) {
        try {
          console.log(`🔄 策略2 - Android Chrome访问`);
          
          await page.setExtraHTTPHeaders({
            'User-Agent': 'Mozilla/5.0 (Linux; Android 13; SM-G991B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Mobile Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Sec-Ch-Ua': '"Chromium";v="118", "Google Chrome";v="118", "Not=A?Brand";v="99"',
            'Sec-Ch-Ua-Mobile': '?1',
            'Sec-Ch-Ua-Platform': '"Android"'
          });
          
          await page.waitForTimeout(2000);
          const response = await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 8000,
          });
          
          finalUrl = page.url();
          console.log(`📍 策略2最终URL: ${finalUrl}`);
          
          if (!finalUrl.includes('/login') && response?.status() === 200) {
            success = true;
            console.log(`✅ 策略2成功访问`);
          }
          
        } catch (error) {
          console.warn(`❌ 策略2失败: ${error}`);
        }
      }
      
      // 策略3: 桌面Chrome访问（最后的尝试）
      if (!success) {
        try {
          console.log(`🔄 策略3 - 桌面Chrome访问`);
          
          await page.setViewportSize({ width: 1920, height: 1080 });
          await page.setExtraHTTPHeaders({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"'
          });
          
          await page.waitForTimeout(1500);
          const response = await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout: 8000,
          });
          
          finalUrl = page.url();
          console.log(`📍 策略3最终URL: ${finalUrl}`);
          
          if (response?.status() === 200) {
            console.log(`✅ 策略3获得响应，继续解析`);
          }
          
        } catch (error) {
          console.warn(`❌ 策略3失败: ${error}，继续解析现有内容...`);
          await page.waitForTimeout(1000);
        }
      }
      
      if (success) {
        console.log(`🎉 成功访问小红书内容，无需登录`);
      } else {
        console.log(`⚠️ 所有策略均被重定向，但继续尝试解析页面内容...`);
      }

      // 等待内容加载
      await this.waitForXhsContent(page);

      // 检查页面状态，然后获取HTML
      if (page.isClosed()) {
        throw new Error('页面在加载过程中被关闭');
      }

      // 等待页面导航完成，避免 "page is navigating" 错误
      try {
        await page.waitForLoadState('networkidle', { timeout: 3000 });
      } catch (loadError) {
        console.warn(`等待网络空闲失败: ${loadError}，继续获取内容...`);
      }
      
      // 再次检查页面状态
      if (page.isClosed()) {
        throw new Error('页面在等待过程中被关闭');
      }
      
      const html = await page.content();
      
      // 临时调试：检查页面是否包含og:image标签
      const ogImageMatches = html.match(/<meta[^>]*property="og:image"[^>]*>/g);
      console.log(`🔍 页面中找到 ${ogImageMatches ? ogImageMatches.length : 0} 个og:image标签`);
      if (ogImageMatches) {
        ogImageMatches.slice(0, 3).forEach((match: string, i: number) => {
          console.log(`🔍 OG标签${i+1}: ${match}`);
        });
      }
      
      const $ = cheerio.load(html);

      // 提取小红书特定内容
      const content = this.extractXhsContent($, url);

      return content;
    } catch (error) {
      console.error(`XiaohongshuParser error: ${error}`);
      throw new Error(`XiaohongshuParser failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // 确保资源正确清理
      try {
        if (page && !page.isClosed()) {
          await page.close();
        }
      } catch (pageCloseError) {
        console.warn(`页面关闭失败: ${pageCloseError}`);
      }
      
      try {
        if (browser && browser.isConnected()) {
          await browser.close();
        }
      } catch (browserCloseError) {
        console.warn(`浏览器关闭失败: ${browserCloseError}`);
      }
    }
  }

  private async waitForXhsContent(page: any): Promise<void> {
    try {
      // 检查页面是否已经关闭
      if (page.isClosed()) {
        console.warn('页面已关闭，跳过内容等待');
        return;
      }

      // 简化等待逻辑，减少超时时间
      await Promise.race([
        // 等待基本内容加载
        page.waitForSelector('body', { timeout: 3000 }).catch(() => null),
        // 等待网络基本稳定
        page.waitForLoadState('domcontentloaded', { timeout: 3000 }).catch(() => null),
        // 较短的等待时间
        page.waitForTimeout(3000)
      ]);

      // 简单等待，不做复杂操作
      if (!page.isClosed()) {
        // 仅等待一下让内容稳定加载
        await page.waitForTimeout(500);
      }

    } catch (error) {
      // 如果等待失败，继续解析现有内容
      console.warn(`等待小红书内容失败: ${error}，尝试解析现有内容`);
    }
  }

  private extractXhsContent($: cheerio.CheerioAPI, originalUrl: string): ParsedContent {
    // 提取标题
    const title = this.extractXhsTitle($);
    
    // 提取正文内容  
    const content = this.extractXhsMainContent($);
    
    // 提取图片
    const images = this.extractXhsImages($);
    
    // 提取作者信息
    const author = this.extractXhsAuthor($);

    return {
      title: this.cleanText(title),
      content: this.cleanText(content),
      images: this.filterImages(images),
      author: author ? this.cleanText(author) : undefined,
      publishedAt: new Date(), // 小红书时间提取较复杂，使用当前时间
      platform: this.platform,
      originalUrl,
    };
  }

  private extractXhsTitle($: cheerio.CheerioAPI): string {
    const titleSelectors = [
      // Open Graph标题
      'meta[property="og:title"]',
      // 页面标题
      'title',
      // 笔记标题
      '.note-title',
      '.title',
      // 内容区域的第一行作为标题
      '.desc',
      '.content',
      '.note-content'
    ];

    for (const selector of titleSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        let title = selector.includes('meta') 
          ? element.attr('content') 
          : element.text();
        
        if (title && title.trim()) {
          title = title.trim();
          // 如果是长文本，取前50个字符作为标题
          if (title.length > 50) {
            title = title.substring(0, 50) + '...';
          }
          // 排除无意义的标题
          if (!title.includes('小红书') || title.length > 10) {
            return title;
          }
        }
      }
    }

    return '小红书笔记';
  }

  private extractXhsMainContent($: cheerio.CheerioAPI): string {
    // 移除无用元素
    $('script, style, nav, header, footer, .sidebar, .related').remove();

    const contentSelectors = [
      // 笔记内容区域
      '.note-content',
      '.content',
      '.desc',
      '.text-content', 
      // 通过属性选择器匹配Vue组件
      '[data-v-] .content',
      '[data-v-] .desc',
      // 备用选择器
      '.post-content',
      '.article-content'
    ];

    for (const selector of contentSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        let text = element.text().trim();
        if (text && text.length > 20) {
          // 清理小红书特有的无用文本
          text = text
            .replace(/分享图片|分享视频|小红书|App|点赞|收藏|评论|关注/g, '')
            .replace(/\s+/g, ' ')
            .trim();
          
          if (text.length > 20) {
            return text;
          }
        }
      }
    }

    // 检查是否为小红书错误页面
    const allText = $('body').text().trim();
    
    // 检测常见的错误页面信息
    if (allText.includes('你访问的页面不见了') || 
        allText.includes('页面不存在') || 
        allText.includes('内容已删除') ||
        allText.includes('笔记已删除')) {
      return '该小红书笔记已不存在或已被删除，可能是链接过期或内容被作者删除';
    }
    
    // 检测登录相关页面
    if (allText.includes('请先登录') || 
        allText.includes('需要登录') ||
        allText.includes('登录小红书') ||
        allText.includes('登录后推荐') ||
        allText.includes('微信扫码') ||
        allText.includes('新用户可直接登录') ||
        allText.includes('用户协议')) {
      return '该内容需要登录小红书才能访问。小红书已加强访问控制，大部分内容现在需要登录用户才能查看。建议：1）使用小红书App分享的链接；2）确保链接来自公开可访问的内容；3）尝试使用更新的、确认有效的分享链接。';
    }
    
    // 检测访问限制
    if (allText.includes('访问受限') || 
        allText.includes('地区限制') ||
        allText.includes('不在服务区域')) {
      return '该内容存在访问限制，可能是地区限制或其他访问控制';
    }
    
    // 如果有其他文本内容，尝试提取有用信息
    if (allText.length > 50) {
      const cleanedText = allText
        .replace(/分享图片|分享视频|小红书|App|点赞|收藏|评论|关注|返回上一页|你还可以/g, '')
        .replace(/\s+/g, ' ')
        .trim();
      
      if (cleanedText.length > 20) {
        return cleanedText.substring(0, 500);
      }
    }

    return '无法提取小红书内容，可能需要登录或页面结构已变化';
  }

  private extractXhsImages($: cheerio.CheerioAPI): string[] {
    const images: string[] = [];
    
    console.log('🔍 开始小红书图片提取...');
    
    // 优先提取 Open Graph 图片（通常是完整的内容图片列表）
    const ogImages: string[] = [];
    $('meta[property="og:image"]').each((_, el) => {
      const content = $(el).attr('content');
      if (content) {
        ogImages.push(content);
      }
    });
    
    console.log(`📊 找到 ${ogImages.length} 张OG图片`);
    ogImages.forEach((img, index) => {
      console.log(`📊 OG图片${index + 1}: ${img}`);
    });
    
    // 检查OG图片是否符合内容图片标准
    ogImages.forEach(ogImg => {
      if (this.isContentImage(ogImg)) {
        images.push(this.normalizeImageUrl(ogImg));
        console.log(`✅ 添加OG图片: ${ogImg}`);
      } else {
        console.log(`❌ 过滤OG图片: ${ogImg}`);
      }
    });
    
    // 如果OG图片足够，直接使用
    if (images.length >= 3) {
      console.log(`🎯 OG图片充足，使用${images.length}张OG图片`);
      const uniqueImages = [...new Set(images)].slice(0, 9);
      console.log(`🎯 最终图片列表:`, uniqueImages);
      return uniqueImages;
    }
    
    console.log(`⚠️ OG图片不足(${images.length}张)，尝试其他方式...`);
    
    // 调试：检查页面中是否存在swiper结构
    const swiperSlides = $('.swiper-slide').length;
    console.log(`📊 页面中swiper-slide数量: ${swiperSlides}`);
    
    const allImages = $('img').length;
    console.log(`📊 页面中img标签总数: ${allImages}`);

    // 提取 swiper-slide 中的图片（笔记内容图片）
    $('.swiper-slide img').each((_, el) => {
      const $img = $(el);
      const src = $img.attr('src') 
        || $img.attr('data-src') 
        || $img.attr('data-original')
        || $img.attr('data-lazy-src');
      
      console.log(`🔍 Swiper中的图片: ${src}`);
      if (src && this.isContentImage(src)) {
        images.push(this.normalizeImageUrl(src));
        console.log(`✅ Swiper图片: ${src}`);
      }
    });

    // 补充其他来源的图片
    // note-slider-img 类的图片
    $('.note-slider-img').each((_, el) => {
      const $img = $(el);
      const src = $img.attr('src') || $img.attr('data-src');
      
      if (src && this.isContentImage(src) && !images.includes(this.normalizeImageUrl(src))) {
        images.push(this.normalizeImageUrl(src));
        console.log(`✅ Note-slider图片: ${src}`);
      }
    });

    // img-container 中的图片
    $('.img-container img').each((_, el) => {
      const $img = $(el);
      const src = $img.attr('src') || $img.attr('data-src');
      
      if (src && this.isContentImage(src) && !images.includes(this.normalizeImageUrl(src))) {
        images.push(this.normalizeImageUrl(src));
        console.log(`✅ Container图片: ${src}`);
      }
    });

    // 包含"sns-webpic"的图片（常见的小红书内容图片）
    $('img[src*="sns-webpic"], img[src*="webpic-qc"]').each((_, el) => {
      const $img = $(el);
      const src = $img.attr('src');
      
      if (src && this.isContentImage(src) && !images.includes(this.normalizeImageUrl(src))) {
        images.push(this.normalizeImageUrl(src));
        console.log(`✅ WebPic图片: ${src}`);
      }
    });

    // 所有小红书域名的图片
    $('img').each((_, el) => {
      const $img = $(el);
      const src = $img.attr('src') || $img.attr('data-src');
      
      if (src && (src.includes('xiaohongshu') || src.includes('xhscdn') || src.includes('sns-webpic'))) {
        if (this.isContentImage(src) && !images.includes(this.normalizeImageUrl(src))) {
          images.push(this.normalizeImageUrl(src));
          console.log(`✅ 小红书图片: ${src}`);
        }
      }
    });

    console.log(`🎯 小红书图片提取: 找到 ${images.length} 张内容图片`);
    
    // 去重并限制数量
    const uniqueImages = [...new Set(images)].slice(0, 9);
    console.log(`🎯 小红书图片提取: 去重后 ${uniqueImages.length} 张图片`);
    console.log(`🎯 最终图片列表:`, uniqueImages);
    
    return uniqueImages;
  }

  // 直接从HTML内容解析（用于iOS快捷指令预取的内容）
  private parseFromHtml(html: string, url: string): ParsedContent {
    const $ = cheerio.load(html);
    
    // 提取小红书内容
    const content = this.extractXhsContent($, url);
    return content;
  }

  // 重写父类的filterImages方法，使用xiaohongshu特定的验证逻辑
  protected filterImages(images: string[]): string[] {
    return images
      .filter(img => img && typeof img === 'string')
      .map(img => img.trim())
      .filter(img => this.isContentImage(img)) // 使用xiaohongshu特定的验证
      .slice(0, 9); // 限制最多9张图片
  }

  // 检查是否为内容图片（非头像、图标等）
  private isContentImage(url: string): boolean {
    if (!url) return false;
    
    // 必须是小红书相关的图片域名 - 扩展匹配范围
    if (!url.includes('xiaohongshu') 
      && !url.includes('xhscdn') 
      && !url.includes('sns-webpic')
      && !url.includes('picasso-static')) {
      return false;
    }
    
    // 过滤掉头像、图标、UI元素
    if (url.includes('avatar') 
      || url.includes('icon') 
      || url.includes('logo')
      || url.includes('/40/')    // 小尺寸图片
      || url.includes('/32/')    // 小尺寸图片  
      || url.includes('/48/')    // 小尺寸图片
      || url.match(/\/(16|24|32|40|48)x\1/) // 正方形小图标
    ) {
      return false;
    }
    
    return true;
  }

  // 标准化图片URL
  private normalizeImageUrl(url: string): string {
    if (!url) return '';
    
    try {
      // 如果是相对URL，补全域名
      if (url.startsWith('//')) {
        return 'https:' + url;
      } else if (url.startsWith('/')) {
        return 'https://xiaohongshu.com' + url;
      }
      
      // 已经是完整URL
      return url;
    } catch {
      return url;
    }
  }

  // 辅助方法：检查是否为图片URL（保留兼容性）
  private isImageUrl(url: string): boolean {
    if (!url) return false;
    
    // 检查常见的图片文件扩展名
    const imageExtensions = /\.(jpg|jpeg|png|webp|gif|bmp|svg)(\?.*)?$/i;
    if (imageExtensions.test(url)) return true;
    
    // 检查小红书特有的图片URL模式
    if (url.includes('xiaohongshu.com') || url.includes('xhscdn.com')) {
      return true;
    }
    
    return false;
  }

  private extractXhsAuthor($: cheerio.CheerioAPI): string | undefined {
    const authorSelectors = [
      // 作者名称
      '.author-name',
      '.username', 
      '.user-name',
      '.nickname',
      // 通过属性选择器
      '[data-v-] .author',
      '[data-v-] .username',
      // Meta标签
      'meta[name="author"]'
    ];

    for (const selector of authorSelectors) {
      const element = $(selector).first();
      if (element.length > 0) {
        const author = selector.includes('meta') 
          ? element.attr('content') 
          : element.text().trim();
        
        if (author && author.length > 0 && author.length < 50) {
          // 过滤无效的作者名
          if (!author.includes('小红书') && author !== '用户') {
            return author;
          }
        }
      }
    }

    return undefined;
  }
}