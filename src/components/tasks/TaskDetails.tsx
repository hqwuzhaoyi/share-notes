/**
 * TaskDetails Component - T020
 *
 * Modal/overlay component that displays full task details including
 * extracted content, images, metadata, and AI enhancements.
 */

'use client';

import { Task } from '@/lib/types/task';
import { useEffect, useRef } from 'react';

interface TaskDetailsProps {
  task: Task;
  isOpen: boolean;
  onClose: () => void;
}

export function TaskDetails({ task, isOpen, onClose }: TaskDetailsProps) {
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Handle click outside modal to close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const { content, error } = task;
  const isSuccess = task.status === 'success';
  const isAIEnhanced = content?.aiEnhanced;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="relative bg-white dark:bg-gray-900 rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
          <h2
            id="modal-title"
            className="text-2xl font-bold text-gray-900 dark:text-gray-100"
          >
            Task Details
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close modal"
          >
            <svg
              className="w-6 h-6 text-gray-500 dark:text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                Title
              </h3>
              <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {task.title}
              </p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                URL
              </h3>
              <a
                href={task.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 dark:text-blue-400 hover:underline break-all"
              >
                {task.url}
              </a>
            </div>

            <div className="flex gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Platform
                </h3>
                <span
                  className={`inline-block px-3 py-1 rounded text-sm font-medium ${
                    task.platform === 'xiaohongshu'
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                      : task.platform === 'bilibili'
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                      : task.platform === 'wechat'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                  }`}
                >
                  {task.platform}
                </span>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Status
                </h3>
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded text-sm font-medium ${
                    task.status === 'success'
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400'
                      : task.status === 'failed'
                      ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                      : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                  }`}
                >
                  <span>
                    {task.status === 'success'
                      ? '✓'
                      : task.status === 'failed'
                      ? '✗'
                      : '⋯'}
                  </span>
                  <span className="capitalize">{task.status}</span>
                </span>
              </div>

              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Timestamp
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  {new Date(task.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          {/* Success Content */}
          {isSuccess && content && (
            <>
              {/* AI Enhancement Badge */}
              {isAIEnhanced && (
                <div className="flex items-center gap-2 px-4 py-2 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <svg
                    className="w-5 h-5 text-purple-600 dark:text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    AI Enhanced Content
                  </span>
                </div>
              )}

              {/* Optimized Title (if AI enhanced) */}
              {content.optimizedTitle && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    AI Optimized Title
                  </h3>
                  <p className="text-base font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
                    {content.optimizedTitle}
                  </p>
                </div>
              )}

              {/* Summary (if AI enhanced) */}
              {content.summary && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    AI Summary
                  </h3>
                  <p className="text-base text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800 leading-relaxed">
                    {content.summary}
                  </p>
                </div>
              )}

              {/* Tags (if AI enhanced) */}
              {content.tags && content.tags.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {content.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Content */}
              <div>
                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                  Content
                </h3>
                <div className="prose dark:prose-invert max-w-none bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {content.content}
                  </p>
                </div>
              </div>

              {/* Images */}
              {content.images && content.images.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Images ({content.images.length})
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {content.images.map((image, index) => (
                      <a
                        key={index}
                        href={image}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"
                      >
                        <img
                          src={image}
                          alt={`Image ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              {(content.author || content.publishedAt) && (
                <div className="flex gap-6 pt-4 border-t border-gray-200 dark:border-gray-800">
                  {content.author && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Author
                      </h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {content.author}
                      </p>
                    </div>
                  )}
                  {content.publishedAt && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                        Published
                      </h3>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {new Date(content.publishedAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Error Content */}
          {!isSuccess && error && (
            <div className="space-y-4">
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-300 mb-2 flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  Error Message
                </h3>
                <p className="text-sm text-red-700 dark:text-red-400">
                  {error.message}
                </p>
              </div>

              {error.code && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Error Code
                  </h3>
                  <code className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-sm font-mono">
                    {error.code}
                  </code>
                </div>
              )}

              {error.stack && (
                <details className="group">
                  <summary className="cursor-pointer text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                    Stack Trace (click to expand)
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 rounded overflow-x-auto font-mono">
                    {error.stack}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-200 dark:border-gray-800 px-6 py-4">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
