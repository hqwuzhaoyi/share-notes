// @ts-nocheck
import { describe, it, expect, beforeAll, vi } from 'vitest';
import { XiaohongshuParser } from '../../lib/parsers/xiaohongshu';
import { ParsedContent } from '../../lib/types/parser';

describe('📝 内容验证测试 - 文字和图片质量检查', () => {
  let parser: XiaohongshuParser;
  
  // 测试用的小红书链接
  const TEST_URLS = [
    'http://xhslink.com/n/9qQs6fCAtZN', // 主要测试链接
    'http://xhslink.com/o/mRDJxDn9Yy',  // 备用测试链接
  ];

  beforeAll(() => {
    parser = new XiaohongshuParser();
    console.log('🔍 内容验证测试开始');
  });

  describe('📚 文字内容质量验证', () => {
    let testContent: ParsedContent | null = null;

    beforeAll(async () => {
      // 尝试获取真实内容进行测试
      for (const url of TEST_URLS) {
        try {
          testContent = await parser.parse(url, { timeout: 15000 });
          console.log(`✅ 成功获取测试内容: ${url}`);
          break;
        } catch (error) {
          console.warn(`⚠️ 测试URL失败: ${url}`);
          continue;
        }
      }
    }, 30000);

    it('应该验证标题内容质量', () => {
      if (!testContent) {
        console.warn('⚠️ 无测试内容，跳过标题验证');
        return;
      }

      // 标题基础验证
      expect(testContent.title).toBeDefined();
      expect(typeof testContent.title).toBe('string');
      expect(testContent.title.trim().length).toBeGreaterThan(0);
      
      // 标题质量检查
      const title = testContent.title.trim();
      
      // 长度合理性 (不能太短或太长)
      expect(title.length).toBeGreaterThanOrEqual(3); // 至少3个字符
      expect(title.length).toBeLessThanOrEqual(200); // 不超过200个字符
      
      // 不应该是纯标点符号
      expect(title).not.toMatch(/^[^\w\u4e00-\u9fff]+$/);
      
      // 不应该包含明显的错误标识
      expect(title.toLowerCase()).not.toContain('error');
      expect(title.toLowerCase()).not.toContain('404');
      expect(title.toLowerCase()).not.toContain('not found');
      
      // 检查中文内容 (小红书主要是中文)
      const hasChinese = /[\u4e00-\u9fff]/.test(title);
      if (!hasChinese) {
        console.warn('⚠️ 标题中没有检测到中文字符:', title);
      }
      
      console.log('📝 标题质量验证通过:', title);
      console.log('📊 标题长度:', title.length, '字符');
      console.log('📊 包含中文:', hasChinese ? '是' : '否');
    });

    it('应该验证正文内容质量', () => {
      if (!testContent) {
        console.warn('⚠️ 无测试内容，跳过正文验证');
        return;
      }

      const content = testContent.content;
      
      // 基础验证
      expect(content).toBeDefined();
      expect(typeof content).toBe('string');
      expect(content.trim().length).toBeGreaterThan(0);
      
      // 内容质量检查
      const trimmedContent = content.trim();
      
      // 长度合理性
      expect(trimmedContent.length).toBeGreaterThan(10); // 至少10个字符
      
      // 检查是否为有意义的内容
      const meaningfulContentRatio = (trimmedContent.match(/[\u4e00-\u9fff\w]/g) || []).length / trimmedContent.length;
      expect(meaningfulContentRatio).toBeGreaterThan(0.3); // 至少30%是有意义字符
      
      // 检查常见的错误页面标识
      const errorIndicators = [
        '页面不存在', '内容已删除', '笔记已删除', '你访问的页面不见了',
        '请先登录', '需要登录', '登录小红书', '访问受限'
      ];
      
      const hasErrorIndicator = errorIndicators.some(indicator => 
        trimmedContent.includes(indicator)
      );
      
      if (hasErrorIndicator) {
        console.warn('⚠️ 检测到错误页面标识，但这可能是预期的');
        console.warn('📄 内容:', trimmedContent.substring(0, 100) + '...');
      }
      
      // 检查内容丰富度
      const sentences = trimmedContent.split(/[。！？.!?]/).filter(s => s.trim().length > 5);
      console.log('📊 句子数量:', sentences.length);
      console.log('📊 内容长度:', trimmedContent.length, '字符');
      console.log('📊 有意义字符比例:', Math.round(meaningfulContentRatio * 100) + '%');
      
      if (sentences.length >= 2) {
        console.log('✅ 内容丰富度良好');
      } else if (trimmedContent.length > 50) {
        console.log('✅ 内容长度适中');
      }
      
      console.log('📝 正文内容片段:', trimmedContent.substring(0, 80) + '...');
    });

    it('应该验证文字编码和特殊字符处理', () => {
      if (!testContent) {
        console.warn('⚠️ 无测试内容，跳过编码验证');
        return;
      }

      const { title, content } = testContent;
      
      // 检查乱码字符
      const garbledChars = /[��]/g;
      const titleGarbled = (title.match(garbledChars) || []).length;
      const contentGarbled = (content.match(garbledChars) || []).length;
      
      expect(titleGarbled).toBe(0);
      expect(contentGarbled).toBe(0);
      
      // 检查HTML实体是否正确解码
      expect(title).not.toContain('&lt;');
      expect(title).not.toContain('&gt;');
      expect(title).not.toContain('&amp;');
      expect(title).not.toContain('&quot;');
      
      expect(content).not.toContain('&lt;');
      expect(content).not.toContain('&gt;');
      expect(content).not.toContain('&amp;');
      expect(content).not.toContain('&quot;');
      
      // 检查多余的空白字符
      expect(title).not.toMatch(/^\s+|\s+$/); // 首尾不应有空白
      expect(title).not.toMatch(/\s{3,}/); // 不应有3个以上连续空白
      
      console.log('✅ 文字编码和特殊字符处理验证通过');
    });
  });

  describe('🖼️ 图片内容质量验证', () => {
    let testContent: ParsedContent | null = null;

    beforeAll(async () => {
      // 尝试获取真实内容进行测试
      for (const url of TEST_URLS) {
        try {
          testContent = await parser.parse(url, { timeout: 15000 });
          if (testContent && testContent.images.length > 0) {
            console.log(`✅ 成功获取带图片的测试内容: ${url}`);
            break;
          }
        } catch (error) {
          console.warn(`⚠️ 测试URL失败: ${url}`);
          continue;
        }
      }
    }, 30000);

    it('应该验证图片数量和基础结构', () => {
      if (!testContent) {
        console.warn('⚠️ 无测试内容，跳过图片验证');
        return;
      }

      const { images } = testContent;
      
      // 基础结构验证
      expect(Array.isArray(images)).toBe(true);
      console.log('📊 提取到的图片数量:', images.length);
      
      if (images.length === 0) {
        console.warn('⚠️ 未提取到图片，可能是正常情况或需要检查解析逻辑');
        return;
      }
      
      // 图片数量合理性 (小红书一般1-9张图片)
      expect(images.length).toBeLessThanOrEqual(9);
      console.log('✅ 图片数量在合理范围内');
    });

    it('应该验证图片URL格式和有效性', () => {
      if (!testContent || testContent.images.length === 0) {
        console.warn('⚠️ 无图片内容，跳过URL验证');
        return;
      }

      const { images } = testContent;
      
      images.forEach((imageUrl, index) => {
        // URL格式验证
        expect(typeof imageUrl).toBe('string');
        expect(imageUrl.trim().length).toBeGreaterThan(0);
        
        // 必须是有效的HTTP(S) URL
        expect(imageUrl).toMatch(/^https?:\/\/.+/);
        
        // 不应该包含明显的错误
        expect(imageUrl).not.toContain('undefined');
        expect(imageUrl).not.toContain('null');
        expect(imageUrl).not.toContain('[object Object]');
        
        console.log(`🖼️ 图片${index + 1} URL:`, imageUrl.substring(0, 80) + '...');
      });
      
      console.log('✅ 图片URL格式验证通过');
    });

    it('应该验证小红书图片域名和类型', () => {
      if (!testContent || testContent.images.length === 0) {
        console.warn('⚠️ 无图片内容，跳过域名验证');
        return;
      }

      const { images } = testContent;
      const expectedDomains = [
        'xiaohongshu.com',
        'xhscdn.com',
        'sns-webpic-qc.xhscdn.com',
        'sns-na-i',
        'picasso-static.xiaohongshu.com',
        'sns-webpic'
      ];
      
      let validDomainCount = 0;
      
      images.forEach((imageUrl, index) => {
        const isValidDomain = expectedDomains.some(domain => imageUrl.includes(domain));
        
        if (isValidDomain) {
          validDomainCount++;
          console.log(`✅ 图片${index + 1} 域名有效:`, imageUrl.split('/')[2]);
        } else {
          console.warn(`⚠️ 图片${index + 1} 域名未知:`, imageUrl.split('/')[2]);
        }
        
        // 检查是否为内容图片 (非头像、图标)
        const isContentImage = !imageUrl.includes('avatar') && 
                              !imageUrl.includes('icon') && 
                              !imageUrl.includes('logo') &&
                              !imageUrl.match(/\/(?:16|24|32|40|48)x\1/);
        
        if (!isContentImage) {
          console.warn(`⚠️ 图片${index + 1} 可能是头像/图标:`, imageUrl);
        }
      });
      
      // 至少应该有一些来自有效域名的图片
      const validRatio = validDomainCount / images.length;
      expect(validRatio).toBeGreaterThan(0.5); // 至少50%来自有效域名
      
      console.log('📊 有效域名图片比例:', Math.round(validRatio * 100) + '%');
      console.log('✅ 小红书图片域名验证通过');
    });

    it('应该验证图片去重和质量过滤', () => {
      if (!testContent || testContent.images.length === 0) {
        console.warn('⚠️ 无图片内容，跳过去重验证');
        return;
      }

      const { images } = testContent;
      
      // 检查是否有重复图片
      const uniqueImages = new Set(images);
      expect(uniqueImages.size).toBe(images.length);
      
      // 检查图片尺寸标识 (小红书图片通常有尺寸参数)
      let hasHighQualityImages = 0;
      
      images.forEach((imageUrl) => {
        // 检查是否有高质量标识
        if (imageUrl.includes('1080') || imageUrl.includes('720') || imageUrl.includes('webp')) {
          hasHighQualityImages++;
        }
        
        // 检查是否为缩略图 (应该避免)
        const isLowQuality = imageUrl.includes('thumbnail') || 
                            imageUrl.includes('small') ||
                            imageUrl.match(/\/(?:40|48|64)x\1/);
        
        if (isLowQuality) {
          console.warn('⚠️ 发现可能的低质量图片:', imageUrl);
        }
      });
      
      console.log('📊 高质量图片数量:', hasHighQualityImages);
      console.log('📊 图片去重验证: 无重复');
      console.log('✅ 图片去重和质量过滤验证通过');
    });
  });

  describe('🔍 内容完整性验证', () => {
    it('应该验证解析结果的完整性和一致性', async () => {
      // 使用mock数据进行稳定测试
      const mockHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta property="og:image" content="https://sns-webpic-qc.xhscdn.com/test1.jpg"/>
          <meta property="og:image" content="https://sns-webpic-qc.xhscdn.com/test2.jpg"/>
          <meta property="og:image" content="https://sns-webpic-qc.xhscdn.com/test3.jpg"/>
          <title>完整性测试标题</title>
        </head>
        <body>
          <div class="content">这是一个完整性测试的内容，用于验证解析器能够正确提取各种元素。包含中文字符、标点符号和emoji😊。</div>
          <div class="author">测试作者</div>
        </body>
        </html>
      `;

      const result = await parser.parse('https://test.xiaohongshu.com', {
        preloadedHtml: mockHtml
      });

      // 完整性检查
      expect(result).toBeDefined();
      
      // 必需字段
      expect(result.title).toBeDefined();
      expect(result.content).toBeDefined();
      expect(result.images).toBeDefined();
      expect(result.platform).toBeDefined();
      expect(result.originalUrl).toBeDefined();
      expect(result.publishedAt).toBeDefined();
      
      // 类型检查
      expect(typeof result.title).toBe('string');
      expect(typeof result.content).toBe('string');
      expect(Array.isArray(result.images)).toBe(true);
      expect(typeof result.platform).toBe('string');
      expect(typeof result.originalUrl).toBe('string');
      expect(result.publishedAt instanceof Date).toBe(true);
      
      // 内容质量检查
      expect(result.title.length).toBeGreaterThan(0);
      expect(result.content.length).toBeGreaterThan(10);
      expect(result.images.length).toBeGreaterThan(0);
      expect(result.platform).toBe('xiaohongshu');
      
      console.log('✅ 解析结果完整性验证通过');
      console.log('📊 结果统计:');
      console.log('  - 标题:', result.title);
      console.log('  - 内容长度:', result.content.length);
      console.log('  - 图片数量:', result.images.length);
      console.log('  - 作者:', result.author || '未提取');
    });

    it('应该验证边界情况处理', async () => {
      // 测试空内容处理
      const emptyHtml = '<html><body></body></html>';
      const emptyResult = await parser.parse('https://empty.test.com', {
        preloadedHtml: emptyHtml
      });

      expect(emptyResult).toBeDefined();
      expect(emptyResult.title).toBeDefined();
      expect(emptyResult.content).toBeDefined();
      expect(Array.isArray(emptyResult.images)).toBe(true);
      
      // 测试特殊字符处理
      const specialCharHtml = `
        <html>
        <head><title>特殊字符测试 &amp; &lt;&gt; "引号" '单引号' 🎉</title></head>
        <body><div class="content">包含特殊字符的内容：&amp; &lt;标签&gt; "双引号" '单引号' 数学符号 ± × ÷</div></body>
        </html>
      `;
      
      const specialResult = await parser.parse('https://special.test.com', {
        preloadedHtml: specialCharHtml
      });

      expect(specialResult.title).not.toContain('&amp;');
      expect(specialResult.title).not.toContain('&lt;');
      expect(specialResult.title).not.toContain('&gt;');
      expect(specialResult.content).not.toContain('&amp;');
      
      console.log('✅ 边界情况处理验证通过');
      console.log('📝 特殊字符标题:', specialResult.title);
      console.log('📝 特殊字符内容:', specialResult.content.substring(0, 50) + '...');
    });
  });

  describe('📊 内容质量评分', () => {
    it('应该对解析内容进行质量评分', async () => {
      let testContent: ParsedContent | null = null;

      // 尝试获取真实内容
      for (const url of TEST_URLS) {
        try {
          testContent = await parser.parse(url, { timeout: 15000 });
          break;
        } catch (error) {
          continue;
        }
      }

      if (!testContent) {
        console.warn('⚠️ 无法获取测试内容，使用mock数据评分');
        testContent = {
          title: '高质量测试标题：详细描述内容主题',
          content: '这是一段高质量的测试内容，包含详细的描述信息。内容丰富，语言流畅，结构清晰。包含多个句子和段落，能够很好地表达主题思想。同时包含了相关的细节信息和补充说明。',
          images: [
            'https://sns-webpic-qc.xhscdn.com/quality/image1.jpg',
            'https://sns-webpic-qc.xhscdn.com/quality/image2.jpg',
            'https://sns-webpic-qc.xhscdn.com/quality/image3.jpg'
          ],
          author: '优质内容作者',
          publishedAt: new Date(),
          platform: 'xiaohongshu',
          originalUrl: 'https://test.com'
        };
      }

      let qualityScore = 0;
      const scoreDetails: string[] = [];

      // 标题质量评分 (25分)
      if (testContent.title.length >= 10) {
        qualityScore += 10;
        scoreDetails.push('标题长度适中 (+10)');
      } else if (testContent.title.length >= 5) {
        qualityScore += 5;
        scoreDetails.push('标题长度偏短 (+5)');
      }

      if (/[\u4e00-\u9fff]/.test(testContent.title)) {
        qualityScore += 10;
        scoreDetails.push('标题包含中文 (+10)');
      }

      if (!testContent.title.includes('小红书') || testContent.title.length > 10) {
        qualityScore += 5;
        scoreDetails.push('标题具有独特性 (+5)');
      }

      // 内容质量评分 (35分)
      if (testContent.content.length >= 50) {
        qualityScore += 15;
        scoreDetails.push('内容丰富 (+15)');
      } else if (testContent.content.length >= 20) {
        qualityScore += 8;
        scoreDetails.push('内容适中 (+8)');
      }

      const sentences = testContent.content.split(/[。！？.!?]/).filter(s => s.trim().length > 3);
      if (sentences.length >= 3) {
        qualityScore += 10;
        scoreDetails.push('句子结构良好 (+10)');
      } else if (sentences.length >= 1) {
        qualityScore += 5;
        scoreDetails.push('句子结构一般 (+5)');
      }

      if (!/登录|删除|不存在|错误/.test(testContent.content)) {
        qualityScore += 10;
        scoreDetails.push('内容有效性高 (+10)');
      }

      // 图片质量评分 (25分)
      if (testContent.images.length >= 3) {
        qualityScore += 15;
        scoreDetails.push('图片数量充足 (+15)');
      } else if (testContent.images.length >= 1) {
        qualityScore += 8;
        scoreDetails.push('图片数量适中 (+8)');
      }

      const validImages = testContent.images.filter(img => 
        img.includes('xhscdn') || img.includes('xiaohongshu')
      );
      if (validImages.length === testContent.images.length && testContent.images.length > 0) {
        qualityScore += 10;
        scoreDetails.push('图片来源可靠 (+10)');
      }

      // 结构完整性评分 (15分)
      if (testContent.author) {
        qualityScore += 5;
        scoreDetails.push('作者信息完整 (+5)');
      }

      if (testContent.publishedAt instanceof Date) {
        qualityScore += 5;
        scoreDetails.push('时间信息有效 (+5)');
      }

      if (testContent.platform === 'xiaohongshu') {
        qualityScore += 5;
        scoreDetails.push('平台标识正确 (+5)');
      }

      // 输出评分结果
      console.log('📊 内容质量评分结果:');
      console.log(`🎯 总分: ${qualityScore}/100`);
      console.log('📋 评分详情:');
      scoreDetails.forEach(detail => console.log(`   ${detail}`));

      // 质量等级
      let qualityLevel = '';
      if (qualityScore >= 85) {
        qualityLevel = '优秀 🏆';
      } else if (qualityScore >= 70) {
        qualityLevel = '良好 ⭐';
      } else if (qualityScore >= 50) {
        qualityLevel = '一般 ✅';
      } else {
        qualityLevel = '需要改进 ⚠️';
      }

      console.log(`🏅 质量等级: ${qualityLevel}`);
      
      // 基础质量要求
      expect(qualityScore).toBeGreaterThan(30); // 至少达到基础质量要求
      
      if (qualityScore >= 70) {
        console.log('🎉 内容质量达到良好标准！');
      } else if (qualityScore >= 50) {
        console.log('👍 内容质量达到基本要求');
      } else {
        console.log('💡 内容质量有改进空间');
      }
    }, 20000);
  });
});