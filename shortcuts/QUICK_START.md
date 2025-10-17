# 快捷指令快速上手

## 🎯 核心功能

API **已经直接返回** `flomo://create?content=...` 格式的URL！

你的快捷指令只需要：
1. 获取HTML
2. POST到API
3. **提取ios_url并打开** ✅

---

## ⚡️ 超简单版本（5步完成）

### 步骤1：获取剪贴板
```
动作：获取剪贴板
```

### 步骤2：提取URL
```
动作：从输入获取URL
输入：剪贴板
```

### 步骤3：获取HTML
```
动作：获取URL的内容
配置：
  URL：选择"URL"
  方法：GET
  请求头：
    User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1
```

### 步骤4：调用API
```
动作：获取URL的内容
配置：
  URL：https://your-domain.vercel.app/api/parse
  方法：POST
  请求体：JSON

JSON内容：
{
  "url": "URL变量（步骤2）",
  "output_format": "flomo",
  "options": {
    "preloadedHtml": "URL的内容变量（步骤3）"
  }
}
```

### 步骤5：直接打开flomo ⭐️
```
方式A（两个动作）：
  5.1 获取字典值
      获取：ios_url
      从：URL的内容（步骤4）

  5.2 打开URL
      URL：字典值

方式B（一个动作 - 推荐）：
  打开URL
    URL：从变量中选择 "URL的内容" → "ios_url"
```

---

## 📊 API返回格式

```json
{
  "success": true,
  "data": {
    "title": "🍵早起的小狗有早茶喝",
    "content": "早起打卡...",
    "images": ["图片1", "图片2"],
    ...
  },
  "ios_url": "flomo://create?content=...",  ← 直接用这个！
  "parsed_at": "2025-10-17T..."
}
```

---

## 🎨 切换到备忘录

只需修改步骤4的JSON：

```json
{
  "url": "URL变量",
  "output_format": "notes",  ← 改这里
  "options": {
    "preloadedHtml": "URL的内容变量"
  }
}
```

API会返回：`mobilenotes://...` 格式的URL

---

## 🔍 调试技巧

### 查看API返回的完整内容

在步骤4和步骤5之间添加：

```
动作：显示通知
配置：
  标题：API返回
  文本：选择"URL的内容"（步骤4的输出）
```

### 查看提取的ios_url

在步骤5.2之前添加：

```
动作：显示通知
配置：
  标题：flomo URL
  文本：选择"字典值"（步骤5.1的输出）
```

---

## ✅ 完整流程示意

```
用户：复制小红书链接
  ↓
快捷指令步骤1-2：提取URL
  ↓ 输出
  https://www.xiaohongshu.com/explore/68aedfa2...
  ↓
快捷指令步骤3：iOS端获取HTML（绕过反爬虫）
  ↓ 输出
  <html>完整的网页内容</html>
  ↓
快捷指令步骤4：POST到API
  ↓ 服务器解析
  ↓ 返回JSON
  {
    "success": true,
    "ios_url": "flomo://create?content=..."
  }
  ↓
快捷指令步骤5：提取ios_url
  ↓ 输出
  flomo://create?content=...
  ↓
快捷指令步骤5.2：打开URL
  ↓
自动跳转到flomo App，内容已填好！✅
```

---

## 🎯 为什么这么设计？

### ✅ 优势

1. **iOS端获取HTML**
   - 使用真实iPhone环境
   - 绕过服务器反爬虫限制
   - 成功率更高

2. **API直接返回ios_url**
   - 快捷指令超级简单
   - 不需要复杂的格式化逻辑
   - 一键打开flomo/备忘录

3. **速度极快**
   - HTML获取：1-2秒
   - API解析：0.3秒
   - 总共：2-3秒完成

---

## 🐛 常见问题

### Q1：找不到ios_url字段
**A**：检查步骤4的output_format是否设置为"flomo"或"notes"

### Q2：打开URL失败
**A**：
1. 检查ios_url是否正确提取（添加调试通知）
2. 确认flomo App已安装
3. 尝试手动复制ios_url并在Safari打开

### Q3：内容格式不对
**A**：API会自动格式化内容：
- 标题（Markdown H2格式）
- 正文
- 原始链接
- 时间戳
- 图片链接（如果有）

---

## 🚀 高级功能

### 添加AI增强

修改步骤4的JSON：

```json
{
  "url": "URL变量",
  "output_format": "flomo",
  "ai_enhance": true,
  "ai_options": {
    "enable_summary": true,
    "enable_title_optimization": true
  },
  "options": {
    "preloadedHtml": "URL的内容变量"
  }
}
```

API会返回AI优化后的内容！

---

## 📱 使用场景

### 场景1：日常收藏
```
小红书浏览 → 看到喜欢的内容 → 分享 → 快捷指令 → 自动保存到flomo
```

### 场景2：批量收藏
```
复制多个链接 → 多次运行快捷指令 → 批量保存
```

### 场景3：整理归档
```
output_format: "notes" → 保存到备忘录进行整理
```

---

## 🎓 更多资源

- 详细创建教程：[CREATE_SHORTCUT.md](./CREATE_SHORTCUT.md)
- API文档：[../CLAUDE.md](../CLAUDE.md)
- 测试脚本：[../scripts/test-vercel-api.js](../scripts/test-vercel-api.js)

---

**现在就创建你的快捷指令，享受自动化的便利！🚀**
