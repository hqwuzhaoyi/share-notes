# AI功能使用指南 🤖

欢迎使用 iOS内容解析服务 v2.0 的AI增强功能！本指南将帮助你快速上手所有AI特性。

## 🚀 快速开始

### 1. 配置AI功能

确保在 `.env.local` 文件中配置了OpenAI API密钥：

```bash
OPENAI_API_KEY=your_openai_api_key_here
ENABLE_AI=true
```

### 2. 基础AI增强调用

```bash
curl -X POST http://localhost:3000/api/parse \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://xiaohongshu.com/explore/xxxxx",
    "output_format": "flomo",
    "ai_enhance": true
  }'
```

## 🛠️ AI功能详解

### 📝 智能摘要 (enable_summary)

**功能**: 将长文本压缩为150字以内的精华摘要  
**适用场景**: 长文章、详细教程、深度分析文章  
**效果**: 快速了解内容要点，节省阅读时间  

**配置示例**:
```json
{
  "ai_enhance": true,
  "ai_options": {
    "enable_summary": true
  }
}
```

**输出效果**:
- 原文标题: "深度解析：2024年最值得关注的10个前端技术趋势和实践建议"
- AI摘要: "2024年前端技术趋势包括：React 19、Vue 3.5、TypeScript 5.0、Vite构建工具优化、Web Components标准化等。重点关注性能优化、用户体验提升和开发效率改进。"

### ✨ 标题优化 (enable_title_optimization)

**功能**: 生成更简洁、更适合笔记应用的标题  
**适用场景**: 营销化标题、过长标题、不够简洁的标题  
**效果**: 提升笔记可读性和检索效率  

**配置示例**:
```json
{
  "ai_enhance": true,
  "ai_options": {
    "enable_title_optimization": true
  }
}
```

**优化效果对比**:
- 原标题: "震惊！这个小技巧让我的工作效率提升了300%，老板都夸我！！！"
- 优化标题: "提高工作效率的实用技巧"

### 🏷️ 内容分类 (enable_categorization)

**功能**: 自动识别内容类型和主要分类  
**适用场景**: 内容管理、笔记分类、知识整理  
**效果**: 自动生成分类标签，便于管理和检索  

**配置示例**:
```json
{
  "ai_enhance": true,
  "ai_options": {
    "enable_categorization": true
  }
}
```

**分类结果示例**:
```json
{
  "contentType": "tutorial",
  "categories": ["技术分享", "前端开发"],
  "tags": ["JavaScript", "React", "性能优化", "最佳实践"]
}
```

## 🎯 实际使用场景

### 场景1: 小红书美食探店

**原始内容**: 长篇美食体验分享  
**AI增强效果**:
- 摘要: "推荐XX餐厅的招牌菜品，环境优雅，价格合理，适合约会聚餐"
- 分类: ["生活方式", "美食"]
- 标签: ["美食推荐", "约会", "性价比"]

### 场景2: 技术文章学习

**原始内容**: 深度技术教程  
**AI增强效果**:
- 摘要: 提取核心技术要点和实践建议
- 优化标题: 去除营销词汇，突出技术本质
- 分类: ["技术教程", "编程"]

### 场景3: B站视频笔记

**原始内容**: 视频简介和评论  
**AI增强效果**:
- 摘要: 视频主要内容和观点总结
- 分类: 根据内容自动分类
- 标签: 提取关键概念和知识点

## ⚙️ 高级配置

### 模型选择策略

```json
{
  "ai_enhance": true,
  "ai_options": {
    "model": "gpt-3.5-turbo",    // 经济实用
    // "model": "gpt-4o-mini",   // 平衡性能
    // "model": "gpt-4o",        // 最高质量
    "enable_summary": true,
    "enable_title_optimization": true,
    "enable_categorization": true
  }
}
```

### 选择性启用功能

```json
{
  "ai_enhance": true,
  "ai_options": {
    // 只启用摘要和标题优化，节省成本
    "enable_summary": true,
    "enable_title_optimization": true,
    "enable_categorization": false
  }
}
```

## 💰 成本优化建议

### 1. 智能缓存利用
- 相同URL的内容会自动缓存24小时
- 避免重复解析相同内容

### 2. 选择性启用
- 根据需要选择启用的AI功能
- 不是所有内容都需要完整的AI增强

### 3. 模型选择
- 一般内容使用 `gpt-3.5-turbo` 已足够
- 复杂内容或高质量需求使用 `gpt-4o-mini`

### 4. 批量处理
- 如有多个链接，考虑批量处理减少单次调用成本

## 🔍 调试和监控

### 启用调试模式

```bash
# .env.local
AI_DEBUG=true
AI_LOG_LEVEL=debug
```

### 查看缓存状态

```bash
curl -X GET http://localhost:3000/api/parse
```

查看返回的 `ai_cache_stats` 字段了解缓存使用情况。

## ❌ 常见问题

### Q: AI功能不可用？
A: 检查 `OPENAI_API_KEY` 是否正确配置，确保API密钥有效且有足够余额。

### Q: 响应时间过长？
A: AI增强通常需要2-5秒，可以考虑：
- 使用更快的模型 (`gpt-3.5-turbo`)
- 减少启用的AI功能
- 利用缓存机制

### Q: 成本控制？
A: 查看环境变量中的成本限制配置：
```bash
AI_DAILY_COST_LIMIT=10      # 每日最大成本($)
AI_MAX_COST_PER_REQUEST=0.5 # 单次最大成本($)
```

### Q: AI结果不准确？
A: 可以尝试：
- 使用更高质量的模型 (`gpt-4o-mini` 或 `gpt-4o`)
- 检查原始内容是否完整
- 对于特定平台，AI效果可能因内容质量而异

## 🔄 版本更新

### v2.0.0 (当前版本)
- ✅ 集成LangChain AI框架
- ✅ 支持OpenAI GPT系列模型
- ✅ 智能缓存和成本优化
- ✅ 5大AI功能：摘要、标题优化、分类、标签、智能提取

### 未来计划
- 🔄 支持更多AI模型 (Claude, Gemini)
- 🔄 本地模型支持
- 🔄 更多语言支持
- 🔄 自定义提示词模板

---

💡 **提示**: AI功能是可选的，即使不配置OpenAI API密钥，基础解析功能仍然可以正常使用！