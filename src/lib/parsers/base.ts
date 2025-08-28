import { BaseParser, ParsedContent, ParserOptions, PlatformType } from '../types/parser';

export abstract class AbstractBaseParser implements BaseParser {
  abstract platform: PlatformType;
  
  abstract canParse(url: string): boolean;
  
  abstract parse(url: string, options?: ParserOptions): Promise<ParsedContent>;

  // 通用的内容清理方法
  protected cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n\n')
      .trim();
  }

  // 通用的图片URL验证
  protected isValidImageUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname.toLowerCase();
      return /\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/.test(pathname);
    } catch {
      return false;
    }
  }

  // 过滤和清理图片URLs
  protected filterImages(images: string[]): string[] {
    return images
      .filter(img => img && typeof img === 'string')
      .map(img => img.trim())
      .filter(img => this.isValidImageUrl(img))
      .slice(0, 9); // 限制最多9张图片
  }

  // 默认的User-Agent
  protected getDefaultHeaders(): Record<string, string> {
    return {
      'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.8,en-US;q=0.5,en;q=0.3',
      'Accept-Encoding': 'gzip, deflate',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1',
    };
  }

  // 合并选项和默认值
  protected mergeOptions(options?: ParserOptions): ParserOptions {
    return {
      timeout: 10000,
      userAgent: this.getDefaultHeaders()['User-Agent'],
      headers: this.getDefaultHeaders(),
      usePlaywright: false,
      ...options,
    };
  }
}