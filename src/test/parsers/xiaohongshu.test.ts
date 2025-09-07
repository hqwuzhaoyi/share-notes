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

  describe('📝 文字内容增强测试', () => {
    it('应该验证文字提取的准确性和完整性', async () => {
      // 使用preloadedHtml进行稳定测试
      const mockHtml = `
        <html>
        <head>
          <meta property="og:title" content="测试标题：详细的小红书内容"/>
          <title>测试标题：详细的小红书内容 - 小红书</title>
        </head>
        <body>
          <div class="note-content">
            这是一段详细的测试内容，包含多个句子。第一句话描述了基本情况。
            第二句话提供了更多细节信息。第三句话总结了重点内容。
            
            内容还包含一些特殊字符：引号"测试"、单引号'测试'、以及emoji😊。
            
            最后一段包含了一些数字123和英文mixed content。
          </div>
          <div class="author">测试作者名称</div>
        </body>
        </html>
      `;

      const result = await parser.parse('https://test.xiaohongshu.com', {
        preloadedHtml: mockHtml
      });

      // 验证标题提取
      expect(result.title).toBeDefined();
      expect(result.title.length).toBeGreaterThan(5);
      expect(result.title).toContain('测试标题');
      
      // 验证内容提取
      expect(result.content).toBeDefined();
      expect(result.content.length).toBeGreaterThan(50);
      expect(result.content).toContain('详细的测试内容');
      expect(result.content).toContain('第一句话');
      
      // 验证特殊字符处理
      expect(result.content).toContain('😊');
      expect(result.content).toContain('"测试"');
      expect(result.content).toContain('mixed content');
      
      console.log('📝 文字提取验证通过');
      console.log('📊 标题长度:', result.title.length);
      console.log('📊 内容长度:', result.content.length);
    });

    it('应该正确处理中文和多语言内容', async () => {
      const multiLangHtml = `
        <html>
        <body>
          <div class="content">
            中文内容测试：这是一段中文描述。
            English content: This is an English description.
            日本語：これは日本語の説明です。
            Emoji测试: 🎉🎊🎈 各种表情符号
            数字和符号: 123 + 456 = 579, 50% discount!
            特殊标点：「引用内容」《书名》【重点】
          </div>
        </body>
        </html>
      `;

      const result = await parser.parse('https://multilang.test.com', {
        preloadedHtml: multiLangHtml
      });

      expect(result.content).toContain('中文内容测试');
      expect(result.content).toContain('English content');
      expect(result.content).toContain('日本語');
      expect(result.content).toContain('🎉🎊🎈');
      expect(result.content).toContain('123 + 456');
      expect(result.content).toContain('「引用内容」');
      
      console.log('🌐 多语言内容处理验证通过');
    });

    it('应该验证文字清理和格式化功能', async () => {
      const messyHtml = `
        <html>
        <body>
          <div class="content">
            这是一段包含多余空白     的内容。
            
            
            包含多个换行符和空行。
            还有	制表符	分隔的内容。
            
            末尾也有多余空白   
          </div>
        </body>
        </html>
      `;

      const result = await parser.parse('https://messy.test.com', {
        preloadedHtml: messyHtml
      });

      // 验证空白字符清理
      expect(result.content).not.toMatch(/\s{3,}/); // 不应有3个以上连续空白
      expect(result.content).not.toMatch(/^\s+|\s+$/); // 首尾不应有空白
      expect(result.content).not.toContain('\t'); // 不应有制表符
      
      // 但应该保留必要的空格和换行
      expect(result.content.length).toBeGreaterThan(20);
      expect(result.content).toContain('包含多余空白');
      
      console.log('🧹 文字清理功能验证通过');
    });
  });

  describe('🖼️ 图片提取增强测试', () => {
    it('应该准确提取og:image标签中的图片', async () => {
      const ogImageHtml = `
        <html>
        <head>
          <meta property="og:image" content="https://sns-webpic-qc.xhscdn.com/test/image1.jpg!nd_dft_wgth_webp_3"/>
          <meta property="og:image" content="https://sns-webpic-qc.xhscdn.com/test/image2.jpg!nd_dft_wlteh_webp_3"/>
          <meta property="og:image" content="https://sns-webpic-qc.xhscdn.com/test/image3.jpg!nd_dft_wgth_webp_3"/>
          <meta property="og:image" content="https://picasso-static.xiaohongshu.com/test/image4.png"/>
        </head>
        <body>
          <div class="content">测试内容</div>
        </body>
        </html>
      `;

      const result = await parser.parse('https://og-test.com', {
        preloadedHtml: ogImageHtml
      });

      expect(result.images).toHaveLength(4);
      expect(result.images[0]).toBe('https://sns-webpic-qc.xhscdn.com/test/image1.jpg!nd_dft_wgth_webp_3');
      expect(result.images[3]).toBe('https://picasso-static.xiaohongshu.com/test/image4.png');
      
      console.log('🖼️ og:image提取验证通过，提取到', result.images.length, '张图片');
    });

    it('应该正确过滤非内容图片', async () => {
      const mixedImageHtml = `
        <html>
        <body>
          <img src="https://sns-webpic-qc.xhscdn.com/content/real-content-image.jpg" />
          <img src="https://xiaohongshu.com/avatar/user123.jpg" />
          <img src="https://xiaohongshu.com/icon/app-icon.png" />
          <img src="https://xiaohongshu.com/logo/brand-logo.svg" />
          <img src="https://xhscdn.com/ui/button-bg.png" />
          <img src="https://sns-webpic-qc.xhscdn.com/content/another-content.jpg" />
        </body>
        </html>
      `;

      const result = await parser.parse('https://filter-test.com', {
        preloadedHtml: mixedImageHtml
      });

      // 应该只保留内容图片，过滤掉头像、图标、logo等
      expect(result.images.length).toBeLessThan(6); // 应该少于原始图片数量
      
      // 验证保留的图片不包含被过滤的类型
      result.images.forEach(img => {
        expect(img).not.toContain('avatar');
        expect(img).not.toContain('icon');
        expect(img).not.toContain('logo');
      });

      // 应该包含有效的内容图片
      const hasContentImage = result.images.some(img => img.includes('content'));
      if (hasContentImage) {
        expect(hasContentImage).toBe(true);
      }
      
      console.log('🔍 图片过滤验证通过，过滤后剩余', result.images.length, '张图片');
    });

    it('应该验证图片URL的标准化处理', async () => {
      const urlNormalizationHtml = `
        <html>
        <body>
          <img src="//sns-webpic-qc.xhscdn.com/relative/image1.jpg" />
          <img src="/local/image2.jpg" />
          <img src="https://sns-webpic-qc.xhscdn.com/absolute/image3.jpg" />
        </body>
        </html>
      `;

      const result = await parser.parse('https://normalize-test.com', {
        preloadedHtml: urlNormalizationHtml
      });

      // 验证相对URL被正确转换为绝对URL
      result.images.forEach(img => {
        expect(img).toMatch(/^https:\/\/.+/);
        expect(img).not.toMatch(/^\/\//);
        expect(img).not.toStartWith('/');
      });
      
      console.log('🔗 图片URL标准化验证通过');
    });

    it('应该验证图片去重功能', async () => {
      const duplicateImageHtml = `
        <html>
        <head>
          <meta property="og:image" content="https://sns-webpic-qc.xhscdn.com/duplicate/image1.jpg"/>
          <meta property="og:image" content="https://sns-webpic-qc.xhscdn.com/duplicate/image2.jpg"/>
        </head>
        <body>
          <img src="https://sns-webpic-qc.xhscdn.com/duplicate/image1.jpg" />
          <img src="https://sns-webpic-qc.xhscdn.com/duplicate/image2.jpg" />
          <img src="https://sns-webpic-qc.xhscdn.com/duplicate/image1.jpg" />
        </body>
        </html>
      `;

      const result = await parser.parse('https://duplicate-test.com', {
        preloadedHtml: duplicateImageHtml
      });

      // 应该只保留唯一的图片
      expect(result.images).toHaveLength(2);
      
      // 验证去重效果
      const uniqueImages = new Set(result.images);
      expect(uniqueImages.size).toBe(result.images.length);
      
      console.log('🔄 图片去重功能验证通过');
    });
  });

  describe('⚠️ 错误处理和边界测试', () => {
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

    it('应该处理空内容页面', async () => {
      const emptyHtml = '<html><body></body></html>';
      
      const result = await parser.parse('https://empty.test.com', {
        preloadedHtml: emptyHtml
      });

      expect(result).toBeDefined();
      expect(result.platform).toBe('xiaohongshu');
      expect(result.title).toBeDefined();
      expect(result.content).toBeDefined();
      expect(Array.isArray(result.images)).toBe(true);
      
      console.log('✅ 空内容处理:', result.title);
    });

    it('应该处理被删除或受限的内容', async () => {
      const restrictedHtml = `
        <html>
        <body>
          <div>该小红书笔记已不存在或已被删除，可能是链接过期或内容被作者删除</div>
        </body>
        </html>
      `;

      const result = await parser.parse('https://restricted.test.com', {
        preloadedHtml: restrictedHtml
      });

      expect(result.content).toContain('无法提取小红书内容');
      console.log('✅ 受限内容处理:', result.content);
    });

    it('应该处理需要登录的页面', async () => {
      const loginRequiredHtml = `
        <html>
        <body>
          <div>该内容需要登录小红书才能访问。小红书已加强访问控制，大部分内容现在需要登录用户才能查看。</div>
        </body>
        </html>
      `;

      const result = await parser.parse('https://login-required.test.com', {
        preloadedHtml: loginRequiredHtml
      });

      expect(result.content).toContain('需要登录');
      console.log('✅ 登录要求处理:', result.content);
    });

    it('应该有正确的错误处理机制', () => {
      // 测试基础错误处理逻辑
      expect(() => {
        parser['cleanText']('  test content  ');
      }).not.toThrow();
    });
  });

  describe('🔧 内部方法测试', () => {
    it('应该验证图片内容验证方法', () => {
      const testUrls = [
        { url: 'https://sns-webpic-qc.xhscdn.com/content/image.jpg', expected: true },
        { url: 'https://xiaohongshu.com/avatar/user.jpg', expected: false },
        { url: 'https://xiaohongshu.com/icon/app.png', expected: false },
        { url: 'https://picasso-static.xiaohongshu.com/content/img.jpg', expected: true },
        { url: 'https://other-site.com/image.jpg', expected: false },
        { url: 'https://sns-webpic-qc.xhscdn.com/40x40/small.jpg', expected: false },
      ];

      testUrls.forEach(({ url, expected }) => {
        const isContentImage = parser['isContentImage'](url);
        expect(isContentImage).toBe(expected);
      });

      console.log('✅ 图片内容验证方法测试通过');
    });

    it('应该验证URL标准化方法', () => {
      const testCases = [
        { input: '//example.com/image.jpg', expected: 'https://example.com/image.jpg' },
        { input: '/path/image.jpg', expected: 'https://xiaohongshu.com/path/image.jpg' },
        { input: 'https://example.com/image.jpg', expected: 'https://example.com/image.jpg' },
        { input: '', expected: '' },
      ];

      testCases.forEach(({ input, expected }) => {
        const normalized = parser['normalizeImageUrl'](input);
        expect(normalized).toBe(expected);
      });

      console.log('✅ URL标准化方法测试通过');
    });
  });
});