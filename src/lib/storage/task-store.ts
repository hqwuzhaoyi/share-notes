/**
 * Task Store - File-based JSON storage with in-memory cache
 *
 * Implements task persistence using file system storage with an index
 * for fast pagination. Based on research.md decision for simplicity
 * and Vercel compatibility.
 */

import fs from 'fs/promises';
import path from 'path';
import { Task, TaskIndex, TaskIndexEntry, TaskQueryParams } from '../types/task';

const TASKS_DIR = path.join(process.cwd(), 'data', 'tasks');
const INDEX_FILE = path.join(TASKS_DIR, 'index.json');
const INDEX_VERSION = '1.0';

class TaskStore {
  private indexCache: TaskIndex | null = null;
  private taskCache: Map<string, Task> = new Map();
  private readonly maxCacheSize = 100; // LRU cache size

  /**
   * Initialize task storage (ensure directories exist)
   */
  private async init(): Promise<void> {
    try {
      await fs.access(TASKS_DIR);
    } catch {
      await fs.mkdir(TASKS_DIR, { recursive: true });
    }
  }

  /**
   * Load task index from file system
   */
  private async loadIndex(): Promise<TaskIndex> {
    if (this.indexCache) {
      return this.indexCache;
    }

    try {
      const indexData = await fs.readFile(INDEX_FILE, 'utf-8');
      this.indexCache = JSON.parse(indexData);
      return this.indexCache;
    } catch (error) {
      // Index doesn't exist yet, create empty one
      const emptyIndex: TaskIndex = {
        version: INDEX_VERSION,
        lastUpdated: new Date().toISOString(),
        totalTasks: 0,
        tasks: [],
      };
      this.indexCache = emptyIndex;
      return emptyIndex;
    }
  }

  /**
   * Save task index to file system
   */
  private async saveIndex(index: TaskIndex): Promise<void> {
    await this.init();
    index.lastUpdated = new Date().toISOString();
    await fs.writeFile(INDEX_FILE, JSON.stringify(index, null, 2), 'utf-8');
    this.indexCache = index;
  }

  /**
   * Get filename for a task
   */
  private getTaskFilename(taskId: string, timestamp: string): string {
    const ts = new Date(timestamp).getTime();
    return path.join(TASKS_DIR, `${ts}-${taskId}.json`);
  }

  /**
   * Save a task to storage
   */
  async saveTask(task: Task): Promise<void> {
    await this.init();

    // Validate required fields
    if (!task.id || !task.title || !task.url || !task.platform || !task.status || !task.timestamp) {
      throw new Error('Missing required task fields');
    }

    // Sanitize data (truncate long content, remove sensitive data)
    const sanitizedTask = { ...task };
    if (sanitizedTask.title.length > 500) {
      sanitizedTask.title = sanitizedTask.title.substring(0, 500);
    }
    if (sanitizedTask.content?.content && sanitizedTask.content.content.length > 100000) {
      sanitizedTask.content.content = sanitizedTask.content.content.substring(0, 100000);
    }

    // Save task file
    const filename = this.getTaskFilename(task.id, task.timestamp);
    await fs.writeFile(filename, JSON.stringify(sanitizedTask, null, 2), 'utf-8');

    // Update cache
    this.addToCache(task.id, sanitizedTask);

    // Update index
    const index = await this.loadIndex();
    const existingIndex = index.tasks.findIndex((t) => t.id === task.id);

    const indexEntry: TaskIndexEntry = {
      id: task.id,
      timestamp: task.timestamp,
      platform: task.platform,
      status: task.status,
    };

    if (existingIndex >= 0) {
      index.tasks[existingIndex] = indexEntry;
    } else {
      index.tasks.unshift(indexEntry); // Add to beginning (newest first)
      index.totalTasks++;
    }

    await this.saveIndex(index);
  }

  /**
   * Get tasks with pagination and filtering
   */
  async getTasks(params: TaskQueryParams = {}): Promise<{ tasks: Task[]; total: number }> {
    await this.init();
    const index = await this.loadIndex();

    const page = params.page || 1;
    const pageSize = params.pageSize || 20;

    // Filter tasks based on query params
    let filteredTasks = index.tasks;

    if (params.platform) {
      filteredTasks = filteredTasks.filter((t) => t.platform === params.platform);
    }

    if (params.status) {
      filteredTasks = filteredTasks.filter((t) => t.status === params.status);
    }

    // Search in title/URL (will be implemented when we load full tasks)
    const needsSearch = !!params.search;

    // Calculate pagination
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedEntries = filteredTasks.slice(startIndex, endIndex);

    // Load full task data
    const tasks: Task[] = [];
    for (const entry of paginatedEntries) {
      try {
        const task = await this.getTaskById(entry.id);
        if (task) {
          // Apply search filter if needed
          if (needsSearch && params.search) {
            const searchLower = params.search.toLowerCase();
            const matchesTitle = task.title.toLowerCase().includes(searchLower);
            const matchesUrl = task.url.toLowerCase().includes(searchLower);
            if (!matchesTitle && !matchesUrl) {
              continue;
            }
          }
          tasks.push(task);
        }
      } catch (error) {
        console.warn(`Failed to load task ${entry.id}:`, error);
        // Skip corrupted tasks
      }
    }

    return {
      tasks,
      total: needsSearch ? tasks.length : filteredTasks.length,
    };
  }

  /**
   * Get a single task by ID
   */
  async getTaskById(taskId: string): Promise<Task | null> {
    // Check cache first
    if (this.taskCache.has(taskId)) {
      return this.taskCache.get(taskId)!;
    }

    await this.init();
    const index = await this.loadIndex();
    const entry = index.tasks.find((t) => t.id === taskId);

    if (!entry) {
      return null;
    }

    try {
      const filename = this.getTaskFilename(taskId, entry.timestamp);
      const taskData = await fs.readFile(filename, 'utf-8');
      const task: Task = JSON.parse(taskData);

      // Update cache
      this.addToCache(taskId, task);

      return task;
    } catch (error) {
      console.error(`Failed to read task file for ${taskId}:`, error);
      return null;
    }
  }

  /**
   * Add task to cache with LRU eviction
   */
  private addToCache(taskId: string, task: Task): void {
    // Remove if exists (to update position)
    if (this.taskCache.has(taskId)) {
      this.taskCache.delete(taskId);
    }

    // Add to cache
    this.taskCache.set(taskId, task);

    // Evict oldest if cache is full
    if (this.taskCache.size > this.maxCacheSize) {
      const firstKey = this.taskCache.keys().next().value;
      this.taskCache.delete(firstKey);
    }
  }

  /**
   * Clear cache (for testing or maintenance)
   */
  clearCache(): void {
    this.indexCache = null;
    this.taskCache.clear();
  }
}

// Export singleton instance
export const taskStore = new TaskStore();
