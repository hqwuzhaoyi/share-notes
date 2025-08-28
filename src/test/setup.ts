import { config } from 'dotenv';
import path from 'path';
import { beforeEach, vi } from 'vitest';

// 加载环境变量
config({ path: path.resolve(process.cwd(), '.env.local') });

// 设置测试超时
beforeEach(() => {
  vi.clearAllMocks();
});