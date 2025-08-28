import { PlatformType } from '../types/parser';

export class PlatformDetector {
  private static platformPatterns: Record<PlatformType, RegExp[]> = {
    xiaohongshu: [
      /xiaohongshu\.com/,
      /xhslink\.com/,
      /xhscdn\.com/
    ],
    bilibili: [
      /bilibili\.com/,
      /b23\.tv/,
      /bili\.com/
    ],
    wechat: [
      /mp\.weixin\.qq\.com/
    ],
    unknown: []
  };

  static detectPlatform(url: string): PlatformType {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();
      
      for (const [platform, patterns] of Object.entries(this.platformPatterns)) {
        if (platform === 'unknown') continue;
        
        for (const pattern of patterns) {
          if (pattern.test(domain) || pattern.test(url)) {
            return platform as PlatformType;
          }
        }
      }
      
      return 'unknown';
    } catch (error) {
      console.error('Invalid URL:', url, error);
      return 'unknown';
    }
  }

  static isSupported(url: string): boolean {
    return this.detectPlatform(url) !== 'unknown';
  }

  static getSupportedPlatforms(): PlatformType[] {
    return Object.keys(this.platformPatterns).filter(p => p !== 'unknown') as PlatformType[];
  }
}