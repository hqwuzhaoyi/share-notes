# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**iOS Content Parser** is a Next.js-based intelligent content parsing service designed for iOS shortcuts. It extracts content from major platforms (Xiaohongshu, Bilibili, WeChat) and formats it for iOS apps like flomo and Notes using URL schemes.

### Key Features
- **Platform-specific parsers**: Xiaohongshu, Bilibili, WeChat public accounts
- **AI Enhancement (v2.0)**: LangChain integration with OpenAI GPT models
- **Intelligent fallback**: Platform parser → Generic parser → AI parser
- **iOS Integration**: Direct output to flomo/Notes via URL schemes
- **Smart caching**: Performance optimization with TTL-based cache

### Version History
- **v1.0**: Basic parsing with ofetch + Playwright fallback
- **v2.0**: AI enhancement with LangChain (summary, title optimization, categorization)
- **v2.1**: Output formatter refactoring - strategy pattern with capability discovery (Feature 002)
- **v3.0**: Parser architecture refactor - content type system + strategy patterns (Feature 003)
  - 5 content types: article, video, image-gallery, book, tweet
  - 95% code reduction (808 lines → 34 lines per parser)
  - YouTube platform support
  - Strategy composition (HtmlFetcher, ContentDetector, ContentExtractor)

## Architecture

### Core Components

```
src/
├── app/api/
│   ├── parse/route.ts             # Main parsing API endpoint
│   └── formatters/route.ts        # NEW (v2.1): Capability discovery endpoint
├── lib/
│   ├── ai/                        # AI Enhancement Layer (v2.0)
│   │   ├── cache.ts              # AI result caching
│   │   ├── config.ts             # AI configuration
│   │   └── langchain-client.ts   # LangChain integration
│   ├── parsers/                  # Parser Layer
│   │   ├── index.ts             # ParserManager (orchestrates all parsers)
│   │   ├── ai-parser.ts         # AI enhancement orchestration
│   │   ├── xiaohongshu.ts       # Platform-specific parser
│   │   ├── bilibili.ts          # Platform-specific parser
│   │   ├── wechat.ts            # Platform-specific parser
│   │   ├── youtube.ts           # NEW (v3.0): YouTube parser
│   │   ├── ofetch-parser.ts     # Generic HTTP parser
│   │   ├── playwright-parser.ts # Dynamic content parser
│   │   ├── base.ts              # Abstract parser interface
│   │   │
│   │   ├── strategies/          # NEW (v3.0): Reusable strategy patterns
│   │   │   ├── html-fetcher.ts  # HtmlFetcher interface + implementations
│   │   │   └── content-detector.ts # ContentDetector interface + implementations
│   │   │
│   │   └── extractors/          # NEW (v3.0): Content extraction strategies
│   │       ├── base.ts          # ContentExtractor<T> generic interface
│   │       ├── youtube-video-extractor.ts
│   │       ├── xhs-video-extractor.ts
│   │       └── bilibili-video-extractor.ts
│   ├── formatters/               # NEW (v2.1): Formatter Layer (Strategy Pattern)
│   │   ├── index.ts             # Formatter registration and exports
│   │   ├── formatter-registry.ts # FormatterRegistry singleton
│   │   ├── flomo-formatter.ts   # Flomo platform formatter
│   │   ├── notes-formatter.ts   # Apple Notes platform formatter
│   │   └── raw-formatter.ts     # Raw JSON formatter
│   ├── types/                    # Type Definitions
│   │   ├── parser.ts            # Core parsing types (legacy)
│   │   ├── content.ts           # NEW (v3.0): Content type system (discriminated unions)
│   │   ├── content-schemas.ts   # NEW (v3.0): Zod runtime validation schemas
│   │   ├── index.ts             # NEW (v3.0): Central type exports
│   │   ├── formatter.ts         # NEW (v2.1): Formatter types and base class
│   │   └── ai.ts                # AI-specific types (v2.0)
│   └── utils/                    # Utility Layer
│       ├── ios-formatter.ts     # DEPRECATED (v2.1): Use lib/formatters instead
│       ├── url-truncate.ts      # NEW (v2.1): Binary search URL truncation
│       ├── platform-detector.ts # URL → platform mapping
│       └── url-validator.ts     # URL validation & sanitization
```

### Design Patterns

