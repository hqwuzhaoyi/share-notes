# Requirements Document

## Introduction

“vercel 部署流程”旨在为 ios-content-parser 提供一套标准、可复用的 Vercel 部署流程与约束，覆盖环境变量、安全策略、构建与运行配置、平台差异（如 Playwright 在 Serverless 的限制）以及部署后的验证与回滚，确保开发者可一键稳定上线并维持低成本、可观测与高可用。

## Alignment with Product Vision

本项目核心价值在于“跨平台内容解析与标准化输出 + iOS 快捷指令深度集成”。稳定的 Vercel 部署流程能将解析服务快速、安全地交付到生产环境，并与 iOS 生态无缝协作（如通过 preloadedHtml 获取最佳解析效果），从而提升使用体验与传播效率。

## Requirements

### Requirement 1: Vercel 环境变量与密钥管理

User Story: 作为维护者，我希望在 Vercel 中集中管理环境变量和密钥，以便在不同环境（Preview/Production）保持一致且安全。

Acceptance Criteria
1. WHEN 在 Vercel 控制台配置环境变量 THEN 系统 SHALL 在构建和运行时可读取以下变量：ENABLE_AI、LLM_API_KEY/LLM_API_BASE_URL/LLM_MODEL 或 OPENAI_API_KEY、PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD、API_TIMEOUT、AI_DEBUG。
2. IF 未配置 AI 密钥 THEN 系统 SHALL 自动降级禁用 AI 增强功能并给出明确日志提示，不影响基础解析。
3. WHEN 变量更新 AND 重新部署完成 THEN 新配置 SHALL 生效且不在代码库中明文出现。

### Requirement 2: 构建与运行配置

User Story: 作为开发者，我希望构建/运行配置遵循 Next.js 与 Vercel 最佳实践，保证较快的构建与稳定运行。

Acceptance Criteria
1. WHEN 生产构建执行 THEN 系统 SHALL 使用 `next build --turbopack` 并在 vercel.json 指定 buildCommand。
2. WHEN 部署到 Vercel Functions THEN `/src/app/api/parse/route.ts` 的最大执行时长 SHALL 为 30s（vercel.json 已配置 functions.maxDuration=30）。
3. WHEN 运行时提供响应 THEN API SHALL 设置 Cache-Control 头（例如公共解析 5 分钟、AI 结果 1 小时），以利用 Vercel 边缘缓存。

### Requirement 3: Serverless 限制与降级策略（Playwright）

User Story: 作为平台维护者，我希望在 Vercel Serverless 限制下，系统自动选择最稳妥的解析策略并向用户提供清晰指引。

Acceptance Criteria
1. WHEN 检测到 Vercel 环境 THEN 系统 SHALL 默认禁用 Playwright 浏览器下载（PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1）。
2. IF 目标平台需动态渲染（如小红书） AND 在 Vercel 无法运行浏览器 THEN 系统 SHALL 自动改用 ofetch/预取 HTML 的方案，并在日志中提示使用 iOS 快捷指令的 preloadedHtml 参数。
3. WHEN 使用 preloadedHtml 参数 THEN 解析结果 SHALL 与本地 Playwright 解析在关键字段上保持一致（标题/正文/图片/时间）。

### Requirement 4: 部署后验证与回滚

User Story: 作为维护者，我希望部署完成后能快速检查健康状态，并在异常时安全回滚。

Acceptance Criteria
1. WHEN 部署完成 THEN 维护者 SHALL 通过 `/api/parse` 端点完成一次健康检查（返回 JSON 与缓存头）。
2. IF 新版本错误率上升 THEN 维护者 SHALL 能在 Vercel 控制台回滚至上一个稳定版本。
3. WHEN 观察到冷启动过慢 THEN 维护者 SHALL 通过日志定位问题并调整缓存、并发或超时配置（如 API_TIMEOUT）。

### Requirement 5: 文档与可观测性

User Story: 作为团队成员，我希望有清晰的部署文档、常见问题指南与可观测性入口，降低认知负担。

Acceptance Criteria
1. WHEN 新增/变更部署策略 THEN 文档 SHALL 同步更新（README/DEPLOYMENT.md），并在首页 README 标注 Vercel 推荐流程与注意事项。
2. WHEN 需要排查问题 THEN 维护者 SHALL 能在 Vercel 控制台 Functions 面板查看 `/api/parse` 执行日志与指标。
3. WHEN 命中跨域问题 THEN CORS SHALL 允许 iOS Shortcuts 所需的跨域请求（vercel.json 已配置 /api/* 的 CORS 允许头）。

## Non-Functional Requirements

### Code Architecture and Modularity
- 配置分层：解析逻辑与部署配置解耦；环境变量读取集中在配置模块。
- 接口清晰：定义 Search/Parse/AI 相关的输入输出类型，避免部署变更影响业务代码。

### Performance
- 构建时长：常规仓库在 3 分钟内完成生产构建。
- API p95：基础解析 ≤ 800ms；AI 增强 ≤ 3s（缓存命中后更快）。
- 函数超时：不超过 30 秒；失败重试遵循指数退避策略。

### Security
- 不在仓库存放任何明文密钥；仅通过 Vercel 环境变量注入。
- CORS 仅开放必要范围；拒绝未支持来源的解析请求并记录。

### Reliability
- 对外部请求设置超时（默认 30s）与重试（2 次退避）。
- 对关键写入与去重逻辑保持幂等，避免重复解析导致的成本浪费。

### Usability
- README/DEPLOYMENT.md 给出一步步部署与 iOS 快捷指令示例。
- 错误信息明确可操作，指导用户选择 preloadedHtml 以获得稳定结果。
