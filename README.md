# iOS内容解析服务

专为iOS快捷指令设计的**智能内容解析服务**，支持解析小红书、B站、微信公众号等平台的链接内容，并直接输出到flomo或iOS备忘录应用。

🆕 **v2.0 新增功能**：集成LangChain AI助手，提供内容摘要、标题优化、智能分类等AI增强功能！

## 特性

### 🔧 基础功能
- 🚀 **多平台支持**: 支持小红书、B站、微信公众号等主流平台
- 🔄 **智能解析策略**: ofetch轻量级解析 + Playwright动态解析
- 📱 **iOS集成**: 直接输出flomo和备忘录的URL scheme
- ⚡ **高性能**: 智能缓存和错误处理
- 🛡️ **安全可靠**: URL验证和SSRF防护

### 🤖 AI增强功能 (v2.0)
- 📝 **智能摘要**: 为长文本自动生成简洁摘要
- ✨ **标题优化**: 生成更适合笔记应用的标题
- 🏷️ **内容分类**: 自动识别内容类型和主题标签
- 🎯 **智能提取**: 从复杂HTML中提取关键信息
- 💡 **智能路由**: 根据平台复杂度自动选择最佳解析策略
- 💰 **成本优化**: 智能缓存和分层模型选择

## 快速开始

### 环境要求

- Node.js 18+
- npm 或 yarn
- AI API Key (用于AI功能，支持自定义LLM和OpenAI)

### 安装依赖

```bash
npm install
```

### 环境配置

创建 `.env.local` 文件：

```bash
# 基础配置
NODE_ENV=development
ENABLE_AI=true

# 🎯 方案1: 自定义LLM配置 (推荐 - 成本更低)
LLM_API_KEY=your_llm_api_key_here
LLM_API_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
LLM_MODEL=qwen-plus

# 🔄 方案2: OpenAI配置 (备选)
# OPENAI_API_KEY=your_openai_api_key_here

# Playwright配置 (Vercel部署时需要)
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1
```

### 本地开发

```bash
npm run dev
```

服务将在 `http://localhost:4000` 启动。

### API使用

#### 主要端点

**基础解析**
```http
POST /api/parse
Content-Type: application/json

{
  "url": "https://xiaohongshu.com/explore/xxxxx",
  "output_format": "flomo"
}
```

**AI增强解析** 🤖
```http
POST /api/parse
Content-Type: application/json

{
  "url": "https://xiaohongshu.com/explore/xxxxx",
  "output_format": "flomo",
  "ai_enhance": true,
  "ai_options": {
    "enable_summary": true,
    "enable_title_optimization": true,
    "enable_categorization": true,
    "model": "qwen-plus"
  }
}
```

**iOS快捷指令预取HTML** 📱 (Vercel部署推荐)
```http
POST /api/parse
Content-Type: application/json

{
  "url": "https://xiaohongshu.com/explore/xxxxx",
  "output_format": "flomo",
  "ai_enhance": true,
  "options": {
    "preloadedHtml": "从iOS快捷指令获取的完整HTML内容..."
  }
}
```

#### 响应格式

**基础响应**
```json
{
  "success": true,
  "data": {
    "title": "内容标题",
    "content": "正文内容", 
    "images": ["图片URL1", "图片URL2"],
    "author": "作者信息",
    "platform": "xiaohongshu",
    "originalUrl": "https://xiaohongshu.com/explore/xxxxx",
    "publishedAt": "2024-01-01T00:00:00Z"
  },
  "ios_url": "flomo://create?content=...",
  "parsed_at": "2024-01-01T00:00:00Z"
}
```

**AI增强响应** ✨
```json
{
  "success": true,
  "data": {
    "title": "内容标题",
    "content": "正文内容",
    "images": ["图片URL1", "图片URL2"],
    "author": "作者信息",
    "platform": "xiaohongshu",
    "originalUrl": "https://xiaohongshu.com/explore/xxxxx",
    // AI增强字段
    "summary": "AI生成的简洁摘要，适合快速阅读...",
    "optimizedTitle": "AI优化的笔记标题",
    "categories": ["生活方式", "美食"],
    "tags": ["美食推荐", "探店", "网红餐厅"],
    "contentType": "review",
    "aiEnhanced": true
  },
  "ios_url": "flomo://create?content=...",
  "parsed_at": "2024-01-01T00:00:00Z"
}
```

