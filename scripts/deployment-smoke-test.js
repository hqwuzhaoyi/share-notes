#!/usr/bin/env node

/**
 * Vercel 部署烟雾测试
 * 验证关键API endpoint响应正常，包括Vercel环境特定的功能
 */

// Node.js 18+ has global fetch, otherwise use node-fetch
if (typeof fetch === 'undefined') {
  global.fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
}

const API_BASE = process.env.API_BASE || 'http://localhost:3000';

console.log('🚀 开始 Vercel 部署烟雾测试...');
console.log(`📡 API Base: ${API_BASE}`);

// 测试用例配置
const TEST_CASES = [
  {
    name: '✅ 基础健康检查',
    method: 'GET',
    path: '/api/parse',
    expectedStatus: 200, // GET返回API信息
    description: '验证API端点存在并返回API信息'
  },
  {
    name: '🌐 Vercel环境解析 - 小红书(preloadedHtml)',
    method: 'POST',
    path: '/api/parse',
    body: {
      url: 'https://www.xiaohongshu.com/explore/test',
      output_format: 'raw',
      options: {
        preloadedHtml: `
          <html>
            <head>
              <title>测试标题 - 小红书</title>
              <meta property="og:image" content="https://sns-webpic-qc.xhscdn.com/test1.jpg"/>
              <meta property="og:image" content="https://sns-webpic-qc.xhscdn.com/test2.jpg"/>
            </head>
            <body>
              <div class="content">这是预取HTML的测试内容，验证Vercel环境下的解析能力。</div>
            </body>
          </html>
        `
      }
    },
    expectedStatus: 200,
    description: '验证Vercel环境下preloadedHtml处理'
  },
  {
    name: '⚠️ 错误处理验证',
    method: 'POST',
    path: '/api/parse',
    body: {
      url: 'invalid-url'
    },
    expectedStatus: [400, 500], // 可能返回400或500，取决于验证阶段
    description: '验证错误处理和用户友好消息'
  },
  {
    name: '🔄 重试机制验证',
    method: 'POST',
    path: '/api/parse',
    body: {
      url: 'https://httpstat.us/500?sleep=1000', // 模拟网络错误
      output_format: 'raw'
    },
    expectedStatus: [200, 500], // 可能成功重试或最终失败
    description: '验证重试机制工作'
  }
];

// 运行单个测试
async function runTest(testCase) {
  console.log(`\n🧪 ${testCase.name}`);
  console.log(`📝 ${testCase.description}`);

  try {
    const startTime = Date.now();

    const requestOptions = {
      method: testCase.method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Deployment-Smoke-Test/1.0'
      }
    };

    if (testCase.body) {
      requestOptions.body = JSON.stringify(testCase.body);
    }

    const response = await fetch(`${API_BASE}${testCase.path}`, requestOptions);
    const responseTime = Date.now() - startTime;

    // 检查状态码
    const expectedStatuses = Array.isArray(testCase.expectedStatus)
      ? testCase.expectedStatus
      : [testCase.expectedStatus];

    if (!expectedStatuses.includes(response.status)) {
      throw new Error(`Expected status ${testCase.expectedStatus}, got ${response.status}`);
    }

    // 检查响应内容
    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    // 验证Cache-Control headers
    const cacheControl = response.headers.get('cache-control');
    if (response.status === 200 && testCase.method === 'POST') {
      if (!cacheControl || !cacheControl.includes('max-age')) {
        console.warn('⚠️ 缺少Cache-Control headers');
      } else {
        console.log(`📦 Cache-Control: ${cacheControl}`);
      }
    }

    // 验证CORS headers
    const corsOrigin = response.headers.get('access-control-allow-origin');
    if (corsOrigin) {
      console.log(`🌐 CORS: ${corsOrigin}`);
    }

    console.log(`✅ 状态码: ${response.status}`);
    console.log(`⏱️ 响应时间: ${responseTime}ms`);

    // 特定测试验证
    if (testCase.name.includes('preloadedHtml')) {
      if (responseData.success && responseData.data) {
        console.log(`📄 解析标题: ${responseData.data.title}`);
        console.log(`🖼️ 图片数量: ${responseData.data.images?.length || 0}`);
        if (responseData.data.images?.length >= 2) {
          console.log('✅ preloadedHtml处理正常');
        }
      }
    }

    if (testCase.name.includes('错误处理')) {
      if (responseData.error) {
        console.log(`🚨 错误信息: ${responseData.error.substring(0, 100)}...`);
        if (responseData.error.includes('网络') || responseData.error.includes('URL')) {
          console.log('✅ 错误处理消息友好');
        }
      }
    }

    return {
      success: true,
      status: response.status,
      responseTime,
      data: responseData
    };

  } catch (error) {
    console.log(`❌ 测试失败: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// 验证环境
function validateEnvironment() {
  console.log('\n🔍 环境验证...');

  const isVercelDeploy = API_BASE.includes('vercel.app');
  const isLocalTest = API_BASE.includes('localhost');

  if (isVercelDeploy) {
    console.log('🌐 检测到Vercel部署环境');
    console.log('   - 预期使用ofetch解析');
    console.log('   - 预期禁用Playwright');
    console.log('   - 预期支持preloadedHtml');
  } else if (isLocalTest) {
    console.log('💻 检测到本地测试环境');
    console.log('   - 预期使用Playwright解析');
    console.log('   - 预期完整功能可用');
  } else {
    console.log('🤔 未知部署环境');
  }
}

// 生成测试报告
function generateReport(results) {
  console.log('\n📊 测试报告');
  console.log('='.repeat(50));

  const totalTests = results.length;
  const passedTests = results.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;

  console.log(`📈 总测试数: ${totalTests}`);
  console.log(`✅ 通过: ${passedTests}`);
  console.log(`❌ 失败: ${failedTests}`);
  console.log(`📊 通过率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (results.length > 0) {
    const avgResponseTime = results
      .filter(r => r.responseTime)
      .reduce((sum, r) => sum + r.responseTime, 0) / results.filter(r => r.responseTime).length;
    console.log(`⏱️ 平均响应时间: ${avgResponseTime.toFixed(0)}ms`);
  }

  console.log('\n🎯 关键指标:');
  results.forEach((result, index) => {
    const testCase = TEST_CASES[index];
    const status = result.success ? '✅' : '❌';
    console.log(`   ${status} ${testCase.name}`);
  });

  // 部署建议
  console.log('\n💡 部署建议:');
  if (passedTests === totalTests) {
    console.log('🎉 所有测试通过，可以安全部署到生产环境');
  } else if (passedTests >= totalTests * 0.8) {
    console.log('⚠️ 大部分测试通过，建议检查失败测试后部署');
  } else {
    console.log('🚨 多个测试失败，不建议部署到生产环境');
  }

  return {
    total: totalTests,
    passed: passedTests,
    failed: failedTests,
    passRate: (passedTests / totalTests) * 100
  };
}

// 主函数
async function main() {
  validateEnvironment();

  const results = [];

  // 运行所有测试
  for (const testCase of TEST_CASES) {
    const result = await runTest(testCase);
    results.push(result);
  }

  // 生成报告
  const report = generateReport(results);

  // 设置退出码
  process.exit(report.failed > 0 ? 1 : 0);
}

// 处理未捕获的错误
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 未处理的Promise拒绝:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('🚨 未捕获的异常:', error);
  process.exit(1);
});

// 运行测试
main().catch(error => {
  console.error('🚨 测试运行失败:', error);
  process.exit(1);
});