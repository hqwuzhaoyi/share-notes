/**
 * Home Page - Task Visualization Dashboard (T016-T019)
 *
 * Server Component that fetches tasks and displays the task visualization dashboard.
 * Replaces the default Next.js welcome page with task history.
 */

import { Suspense } from 'react';
import { TaskList } from '@/components/tasks/TaskList';
import { TaskListResponse } from '@/lib/types/task';

// T019: Error boundary component
function ErrorDisplay({ error }: { error: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-red-600 dark:text-red-400"
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
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Failed to Load Tasks
        </h2>
        <p className="text-gray-600 dark:text-gray-400">{error}</p>
      </div>
    </div>
  );
}

// T018: Loading state component
function LoadingState() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="border border-gray-200 dark:border-gray-800 rounded-lg p-4 animate-pulse"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="h-6 w-20 bg-gray-200 dark:bg-gray-800 rounded"></div>
            <div className="h-6 w-24 bg-gray-200 dark:bg-gray-800 rounded"></div>
          </div>
          <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-800 rounded mb-2"></div>
          <div className="h-4 w-full bg-gray-200 dark:bg-gray-800 rounded"></div>
        </div>
      ))}
    </div>
  );
}

// T016-T017: Main page component with server-side data fetching
export default async function HomePage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = parseInt(searchParams.page || '1', 10);

  try {
    // T016: Server-side data fetching
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:4000';
    const response = await fetch(`${baseUrl}/api/tasks?page=${page}`, {
      cache: 'no-store', // Don't cache for real-time data
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch tasks: ${response.statusText}`);
    }

    const data: TaskListResponse = await response.json();

    return (
      <main className="container mx-auto max-w-5xl p-4 sm:p-8 min-h-screen">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Task History
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            All processed URL parsing tasks with their results and status
          </p>
        </div>

        {/* Task list with loading state (T018) */}
        <Suspense fallback={<LoadingState />}>
          <TaskList tasks={data.tasks} pagination={data.pagination} />
        </Suspense>
      </main>
    );
  } catch (error) {
    // T019: Error handling
    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred';
    return (
      <main className="container mx-auto max-w-5xl p-4 sm:p-8 min-h-screen">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Task History
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            All processed URL parsing tasks with their results and status
          </p>
        </div>
        <ErrorDisplay error={errorMessage} />
      </main>
    );
  }
}
