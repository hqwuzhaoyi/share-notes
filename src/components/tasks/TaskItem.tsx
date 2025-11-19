/**
 * TaskItem Component - T012, T015, T021
 *
 * Displays a single task with title, URL, platform, status, and timestamp.
 * Includes platform badges and status indicators (T015).
 * Includes click handler to open TaskDetails modal (T021).
 */

'use client';

import { Task } from '@/lib/types/task';

interface TaskItemProps {
  task: Task;
  onClick?: () => void;
}

export function TaskItem({ task, onClick }: TaskItemProps) {
  // Platform badge colors
  const platformColors = {
    xiaohongshu: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    bilibili: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    wechat: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    'wechat-read': 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    youtube: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    twitter: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    unknown: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300',
  } as Record<string, string>;

  // Status indicator colors and icons (T015)
  const statusConfig = {
    success: {
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
      icon: '✓',
      label: 'Success',
    },
    failed: {
      color: 'text-red-600 dark:text-red-400',
      bgColor: 'bg-red-100 dark:bg-red-900/30',
      icon: '✗',
      label: 'Failed',
    },
    pending: {
      color: 'text-yellow-600 dark:text-yellow-400',
      bgColor: 'bg-yellow-100 dark:bg-yellow-900/30',
      icon: '⋯',
      label: 'Pending',
    },
  };

  const platformColor = platformColors[task.platform] || platformColors.unknown;
  const status = statusConfig[task.status];

  // Format timestamp
  const date = new Date(task.timestamp);
  const formattedDate = date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const formattedTime = date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div
      className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-700 transition-colors cursor-pointer hover:shadow-md"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* Header with status and platform */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {/* Status indicator */}
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${status.bgColor} ${status.color}`}
          >
            <span>{status.icon}</span>
            <span>{status.label}</span>
          </span>

          {/* Platform badge */}
          <span
            className={`inline-flex px-2 py-1 rounded text-xs font-medium ${platformColor}`}
          >
            {task.platform}
          </span>
        </div>

        {/* Timestamp */}
        <div className="text-xs text-gray-500 dark:text-gray-500">
          <div>{formattedDate}</div>
          <div className="text-right">{formattedTime}</div>
        </div>
      </div>

      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">
        {task.title}
      </h3>

      {/* URL */}
      <a
        href={task.url}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-blue-600 dark:text-blue-400 hover:underline truncate block mb-2"
      >
        {task.url}
      </a>

      {/* Error message for failed tasks */}
      {task.status === 'failed' && task.error && (
        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-700 dark:text-red-400">
          <span className="font-medium">Error:</span> {task.error.message}
        </div>
      )}

      {/* AI Enhanced indicator */}
      {task.content?.aiEnhanced && (
        <div className="mt-2 inline-flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM9 9a1 1 0 112 0v4a1 1 0 11-2 0V9zm1-3a1 1 0 100 2 1 1 0 000-2z" />
          </svg>
          <span>AI Enhanced</span>
        </div>
      )}
    </div>
  );
}
