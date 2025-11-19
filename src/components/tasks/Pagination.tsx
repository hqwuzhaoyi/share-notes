/**
 * Pagination Component - T013
 *
 * Page navigation controls using URL params for state management.
 * Supports shareable links via URL parameters.
 */

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { PaginationInfo } from '@/lib/types/task';

type PaginationProps = PaginationInfo;

export function Pagination({
  currentPage,
  totalPages,
  hasNextPage,
  hasPrevPage,
}: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const navigateToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`?${params.toString()}`);
  };

  if (totalPages <= 1) {
    return null; // Don't show pagination if only one page
  }

  // Calculate page range to show
  const getPageRange = () => {
    const range: number[] = [];
    const maxVisible = 7; // Show max 7 page numbers

    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        range.push(i);
      }
    } else {
      // Show first, last, and pages around current
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) range.push(i);
        range.push(-1); // Ellipsis
        range.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        range.push(1);
        range.push(-1); // Ellipsis
        for (let i = totalPages - 4; i <= totalPages; i++) range.push(i);
      } else {
        range.push(1);
        range.push(-1); // Ellipsis
        for (let i = currentPage - 1; i <= currentPage + 1; i++) range.push(i);
        range.push(-1); // Ellipsis
        range.push(totalPages);
      }
    }

    return range;
  };

  const pageRange = getPageRange();

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      {/* Previous button */}
      <button
        onClick={() => navigateToPage(currentPage - 1)}
        disabled={!hasPrevPage}
        className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Previous page"
      >
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
            d="M15 19l-7-7 7-7"
          />
        </svg>
      </button>

      {/* Page numbers */}
      {pageRange.map((page, index) => {
        if (page === -1) {
          // Ellipsis
          return (
            <span
              key={`ellipsis-${index}`}
              className="px-3 py-2 text-gray-500 dark:text-gray-500"
            >
              ...
            </span>
          );
        }

        const isCurrentPage = page === currentPage;

        return (
          <button
            key={page}
            onClick={() => navigateToPage(page)}
            className={`px-4 py-2 rounded-md border transition-colors ${
              isCurrentPage
                ? 'border-blue-500 bg-blue-500 text-white font-medium'
                : 'border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
            aria-label={`Page ${page}`}
            aria-current={isCurrentPage ? 'page' : undefined}
          >
            {page}
          </button>
        );
      })}

      {/* Next button */}
      <button
        onClick={() => navigateToPage(currentPage + 1)}
        disabled={!hasNextPage}
        className="px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        aria-label="Next page"
      >
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
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>
    </div>
  );
}
