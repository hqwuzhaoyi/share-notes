# iOS内容解析服务项目计划

## 项目概述

这是一个专为iOS快捷指令设计的智能内容解析服务，支持解析小红书、B站、微信公众号等平台的链接内容，并直接输出到flomo或iOS备忘录应用。

**🆕 v2.0 新功能已完成**：成功集成LangChain AI助手，提供内容理解增强、智能摘要、标题优化、内容分类等AI功能。

**🚧 v2.1 优化中**：性能监控、解析缓存、模型策略优化等增强功能开发中。

## 技术栈

- **前端框架**: Next.js 14 (App Router + TypeScript)
- **解析工具**: 
  - `ofetch` - 轻量级HTTP请求，用于静态内容获取
  - `playwright` - 无头浏览器，处理需要JS渲染的动态内容
  - `cheerio` - 服务端DOM解析
- **AI增强**: 
  - `langchain` - AI应用开发框架
  - `@langchain/openai` - OpenAI集成
  - `@langchain/core` - 核心功能
- **部署**: Vercel
- **缓存**: Next.js内置缓存 + AI结果缓存

## 架构设计

### 核心流程
1. iOS快捷指令发送URL到API
2. URL识别器检测平台类型
3. 选择合适的解析策略（ofetch优先，Playwright备用）
4. 提取内容并格式化
5. 返回适配iOS应用的URL scheme

### 解析策略
- **轻量级解析**: 使用ofetch获取HTML，适用于静态内容
- **动态解析**: 使用Playwright处理SPA和反爬虫保护
- **智能降级**: 先尝试轻量级，失败则自动降级到动态解析

## 支持平台

### 小红书 (xiaohongshu.com)
- **内容**: 图文笔记、视频内容
- **提取**: 标题、正文、图片URLs、作者信息
- **策略**: Playwright（需要处理动态加载）

### B站 (bilibili.com) 
- **内容**: 视频信息
- **提取**: 标题、简介、封面图、UP主、播放数据
- **策略**: ofetch优先（API友好），Playwright备用

### 微信公众号 (mp.weixin.qq.com)
- **内容**: 文章内容
- **提取**: 标题、正文、配图、发布时间
- **策略**: ofetch（静态HTML结构稳定）

## API设计

### 主解析接口
```
POST /api/parse
Content-Type: application/json

{
  "url": "https://xiaohongshu.com/explore/...",
  "output_format": "flomo" | "notes" | "raw"
}
```

### 响应格式
```json
{
  "success": true,
  "platform": "xiaohongshu",
  "data": {
    "title": "内容标题",
    "content": "正文内容",
    "images": ["图片URL1", "图片URL2"],
    "author": "作者信息",
    "url": "原始链接"
  },
  "ios_url": "flomo://create?content=...",
  "parsed_at": "2024-01-01T00:00:00Z"
}
```

## iOS集成

### flomo格式
```
flomo://create?content=${encodeURIComponent(content)}&image_urls=${encodeURIComponent(images.join(','))}
```

### 备忘录格式
```
mobilenotes://create?note=${encodeURIComponent(content)}
```

## 项目结构

```
ios-content-parser/
├── src/
│   ├── app/
│   │   └── api/
│   │       └── parse/
│   │           └── route.ts          # 主解析API (支持AI增强)
│   ├── lib/
│   │   ├── ai/                      # 🆕 AI功能模块
│   │   │   ├── config.ts            # AI配置管理
│   │   │   ├── cache.ts             # AI结果缓存
│   │   │   └── langchain-client.ts  # LangChain客户端
│   │   ├── parsers/
│   │   │   ├── base.ts               # 基础解析器类
│   │   │   ├── ai-parser.ts          # 🆕 AI解析器
│   │   │   ├── ofetch-parser.ts      # 轻量级解析器
│   │   │   ├── playwright-parser.ts  # 动态解析器
│   │   │   ├── xiaohongshu.ts        # 小红书解析器
│   │   │   ├── bilibili.ts           # B站解析器
│   │   │   ├── wechat.ts             # 微信公众号解析器
│   │   │   └── index.ts              # 解析器管理器 (集成AI)
│   │   ├── utils/
│   │   │   ├── platform-detector.ts  # 平台识别
│   │   │   ├── url-validator.ts      # URL验证
│   │   │   └── ios-formatter.ts      # iOS输出格式化 (支持AI字段)
│   │   └── types/
│   │       ├── parser.ts             # 基础类型定义
│   │       └── ai.ts                 # 🆕 AI相关类型定义
├── test/
│   └── test-api.js                   # API测试脚本
├── PROJECT_PLAN.md                   # 项目计划文档 (包含AI功能说明)
├── README.md                         # 使用说明 (包含AI功能介绍)
├── AI_GUIDE.md                       # 🆕 AI功能详细指南
└── vercel.json                       # 部署配置
```

