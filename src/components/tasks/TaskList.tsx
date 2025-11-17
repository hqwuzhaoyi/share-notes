/**
 * TaskList Component - T014
 *
 * Container component that orchestrates TaskItem, EmptyState, and Pagination.
 * Server Component that receives data as props from page.
 */

import { Task, PaginationInfo } from '@/lib/types/task';
import { TaskItem } from './TaskItem';
import { EmptyState } from './EmptyState';
import { Pagination } from './Pagination';

interface TaskListProps {
  tasks: Task[];
  pagination: PaginationInfo;
}

export function TaskList({ tasks, pagination }: TaskListProps) {
  // Show empty state if no tasks
  if (tasks.length === 0) {
    return <EmptyState />;
  }

  return (
    <div>
      {/* Task count indicator */}
      <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
        Showing {tasks.length} of {pagination.totalTasks} tasks
      </div>

      {/* Task list */}
      <div className="space-y-4">
        {tasks.map((task) => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>

      {/* Pagination */}
      <Pagination {...pagination} />
    </div>
  );
}
