# Requirements Document

## Introduction

“历史分享系统”旨在把用户已解析或收藏的网页内容（如微信公众号、知乎、B站、小红书等）按时间轴组织、检索与再次分享，支持生成可复制的分享页、卡片图片与 Markdown，方便复盘历史阅读并高效分发给他人。

## Alignment with Product Vision

该功能与当前项目的“跨平台内容解析与标准化输出”愿景一致：在已有解析能力之上，新增时间维度的沉淀、检索与分享路径，提升内容复用率和团队/个人的知识流转效率。

## Requirements

### Requirement 1: 链接采集与解析入库

User Story: 作为内容收集者，我希望把外部链接一键导入并解析成统一结构，以便后续检索和分享。

Acceptance Criteria
1. WHEN 用户提交受支持站点链接 THEN 系统 SHALL 在 5 秒内完成解析并入库（解析失败将返回明确错误原因）。
2. IF 链接重复提交 THEN 系统 SHALL 进行去重并更新最新元数据（保留首次入库时间）。
3. WHEN 解析完成 AND 内容包含标题/作者/时间/正文/封面 THEN 系统 SHALL 结构化存储这些字段并生成规范摘要。

### Requirement 2: 时间轴与标签管理

User Story: 作为资料管理者，我希望按时间轴浏览历史条目，并用标签/分类组织内容。

Acceptance Criteria
1. WHEN 用户打开历史页 THEN 系统 SHALL 默认按入库时间倒序展示，支持按日/周/月聚合。
2. IF 用户添加/编辑标签 THEN 系统 SHALL 立即保存并在列表与详情中可见。
3. WHEN 用户批量选择多条内容 AND 执行添加标签操作 THEN 系统 SHALL 为所有选中条目添加该标签。

### Requirement 3: 检索与过滤

User Story: 作为检索者，我希望按关键词、标签、来源站点与时间范围搜索历史内容。

Acceptance Criteria
1. WHEN 用户输入关键词 THEN 系统 SHALL 在 300ms 内返回标题与摘要的匹配结果（前端分页）。
2. IF 应用了时间范围/标签/来源过滤 THEN 系统 SHALL 仅返回满足条件的结果并显示筛选条件。
3. WHEN 结果为空 THEN 系统 SHALL 提供清晰的无结果状态与去除过滤的快捷操作。

### Requirement 4: 分享输出（链接/图片/Markdown）

User Story: 作为分享者，我希望把选定条目生成可访问分享页、图片卡片，或复制 Markdown 片段进行发布。

Acceptance Criteria
1. WHEN 用户点击“生成分享” THEN 系统 SHALL 生成一个短链（或永久链接），可公开或私密访问（按设置）。
2. IF 用户选择图片卡片 THEN 系统 SHALL 生成含标题、来源、时间与二维码的卡片 PNG，并支持下载。
3. WHEN 用户选择 Markdown THEN 系统 SHALL 生成含标题、链接、摘要与时间的 Markdown 片段并复制到剪贴板。

### Requirement 5: 权限与可见性

User Story: 作为创建者，我希望控制分享页的可见性（公开、仅持有链接、私密）、并可随时撤销。

Acceptance Criteria
1. WHEN 创建分享链接 THEN 系统 SHALL 允许选择可见性级别（公开/仅链接/私密）。
2. IF 可见性被修改为“私密” THEN 系统 SHALL 立即使既有分享链接失效（返回 403）。
3. WHEN 用户查看分享页 AND 无访问权限 THEN 系统 SHALL 返回 403 并展示简短说明。

## Non-Functional Requirements

### Code Architecture and Modularity
- 单一职责：解析、存储、检索、分享各层解耦。
- 模块化：解析器、数据模型、搜索索引、分享渲染独立可复用。
- 依赖管理：对第三方服务（短链/存储/渲染）通过接口抽象，便于替换。
- 清晰接口：定义 ParserResult、SharePayload、SearchQuery 等清晰类型。

### Performance
- 解析入库：单条解析 ≤ 5s；批量并发 10 条时，整体吞吐稳定，失败率 < 1%。
- 历史列表与搜索接口：p95 ≤ 800ms，首页首屏渲染 ≤ 2s（缓存命中）。
- 图片卡片生成：≤ 1.5s；Markdown 生成 ≤ 100ms。

### Security
- 不记录用户敏感凭据；分享链接包含不可预测 token（≥ 16 字节）。
- 请求限流：每 IP 每分钟提交解析 ≤ 30 次；分享页访问速率保护。
- 允许域名白名单；对未支持来源拒绝解析并提示。

### Reliability
- 解析器网络调用超时 10s，重试 2 次（指数退避）；部分失败不中断批量入库。
- 对关键写入操作启用幂等（以 URL+规范化哈希作为键）。
- 异常与失败提供结构化日志与告警钩子。

### Usability
- 一键导入链接与批量粘贴多行链接。
- 历史页支持时间聚合、标签云与快捷筛选。
- 分享流程提供预览与一键复制动作；移动端友好，兼容 iOS 快捷指令调用。