## 开发计划

### Phase 1: 基础架构 ✅
- [x] 创建Next.js项目
- [x] 安装核心依赖
- [x] 项目结构设计
- [x] 类型定义

### Phase 2: 核心解析引擎 ✅
- [x] URL识别器和平台检测
- [x] ofetch轻量级解析器
- [x] Playwright动态解析器
- [x] 智能降级机制

### Phase 3: 平台适配器 ✅
- [x] 小红书解析器
- [x] B站解析器  
- [x] 微信公众号解析器
- [x] 通用fallback解析器

### Phase 4: API接口 ✅
- [x] 主解析API (`/api/parse`)
- [x] 请求验证和错误处理
- [x] 响应格式标准化
- [x] 缓存机制

### Phase 5: iOS集成 ✅
- [x] flomo URL scheme支持
- [x] 备忘录格式支持
- [x] 内容编码处理
- [x] 图片链接验证

### Phase 6: 部署和优化 ✅
- [x] Vercel部署配置
- [x] 环境变量管理
- [x] 性能优化
- [x] 错误监控

## 部署说明

### 环境变量
```bash
# .env.local
NODE_ENV=production
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1  # Vercel环境
```

### Vercel配置
```json
{
  "functions": {
    "src/app/api/parse/route.ts": {
      "maxDuration": 30
    }
  },
  "crons": []
}
```

## 使用示例

### 快捷指令配置
1. 获取输入 → 从快捷指令输入获取URL
2. 获取网页内容 → POST到解析API
3. 显示结果 → 自动打开flomo或备忘录

### API调用示例
```javascript
const response = await fetch('/api/parse', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    url: 'https://xiaohongshu.com/explore/xxxxx',
    output_format: 'flomo'
  })
});

const result = await response.json();
// 打开flomo应用
window.open(result.ios_url);
```

## LangChain AI集成计划

### Phase 7: LangChain AI助手集成 ✅ (已完成)

#### 应用场景 ✅
1. **内容理解增强**：当传统解析失败时，用AI理解页面结构 ✅
2. **内容摘要生成**：为长文本自动生成摘要 ✅
3. **标题优化**：生成更适合flomo/备忘录的标题 ✅
4. **内容分类**：自动识别内容类型和主题 ✅
5. **智能提取**：从复杂HTML中提取关键信息 ✅

#### 技术架构 ✅
```typescript
// AI解析器架构 - 已实现
class AIParser extends AbstractBaseParser {
  private langchainClient: LangChainClient;
  
  // 核心功能
  async enhance(content: ParsedContent, aiOptions?: AIOptions): Promise<AIEnhancedContent>;
  async extractFromHTML(html: string, url: string, aiOptions?: AIOptions): Promise<ParsedContent>;
  async batchEnhance(contents: ParsedContent[], aiOptions?: AIOptions): Promise<AIEnhancedContent[]>;
  
  // 支持功能
  isAIAvailable(): boolean;
  getAvailableModels(): string[];
  getCacheStats(): CacheStats;
  clearCache(urlPrefix?: string): void;
}

// LangChain客户端 - 已实现
class LangChainClient {
  async generateSummary(text: string, model?: string): Promise<AITaskResult<string>>;
  async optimizeTitle(title: string, content: string, model?: string): Promise<AITaskResult<string>>;
  async categorizeContent(content: string, model?: string): Promise<AITaskResult<CategoryResult>>;
  async extractFromHTML(html: string, url: string, model?: string): Promise<AITaskResult<ParsedContent>>;
}
```

