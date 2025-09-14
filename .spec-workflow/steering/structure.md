# Project Structure - iOS Content Parser

## Directory Organization

### Core Application Structure

```text
src/
├── app/                          # Next.js App Router
│   ├── api/
│   │   └── parse/
│   │       └── route.ts          # POST /api/parse
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Global styles
│
├── lib/
│   ├── ai/                       # AI layer (v2.0)
│   │   ├── cache.ts              # 24h TTL
│   │   ├── config.ts             # AI config
│   │   └── langchain-client.ts   # LLM integration
│   │
│   ├── parsers/                  # Strategy layer
│   │   ├── index.ts              # Parser manager
│   │   ├── base.ts               # Base interfaces
│   │   ├── ai-parser.ts          # AI decorator
│   │   ├── xiaohongshu.ts        # 小红书
│   │   ├── bilibili.ts           # B站
│   │   ├── wechat.ts             # 公众号
│   │   ├── ofetch-parser.ts      # Generic HTTP
│   │   └── playwright-parser.ts  # Dynamic fallback
│   │
│   ├── types/
│   │   ├── parser.ts             # Core types
│   │   └── ai.ts                 # AI types
│   │
│   └── utils/
│       ├── ios-formatter.ts      # iOS URL scheme
│       ├── platform-detector.ts  # URL → platform
│       └── url-validator.ts      # URL & SSRF guard
│
└── test/
    ├── ai/
    ├── api/
    ├── parsers/
    ├── performance/
    └── utils/
```

## File Naming Conventions

### TypeScript Files

- 全部使用 kebab-case：`platform-detector.ts`、`langchain-client.ts`
- 后缀标识层次：`-parser.ts`、`-client.ts`、`-formatter.ts`

### Test Files

- 路径镜像源文件，使用 `.test.ts`
- 集成测试集中于 `test/api/`

### API Routes

- Next App Router：`app/api/[endpoint]/route.ts`
- 仅导出所需 HTTP 方法（`POST`、`GET`）

## Code Organization Patterns

### Class Structure（Parsers）

```typescript
export class PlatformParser extends BaseParser {
  platform: PlatformType = 'platform';
  canParse(url: string): boolean { /* ... */ }
  async parse(url: string, options?: ParserOptions): Promise<ParsedContent> { /* ... */ }
  // private helpers ...
}
```

### Function Organization

```typescript
export async function publicApi() { /* ... */ }
async function helper() { /* ... */ }
function isValidContent(x: unknown): x is ParsedContent { /* ... */ }
const DEFAULT_TIMEOUT = 30000;
```

### Import Organization

```typescript
// 1) Node 内置
import { URL } from 'url';
// 2) 外部库
import { NextRequest, NextResponse } from 'next/server';
// 3) 内部库（绝对路径）
import { BaseParser } from '@/lib/parsers/base';
import { ParsedContent } from '@/lib/types/parser';
// 4) 相对路径
import { validateUrl } from '../utils/url-validator';
```

## TypeScript Conventions

### Interface vs Type

- Interface：对象结构（ParsedContent, ParserOptions）
- Type：联合/原语（PlatformType, OutputFormat）
- Generics：可复用结果（`AITaskResult<T>`）

### Error Handling

```typescript
interface TaskResult<T> { success: boolean; data?: T; error?: string; model?: string }
try { /* ... */ } catch (e) { /* ... */ }
```

### Async/Await

- 统一使用 async/await
- try/catch 捕获外部 IO
- finally 做资源清理（浏览器、文件）

## Configuration Management

### Environment Variables

```typescript
export const config = {
  ai: {
    enabled: process.env.ENABLE_AI === 'true',
    apiKey: process.env.LLM_API_KEY,
    baseUrl: process.env.LLM_API_BASE_URL,
    model: process.env.LLM_MODEL || 'qwen-plus',
  },
  parsing: {
    timeout: parseInt(process.env.API_TIMEOUT || '30000'),
    enablePlaywright: process.env.NODE_ENV !== 'test',
  },
};
```

### Runtime Validation

- 启动时校验关键环境变量
- 外部数据使用类型守卫
- 可选能力优雅降级

## Testing Organization

### Tests Layout

```typescript
import { describe, it, expect } from 'vitest';
describe('PlatformParser', () => {
  it('parses valid URL', async () => {
    // Arrange, Act, Assert
  });
});
```

### Mocks

- LLM：使用 Mock 响应
- Playwright：测试中模拟

## Performance Guidelines

### Bundle & Runtime

- 大依赖（Playwright）按需引用（仅服务端）
- Tree-shaking 友好导出
- 服务端执行，避免客户端打包

### Memory & Cache

- 浏览器上下文用后即焚
- 大对象及时释放
- AI 结果缓存（24h）、HTTP 缓存（5min）

## Deployment Structure

- 构建：`next build --turbopack`
- 产物：`.next`
- 环境变量：生产与本地分离
- 浏览器：生产禁下（`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`）

## Documentation Standards

- 注释描述“为何而非何物”
- 公共接口用 JSDoc
- README：快速开始 / API / 环境 / 部署
