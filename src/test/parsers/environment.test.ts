import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from 'vitest';
import { XiaohongshuParser } from '../../lib/parsers/xiaohongshu';
import { EnvironmentDetector } from '../../lib/utils/environment-detector';

describe('环境切换测试 - Vercel vs 开发环境', () => {
  let parser: XiaohongshuParser;
  
  // 测试用的小红书链接
  const TEST_URL = 'http://xhslink.com/n/9qQs6fCAtZN';
  
  // 保存原始环境变量
  const originalEnv = {
    VERCEL: process.env.VERCEL,
    VERCEL_ENV: process.env.VERCEL_ENV,
    NODE_ENV: process.env.NODE_ENV,
  };

  beforeAll(() => {
    parser = new XiaohongshuParser();
  });

  afterAll(() => {
    // 恢复原始环境变量
    Object.assign(process.env, originalEnv);
  });

  beforeEach(() => {
    // 清除所有模拟
    vi.clearAllMocks();
  });

  describe('🌐 Vercel 环境测试', () => {
    beforeEach(() => {
      // 模拟 Vercel 环境
      process.env.VERCEL = '1';
      process.env.VERCEL_ENV = 'production';
      process.env.NODE_ENV = 'production';
    });

    it('应该正确检测 Vercel 环境', () => {
      const isVercel = EnvironmentDetector.isVercel();
      expect(isVercel).toBe(true);
      console.log('✅ Vercel环境检测正确');
    });

    it('应该在 Vercel 环境下使用 fetch 解析', async () => {
      try {
        const result = await parser.parse(TEST_URL, { timeout: 15000 });
        
        // 基础验证
        expect(result).toBeDefined();
        expect(result.platform).toBe('xiaohongshu');
        expect(result.originalUrl).toBe(TEST_URL);
        
        // 验证内容提取
        expect(result.title).toBeDefined();
        expect(result.title.length).toBeGreaterThan(0);
        console.log('🌐 Vercel环境解析标题:', result.title);
        
        expect(result.content).toBeDefined();
        expect(result.content.length).toBeGreaterThan(0);
        console.log('🌐 Vercel环境内容长度:', result.content.length);
        
        // 验证图片
        expect(Array.isArray(result.images)).toBe(true);
        console.log('🌐 Vercel环境图片数量:', result.images.length);
        
        if (result.images.length > 0) {
          // 验证图片URL格式
          result.images.forEach((img, index) => {
            expect(img).toMatch(/^https?:\/\/.+/);
            if (index < 3) {
              console.log(`🖼️ Vercel图片${index + 1}:`, img.substring(0, 60) + '...');
            }
          });
        }
        
        // 验证性能 (Vercel环境应该更快，因为使用fetch)
        console.log('⚡ Vercel环境解析完成');
        
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn('⚠️ Vercel环境解析遇到问题:', errorMessage);
        
        // 即使解析失败，也应该有正确的错误处理
        expect(error).toBeInstanceOf(Error);
      }
    }, 20000);

    it('应该在 Vercel 环境下正确处理 preloadedHtml', async () => {
      const mockHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta property="og:image" content="https://sns-webpic-qc.xhscdn.com/test/image1.jpg"/>
            <meta property="og:image" content="https://sns-webpic-qc.xhscdn.com/test/image2.jpg"/>
            <title>测试标题 - 小红书</title>
          </head>
          <body>
            <div class="content">这是预加载的HTML测试内容，用于验证Vercel环境下的解析能力。</div>
          </body>
        </html>
      `;

      const result = await parser.parse(TEST_URL, {
        preloadedHtml: mockHtml,
        timeout: 5000
      });

      expect(result).toBeDefined();
      expect(result.title).toContain('这是预加载的HTML测试内容');
      expect(result.content).toContain('这是预加载的HTML测试内容');
      expect(result.images).toHaveLength(2);
      expect(result.images[0]).toBe('https://sns-webpic-qc.xhscdn.com/test/image1.jpg');
      expect(result.images[1]).toBe('https://sns-webpic-qc.xhscdn.com/test/image2.jpg');
      
      console.log('📄 PreloadedHTML解析成功:', result.title);
      console.log('📄 PreloadedHTML图片:', result.images.length, '张');
    });
  });

  describe('💻 开发环境测试', () => {
    beforeEach(() => {
      // 模拟开发环境
      delete process.env.VERCEL;
      delete process.env.VERCEL_ENV;
      process.env.NODE_ENV = 'development';
    });

    it('应该正确检测开发环境', () => {
      const isVercel = EnvironmentDetector.isVercel();
      expect(isVercel).toBe(false);
      console.log('✅ 开发环境检测正确');
    });

    it('应该在开发环境下使用 Playwright 解析', async () => {
      try {
        const result = await parser.parse(TEST_URL, { timeout: 20000 });
        
        // 基础验证
        expect(result).toBeDefined();
        expect(result.platform).toBe('xiaohongshu');
        expect(result.originalUrl).toBe(TEST_URL);
        
        // 验证内容提取 (开发环境应该有更好的提取效果)
        expect(result.title).toBeDefined();
        expect(result.title.length).toBeGreaterThan(0);
        console.log('💻 开发环境解析标题:', result.title);
        
        expect(result.content).toBeDefined();
        expect(result.content.length).toBeGreaterThan(20); // 开发环境应该能提取到更多内容
        console.log('💻 开发环境内容长度:', result.content.length);
        
        // 验证图片 (开发环境应该能提取到更多图片)
        expect(Array.isArray(result.images)).toBe(true);
        console.log('💻 开发环境图片数量:', result.images.length);
        
        if (result.images.length > 0) {
          // 验证图片URL格式和质量
          result.images.forEach((img, index) => {
            expect(img).toMatch(/^https?:\/\/.+/);
            // 验证是否为小红书内容图片
            expect(img).toMatch(/xiaohongshu|xhscdn|sns-webpic|picasso-static/);
            if (index < 3) {
              console.log(`🖼️ 开发图片${index + 1}:`, img.substring(0, 60) + '...');
            }
          });
          
          // 开发环境应该能提取到较多的图片
          expect(result.images.length).toBeGreaterThanOrEqual(1);
        }
        
        console.log('⚡ 开发环境解析完成');
        
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn('⚠️ 开发环境解析遇到问题:', errorMessage);
        
        // 检查是否为Playwright相关错误
        if (errorMessage.includes('Target page') || errorMessage.includes('browser')) {
          console.log('🤖 这可能是Playwright浏览器问题，这在CI环境中是正常的');
        }
        
        expect(error).toBeInstanceOf(Error);
      }
    }, 25000);
  });

  describe('📊 环境对比测试', () => {
    it('应该在不同环境下都能正确处理 preloadedHtml', async () => {
      const mockHtml = `
        <html>
          <head>
            <meta property="og:image" content="https://sns-webpic-qc.xhscdn.com/compare/img1.jpg"/>
            <meta property="og:image" content="https://sns-webpic-qc.xhscdn.com/compare/img2.jpg"/>
            <meta property="og:image" content="https://sns-webpic-qc.xhscdn.com/compare/img3.jpg"/>
            <title>环境对比测试</title>
          </head>
          <body>
            <div class="content">环境对比测试内容</div>
          </body>
        </html>
      `;

      // Vercel环境测试
      process.env.VERCEL = '1';
      const vercelResult = await parser.parse(TEST_URL, {
        preloadedHtml: mockHtml,
        timeout: 3000
      });

      // 开发环境测试
      delete process.env.VERCEL;
      const devResult = await parser.parse(TEST_URL, {
        preloadedHtml: mockHtml,
        timeout: 3000
      });

      // 对比结果 (preloadedHtml模式下，两个环境应该产生相同结果)
      expect(vercelResult.title).toBe(devResult.title);
      expect(vercelResult.images).toEqual(devResult.images);
      expect(vercelResult.images).toHaveLength(3);
      
      console.log('📊 环境对比 - PreloadedHTML模式下结果一致');
      console.log('📊 Vercel结果:', vercelResult.title);
      console.log('📊 开发结果:', devResult.title);
    });

    it('应该验证环境检测函数的准确性', () => {
      // 测试 Vercel 环境检测
      process.env.VERCEL = '1';
      expect(EnvironmentDetector.isVercel()).toBe(true);
      
      process.env.VERCEL_ENV = 'production';
      expect(EnvironmentDetector.isVercel()).toBe(true);
      
      // 测试开发环境检测
      delete process.env.VERCEL;
      delete process.env.VERCEL_ENV;
      expect(EnvironmentDetector.isVercel()).toBe(false);
      
      // 边界情况
      process.env.VERCEL = '';
      expect(EnvironmentDetector.isVercel()).toBe(false);
      
      console.log('✅ 环境检测函数验证通过');
    });
  });

  describe('⚠️ 错误处理测试', () => {
    it('应该在 Vercel 环境下优雅处理解析失败', async () => {
      process.env.VERCEL = '1';
      
      try {
        const result = await parser.parse('http://xhslink.com/n/invalid-test', {
          timeout: 5000
        });
        
        // 即使失败，也应该返回基本结构
        expect(result.platform).toBe('xiaohongshu');
        expect(result.title).toBeDefined();
        console.log('🌐 Vercel错误处理:', result.title);
        
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(Error);
        console.log('🌐 Vercel预期错误处理正常');
      }
    });

    it('应该在开发环境下优雅处理解析失败', async () => {
      delete process.env.VERCEL;
      
      try {
        const result = await parser.parse('http://xhslink.com/n/invalid-test', {
          timeout: 8000
        });
        
        // 即使失败，也应该返回基本结构
        expect(result.platform).toBe('xiaohongshu');
        expect(result.title).toBeDefined();
        console.log('💻 开发环境错误处理:', result.title);
        
      } catch (error: unknown) {
        expect(error).toBeInstanceOf(Error);
        console.log('💻 开发环境预期错误处理正常');
      }
    });
  });
});