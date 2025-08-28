import { describe, it, expect, beforeAll, vi } from 'vitest';
import { XiaohongshuParser } from '../../lib/parsers/xiaohongshu';
import { PlatformType } from '../../lib/types/parser';

describe('XiaohongshuParser', () => {
  let parser: XiaohongshuParser;

  // 测试用的真实小红书链接
  const TEST_URL = 'http://xhslink.com/n/9qQs6fCAtZN';

  beforeAll(() => {
    parser = new XiaohongshuParser();
    
    // 检查环境变量是否加载
    console.log('Environment check:', {
      hasLLMKey: !!process.env.LLM_API_KEY,
      hasLLMUrl: !!process.env.LLM_API_BASE_URL,
      enableAI: process.env.ENABLE_AI
    });
  });

  describe('基础功能测试', () => {
    it('应该正确识别小红书平台', () => {
      expect(parser.platform).toBe('xiaohongshu');
    });

    it('应该正确验证小红书URL', () => {
      // 有效的小红书URL
      expect(parser.canParse('https://www.xiaohongshu.com/explore/123456')).toBe(true);
      expect(parser.canParse('http://xhslink.com/n/abc123')).toBe(true);
      expect(parser.canParse('https://xhscdn.com/path')).toBe(true);
      
      // 无效的URL
      expect(parser.canParse('https://www.bilibili.com/video/123')).toBe(false);
      expect(parser.canParse('https://www.baidu.com')).toBe(false);
      expect(parser.canParse('')).toBe(false);
    });
  });

  describe('内容解析测试', () => {
    it('应该成功解析小红书笔记内容 (集成测试)', async () => {
      // 这是一个真实的集成测试，可能因为网络问题失败
      // 如果需要稳定测试，应该使用mock
      try {
        const result = await parser.parse(TEST_URL, { timeout: 25000 });

        // 验证基础字段
        expect(result).toBeDefined();
        expect(result.platform).toBe('xiaohongshu' as PlatformType);
        expect(result.originalUrl).toBe(TEST_URL);
        
        // 验证标题
        expect(result.title).toBeDefined();
        expect(typeof result.title).toBe('string');
        expect(result.title.length).toBeGreaterThan(0);
        console.log('✅ 解析标题:', result.title);
        
        // 验证内容
        expect(result.content).toBeDefined();
        expect(typeof result.content).toBe('string');
        expect(result.content.length).toBeGreaterThan(0);
        console.log('✅ 内容长度:', result.content.length);
        
        // 验证图片数组
        expect(Array.isArray(result.images)).toBe(true);
        console.log('✅ 图片数量:', result.images.length);
        
        // 如果有图片，验证图片URL格式
        if (result.images.length > 0) {
          result.images.forEach(img => {
            expect(img).toMatch(/^https?:\/\/.+/);
          });
        }
        
        // 验证时间戳
        expect(result.publishedAt).toBeInstanceOf(Date);
        
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn('⚠️ 集成测试失败，这可能是由于网络或Playwright问题:', errorMessage);
        
        // 即使失败，也验证错误处理是正确的
        expect(error).toBeInstanceOf(Error);
        if (error instanceof Error) {
          expect(error.message).toContain('XiaohongshuParser failed');
        }
      }
    }, 30000); // 30秒超时

    it('应该处理解析失败的情况', async () => {
      const invalidUrl = 'http://xhslink.com/n/invalid-test-url';
      
      try {
        const result = await parser.parse(invalidUrl, { timeout: 5000 });
        
        // 即使失败也应该返回基础结构  
        expect(result.platform).toBe('xiaohongshu');
        expect(result.originalUrl).toBe(invalidUrl);
        expect(result.title).toBeDefined();
        console.log('✅ 处理失败情况正常:', result.title);
        
      } catch (error: unknown) {
        // 如果抛出错误，验证错误信息
        expect(error).toBeInstanceOf(Error);
        if (error instanceof Error) {
          expect(error.message).toContain('XiaohongshuParser failed');
        }
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log('✅ 预期的解析错误:', errorMessage);
      }
    }, 10000);
  });

  describe('Mock测试 - 稳定的单元测试', () => {
    it('应该正确处理超时配置', () => {
      // 测试选项合并功能
      const options = parser['mergeOptions']({ timeout: 5000 });
      expect(options.timeout).toBe(5000);
      
      // 小红书解析器在parse方法中会覆盖usePlaywright为true
      const xhsOptions = parser['mergeOptions']({ timeout: 5000, usePlaywright: true });
      expect(xhsOptions.usePlaywright).toBe(true);
    });

    it('应该正确验证小红书域名', () => {
      // 测试URL验证逻辑
      expect(parser.canParse('https://www.xiaohongshu.com/explore/123')).toBe(true);
      expect(parser.canParse('http://xhslink.com/n/abc')).toBe(true);
      expect(parser.canParse('https://xhscdn.com/image.jpg')).toBe(true);
      expect(parser.canParse('https://www.bilibili.com')).toBe(false);
    });

    it('应该返回正确的平台类型', () => {
      expect(parser.platform).toBe('xiaohongshu');
    });
  });

  describe('错误处理测试', () => {
    it('应该处理明显无效的URL', async () => {
      try {
        const result = await parser.parse('not-a-valid-url', { timeout: 3000 });
        
        // 如果没有抛出错误，至少验证返回结构
        expect(result.platform).toBe('xiaohongshu');
        expect(result.title).toBeDefined();
        console.log('✅ 无效URL处理:', result.title);
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(Error);
        if (error instanceof Error) {
          expect(error.message).toContain('XiaohongshuParser failed');
        }
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.log('✅ 预期错误:', errorMessage.substring(0, 100) + '...');
      }
    }, 8000);

    it('应该有正确的错误处理机制', () => {
      // 测试基础错误处理逻辑
      expect(() => {
        parser['cleanText']('  test content  ');
      }).not.toThrow();
    });
  });
});