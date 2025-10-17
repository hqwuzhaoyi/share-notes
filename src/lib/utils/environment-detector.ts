/**
 * 运行环境检测工具
 * 用于检测当前运行环境（Vercel、Netlify、本地等）
 */

export type EnvironmentType = 'vercel' | 'netlify' | 'local' | 'unknown';

export class EnvironmentDetector {
  /**
   * 检测是否在 Vercel 环境中运行
   */
  static isVercel(): boolean {
    return process.env.VERCEL === '1' || process.env.VERCEL_ENV !== undefined;
  }

  /**
   * 检测是否在 Netlify 环境中运行
   */
  static isNetlify(): boolean {
    return process.env.NETLIFY === 'true' || process.env.NETLIFY_DEV === 'true';
  }

  /**
   * 检测是否在 Serverless 环境中运行
   */
  static isServerless(): boolean {
    return this.isVercel() || this.isNetlify() || 
           process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined ||
           process.env.FUNCTIONS_RUNTIME !== undefined;
  }

  /**
   * 检测是否在本地开发环境中运行
   */
  static isLocal(): boolean {
    return process.env.NODE_ENV === 'development' && !this.isServerless();
  }

  /**
   * 获取当前环境类型
   */
  static getEnvironmentType(): EnvironmentType {
    if (this.isVercel()) return 'vercel';
    if (this.isNetlify()) return 'netlify';
    if (this.isLocal()) return 'local';
    return 'unknown';
  }

  /**
   * 检测是否应该跳过 Playwright 浏览器下载
   * 在 Serverless 环境中通常需要跳过
   */
  static shouldSkipPlaywrightDownload(): boolean {
    // 检查显式环境变量
    if (process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD === '1') {
      return true;
    }

    // 在 Serverless 环境中默认跳过
    return this.isServerless();
  }

  /**
   * 检测当前环境是否支持 Playwright 浏览器启动
   */
  static supportsPlaywrightBrowser(): boolean {
    // Vercel Serverless 环境不支持 Playwright 浏览器
    if (this.isVercel()) return false;
    
    // 其他 Serverless 环境通常也不支持
    if (this.isServerless()) return false;
    
    // 本地环境支持
    return true;
  }

  /**
   * 获取环境相关的调试信息
   */
  static getEnvironmentInfo() {
    return {
      type: this.getEnvironmentType(),
      isVercel: this.isVercel(),
      isNetlify: this.isNetlify(),
      isServerless: this.isServerless(),
      isLocal: this.isLocal(),
      shouldSkipPlaywrightDownload: this.shouldSkipPlaywrightDownload(),
      supportsPlaywrightBrowser: this.supportsPlaywrightBrowser(),
      nodeEnv: process.env.NODE_ENV,
      relevantEnvVars: {
        VERCEL: process.env.VERCEL,
        VERCEL_ENV: process.env.VERCEL_ENV,
        NETLIFY: process.env.NETLIFY,
        NODE_ENV: process.env.NODE_ENV,
        PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD: process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD,
      }
    };
  }
}

// 便利的导出函数
export const isVercel = () => EnvironmentDetector.isVercel();
export const isNetlify = () => EnvironmentDetector.isNetlify();
export const isServerless = () => EnvironmentDetector.isServerless();
export const isLocal = () => EnvironmentDetector.isLocal();
export const getEnvironmentType = () => EnvironmentDetector.getEnvironmentType();
export const shouldSkipPlaywrightDownload = () => EnvironmentDetector.shouldSkipPlaywrightDownload();
export const supportsPlaywrightBrowser = () => EnvironmentDetector.supportsPlaywrightBrowser();
export const getEnvironmentInfo = () => EnvironmentDetector.getEnvironmentInfo();