# Data Model: Task Visualization Dashboard

**Feature**: 001-task-visualization
**Date**: 2025-11-17

## Core Entities

### Task

Represents a single parsing operation with its results and metadata.

**Purpose**: Store complete history of all URL parsing attempts for dashboard display.

**Fields**:

| Field | Type | Required | Description | Validation |
|-------|------|----------|-------------|------------|
| `id` | string | Yes | Unique identifier (UUID v4) | UUID format |
| `title` | string | Yes | Extracted or generated title | Non-empty, max 500 chars |
| `url` | string | Yes | Original URL that was parsed | Valid URL format |
| `platform` | PlatformType | Yes | Detected platform | Enum: xiaohongshu, bilibili, wechat, unknown |
| `status` | TaskStatus | Yes | Processing outcome | Enum: success, failed, pending |
| `timestamp` | Date (ISO string) | Yes | When parsing was completed | Valid ISO 8601 |
| `content` | ParsedContent | Conditional | Full parsing results | Required if status=success |
| `error` | TaskError | Conditional | Error information | Required if status=failed |
| `metadata` | TaskMetadata | No | Additional context | Optional |

**Relationships**:
- Each Task is independent (no foreign keys)
- Tasks are ordered by timestamp (descending)

**State Transitions**:
```
pending → success (with content)
pending → failed (with error)
```

**Indexing strategy**:
- Primary: `timestamp` (descending) - for pagination
- Secondary: `platform` - for filtering
- Tertiary: `status` - for filtering

---

### ParsedContent

Nested within Task when status=success. Contains full parsing results.

**Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Extracted content title |
| `content` | string | Yes | Main content text |
| `images` | string[] | No | Array of image URLs |
| `author` | string | No | Content author/creator |
| `publishedAt` | Date (ISO string) | No | Original publish date |
| `aiEnhanced` | boolean | No | Whether AI enhancement was applied |
| `summary` | string | No | AI-generated summary |
| `tags` | string[] | No | AI-generated tags |
| `optimizedTitle` | string | No | AI-optimized title |

---

### TaskError

Nested within Task when status=failed. Contains error details.

**Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `message` | string | Yes | Human-readable error message |
| `code` | string | No | Error code for categorization |
| `stack` | string | No | Stack trace (dev/debug only) |

---

### TaskMetadata

Optional metadata for additional context.

**Fields**:

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `userAgent` | string | No | Client user agent |
| `ip` | string | No | Request IP (anonymized) |
| `duration` | number | No | Processing time in milliseconds |
| `aiModel` | string | No | AI model used (if applicable) |

---

## Type Definitions

### PlatformType (enum)

```typescript
type PlatformType =
  | 'xiaohongshu'
  | 'bilibili'
  | 'wechat'
  | 'unknown';
```

### TaskStatus (enum)

```typescript
type TaskStatus =
  | 'success'
  | 'failed'
  | 'pending';
```

---

## Storage Schema

### File Structure

```
data/
└── tasks/
    ├── index.json              # Task index for fast queries
    └── {timestamp}-{uuid}.json # Individual task files
```

### Index File Format (`index.json`)

```json
{
  "version": "1.0",
  "lastUpdated": "2025-11-17T10:00:00Z",
  "totalTasks": 150,
  "tasks": [
    {
      "id": "uuid-here",
      "timestamp": "2025-11-17T09:30:00Z",
      "platform": "xiaohongshu",
      "status": "success"
    }
  ]
}
```

**Purpose**: Fast pagination without reading all task files.
**Update strategy**: Rebuild on each write (acceptable for our scale).

### Task File Format (`{timestamp}-{uuid}.json`)

```json
{
  "id": "uuid-here",
  "title": "Amazing Content Title",
  "url": "https://xiaohongshu.com/explore/12345",
  "platform": "xiaohongshu",
  "status": "success",
  "timestamp": "2025-11-17T09:30:00Z",
  "content": {
    "title": "Amazing Content Title",
    "content": "Full content text...",
    "images": ["https://example.com/img1.jpg"],
    "author": "Content Creator",
    "publishedAt": "2025-11-15T08:00:00Z",
    "aiEnhanced": true,
    "summary": "This is a summary...",
    "tags": ["tag1", "tag2"]
  },
  "metadata": {
    "duration": 1500,
    "aiModel": "qwen-plus"
  }
}
```

---

## Validation Rules

### Required Field Validation

- **id**: Must be valid UUID v4 format
- **title**: Non-empty string, max 500 characters
- **url**: Valid HTTP/HTTPS URL format
- **platform**: Must be one of PlatformType enum values
- **status**: Must be one of TaskStatus enum values
- **timestamp**: Valid ISO 8601 datetime string

### Conditional Validation

- If `status === 'success'`: `content` field must be present
- If `status === 'failed'`: `error` field must be present
- If `aiEnhanced === true`: `summary` or `tags` or `optimizedTitle` should be present

### Data Sanitization

- Remove potentially sensitive data (passwords, tokens) from URLs
- Truncate excessively long content (>100KB)
- Sanitize file paths in task IDs (prevent directory traversal)

---

## Pagination Strategy

### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number (1-indexed) |
| `pageSize` | number | 20 | Tasks per page |
| `platform` | PlatformType | (all) | Filter by platform |
| `status` | TaskStatus | (all) | Filter by status |
| `search` | string | (none) | Search in title/URL |

### Response Format

```json
{
  "tasks": [...],           // Array of Task objects
  "pagination": {
    "currentPage": 1,
    "pageSize": 20,
    "totalTasks": 150,
    "totalPages": 8,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## Migration & Versioning

### Current Version: 1.0

**Schema changes**: None (initial version)

### Future Considerations

- Add `deletedAt` field for soft deletes
- Add `tags` field for manual categorization
- Add `favorite` boolean for user bookmarks
- Consider compressed storage for content field if files grow large

### Backward Compatibility

- New optional fields can be added without migration
- Required field changes require migration script
- Index version tracks schema changes
