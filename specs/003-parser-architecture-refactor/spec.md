# Feature Specification: Parser Architecture Refactor

**Feature Branch**: `003-parser-architecture-refactor`
**Created**: 2025-11-19
**Status**: Draft
**Input**: User description: "重构Parser层架构，扩展数据模型支持多种内容类型（视频、书籍、推文），提取公共策略模式，使添加新平台更简单"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer Adds Video Platform Support (Priority: P1)

A developer needs to add support for a new video-based platform (e.g., Xiaohongshu video, YouTube) without modifying existing parsers or creating hundreds of lines of duplicated code.

**Why this priority**: This addresses the core architectural debt identified in the current system. The existing data model only supports article/image content, blocking support for video platforms which represent a major user need.

**Independent Test**: Can be fully tested by creating a new video parser, registering it with the system, and verifying that it can extract video metadata (URL, cover, duration) while existing parsers continue to work unchanged.

**Acceptance Scenarios**:

1. **Given** a new video platform parser is created, **When** the parser extracts content from a video URL, **Then** the system returns structured video content including video URL, cover image, duration, and description
2. **Given** an existing article parser is in use, **When** a new video parser is added, **Then** all existing tests pass and article parsing functionality remains unchanged
3. **Given** a platform URL that contains video content, **When** content is parsed, **Then** the returned data structure correctly identifies the content type as 'video' with appropriate metadata

---

### User Story 2 - Developer Reuses Common Parsing Strategies (Priority: P1)

A developer needs to add a new platform parser by reusing existing HTML fetching and content extraction strategies, rather than copying 800+ lines of code.

**Why this priority**: This directly addresses the "808-line monster class" problem. By extracting common strategies, we enable developers to build new parsers in under 100 lines of code.

**Independent Test**: Can be fully tested by measuring lines of code for a new parser implementation and verifying it uses shared strategy components (HTML fetcher, content detector, extractors).

**Acceptance Scenarios**:

1. **Given** common HTML fetching strategies exist, **When** creating a new parser, **Then** the developer can reuse PlaywrightHtmlFetcher or OfetchHtmlFetcher without reimplementation
2. **Given** content extraction strategies are available, **When** parsing different content types, **Then** the parser delegates to specialized extractors rather than implementing extraction logic inline
3. **Given** a new platform parser is created using shared strategies, **When** measuring code complexity, **Then** the parser implementation is under 100 lines of code (excluding extractors)

---

### User Story 3 - System Supports Multiple Content Types (Priority: P1)

Users can parse and receive content from various platforms in their native format (articles, videos, image galleries, books, tweets) with appropriate metadata for each type.

**Why this priority**: This represents the user-facing value of the refactor. Without multi-type support, the system cannot serve users who share video links, book excerpts, or social media posts.

**Independent Test**: Can be fully tested by sending URLs from different content types to the parsing API and verifying each returns correctly structured data matching its content type.

**Acceptance Scenarios**:

1. **Given** a video URL from any supported platform, **When** content is parsed, **Then** the response includes content type 'video' with video-specific fields (videoUrl, cover, duration)
2. **Given** an article URL, **When** content is parsed, **Then** the response includes content type 'article' with article-specific fields (content text, images array)
3. **Given** a book content URL, **When** content is parsed, **Then** the response includes content type 'book' with book-specific fields (bookId, chapterTitle, cover)
4. **Given** formatters receive parsed content, **When** content type varies, **Then** formatters handle each type appropriately based on type discriminators

---

### User Story 4 - Developers Extend System Without Breaking Changes (Priority: P2)

Developers can add new content types and new platforms to the system while maintaining full backward compatibility with existing API consumers.

**Why this priority**: This ensures the refactor is safe for production deployment. All existing integrations (iOS shortcuts, API consumers) must continue working without modification.

**Independent Test**: Can be fully tested by running all existing integration tests against the refactored system and verifying identical API responses for existing content types.

**Acceptance Scenarios**:

1. **Given** existing API calls for article parsing, **When** the refactored system is deployed, **Then** all existing requests return identical response structures
2. **Given** new content types are added (video, book, tweet), **When** existing article/image parsing is used, **Then** response format remains unchanged for backward compatibility
3. **Given** formatters receive new content types, **When** they encounter unsupported types, **Then** they gracefully fall back to default formatting without errors

---

### Edge Cases

