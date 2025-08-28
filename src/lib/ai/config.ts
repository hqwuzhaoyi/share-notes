// AI配置文件
import { AIModel } from '../types/ai';

export const AI_CONFIG = {
  // 默认模型配置
  DEFAULT_MODELS: {
    summary: 'qwen-plus' as AIModel,
    titleOptimization: 'qwen-plus' as AIModel,
    categorization: 'qwen-plus' as AIModel,
    smartExtraction: 'qwen-plus' as AIModel,
    fallback: 'qwen-plus' as AIModel,
  },

  // Token限制
  MAX_TOKENS: {
    'gpt-3.5-turbo': 4096,
    'gpt-4o-mini': 8192,
    'gpt-4o': 8192,
    'claude-3-haiku': 4096,
    'claude-3-sonnet': 8192,
    'qwen-plus': 8192,
  },

  // 成本控制
  COST_OPTIMIZATION: {
    // 内容长度阈值，超过则使用更便宜的模型
    CONTENT_LENGTH_THRESHOLD: 2000,
    // 每日最大成本（美元）
    DAILY_COST_LIMIT: 10,
    // 单次请求最大成本（美元）
    MAX_COST_PER_REQUEST: 0.5,
  },

  // 缓存配置
  CACHE: {
    // 缓存过期时间（小时）
    EXPIRES_HOURS: 24,
    // 最大缓存条目数
    MAX_ENTRIES: 1000,
    // 是否启用缓存
    ENABLED: true,
  },

  // 提示词模板
  PROMPTS: {
    SUMMARIZE: `请为以下内容生成一个简洁的摘要，不超过150字：

内容：
{content}

要求：
1. 提取关键信息和要点
2. 语言简洁明了
3. 适合在笔记应用中阅读
4. 保持原文的主要观点`,

    OPTIMIZE_TITLE: `请为以下内容优化标题，使其更适合在flomo或备忘录应用中使用：

原标题：{title}

内容概述：{content}

要求：
1. 标题应该简洁有力，不超过30个字符
2. 能够准确概括内容主题
3. 适合在移动设备上阅读
4. 避免过于营销化的词汇
5. 只返回优化后的标题，不要其他内容`,

    CATEGORIZE: `请分析以下内容并提供分类和标签：

内容：{content}

请以JSON格式返回：
{
  "contentType": "文章类型（article/video/tutorial/review等）",
  "categories": ["主要分类1", "主要分类2"],
  "tags": ["标签1", "标签2", "标签3"]
}

要求：
1. contentType从预定义类型中选择最合适的
2. categories不超过2个，代表主要分类
3. tags不超过5个，代表具体标签
4. 使用中文`,

    EXTRACT_HTML: `请从以下HTML内容中提取结构化信息：

HTML内容：
{html}

URL：{url}

请以JSON格式返回：
{
  "title": "页面标题",
  "content": "主要内容文本",
  "images": ["图片URL1", "图片URL2"],
  "author": "作者（如果有）",
  "publishedAt": "发布时间（如果有）"
}

要求：
1. 提取最重要的内容文本
2. 过滤掉广告、导航等无关内容
3. 图片URL应该是完整的URL
4. 如果某项信息不存在，返回null`,
  },

  // 重试配置
  RETRY: {
    MAX_ATTEMPTS: 3,
    DELAY_MS: 1000,
    BACKOFF_MULTIPLIER: 2,
  },
} as const;

// 环境变量配置
export const getAIConfig = () => ({
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  llmApiKey: process.env.LLM_API_KEY,
  llmApiBaseUrl: process.env.LLM_API_BASE_URL,
  llmModel: process.env.LLM_MODEL,
  enableAI: process.env.ENABLE_AI !== 'false',
  debugMode: process.env.AI_DEBUG === 'true',
});

// 模型成本估算（每1K tokens的成本，美元）
export const MODEL_COSTS = {
  'gpt-3.5-turbo': {
    input: 0.0015,
    output: 0.002,
  },
  'gpt-4o-mini': {
    input: 0.00015,
    output: 0.0006,
  },
  'gpt-4o': {
    input: 0.005,
    output: 0.015,
  },
  'claude-3-haiku': {
    input: 0.00025,
    output: 0.00125,
  },
  'claude-3-sonnet': {
    input: 0.003,
    output: 0.015,
  },
  'qwen-plus': {
    input: 0.0004,
    output: 0.0012,
  },
} as const;