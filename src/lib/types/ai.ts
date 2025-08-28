// AI相关类型定义
import { ParsedContent } from './parser';

export interface AIEnhancedContent extends ParsedContent {
  summary?: string;
  optimizedTitle?: string;
  categories?: string[];
  tags?: string[];
  contentType?: ContentType;
  aiEnhanced: boolean;
}

export type ContentType = 
  | 'article'      // 文章
  | 'video'        // 视频
  | 'image'        // 图片
  | 'tutorial'     // 教程
  | 'review'       // 评测
  | 'news'         // 新闻
  | 'recipe'       // 食谱
  | 'travel'       // 旅行
  | 'lifestyle'    // 生活方式
  | 'technology'   // 科技
  | 'entertainment'// 娱乐
  | 'other';       // 其他

export interface AIOptions {
  enableSummary?: boolean;       // 是否生成摘要
  enableTitleOptimization?: boolean; // 是否优化标题
  enableCategorization?: boolean;    // 是否分类
  enableSmartExtraction?: boolean;   // 是否智能提取
  model?: AIModel;                   // 使用的AI模型
  maxTokens?: number;                // 最大token数
}

export type AIModel = 
  | 'gpt-3.5-turbo'     // 快速便宜
  | 'gpt-4o-mini'       // 平衡性能和成本
  | 'gpt-4o'            // 最高质量
  | 'claude-3-haiku'    // Anthropic快速模型
  | 'claude-3-sonnet'   // Anthropic平衡模型
  | 'qwen-plus';        // 阿里云通义千问Plus

export interface AICache {
  url: string;
  contentHash: string;
  result: AIEnhancedContent;
  createdAt: Date;
  expiresAt: Date;
}

export interface AITaskResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  tokensUsed?: number;
  model?: AIModel;
}

// AI任务接口
export interface AITasks {
  summarize(text: string, options?: AIOptions): Promise<AITaskResult<string>>;
  optimizeTitle(title: string, content: string, options?: AIOptions): Promise<AITaskResult<string>>;
  categorize(content: string, options?: AIOptions): Promise<AITaskResult<string[]>>;
  extractFromHTML(html: string, url: string, options?: AIOptions): Promise<AITaskResult<ParsedContent>>;
  enhance(content: ParsedContent, options?: AIOptions): Promise<AITaskResult<AIEnhancedContent>>;
}