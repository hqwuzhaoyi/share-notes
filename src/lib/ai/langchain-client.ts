// LangChain客户端封装
import { ChatOpenAI } from '@langchain/openai';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';
import { OutputFixingParser } from 'langchain/output_parsers';
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { AIModel, AITaskResult } from '../types/ai';
import { AI_CONFIG, getAIConfig, MODEL_COSTS } from './config';
import { z } from 'zod';

// 分类结果Schema
const CategorizationSchema = z.object({
  contentType: z.string(),
  categories: z.array(z.string()).max(2),
  tags: z.array(z.string()).max(5),
});

// HTML提取结果Schema
const ExtractionSchema = z.object({
  title: z.string().nullable(),
  content: z.string().nullable(),
  images: z.array(z.string()),
  author: z.string().nullable(),
  publishedAt: z.string().nullable(),
});

export class LangChainClient {
  private models: Map<AIModel, ChatOpenAI> = new Map();
  private config = getAIConfig();

  constructor() {
    this.initializeModels();
  }

  private initializeModels() {
    // 初始化自定义LLM模型（优先）
    if (this.config.llmApiKey && this.config.llmApiBaseUrl && this.config.llmModel) {
      console.log(`Initializing custom LLM: ${this.config.llmModel} at ${this.config.llmApiBaseUrl}`);
      
      // 使用自定义LLM配置
      this.models.set('qwen-plus' as AIModel, new ChatOpenAI({
        apiKey: this.config.llmApiKey,
        model: this.config.llmModel,
        configuration: {
          baseURL: this.config.llmApiBaseUrl,
        },
        temperature: 0.1,
        maxTokens: AI_CONFIG.MAX_TOKENS['qwen-plus'],
        timeout: 30000,
      }));
      
      return; // 只使用自定义LLM
    }
    
    // 回退到OpenAI（如果没有自定义LLM配置）
    if (this.config.openaiApiKey) {
      console.log('Initializing OpenAI models...');
      const openaiModels: AIModel[] = ['gpt-3.5-turbo', 'gpt-4o-mini', 'gpt-4o'];
      
      for (const model of openaiModels) {
        this.models.set(model, new ChatOpenAI({
          apiKey: this.config.openaiApiKey,
          model: model,
          temperature: 0.1,
          maxTokens: AI_CONFIG.MAX_TOKENS[model],
          timeout: 30000,
        }));
      }
    } else {
      console.warn('No API keys found. AI features will be disabled.');
    }
  }

  private getModel(model: AIModel): ChatOpenAI | null {
    return this.models.get(model) || null;
  }

  private estimateCost(inputTokens: number, outputTokens: number, model: AIModel): number {
    const costs = MODEL_COSTS[model];
    if (!costs) return 0;
    
    const inputCost = (inputTokens / 1000) * costs.input;
    const outputCost = (outputTokens / 1000) * costs.output;
    
    return inputCost + outputCost;
  }

