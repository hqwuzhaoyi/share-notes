# Tasks: Parser Architecture Refactor

**Input**: Design documents from `/specs/003-parser-architecture-refactor/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅

**Tests**: Tests ARE included as this is a major architectural refactor requiring validation of backward compatibility and type safety.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

Paths use existing Next.js project structure:
- **Types**: `src/lib/types/`
- **Parsers**: `src/lib/parsers/`
- **Strategies**: `src/lib/parsers/strategies/`
- **Extractors**: `src/lib/parsers/extractors/`
- **Formatters**: `src/lib/formatters/`
- **Tests**: `src/test/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create new directories and base files for the refactored architecture

- [X] T001 Create strategy directory at src/lib/parsers/strategies/
- [X] T002 Create extractors directory at src/lib/parsers/extractors/
- [X] T003 [P] Create content type definitions file at src/lib/types/content.ts with ContentType enum and BaseContent interface
- [X] T004 [P] Create Zod schemas file at src/lib/types/content-schemas.ts for runtime validation

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core type system and strategy interfaces that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T005 Define ArticleContent interface extending BaseContent in src/lib/types/content.ts
- [X] T006 [P] Define VideoContent interface extending BaseContent in src/lib/types/content.ts
- [X] T007 [P] Define ImageGalleryContent interface extending BaseContent in src/lib/types/content.ts
- [X] T008 [P] Define BookContent interface extending BaseContent in src/lib/types/content.ts
- [X] T009 [P] Define TweetContent interface extending BaseContent in src/lib/types/content.ts
- [X] T010 Create ParsedContent union type with all content types in src/lib/types/content.ts
- [X] T011 Create HtmlFetcher interface in src/lib/parsers/strategies/html-fetcher.ts
- [X] T012 [P] Implement OfetchHtmlFetcher class in src/lib/parsers/strategies/html-fetcher.ts
- [X] T013 [P] Implement PlaywrightHtmlFetcher class in src/lib/parsers/strategies/html-fetcher.ts
- [X] T014 Create ContentDetector interface in src/lib/parsers/strategies/content-detector.ts
- [X] T015 Create ContentExtractor<T> generic interface in src/lib/parsers/extractors/base.ts
- [X] T016 Create toArticleContent() helper for backward compatibility in src/lib/types/content.ts
- [X] T017 Export all content types from src/lib/types/index.ts (if exists) or create

**Checkpoint**: Foundation ready - Content type system and strategy interfaces complete

---

## Phase 3: User Story 1 - Developer Adds Video Platform Support (Priority: P1) 🎯 MVP

**Goal**: Enable developers to add parsers for video platforms (YouTube, Xiaohongshu video) with video-specific metadata (URL, cover, duration)

**Independent Test**: Create new YouTubeParser, register it, parse a YouTube URL and verify VideoContent with videoUrl, cover, duration fields is returned

### Tests for User Story 1

- [X] T018 [P] [US1] Unit test for VideoContent type guards in src/test/types/content-types.test.ts
- [X] T019 [P] [US1] Unit test for ContentDetector video detection in src/test/parsers/strategies.test.ts
- [X] T020 [P] [US1] Integration test for video parsing flow in src/test/parsers/video-parsing.test.ts

### Implementation for User Story 1

- [X] T021 [P] [US1] Create XhsContentDetector with video detection logic in src/lib/parsers/strategies/content-detector.ts
- [X] T022 [P] [US1] Create BilibiliContentDetector (always returns video) in src/lib/parsers/strategies/content-detector.ts
- [X] T023 [P] [US1] Create XhsVideoExtractor implementing ContentExtractor<VideoContent> in src/lib/parsers/extractors/xhs-video-extractor.ts
- [X] T024 [P] [US1] Create BilibiliVideoExtractor implementing ContentExtractor<VideoContent> in src/lib/parsers/extractors/bilibili-video-extractor.ts
- [X] T025 [US1] Update PlatformType to include 'youtube' in src/lib/types/parser.ts
- [X] T026 [US1] Create YouTubeContentDetector in src/lib/parsers/strategies/content-detector.ts
- [X] T027 [US1] Create YouTubeVideoExtractor in src/lib/parsers/extractors/youtube-video-extractor.ts
- [X] T028 [US1] Create YouTubeParser using strategy composition in src/lib/parsers/youtube.ts
- [X] T029 [US1] Register YouTubeParser in ParserManager constructor in src/lib/parsers/index.ts

**Checkpoint**: Video platform support complete - YouTubeParser demonstrates new architecture pattern

---

## Phase 4: User Story 2 - Developer Reuses Common Parsing Strategies (Priority: P1)

**Goal**: Enable developers to build new parsers in under 100 lines by reusing HTML fetching and content extraction strategies

**Independent Test**: Measure lines of code for new parser implementations, verify they use shared strategy components and are under 100 lines (excluding extractors)

### Tests for User Story 2

- [ ] T030 [P] [US2] Unit test for PlaywrightHtmlFetcher in src/test/parsers/strategies.test.ts
- [ ] T031 [P] [US2] Unit test for OfetchHtmlFetcher in src/test/parsers/strategies.test.ts
- [ ] T032 [P] [US2] Integration test for strategy composition in parser in src/test/parsers/strategy-composition.test.ts

