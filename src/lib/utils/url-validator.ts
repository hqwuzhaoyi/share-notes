export class URLValidator {
  private static allowedProtocols = ['http:', 'https:'];
  private static blockedDomains = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '10.0.0.0/8',
    '172.16.0.0/12',
    '192.168.0.0/16'
  ];

  static isValid(url: string): boolean {
    try {
      const urlObj = new URL(url);
      
      // 检查协议
      if (!this.allowedProtocols.includes(urlObj.protocol)) {
        return false;
      }

      // 检查是否为内网地址（防止SSRF）
      if (this.isPrivateIP(urlObj.hostname)) {
        return false;
      }

      // 检查域名是否在黑名单中
      if (this.isBlockedDomain(urlObj.hostname)) {
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }

  private static isPrivateIP(hostname: string): boolean {
    // 检查是否为IP地址
    const ipRegex = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/;
    if (!ipRegex.test(hostname)) {
      return false;
    }

    const parts = hostname.split('.').map(Number);
    
    // 私有IP地址范围
    return (
      // 10.0.0.0/8
      (parts[0] === 10) ||
      // 172.16.0.0/12
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      // 192.168.0.0/16
      (parts[0] === 192 && parts[1] === 168) ||
      // 127.0.0.0/8
      (parts[0] === 127)
    );
  }

  private static isBlockedDomain(hostname: string): boolean {
    const lowerHostname = hostname.toLowerCase();
    return this.blockedDomains.some(blocked => 
      lowerHostname === blocked || lowerHostname.endsWith('.' + blocked)
    );
  }

  static sanitizeURL(url: string): string {
    try {
      const urlObj = new URL(url);
      // 移除fragment和一些查询参数
      urlObj.hash = '';

      // 移除跟踪参数
      const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'];
      trackingParams.forEach(param => {
        urlObj.searchParams.delete(param);
      });

      return urlObj.toString();
    } catch {
      return url;
    }
  }

  /**
   * Check if URL is from Xiaohongshu platform
   * @param url - URL to check
   * @returns true if URL is from xiaohongshu.com or xhslink.com
   */
  static isXiaohongshuUrl(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const domain = urlObj.hostname.toLowerCase();

      return (
        domain.includes('xiaohongshu.com') ||
        domain.includes('xhslink.com')
      );
    } catch {
      return false;
    }
  }
}