- **Unknown content type detection**: When a platform supports multiple content types but the specific content type cannot be determined from HTML, default to 'article' type with logged warning
- **Partial metadata extraction**: When video metadata is incomplete (e.g., duration unavailable), include available fields and mark missing fields as undefined without failing the parse
- **Mixed content types**: When a single URL contains both video and article content (e.g., video with long description), prioritize video type but include description in video.description field
- **Legacy parser compatibility**: When existing parsers return old ParsedContent format, system automatically maps to ArticleContent type for backward compatibility
- **Strategy selection failure**: When all HTML fetching strategies fail (Playwright, ofetch), throw descriptive error with fallback suggestions rather than silent failure
- **Platform-specific metadata**: When content includes platform-specific metadata (e.g., Bilibili BV ID, YouTube video ID), store in metadata field as extensible object

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support distinct content types with type discriminators (article, video, image-gallery, book, tweet)
- **FR-002**: System MUST provide a unified BaseContent interface with common fields (title, platform, originalUrl, author, publishedAt) shared across all content types
- **FR-003**: Each content type MUST define type-specific fields (e.g., VideoContent includes videoUrl, cover, duration; BookContent includes bookId, chapterTitle)
- **FR-004**: System MUST allow parsers to declare supported content types via supportedContentTypes property
- **FR-005**: System MUST provide reusable HTML fetching strategies (PlaywrightHtmlFetcher, OfetchHtmlFetcher) that can be composed into new parsers
- **FR-006**: System MUST provide content type detection strategies (ContentDetector interface) that analyze URLs and HTML to determine content type
- **FR-007**: System MUST provide specialized content extractors (ContentExtractor<T>) that handle extraction logic for specific content types
- **FR-008**: Parsers MUST delegate to extractors based on detected content type rather than implementing extraction inline
- **FR-009**: System MUST maintain backward compatibility by mapping legacy ParsedContent to ArticleContent type automatically
- **FR-010**: System MUST reduce individual parser implementation to under 150 lines of code (excluding extractors) by extracting common strategies
- **FR-011**: New parser addition MUST NOT require modifications to existing parser implementations
- **FR-012**: System MUST support platform-specific metadata via extensible metadata object on each content type
- **FR-013**: Formatters MUST handle all defined content types or gracefully fall back when encountering unknown types
- **FR-014**: System MUST validate content type discriminators at runtime to ensure type safety across parser-formatter boundary

### Key Entities

- **BaseContent**: Common interface for all content types containing title, platform, originalUrl, author, publishedAt, and type discriminator
- **ArticleContent**: Article-specific content type extending BaseContent with content (text) and images (array)
- **VideoContent**: Video-specific content type extending BaseContent with videoUrl, cover, duration, description, and platform-specific metadata object
- **ImageGalleryContent**: Image gallery content type extending BaseContent with images array and description
- **BookContent**: Book content type extending BaseContent with bookId, chapterTitle, content, and cover
- **TweetContent**: Social media content type extending BaseContent with content, images, isThread flag, and optional threadTweets array
- **ContentDetector**: Strategy interface for detecting content type from URL and HTML
- **HtmlFetcher**: Strategy interface for retrieving HTML content with different methods (Playwright, ofetch)
- **ContentExtractor<T>**: Generic strategy interface for extracting structured content of a specific type from raw HTML

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: New platform parser implementations are completed in under 100 non-comment, non-blank lines of code (excluding platform-specific extractors), measured by `cloc` tool output for "code" metric per new parser file
- **SC-002**: Adding a new content type requires zero modifications to existing parser implementations, verified by git diff showing no changes to existing parser files
- **SC-003**: All existing API integration tests pass without modification after refactoring, demonstrating 100% backward compatibility
- **SC-004**: System successfully parses and returns correctly-typed content for at least 5 different content types (article, video, image-gallery, book, tweet)
- **SC-005**: Code duplication across parsers is reduced by at least 70%, measured by comparing shared strategy code vs. total parser code before and after refactor
- **SC-006**: Developer can add a new platform with video support in under 4 hours of development time, measured from parser creation to passing integration test

## Assumptions

1. **Backward Compatibility Window**: Assume legacy ParsedContent format must be supported for at least 6 months to allow client migrations
2. **Content Type Coverage**: Assume the 5 defined content types (article, video, image-gallery, book, tweet) cover 95% of platform use cases; additional types can be added later using the same pattern
3. **Strategy Reusability**: Assume HTML fetching strategies (Playwright, ofetch) are sufficient for most platforms; specialized fetchers can be added if needed
4. **Metadata Flexibility**: Assume platform-specific metadata can be stored in untyped metadata objects without breaking type safety of core content fields
5. **Extractor Independence**: Assume content extractors can be developed and tested independently from parsers, enabling parallel development
6. **Type Discrimination**: Assume TypeScript discriminated unions provide sufficient type safety for content type handling across the system
7. **Format Flexibility**: Assume formatters can adapt to new content types without coordinated releases by using type checking and fallback logic

## Out of Scope

- **Multi-content-type URLs**: Handling URLs that legitimately contain multiple distinct content types (e.g., article with embedded videos) - treat as single primary type
- **Content type conversion**: Converting one content type to another (e.g., video to article summary) - out of scope for this architectural refactor
- **Historical parser migration**: Automatically refactoring existing monolithic parsers to use new architecture - existing parsers continue working as-is
- **Performance optimization**: Improving parsing speed or reducing resource usage - focus is on architecture, not performance
- **AI-based content detection**: Using AI to determine content type - rely on pattern matching and HTML structure analysis
- **Cross-platform content correlation**: Linking identical content across different platforms - each parse is independent
- **Content validation**: Verifying extracted content matches original source - focus on structure, not accuracy
- **Real-time content updates**: Detecting and parsing content changes after initial parse - parsers are stateless
