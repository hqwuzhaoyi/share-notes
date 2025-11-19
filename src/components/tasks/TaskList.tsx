/**
 * TaskList Component - T014, T022-T024
 *
 * Container component that orchestrates TaskItem, EmptyState, and Pagination.
 * Includes modal state management for TaskDetails (T022-T024).
 */

'use client';

import { useState } from 'react';
import { Task, PaginationInfo } from '@/lib/types/task';
import { TaskItem } from './TaskItem';
import { TaskDetails } from './TaskDetails';
import { EmptyState } from './EmptyState';
import { Pagination } from './Pagination';

interface TaskListProps {
  tasks: Task[];
  pagination: PaginationInfo;
}

export function TaskList({ tasks, pagination }: TaskListProps) {
  // T022: Modal state management
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleTaskClick = (task: Task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // Clear selected task after modal animation completes
    setTimeout(() => setSelectedTask(null), 200);
  };

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
          <TaskItem key={task.id} task={task} onClick={() => handleTaskClick(task)} />
        ))}
      </div>

      {/* Pagination */}
      <Pagination {...pagination} />

      {/* T023-T024: TaskDetails modal */}
      {selectedTask && (
        <TaskDetails task={selectedTask} isOpen={isModalOpen} onClose={handleCloseModal} />
      )}
    </div>
  );
}
