# Tasks: Output Formatter Refactoring

**Input**: Design documents from `/specs/002-formatter-refactor/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/formatter-api.yaml

**Tests**: Not explicitly requested in spec - test tasks excluded

**Organization**: Tasks grouped by user story to enable independent implementation and testing of each story

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1-US4)
- Include exact file paths in descriptions

## Path Conventions

Single Next.js project structure:
- Types: `src/lib/types/`
- Formatters: `src/lib/formatters/`
- Utils: `src/lib/utils/`
- API routes: `src/app/api/`
- Tests: `src/test/formatters/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create directory structure and type foundations

- [X] T001 Create formatters directory structure at `src/lib/formatters/`
- [X] T002 [P] Create types directory at `src/lib/types/` if not exists
- [X] T003 [P] Create test directory at `src/test/formatters/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core type system and base infrastructure - MUST complete before user stories

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Define FormatterError class and error codes in `src/lib/types/formatter.ts`
- [X] T005 [P] Define FormatterResult type and helper functions (Ok, Err) in `src/lib/types/formatter.ts`
- [X] T006 [P] Define PlatformCapabilities interface in `src/lib/types/formatter.ts`
- [X] T007 [P] Define FormattedOutput interface in `src/lib/types/formatter.ts`
- [X] T008 Create BaseOutputFormatter abstract class with validateContent(), cleanText(), isValidImageUrl() in `src/lib/types/formatter.ts`
- [X] T009 Create FormatterRegistry class with register(), get(), has(), listCapabilities() in `src/lib/formatters/formatter-registry.ts`
- [X] T010 Export module-level formatterRegistry singleton in `src/lib/formatters/formatter-registry.ts`
- [X] T011 Create URL truncation utility truncateForURL() with binary search in `src/lib/utils/url-truncate.ts`
- [X] T011A Create error message validation tests in `src/test/formatters/error-messages.test.ts` - verify FR-011 (unknown platform), FR-012 (exception wrapping), SC-005 (malformed registration) produce actionable error messages

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Developer Adds New Platform Support (Priority: P1) 🎯 MVP

**Goal**: Enable adding new formatters without modifying existing code - validates strategy pattern design

**Independent Test**: Create a test formatter class, register it, verify existing Flomo formatter still works unchanged

### Implementation for User Story 1

- [X] T012 [P] [US1] Migrate Flomo formatting logic to FlomoFormatter class in `src/lib/formatters/flomo-formatter.ts`
- [X] T013 [P] [US1] Migrate Notes formatting logic to NotesFormatter class in `src/lib/formatters/notes-formatter.ts`
- [X] T014 [P] [US1] Create RawFormatter class for raw output in `src/lib/formatters/raw-formatter.ts`
- [X] T015 [US1] Register all formatters (flomo, notes, raw) at module init in `src/lib/formatters/index.ts`
- [X] T016 [US1] Update /api/parse route to use formatterRegistry.get() instead of IOSFormatterImpl in `src/app/api/parse/route.ts`
- [X] T017 [US1] Verify backward compatibility - run existing tests with `npm test`
- [X] T018 [US1] Mark ios-formatter.ts as deprecated with comments in `src/lib/utils/ios-formatter.ts`

**Checkpoint**: Can add new formatters without modifying Flomo/Notes code - User Story 1 complete and testable

---

## Phase 4: User Story 2 - API Consumer Discovers Platform Capabilities (Priority: P2)

**Goal**: Provide capability discovery endpoint for clients

**Independent Test**: Call GET /api/formatters and verify it returns accurate capability metadata for all registered platforms

### Implementation for User Story 2

- [X] T019 [US2] Create /api/formatters directory at `src/app/api/formatters/`
- [X] T020 [US2] Implement GET /api/formatters route handler returning formatterRegistry.listCapabilities() in `src/app/api/formatters/route.ts`
- [X] T021 [US2] Test capabilities endpoint with curl/Postman - verify flomo, notes, raw all listed with correct capabilities
- [X] T022 [US2] Validate capability accuracy matches OpenAPI spec in `specs/002-formatter-refactor/contracts/formatter-api.yaml`

**Checkpoint**: Clients can query platform capabilities before requesting formatting - User Story 2 complete

---

## Phase 5: User Story 3 - User Exports Content to Platform-Specific Format (Priority: P1)

**Goal**: Ensure formatters handle images, fallbacks, and content truncation correctly

**Independent Test**: Send content with images to each platform, verify output matches platform capabilities (images embedded in Flomo, text links in Notes)

### Implementation for User Story 3

- [ ] T023 [P] [US3] Implement image handling in FlomoFormatter.format() - filter valid URLs, encode for flomo:// scheme
- [ ] T024 [P] [US3] Implement image-as-text fallback in NotesFormatter.format() - append image URLs as numbered list
- [ ] T025 [US3] Add content truncation logic to all formatters using truncateForURL() utility
- [ ] T026 [US3] Implement fallback field in FormattedOutput for each formatter (plain text version)
- [ ] T027 [US3] Test Flomo with images - verify `image_urls` parameter included in URL scheme
- [ ] T028 [US3] Test Notes with images - verify images appear as text links in formatted output
- [ ] T029 [US3] Test content truncation - send 100K character content, verify ellipsis appended

**Checkpoint**: All formatters correctly handle images and content limits per their capabilities - User Story 3 complete

---

## Phase 6: User Story 4 - System Maintains Backward Compatibility (Priority: P1)

**Goal**: Zero breaking changes to existing API consumers

**Independent Test**: Run all existing integration tests without modification - all must pass

### Implementation for User Story 4

- [ ] T030 [US4] Run existing Flomo integration tests - verify identical output before and after refactoring
- [ ] T031 [US4] Run existing Notes integration tests - verify identical output before and after refactoring
- [ ] T032 [US4] Test error handling for invalid platforms - verify error messages match previous behavior
- [ ] T033 [US4] Validate API response structure matches OpenAPI contract in `specs/002-formatter-refactor/contracts/formatter-api.yaml`
- [ ] T034 [US4] Run performance benchmarks - verify <10ms per format operation
- [ ] T035 [US4] Git diff verification - confirm zero changes to `src/lib/utils/ios-formatter.ts` content (only deprecation comments)

**Checkpoint**: 100% backward compatibility confirmed - User Story 4 complete

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories or overall code quality

- [X] T036 [P] Add JSDoc comments to all public APIs in `src/lib/formatters/` and `src/lib/types/formatter.ts`
- [X] T037 [P] Update CLAUDE.md with formatter architecture section explaining strategy pattern
- [X] T038 Code cleanup - remove unused imports, ensure consistent formatting with `npm run lint`
- [X] T039 Performance optimization - verify binary search truncation achieves <10ms for 10K char strings
- [X] T040 Security review - ensure no XSS vulnerabilities in URL scheme construction
- [X] T041 [P] Validate quickstart.md by following steps to add a mock formatter
- [X] T042 Final backward compatibility test - run `npm test` and verify 100% pass rate

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational - can start after T011 complete
- **User Story 2 (Phase 4)**: Depends on Foundational + US1 - needs formatters registered
- **User Story 3 (Phase 5)**: Depends on Foundational + US1 - needs formatters implemented
- **User Story 4 (Phase 6)**: Depends on US1, US2, US3 - validates all stories work together
- **Polish (Phase 7)**: Depends on all user stories complete

### User Story Dependencies

- **User Story 1 (P1)**: Independent - only needs Foundational phase
- **User Story 2 (P2)**: Depends on US1 (needs formatters to query capabilities)
- **User Story 3 (P1)**: Depends on US1 (needs formatters to add features to)
- **User Story 4 (P1)**: Depends on US1, US2, US3 (validates integration)

### Critical Path

```
Setup → Foundational → US1 → US2 ↘
                    → US3 ↗     → US4 → Polish
