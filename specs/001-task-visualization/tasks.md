---
description: "Task list for Task Visualization Dashboard implementation"
---

# Tasks: Task Visualization Dashboard

**Input**: Design documents from `/specs/001-task-visualization/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-tasks.yaml

**Tests**: Not explicitly requested in specification - focusing on implementation tasks

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

This is a Next.js full-stack web application with paths at repository root:
- Frontend: `src/components/`, `src/app/`
- Backend: `src/app/api/`, `src/lib/`
- Types: `src/lib/types/`
- Storage: `data/tasks/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for task visualization feature

- [X] T001 Create data storage directory structure at `data/tasks/`
- [X] T002 [P] Create components directory structure at `src/components/tasks/`
- [X] T003 [P] Create storage module directory at `src/lib/storage/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core type definitions and storage layer that ALL user stories depend on

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Define Task type interfaces in `src/lib/types/task.ts` (Task, ParsedContent, TaskError, TaskMetadata, PlatformType, TaskStatus enums)
- [X] T005 Implement TaskStore class with file-based storage in `src/lib/storage/task-store.ts` (saveTask, getTasks, getTaskById, index management, in-memory cache)
- [X] T006 Integrate task saving into existing parse API at `src/app/api/parse/route.ts` (add taskStore.saveTask calls for success and failure cases)

**Checkpoint**: Foundation ready - storage layer complete, types defined, parse API integrated

---

## Phase 3: User Story 1 - View Processed Tasks (Priority: P1) 🎯 MVP

**Goal**: Display paginated list of all processed tasks on home page with basic information (title, URL, platform, status, timestamp)

**Independent Test**: Navigate to `http://localhost:4000` and verify task list displays (or empty state if no tasks). Test pagination by adding tasks and navigating pages.

### Backend API for User Story 1

- [X] T007 [US1] Create tasks API route handler at `src/app/api/tasks/route.ts` with GET method for paginated task list
- [X] T008 [US1] Implement query parameter parsing (page, pageSize) in `src/app/api/tasks/route.ts`
- [X] T009 [US1] Implement pagination logic using TaskStore.getTasks in `src/app/api/tasks/route.ts`
- [X] T010 [US1] Add error handling and validation for API endpoint in `src/app/api/tasks/route.ts`

### Frontend Components for User Story 1

- [X] T011 [P] [US1] Create EmptyState component at `src/components/tasks/EmptyState.tsx` (displays message when no tasks exist)
- [X] T012 [P] [US1] Create TaskItem component at `src/components/tasks/TaskItem.tsx` (displays single task with title, URL, platform, status, timestamp)
- [X] T013 [P] [US1] Create Pagination component at `src/components/tasks/Pagination.tsx` (page navigation controls using URL params)
- [X] T014 [US1] Create TaskList container component at `src/components/tasks/TaskList.tsx` (orchestrates TaskItem, EmptyState, Pagination)
- [X] T015 [US1] Add platform badge styling and status indicators (success/failed/pending) to TaskItem component in `src/components/tasks/TaskItem.tsx`

### Home Page Integration for User Story 1

- [X] T016 [US1] Replace home page at `src/app/page.tsx` with Server Component that fetches tasks from `/api/tasks`
- [X] T017 [US1] Implement URL param handling for pagination (searchParams.page) in `src/app/page.tsx`
- [X] T018 [US1] Add loading state using Next.js Suspense in `src/app/page.tsx`
- [X] T019 [US1] Add error boundary for graceful error handling in `src/app/page.tsx`

**Checkpoint**: User Story 1 complete - users can view paginated task list on home page with empty state handling

---

## Phase 4: User Story 2 - View Task Details (Priority: P2)

**Goal**: Allow users to click on a task to see detailed parsing results (extracted content, images, metadata)

**Independent Test**: Click any task in the list and verify detailed view displays full parsing results. Test navigation back to list.

### Components for User Story 2