### Implementation for User Story 2

- [X] T033 [US2] Create XhsImageGalleryExtractor implementing ContentExtractor<ImageGalleryContent> in src/lib/parsers/extractors/xhs-image-gallery-extractor.ts ✅
- [ ] T034 [US2] Refactor XiaohongshuParser to use strategy composition in src/lib/parsers/xiaohongshu.ts
  - Use HtmlFetcher for HTML retrieval
  - Use XhsContentDetector for type detection
  - Use Map<ContentType, ContentExtractor> for extraction
  - Target: Under 100 lines (excluding extractors)
- [ ] T035 [US2] Refactor BilibiliParser to use strategy composition in src/lib/parsers/bilibili.ts
  - Same pattern as XiaohongshuParser
  - Target: Under 100 lines
- [ ] T036 [US2] Refactor WechatParser to use strategy composition in src/lib/parsers/wechat.ts
  - Same pattern
  - Create WechatContentDetector and WechatArticleExtractor as needed
- [ ] T037 [US2] Verify all refactored parsers are under 150 lines of code

**Checkpoint**: Strategy reuse complete - All existing parsers refactored to use shared strategies

---

## Phase 5: User Story 3 - System Supports Multiple Content Types (Priority: P1)

**Goal**: Users can parse and receive content from various platforms in their native format with appropriate metadata for each type

**Independent Test**: Send URLs for different content types (article, video, image-gallery) to /api/parse and verify each returns correctly-typed response with type-specific fields

### Tests for User Story 3

- [ ] T038 [P] [US3] Unit test for all content type Zod schemas in src/test/types/content-schemas.test.ts
- [ ] T039 [P] [US3] Integration test for multi-type API responses in src/test/api/parse-multi-type.test.ts
- [X] T040 [P] [US3] Unit test for type guards (isVideoContent, isArticleContent, etc.) in src/test/types/type-guards.test.ts ✅ (29 tests, fixed null safety)

### Implementation for User Story 3

- [X] T041 [P] [US3] Create type guard functions (isArticleContent, isVideoContent, isImageGalleryContent, isBookContent, isTweetContent) in src/lib/types/content.ts ✅
- [X] T042 [P] [US3] Create Zod schemas for all content types in src/lib/types/content-schemas.ts ✅ (Already exists from Phase 1)
- [ ] T043 [US3] Update ParserManager.parse() to return properly typed ParsedContent in src/lib/parsers/index.ts
- [ ] T044 [US3] Update /api/parse route to handle multi-type responses in src/app/api/parse/route.ts
- [ ] T045 [US3] Add runtime validation using Zod schemas at parser-API boundary in src/app/api/parse/route.ts

**Checkpoint**: Multi-type support complete - API returns correctly-typed content for all content types

---

## Phase 6: User Story 4 - Developers Extend System Without Breaking Changes (Priority: P2)

**Goal**: Maintain full backward compatibility - existing API consumers work without modification after refactoring

**Independent Test**: Run all existing integration tests against refactored system and verify identical API responses for article content

### Tests for User Story 4

- [ ] T046 [P] [US4] Backward compatibility test verifying legacy ParsedContent fields in src/test/api/backward-compatibility.test.ts
- [ ] T047 [P] [US4] Formatter fallback test for unknown content types in src/test/formatters/multi-type.test.ts
- [ ] T048 [P] [US4] API response structure test comparing before/after in src/test/api/response-structure.test.ts

### Implementation for User Story 4

- [ ] T049 [US4] Update FlomoFormatter to handle all content types with switch/fallback in src/lib/formatters/flomo-formatter.ts
- [ ] T050 [P] [US4] Update NotesFormatter to handle all content types with switch/fallback in src/lib/formatters/notes-formatter.ts
- [ ] T051 [P] [US4] Update RawFormatter to handle all content types in src/lib/formatters/raw-formatter.ts
- [ ] T052 [US4] Ensure legacy ParsedContent type alias still works in src/lib/types/parser.ts
- [ ] T053 [US4] Run existing test suite (npm test) and verify 100% pass rate
- [ ] T054 [US4] Add capability query for content types to /api/formatters in src/app/api/formatters/route.ts

**Checkpoint**: Backward compatibility complete - All existing tests pass, formatters handle all types

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, cleanup, and validation across all user stories

- [X] T055 [P] Update CLAUDE.md with new architecture patterns (types, strategies, extractors directories)
- [X] T056 [P] Add JSDoc comments to all exported interfaces in src/lib/types/content.ts
- [X] T057 [P] Add JSDoc comments to all strategy interfaces in src/lib/parsers/strategies/
- [X] T058 Code review for consistent naming conventions across all new files
- [X] T059 Verify quickstart.md example works (add YouTube parser in <100 lines)
- [ ] T060 Run full test suite and ensure all tests pass (AI tests require API keys)
- [X] T061 Build verification (npm run build) passes ✅
- [X] T062 Type check verification (npm run check:types) passes ✅ (Fixed: Added type discriminators to test mocks)
- [X] T063 Lint verification (npm run lint) passes ✅ (0 errors, 17 warnings - acceptable)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-6)**: All depend on Foundational phase completion
  - US1 and US2 can proceed in parallel (both P1)
  - US3 depends on US1/US2 for type implementations to test
  - US4 depends on US3 for formatter type handling
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

