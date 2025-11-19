/**
 * Task Visualization Dashboard Types
 *
 * Type definitions for task history and visualization features.
 * Based on data-model.md specification.
 */

import type { PlatformType } from './platform';

// Re-export for convenience
export type { PlatformType };

// Task status enumeration
export type TaskStatus = 'success' | 'failed' | 'pending';

// Parsed content structure (nested within Task when status=success)
export interface ParsedContent {
  title: string;
  content: string;
  images?: string[];
  author?: string;
  publishedAt?: string; // ISO 8601
  aiEnhanced?: boolean;
  summary?: string;
  tags?: string[];
  optimizedTitle?: string;
}

// Task error structure (nested within Task when status=failed)
export interface TaskError {
  message: string;
  code?: string;
  stack?: string; // Dev/debug only
}

// Task metadata structure (optional additional context)
export interface TaskMetadata {
  userAgent?: string;
  ip?: string; // Anonymized
  duration?: number; // Processing time in milliseconds
  aiModel?: string;
}

// Main Task entity
export interface Task {
  id: string; // UUID v4
  title: string; // Max 500 chars
  url: string; // Valid HTTP/HTTPS URL
  platform: PlatformType;
  status: TaskStatus;
  timestamp: string; // ISO 8601 datetime
  content?: ParsedContent; // Present if status=success
  error?: TaskError; // Present if status=failed
  metadata?: TaskMetadata;
}

// Task index entry (for fast pagination without reading full task files)
export interface TaskIndexEntry {
  id: string;
  timestamp: string;
  platform: PlatformType;
  status: TaskStatus;
}

// Task index structure (stored in data/tasks/index.json)
export interface TaskIndex {
  version: string;
  lastUpdated: string; // ISO 8601
  totalTasks: number;
  tasks: TaskIndexEntry[];
}

// Pagination information
export interface PaginationInfo {
  currentPage: number;
  pageSize: number;
  totalTasks: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

// Task list response (from API)
export interface TaskListResponse {
  tasks: Task[];
  pagination: PaginationInfo;
}

// Query parameters for task filtering
export interface TaskQueryParams {
  page?: number;
  pageSize?: number;
  platform?: PlatformType;
  status?: TaskStatus;
  search?: string;
}
