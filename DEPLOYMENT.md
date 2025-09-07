# Vercel 部署指南

## 🚀 快速部署

### 1. 准备工作

1. **Fork 仓库**: 将此仓库 fork 到你的 GitHub 账户
2. **注册 Vercel**: 访问 [vercel.com](https://vercel.com) 并注册账户

### 2. 连接项目

1. 在 Vercel 控制台中点击 "New Project"
2. 选择你 fork 的 `ios-content-parser` 仓库
3. 保持默认设置，点击 "Deploy"

### 3. 配置环境变量

在 Vercel 项目设置中添加以下环境变量：

#### 🔧 必需的环境变量

```bash
# 生产环境配置
NODE_ENV=production

# Vercel必需设置（禁用Playwright浏览器下载）
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1

# 启用AI功能
ENABLE_AI=true
```

#### 🤖 AI配置（二选一）

**方案1: 自定义LLM（推荐，成本更低）**
```bash
LLM_API_KEY=your_llm_api_key_here
LLM_API_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
LLM_MODEL=qwen-plus
```

**方案2: OpenAI（备选）**
```bash
OPENAI_API_KEY=your_openai_api_key_here
```

#### ⚙️ 可选配置

```bash
# AI调试（生产环境建议关闭）
AI_DEBUG=false
AI_LOG_LEVEL=info

# 成本控制
AI_DAILY_COST_LIMIT=10
AI_MAX_COST_PER_REQUEST=0.5

# 性能配置
API_TIMEOUT=30000
```

### 4. 重新部署

设置环境变量后，点击 "Redeploy" 以使配置生效。

## 🌟 部署后的重要提醒

### Playwright 限制

在 Vercel 环境中，**Playwright 无法运行**（serverless 限制），系统会自动使用以下替代方案：

1. **优先推荐**: 使用 iOS 快捷指令预取 HTML 内容
   ```json
   {
     "url": "http://xhslink.com/n/9qQs6fCAtZN",
     "output_format": "flomo",
     "options": {
       "preloadedHtml": "<!DOCTYPE html>..."
     }
   }
   ```

2. **自动降级**: 系统会使用 `fetch` 进行基础解析（成功率较低）

### 最佳使用实践

#### 🎯 对于小红书内容（推荐）

由于小红书的反爬措施，在 Vercel 生产环境中建议：

1. **使用 iOS 快捷指令**获取完整 HTML 内容
2. **通过 `preloadedHtml` 参数**传递给 API
3. 这样可以获得与本地开发环境相同的解析效果

#### 📱 iOS 快捷指令配置

```json
POST https://your-domain.vercel.app/api/parse
{
  "url": "小红书链接",
  "output_format": "flomo",
  "ai_enhance": true,
  "options": {
    "preloadedHtml": "从iOS快捷指令获取的HTML内容"
  }
}
```

## 📊 监控和日志

### 查看部署日志

1. 进入 Vercel 项目控制台
2. 点击 "Functions" 标签
3. 查看 `/api/parse` 函数的执行日志

### 常见问题排查

#### ❌ "Playwright not available"
- **原因**: Vercel 无法运行浏览器
- **解决**: 使用 `preloadedHtml` 或等待自动降级

#### ❌ "AI enhancement failed"
- **原因**: API密钥未配置或无效
- **解决**: 检查环境变量 `LLM_API_KEY` 或 `OPENAI_API_KEY`

#### ❌ "Request timeout"
- **原因**: 网络请求超时
- **解决**: 增加 `API_TIMEOUT` 环境变量

## 🔄 更新部署

当你推送代码到 GitHub 主分支时，Vercel 会自动重新部署。

## 💡 成本优化建议

1. **使用 Qwen Plus**: 比 OpenAI 成本低 60-80%
2. **启用AI缓存**: 避免重复处理相同内容
3. **合理设置限额**: 
   - `AI_DAILY_COST_LIMIT=10` (每日$10限额)
   - `AI_MAX_COST_PER_REQUEST=0.5` (单次最大$0.5)

## 📚 完整API使用示例

```bash
# 基础解析
curl -X POST https://your-domain.vercel.app/api/parse \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://xhslink.com/n/9qQs6fCAtZN",
    "output_format": "flomo"
  }'

# AI增强解析
curl -X POST https://your-domain.vercel.app/api/parse \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://xhslink.com/n/9qQs6fCAtZN", 
    "output_format": "flomo",
    "ai_enhance": true,
    "ai_options": {
      "enable_summary": true,
      "enable_title_optimization": true
    }
  }'

# 使用预取HTML（推荐）
curl -X POST https://your-domain.vercel.app/api/parse \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://xhslink.com/n/9qQs6fCAtZN",
    "output_format": "flomo",
    "ai_enhance": true,
    "options": {
      "preloadedHtml": "完整的HTML内容..."
    }
  }'
```

## ✅ 部署成功验证

部署完成后，访问以下端点验证：

```bash
# 健康检查
GET https://your-domain.vercel.app/api/parse

# 应该返回API信息和缓存统计
```

---

🎉 **恭喜！你的iOS内容解析服务已成功部署到Vercel！**

有任何问题，请查看项目的 GitHub Issues 或 README 文档。