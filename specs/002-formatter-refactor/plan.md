# Implementation Plan: Output Formatter Refactoring

**Branch**: `002-formatter-refactor` | **Date**: 2025-11-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-formatter-refactor/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Refactor the iOS output formatting system from a single monolithic class to a strategy pattern with capability declarations. This enables zero-breaking-change platform extensibility, allowing new platforms (Apple Notes, Notion, Obsidian) to be added without modifying existing code. Each platform formatter declares its capabilities (image support, direct creation, length limits) and provides consistent output through a unified interface (url_scheme, shortcut_trigger, raw_content).

## Technical Context

**Language/Version**: TypeScript 5.x with strict mode
**Primary Dependencies**: Next.js 15.5.0, React 19.1.0, Zod 4.1.8
**Storage**: N/A (stateless formatting system)
**Testing**: Vitest 3.2.4 for unit/integration tests, existing Node.js test suite
**Target Platform**: Next.js App Router API routes (Node.js runtime)
**Project Type**: Web application (Next.js-based API service)
**Performance Goals**: <50ms formatter registration validation, <10ms per format operation
**Constraints**: 100% backward compatibility required, zero breaking changes to existing Flomo/Notes API responses
**Scale/Scope**: Support 5-10 platform formatters initially, extensible to 20+ platforms

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: Constitution file is a template - no project-specific principles defined yet.

**Default Engineering Gates** (applied in absence of constitution):
- ✅ **Backward Compatibility**: FR-007 requires zero breaking changes - all existing tests must pass
- ✅ **Testability**: All formatters independently testable (FR-010 fail-fast validation)
- ✅ **Simplicity**: Strategy pattern is appropriate complexity for the extensibility requirement
- ✅ **Type Safety**: TypeScript strict mode enforces contracts at compile time

**Re-check Required After Phase 1**: Verify that formatter registry design doesn't violate YAGNI principles.

## Project Structure

### Documentation (this feature)

```text
specs/002-formatter-refactor/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── lib/
│   ├── types/
│   │   ├── parser.ts              # Existing ParsedContent types
│   │   └── formatter.ts           # NEW: OutputFormatter, PlatformCapabilities, FormattedOutput
│   ├── formatters/                # NEW: Formatter implementations
│   │   ├── base.ts               # NEW: Abstract OutputFormatter base class
│   │   ├── registry.ts           # NEW: FormatterRegistry singleton
│   │   ├── flomo-formatter.ts    # NEW: Migrated from ios-formatter.ts
│   │   ├── notes-formatter.ts    # NEW: Migrated from ios-formatter.ts
│   │   └── index.ts              # NEW: Public exports
│   ├── utils/
│   │   └── ios-formatter.ts      # DEPRECATED: Mark for removal after migration
│   └── parsers/                  # Existing parser code (unchanged)
├── app/
│   └── api/
│       ├── parse/
│       │   └── route.ts          # MODIFIED: Use FormatterRegistry instead of IOSFormatterImpl
│       └── formatters/           # NEW: Capabilities endpoint
│           └── route.ts          # NEW: GET /api/formatters (list capabilities)
└── test/                         # Existing test directory
    ├── formatters/               # NEW: Formatter tests
    │   ├── flomo-formatter.test.ts
    │   ├── notes-formatter.test.ts
    │   └── registry.test.ts
    └── api/
        └── parse-integration.test.ts  # MODIFIED: Add backward compatibility tests
```

**Structure Decision**: Single web application structure selected (Next.js App Router). New `lib/formatters/` directory isolates formatter logic from existing parsers. Existing `lib/utils/ios-formatter.ts` will be deprecated and replaced by individual formatter classes in `lib/formatters/`.

## Complexity Tracking

> No constitution violations - this section intentionally left empty.

## Phase 0: Research & Technical Decisions

### Research Tasks

1. **Strategy Pattern Implementation in TypeScript**
   - Best practices for abstract classes vs interfaces
   - Type safety for formatter registration
   - Error handling patterns for class-based strategies

2. **Registry Pattern Design**
   - Singleton vs module-level registry
   - Registration timing (startup vs lazy)
   - Thread safety considerations (N/A for Node.js single-threaded model)

3. **Backward Compatibility Strategy**
   - How to maintain identical API responses during refactoring
   - Testing approach for verifying zero breaking changes
   - Migration path from IOSFormatterImpl to FormatterRegistry

4. **Content Truncation Algorithms**
   - Character vs byte counting for URL encoding
   - UTF-8 handling for ellipsis placement
   - Platform-specific length calculation (URL scheme limits)

5. **Fail-Fast Validation Design**
   - What constitutes "capability mismatch"?
   - Validation tests to run at registration time
   - Error message clarity for developers

### Expected Outputs

- `research.md` with decisions on:
  - Abstract class vs interface for OutputFormatter (Decision TBD)
  - Registry implementation pattern (Singleton vs module export)
  - Validation strategy for FR-010 (test fixtures or runtime checks)
  - Truncation algorithm specifics (character boundaries, encoding)

## Phase 1: Design & Contracts

### Data Model

**File**: `data-model.md`

**Core Entities**:

1. **OutputFormatter** (abstract class/interface)
   - `platform: string` - Unique platform identifier
   - `capabilities: PlatformCapabilities` - Declared capabilities
   - `format(content: ParsedContent): FormattedOutput` - Format method

