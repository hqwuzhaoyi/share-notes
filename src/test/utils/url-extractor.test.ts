import { describe, it, expect } from 'vitest';
import { URLExtractor } from '@/lib/utils/url-extractor';

describe('URLExtractor - Passthrough (Clean URLs)', () => {
  const extractor = new URLExtractor();

  it('should pass through clean xiaohongshu.com URL unchanged', () => {
    const input = 'https://www.xiaohongshu.com/discovery/item/68fcd6f70000000003019d6b';
    const result = extractor.extract(input);

    expect(result.success).toBe(true);
    expect(result.extractedUrl).toBe(input);
    expect(result.extractionMethod).toBe('passthrough');
    expect(result.extractionTimeMs).toBeLessThan(1);
  });

  it('should pass through clean xhslink.com URL unchanged', () => {
    const input = 'https://xhslink.com/abc123xyz';
    const result = extractor.extract(input);

    expect(result.success).toBe(true);
    expect(result.extractedUrl).toBe(input);
    expect(result.extractionMethod).toBe('passthrough');
    expect(result.extractionTimeMs).toBeLessThan(1);
  });

  it('should pass through URL with query parameters', () => {
    const input = 'https://www.xiaohongshu.com/discovery/item/68fcd6f70000000003019d6b?source=webshare&xsec_token=ABmRMnU';
    const result = extractor.extract(input);

    expect(result.success).toBe(true);
    expect(result.extractedUrl).toBe(input);
    expect(result.extractionMethod).toBe('passthrough');
  });

  it('should handle clean URL with leading/trailing whitespace', () => {
    const cleanUrl = 'https://www.xiaohongshu.com/discovery/item/123';
    const input = `  ${cleanUrl}  `;
    const result = extractor.extract(input);

    expect(result.success).toBe(true);
    expect(result.extractedUrl).toBe(cleanUrl);
    expect(result.extractionMethod).toBe('passthrough');
  });
});

describe('URLExtractor - Regex Extraction', () => {
  const extractor = new URLExtractor();

  it('should extract URL from standard share text', () => {
    const input = '72 【金刚狼你看了几遍！  - 老周科普 | 小红书 - 你的生活兴趣社区】 😆 b7O9HKvl8jH70TN 😆 https://www.xiaohongshu.com/discovery/item/68fcd6f70000000003019d6b';
    const result = extractor.extract(input);

    expect(result.success).toBe(true);
    expect(result.extractedUrl).toBe('https://www.xiaohongshu.com/discovery/item/68fcd6f70000000003019d6b');
    expect(result.extractionMethod).toBe('regex');
    expect(result.extractionTimeMs).toBeLessThan(5);
  });

  it('should extract URL with query parameters preserved', () => {
    const shareText = '分享我的小红书笔记 https://www.xiaohongshu.com/discovery/item/68fcd6f70000000003019d6b?source=webshare&xhsshare=pc_web&xsec_token=ABmRMnU-cVdYe8aUdoENU3RD-Y0Fxo_WqAIEIN81iSUq4=&xsec_source=pc_share，快来看看！';
    const result = extractor.extract(shareText);

    expect(result.success).toBe(true);
    expect(result.extractedUrl).toContain('?source=webshare');
    expect(result.extractedUrl).toContain('xsec_token=');
    expect(result.extractedUrl).toContain('xhsshare=');
    expect(result.extractionMethod).toBe('regex');
  });

  it('should extract first URL when multiple xiaohongshu URLs present', () => {
    const input = 'Check these: https://www.xiaohongshu.com/discovery/item/1 and https://www.xiaohongshu.com/explore/2';
    const result = extractor.extract(input);

    expect(result.success).toBe(true);
    expect(result.extractedUrl).toBe('https://www.xiaohongshu.com/discovery/item/1');
    expect(result.metadata.xhsUrlsFound).toBe(2);
    expect(result.extractionMethod).toBe('regex');
  });

  it('should extract xhslink.com short links', () => {
    const input = '分享我的小红书笔记 https://xhslink.com/abc123，快来看看！';
    const result = extractor.extract(input);

    expect(result.success).toBe(true);
    expect(result.extractedUrl).toBe('https://xhslink.com/abc123');
    expect(result.extractionMethod).toBe('regex');
  });

  it('should handle URL at beginning of text', () => {
    const input = 'https://www.xiaohongshu.com/explore/67890 这是一个有趣的内容';
    const result = extractor.extract(input);

    expect(result.success).toBe(true);
    expect(result.extractedUrl).toBe('https://www.xiaohongshu.com/explore/67890');
  });

  it('should handle URL in middle of text', () => {
    const input = '看看这个 https://www.xiaohongshu.com/explore/67890 很不错吧';
    const result = extractor.extract(input);

    expect(result.success).toBe(true);
    expect(result.extractedUrl).toBe('https://www.xiaohongshu.com/explore/67890');
  });
});

