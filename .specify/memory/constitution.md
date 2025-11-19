# iOS Content Parser Constitution

## Core Principles

### I. Backward Compatibility (NON-NEGOTIABLE)

**"Never break userspace"** - Linus Torvalds

- **MUST** maintain full backward compatibility with existing API consumers
- **MUST** support legacy `ParsedContent` format for minimum 6 months
- **MUST NOT** modify existing API endpoint contracts without deprecation notice
- Breaking changes require major version bump and migration guide
- All integration tests from previous version must pass unchanged

**Rationale**: iOS shortcuts and external integrations depend on stable API contracts. Breaking changes cause immediate user-facing failures.

### II. Strategy Pattern Over Inheritance

**"Composition over inheritance"** - Gang of Four

- **MUST** use strategy pattern for extensible components (fetchers, detectors, extractors)
- **MUST** implement interfaces rather than extend abstract classes (except BaseParser, BaseFormatter)
- New platform parsers **MUST** compose strategies rather than duplicate code
- Each strategy **MUST** be independently testable and replaceable

**Rationale**: 808-line monster classes prove inheritance creates unmaintainable code. Strategy pattern enables <100 line parsers.

### III. Type Safety First

**TypeScript discriminated unions + Zod runtime validation**

- **MUST** use TypeScript discriminated unions with `type` field discriminators
- **MUST** validate external data (API requests, HTML parsing) with Zod schemas
- **MUST NOT** use `any` type except for platform-specific metadata objects
- Type guards **MUST** be provided for all discriminated union branches

**Rationale**: Parser-formatter boundary crosses trust boundaries. Runtime validation prevents silent data corruption.

### IV. Code Reduction Mandate

**"If you need more than 3 levels of indentation, you're screwed"** - Linus Torvalds

- New platform parser implementations **MUST** be under 150 non-comment, non-blank lines of code (excluding extractors), measured by `cloc` tool
- Parser methods **SHOULD** have max 3 levels of nesting
- Shared logic **MUST** be extracted to strategies or utilities
- Code duplication across parsers **MUST** be under 30%

**Rationale**: Current parsers average 800 lines. Code reduction is a measurable architectural success criterion.

### V. Test-Driven Development

**Red-Green-Refactor cycle enforced**

- Tests **MUST** be written before implementation for new features
- Integration tests **MUST** pass before merging architectural refactors
- New content types **MUST** have unit tests for type guards and Zod schemas
- Strategy implementations **MUST** have isolated unit tests

**Rationale**: 63-task refactor requires safety net. TDD prevents regression during large-scale changes.

## Technical Constraints

### Platform Support

- **Primary deployment**: Vercel Serverless (Next.js App Router)
- **Browser automation**: Playwright (local/Docker) OR ofetch (serverless)
- **HTML parsing**: Cheerio (DOM traversal)
- **Validation**: Zod 4.1.8+ for runtime schemas

### Performance Standards

- **Parse latency**: <5 seconds p95 for any platform
- **Concurrent requests**: Must support Vercel autoscaling (stateless parsers)
- **Memory**: <512MB per serverless function invocation

### Content Type Coverage

- **Core types**: article, video, image-gallery, book, tweet (5 minimum)
- **Extensibility**: Adding new content type **MUST NOT** modify existing types
- **Metadata**: Platform-specific data stored in `metadata?: Record<string, any>` field

## Development Workflow

### Feature Specification Process

1. **MUST** use `/speckit.specify` for new features (generates spec.md)
2. **MUST** use `/speckit.plan` to create design artifacts (research.md, data-model.md, contracts/)
3. **MUST** use `/speckit.tasks` to generate dependency-ordered task breakdown
4. **SHOULD** use `/speckit.analyze` to validate cross-artifact consistency before implementation

### Implementation Gates

- **Phase 0 (Research)**: All technical decisions documented with rationale
- **Phase 1 (Design)**: Data model + contracts complete, quickstart validated
- **Phase 2 (Implementation)**: Tests written → Tests fail → Then implement
- **Phase 3 (Integration)**: All existing tests pass + new tests pass

### Quality Checklist

Before merging architectural refactors:

- [ ] Backward compatibility verified (existing API tests pass)
- [ ] New content types have Zod schemas + type guards
- [ ] Parser LOC reduced to <150 non-comment, non-blank lines (measured by `cloc`, excluding extractors)
- [ ] No `any` types except documented metadata objects
- [ ] CLAUDE.md updated with new architecture patterns

## Governance

### Constitutional Authority

- This constitution **supersedes** individual developer preferences
- Violations in code review **MUST** be addressed before merge
- Amendments require:
  1. Documentation of rationale
  2. Update to affected specs/plans
  3. Migration guide if breaking existing practices

### Complexity Budget

- New abstractions **MUST** be justified against code reduction metric
- "Clever" code **MUST** be replaced with "obvious" code
- When in doubt, choose simplicity over flexibility

### Agent Context

- Use `CLAUDE.md` for runtime development guidance (architecture, patterns, commands)
- Use `CLAUDE.local.md` for Linus-style code review philosophy
- This constitution provides **governance constraints** only

---

**Version**: 1.0.0
**Ratified**: 2025-11-19
**Last Amended**: 2025-11-19
**Scope**: Parser Architecture Refactor (Feature 003) and subsequent parser/formatter development
