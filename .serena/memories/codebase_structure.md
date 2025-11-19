# Codebase Structure

## Main Directories

```
src/
├── app/
│   ├── api/
│   │   ├── parse/route.ts          # Main parsing API endpoint
│   │   ├── formatters/route.ts     # Capability discovery (v2.1)
│   │   └── tasks/                  # Task visualization (Feature 001)
│   └── page.tsx                    # Main UI
│
├── lib/
│   ├── parsers/                    # Parser implementations
│   │   ├── index.ts               # ParserManager (singleton)
│   │   ├── base.ts                # BaseParser interface
│   │   ├── xiaohongshu.ts         # Platform parser
│   │   ├── bilibili.ts            # Platform parser
│   │   ├── wechat.ts              # Platform parser
│   │   ├── ai-parser.ts           # AI enhancement
│   │   ├── ofetch-parser.ts       # Generic HTTP parser
│   │   └── playwright-parser.ts   # Dynamic content parser
│   │
│   ├── formatters/                 # Output formatters (v2.1)
│   │   ├── index.ts               # Formatter registration
│   │   ├── formatter-registry.ts  # FormatterRegistry singleton
│   │   ├── flomo-formatter.ts     # Flomo platform
│   │   ├── notes-formatter.ts     # Apple Notes platform
│   │   └── raw-formatter.ts       # Raw JSON output
│   │
│   ├── types/                      # Type definitions
│   │   ├── parser.ts              # Core parsing types
│   │   ├── formatter.ts           # Formatter types (v2.1)
│   │   └── ai.ts                  # AI types
│   │
│   ├── utils/                      # Utilities
│   │   ├── platform-detector.ts   # URL → platform mapping
│   │   ├── url-validator.ts       # URL validation
│   │   ├── url-truncate.ts        # Binary search truncation
│   │   └── ios-formatter.ts       # DEPRECATED (use formatters/)
│   │
│   ├── ai/                         # AI layer
│   │   ├── langchain-client.ts    # LangChain integration
│   │   ├── config.ts              # AI configuration
│   │   └── cache.ts               # AI caching
│   │
│   └── storage/                    # Data persistence
│       └── task-store.ts          # Task storage
│
├── components/                     # React components
│   └── tasks/                     # Task UI (Feature 001)
│
└── test/                          # Test suites
    ├── parsers/
    ├── formatters/
    ├── utils/
    └── api/
```

## Key Files
- `src/app/api/parse/route.ts` - Main API logic
- `src/lib/parsers/index.ts` - Parser orchestration
- `src/lib/formatters/formatter-registry.ts` - Formatter registry
- `src/lib/types/formatter.ts` - BaseOutputFormatter class
