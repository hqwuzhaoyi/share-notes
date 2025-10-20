// AI增强解析器
import { AbstractBaseParser } from './base';
import { ParsedContent, ParserOptions } from '../types/parser';
import { AIEnhancedContent, AIOptions } from '../types/ai';
import { LangChainClient } from '../ai/langchain-client';
import { aiCache } from '../ai/cache';
import { AI_CONFIG } from '../ai/config';

export class AIParser extends AbstractBaseParser {
  platform = 'unknown' as const;
  private langchainClient: LangChainClient;

  constructor() {
    super();
    this.langchainClient = new LangChainClient();
  }

  canParse(_url: string): boolean {
    // AI解析器可以处理任何URL，但通常作为fallback使用
    return this.langchainClient.isAvailable();
  }

  async parse(_url: string, _options?: ParserOptions): Promise<ParsedContent> {
    if (!this.langchainClient.isAvailable()) {
      throw new Error('AI parsing is not available. Please check your API configuration.');
    }

    try {
      // 这里通常是从HTML中智能提取内容
      // 实际使用中，这个方法可能不会直接调用，而是通过enhance方法增强现有内容
      throw new Error('AIParser.parse() should not be called directly. Use enhance() instead.');
    } catch (error) {
      throw new Error(`AI parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 增强现有解析结果
  async enhance(
    content: ParsedContent, 
    aiOptions?: AIOptions,
    rawContent?: string
  ): Promise<AIEnhancedContent> {
    const options = {
      enableSummary: true,
      enableTitleOptimization: true,
      enableCategorization: true,
      enableSmartExtraction: false,
      ...aiOptions
    };

    // 检查缓存
    const cacheKey = content.originalUrl;
    const cached = aiCache.get(cacheKey, rawContent);
    if (cached) {
      console.log('AI enhancement found in cache');
      return cached;
    }

    const enhancedContent: AIEnhancedContent = {
      ...content,
      aiEnhanced: true,
    };

    const tasks = [];

    // 生成摘要
    if (options.enableSummary && content.content) {
      tasks.push(this.addSummary(enhancedContent, content.content, options));
    }

    // 优化标题
    if (options.enableTitleOptimization && content.title && content.content) {
      tasks.push(this.addOptimizedTitle(enhancedContent, content.title, content.content, options));
    }

    // 内容分类
    if (options.enableCategorization && content.content) {
      tasks.push(this.addCategorization(enhancedContent, content.content, options));
    }

    // 并行执行AI任务
    await Promise.allSettled(tasks);

    // 缓存结果
    aiCache.set(cacheKey, enhancedContent, rawContent);

    return enhancedContent;
  }

  // 智能HTML提取（当传统解析器失败时使用）
  async extractFromHTML(
    html: string, 
    url: string, 
    aiOptions?: AIOptions
  ): Promise<ParsedContent> {
    const options = {
      model: AI_CONFIG.DEFAULT_MODELS.smartExtraction,
      ...aiOptions
    };

    // 检查缓存
    const cached = aiCache.get(url, html);
    if (cached) {
      console.log('AI HTML extraction found in cache');
      return cached;
    }

    try {
      const result = await this.langchainClient.extractFromHTML(html, url, options.model);
      
      if (!result.success || !result.data) {
        throw new Error(result.error || 'AI extraction failed');
      }

      const parsedContent: ParsedContent = {
        title: result.data.title,
        content: result.data.content,
        images: this.filterImages(result.data.images || []),
        author: result.data.author,
        publishedAt: result.data.publishedAt,
        platform: this.platform,
        originalUrl: url,
      };

      // 缓存结果
      const enhancedResult: AIEnhancedContent = {
        ...parsedContent,
        aiEnhanced: true,
      };
      aiCache.set(url, enhancedResult, html);

      return parsedContent;

    } catch (error) {
      throw new Error(`AI HTML extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // 添加摘要
  private async addSummary(
    content: AIEnhancedContent, 
    text: string, 
    options: AIOptions
  ): Promise<void> {
    try {
      const result = await this.langchainClient.generateSummary(text, options.model);
      if (result.success && result.data) {
        content.summary = result.data;
      }
    } catch (error) {
      console.warn('Failed to generate summary:', error);
    }
  }

  // 添加优化标题
  private async addOptimizedTitle(
    content: AIEnhancedContent,
    title: string,
    text: string,
    options: AIOptions
  ): Promise<void> {
    try {
      const result = await this.langchainClient.optimizeTitle(title, text, options.model);
      if (result.success && result.data) {
        content.optimizedTitle = result.data;
      }
    } catch (error) {
      console.warn('Failed to optimize title:', error);
    }
  }

  // 添加分类信息
  private async addCategorization(
    content: AIEnhancedContent,
    text: string,
    options: AIOptions
  ): Promise<void> {
    try {
      const result = await this.langchainClient.categorizeContent(text, options.model);
      if (result.success && result.data) {
        content.contentType = result.data.contentType as any;
        content.categories = result.data.categories;
        content.tags = result.data.tags;
      }
    } catch (error) {
      console.warn('Failed to categorize content:', error);
    }
  }

  // 批量处理多个AI任务
  async batchEnhance(
    contents: ParsedContent[],
    aiOptions?: AIOptions
  ): Promise<AIEnhancedContent[]> {
    const results = await Promise.allSettled(
      contents.map(content => this.enhance(content, aiOptions))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.warn(`Batch enhance failed for content ${index}:`, result.reason);
        // 返回未增强的内容
        return {
          ...contents[index],
          aiEnhanced: false,
        };
      }
    });
  }

  // 检查AI功能可用性
  isAIAvailable(): boolean {
    return this.langchainClient.isAvailable();
  }

  // 获取可用的AI模型
  getAvailableModels() {
    return this.langchainClient.getAvailableModels();
  }

  // 获取缓存统计
  getCacheStats() {
    return aiCache.getStats();
  }

  // 清理缓存
  clearCache(urlPrefix?: string) {
    if (urlPrefix) {
      return aiCache.deleteByUrlPrefix(urlPrefix);
    } else {
      aiCache.clear();
    }
  }
}