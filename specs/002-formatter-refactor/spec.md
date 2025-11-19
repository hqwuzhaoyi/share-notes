# Feature Specification: Output Formatter Refactoring

**Feature Branch**: `002-formatter-refactor`
**Created**: 2025-11-17
**Status**: Draft
**Input**: User description: "重构 iOS 输出格式化系统,采用策略模式 + 能力声明的架构设计,解决当前单一类承载所有平台逻辑的问题,使系统能够零破坏性地扩展支持新平台(Apple Notes, Notion, Obsidian 等)"

## Clarifications

### Session 2025-11-18

- Q: When a duplicate platform identifier is registered, what should the system do? → A: Silent ignore (idempotent - last registration wins or first wins)
- Q: When content exceeds a platform's maximum length limit, how should the formatter handle it? → A: Truncate content with ellipsis indicator (...)
- Q: When should the system validate that formatter capabilities match actual implementation? → A: At registration time (fail fast)

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer Adds New Platform Support (Priority: P1)

A developer needs to add support for a new note-taking platform (e.g., Apple Notes, Notion, Obsidian) without modifying existing code or breaking current functionality.

**Why this priority**: This is the core value proposition of the refactoring - enabling extensibility without breaking existing features. Without this, the system remains rigid and violates the Open/Closed Principle.

**Independent Test**: Can be fully tested by creating a new formatter class, registering it, and verifying that existing Flomo integration continues to work unchanged while the new platform functions correctly.

**Acceptance Scenarios**:

1. **Given** a new platform formatter class is created, **When** the formatter is registered with the system, **Then** the new platform becomes available for content export without any changes to existing formatter code
2. **Given** existing Flomo and Notes formatters are in use, **When** a new Notion formatter is added, **Then** all existing tests pass and no existing functionality is broken
3. **Given** a platform has specific capabilities (e.g., image support), **When** querying platform capabilities, **Then** the system accurately reports what the platform supports

---

### User Story 2 - API Consumer Discovers Platform Capabilities (Priority: P2)

An API consumer needs to understand what capabilities each output platform supports before requesting content formatting.

**Why this priority**: This prevents runtime failures and provides better user experience by allowing clients to make informed decisions about which platform to use based on their content type.

**Independent Test**: Can be tested by calling a capabilities endpoint that returns structured data about each platform's features (image support, direct creation, content length limits).

**Acceptance Scenarios**:

1. **Given** multiple platforms are registered, **When** requesting platform capabilities, **Then** the system returns accurate capability metadata for each platform
2. **Given** a platform does not support images, **When** checking capabilities, **Then** the system clearly indicates `supportsImages: false`
3. **Given** a platform requires an intermediate step (like Shortcuts), **When** checking capabilities, **Then** the system indicates `supportsDirectCreate: false`

---

### User Story 3 - User Exports Content to Platform-Specific Format (Priority: P1)

A user wants to export parsed content to their preferred note-taking platform with the appropriate format and fallback handling.

**Why this priority**: This is the primary user-facing functionality - delivering formatted content correctly based on platform capabilities.

**Independent Test**: Can be tested by sending content to different platforms and verifying the output format matches platform requirements (URL scheme for Flomo, Shortcuts trigger for Apple Notes).

**Acceptance Scenarios**:

1. **Given** parsed content with images, **When** exporting to Flomo, **Then** the output includes encoded image URLs in the URL scheme
2. **Given** parsed content with images, **When** exporting to Apple Notes (no image support), **Then** the output provides image URLs as text links
3. **Given** a platform fails to create content directly, **When** a fallback is available, **Then** the system provides the fallback format automatically
4. **Given** content exceeds platform length limits, **When** formatting for that platform, **Then** the system truncates content at the limit and appends ellipsis (...)

---

### User Story 4 - System Maintains Backward Compatibility (Priority: P1)

Existing API consumers using current Flomo and Notes integration continue to work without any code changes after the refactoring.

**Why this priority**: Ensuring zero breaking changes is critical for production systems. This validates the "零破坏性" requirement.

**Independent Test**: Can be tested by running all existing integration tests and verifying identical API responses before and after refactoring.

**Acceptance Scenarios**:

1. **Given** existing API calls for Flomo formatting, **When** the refactored system is deployed, **Then** all existing requests return identical output
2. **Given** current Notes formatting behavior, **When** the system is refactored, **Then** Notes formatting produces the same output structure
3. **Given** existing error handling, **When** invalid platforms are requested, **Then** error messages remain consistent

---

### Edge Cases

