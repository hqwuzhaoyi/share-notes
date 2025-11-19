# Suggested Commands

## Development
```bash
# Start dev server (Turbopack, port 4000)
npm run dev

# Type checking
npm run check:types

# Linting
npm run lint
```

## Testing
```bash
# Integration tests (legacy)
npm test

# Unit tests (Vitest)
npm run test:unit

# Test coverage
npm run test:coverage

# Test UI
npm run test:ui

# Platform-specific tests
npm run test:xiaohongshu
```

## Build & Deploy
```bash
# Production build (Turbopack)
npm run build

# Start production server
npm start

# Install dependencies (includes Playwright browser)
npm install
```

## Changesets (Version Management)
```bash
# Create changeset
npm run changeset

# Version bump
npm run changeset:version

# Publish
npm run changeset:publish
```

## macOS System Utilities
```bash
# File operations (use BSD variants)
ls -la              # List files
find . -name "*.ts" # Find files
grep -r "pattern"   # Search content

# Git operations
git status
git diff
git log --oneline -n 10
```

## Common Workflows

### Add New Platform Formatter
1. Create `src/lib/formatters/[platform]-formatter.ts`
2. Extend `BaseOutputFormatter`
3. Register in `src/lib/formatters/index.ts`
4. Test via `curl http://localhost:4000/api/formatters`

### Add New Platform Parser
1. Create `src/lib/parsers/[platform].ts`
2. Extend `BaseParser`
3. Register in `src/lib/parsers/index.ts`
4. Update `src/lib/utils/platform-detector.ts`
5. Add to `PlatformType` union in `src/lib/types/parser.ts`