#### 支持的平台

| 平台 | URL格式 | 解析策略 | AI增强 |
|------|---------|----------|--------|
| 小红书 | `xiaohongshu.com/*` | Playwright | ✅ 自动启用 |
| B站 | `bilibili.com/*`, `b23.tv/*` | ofetch + Playwright fallback | ✅ 可选启用 |
| 微信公众号 | `mp.weixin.qq.com/*` | ofetch | ✅ 可选启用 |

#### 输出格式

- `flomo`: 返回flomo应用的URL scheme (支持AI增强标签和分类)
- `notes`: 返回iOS备忘录的URL scheme (支持AI增强内容)
- `raw`: 返回原始解析数据 (包含所有AI增强字段)

#### AI功能详解

| AI功能 | 描述 | 使用场景 |
|---------|------|----------|
| 📝 智能摘要 | 将长文本压缩为150字以内的精华摘要 | 快速了解内容要点 |
| ✨ 标题优化 | 生成更简洁、更适合笔记应用的标题 | 提升笔记可读性 |
| 🏷️ 内容分类 | 自动识别内容类型和主要分类 | 内容管理和检索 |
| 🎯 智能标签 | 提取关键词生成相关标签 | flomo标签系统集成 |
| 💡 智能路由 | 根据平台复杂度自动选择最佳策略 | 提高成功率和效率 |

## iOS快捷指令配置

### 1. 创建快捷指令

1. 打开iOS快捷指令应用
2. 点击右上角"+"创建新快捷指令
3. 添加以下操作：

### 2. 快捷指令步骤

**基础版本**
```
1. 【获取输入】→ 从快捷指令输入获取URL
2. 【获取网页内容】→ 
   - URL: https://your-domain.vercel.app/api/parse
   - 方法: POST
   - 请求体: {"url": "输入的URL", "output_format": "flomo"}
   - 头部: Content-Type: application/json
3. 【获取字典值】→ 获取响应中的 ios_url
4. 【打开URL】→ 打开获取到的URL
```

**AI增强版本** 🤖
```
1. 【获取输入】→ 从快捷指令输入获取URL
2. 【获取网页内容】→ 
   - URL: https://your-domain.vercel.app/api/parse
   - 方法: POST
   - 请求体: {
       "url": "输入的URL", 
       "output_format": "flomo",
       "ai_enhance": true,
       "ai_options": {
         "enable_summary": true,
         "enable_title_optimization": true,
         "enable_categorization": true,
         "model": "qwen-plus"
       }
     }
   - 头部: Content-Type: application/json
3. 【获取字典值】→ 获取响应中的 ios_url
4. 【打开URL】→ 打开获取到的URL
```

**Vercel环境增强版** (推荐) 🌐
```
1. 【获取输入】→ 从快捷指令输入获取URL
2. 【获取网页内容】→ 获取页面HTML内容  
3. 【获取网页内容】→ 
   - URL: https://your-domain.vercel.app/api/parse
   - 方法: POST
   - 请求体: {
       "url": "输入的URL", 
       "output_format": "flomo",
       "ai_enhance": true,
       "options": {
         "preloadedHtml": "步骤2获取的HTML内容"
       }
     }
   - 头部: Content-Type: application/json
4. 【获取字典值】→ 获取响应中的 ios_url
5. 【打开URL】→ 打开获取到的URL
```

### 3. 使用方式

- 在任何应用中分享URL到快捷指令
- 自动解析内容并保存到flomo或备忘录

## 部署

### 🚀 Vercel部署 (推荐)

#### 快速部署

