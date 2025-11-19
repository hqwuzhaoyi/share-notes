/**
 * Platform Type Definitions
 * Single source of truth for supported platforms
 */

/**
 * Supported content platforms
 * Each platform may support different content types
 */
export type PlatformType =
  | 'xiaohongshu'
  | 'bilibili'
  | 'wechat'
  | 'wechat-read'
  | 'youtube'
  | 'twitter'
  | 'unknown';