1. **Strategy Pattern (Parsers)**: Platform-specific parsers implementing BaseParser interface
2. **Strategy Pattern (Formatters v2.1)**: Platform-specific formatters extending BaseOutputFormatter
3. **Chain of Responsibility**: Fallback parsing strategy (platform → generic → AI)
4. **Decorator Pattern**: AI enhancement wraps base parsing functionality
5. **Singleton Pattern**: ParserManager instance (`parserManager`), FormatterRegistry (`formatterRegistry`)
6. **Registry Pattern (v2.1)**: FormatterRegistry manages all formatter instances with capability discovery

### Parsing Flow

```
URL Request → ParserManager
    ├── URL Validation (URLValidator)
    ├── Platform Detection (PlatformDetector)
    ├── Parser Selection:
    │   ├── Platform Parser (if available)
    │   ├── Generic Parser (fallback)
    │   └── AI Parser (last resort)
    ├── AI Enhancement (optional)
    │   ├── Content Summarization
    │   ├── Title Optimization
    │   └── Content Categorization
    └── Output Formatting (v2.1: FormatterRegistry)
        ├── Get formatter: formatterRegistry.get(platform)
        ├── Format content: formatter.format(parsedContent)
        └── Return: FormattedOutput (url_scheme | shortcut_trigger | raw_content)
```

## Technology Stack

### Core Technologies
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Parsing**: ofetch (HTTP), Playwright (dynamic content), Cheerio (HTML parsing)
- **Deployment**: Vercel

### AI Technologies (v2.0)
- **AI Framework**: LangChain with modern structured output parsing
- **Models**: Support for OpenAI GPT and custom LLMs (currently configured for Alibaba Cloud Qwen Plus)
- **Features**: Smart caching, cost optimization, error retry, structured output with OutputFixingParser

## Environment Configuration

### Required Environment Variables

```bash
# Basic Configuration
NODE_ENV=development|production
ENABLE_AI=true

# Custom LLM Configuration (Primary)
LLM_API_KEY=your_llm_api_key_here
LLM_API_BASE_URL=https://your-llm-endpoint.com/v1
LLM_MODEL=your_model_name

# OpenAI Configuration (Fallback/Alternative)  
OPENAI_API_KEY=your_openai_api_key_here

# Vercel Deployment
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1  # Required for Vercel
```

### Optional Environment Variables

```bash
# AI Advanced Configuration
AI_DEBUG=true                    # Enable AI debugging
AI_LOG_LEVEL=debug              # AI log level
AI_DAILY_COST_LIMIT=10          # Daily cost limit ($)
AI_MAX_COST_PER_REQUEST=0.5     # Max cost per request ($)

# Performance Configuration
API_TIMEOUT=30000               # API timeout (ms)
```

## Development Commands

### Essential Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Run TypeScript type checking
npm run check:types

# Run API tests
npm test
```

### Development Workflow
```bash
# 1. Install dependencies (includes Playwright browser)
npm install

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local with your OpenAI API key

# 3. Start development
npm run dev