```

### Within Each User Story

**User Story 1**:
1. T012-T014 can run in parallel (different formatters, different files)
2. T015 must wait for T012-T014 (registration needs formatter classes)
3. T016-T018 sequential (API integration → testing → deprecation)

**User Story 2**:
1. All tasks sequential (T019 → T020 → T021 → T022)

**User Story 3**:
1. T023-T024 can run in parallel (different formatters)
2. T025-T026 sequential (depends on base formatters)
3. T027-T029 can run in parallel (independent test scenarios)

**User Story 4**:
1. T030-T035 mostly sequential (validation and verification)

### Parallel Opportunities

**Setup Phase**:
- T002 and T003 can run in parallel (different directories)

**Foundational Phase**:
- T004-T007 can run in parallel (different type definitions in same file - coordinate)
- T008, T009, T011 can run in parallel (different files)

**User Story 1**:
- T012, T013, T014 can run in parallel (different formatter files)

**User Story 3**:
- T023 and T024 can run in parallel (different formatters)
- T027, T028, T029 can run in parallel (independent tests)

**Polish Phase**:
- T036, T037, T041 can run in parallel (different files)

---

## Parallel Example: User Story 1

```bash
# Launch all formatter migrations together:
Task: "Migrate Flomo formatting logic to FlomoFormatter class in src/lib/formatters/flomo-formatter.ts"
Task: "Migrate Notes formatting logic to NotesFormatter class in src/lib/formatters/notes-formatter.ts"
Task: "Create RawFormatter class for raw output in src/lib/formatters/raw-formatter.ts"

