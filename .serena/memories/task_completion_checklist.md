# Task Completion Checklist

## Before Committing

### 1. Type Checking
```bash
npm run check:types
```
**Must pass** - No TypeScript errors allowed

### 2. Linting
```bash
npm run lint
```
**Should pass** - Warnings OK, errors require fixing

### 3. Testing
```bash
# Run affected tests
npm run test:unit        # For code changes
npm test                 # For API changes
```
**Must pass** - All tests green

### 4. Build Verification
```bash
npm run build
```
**Must succeed** - Vercel deployment readiness

## Code Quality Checks

### For Parser Changes
- [ ] `canParse()` correctly identifies URLs
- [ ] `parse()` returns all required fields
- [ ] Platform registered in `ParserManager`
- [ ] `PlatformType` updated in types
- [ ] Platform detector updated
- [ ] Integration test added

### For Formatter Changes
- [ ] Capabilities honestly declared
- [ ] `format()` handles all content types
- [ ] Formatter registered in `FormatterRegistry`
- [ ] URL truncation tested for long content
- [ ] Error handling with `FormatterResult`
- [ ] Unit test added

### For AI Changes
- [ ] Environment variables documented
- [ ] Caching behavior tested
- [ ] Cost estimation reasonable
- [ ] Fallback mechanism works

## Documentation Updates
- [ ] Update `CLAUDE.md` if architecture changes
- [ ] Update spec docs if requirements change
- [ ] Add JSDoc comments for public APIs

## Git Workflow
```bash
# Check status
git status

# Stage changes
git add [files]

# Commit with meaningful message
git commit -m "feat: add [feature]" # or fix: / refactor: / docs:

# Push to feature branch
git push origin [branch-name]
```

## Deployment Checklist (Vercel)
- [ ] Environment variables set in Vercel dashboard
- [ ] `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1` configured
- [ ] Build succeeds locally
- [ ] No sensitive data in code
