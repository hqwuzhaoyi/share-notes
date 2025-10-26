import { describe, it, expect } from 'vitest';
import { URLValidator } from '@/lib/utils/url-validator';

describe('URLValidator.isXiaohongshuUrl', () => {
  it('should return true for xiaohongshu.com with www', () => {
    expect(URLValidator.isXiaohongshuUrl('https://www.xiaohongshu.com/discovery/item/68fcd6f7')).toBe(true);
  });

  it('should return true for xiaohongshu.com without www', () => {
    expect(URLValidator.isXiaohongshuUrl('https://xiaohongshu.com/discovery/item/68fcd6f7')).toBe(true);
  });

  it('should return true for xhslink.com', () => {
    expect(URLValidator.isXiaohongshuUrl('https://xhslink.com/abc123')).toBe(true);
  });

  it('should return true for http protocol', () => {
    expect(URLValidator.isXiaohongshuUrl('http://www.xiaohongshu.com/item/1')).toBe(true);
  });

  it('should return true for URLs with query parameters', () => {
    expect(URLValidator.isXiaohongshuUrl('https://www.xiaohongshu.com/item/1?source=web&token=abc')).toBe(true);
  });

  it('should return true for URLs with hash fragments', () => {
    expect(URLValidator.isXiaohongshuUrl('https://www.xiaohongshu.com/item/1#section')).toBe(true);
  });

  it('should return false for bilibili.com', () => {
    expect(URLValidator.isXiaohongshuUrl('https://bilibili.com/video/BV12345')).toBe(false);
  });

  it('should return false for weibo.com', () => {
    expect(URLValidator.isXiaohongshuUrl('https://weibo.com/12345')).toBe(false);
  });

  it('should return false for wechat URLs', () => {
    expect(URLValidator.isXiaohongshuUrl('https://mp.weixin.qq.com/s/abc123')).toBe(false);
  });

  it('should return false for malformed URLs', () => {
    expect(URLValidator.isXiaohongshuUrl('not-a-url')).toBe(false);
  });

  it('should return false for empty string', () => {
    expect(URLValidator.isXiaohongshuUrl('')).toBe(false);
  });

  it('should be case-insensitive for domain', () => {
    expect(URLValidator.isXiaohongshuUrl('https://www.XIAOHONGSHU.com/item/1')).toBe(true);
    expect(URLValidator.isXiaohongshuUrl('https://XHSLINK.COM/abc')).toBe(true);
  });
});