# 4. Test API
npm test
```

## API Usage

### Main Endpoint: `/api/parse`

**Basic Parsing**
```json
POST /api/parse
{
  "url": "https://xiaohongshu.com/explore/xxxxx",
  "output_format": "flomo"
}
```

**AI-Enhanced Parsing** 🤖
```json
POST /api/parse
{
  "url": "https://xiaohongshu.com/explore/xxxxx",
  "output_format": "flomo", 
  "ai_enhance": true,
  "ai_options": {
    "enable_summary": true,
    "enable_title_optimization": true,
    "enable_categorization": true,
    "model": "qwen-plus"
  }
}
```

### Supported Platforms
| Platform | URL Pattern | Content Types | Parser Strategy | AI Enhancement |
|----------|-------------|--------------|----------------|----------------|
| 小红书 | `xiaohongshu.com/*` | video, image-gallery | Playwright | ✅ Auto-enabled |
| B站 | `bilibili.com/*`, `b23.tv/*` | video | ofetch + Playwright fallback | ✅ Optional |
| 微信公众号 | `mp.weixin.qq.com/*` | article | ofetch | ✅ Optional |
| YouTube | `youtube.com/*`, `youtu.be/*` | video | ofetch | ✅ Optional |

### Output Formats
- `flomo`: Returns flomo app URL scheme
- `notes`: Returns iOS Notes app URL scheme  
- `raw`: Returns raw parsed data with AI enhancements

## Common Development Tasks

### Adding New Output Formatter (v2.1 - Recommended)

**Quick Start**: See `/specs/002-formatter-refactor/quickstart.md` for detailed guide (< 50 lines of code)

1. **Create formatter class** in `src/lib/formatters/[platform]-formatter.ts`:
```typescript
import { BaseOutputFormatter, type PlatformCapabilities, type FormattedOutput, type FormatterResult, Ok, Err } from '../types/formatter';
import type { ParsedContent } from '../types/parser';
import { truncateForURL } from '../utils/url-truncate';

export class NotionFormatter extends BaseOutputFormatter {
  // Declare capabilities honestly
  readonly capabilities: PlatformCapabilities = {
    supportsImages: true,            // Notion supports images
    supportsDirectCreate: false,      // Requires API/web interface
    maxContentLength: 100000          // Conservative limit
  };

  format(content: ParsedContent): FormatterResult<FormattedOutput> {
    // Validate using inherited method
    const validated = this.validateContent(content);
    if (!validated.success) return validated;

    try {
      // Use inherited utilities: cleanText(), isValidImageUrl()
      const cleanedContent = this.cleanText(content.content);
      const safeContent = truncateForURL(cleanedContent, this.capabilities.maxContentLength!);

      return Ok({
        type: 'url_scheme',
        value: `notion://create?content=${encodeURIComponent(safeContent)}`,
        fallback: `Notion: ${safeContent}`
      });
    } catch (error) {
      return Err('FORMATTING_FAILED', `Notion formatting failed: ${error}`, error);
    }
  }
}
```

2. **Register formatter** in `src/lib/formatters/index.ts`:
```typescript
import { NotionFormatter } from './notion-formatter';

const notionFormatter = new NotionFormatter();
formatterRegistry.register('notion', notionFormatter);
```

3. **Query capabilities** via API:
```bash
curl http://localhost:4000/api/formatters
# Returns: {"notion": {"supportsImages": true, ...}}
```

**Key Benefits**:
- Zero modifications to existing code (extensibility validated)
- Fail-fast validation at registration time
- Type-safe error handling with `FormatterResult<T>`
- Shared utilities: `validateContent()`, `cleanText()`, `isValidImageUrl()`
- Binary search URL truncation (100x faster than linear)

### Adding New Platform Parser (v3.0 - Recommended)

**Quick Start**: See `/specs/003-parser-architecture-refactor/quickstart.md` for detailed guide (< 100 lines of code)

**New parsers use strategy composition for 95% code reduction:**

1. **Create content detector** (10 lines):
```typescript
// src/lib/parsers/strategies/content-detector.ts
export class YouTubeContentDetector implements ContentDetector {
  detect(url: string, html: string): ContentType {
    return 'video'; // YouTube is always video content
  }
}
```

2. **Create content extractor** (40 lines):
```typescript
// src/lib/parsers/extractors/youtube-video-extractor.ts
export class YouTubeVideoExtractor implements ContentExtractor<VideoContent> {
  extract(html: string, url: string): VideoContent {
    const $ = cheerio.load(html);

    return {
      type: 'video',
      title: $('meta[property="og:title"]').attr('content') || 'YouTube Video',
      videoUrl: url,
      cover: $('meta[property="og:image"]').attr('content'),
      duration: this.extractDuration($),
      description: $('meta[property="og:description"]').attr('content') || '',
      platform: 'youtube',
      originalUrl: url,
      metadata: { videoId: this.extractVideoId(url) }
    };
  }
  // ... helper methods
}
```

3. **Create platform parser** (30 lines):
```typescript
// src/lib/parsers/youtube.ts
export class YouTubeParser extends BaseParser {
  platform = 'youtube' as const;
  supportedContentTypes = ['video'] as const;

  private htmlFetcher = new OfetchHtmlFetcher();
  private extractor = new YouTubeVideoExtractor();

  canParse(url: string): boolean {
    return /youtube\.com|youtu\.be/i.test(url);
  }

  async parse(url: string, options?: ParserOptions): Promise<VideoContent> {
    const html = options?.preloadedHtml || await this.htmlFetcher.fetch(url, options);
    return this.extractor.extract(html, url);
  }
}
```

4. **Register parser** (5 lines):
```typescript
// src/lib/parsers/index.ts
import { YouTubeParser } from './youtube';

constructor() {
  this.parsers.set('youtube', new YouTubeParser());
}
```

5. **Update types** (1 line):
```typescript
// src/lib/types/parser.ts
export type PlatformType = ... | 'youtube' | ...;
```

**Total: ~86 lines (vs 808 lines in old architecture)**

**Key Benefits**:
- Reusable HTML fetchers (Ofetch, Playwright)
- Type-safe content extraction with generics
- Shared detection logic across platforms
- Zero modifications to existing parsers

### Modifying AI Enhancement

**Add new AI feature** in `src/lib/ai/langchain-client.ts`:
```typescript
async newAIFeature(content: string, options?: AIOptions): Promise<string> {
  const prompt = `Your AI prompt here: ${content}`;
  const result = await this.llm.invoke(prompt);
  return result.content as string;
}
```

**Update AI parser** (`src/lib/parsers/ai-parser.ts`):
```typescript
async enhance(content: ParsedContent, aiOptions?: AIOptions): Promise<AIEnhancedContent> {
  // Add new AI feature calls
  const newFeature = await this.langchainClient.newAIFeature(content.content, aiOptions);
  
  return {
    ...content,
    newFeature, // Add to result
    aiEnhanced: true
  };
}
```

### iOS URL Scheme Formatting

**Modify iOS formatter** (`src/lib/utils/ios-formatter.ts`):
```typescript
formatFlomo(content: ParsedContent | AIEnhancedContent): string {
  const isAI = 'aiEnhanced' in content && content.aiEnhanced;
  
  if (isAI) {
    // Handle AI-enhanced content with summary, tags, etc.
    const summary = content.summary ? `\n摘要: ${content.summary}` : '';
    const tags = content.tags ? `\n#${content.tags.join(' #')}` : '';
    
    return `flomo://create?content=${encodeURIComponent(
      `${content.optimizedTitle || content.title}${summary}${tags}`
    )}`;
  }
  
  // Handle regular content
  return `flomo://create?content=${encodeURIComponent(content.title)}`;
}
```

## Testing

### Test Structure
- `test/test-api.js`: Comprehensive API testing with AI functionality
- Tests both basic and AI-enhanced parsing
- Error handling validation
- Cost monitoring simulation

### Running Tests
```bash
# Test with local development server
npm run dev  # Terminal 1
npm test     # Terminal 2

# Test with deployed API  
API_BASE=https://your-domain.vercel.app npm test
```

### Test Cases
- ✅ Platform detection accuracy
- ✅ Parser fallback mechanism  
- ✅ AI enhancement functionality
- ✅ Error handling and validation
- ✅ iOS URL scheme generation
- ✅ Caching behavior

## Troubleshooting

### Common Issues

**AI functionality not working**
- Check `LLM_API_KEY` and `LLM_API_BASE_URL` environment variables
- Verify API key has sufficient credits/quota
- Check network connectivity to your LLM endpoint
- For OpenAI fallback: Check `OPENAI_API_KEY` environment variable

**Playwright parser fails**
- Ensure `npx playwright install chromium` was run (runs automatically via `postinstall` script)
- For Vercel: Set `PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1`
- Check platform's anti-bot measures
- Browser context/page may be closed - check for proper error handling

**Parser returns empty content**
- Platform may have changed HTML structure
- Check browser developer tools for actual HTML
- Update parser selectors accordingly

### Debug Mode
```bash
# Enable detailed logging
AI_DEBUG=true npm run dev
```

### Performance Issues
- Check AI cache hit rates via `/api/parse` GET endpoint
- Consider using faster AI models (`gpt-3.5-turbo`)
- Reduce enabled AI features for speed

## Deployment

### Vercel Deployment
1. Fork repository to your GitHub
2. Import project in Vercel dashboard  
3. Set environment variables in Vercel project settings
4. Deploy automatically triggers

### Required Vercel Environment Variables
```bash
NODE_ENV=production
PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1  # Important!
ENABLE_AI=true                     # Enable AI

# Either custom LLM or OpenAI
LLM_API_KEY=your_llm_key_here      # For custom LLM
LLM_API_BASE_URL=your_llm_url_here
LLM_MODEL=your_model_name
# OR
OPENAI_API_KEY=your_openai_key_here # For OpenAI
```

## File Modification Guidelines

### ⚠️ Critical Files (Edit with Caution)
- `src/lib/parsers/index.ts`: Core parsing orchestration
- `src/app/api/parse/route.ts`: Main API endpoint
- `src/lib/types/parser.ts`: Core type definitions

### 🟡 Platform-Specific Files (Safe to Modify)
- `src/lib/parsers/[platform].ts`: Individual platform parsers
- `src/lib/utils/platform-detector.ts`: URL platform detection

### 🟢 Safe to Modify
- `src/lib/ai/*`: AI enhancement features
- `src/lib/utils/ios-formatter.ts`: iOS URL formatting
- `test/*`: Test files
- Documentation files (`*.md`)

## Code Style

### TypeScript Conventions
- Use strict typing, avoid `any`
- Prefer interfaces over types for objects
- Use async/await over Promise chains
- Error handling with try-catch blocks

### AI Code Patterns
```typescript
// Modern LangChain structured output pattern
import { StructuredOutputParser } from '@langchain/core/output_parsers';
import { OutputFixingParser } from 'langchain/output_parsers';
import { RunnableSequence } from '@langchain/core/runnables';

async aiFeature(input: string, options?: AIOptions): Promise<AITaskResult<OutputType>> {
  try {
    const outputParser = StructuredOutputParser.fromZodSchema(YourSchema);
    const fixingParser = OutputFixingParser.fromLLM(this.llm, outputParser);
    
    const chain = RunnableSequence.from([
      promptTemplate,
      this.llm,
      fixingParser,
    ]).withRetry({
      stopAfterAttempt: 2,
      onFailedAttempt: (err) => console.warn(`AI attempt failed: ${err.message}`)
    });
    
    const result = await chain.invoke({ input });
    return {
      success: true,
      data: result,
      model: this.model
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      model: this.model
    };
  }
}
```

### Parser Patterns
```typescript
// Parser implementation pattern  
export class PlatformParser extends BaseParser {
  platform: PlatformType = 'platform';
  
  canParse(url: string): boolean {
    return URLValidator.isValid(url) && url.includes('platform.com');
  }
  
  async parse(url: string, options?: ParserOptions): Promise<ParsedContent> {
    const cleanUrl = URLValidator.sanitizeURL(url);
    // Implementation
    return {
      title, content, images, author, publishedAt,
      platform: this.platform,
      originalUrl: cleanUrl
    };
  }
}
```

## Security Considerations

- **URL Validation**: All URLs validated and sanitized before processing
- **SSRF Protection**: URL validator blocks private/internal IPs  
- **Rate Limiting**: Implement rate limiting for production use
- **API Key Security**: Never expose OpenAI API keys in client code
- **CORS**: Configured for cross-origin requests from iOS shortcuts

## Performance Optimizations

- **Intelligent Caching**: AI results cached 24hrs, HTTP responses 5min
- **Model Selection**: Automatic model selection based on content complexity
- **Batch Processing**: AI supports batch enhancement for multiple contents
- **Smart Routing**: Complex platforms auto-enable AI for better results

## Cost Optimization (AI Features)

- **Caching**: Aggressive caching prevents duplicate AI calls
- **Model Tiers**: 
  - `qwen-plus`: Current default - cost-effective and high quality (~$0.0004-0.0012/1K tokens)
  - `gpt-3.5-turbo`: Fast & economical (~$0.001-0.003/request)
  - `gpt-4o-mini`: Balanced performance (~$0.002-0.005/request)  
  - `gpt-4o`: Premium quality (~$0.01-0.03/request)
- **Selective Features**: Enable only needed AI features
- **Content Length**: Summarize very long content before AI processing

---

## Quick Reference

**Start Development**: `npm run dev`  
**Test API**: `npm test`  
**Deploy**: Push to main branch (Vercel auto-deploys)  
**Debug AI**: Set `AI_DEBUG=true` in environment  
**Check AI Cache**: GET `/api/parse` endpoint  

**Key Files to Know**:
- `src/app/api/parse/route.ts` - Main API logic
- `src/app/api/formatters/route.ts` - NEW (v2.1): Capability discovery
- `src/lib/parsers/index.ts` - Parser orchestration
- `src/lib/formatters/index.ts` - NEW (v2.1): Formatter registration
- `src/lib/ai/langchain-client.ts` - AI functionality
- `test/test-api.js` - Comprehensive testing
- `/specs/002-formatter-refactor/quickstart.md` - NEW (v2.1): Adding formatters guide

This project successfully combines traditional web scraping with modern AI enhancement to create a powerful content parsing service optimized for iOS integration.

## Active Technologies
- TypeScript 5.x with React 19.1.0 and Next.js 15.5.0 + Next.js (App Router), React, Tailwind CSS 4 (001-task-visualization)
- TypeScript 5.x with strict mode + Next.js 15.5.0, React 19.1.0, Zod 4.1.8 (002-formatter-refactor)
- N/A (stateless formatting system) (002-formatter-refactor)
- TypeScript 5.x (existing project standard) + Next.js 15.5.0, React 19.1.0, Zod 4.1.8 (for validation), Cheerio 1.1.2 (HTML parsing), Playwright 1.55.0 (browser automation), ofetch 1.4.1 (HTTP client) (003-parser-architecture-refactor)
- N/A (stateless parsing system) (003-parser-architecture-refactor)

## Recent Changes
- 001-task-visualization: Added TypeScript 5.x with React 19.1.0 and Next.js 15.5.0 + Next.js (App Router), React, Tailwind CSS 4
