# Implementation Tasks

## Overview

基于已批准的设计文档，本文档列出了在 Vercel 平台上部署 `ios-content-parser` 服务的具体实现任务。任务按优先级排序，确保核心功能先行，逐步完善 Vercel 优化特性。

## Task Categories

### Phase 1: 核心架构修复 (Critical)

解决现有代码与设计文档的关键不一致问题

### Phase 2: Vercel 平台集成 (High Priority)

实现 Vercel Serverless 环境的专门优化

### Phase 3: 监控与优化 (Medium Priority)

添加生产环境必需的观测性和性能优化

### Phase 4: 测试与验证 (High Priority)

确保部署质量和功能完整性

---

## Phase 1: 核心架构修复

### Task 1.1: 修复环境检测命名混乱

**Priority**: 🔴 Critical
**Estimated Time**: 2 hours
**Description**: 解决 `platform-detector` 概念混乱问题

**Current Problem**:

- 设计文档要求 `platform-detector` 检测运行环境（Vercel/Local）
- 实际代码中 `platform-detector` 检测URL平台（小红书/B站）
- 各个parser重复实现 `isVercelEnvironment()`

**Implementation Steps**:

1. 创建 `src/lib/utils/environment-detector.ts`
   - 实现 `isVercel(): boolean`
   - 实现 `isServerless(): boolean`
   - 实现 `getEnvironmentType(): 'vercel' | 'netlify' | 'local'`

2. 保持现有 `src/lib/utils/platform-detector.ts` 专门用于URL平台检测
   - 保留现有功能（小红书、B站、微信检测）
   - 确保接口不变，避免破坏现有功能

3. 更新所有parsers使用统一的环境检测
   - 替换 `xiaohongshu.ts` 中的 `isVercelEnvironment()`
   - 检查其他parser是否有类似重复代码

**Acceptance Criteria**:

- [ ] 创建独立的环境检测模块
- [ ] 所有parsers使用统一的环境检测接口
- [ ] 消除重复的环境检测代码
- [ ] 不破坏现有URL平台检测功能

### Task 1.2: 实现缺失的配置接口

**Priority**: 🔴 Critical
**Estimated Time**: 1.5 hours
**Description**: 在 `src/lib/ai/config.ts` 中添加设计要求的接口

**Missing Interfaces**:

- `effectivePlaywrightSkip(): boolean` - 综合判断是否跳过Playwright
- `getTimeout(): number` - 获取API超时配置
- `isAiEnabled(): boolean` - 已存在但需验证
- `getConfig(): Config` - 已存在但需验证

**Implementation Steps**:

1. 添加 `effectivePlaywrightSkip()` 函数

   ```typescript
   export const effectivePlaywrightSkip = (): boolean => {
     // 检查环境变量 PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD
     // 检查是否在 Vercel 环境
     // 返回综合判断结果
   }
   ```

2. 添加 `getTimeout()` 函数

   ```typescript
   export const getTimeout = (): number => {
     return parseInt(process.env.API_TIMEOUT || '30000', 10);
   }
   ```

3. 更新类型定义以匹配设计文档

**Acceptance Criteria**:

- [ ] 实现 `effectivePlaywrightSkip()` 函数
- [ ] 实现 `getTimeout()` 函数
- [ ] 验证现有 `isAiEnabled()` 函数正常工作
- [ ] 更新相关TypeScript类型定义

### Task 1.3: 更新parser选择器架构

**Priority**: 🟡 Medium
**Estimated Time**: 2 hours
**Description**: 增强 `src/lib/parsers/index.ts` 以匹配设计中的 `parser-selector` 概念

**Implementation Steps**:

1. 添加 `selectParser()` 方法，根据环境和配置选择合适parser
2. 增强 `parseWithSelected()` 逻辑，集成环境检测
3. 实现 `preloadedHtml` 处理逻辑

**Acceptance Criteria**:

- [ ] 实现智能parser选择逻辑
- [ ] 支持 `preloadedHtml` 参数
- [ ] 根据Vercel环境自动选择最佳解析策略

---

