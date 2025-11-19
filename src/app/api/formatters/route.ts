/**
 * Formatters Capability Discovery API
 *
 * GET /api/formatters - Returns capabilities for all registered formatters
 *
 * This endpoint enables clients to:
 * - Discover available output platforms
 * - Query platform feature support (images, direct create)
 * - Check content length limits
 */

import { NextResponse } from 'next/server';
import { formatterRegistry } from '@/lib/formatters';

/**
 * GET /api/formatters
 *
 * Returns:
 * {
 *   "flomo": {
 *     "supportsImages": true,
 *     "supportsDirectCreate": true,
 *     "maxContentLength": 50000
 *   },
 *   "notes": {
 *     "supportsImages": false,
 *     "supportsDirectCreate": true,
 *     "maxContentLength": 30000
 *   },
 *   "raw": {
 *     "supportsImages": true,
 *     "supportsDirectCreate": true
 *   }
 * }
 */
export async function GET() {
  try {
    const capabilities = formatterRegistry.listCapabilities();

    return NextResponse.json(capabilities, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour (capabilities rarely change)
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('Formatters API Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to retrieve formatter capabilities',
        message: error instanceof Error ? error.message : String(error)
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

/**
 * OPTIONS /api/formatters (CORS preflight)
 */
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