describe('URLExtractor - Metadata', () => {
  const extractor = new URLExtractor();

  it('should record metadata correctly for share text', () => {
    const input = '分享 https://www.xiaohongshu.com/item/123';
    const result = extractor.extract(input);

    expect(result.metadata.inputLength).toBe(input.length);
    expect(result.metadata.urlsFound).toBe(1);
    expect(result.metadata.xhsUrlsFound).toBe(1);
    expect(result.metadata.aiAttempted).toBe(false);
    expect(result.metadata.timestamp).toBeTruthy();
    expect(new Date(result.metadata.timestamp)).toBeInstanceOf(Date);
  });

  it('should record metadata for passthrough', () => {
    const input = 'https://www.xiaohongshu.com/item/123';
    const result = extractor.extract(input);

    expect(result.metadata.inputLength).toBe(input.length);
    expect(result.metadata.urlsFound).toBe(1);
    expect(result.metadata.xhsUrlsFound).toBe(1);
  });

  it('should record zero counts when no URLs found', () => {
    const input = 'This is just plain text';
    const result = extractor.extract(input);

    expect(result.metadata.urlsFound).toBe(0);
    expect(result.metadata.xhsUrlsFound).toBe(0);
  });
});

describe('URLExtractor - Multiple URLs', () => {
  const extractor = new URLExtractor();

  it('should extract first URL when multiple present (FR-010)', () => {
    const input = 'URL1: https://www.xiaohongshu.com/item/1 URL2: https://www.xiaohongshu.com/item/2 URL3: https://www.xiaohongshu.com/item/3';
    const result = extractor.extract(input);

    expect(result.success).toBe(true);
    expect(result.extractedUrl).toBe('https://www.xiaohongshu.com/item/1');
    expect(result.metadata.xhsUrlsFound).toBe(3);
  });

  it('should count all URLs but extract only Xiaohongshu URLs', () => {
    const input = 'Check https://bilibili.com/video/1 and https://www.xiaohongshu.com/item/1 and https://weibo.com/2';
    const result = extractor.extract(input);

    expect(result.success).toBe(true);
    expect(result.extractedUrl).toBe('https://www.xiaohongshu.com/item/1');
    expect(result.metadata.urlsFound).toBe(3);
    expect(result.metadata.xhsUrlsFound).toBe(1);
  });
});