## Phase 2: Vercel 平台集成

### Task 2.1: 优化 Vercel 配置

**Priority**: 🟡 Medium
**Estimated Time**: 1 hour
**Description**: 根据设计文档更新 `vercel.json` 配置

**Current vs Required**:

- 当前: `"buildCommand": "npm run build"`
- 设计要求: `"buildCommand": "next build --turbopack"`

**Implementation Steps**:

1. 评估是否需要 `--turbopack` flag
2. 更新 `vercel.json` 中的 buildCommand
3. 验证 `functions.maxDuration=30` 配置正确
4. 确认 `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` 环境变量设置

**Acceptance Criteria**:

- [ ] 更新buildCommand（如果需要turbopack）
- [ ] 验证所有Vercel环境变量正确配置
- [ ] 确保部署配置与设计文档一致

### Task 2.2: 实现 Playwright 降级策略

**Priority**: 🟠 High
**Estimated Time**: 3 hours
**Description**: 在Vercel环境中实现智能的Playwright降级方案

**Implementation Steps**:

1. 在 `xiaohongshu.ts` 等需要动态渲染的parser中：
   - 检测Vercel环境
   - 优先尝试 `preloadedHtml` 方案
   - fallback到ofetch解析
   - 如果解析失败，返回iOS Shortcuts建议

2. 实现降级提示系统：

   ```typescript
   interface FallbackResponse {
     success: boolean;
     content?: ParsedContent;
     fallbackReason?: string;
     iosShortcutSuggestion?: string;
   }
   ```

3. 添加适当的错误处理和日志记录

**Acceptance Criteria**:

- [ ] Vercel环境下禁用Playwright浏览器启动
- [ ] 优先使用preloadedHtml进行解析
- [ ] 提供清晰的降级提示和iOS Shortcuts建议
- [ ] 保持非Vercel环境的正常功能

### Task 2.3: 实现缓存策略

**Priority**: 🟡 Medium
**Estimated Time**: 2 hours
**Description**: 实现Edge Cache和Cache-Control headers

**Implementation Steps**:

1. 在 `src/app/api/parse/route.ts` 中添加Cache-Control headers
2. 实现基于内容类型的缓存TTL策略
3. 添加缓存key生成逻辑
4. 考虑AI增强内容的特殊缓存需求

**Acceptance Criteria**:

- [ ] API响应包含适当的Cache-Control headers
- [ ] 不同内容类型有合适的缓存时间
- [ ] 支持缓存失效和更新机制

---

## Phase 3: 监控与优化

### Task 3.1: 实现请求监控

**Priority**: 🟡 Medium
**Estimated Time**: 2.5 hours
**Description**: 添加关键指标记录，支持生产环境观测

**Implementation Steps**:

1. 在API endpoint中添加指标收集：

   ```typescript
   interface RequestMetrics {
     requestId: string;
     url: string;
     parserType: string;
     processingTimeMs: number;
     usePreloadedHtml: boolean;
     success: boolean;
     errorCode?: string;
     timestamp: string;
   }
   ```

2. 实现结构化日志输出
3. 添加性能监控点
4. 考虑与Vercel Analytics集成

**Acceptance Criteria**:

- [ ] 记录请求处理时长
- [ ] 记录使用的parser类型
- [ ] 记录是否使用preloadedHtml
- [ ] 记录错误类型和频率
- [ ] 输出结构化日志便于分析

### Task 3.2: 错误处理增强

**Priority**: 🟠 High
**Estimated Time**: 2 hours
**Description**: 实现设计文档中的错误处理策略

**Error Scenarios to Handle**:

1. Playwright无法在Serverless环境启动
2. AI密钥未配置或失效
3. 外部请求超时/失败
4. 解析失败的降级处理

**Implementation Steps**:

1. 实现统一的错误处理中间件
2. 添加重试机制（最多2次，指数退避）
3. 实现错误分类和响应码映射
4. 添加用户友好的错误信息

**Acceptance Criteria**:

- [ ] 各种错误场景有适当的处理逻辑
- [ ] 实现重试机制减少临时性失败
- [ ] 返回有意义的错误信息给用户
- [ ] 错误响应包含问题诊断信息

