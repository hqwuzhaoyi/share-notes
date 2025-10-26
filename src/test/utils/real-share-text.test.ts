import { describe, it, expect } from 'vitest';
import { urlExtractor } from '../../lib/utils/url-extractor';

describe('URLExtractor - Real Xiaohongshu Share Text', () => {
  it('should extract URL from real share text with http://xhslink.com', () => {
    const realShareText = `Claude Code：为何智能体搜索远胜传统 RAG Anthropic ... http://xhslink.com/o/1ICfQR5ylyj
复制后打开【小红书】查看笔记！`;

    const result = urlExtractor.extract(realShareText);

    console.log('\n🧪 真实分享文本测试结果:');
    console.log('输入:', realShareText);
    console.log('\n提取结果:');
    console.log('- 成功:', result.success);
    console.log('- 方法:', result.extractionMethod);
    console.log('- 耗时:', result.extractionTimeMs, 'ms');
    console.log('- 提取的 URL:', result.extractedUrl);
    console.log('- 找到的 URL 总数:', result.metadata.urlsFound);
    console.log('- 小红书 URL 数量:', result.metadata.xhsUrlsFound);

    // 断言
    expect(result.success).toBe(true);
    expect(result.extractionMethod).toBe('regex');
    expect(result.extractedUrl).toBe('http://xhslink.com/o/1ICfQR5ylyj');
    expect(result.metadata.urlsFound).toBe(1);
    expect(result.metadata.xhsUrlsFound).toBe(1);
    expect(result.extractionTimeMs).toBeLessThan(10); // 应该 <10ms
  });
});