  private async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries = AI_CONFIG.RETRY.MAX_ATTEMPTS
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < maxRetries) {
          const delay = AI_CONFIG.RETRY.DELAY_MS * Math.pow(AI_CONFIG.RETRY.BACKOFF_MULTIPLIER, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
          console.warn(`AI request failed (attempt ${attempt}), retrying in ${delay}ms:`, error);
        }
      }
    }
    
    throw lastError || new Error('Max retry attempts reached');
  }

  // 生成摘要
  async generateSummary(
    content: string,
    model: AIModel = AI_CONFIG.DEFAULT_MODELS.summary
  ): Promise<AITaskResult<string>> {
    try {
      const llm = this.getModel(model);
      if (!llm) {
        return { success: false, error: `Model ${model} not available` };
      }

      const prompt = PromptTemplate.fromTemplate(AI_CONFIG.PROMPTS.SUMMARIZE);
      
      const result = await this.executeWithRetry(async () => {
        const formattedPrompt = await prompt.format({ content });
        const response = await llm.invoke(formattedPrompt);
        return response.content as string;
      });

      return {
        success: true,
        data: result.trim(),
        model,
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        model,
      };
    }
  }

  // 优化标题
  async optimizeTitle(
    title: string,
    content: string,
    model: AIModel = AI_CONFIG.DEFAULT_MODELS.titleOptimization
  ): Promise<AITaskResult<string>> {
    try {
      const llm = this.getModel(model);
      if (!llm) {
        return { success: false, error: `Model ${model} not available` };
      }

      const prompt = PromptTemplate.fromTemplate(AI_CONFIG.PROMPTS.OPTIMIZE_TITLE);
      
      const result = await this.executeWithRetry(async () => {
        const formattedPrompt = await prompt.format({ 
          title, 
          content: content.substring(0, 500) // 限制内容长度以节省token
        });
        const response = await llm.invoke(formattedPrompt);
        return response.content as string;
      });

      return {
        success: true,
        data: result.trim(),
        model,
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        model,
      };
    }
  }

  // 内容分类
  async categorizeContent(
    content: string,
    model: AIModel = AI_CONFIG.DEFAULT_MODELS.categorization
  ): Promise<AITaskResult<{ contentType: string; categories: string[]; tags: string[] }>> {
    try {
      const llm = this.getModel(model);
      if (!llm) {
        return { success: false, error: `Model ${model} not available` };
      }

      // 使用结构化输出解析器
      const outputParser = StructuredOutputParser.fromZodSchema(CategorizationSchema);
      const formatInstructions = outputParser.getFormatInstructions();

      // 创建修复解析器
      const fixingParser = OutputFixingParser.fromLLM(llm, outputParser);

      // 更新的提示词模板，去掉格式错误的JSON示例
      const promptTemplate = PromptTemplate.fromTemplate(`
请分析以下内容并提供分类和标签：

内容：{content}

{format_instructions}

要求：
1. contentType从预定义类型中选择最合适的（article/video/tutorial/review/news/recipe/travel/lifestyle/technology/entertainment/other）
2. categories不超过2个，代表主要分类
3. tags不超过5个，代表具体标签
4. 使用中文
      `);

      // 创建链式处理流程
      const chain = RunnableSequence.from([
        promptTemplate,
        llm,
        fixingParser,
      ]).withRetry({
        stopAfterAttempt: 2,
        onFailedAttempt: (err: any) => {
          console.warn(`[AI] Categorization attempt failed: ${err.message}. Retrying...`);
          return new Promise((resolve) => setTimeout(resolve, 1000));
        },
      });

      const result = await this.executeWithRetry(async () => {
        return await chain.invoke({
          content: content.substring(0, 1000),
          format_instructions: formatInstructions,
        });
      });

      return {
        success: true,
        data: result,
        model,
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        model,
      };
    }
  }

  // 智能HTML提取
  async extractFromHTML(
    html: string,
    url: string,
    model: AIModel = AI_CONFIG.DEFAULT_MODELS.smartExtraction
  ): Promise<AITaskResult<any>> {
    try {
      const llm = this.getModel(model);
      if (!llm) {
        return { success: false, error: `Model ${model} not available` };
      }

      const prompt = PromptTemplate.fromTemplate(AI_CONFIG.PROMPTS.EXTRACT_HTML);
      
      const result = await this.executeWithRetry(async () => {
        const formattedPrompt = await prompt.format({ 
          html: html.substring(0, 8000), // 限制HTML长度以节省token
          url 
        });
        const response = await llm.invoke(formattedPrompt);
        return response.content as string;
      });

      // 解析JSON结果
      try {
        const parsed = JSON.parse(result);
        const validated = ExtractionSchema.parse(parsed);
        
        return {
          success: true,
          data: {
            title: validated.title || '未知标题',
            content: validated.content || '无法提取内容',
            images: validated.images || [],
            author: validated.author,
            publishedAt: validated.publishedAt ? new Date(validated.publishedAt) : undefined,
          },
          model,
        };
      } catch (parseError) {
        return {
          success: false,
          error: `Failed to parse extraction result: ${parseError}`,
          model,
        };
      }

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        model,
      };
    }
  }

  // 检查AI是否可用
  isAvailable(): boolean {
    return this.config.enableAI && this.models.size > 0;
  }

  // 获取可用模型列表
  getAvailableModels(): AIModel[] {
    return Array.from(this.models.keys());
  }
}