describe('URLExtractor - Error Handling', () => {
  const extractor = new URLExtractor();

  it('should return NO_URL_FOUND when no URL in input', () => {
    const input = 'This is just text without any URL';
    const result = extractor.extract(input);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('NO_URL_FOUND');
    expect(result.error?.message).toContain('No valid URL found');
    expect(result.error?.hint).toBeTruthy();
    expect(result.error?.hint).toContain('Xiaohongshu URL');
  });

  it('should return NON_XIAOHONGSHU_URL for bilibili URL', () => {
    const input = 'Check this: https://bilibili.com/video/BV12345';
    const result = extractor.extract(input);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('NON_XIAOHONGSHU_URL');
    expect(result.error?.message).toContain('not from Xiaohongshu');
    expect(result.error?.hint).toContain('xiaohongshu.com');
  });

  it('should return NO_URL_FOUND for malformed URL', () => {
    const input = 'Bad URL: htp://xiaohongshu.com'; // typo in protocol
    const result = extractor.extract(input);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('NO_URL_FOUND'); // Regex won't match
  });

  it('should handle empty input', () => {
    const input = '';
    const result = extractor.extract(input);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('NO_URL_FOUND');
  });

  it('should handle whitespace-only input', () => {
    const input = '   \n\t  ';
    const result = extractor.extract(input);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('NO_URL_FOUND');
  });
});

describe('URLExtractor - Edge Cases', () => {
  const extractor = new URLExtractor();

  it('should handle very long URLs (>2000 chars)', () => {
    const longParams = 'param=' + 'a'.repeat(2000);
    const input = `Share: https://www.xiaohongshu.com/item/1?${longParams}`;
    const result = extractor.extract(input);

    expect(result.success).toBe(true);
    expect(result.extractedUrl).toBeTruthy();
    expect(result.extractedUrl!.length).toBeGreaterThan(2000);
  });

  it('should handle URLs with Chinese characters (encoded)', () => {
    const input = '分享 https://www.xiaohongshu.com/search?q=%E4%B8%AD%E6%96%87';
    const result = extractor.extract(input);

    expect(result.success).toBe(true);
    expect(result.extractedUrl).toContain('%E4%B8%AD%E6%96%87');
  });

  it('should handle multiline share text', () => {
    const input = `Line 1
    Line 2
    https://www.xiaohongshu.com/item/123
    Line 4`;
    const result = extractor.extract(input);

    expect(result.success).toBe(true);
    expect(result.extractedUrl).toBe('https://www.xiaohongshu.com/item/123');
  });

  it('should handle URL with special characters in query params', () => {
    const input = 'https://www.xiaohongshu.com/item/1?token=abc123!@#$%^&*()_+-=';
    const result = extractor.extract(input);

    expect(result.success).toBe(true);
    expect(result.extractedUrl).toContain('token=');
  });

  it('should reject input exceeding 5000 characters', () => {
    const veryLongInput = 'a'.repeat(5001);
    const result = extractor.extract(veryLongInput);

    expect(result.success).toBe(false);
    expect(result.error?.code).toBe('NO_URL_FOUND');
  });
});

describe('URLExtractor - URL Format Variations', () => {
  const extractor = new URLExtractor();

  it('should extract from discovery URL', () => {
    const input = 'Check https://www.xiaohongshu.com/discovery/item/68fcd6f70000000003019d6b';
    const result = extractor.extract(input);

    expect(result.success).toBe(true);
    expect(result.extractedUrl).toContain('/discovery/item/');
  });

  it('should extract from explore URL', () => {
    const input = 'Check https://www.xiaohongshu.com/explore/67890abcdef';
    const result = extractor.extract(input);

    expect(result.success).toBe(true);
    expect(result.extractedUrl).toContain('/explore/');
  });

  it('should extract from user profile URL', () => {
    const input = 'Profile: https://www.xiaohongshu.com/user/profile/5d8a8d1e000000001001f7e1';
    const result = extractor.extract(input);

    expect(result.success).toBe(true);
    expect(result.extractedUrl).toContain('/user/profile/');
  });

  it('should handle xiaohongshu.com without www subdomain', () => {
    const input = 'Link: https://xiaohongshu.com/discovery/item/123';
    const result = extractor.extract(input);

    expect(result.success).toBe(true);
    expect(result.extractedUrl).toBe('https://xiaohongshu.com/discovery/item/123');
  });
});
