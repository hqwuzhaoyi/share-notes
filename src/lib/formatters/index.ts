/**
 * Formatter Module Entry Point
 *
 * Registers all platform formatters at module initialization.
 * Exports the formatter registry for use by API routes.
 */

import { formatterRegistry } from './formatter-registry';
import { FlomoFormatter } from './flomo-formatter';
import { NotesFormatter } from './notes-formatter';
import { RawFormatter } from './raw-formatter';

/**
 * Initialize all formatters at module load time
 *
 * Registration happens once when this module is first imported.
 * Uses "first wins" idempotent strategy for HMR safety.
 */
const flomoFormatter = new FlomoFormatter();
const notesFormatter = new NotesFormatter();
const rawFormatter = new RawFormatter();

// Register formatters (idempotent - first wins)
formatterRegistry.register('flomo', flomoFormatter);
formatterRegistry.register('notes', notesFormatter);
formatterRegistry.register('raw', rawFormatter);

/**
 * Re-export for convenience
 */
export { formatterRegistry };
export type { FormatterRegistry } from './formatter-registry';

// Export formatter classes for testing
export { FlomoFormatter } from './flomo-formatter';
export { NotesFormatter } from './notes-formatter';
export { RawFormatter } from './raw-formatter';

// Export base class and types
export { BaseOutputFormatter } from '../types/formatter';
export type {
  PlatformCapabilities,
  FormattedOutput,
  FormatterError,
  FormatterErrorCode,
  FormatterResult
} from '../types/formatter';