- [X] T020 [P] [US2] Create TaskDetails modal component at `src/components/tasks/TaskDetails.tsx` (displays full task content, images, metadata)
- [X] T021 [US2] Add click handler to TaskItem component in `src/components/tasks/TaskItem.tsx` to open TaskDetails modal
- [X] T022 [US2] Implement modal open/close state management using React hooks in TaskDetails
- [X] T023 [US2] Add detail view formatting for ParsedContent (title, content, images, author, publishedAt, AI enhancements) in TaskDetails
- [X] T024 [US2] Add error detail display for failed tasks (error message, code) in TaskDetails

### API Enhancement for User Story 2 (Optional)

- [X] T025 [US2] Add GET /api/tasks/[id] route at `src/app/api/tasks/[id]/route.ts` for fetching single task details
- [X] T026 [US2] Implement getTaskById logic using TaskStore in `src/app/api/tasks/[id]/route.ts`

**Checkpoint**: User Story 2 complete - users can view detailed task information via modal/detail view

---

## Phase 5: User Story 3 - Filter and Search Tasks (Priority: P3)

**Goal**: Allow users to filter tasks by platform or search by URL/title to quickly find specific tasks

**Independent Test**: Enter search term and verify only matching tasks display. Select platform filter and verify only tasks from that platform display. Clear filters and verify all tasks return.

### Components for User Story 3

- [X] T027 [P] [US3] Create TaskFilters component at `src/components/tasks/TaskFilters.tsx` (search input, platform dropdown, clear filters button)
- [X] T028 [US3] Implement search input with debounced onChange handler in TaskFilters
- [X] T029 [US3] Implement platform filter dropdown (Xiaohongshu, Bilibili, WeChat, All) in TaskFilters
- [X] T030 [US3] Add filter state management using URL params (searchParams) in TaskFilters

### API Enhancement for User Story 3

- [X] T031 [US3] Add platform filter support to `src/app/api/tasks/route.ts` (read platform query param)
- [X] T032 [US3] Add status filter support to `src/app/api/tasks/route.ts` (read status query param)
- [X] T033 [US3] Add search functionality to `src/app/api/tasks/route.ts` (search in title and URL)
- [X] T034 [US3] Implement filter logic in TaskStore.getTasks method in `src/lib/storage/task-store.ts`

### Integration for User Story 3

- [X] T035 [US3] Add TaskFilters component to home page in `src/app/page.tsx`
- [X] T036 [US3] Update API fetch in `src/app/page.tsx` to include filter query params
- [X] T037 [US3] Test filter combinations (platform + search, status + search, etc.)

**Checkpoint**: User Story 3 complete - users can filter and search tasks efficiently

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final quality assurance

- [X] T038 [P] Add responsive design improvements for mobile viewport to TaskList and TaskItem components
- [X] T039 [P] Optimize TaskStore cache eviction strategy (LRU implementation) in `src/lib/storage/task-store.ts`
- [X] T040 [P] Add data sanitization for task storage (truncate long content, remove sensitive data) in TaskStore
- [X] T041 Add loading skeletons for better perceived performance in `src/app/page.tsx`
- [X] T042 [P] Add accessibility improvements (ARIA labels, keyboard navigation) to TaskItem and Pagination components
- [X] T043 Verify quickstart.md examples work correctly (run through all code examples)
- [X] T044 Add index.json versioning and migration support in TaskStore for future schema changes
- [X] T045 Performance testing: Verify page load <2s with empty state (SC-001), <3s with 100+ tasks (SC-005)
- [X] T046 Manual testing: Complete all acceptance scenarios from spec.md for US1, US2, US3

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (Phase 1) completion - BLOCKS all user stories
- **User Stories (Phase 3-5)**: All depend on Foundational phase completion
  - User stories can proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 6)**: Depends on desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1) - Phase 3**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2) - Phase 4**: Can start after Foundational (Phase 2) - Depends on TaskItem from US1 but should be independently testable
- **User Story 3 (P3) - Phase 5**: Can start after Foundational (Phase 2) - Depends on API endpoint from US1 but should be independently testable

### Within Each User Story

**User Story 1**:
- T007-T010 (API) can run sequentially
- T011-T013 (Components) can run in parallel [P]
- T014-T015 (Component integration) after T011-T013
- T016-T019 (Page integration) after T014

**User Story 2**:
- T020 (TaskDetails component) independent [P]
- T021-T024 (Modal integration) after T020
- T025-T026 (API) can run in parallel with components [P]