1. **Fork仓库**: Fork此仓库到你的GitHub账户
2. **连接Vercel**: 在[vercel.com](https://vercel.com)导入项目
3. **配置环境变量**: 在Vercel项目设置中添加以下变量
4. **自动部署**: 推送代码即可自动部署

#### 必需的环境变量

```bash
# 🔧 基础配置
NODE_ENV=production
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1  # Vercel必需！
ENABLE_AI=true

# 🤖 AI配置 (二选一)

# 方案1: 自定义LLM (推荐，成本节省60-80%)
LLM_API_KEY=your_llm_api_key_here
LLM_API_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
LLM_MODEL=qwen-plus

# 方案2: OpenAI (备选)
# OPENAI_API_KEY=your_openai_api_key_here

# 🔧 可选配置
API_TIMEOUT=30000
AI_DEBUG=false
AI_DAILY_COST_LIMIT=10
AI_MAX_COST_PER_REQUEST=0.5
```

#### ⚠️ Vercel部署重要提醒

**Playwright限制**: Vercel serverless环境不支持浏览器，系统会自动:

1. **自动降级**: 使用`fetch`进行基础解析
2. **智能提示**: 建议使用`preloadedHtml`获得最佳效果
3. **性能优化**: fetch比Playwright更快更稳定

**推荐使用方式**:
- 🎯 **iOS快捷指令**: 预取HTML内容传递给API
- 📱 **最佳实践**: 结合iOS快捷指令使用`preloadedHtml`参数
- 🚀 **高成功率**: 与本地开发环境相同的解析效果

详细部署指南请参考: [DEPLOYMENT.md](./DEPLOYMENT.md)

## 开发

### 项目结构

```
src/
├── app/api/parse/          # API路由
├── lib/
│   ├── ai/                # AI功能模块 🤖
│   │   ├── config.ts      # AI配置管理
│   │   ├── cache.ts       # AI结果缓存
│   │   └── langchain-client.ts # LangChain客户端
│   ├── parsers/           # 解析器
│   │   ├── ai-parser.ts   # AI解析器 🆕
│   │   ├── xiaohongshu.ts
│   │   ├── bilibili.ts
│   │   ├── wechat.ts
│   │   └── index.ts       # 解析器管理器
│   ├── utils/             # 工具类
│   │   └── ios-formatter.ts # iOS格式化器 (支持AI)
│   └── types/             # 类型定义
│       ├── parser.ts      # 基础类型
│       └── ai.ts          # AI相关类型 🆕
└── test/                  # 测试文件
```

### 测试

```bash
# 启动开发服务器
npm run dev

# 运行测试
npm test
```

## 技术栈

### 🔧 核心技术
- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **解析工具**: ofetch, Playwright, Cheerio
- **部署**: Vercel

### 🤖 AI技术栈
- **AI框架**: LangChain with structured output parsing
- **支持的LLM**:
  - **阿里云通义千问**: qwen-plus (默认，成本最优)
  - **OpenAI GPT**: gpt-3.5-turbo, gpt-4o-mini, gpt-4o
  - **自定义LLM**: 支持OpenAI兼容接口
- **功能特性**: 
  - 🔄 智能缓存 (24小时TTL)
  - 💰 成本优化 (比OpenAI节省60-80%)
  - 🔁 自动重试和错误修复
  - 📊 结构化输出解析
  - 🎯 分层模型选择

## 注意事项

### ⚠️ 基础注意事项
1. **反爬虫**: 部分平台有反爬虫机制，解析可能失败
2. **速率限制**: 建议合理使用，避免频繁请求
3. **内容变化**: 平台页面结构可能变化，影响解析效果
4. **隐私**: 不存储解析内容，仅实时处理

### 🤖 AI功能注意事项
1. **API成本**: AI功能需要LLM API密钥，产生使用费用
2. **响应时间**: AI增强会增加1-3秒的处理时间
3. **成本控制**: 
   - ✅ 智能缓存24小时，避免重复调用
   - ✅ 自动选择成本最优模型 (推荐Qwen Plus)
   - ✅ 可选择性启用不同AI功能
   - ✅ 每日成本限额保护
4. **可用性**: 需要稳定网络连接到LLM API
5. **隐私**: AI处理内容会发送到第三方LLM服务

### 💰 成本估算对比

| 功能 | Qwen Plus | OpenAI GPT-3.5 | 节省比例 |
|------|-----------|----------------|----------|
| 摘要生成 | ~$0.0004-0.0012 | ~$0.001-0.003 | 60-70% |
| 标题优化 | ~$0.0002-0.0006 | ~$0.0005-0.001 | 60-80% |
| 内容分类 | ~$0.0002-0.0006 | ~$0.0005-0.001 | 60-80% |
| 智能提取 | ~$0.0008-0.002 | ~$0.002-0.005 | 60-75% |

**推荐配置**: 使用Qwen Plus可节省60-80%的AI成本，同时保持相近的处理效果。

*实际成本取决于内容长度和选择的模型*

## 贡献

欢迎提交Issue和Pull Request来改进项目。

## 许可证

MIT License