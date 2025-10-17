# Technology Stack - iOS Content Parser

## Core Technologies

### Framework & Runtime
- Next.js 15.5.0（App Router，Turbopack 构建）
- TypeScript 5（严格模式）
- React 19.1.0
- Node.js 18+

### Content Parsing
- ofetch（轻量 HTTP 抓取）
- Playwright（动态渲染/反爬处理，开发/本地兜底）
- Cheerio（HTML 解析）

### AI Enhancement
- LangChain（结构化输出、重试与修复）
- LLM：通义千问 Qwen Plus（主），OpenAI（备）
- 结构化解析：基于 schema 的输出修复与验证
- 成本控制：智能缓存、模型分层、指数退避重试

### Dev & Test
- Vitest（单测/基准测试），覆盖率
- ESLint 9（Next 官方规则 + 自定义）
- TailwindCSS v4（如需 UI）
- 集成测试（API 端到端）

## Architecture Patterns

### 设计模式
- Strategy：平台解析器实现 BaseParser
- Chain of Responsibility：平台 → 通用 → AI 级联降级
- Decorator：AI 增强包裹基础解析
- Singleton：Parser 管理器实例

### 错误处理
- 优雅降级：尽可能返回可用信息
- 多层降级：解析器 → 通用 → AI → 原始 URL
- 智能重试：AI 任务指数退避
- 上下文保留：降级过程保留已有结果

## Performance Targets
- 标准解析：P95 < 3s
- AI 增强：P95 < 5s
- 缓存命中：< 500ms
- 平台识别：< 100ms

### 扩展性
- 并发请求：100+
- 内存占用：< 512MB/实例
- 浏览器上下文：30s 空闲回收
- LLM 速率限制：遵循配额

## Deployment & Infra

### Vercel（主）
- Serverless Functions，Turbopack 构建
- 生产环境下禁用浏览器下载：`PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`
- 建议通过 iOS Shortcuts 预取 HTML，避免生产直接跑浏览器

### 环境变量示例
```bash
# Core
NODE_ENV=production
ENABLE_AI=true

# LLM (Primary)
LLM_API_KEY=xxx
LLM_API_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
LLM_MODEL=qwen-plus

# OpenAI (Fallback)
OPENAI_API_KEY=xxx

# Perf & Cost
API_TIMEOUT=30000
AI_DAILY_COST_LIMIT=10
AI_MAX_COST_PER_REQUEST=0.5
```

## Security & Privacy

### 数据处理
- 无持久化存储，仅内存处理
- URL 验证与 SSRF 防护
- API Key 仅通过环境变量注入，不下发到客户端
- 生产建议配合速率限制与基础 WAF

### 反爬/风控
- User-Agent/Headers 仿真（本地 Playwright）
- 随机化时序与等待策略
- 失败优雅回退至通用解析

## 依赖与服务
- LLM：通义千问（主）、OpenAI（备）
- 平台 API：无（以页面抓取为主）
- iOS 集成：URL Scheme 生成
- 可选：监控、分析、外部缓存（未来）

## 关键技术决策

### 解析策略
- Playwright 优于 Selenium（现代 API 与可靠性）
- ofetch 优于 axios（体积小、与环境集成更好）
- 多解析器方案以适配平台差异

### AI 集成
- LangChain 抽象优于直连，便于结构化与重试/修复
- Qwen Plus 优先，中文内容性价比高；OpenAI 作为备选
- AI 为可选能力，保证基础路径快速稳定

## 工具与规范
- TypeScript 严格模式；避免 any
- ESLint（next 配置）+ import 分组
- 测试：单测/集成/性能；AI 测试使用 Mock
- CI：类型检查、测试、环境变量校验