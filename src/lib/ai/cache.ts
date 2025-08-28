// AI结果缓存管理
import { AICache, AIEnhancedContent } from '../types/ai';
import { createHash } from 'crypto';

export class AICacheManager {
  private cache = new Map<string, AICache>();
  private maxEntries: number;
  private expiresHours: number;

  constructor(maxEntries = 1000, expiresHours = 24) {
    this.maxEntries = maxEntries;
    this.expiresHours = expiresHours;
    
    // 定期清理过期缓存
    setInterval(() => this.cleanup(), 60 * 60 * 1000); // 每小时清理一次
  }

  // 生成缓存key
  private generateCacheKey(url: string, content?: string): string {
    const contentHash = content 
      ? createHash('md5').update(content).digest('hex').substring(0, 8)
      : '';
    
    const urlHash = createHash('md5').update(url).digest('hex').substring(0, 8);
    
    return `${urlHash}_${contentHash}`;
  }

  // 生成内容哈希
  private generateContentHash(content: string): string {
    return createHash('md5').update(content).digest('hex');
  }

  // 设置缓存
  set(url: string, content: AIEnhancedContent, rawContent?: string): void {
    // 如果缓存已满，删除最旧的条目
    if (this.cache.size >= this.maxEntries) {
      const oldestKey = Array.from(this.cache.keys())[0];
      this.cache.delete(oldestKey);
    }

    const key = this.generateCacheKey(url, rawContent);
    const now = new Date();
    const expiresAt = new Date(now.getTime() + this.expiresHours * 60 * 60 * 1000);

    const cacheEntry: AICache = {
      url,
      contentHash: rawContent ? this.generateContentHash(rawContent) : '',
      result: content,
      createdAt: now,
      expiresAt,
    };

    this.cache.set(key, cacheEntry);
  }

  // 获取缓存
  get(url: string, rawContent?: string): AIEnhancedContent | null {
    const key = this.generateCacheKey(url, rawContent);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // 检查是否过期
    if (new Date() > cached.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // 如果提供了内容，检查内容是否变更
    if (rawContent) {
      const currentContentHash = this.generateContentHash(rawContent);
      if (currentContentHash !== cached.contentHash) {
        this.cache.delete(key);
        return null;
      }
    }

    return cached.result;
  }

  // 检查缓存是否存在
  has(url: string, rawContent?: string): boolean {
    return this.get(url, rawContent) !== null;
  }

  // 删除缓存
  delete(url: string, rawContent?: string): void {
    const key = this.generateCacheKey(url, rawContent);
    this.cache.delete(key);
  }

  // 清理过期缓存
  private cleanup(): void {
    const now = new Date();
    const expiredKeys: string[] = [];

    for (const [key, cached] of this.cache.entries()) {
      if (now > cached.expiresAt) {
        expiredKeys.push(key);
      }
    }

    expiredKeys.forEach(key => this.cache.delete(key));

    if (expiredKeys.length > 0) {
      console.log(`AI Cache: Cleaned up ${expiredKeys.length} expired entries`);
    }
  }

  // 清空所有缓存
  clear(): void {
    this.cache.clear();
  }

  // 获取缓存统计
  getStats() {
    const now = new Date();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const cached of this.cache.values()) {
      if (now > cached.expiresAt) {
        expiredEntries++;
      } else {
        validEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      maxEntries: this.maxEntries,
      memoryUsage: JSON.stringify(Array.from(this.cache.values())).length,
    };
  }

  // 按URL前缀删除缓存（用于特定平台的缓存清理）
  deleteByUrlPrefix(urlPrefix: string): number {
    const keysToDelete: string[] = [];
    
    for (const [key, cached] of this.cache.entries()) {
      if (cached.url.startsWith(urlPrefix)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    
    return keysToDelete.length;
  }
}

// 单例实例
export const aiCache = new AICacheManager();