---

## Phase 4: 测试与验证

### Task 4.1: 更新环境检测相关测试

**Priority**: 🟠 High
**Estimated Time**: 1.5 hours
**Description**: 更新 `src/test/parsers/environment.test.ts` 使用新的环境检测模块

**Implementation Steps**:

1. 更新测试用例使用 `environment-detector` 而不是parser内部方法
2. 添加新环境检测函数的单元测试
3. 测试各种环境变量组合的行为
4. 验证向后兼容性

**Acceptance Criteria**:

- [ ] 所有环境检测测试通过
- [ ] 测试覆盖新的环境检测接口
- [ ] 验证不同环境变量组合的正确行为

### Task 4.2: Vercel 部署集成测试

**Priority**: 🟠 High
**Estimated Time**: 3 hours
**Description**: 创建Vercel环境特定的集成测试

**Implementation Steps**:

1. 创建模拟Vercel环境的测试配置
2. 测试Playwright降级逻辑
3. 测试preloadedHtml处理
4. 验证缓存headers正确设置
5. 测试错误处理和降级提示

**Test Scenarios**:

- 在模拟Vercel环境下解析小红书链接
- 测试preloadedHtml参数的处理
- 验证Playwright被正确禁用
- 测试API超时和错误处理

**Acceptance Criteria**:

- [ ] 模拟Vercel环境测试全部通过
- [ ] Playwright降级逻辑正确工作
- [ ] preloadedHtml处理符合预期
- [ ] 错误处理返回适当的响应

### Task 4.3: 部署前烟雾测试

**Priority**: 🔴 Critical
**Estimated Time**: 1 hour
**Description**: 实现自动化的部署验证测试

**Implementation Steps**:

1. 创建烟雾测试脚本
2. 验证关键API endpoint响应正常
3. 检查Cache-Control headers
4. 验证错误处理机制
5. 测试监控日志输出

**Test Checklist**:

- [ ] `/api/parse` 返回200状态码
- [ ] 响应包含正确的Cache-Control headers
- [ ] 错误情况返回适当的状态码和错误信息
- [ ] 日志输出格式正确
- [ ] 各种URL类型解析正常工作

---

## Implementation Order

### Sprint 1 (Priority: Critical)

1. Task 1.1: 修复环境检测命名混乱
2. Task 1.2: 实现缺失的配置接口
3. Task 4.1: 更新环境检测相关测试

### Sprint 2 (Priority: High)

1. Task 2.2: 实现 Playwright 降级策略
2. Task 3.2: 错误处理增强
3. Task 4.2: Vercel 部署集成测试

### Sprint 3 (Priority: Medium)

1. Task 1.3: 更新parser选择器架构
2. Task 2.1: 优化 Vercel 配置
3. Task 2.3: 实现缓存策略
4. Task 3.1: 实现请求监控

### Sprint 4 (Priority: Validation)

1. Task 4.3: 部署前烟雾测试
2. 生产环境部署
3. 监控和回滚准备

---

## Definition of Done

每个任务完成需要满足：

- [ ] **代码实现**: 功能按规格实现完成
- [ ] **测试覆盖**: 相关测试用例通过
- [ ] **文档更新**: 必要时更新相关文档
- [ ] **向后兼容**: 不破坏现有功能
- [ ] **代码审查**: 代码质量符合项目标准
- [ ] **集成测试**: 与其他组件集成正常

## Risk Mitigation

### High Risk Items

- **环境检测重构**: 可能影响现有parser功能
  - **Mitigation**: 完整的回归测试，保持API兼容性

- **Playwright降级**: 可能影响解析质量
  - **Mitigation**: 提供清晰的降级策略和用户指导

- **缓存策略**: 可能影响内容更新及时性
  - **Mitigation**: 合理的TTL设置和缓存失效机制

### Dependencies

- 需要验证Vercel环境变量正确配置
- 需要确认Vercel region设置合理
- 需要团队确认监控工具选择

---

Generated from approved design document and current codebase analysis.
