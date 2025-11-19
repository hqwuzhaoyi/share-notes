# Code Style & Conventions

## TypeScript Configuration
- **Strict Mode**: Enabled
- **Target**: ES2017
- **Module System**: ESNext (bundler resolution)
- **Path Aliases**: `@/*` → `./src/*`
- **JSX**: preserve (Next.js)

## Linting Rules (ESLint 9 + Next.js)
- **Base**: `next/core-web-vitals`, `next/typescript`
- **@typescript-eslint/no-explicit-any**: `warn` (pragmatic approach)
- **@typescript-eslint/no-unused-vars**: `warn` with `_` prefix ignore
- **Test files ignored**: `src/test/**`, `test/**`

## Code Standards
1. **Use strict typing** - Avoid `any` when possible
2. **Prefer interfaces over types** for object shapes
3. **async/await over Promise chains**
4. **Try-catch for error handling**
5. **Result pattern** for formatters: `Ok()` / `Err()`

## Naming Conventions
- **Files**: kebab-case (`flomo-formatter.ts`)
- **Classes**: PascalCase (`FormatterRegistry`)
- **Singletons**: camelCase (`formatterRegistry`, `parserManager`)
- **Types/Interfaces**: PascalCase with descriptive suffixes (`PlatformCapabilities`)

## Design Pattern Usage
- **Strategy Pattern**: Extend `BaseParser` or `BaseOutputFormatter`
- **Registry Pattern**: Use `FormatterRegistry.register()` for registration
- **Singleton Pattern**: Export singleton instances (`parserManager`, `formatterRegistry`)

## Error Handling
- Use `FormatterResult<T>` with `Ok()` / `Err()` for formatters
- Wrap errors in domain-specific types (`FormatterError`)
- Fail-fast validation at registration time