```
Phase 1 (Setup) → Phase 2 (Foundational)
                        ↓
              ┌─────────┼─────────┐
              ↓         ↓         ↓
          US1 (P1)  US2 (P1)    (wait)
              │         │         │
              └────┬────┘         │
                   ↓              │
                US3 (P1) ←────────┘
                   ↓
                US4 (P2)
                   ↓
              Phase 7 (Polish)
```

- **US1**: Can start immediately after Foundational - creates video content types and extractors
- **US2**: Can start immediately after Foundational - refactors existing parsers to use strategies
- **US3**: Depends on US1/US2 - needs content types and refactored parsers for multi-type testing
- **US4**: Depends on US3 - needs multi-type support to update formatters

### Within Each User Story

- Tests written and verified to FAIL before implementation
- Models/Types → Extractors → Parsers → Integration
- Story complete before moving to next priority

### Parallel Opportunities

**Phase 1 (Setup)**:
- T003 and T004 can run in parallel (different files)

**Phase 2 (Foundational)**:
- T006, T007, T008, T009 can all run in parallel (content type definitions)
- T012 and T013 can run in parallel (HtmlFetcher implementations)

**Phase 3 (US1)**:
- T018, T019, T020 tests can run in parallel
- T021, T022, T023, T024 can run in parallel (different detectors/extractors)
- T026, T027 can run in parallel (YouTube components)

**Phase 4 (US2)**:
- T030, T031, T032 tests can run in parallel
- After T034 (XiaohongshuParser), T035 and T036 can run in parallel

**Phase 5 (US3)**:
- T038, T039, T040 tests can run in parallel
- T041 and T042 can run in parallel

**Phase 6 (US4)**:
- T046, T047, T048 tests can run in parallel
- T049, T050, T051 can run in parallel (formatter updates)

**Phase 7 (Polish)**:
- T055, T056, T057 documentation tasks can run in parallel
- T060, T061, T062, T063 verification tasks must run sequentially

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Unit test for VideoContent type guards in src/test/types/content-types.test.ts"
Task: "Unit test for ContentDetector video detection in src/test/parsers/strategies.test.ts"
Task: "Integration test for video parsing flow in src/test/parsers/video-parsing.test.ts"

# Launch all content detectors together:
Task: "Create XhsContentDetector in src/lib/parsers/strategies/content-detector.ts"
Task: "Create BilibiliContentDetector in src/lib/parsers/strategies/content-detector.ts"

# Launch all video extractors together:
Task: "Create XhsVideoExtractor in src/lib/parsers/extractors/xhs-video-extractor.ts"
Task: "Create BilibiliVideoExtractor in src/lib/parsers/extractors/bilibili-video-extractor.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (~30 min)
2. Complete Phase 2: Foundational (~2 hours)
3. Complete Phase 3: User Story 1 (~3 hours)
4. **STOP and VALIDATE**:
   - Run: `npm run test:unit`
   - Verify: YouTubeParser returns VideoContent with correct fields
   - Create YouTube parser with <100 lines of code
5. Demo: Show new architecture working for video platforms

### Incremental Delivery

1. **Setup + Foundational** → Type system ready
2. **+ US1** → Video platform support ✅ (Demo: YouTube parser in 80 lines)
3. **+ US2** → Strategy reuse validated ✅ (Demo: All parsers under 100 lines)
4. **+ US3** → Multi-type API responses ✅ (Demo: API returns typed content)
5. **+ US4** → Backward compatibility ✅ (Demo: All existing tests pass)
6. Each increment adds value without breaking previous

### Parallel Team Strategy

With 2 developers:

1. Both complete Setup + Foundational together
2. Once Foundational is done:
   - **Developer A**: US1 (video support) → then US3 (multi-type)
   - **Developer B**: US2 (strategy reuse) → then US4 (backward compat)
3. Stories complete and integrate at defined checkpoints

---

## Task Summary

| Phase | Task Count | Description |
|-------|------------|-------------|
| Phase 1 (Setup) | 4 | Directory creation, base files |
| Phase 2 (Foundational) | 13 | Type system, strategy interfaces |
| Phase 3 (US1) | 12 | Video platform support |
| Phase 4 (US2) | 8 | Strategy reuse, parser refactoring |
| Phase 5 (US3) | 8 | Multi-type support |
| Phase 6 (US4) | 9 | Backward compatibility |
| Phase 7 (Polish) | 9 | Documentation, verification |
| **Total** | **63** | |

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [Story] label maps task to specific user story for traceability
- Each user story is independently testable at its checkpoint
- Tests included per spec requirements for architectural refactor validation
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Code reduction goal: 808 lines → ~80 lines per parser (90% reduction)
- Backward compatibility: Zero breaking changes to existing API consumers
