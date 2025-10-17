# iOS快捷指令文件说明

## 📁 文件列表

### 1. `xiaohongshu-to-flomo.json`
快捷指令的结构化配置文件，包含：
- 完整的动作流程
- 变量说明
- 配置参数

**用途**：技术参考，了解快捷指令的完整结构

### 2. `CREATE_SHORTCUT.md` ⭐️ 推荐
**详细的手动创建指南**，包含：
- 每个步骤的截图级说明
- 完整的配置参数
- 变量流转图
- 常见问题解答
- 测试清单

**用途**：按照这个文档，5分钟内手动创建完整快捷指令

---

## 🚀 快速开始

### 方法1：手动创建（推荐）

1. 在iPhone上打开 **"快捷指令"** App
2. 打开本仓库的 `CREATE_SHORTCUT.md` 文件
3. 按照步骤1-6逐步创建
4. 完成后测试

**优势**：
- ✅ 可以完全理解每一步的作用
- ✅ 可以根据需要自定义
- ✅ 学习快捷指令的使用方法

**耗时**：5-10分钟

---

### 方法2：使用配置文件

1. 在iPhone上访问这个仓库
2. 查看 `xiaohongshu-to-flomo.json`
3. 根据JSON结构手动创建

**优势**：
- ✅ 有结构化的参考
- ✅ 不会遗漏步骤

**耗时**：10-15分钟

---

## 📱 为什么不能直接导入？

iOS快捷指令的 `.shortcut` 文件格式是：
- **专有的二进制格式**
- 包含签名和设备信息
- 必须通过iCloud链接或AirDrop分享

因此，最可靠的方式是**手动创建**。

---

## 🎯 使用前准备

### 1. 部署API服务

确保你已经部署了解析API到Vercel：

```bash
# 克隆仓库
git clone <your-repo>

# 部署到Vercel
vercel --prod

# 获得域名，例如：
# https://ios-content-parser.vercel.app
```

### 2. 替换API域名

在创建快捷指令的**步骤4**中，将：
```
https://your-domain.vercel.app/api/parse
```

替换为你的实际域名：
```
https://ios-content-parser.vercel.app/api/parse
```

### 3. 测试API

在浏览器中访问：
```
https://your-domain.vercel.app/api/parse
```

应该看到API信息页面。

---

## 🧪 测试快捷指令

### 测试步骤

1. **复制测试链接**：
   ```
   https://www.xiaohongshu.com/explore/68aedfa2000000001c030efe
   ```

2. **运行快捷指令**
   - 打开"快捷指令"App
   - 点击"小红书→flomo"
   - 等待2-3秒

3. **验证结果**
   - 应该自动跳转到flomo
   - 内容包含标题、正文、图片链接

### 预期结果

```
标题：🍵早起的小狗有早茶喝
内容：得闲饮茶啦🍃...
图片：9张
```

---

## 🐛 故障排查

### 问题1：快捷指令无法运行

**检查清单**：
- [ ] 是否所有步骤都已正确配置
- [ ] 变量选择是否正确（特别注意步骤4的JSON）
- [ ] API域名是否正确替换
- [ ] iPhone网络是否正常

### 问题2：API返回错误

**调试方法**：

在步骤5之前添加"显示通知"动作：
```
动作：显示通知
文本：选择"URL的内容"（步骤4的输出）
```

查看实际返回的JSON内容。

### 问题3：无法从分享菜单调用

**解决方法**：
1. 编辑快捷指令
2. 点击右上角设置（⋯）
3. 确认"在共享表单中显示"已打开
4. 确认接受类型包含"URL"

---

## 🎨 自定义选项

### 发送到其他平台

修改步骤4的 `output_format`：

**发送到备忘录**：
```json
{
  "url": "URL",
  "output_format": "notes",
  "options": {
    "preloadedHtml": "URL的内容"
  }
}
```

**获取原始数据**：
```json
{
  "url": "URL",
  "output_format": "raw",
  "options": {
    "preloadedHtml": "URL的内容"
  }
}
```

### 添加进度提示

在不同步骤之间添加"显示通知"动作：
```
步骤3后：正在获取内容...
步骤4后：正在解析...
步骤6前：完成！
```

---

## 📊 支持的平台

目前支持：
- ✅ 小红书
- ✅ B站
- ✅ 微信公众号

**创建其他平台的快捷指令**：
只需修改名称和图标，流程完全相同！

---

## 🔄 更新快捷指令

如果API有更新：

1. 编辑快捷指令
2. 找到步骤4（POST请求）
3. 更新JSON配置
4. 保存

无需重新创建整个快捷指令。

---

## 🤝 分享快捷指令

### 方法1：iCloud链接（推荐）

1. 打开快捷指令
2. 点击右上角分享图标
3. 选择"复制iCloud链接"
4. 分享给朋友

### 方法2：AirDrop

1. 打开快捷指令
2. 点击右上角分享图标
3. 选择"AirDrop"
4. 选择接收者

---

## 📚 相关文档

- [项目主README](../README.md) - 项目总体说明
- [API文档](../CLAUDE.md) - API使用指南
- [部署指南](../.spec-workflow/specs/vercel-bu-shu-liu-cheng/design.md) - Vercel部署流程

---

## 💡 提示

- **第一次使用**建议按照 `CREATE_SHORTCUT.md` 详细步骤创建
- **熟悉后**可以直接参考 `xiaohongshu-to-flomo.json` 快速创建
- **遇到问题**先查看"故障排查"部分
- **想要分享**使用iCloud链接最方便

---

## 🎓 学习资源

- [iOS快捷指令官方文档](https://support.apple.com/zh-cn/guide/shortcuts/welcome/ios)
- [快捷指令社区](https://www.icloud.com/shortcuts/)
- [快捷指令库](https://shortcutsgallery.com/)

---

**Happy Automating! 🚀**
