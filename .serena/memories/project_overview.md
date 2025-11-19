# iOS Content Parser - Project Overview

## Purpose
Next.js-based intelligent content parsing service designed for iOS shortcuts. Extracts content from major platforms and formats it for iOS apps using URL schemes.

## Supported Platforms (Current)
- Xiaohongshu (小红书)
- Bilibili (B站)
- WeChat Public Accounts (微信公众号)

## Key Features
- Platform-specific parsers with intelligent fallback
- AI enhancement via LangChain + OpenAI/Custom LLMs
- Output formatter refactoring (v2.1) - Strategy pattern with capability discovery
- iOS integration via URL schemes (flomo, Apple Notes)
- Smart caching with TTL

## Tech Stack
- **Framework**: Next.js 15.5.0 (App Router)
- **Language**: TypeScript 5.x (strict mode)
- **Runtime**: React 19.1.0
- **Parsing**: ofetch, Playwright, Cheerio
- **AI**: LangChain, OpenAI, Zod 4.1.8 for validation
- **Testing**: Vitest
- **Package Manager**: pnpm (lockfile present)
- **Deployment**: Vercel

## Architecture Patterns
- **Strategy Pattern**: Platform-specific parsers + formatters
- **Chain of Responsibility**: Parser fallback chain
- **Singleton**: ParserManager, FormatterRegistry
- **Registry Pattern**: FormatterRegistry with capability discovery
