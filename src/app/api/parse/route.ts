import { NextRequest, NextResponse } from 'next/server';
import { parserManager } from '@/lib/parsers';
import { IOSFormatterImpl } from '@/lib/utils/ios-formatter';
import { ParseRequest, ParseResult, OutputFormat } from '@/lib/types/parser';
import { AIOptions, AIModel } from '@/lib/types/ai';
import { ErrorHandler } from '@/lib/utils/error-handler';
import { getEnvironmentType } from '@/lib/utils/environment-detector';

const iosFormatter = new IOSFormatterImpl();

export async function POST(request: NextRequest) {
  try {
    // 解析请求体
    const body: ParseRequest = await request.json();
    const { url, output_format = 'flomo', options, ai_enhance = false, ai_options } = body;

    // 验证必需参数
    if (!url || typeof url !== 'string') {
      return NextResponse.json({
        success: false,
        error: 'URL is required and must be a string',
        parsed_at: new Date()
      } as ParseResult, { status: 400 });
    }

    // 验证输出格式
    const validFormats: OutputFormat[] = ['flomo', 'notes', 'raw'];
    if (output_format && !validFormats.includes(output_format)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid output_format. Must be one of: flomo, notes, raw',
        parsed_at: new Date()
      } as ParseResult, { status: 400 });
    }

    // 使用增强的错误处理进行解析
    const parsedContent = await ErrorHandler.withRetry(
      async () => {
        if (ai_enhance && parserManager.isAIAvailable()) {
          // 构建AI选项
          const aiOpts: AIOptions = {
            enableSummary: ai_options?.enable_summary ?? true,
            enableTitleOptimization: ai_options?.enable_title_optimization ?? true,
            enableCategorization: ai_options?.enable_categorization ?? true,
            model: ai_options?.model as AIModel,
          };
          
          try {
            // 尝试智能解析（可能包含AI增强）
            const smartResult = await parserManager.smartParse(url, options);
            
            // 如果智能解析没有使用AI，手动增强
            if (!('aiEnhanced' in smartResult) || !smartResult.aiEnhanced) {
              return await parserManager.parseWithAI(url, options, aiOpts);
            }
            return smartResult;
          } catch (aiError) {
            console.warn('AI parsing failed, falling back to traditional parsing:', aiError);
            return await parserManager.parse(url, options);
          }
        } else {
          // 传统解析
          return await parserManager.parse(url, options);
        }
      },
      {
        url,
        parser: 'api-endpoint',
        environment: getEnvironmentType()
      }
    );

    // 格式化输出
    let ios_url: string | undefined;
    if (output_format === 'flomo') {
      ios_url = iosFormatter.formatFlomo(parsedContent);
    } else if (output_format === 'notes') {
      ios_url = iosFormatter.formatNotes(parsedContent);
    }

    // 返回结果
    const result: ParseResult = {
      success: true,
      data: parsedContent,
      ios_url,
      parsed_at: new Date()
    };

    return NextResponse.json(result, {
      status: 200,
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=600', // 缓存5分钟
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    // 使用统一错误处理
    const processedError = ErrorHandler.processError(error as Error, {
      url: (await request.json().catch(() => ({})))?.url,
      parser: 'api-endpoint',
      environment: getEnvironmentType()
    });
    
    // 记录错误用于监控
    ErrorHandler.logError(processedError);
    
    console.error('Parse API Error:', processedError.userMessage);

    const result: ParseResult = {
      success: false,
      error: processedError.userMessage,
      parsed_at: new Date()
    };

    return NextResponse.json(result, { 
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}

// 处理OPTIONS请求（CORS预检）
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

// GET请求返回API信息
export async function GET() {
  const apiInfo = {
    name: 'iOS Content Parser API',
    version: '2.0.0',
    description: '为iOS快捷指令设计的智能内容解析服务（支持AI增强）',
    supported_platforms: parserManager.getSupportedPlatforms(),
    ai_available: parserManager.isAIAvailable(),
    ai_models: parserManager.isAIAvailable() ? parserManager.getAIModels() : [],
    endpoints: {
      parse: {
        method: 'POST',
        path: '/api/parse',
        description: '解析URL内容并返回格式化结果',
        parameters: {
          url: 'string (required) - 要解析的URL',
          output_format: 'string (optional) - 输出格式: flomo, notes, raw',
          options: 'object (optional) - 解析选项',
          ai_enhance: 'boolean (optional) - 是否启用AI增强功能',
          ai_options: {
            enable_summary: 'boolean (optional) - 生成内容摘要',
            enable_title_optimization: 'boolean (optional) - 优化标题',
            enable_categorization: 'boolean (optional) - 内容分类',
            model: 'string (optional) - AI模型选择'
          }
        }
      }
    },
    examples: {
      basic_request: {
        url: 'https://xiaohongshu.com/explore/xxxxx',
        output_format: 'flomo'
      },
      ai_enhanced_request: {
        url: 'https://xiaohongshu.com/explore/xxxxx',
        output_format: 'flomo',
        ai_enhance: true,
        ai_options: {
          enable_summary: true,
          enable_title_optimization: true,
          enable_categorization: true,
          model: 'gpt-3.5-turbo'
        }
      },
      ai_enhanced_response: {
        success: true,
        data: {
          title: '内容标题',
          content: '正文内容',
          images: ['图片URL1', '图片URL2'],
          author: '作者信息',
          platform: 'xiaohongshu',
          originalUrl: 'https://xiaohongshu.com/explore/xxxxx',
          // AI增强字段
          summary: 'AI生成的内容摘要',
          optimizedTitle: 'AI优化的标题',
          categories: ['生活方式', '美食'],
          tags: ['美食推荐', '探店', '网红餐厅'],
          contentType: 'review',
          aiEnhanced: true
        },
        ios_url: 'flomo://create?content=...',
        parsed_at: '2024-01-01T00:00:00.000Z'
      }
    }
  };

  return NextResponse.json(apiInfo, {
    headers: {
      'Cache-Control': 'public, max-age=3600', // 缓存1小时
      'Content-Type': 'application/json',
    },
  });
}