- **Duplicate platform registration**: System silently ignores duplicate registrations (idempotent behavior - first registration wins)
- **Unknown platform requests**: System throws error with message listing all available platforms (e.g., "Unknown platform 'notion'. Available: flomo, notes, raw")
- **Content exceeds length limit**: Formatter truncates content at platform's maximum character limit and appends ellipsis indicator (...)
- **Malformed capability declarations**: System validates capabilities at registration time and throws error immediately (fail-fast approach)
- **Formatter exceptions**: format() method catches all exceptions, wraps them in FormatterError with FORMATTING_FAILED code, and returns Result.Err
- **Platforms without direct creation**: Formatter returns FormattedOutput with type='raw_content', allowing caller to handle content via alternative methods

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow new platform formatters to be added without modifying existing formatter code
- **FR-002**: System MUST maintain a registry of all available output formatters indexed by platform identifier
- **FR-003**: Each formatter MUST declare its platform capabilities (image support, direct creation ability, content length limits)
- **FR-004**: System MUST return formatted output with explicit type indication (url_scheme, shortcut_trigger, or raw_content)
- **FR-005**: Formatters MUST provide fallback formatting options when primary method is unavailable
- **FR-006**: System MUST expose platform capabilities through a queryable interface
- **FR-007**: Existing Flomo and Notes formatting behavior MUST remain unchanged (backward compatibility)
- **FR-008**: System MUST handle duplicate platform registrations idempotently (silently ignore subsequent registrations for the same platform identifier)
- **FR-009**: Each formatter MUST handle content that exceeds platform limits by truncating with ellipsis indicator (...) at the character limit
- **FR-010**: System MUST validate that formatter capabilities match actual implementation behavior at registration time (fail-fast validation)
- **FR-011**: System MUST throw descriptive error when unknown platform is requested, listing all available platforms
- **FR-012**: Each formatter MUST catch all exceptions during format(), wrap them in FormatterError, and return FormatterResult.Err
- **FR-013**: Formatters for platforms without direct creation MUST return FormattedOutput with type='raw_content'

### Key Entities *(include if feature involves data)*

- **OutputFormatter**: Represents a platform-specific formatting strategy with declared capabilities and format implementation
  - Platform identifier (unique string)
  - Capability declaration (image support, direct creation, length limits)
  - Format method (transforms ParsedContent to FormattedOutput)

- **PlatformCapabilities**: Metadata describing what a platform supports
  - Image support flag (boolean)
  - Direct creation flag (boolean)
  - Maximum content length (optional number)

- **FormattedOutput**: Unified output structure from all formatters
  - Output type (url_scheme, shortcut_trigger, raw_content)
  - Primary value (formatted string)
  - Optional fallback value (alternative format)

- **FormatterRegistry**: Central registry managing all available formatters
  - Platform-to-formatter mapping
  - Capability listing
  - Formatter lookup and retrieval

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Adding a new platform formatter requires zero changes to existing formatter code (verified by git diff showing no modifications to Flomo/Notes formatter files)
- **SC-002**: All existing API integration tests pass without modification after refactoring (100% backward compatibility)
- **SC-003**: Developers can add a new platform formatter with fewer than 50 lines of code (measured by lines added per new formatter)
- **SC-004**: Platform capability queries return accurate metadata for all registered formatters (verified by capability validation tests)
- **SC-005**: System detects malformed formatter registrations at startup and provides clear error messages (100% detection rate during registration phase)
- **SC-006**: Formatted output type matches platform capabilities in 100% of test cases (no mismatches between declared and actual behavior)

## Assumptions

1. **Platform URL Schemes**: Assume that most modern note-taking platforms either support URL schemes or can be triggered via iOS Shortcuts
2. **Content Encoding**: Assume URL encoding is sufficient for all text content (no special character encoding requirements beyond standard URL encoding)
3. **Registry Initialization**: Assume formatters can be registered at application startup time (no runtime dynamic loading required)
4. **Image URL Validity**: Assume image URLs are pre-validated before reaching formatters (formatters don't need to verify image accessibility)
5. **Error Handling Standard**: Assume standard TypeScript error handling with try-catch is sufficient (no special error framework required)
6. **Single Format Per Request**: Assume each API request targets one output platform (no multi-platform batch formatting in scope)
7. **Capability Consistency**: Assume platform capabilities remain stable during application runtime (no dynamic capability updates)

## Out of Scope

- **Multi-platform batch export**: Exporting to multiple platforms in a single request
- **Platform authentication**: Managing OAuth or API keys for platforms requiring authentication
- **Content transformation pipelines**: Complex content transformations beyond basic formatting
- **Platform-specific media handling**: Special handling for videos, audio, or other non-image media
- **Dynamic platform discovery**: Runtime discovery of new platforms via plugins or external configuration
- **Capability negotiation**: Automatic content adjustment based on capability mismatches
- **Format versioning**: Managing different versions of platform URL schemes or formats
- **Analytics and usage tracking**: Monitoring which platforms are used most frequently