#### 实施计划 ✅ (已完成)
- [x] 安装LangChain相关依赖 (`langchain`, `@langchain/openai`, `@langchain/core`) ✅
- [x] 创建AI解析器基础架构 ✅
- [x] 实现内容理解增强功能 - 当传统解析失败时AI兜底 ✅
- [x] 实现内容摘要生成 - 为长文本生成简洁摘要 ✅
- [x] 实现标题优化功能 - 生成更适合笔记应用的标题 ✅
- [x] 实现内容分类功能 - 自动识别内容类型和主题标签 ✅
- [x] 实现智能HTML提取 - 从复杂页面结构中提取核心信息 ✅
- [x] 集成到现有解析管理器 - 无缝集成到当前架构 ✅
- [x] 添加智能路由策略 - 根据内容复杂度和解析成功率选择策略 ✅
- [x] 实现AI解析缓存机制 - 缓存相似内容的AI结果优化成本 ✅
- [x] 更新API接口支持AI选项 - 添加`ai_enhance`等参数 ✅
- [x] 添加错误处理和降级机制 - AI失败时的优雅降级 ✅
- [x] 更新项目文档 - 包含AI功能的使用说明 ✅
- [x] 添加AI功能测试用例 - 验证各AI功能的正确性 ✅

#### Phase 8: 性能优化和监控 🚧 (进行中)
- [ ] 添加解析性能监控 - 记录解析时间和成功率
- [ ] 实现解析结果缓存 - 减少重复解析开销
- [ ] 优化AI模型选择策略 - 根据内容复杂度自动选择最优模型
- [ ] 添加错误分析和告警 - 监控解析失败率和AI调用失败
- [ ] 实现平台适配器热更新 - 无需重启即可更新解析策略
- [ ] 添加A/B测试支持 - 比较不同解析策略的效果

#### 成本优化策略
1. **分层解析**：简单内容用传统方法，复杂内容用AI
2. **智能缓存**：相似内容复用AI结果，减少重复API调用
3. **模型选择**：根据任务复杂度选择不同价位模型
   - 简单分类：使用gpt-3.5-turbo
   - 复杂提取：使用gpt-4o-mini
   - 内容摘要：使用claude-3-haiku
4. **批量处理**：合并多个小任务减少API调用次数
5. **条件触发**：只在传统解析失败或用户明确请求时使用AI
6. **结果缓存**：基于URL+内容哈希缓存AI解析结果

## 注意事项

### 基础功能注意事项
1. **反爬虫处理**: Playwright配置User-Agent和请求头
2. **超时控制**: 设置合理的请求超时时间
3. **错误处理**: 优雅降级，提供有用的错误信息
4. **缓存策略**: 避免重复解析相同内容
5. **安全考虑**: 验证URL合法性，防止SSRF攻击

### AI功能注意事项 ✅ (已实现)
1. **AI成本控制**: 智能缓存机制，避免重复AI调用
2. **模型选择**: 根据任务需求自动选择合适的模型
3. **降级策略**: AI失败时优雅降级到传统解析
4. **性能优化**: 并行处理多个AI任务，减少延迟
5. **错误监控**: 详细的AI调用日志和错误统计

### 当前系统状态 📊
- **基础解析器**: 小红书、B站、微信公众号解析器已实现并稳定运行
- **AI增强功能**: 摘要生成、标题优化、内容分类功能已完成开发和测试
- **智能缓存**: AI结果缓存机制已实现，有效降低API调用成本
- **API接口**: 完全向后兼容，新增AI增强选项可选启用
- **部署状态**: 已配置Vercel部署，支持生产环境运行