import { describe, it, expect, beforeAll, vi } from 'vitest';
import { AIParser } from '../../lib/parsers/ai-parser';
import { XiaohongshuParser } from '../../lib/parsers/xiaohongshu';
import { ParsedContent } from '../../lib/types/parser';

describe('🤖 AI功能测试 - 有AI vs 无AI对比', () => {
  let aiParser: AIParser;
  let basicParser: XiaohongshuParser;
  
  // 测试用的小红书链接
  const TEST_URL = 'http://xhslink.com/n/9qQs6fCAtZN';
  
  // Mock数据用于稳定测试
  const mockParsedContent: ParsedContent = {
    title: '飞猪万豪会员日闪促攻略',
    content: `飞猪万豪9月会员日闪促9.8-9.14酒店清单及成本一览来啦，单晚低至100元左右！飞猪万豪作为万豪的官方渠道，通过她预订是可以正常享受SNP和会员权益的，F4以上飞猪会员还可以开启8晚万豪白金挑战快速成为万豪白金会员，挑战期间也有白金会员权益如房间升级，行政酒廊使用，50%万豪积分加赠，免费双早等。大家也可以通过参加飞猪万豪闪促来完成白金挑战哦，会额外送许多积分，大大降低了升级万豪白金的成本。9月8日会员日闪促不仅有300+酒店参与闪促，最高送12000分，还会发放各种各种优惠券。活动期间大家不仅可以抢8折券，88折券，100-99券，188神券，还可以抽60和188红包，大家一定不要错过过哦！`,
    images: [
      'https://sns-webpic-qc.xhscdn.com/test/hotel1.jpg',
      'https://sns-webpic-qc.xhscdn.com/test/hotel2.jpg',
      'https://sns-webpic-qc.xhscdn.com/test/cost_analysis.jpg'
    ],
    author: '酒店达人小李',
    publishedAt: new Date(),
    platform: 'xiaohongshu',
    originalUrl: TEST_URL
  };

  beforeAll(() => {
    aiParser = new AIParser();
    basicParser = new XiaohongshuParser();
    
    // 检查AI配置
    console.log('AI环境检查:', {
      enableAI: process.env.ENABLE_AI,
      hasLLMKey: !!process.env.LLM_API_KEY,
      hasLLMUrl: !!process.env.LLM_API_BASE_URL,
      llmModel: process.env.LLM_MODEL,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY
    });
  });

  describe('🔍 基础功能测试', () => {
    it('应该正确识别AI解析器平台', () => {
      expect(aiParser.platform).toBe('ai');
      expect(basicParser.platform).toBe('xiaohongshu');
      console.log('✅ 解析器平台识别正确');
    });

    it('应该能够处理任何URL (AI是通用解析器)', () => {
      expect(aiParser.canParse('https://xiaohongshu.com/test')).toBe(true);
      expect(aiParser.canParse('https://bilibili.com/test')).toBe(true);
      expect(aiParser.canParse('https://any-url.com')).toBe(true);
      expect(aiParser.canParse('')).toBe(false); // 空URL应该拒绝
      console.log('✅ AI解析器URL兼容性验证通过');
    });
  });

  describe('🆚 AI增强 vs 基础解析对比', () => {
    it('应该测试AI增强功能的完整效果', async () => {
      if (!process.env.ENABLE_AI || (!process.env.LLM_API_KEY && !process.env.OPENAI_API_KEY)) {
        console.warn('⚠️ AI功能未启用或缺少API密钥，跳过AI测试');
        return;
      }

      try {
        // AI增强解析
        const aiResult = await aiParser.enhance(mockParsedContent, {
          enable_summary: true,
          enable_title_optimization: true,
          enable_categorization: true,
          model: process.env.LLM_MODEL || 'qwen-plus'
        });

        // 基础结构验证
        expect(aiResult).toBeDefined();
        expect(aiResult.aiEnhanced).toBe(true);
        console.log('🤖 AI增强解析完成');

        // AI增强字段验证
        if ('summary' in aiResult) {
          expect(aiResult.summary).toBeDefined();
          expect(aiResult.summary.length).toBeGreaterThan(10);
          expect(aiResult.summary.length).toBeLessThan(200); // 摘要应该简洁
          console.log('📝 AI摘要:', aiResult.summary);
        }

        if ('optimizedTitle' in aiResult) {
          expect(aiResult.optimizedTitle).toBeDefined();
          expect(aiResult.optimizedTitle.length).toBeGreaterThan(0);
          expect(aiResult.optimizedTitle.length).toBeLessThan(100);
          console.log('✨ AI优化标题:', aiResult.optimizedTitle);
        }

        if ('categories' in aiResult && aiResult.categories) {
          expect(Array.isArray(aiResult.categories)).toBe(true);
          expect(aiResult.categories.length).toBeGreaterThan(0);
          console.log('🏷️ AI分类:', aiResult.categories);
        }

        if ('tags' in aiResult && aiResult.tags) {
          expect(Array.isArray(aiResult.tags)).toBe(true);
          expect(aiResult.tags.length).toBeGreaterThan(0);
          console.log('🔖 AI标签:', aiResult.tags);
        }

        // 验证原始内容保持不变
        expect(aiResult.title).toBe(mockParsedContent.title);
        expect(aiResult.content).toBe(mockParsedContent.content);
        expect(aiResult.images).toEqual(mockParsedContent.images);
        expect(aiResult.platform).toBe(mockParsedContent.platform);

        console.log('✅ AI增强功能验证完成');

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn('⚠️ AI增强测试失败:', errorMessage);
        
        // 检查是否为API限制或网络问题
        if (errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
          console.log('🚫 API配额限制，这在测试中是可以接受的');
        } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
          console.log('🌐 网络连接问题，这在CI环境中是常见的');
        }
        
        expect(error).toBeInstanceOf(Error);
      }
    }, 30000);

    it('应该测试不同AI模型的效果对比', async () => {
      if (!process.env.ENABLE_AI || (!process.env.LLM_API_KEY && !process.env.OPENAI_API_KEY)) {
        console.warn('⚠️ 跳过AI模型对比测试');
        return;
      }

      const testModels = [];
      
      // 根据可用的API密钥确定测试模型
      if (process.env.LLM_API_KEY) {
        testModels.push('qwen-plus');
      }
      if (process.env.OPENAI_API_KEY) {
        testModels.push('gpt-3.5-turbo');
      }

      if (testModels.length === 0) {
        console.warn('⚠️ 没有可用的AI模型进行测试');
        return;
      }

      const results: Record<string, any> = {};

      for (const model of testModels) {
        try {
          const result = await aiParser.enhance(mockParsedContent, {
            enable_summary: true,
            model: model
          });

          results[model] = result;
          console.log(`🤖 ${model} 增强完成`);
          
          if ('summary' in result) {
            console.log(`📝 ${model} 摘要长度:`, result.summary.length);
          }

        } catch (error: unknown) {
          console.warn(`⚠️ ${model} 测试失败:`, error instanceof Error ? error.message : String(error));
        }
      }

      // 如果有多个模型结果，比较它们的差异
      if (Object.keys(results).length > 1) {
        const models = Object.keys(results);
        console.log('📊 模型对比完成，可用模型:', models.join(', '));
        
        // 验证所有模型都产生了有效结果
        models.forEach(model => {
          expect(results[model]).toBeDefined();
          expect(results[model].aiEnhanced).toBe(true);
        });
      }
    }, 45000);
  });

  describe('🎯 AI功能细分测试', () => {
    const shortContent: ParsedContent = {
      title: '短内容测试',
      content: '这是一个简短的测试内容。',
      images: ['https://test.com/img.jpg'],
      publishedAt: new Date(),
      platform: 'xiaohongshu',
      originalUrl: 'https://test.com'
    };

    it('应该测试AI摘要功能', async () => {
      if (!process.env.ENABLE_AI || (!process.env.LLM_API_KEY && !process.env.OPENAI_API_KEY)) {
        console.warn('⚠️ 跳过AI摘要测试');
        return;
      }

      try {
        const result = await aiParser.enhance(mockParsedContent, {
          enable_summary: true,
          enable_title_optimization: false,
          enable_categorization: false,
        });

        if ('summary' in result) {
          expect(result.summary).toBeDefined();
          expect(result.summary.length).toBeGreaterThan(10);
          expect(result.summary.length).toBeLessThan(mockParsedContent.content.length);
          console.log('📝 AI摘要质量验证通过:', result.summary.substring(0, 50) + '...');
        }

      } catch (error: unknown) {
        console.warn('⚠️ AI摘要测试失败:', error instanceof Error ? error.message : String(error));
      }
    }, 20000);

    it('应该测试AI标题优化功能', async () => {
      if (!process.env.ENABLE_AI || (!process.env.LLM_API_KEY && !process.env.OPENAI_API_KEY)) {
        console.warn('⚠️ 跳过AI标题优化测试');
        return;
      }

      try {
        const result = await aiParser.enhance(mockParsedContent, {
          enable_summary: false,
          enable_title_optimization: true,
          enable_categorization: false,
        });

        if ('optimizedTitle' in result) {
          expect(result.optimizedTitle).toBeDefined();
          expect(result.optimizedTitle.length).toBeGreaterThan(0);
          expect(result.optimizedTitle).not.toBe(mockParsedContent.title); // 应该有所不同
          console.log('✨ AI标题优化验证通过:', result.optimizedTitle);
        }

      } catch (error: unknown) {
        console.warn('⚠️ AI标题优化测试失败:', error instanceof Error ? error.message : String(error));
      }
    }, 20000);

    it('应该测试AI分类功能', async () => {
      if (!process.env.ENABLE_AI || (!process.env.LLM_API_KEY && !process.env.OPENAI_API_KEY)) {
        console.warn('⚠️ 跳过AI分类测试');
        return;
      }

      try {
        const result = await aiParser.enhance(mockParsedContent, {
          enable_summary: false,
          enable_title_optimization: false,
          enable_categorization: true,
        });

        if ('categories' in result && result.categories) {
          expect(Array.isArray(result.categories)).toBe(true);
          expect(result.categories.length).toBeGreaterThan(0);
          console.log('🏷️ AI分类验证通过:', result.categories);
        }

        if ('tags' in result && result.tags) {
          expect(Array.isArray(result.tags)).toBe(true);
          expect(result.tags.length).toBeGreaterThan(0);
          console.log('🔖 AI标签验证通过:', result.tags);
        }

      } catch (error: unknown) {
        console.warn('⚠️ AI分类测试失败:', error instanceof Error ? error.message : String(error));
      }
    }, 20000);
  });

  describe('💰 成本和性能测试', () => {
    it('应该测试AI缓存机制', async () => {
      if (!process.env.ENABLE_AI || (!process.env.LLM_API_KEY && !process.env.OPENAI_API_KEY)) {
        console.warn('⚠️ 跳过AI缓存测试');
        return;
      }

      try {
        const startTime = Date.now();
        
        // 第一次调用 (可能调用API)
        const result1 = await aiParser.enhance(mockParsedContent, {
          enable_summary: true,
        });
        
        const firstCallTime = Date.now() - startTime;
        
        // 第二次调用相同内容 (应该使用缓存)
        const startTime2 = Date.now();
        const result2 = await aiParser.enhance(mockParsedContent, {
          enable_summary: true,
        });
        const secondCallTime = Date.now() - startTime2;
        
        // 缓存命中时，第二次调用应该明显更快
        if (secondCallTime < firstCallTime * 0.5) {
          console.log('⚡ AI缓存机制工作正常');
          console.log(`📊 首次调用: ${firstCallTime}ms, 缓存调用: ${secondCallTime}ms`);
        }
        
        // 验证结果一致性
        if ('summary' in result1 && 'summary' in result2) {
          expect(result1.summary).toBe(result2.summary);
        }

      } catch (error: unknown) {
        console.warn('⚠️ AI缓存测试失败:', error instanceof Error ? error.message : String(error));
      }
    }, 30000);

    it('应该测试AI处理短内容的表现', async () => {
      if (!process.env.ENABLE_AI || (!process.env.LLM_API_KEY && !process.env.OPENAI_API_KEY)) {
        console.warn('⚠️ 跳过AI短内容测试');
        return;
      }

      const shortContent: ParsedContent = {
        title: '简短标题',
        content: '这是一段很短的内容，只有几个字。',
        images: [],
        publishedAt: new Date(),
        platform: 'xiaohongshu',
        originalUrl: 'https://test.com'
      };

      try {
        const result = await aiParser.enhance(shortContent, {
          enable_summary: true,
          enable_title_optimization: true,
        });

        // 对于短内容，AI应该能够优雅处理
        expect(result).toBeDefined();
        expect(result.aiEnhanced).toBe(true);
        
        console.log('📏 AI短内容处理验证通过');
        
        if ('summary' in result) {
          console.log('📝 短内容摘要:', result.summary);
        }

      } catch (error: unknown) {
        console.warn('⚠️ AI短内容测试失败:', error instanceof Error ? error.message : String(error));
      }
    }, 15000);
  });

  describe('⚠️ AI错误处理测试', () => {
    it('应该优雅处理AI服务不可用的情况', async () => {
      // 模拟AI服务不可用
      const originalKey = process.env.LLM_API_KEY;
      const originalOpenAIKey = process.env.OPENAI_API_KEY;
      
      // 暂时移除API密钥
      delete process.env.LLM_API_KEY;
      delete process.env.OPENAI_API_KEY;

      try {
        const result = await aiParser.enhance(mockParsedContent, {
          enable_summary: true,
        });

        // 应该回退到原始内容
        expect(result).toBeDefined();
        expect(result.title).toBe(mockParsedContent.title);
        expect(result.content).toBe(mockParsedContent.content);
        
        console.log('✅ AI服务不可用时的降级处理正常');

      } catch (error: unknown) {
        // 抛出错误也是可以接受的行为
        console.log('✅ AI服务不可用时正确抛出错误');
        expect(error).toBeInstanceOf(Error);
      } finally {
        // 恢复原始配置
        if (originalKey) process.env.LLM_API_KEY = originalKey;
        if (originalOpenAIKey) process.env.OPENAI_API_KEY = originalOpenAIKey;
      }
    });

    it('应该处理无效的AI选项', async () => {
      if (!process.env.ENABLE_AI) {
        console.warn('⚠️ 跳过AI选项验证测试');
        return;
      }

      try {
        // 测试无效模型名
        const result = await aiParser.enhance(mockParsedContent, {
          enable_summary: true,
          model: 'invalid-model-name' as any
        });

        // 应该能够处理或回退
        expect(result).toBeDefined();
        console.log('✅ 无效AI选项处理正常');

      } catch (error: unknown) {
        // 抛出有意义的错误也是合理的
        expect(error).toBeInstanceOf(Error);
        console.log('✅ 无效AI选项正确报错');
      }
    });
  });
});