# After formatters complete, registration and API update:
Task: "Register all formatters (flomo, notes, raw) at module init in src/lib/formatters/index.ts"
Task: "Update /api/parse route to use formatterRegistry.get() instead of IOSFormatterImpl in src/app/api/parse/route.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

**Goal**: Validate strategy pattern works before adding features

1. ✅ Complete Phase 1: Setup (T001-T003)
2. ✅ Complete Phase 2: Foundational (T004-T011) - CRITICAL
3. ✅ Complete Phase 3: User Story 1 (T012-T018)
4. **STOP and VALIDATE**:
   - Can add new formatter without modifying existing code? ✓
   - Existing Flomo/Notes tests still pass? ✓
   - Git diff shows zero changes to formatter logic? ✓
5. Deploy MVP if validation passes

### Incremental Delivery

**Iteration 1: Core Refactoring (MVP)**
- Setup + Foundational + US1 → Strategy pattern works
- Deliverable: New formatters can be added without code changes
- Value: Extensibility validated

**Iteration 2: Capability Discovery**
- US2 → Add capabilities endpoint
- Deliverable: Clients can query platform support
- Value: Better UX, prevents runtime errors

**Iteration 3: Feature Enhancement**
- US3 → Image handling + truncation
- Deliverable: Formatters handle complex content correctly
- Value: Robustness, edge case handling

**Iteration 4: Integration Validation**
- US4 → Backward compatibility proof
- Deliverable: Zero breaking changes confirmed
- Value: Safe to deploy to production

**Iteration 5: Production Ready**
- Polish → Documentation, performance, security
- Deliverable: Production-grade quality
- Value: Maintainability, confidence

### Parallel Team Strategy

With 2 developers after Foundational phase:

**Developer A**:
1. T012 (FlomoFormatter)
2. T023 (Flomo images)
3. T027 (Flomo image tests)
4. T030 (Flomo integration tests)

**Developer B**:
1. T013 (NotesFormatter)
2. T024 (Notes images)
3. T028 (Notes image tests)
4. T031 (Notes integration tests)

**Shared**:
- T014 (RawFormatter) - either developer
- T015-T018 (Integration) - Developer A
- T019-T022 (Capabilities) - Developer B
- T025-T026, T029 (Truncation) - Developer A
- T032-T035 (Final validation) - both review
- T036-T042 (Polish) - split by file

---

## Task Count Summary

- **Setup**: 3 tasks
- **Foundational**: 9 tasks (CRITICAL - blocks all stories) - includes T011A for error message validation
- **User Story 1**: 7 tasks (MVP scope)
- **User Story 2**: 4 tasks
- **User Story 3**: 7 tasks
- **User Story 4**: 6 tasks
- **Polish**: 7 tasks

**Total**: 43 tasks

**Parallel opportunities**: 15 tasks marked [P] (34.9% can run in parallel)

**MVP scope**: 19 tasks (Setup + Foundational + US1)

---

## Validation Criteria

**After User Story 1 (MVP)**:
- [ ] Can create new formatter without modifying Flomo/Notes code
- [ ] New formatter registers successfully
- [ ] Existing tests pass unchanged
- [ ] Git diff shows zero changes to existing formatter logic

**After User Story 2**:
- [ ] GET /api/formatters returns correct capabilities
- [ ] Response matches OpenAPI schema
- [ ] All registered formatters appear in response

**After User Story 3**:
- [ ] Images handled correctly per platform capabilities
- [ ] Content truncation works with binary search algorithm
- [ ] Fallback values provided for all formatters

**After User Story 4**:
- [ ] 100% existing test pass rate
- [ ] API responses identical to pre-refactor
- [ ] Performance <10ms per format operation
- [ ] Zero breaking changes confirmed

**After Polish**:
- [ ] All code documented with JSDoc
- [ ] CLAUDE.md updated with architecture
- [ ] quickstart.md validated by following steps
- [ ] Linter passes with zero warnings

---

## Notes

- Tasks organized by user story for independent delivery
- Each user story can be tested independently
- MVP (US1) validates core refactoring before adding features
- Backward compatibility (US4) validates all stories integrate correctly
- [P] tasks = parallelizable (different files, no blocking dependencies)
- [Story] label maps task to user story for traceability
- Stop at any checkpoint to validate story independently
- Commit after each task or logical group for easy rollback