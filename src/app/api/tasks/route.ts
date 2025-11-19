/**
 * Tasks API Route - T007-T010
 *
 * Provides paginated access to task history with filtering capabilities.
 * GET /api/tasks - List tasks with pagination and filters
 */

import { NextRequest, NextResponse } from 'next/server';
import { taskStore } from '@/lib/storage/task-store';
import { TaskListResponse, TaskQueryParams } from '@/lib/types/task';

export async function GET(request: NextRequest) {
  try {
    // T008: Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const platform = searchParams.get('platform') as any;
    const status = searchParams.get('status') as any;
    const search = searchParams.get('search') || undefined;

    // T010: Validate parameters
    if (page < 1) {
      return NextResponse.json(
        { error: 'Invalid page parameter - must be >= 1', code: 'INVALID_PARAM' },
        { status: 400 }
      );
    }

    if (pageSize < 1 || pageSize > 100) {
      return NextResponse.json(
        {
          error: 'Invalid pageSize parameter - must be between 1 and 100',
          code: 'INVALID_PARAM',
        },
        { status: 400 }
      );
    }

    // T009: Implement pagination logic using TaskStore
    const queryParams: TaskQueryParams = {
      page,
      pageSize,
      platform,
      status,
      search,
    };

    const { tasks, total } = await taskStore.getTasks(queryParams);

    // Calculate pagination info
    const totalPages = Math.ceil(total / pageSize);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const response: TaskListResponse = {
      tasks,
      pagination: {
        currentPage: page,
        pageSize,
        totalTasks: total,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    };

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-store', // Don't cache task list (real-time data)
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    // T010: Error handling
    console.error('Tasks API Error:', error);

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to retrieve tasks',
        code: 'INTERNAL_ERROR',
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
