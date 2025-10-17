// 解析器管理器
import { BaseParser, ParsedContent, ParserOptions, PlatformType } from '../types/parser';
import { AIEnhancedContent, AIOptions } from '../types/ai';
import { PlatformDetector } from '../utils/platform-detector';
import { URLValidator } from '../utils/url-validator';
import { XiaohongshuParser } from './xiaohongshu';
import { BilibiliParser } from './bilibili';
import { WechatParser } from './wechat';
import { OfetchParser } from './ofetch-parser';
import { AIParser } from './ai-parser';

export class ParserManager {
  private parsers: Map<PlatformType, BaseParser> = new Map();
  private fallbackParser: OfetchParser;
  private aiParser: AIParser;

  constructor() {
    // 注册平台专用解析器
    this.parsers.set('xiaohongshu', new XiaohongshuParser());
    this.parsers.set('bilibili', new BilibiliParser());
    this.parsers.set('wechat', new WechatParser());
    
    // 通用fallback解析器
    this.fallbackParser = new OfetchParser();
    
    // AI增强解析器
    this.aiParser = new AIParser();
  }

  async parse(url: string, options?: ParserOptions): Promise<ParsedContent> {
    // 验证URL
    if (!URLValidator.isValid(url)) {
      throw new Error('Invalid or unsafe URL');
    }

    // 清理URL
    const cleanUrl = URLValidator.sanitizeURL(url);
    
    // 检测平台
    const platform = PlatformDetector.detectPlatform(cleanUrl);
    
    // 获取对应的解析器
    const parser = this.parsers.get(platform);
    
    try {
      if (parser && parser.canParse(cleanUrl)) {
        // 使用专用解析器
        return await parser.parse(cleanUrl, options);
      } else {
        // 使用通用解析器
        const content = await this.fallbackParser.parse(cleanUrl, options);
        // 更新平台信息
        content.platform = platform;
        return content;
      }
    } catch (error) {
      // 如果专用解析器失败，尝试通用解析器
      if (parser) {
        try {
          console.warn(`Platform parser failed for ${platform}, falling back to generic parser`);
          const content = await this.fallbackParser.parse(cleanUrl, options);
          content.platform = platform;
          return content;
        } catch (fallbackError) {
          // 如果通用解析器也失败，尝试AI解析器作为最后的fallback
          if (this.aiParser.isAIAvailable()) {
            try {
              console.warn(`Generic parser also failed, trying AI extraction`);
              // 这里需要获取HTML内容来进行AI提取
              // 为简化起见，先抛出错误，实际使用中可以考虑实现这个功能
              throw new Error(`All traditional parsers failed. AI fallback requires HTML content.`);
            } catch (aiError) {
              throw new Error(`All parsers failed. Primary: ${error instanceof Error ? error.message : 'Unknown error'}. Fallback: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}. AI: ${aiError instanceof Error ? aiError.message : 'Unknown error'}`);
            }
          } else {
            throw new Error(`All parsers failed. Primary: ${error instanceof Error ? error.message : 'Unknown error'}. Fallback: ${fallbackError instanceof Error ? fallbackError.message : 'Unknown error'}`);
          }
        }
      } else {
        throw error;
      }
    }
  }

  // AI增强解析
  async parseWithAI(
    url: string, 
    options?: ParserOptions, 
    aiOptions?: AIOptions
  ): Promise<AIEnhancedContent> {
    // 先进行常规解析
    let content: ParsedContent;
    const rawContent = '';
    
    try {
      content = await this.parse(url, options);
    } catch (error) {
      // 如果常规解析失败，尝试AI直接从HTML提取
      if (this.aiParser.isAIAvailable()) {
        // 这里需要先获取HTML内容
        // 为了演示，我们抛出一个更明确的错误
        throw new Error(`Traditional parsing failed and AI HTML extraction requires implementation. Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } else {
        throw error;
      }
    }

    // 使用AI增强内容
    if (this.aiParser.isAIAvailable()) {
      return await this.aiParser.enhance(content, aiOptions, rawContent);
    } else {
      // AI不可用时，返回标记为未增强的内容
      return {
        ...content,
        aiEnhanced: false,
      };
    }
  }

  // 智能路由：根据内容复杂度选择解析策略
  async smartParse(
    url: string, 
    options?: ParserOptions
  ): Promise<ParsedContent | AIEnhancedContent> {
    const platform = PlatformDetector.detectPlatform(url);
    
    // 对于复杂平台或AI可用时，优先使用AI增强
    const complexPlatforms: PlatformType[] = ['xiaohongshu'];
    const shouldUseAI = complexPlatforms.includes(platform) && this.aiParser.isAIAvailable();
    
    if (shouldUseAI) {
      try {
        return await this.parseWithAI(url, options, { 
          enableSummary: true, 
          enableTitleOptimization: true,
          enableCategorization: true 
        });
      } catch (error) {
        console.warn('AI parsing failed, falling back to traditional parsing:', error);
        return await this.parse(url, options);
      }
    } else {
      return await this.parse(url, options);
    }
  }

  getSupportedPlatforms(): PlatformType[] {
    return Array.from(this.parsers.keys());
  }

  isSupported(url: string): boolean {
    return PlatformDetector.isSupported(url);
  }

  // AI功能相关方法
  isAIAvailable(): boolean {
    return this.aiParser.isAIAvailable();
  }

  getAIModels() {
    return this.aiParser.getAvailableModels();
  }

  getAICacheStats() {
    return this.aiParser.getCacheStats();
  }

  clearAICache(urlPrefix?: string) {
    return this.aiParser.clearCache(urlPrefix);
  }

  // 批量AI增强
  async batchEnhanceWithAI(
    contents: ParsedContent[], 
    aiOptions?: AIOptions
  ): Promise<AIEnhancedContent[]> {
    return this.aiParser.batchEnhance(contents, aiOptions);
  }
}

// 导出单例实例
export const parserManager = new ParserManager();

// 导出所有解析器类
export {
  XiaohongshuParser,
  BilibiliParser, 
  WechatParser,
  OfetchParser,
  AIParser
};