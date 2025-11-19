# Research: Task Visualization Dashboard

**Feature**: 001-task-visualization
**Date**: 2025-11-17
**Status**: Complete

## Research Questions

### Q1: Storage Solution for Task History

**Context**: Current system has no task persistence mechanism. We need to store parsing task history to display in the visualization dashboard.

**Requirements**:
- Store task metadata: title, URL, platform, status, timestamp, parsed content, errors
- Support pagination (retrieve 20 tasks at a time)
- Handle 1000+ tasks efficiently
- No breaking changes to existing `/api/parse` endpoint
- Simple implementation (this is a dashboard feature, not mission-critical data)

**Decision**: File-based JSON storage with in-memory cache

**Rationale**:
1. **Simplicity**: No database setup required, works on Vercel/serverless out of the box
2. **Adequate performance**: For 1000+ tasks, file I/O with caching is sufficient
3. **Easy debugging**: Human-readable JSON files
4. **No dependencies**: Uses Node.js fs module only
5. **Vercel compatible**: Works with serverless functions via `/tmp` or persistent storage

**Implementation approach**:
- Store tasks in `data/tasks/` directory as individual JSON files
- Filename format: `{timestamp}-{uuid}.json`
- In-memory cache with LRU eviction for recent tasks
- Atomic writes to prevent corruption
- Index file (`data/tasks/index.json`) for fast pagination

**Alternatives considered**:
- **SQLite**: More overhead, requires additional dependency, overkill for simple task list
- **PostgreSQL/MySQL**: Way too complex for this use case, requires external service
- **Redis**: Requires external service, adds deployment complexity
- **In-memory only**: Lost on restart, not persistent enough

**Trade-offs accepted**:
- File system writes are slower than in-memory, but acceptable for our scale
- No ACID transactions, but task history is not mission-critical
- Manual cleanup needed for old tasks (can add later)

---

### Q2: Integration with Existing Parse API

**Context**: Need to capture task information when `/api/parse` processes URLs without breaking existing functionality.

**Requirements**:
- Zero breaking changes to existing API contract
- Capture all parse attempts (success and failure)
- Minimal performance impact
- Must work with existing error handling

**Decision**: Observer pattern - emit events from parse endpoint to task store

**Rationale**:
1. **Non-invasive**: Existing parse logic remains unchanged
2. **Loose coupling**: Task storage is optional, parse API doesn't depend on it
3. **Simple**: Just add event emitter calls after parse operations
4. **Testable**: Can verify events without running full parse pipeline

**Implementation approach**:
```typescript
// In src/app/api/parse/route.ts (after parsing)
await taskStore.saveTask({
  title: result.title,
  url: request.url,
  platform: result.platform,
  status: 'success',
  timestamp: new Date(),
  content: result,
});
```

**Alternatives considered**:
- **Middleware**: Too complex for simple event capture
- **Proxy pattern**: Unnecessary indirection
- **Database triggers**: No database in our solution

---

### Q3: React Component Architecture

**Context**: Need component structure for task list with filtering, pagination, and detail views.

**Requirements**:
- Support P1 (list view), P2 (detail view), P3 (filters) as independent features
- Reusable components
- Type-safe with TypeScript
- Follow Next.js 15 + React 19 patterns (Server/Client Components)

**Decision**: Container/Presentation pattern with Server Components for data fetching

**Rationale**:
1. **Server Components**: Fetch data server-side for better performance
2. **Client Components**: Interactive features (filtering, pagination, modals)
3. **Separation of concerns**: Data fetching separate from presentation
4. **Incremental adoption**: Easy to add P2 and P3 later

**Component hierarchy**:
```
page.tsx (Server Component)
  └─ TaskList (Server Component - fetches data)
      ├─ TaskFilters (Client Component - P3)
      ├─ TaskItem[] (Client Component - click handlers)
      └─ Pagination (Client Component)

TaskDetails (Client Component - modal/page - P2)
  └─ DetailContent (Presentation)
```

**Best practices from research**:
- Use `'use client'` directive only where needed (interactivity)
- Fetch data in Server Components (faster initial load)
- Pass serializable props from Server to Client components
- Use URL params for pagination state (shareable links)

**Alternatives considered**:
- **All Client Components**: Slower initial load, more JavaScript
- **Atomic components**: Too granular, premature optimization
- **Redux/Zustand state**: Overkill for simple list display

---

## Technology Stack Summary

| Aspect | Technology | Version | Rationale |
|--------|-----------|---------|-----------|
| Frontend Framework | Next.js App Router | 15.5.0 | Existing project stack |
| UI Library | React | 19.1.0 | Existing project stack |
| Styling | Tailwind CSS | 4.x | Existing project stack, rapid UI development |
| Language | TypeScript | 5.x | Existing project stack, type safety |
| Storage | File-based JSON | Native fs | Simple, no dependencies, Vercel compatible |
| State Management | React hooks + URL params | Native | No external state library needed |
| Testing | Vitest | 3.2.4 | Existing project stack |

---

## Performance Considerations

### Initial Load (SC-001: <2s)
- Server-side data fetching reduces client-side work
- Only load 20 tasks per page (pagination)
- Use Next.js automatic code splitting

### Large Datasets (SC-005: <3s with 100+ tasks)
- In-memory cache for recently accessed tasks
- Index file prevents scanning all task files
- Lazy load task details (P2) only when clicked

### Optimization strategies**:
1. Cache task index in memory (rebuild on write)
2. Use `revalidate` option in Next.js for static regeneration
3. Implement virtual scrolling if needed (future optimization)

---

## Security & Edge Cases

### Security
- Validate file paths to prevent directory traversal
- Sanitize task data before storage
- No sensitive data in task history (already public URLs)

### Edge Cases (from spec)
1. **Empty state**: Return empty array, UI handles with EmptyState component
2. **Failed tasks**: Store with `status: 'failed'` and `error` field
3. **Corrupted data**: Catch JSON parse errors, log and skip corrupted files
4. **Large task lists**: Pagination handles via index file slice

---

## Next Steps (Phase 1)

With research complete, proceed to:
1. ✅ Define data model (`data-model.md`)
2. ✅ Create API contracts (`contracts/`)
3. ✅ Write quickstart guide (`quickstart.md`)
4. ✅ Update agent context

All NEEDS CLARIFICATION items are now resolved with concrete technical decisions.