2. **PlatformCapabilities** (interface)
   - `supportsImages: boolean`
   - `supportsDirectCreate: boolean`
   - `maxContentLength?: number` - Optional character limit

3. **FormattedOutput** (interface)
   - `type: 'url_scheme' | 'shortcut_trigger' | 'raw_content'`
   - `value: string` - Primary formatted output
   - `fallback?: string` - Alternative format if primary fails

4. **FormatterRegistry** (class/module)
   - `register(formatter: OutputFormatter): void` - Add formatter (idempotent)
   - `get(platform: string): OutputFormatter | undefined` - Retrieve formatter
   - `listCapabilities(): Record<string, PlatformCapabilities>` - Query all capabilities

**Relationships**:
- Registry maintains `Map<string, OutputFormatter>`
- Each formatter declares its own capabilities
- FormattedOutput is the contract between formatters and API layer

### API Contracts

**File**: `contracts/formatter-api.yaml` (OpenAPI 3.0)

**Endpoints**:

1. `GET /api/formatters` (NEW)
   - Returns: `{ [platform: string]: PlatformCapabilities }`
   - Purpose: Allow clients to discover platform capabilities

2. `POST /api/parse` (MODIFIED - backward compatible)
   - Existing request/response unchanged
   - Internal: Use FormatterRegistry instead of IOSFormatterImpl
   - Contract: Response structure identical to v1.0

**Contract Changes**:
- No breaking changes to `/api/parse`
- New `/api/formatters` endpoint is additive only

### Developer Quickstart

**File**: `quickstart.md`

**Content**:
1. How to create a new formatter (code example)
2. How to register a formatter at startup
3. How to test formatter capabilities
4. How to verify backward compatibility

Example structure:
```markdown
# Adding a New Platform Formatter

## 1. Create Formatter Class
[Code example of NotionFormatter]

## 2. Register Formatter
[Code showing registration in startup file]

## 3. Test Formatter
[Vitest test example]

## 4. Verify Backward Compatibility
[Running existing integration tests]
```

## Phase 2: Task Breakdown

**Note**: Task generation happens via `/speckit.tasks` command (not part of `/speckit.plan`).

Expected task categories:
1. Type definitions and interfaces (Phase 1)
2. Base formatter class implementation (Phase 1)
3. Registry implementation with fail-fast validation (Phase 1)
4. Flomo formatter migration (Phase 2)
5. Notes formatter migration (Phase 2)
6. API route updates (Phase 2)
7. Backward compatibility test suite (Phase 2)
8. Documentation updates (Phase 3)

## Next Steps

1. Execute Phase 0: Generate `research.md`
2. Execute Phase 1: Generate `data-model.md`, `contracts/`, `quickstart.md`
3. Update agent context with new technologies
4. Re-run Constitution Check with design artifacts
5. User runs `/speckit.tasks` to generate implementation tasks

---

## Phase 0 Execution: Research

✅ **Complete** - See [research.md](./research.md)

**Key Decisions Made**:
1. Abstract Class for OutputFormatter (shared implementation + type safety)
2. Result Type for error handling (compile-time safety)
3. Module-level singleton for FormatterRegistry (Next.js-friendly)
4. Startup registration with "first wins" idempotency (HMR-safe)
5. Binary search truncation algorithm (100x performance gain)

---

## Phase 1 Execution: Design & Contracts

✅ **Complete**

**Generated Artifacts**:
1. ✅ [data-model.md](./data-model.md) - Core entity definitions
   - PlatformCapabilities, FormattedOutput, FormatterError
   - BaseOutputFormatter abstract class
   - FormatterRegistry singleton
   - FormatterResult type

2. ✅ [contracts/formatter-api.yaml](./contracts/formatter-api.yaml) - OpenAPI 3.0 specification
   - `GET /api/formatters` - Capability discovery endpoint
   - `POST /api/parse` - Backward-compatible parsing endpoint
   - Complete request/response schemas

3. ✅ [quickstart.md](./quickstart.md) - Developer onboarding guide
   - Step-by-step formatter creation (< 50 lines)
   - Testing strategy
   - Troubleshooting guide

4. ✅ Agent context updated (`CLAUDE.md`)
   - TypeScript 5.x + Next.js 15.5.0 technologies added
   - Stateless formatting system noted

---

## Constitution Re-Check (Post-Design)

**Status**: ✅ No violations

| Principle | Status | Notes |
|-----------|--------|-------|
| Backward Compatibility | ✅ Pass | API contract unchanged, existing tests must pass |
| Testability | ✅ Pass | All entities independently testable, fail-fast validation |
| Simplicity | ✅ Pass | Strategy pattern appropriate for extensibility need |
| Type Safety | ✅ Pass | TypeScript strict mode, Result types enforce error handling |
| YAGNI | ✅ Pass | Registry pattern solves real problem (extensibility), not speculative |

**Design Validation**:
- FormatterRegistry uses simple Map data structure (not over-engineered)
- No premature abstractions (e.g., plugin system, dynamic loading)
- Fail-fast validation catches errors early
- Module-level singleton avoids getInstance() ceremony

---

## Implementation Readiness

**Phase 2 Prerequisites Met**:
- [x] Technical decisions documented
- [x] Data model defined
- [x] API contracts specified
- [x] Developer quickstart available
- [x] Agent context updated
- [x] Constitution check passed

**Ready for**: `/speckit.tasks` to generate implementation task breakdown

---