**User Story 3**:
- T027-T030 (Filter components) sequential
- T031-T034 (API enhancements) sequential
- T035-T037 (Integration) after API and components

### Parallel Opportunities

**Phase 1 - All parallel**:
- T001, T002, T003 can all run in parallel

**Phase 2 - Sequential foundation**:
- T004 first (types)
- T005 after T004 (storage needs types)
- T006 after T005 (API integration needs storage)

**Phase 3 - Maximum parallelism**:
- T007-T010 (API) - one stream
- T011, T012, T013 (Components) - three parallel streams
- T014-T015 (Integration) after components
- T016-T019 (Page) after T014

**Phase 4**:
- T020 (TaskDetails) [P]
- T025-T026 (API) [P]
- Then T021-T024 (integration)

**Phase 5 - Sequential filters**:
- Components first (T027-T030)
- API second (T031-T034)
- Integration last (T035-T037)

**Phase 6 - Maximum parallelism**:
- T038, T039, T040, T042 all parallel [P]
- Others sequential (testing, validation)

---

## Parallel Example: User Story 1

```bash
# After Foundational phase completes, launch API and components in parallel:

# Stream 1: Backend API
Task: "Create tasks API route handler at src/app/api/tasks/route.ts"

# Stream 2: Empty State Component
Task: "Create EmptyState component at src/components/tasks/EmptyState.tsx"

# Stream 3: Task Item Component
Task: "Create TaskItem component at src/components/tasks/TaskItem.tsx"

# Stream 4: Pagination Component
Task: "Create Pagination component at src/components/tasks/Pagination.tsx"

# Once all parallel streams complete, continue with integration:
Task: "Create TaskList container component at src/components/tasks/TaskList.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003)
2. Complete Phase 2: Foundational (T004-T006) **CRITICAL - blocks all stories**
3. Complete Phase 3: User Story 1 (T007-T019)
4. **STOP and VALIDATE**: Test User Story 1 independently
   - Navigate to home page
   - Verify task list displays
   - Test empty state
   - Test pagination
   - Parse a new URL and verify it appears
5. Deploy/demo MVP

### Incremental Delivery

1. **Foundation Ready** (Phase 1-2): Storage layer, types, parse integration → 6 tasks
2. **MVP** (+ Phase 3): Add task list view → +13 tasks = 19 total
   - Test independently
   - Deploy/Demo (Full basic functionality!)
3. **Enhanced** (+ Phase 4): Add task details → +7 tasks = 26 total
   - Test independently
   - Deploy/Demo (Deeper insights!)
4. **Complete** (+ Phase 5): Add filters and search → +11 tasks = 37 total
   - Test independently
   - Deploy/Demo (Full feature set!)
5. **Polished** (+ Phase 6): Quality & performance → +9 tasks = 46 total

### Parallel Team Strategy

With multiple developers:

1. **Team completes Setup + Foundational together** (1-2 hours)
2. **Once Foundational is done**:
   - Developer A: User Story 1 backend (T007-T010)
   - Developer B: User Story 1 components (T011-T015)
   - Developer C: Can start on User Story 2 components (T020) or prep User Story 3
3. **Integration phase**: Developer A + B integrate US1 (T016-T019)
4. **Stories complete independently** and can be deployed separately

---

## Task Count Summary

| Phase | Task Count | Purpose |
|-------|------------|---------|
| Phase 1: Setup | 3 | Directory structure |
| Phase 2: Foundational | 3 | Types, storage, API integration |
| Phase 3: US1 (P1) | 13 | Task list view - MVP |
| Phase 4: US2 (P2) | 7 | Task details view |
| Phase 5: US3 (P3) | 11 | Filters and search |
| Phase 6: Polish | 9 | Quality, performance, testing |
| **Total** | **46 tasks** | Complete feature |

**MVP Scope**: Phases 1-3 (19 tasks) delivers core value
**Full Feature**: All phases (46 tasks) delivers complete specification

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- All file paths are absolute from repository root
- Next.js App Router patterns: Server Components for data fetching, Client Components for interactivity
- Storage layer uses file-based JSON with in-memory cache per research.md decisions
