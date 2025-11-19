# Quickstart: Task Visualization Dashboard

**Feature**: 001-task-visualization
**Last Updated**: 2025-11-17

This guide helps developers understand and implement the task visualization dashboard feature.

## Overview

The task visualization dashboard displays all processed URL parsing tasks on the home page. Users can see task status, platform, and details at a glance.

**Key Components**:
- **Frontend**: React components in `src/components/tasks/`
- **Backend API**: Task retrieval endpoint at `/api/tasks`
- **Storage**: File-based JSON storage in `data/tasks/`
- **Page**: Home page at `src/app/page.tsx`

---

## Quick Setup

### 1. Prerequisites

Ensure you have the existing project running:

```bash
npm install
npm run dev
```

### 2. Create Required Directories

```bash
mkdir -p data/tasks
mkdir -p src/components/tasks
mkdir -p src/lib/storage
mkdir -p src/lib/types
```

### 3. Install Dependencies (if needed)

No new dependencies required! This feature uses existing Next.js, React, and TypeScript setup.

---

## Implementation Checklist

### Phase 1: Storage Layer (P1 - MVP)

- [ ] Create `src/lib/types/task.ts` with Task type definitions
- [ ] Create `src/lib/storage/task-store.ts` with file-based storage
- [ ] Add task saving to `/api/parse` endpoint
- [ ] Write unit tests for task store

### Phase 2: Backend API (P1 - MVP)

- [ ] Create `/api/tasks/route.ts` for GET requests
- [ ] Implement pagination logic
- [ ] Add error handling
- [ ] Write API tests

### Phase 3: Frontend Components (P1 - MVP)

- [ ] Create `TaskList.tsx` (Server Component)
- [ ] Create `TaskItem.tsx` (Client Component)
- [ ] Create `EmptyState.tsx` (Presentation)
- [ ] Create `Pagination.tsx` (Client Component)
- [ ] Write component tests

### Phase 4: Home Page (P1 - MVP)

- [ ] Replace `src/app/page.tsx` with task dashboard
- [ ] Add loading states
- [ ] Add error boundaries
- [ ] Test full integration

### Phase 5: Task Details (P2 - Optional)

- [ ] Create `TaskDetails.tsx` modal/page
- [ ] Add detail view routing
- [ ] Show full parsed content

### Phase 6: Filters & Search (P3 - Optional)

- [ ] Create `TaskFilters.tsx` component
- [ ] Add search input
- [ ] Add platform filter dropdown
- [ ] Update API to support filtering

---

## Key Files to Create/Modify

### New Files

| File | Purpose | Priority |
|------|---------|----------|
| `src/lib/types/task.ts` | Type definitions | P1 |
| `src/lib/storage/task-store.ts` | File storage | P1 |
| `src/app/api/tasks/route.ts` | API endpoint | P1 |
| `src/components/tasks/TaskList.tsx` | List container | P1 |
| `src/components/tasks/TaskItem.tsx` | List item | P1 |
| `src/components/tasks/EmptyState.tsx` | Empty state | P1 |
| `src/components/tasks/Pagination.tsx` | Pagination | P1 |
| `src/components/tasks/TaskDetails.tsx` | Detail view | P2 |
| `src/components/tasks/TaskFilters.tsx` | Filters | P3 |

### Modified Files

| File | Changes | Priority |
|------|---------|----------|
| `src/app/page.tsx` | Replace with task dashboard | P1 |
| `src/app/api/parse/route.ts` | Add task saving | P1 |

---

## Development Workflow

### Step 1: Types & Storage (Backend Foundation)

Start here because components depend on these types.

**Files**: `src/lib/types/task.ts`, `src/lib/storage/task-store.ts`

**Key decisions**:
- Task type includes all required fields from data model
- Storage uses atomic writes to prevent corruption
- In-memory cache for performance

**Validation**:
```bash
npm run check:types
npm run test:unit -- task-store
```

### Step 2: API Endpoint (Backend Logic)

Create the `/api/tasks` endpoint to serve task data.

**File**: `src/app/api/tasks/route.ts`

**Key features**:
- Pagination with query params
- Filtering by platform/status
- Error handling

**Testing**:
```bash
npm test  # Run integration tests
```

### Step 3: Frontend Components (UI Layer)

Build React components for displaying tasks.

**Files**: `src/components/tasks/*.tsx`

**Component order**:
1. `EmptyState.tsx` (simplest, no dependencies)
2. `TaskItem.tsx` (presentation component)
3. `Pagination.tsx` (reusable UI)
4. `TaskList.tsx` (orchestrates all components)

