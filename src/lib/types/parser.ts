// 解析器相关类型定义

export interface ParsedContent {
  title: string;
  content: string;
  images: string[];
  author?: string;
  publishedAt?: Date;
  platform: PlatformType;
  originalUrl: string;
}

export interface ParseResult {
  success: boolean;
  data?: ParsedContent;
  error?: string;
  ios_url?: string;
  parsed_at: Date;
  fallback?: FallbackInfo;
}

export interface FallbackInfo {
  reason: string;
  strategy: 'preloadedHtml' | 'ofetch' | 'manual';
  iosShortcutSuggestion?: string;
  environment: string;
}

export interface ParserOptions {
  timeout?: number;
  userAgent?: string;
  headers?: Record<string, string>;
  usePlaywright?: boolean;
  preloadedHtml?: string; // iOS快捷指令预取的HTML内容
}

export type PlatformType = 'xiaohongshu' | 'bilibili' | 'wechat' | 'unknown';

export type OutputFormat = 'flomo' | 'notes' | 'raw';

export interface ParseRequest {
  url: string;
  output_format?: OutputFormat;
  options?: ParserOptions;
  ai_enhance?: boolean;        // 是否启用AI增强
  ai_options?: {
    enable_summary?: boolean;           // 生成摘要
    enable_title_optimization?: boolean; // 优化标题
    enable_categorization?: boolean;     // 内容分类
    model?: string;                      // AI模型选择
  };
}

export abstract class BaseParser {
  abstract platform: PlatformType;
  abstract canParse(url: string): boolean;
  abstract parse(url: string, options?: ParserOptions): Promise<ParsedContent>;
}

export interface IOSFormatter {
  formatFlomo(content: ParsedContent): string;
  formatNotes(content: ParsedContent): string;
}