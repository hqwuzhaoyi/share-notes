/**
 * Formatter Registry
 *
 * Central registry managing all formatter instances using module-level singleton pattern.
 * Provides formatter discovery, registration, and capability querying.
 */

import type { BaseOutputFormatter, PlatformCapabilities } from '../types/formatter';

/**
 * Registry class managing formatter instances
 *
 * Design decisions:
 * - Module-level singleton (not class singleton) for Next.js compatibility
 * - Idempotent registration ("first wins") for HMR safety
 * - Fail-fast validation at registration time
 * - O(1) lookups using Map data structure
 */
class FormatterRegistry {
  /**
   * Internal storage: platform name → formatter instance
   * Private to enforce registration through public API
   */
  private readonly formatters = new Map<string, BaseOutputFormatter>();

  /**
   * Register a formatter for a platform
   *
   * @param platform - Unique platform identifier (e.g., 'flomo', 'notes')
   * @param formatter - Formatter instance implementing BaseOutputFormatter
   * @returns true if registered, false if already exists (idempotent)
   * @throws {Error} if platform or formatter invalid
   *
   * Validation rules:
   * - Platform must be non-empty string
   * - Formatter must have valid capabilities
   * - Capabilities must have boolean flags
   * - maxContentLength if present must be positive
   */
  register(platform: string, formatter: BaseOutputFormatter): boolean {
    // Fail-fast validation: platform name
    if (!platform || typeof platform !== 'string') {
      throw new Error(`Invalid platform: must be non-empty string`);
    }

    // Fail-fast validation: formatter structure
    if (!formatter || !formatter.capabilities) {
      throw new Error(`Invalid formatter for "${platform}": must have capabilities`);
    }

    // Fail-fast validation: capability types
    const { supportsImages, supportsDirectCreate, maxContentLength } = formatter.capabilities;

    if (typeof supportsImages !== 'boolean') {
      throw new Error(`${platform}: supportsImages must be boolean, got ${typeof supportsImages}`);
    }

    if (typeof supportsDirectCreate !== 'boolean') {
      throw new Error(`${platform}: supportsDirectCreate must be boolean, got ${typeof supportsDirectCreate}`);
    }

    if (maxContentLength !== undefined &&
        (typeof maxContentLength !== 'number' || maxContentLength <= 0)) {
      throw new Error(`${platform}: maxContentLength must be positive number, got ${maxContentLength}`);
    }

    // Idempotent: first registration wins (HMR-safe)
    if (this.formatters.has(platform)) {
      return false;
    }

    this.formatters.set(platform, formatter);
    return true;
  }

  /**
   * Get formatter for a platform
   *
   * @param platform - Platform identifier
   * @returns Formatter instance
   * @throws {Error} if platform not registered
   */
  get(platform: string): BaseOutputFormatter {
    const formatter = this.formatters.get(platform);
    if (!formatter) {
      const available = Array.from(this.formatters.keys()).join(', ');
      throw new Error(
        `Unknown platform "${platform}". Available: ${available}`
      );
    }
    return formatter;
  }

  /**
   * Check if platform is registered
   */
  has(platform: string): boolean {
    return this.formatters.has(platform);
  }

  /**
   * Get all registered platform names
   */
  getPlatforms(): readonly string[] {
    return Array.from(this.formatters.keys());
  }

  /**
   * Get capabilities for all registered platforms
   * Used by /api/formatters endpoint
   */
  listCapabilities(): Record<string, PlatformCapabilities> {
    const result: Record<string, PlatformCapabilities> = {};
    for (const [platform, formatter] of this.formatters) {
      result[platform] = formatter.capabilities;
    }
    return result;
  }

  /**
   * Clear all registrations (testing only)
   * @internal
   */
  clear(): void {
    this.formatters.clear();
  }
}

/**
 * Module-level singleton export
 *
 * Why module-level instead of class singleton:
 * - Next.js ES module caching handles instance management
 * - Zero getInstance() boilerplate
 * - Tree-shakeable
 * - HMR compatible
 */
export const formatterRegistry = new FormatterRegistry();

/**
 * Export type for use in other modules
 */
export type { FormatterRegistry };