**Testing**:
```bash
npm run test:unit -- tasks/
```

### Step 4: Integration (Home Page)

Replace the home page with the task dashboard.

**File**: `src/app/page.tsx`

**Key features**:
- Server-side data fetching
- Pass data to TaskList component
- Handle loading/error states

**Manual testing**:
1. Visit `http://localhost:4000`
2. Verify task list displays (or empty state)
3. Test pagination
4. Parse a new URL and verify it appears

---

## Code Examples

### Example 1: Saving a Task (modify `/api/parse/route.ts`)

```typescript
import { taskStore } from '@/lib/storage/task-store';

// After successful parsing
await taskStore.saveTask({
  id: crypto.randomUUID(),
  title: parsedResult.title,
  url: requestData.url,
  platform: parsedResult.platform,
  status: 'success',
  timestamp: new Date().toISOString(),
  content: parsedResult,
});

// After failed parsing
await taskStore.saveTask({
  id: crypto.randomUUID(),
  title: 'Parse Failed',
  url: requestData.url,
  platform: 'unknown',
  status: 'failed',
  timestamp: new Date().toISOString(),
  error: {
    message: error.message,
    code: 'PARSE_ERROR',
  },
});
```

### Example 2: Task List Component (Server Component)

```typescript
// src/components/tasks/TaskList.tsx
import { TaskItem } from './TaskItem';
import { EmptyState } from './EmptyState';
import { Pagination } from './Pagination';

interface TaskListProps {
  tasks: Task[];
  pagination: PaginationInfo;
}

export function TaskList({ tasks, pagination }: TaskListProps) {
  if (tasks.length === 0) {
    return <EmptyState />;
  }

  return (
    <div>
      <div className="space-y-4">
        {tasks.map(task => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>
      <Pagination {...pagination} />
    </div>
  );
}
```

### Example 3: Home Page (Server Component)

```typescript
// src/app/page.tsx
import { TaskList } from '@/components/tasks/TaskList';

export default async function HomePage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = parseInt(searchParams.page || '1', 10);

  const response = await fetch(
    `http://localhost:4000/api/tasks?page=${page}`,
    { cache: 'no-store' }
  );

  if (!response.ok) {
    throw new Error('Failed to fetch tasks');
  }

  const data = await response.json();

  return (
    <main className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">Processed Tasks</h1>
      <TaskList tasks={data.tasks} pagination={data.pagination} />
    </main>
  );
}
```

---

## Testing Strategy

### Unit Tests (Vitest)

Test individual components and functions in isolation.

**Priority**:
- ✅ Task store (file operations, caching)
- ✅ Component rendering (TaskItem, EmptyState)
- ✅ Pagination logic

```bash
npm run test:unit
npm run test:coverage  # Check coverage
```

### Integration Tests

Test API endpoints and full user flows.

**Priority**:
- ✅ `/api/tasks` returns correct data
- ✅ Pagination works across pages
- ✅ Filtering by platform/status

```bash
npm test
```

### Manual Testing Checklist

- [ ] Empty state displays when no tasks exist
- [ ] Task list displays with correct information
- [ ] Clicking pagination changes page
- [ ] Failed tasks show error indicator
- [ ] Loading states work correctly
- [ ] Page is responsive (mobile/desktop)

---

## Troubleshooting

### Issue: Tasks not appearing

**Solution**:
1. Check `data/tasks/index.json` exists and has tasks
2. Verify `/api/tasks` returns 200 status
3. Check browser console for errors

### Issue: Pagination not working

**Solution**:
1. Verify URL params are updating (`?page=2`)
2. Check API returns correct `pagination.totalPages`
3. Ensure Server Component re-fetches on param change

### Issue: Performance issues with many tasks

**Solution**:
1. Reduce `pageSize` (currently 20)
2. Implement virtual scrolling (future optimization)
3. Add caching with Next.js `revalidate`

---

## Next Steps

After completing P1 (MVP):

1. **P2 - Task Details**: Add modal/page for detailed view
2. **P3 - Filters**: Add search and platform filters
3. **Optimization**: Add virtual scrolling for large lists
4. **Analytics**: Track which platforms are most used
5. **Export**: Allow CSV/JSON export of task history

---

## Resources

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [React Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Vitest Testing](https://vitest.dev/)

---

## Getting Help

If you encounter issues:

1. Check the spec: `specs/001-task-visualization/spec.md`
2. Review data model: `specs/001-task-visualization/data-model.md`
3. Check API contracts: `specs/001-task-visualization/contracts/api-tasks.yaml`
4. Review research decisions: `specs/001-task-visualization/research.md`
