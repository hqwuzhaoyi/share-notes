/**
 * TaskFilters Component - T027-T030
 *
 * Search input, platform dropdown, and filter controls with URL param state management.
 */

'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

interface TaskFiltersProps {
  onFilterChange?: () => void;
}

export function TaskFilters({ onFilterChange }: TaskFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // T028: Search input with state
  const [searchInput, setSearchInput] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchInput);

  // T029: Platform filter state
  const [selectedPlatform, setSelectedPlatform] = useState(
    searchParams.get('platform') || 'all'
  );

  // T030: Status filter state
  const [selectedStatus, setSelectedStatus] = useState(searchParams.get('status') || 'all');

  // T028: Debounce search input (300ms delay)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Update URL params when filters change
  const updateFilters = useCallback(
    (updates: { search?: string; platform?: string; status?: string; page?: string }) => {
      const params = new URLSearchParams(searchParams.toString());

      // Update each parameter
      Object.entries(updates).forEach(([key, value]) => {
        if (value && value !== 'all') {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      });

      // Reset to page 1 when filters change
      if (updates.search !== undefined || updates.platform !== undefined || updates.status !== undefined) {
        params.delete('page');
      }

      router.push(`?${params.toString()}`);
      onFilterChange?.();
    },
    [searchParams, router, onFilterChange]
  );

  // Update URL when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== (searchParams.get('search') || '')) {
      updateFilters({ search: debouncedSearch });
    }
  }, [debouncedSearch, searchParams, updateFilters]);

  // Handle platform change
  const handlePlatformChange = (platform: string) => {
    setSelectedPlatform(platform);
    updateFilters({ platform });
  };

  // Handle status change
  const handleStatusChange = (status: string) => {
    setSelectedStatus(status);
    updateFilters({ status });
  };

  // Clear all filters
  const handleClearFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setSelectedPlatform('all');
    setSelectedStatus('all');
    router.push('/');
    onFilterChange?.();
  };

  const hasActiveFilters =
    searchInput || selectedPlatform !== 'all' || selectedStatus !== 'all';

  return (
    <div className="mb-6 space-y-4">
      {/* Search Input */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1">
          <label htmlFor="search" className="sr-only">
            Search tasks
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              id="search"
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search by title or URL..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            {searchInput && (
              <button
                onClick={() => setSearchInput('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                aria-label="Clear search"
              >
                <svg
                  className="h-5 w-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
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
            )}
          </div>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={handleClearFilters}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Filter Dropdowns */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Platform Filter */}
        <div className="flex-1">
          <label htmlFor="platform" className="sr-only">
            Filter by platform
          </label>
          <select
            id="platform"
            value={selectedPlatform}
            onChange={(e) => handlePlatformChange(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Platforms</option>
            <option value="xiaohongshu">Xiaohongshu (小红书)</option>
            <option value="bilibili">Bilibili (哔哩哔哩)</option>
            <option value="wechat">WeChat (微信)</option>
            <option value="unknown">Unknown</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex-1">
          <label htmlFor="status" className="sr-only">
            Filter by status
          </label>
          <select
            id="status"
            value={selectedStatus}
            onChange={(e) => handleStatusChange(e.target.value)}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
            <option value="pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center text-sm">
          <span className="text-gray-500 dark:text-gray-400">Active filters:</span>
          {searchInput && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">
              Search: &ldquo;{searchInput}&rdquo;
              <button
                onClick={() => setSearchInput('')}
                className="hover:text-blue-900 dark:hover:text-blue-100"
                aria-label="Remove search filter"
              >
                ×
              </button>
            </span>
          )}
          {selectedPlatform !== 'all' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full">
              Platform: {selectedPlatform}
              <button
                onClick={() => handlePlatformChange('all')}
                className="hover:text-green-900 dark:hover:text-green-100"
                aria-label="Remove platform filter"
              >
                ×
              </button>
            </span>
          )}
          {selectedStatus !== 'all' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-full">
              Status: {selectedStatus}
              <button
                onClick={() => handleStatusChange('all')}
                className="hover:text-purple-900 dark:hover:text-purple-100"
                aria-label="Remove status filter"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
