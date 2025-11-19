/**
 * EmptyState Component - T011
 *
 * Displays a message when no tasks exist in the system.
 * Provides helpful guidance to users on getting started.
 */

export function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-24 h-24 mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
        <svg
          className="w-12 h-12 text-gray-400 dark:text-gray-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        No Tasks Yet
      </h2>

      <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
        Start parsing URLs to see your task history here. All processed tasks will be
        displayed with their status and details.
      </p>

      <div className="text-sm text-gray-500 dark:text-gray-500">
        Use the <code className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
          /api/parse
        </code> endpoint to parse URLs
      </div>
    </div>
  );
}
