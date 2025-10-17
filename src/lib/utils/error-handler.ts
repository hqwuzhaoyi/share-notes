/**
 * 统一错误处理工具
 * 提供错误分类、重试机制和用户友好的错误信息
 */

import { getEnvironmentType } from './environment-detector';

export type ErrorCategory =
  | 'network'
  | 'parsing'
  | 'timeout'
  | 'authentication'
  | 'ratelimit'
  | 'serverless'
  | 'unknown';

export interface ErrorContext {
  url?: string;
  parser?: string;
  environment: string;
  attempt?: number;
  maxAttempts?: number;
}

export interface ProcessedError {
  category: ErrorCategory;
  message: string;
  userMessage: string;
  shouldRetry: boolean;
  retryDelay?: number;
  context: ErrorContext;
}

export class ErrorHandler {
  // 更合理的指数退避：1s, 2s, 4s, 8s
  private static readonly RETRY_DELAYS = [1000, 2000, 4000, 8000];

  /**
   * 获取重试延迟时间（带随机抖动，防止请求风暴）
   */
  private static getRetryDelay(attempt: number): number {
    const index = Math.min(attempt - 1, this.RETRY_DELAYS.length - 1);
    const baseDelay = this.RETRY_DELAYS[index];
    // 添加最多±20%的抖动
    const jitter = Math.floor(baseDelay * 0.2 * (Math.random() - 0.5));
    return baseDelay + jitter;
  }
  private static readonly MAX_ATTEMPTS = 3;

  /**
   * 分析并处理错误
   */
  static processError(error: Error, context: Partial<ErrorContext> = {}): ProcessedError {
    const fullContext: ErrorContext = {
      environment: getEnvironmentType(),
      attempt: 1,
      maxAttempts: this.MAX_ATTEMPTS,
      ...context
    };

    const category = this.categorizeError(error);
    const shouldRetry = this.shouldRetry(category, fullContext.attempt || 1);
    const retryDelay = shouldRetry ? this.getRetryDelay(fullContext.attempt || 1) : undefined;

    return {
      category,
      message: error.message,
      userMessage: this.getUserFriendlyMessage(category, error.message, fullContext),
      shouldRetry,
      retryDelay,
      context: fullContext
    };
  }

  /**
   * 错误分类
   */
  private static categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();

    // 网络相关错误
    if (message.includes('fetch') ||
        message.includes('network') ||
        message.includes('connection') ||
        message.includes('econnreset') ||
        message.includes('enotfound')) {
      return 'network';
    }

    // 超时错误
    if (message.includes('timeout') ||
        message.includes('时间') ||
        message.includes('超时')) {
      return 'timeout';
    }

    // Serverless环境相关错误
    if (message.includes('playwright') ||
        message.includes('browser') ||
        message.includes('target page') ||
        message.includes('浏览器')) {
      return 'serverless';
    }

    // 认证错误
    if (message.includes('unauthorized') ||
        message.includes('forbidden') ||
        message.includes('401') ||
        message.includes('403')) {
      return 'authentication';
    }

    // 限流错误
    if (message.includes('rate limit') ||
        message.includes('too many requests') ||
        message.includes('429')) {
      return 'ratelimit';
    }

    // 解析错误
    if (message.includes('parse') ||
        message.includes('解析') ||
        message.includes('invalid') ||
        message.includes('无效')) {
      return 'parsing';
    }

    return 'unknown';
  }

  /**
   * 判断是否应该重试
   */
  private static shouldRetry(category: ErrorCategory, attempt: number): boolean {
    if (attempt >= this.MAX_ATTEMPTS) {
      return false;
    }

    // 这些错误类型值得重试
    const retryableCategories: ErrorCategory[] = [
      'network',
      'timeout',
      'ratelimit',
      'unknown'
    ];

    return retryableCategories.includes(category);
  }

  /**
   * 获取重试延迟时间
   */
  private static getRetryDelay(attempt: number): number {
    const index = Math.min(attempt - 1, this.RETRY_DELAYS.length - 1);
    return this.RETRY_DELAYS[index];
  }

  /**
   * 生成用户友好的错误信息
   */
  private static getUserFriendlyMessage(
    category: ErrorCategory,
    originalMessage: string,
    context: ErrorContext
  ): string {
    const { environment, parser, url } = context;

    switch (category) {
      case 'network':
        return `网络连接失败，请检查网络状况或稍后重试。${this.getEnvironmentHint(environment)}`;

      case 'timeout':
        return `请求超时，可能是目标网站响应较慢。建议稍后重试或使用preloadedHtml参数。`;

      case 'serverless':
        if (environment === 'vercel') {
          return `Vercel环境下浏览器功能受限。建议使用iOS快捷指令预取HTML内容，或在本地环境运行服务。`;
        }
        return `Serverless环境下某些功能受限，建议使用preloadedHtml参数或本地部署。`;

      case 'authentication':
        return `访问被拒绝，可能是目标网站的反爬虫机制。建议使用不同的User-Agent或通过iOS快捷指令获取内容。`;

      case 'ratelimit':
        return `请求过于频繁，请稍后重试。建议适当降低请求频率。`;

      case 'parsing':
        return `内容解析失败，可能是目标网站结构发生变化。${parser ? `${parser}解析器` : '解析器'}需要更新。`;

      case 'unknown':
      default:
        return `解析过程中遇到未知错误：${originalMessage}。请检查URL格式是否正确，或联系开发者。`;
    }
  }

  /**
   * 根据环境提供特定提示
   */
  private static getEnvironmentHint(environment: string): string {
    switch (environment) {
      case 'vercel':
        return '在Vercel环境下，建议使用preloadedHtml参数提高成功率。';
      case 'local':
        return '本地环境下如果持续失败，请检查网络连接和防火墙设置。';
      default:
        return '';
    }
  }

  /**
   * 执行带重试的异步操作
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    context: Partial<ErrorContext> = {}
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.MAX_ATTEMPTS; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        const processedError = this.processError(lastError, {
          ...context,
          attempt,
          maxAttempts: this.MAX_ATTEMPTS
        });

        console.warn(`⚠️ 尝试 ${attempt}/${this.MAX_ATTEMPTS} 失败:`, processedError.userMessage);

        // 如果不应该重试或已达到最大尝试次数，抛出错误
        if (!processedError.shouldRetry || attempt >= this.MAX_ATTEMPTS) {
          throw new Error(processedError.userMessage);
        }

        // 等待后重试
        if (processedError.retryDelay) {
          console.log(`⏳ ${processedError.retryDelay}ms 后重试...`);
          await this.delay(processedError.retryDelay);
        }
      }
    }

    throw lastError!;
  }

  /**
   * 延迟工具函数
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 记录错误详情用于监控
   */
  static logError(processedError: ProcessedError): void {
    const logData = {
      timestamp: new Date().toISOString(),
      category: processedError.category,
      message: processedError.message,
      userMessage: processedError.userMessage,
      context: processedError.context,
      shouldRetry: processedError.shouldRetry
    };

    // 在生产环境中，这里可以发送到监控服务
    if (process.env.NODE_ENV === 'production') {
      console.error('🚨 Error logged:', JSON.stringify(logData));
    } else {
      console.error('🚨 Development error:', logData);
    }
  }
}