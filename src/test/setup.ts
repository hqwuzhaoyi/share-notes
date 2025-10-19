import { config } from 'dotenv';
import path from 'path';
import { beforeEach, vi } from 'vitest';

// 加载环境变量
config({ path: path.resolve(process.cwd(), '.env.local') });

// Polyfill for File API (required by undici in Node environment)
if (typeof globalThis.File === 'undefined') {
  class FilePolyfill {
    name: string;
    type: string;
    size: number;
    lastModified: number;

    constructor(bits: any[], name: string, options?: { type?: string; lastModified?: number }) {
      this.name = name;
      this.type = options?.type || '';
      this.size = 0;
      this.lastModified = options?.lastModified || Date.now();
    }
  }

  (globalThis as any).File = FilePolyfill;
}

// 设置测试超时
beforeEach(() => {
  vi.clearAllMocks();
});