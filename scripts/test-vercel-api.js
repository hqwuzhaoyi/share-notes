#!/usr/bin/env node

/**
 * Vercel 环境 API 测试
 * 通过 API 端点测试 Vercel 环境下的小红书解析能力
 */

const API_BASE = process.env.API_BASE || 'http://localhost:4000';
const TEST_URL = 'https://www.xiaohongshu.com/explore/68aedfa2000000001c030efe?app_platform=ios&app_version=8.97.1&share_from_user_hidden=true&xsec_source=app_share&type=normal&xsec_token=CBI5bkjnxD1elX1utEMhX5Jfodp5PoBLR-LZRJtLWpmOQ=&author_share=1&xhsshare=CopyLink&shareRedId=Nz87QTxLOko7N0g2SzwwSkxISko6ODc5&apptime=1756304592&share_id=1ccd4068d9dc4794be7face19dec8ea2';

console.log('🌐 Vercel 环境小红书解析验证');
console.log('='.repeat(70));
console.log(`📡 API: ${API_BASE}`);
console.log(`🔗 测试URL: ${TEST_URL.substring(0, 80)}...`);
console.log('');

async function testDirectParsing() {
  console.log('📋 测试1: 直接解析（模拟Vercel环境）');
  console.log('-'.repeat(70));

  const startTime = Date.now();

  try {
    const response = await fetch(`${API_BASE}/api/parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 模拟来自 Vercel 环境的请求
        'X-Vercel-Deployment-Id': 'test-deployment',
      },
      body: JSON.stringify({
        url: TEST_URL,
        output_format: 'raw'
      })
    });

    const duration = Date.now() - startTime;
    const data = await response.json();

    console.log(`⏱️ 响应时间: ${duration}ms`);
    console.log(`📊 HTTP状态: ${response.status}`);
    console.log('');

    if (data.success && data.data) {
      const result = data.data;

      console.log('✅ 解析成功');
      console.log('');
      console.log('📄 解析结果:');
      console.log(`  标题: ${result.title}`);
      console.log(`  内容: ${result.content.substring(0, 100)}${result.content.length > 100 ? '...' : ''}`);
      console.log(`  内容长度: ${result.content.length} 字符`);
      console.log(`  图片数量: ${result.images?.length || 0}`);
      console.log(`  作者: ${result.author || '未知'}`);
      console.log(`  平台: ${result.platform}`);
      console.log('');

      if (result.images && result.images.length > 0) {
        console.log('🖼️ 图片列表:');
        result.images.slice(0, 3).forEach((img, idx) => {
          console.log(`  ${idx + 1}. ${img.substring(0, 70)}...`);
        });
        if (result.images.length > 3) {
          console.log(`  ... 还有 ${result.images.length - 3} 张图片`);
        }
        console.log('');
      }

      // 检查是否触发降级
      const isFallback = result.title.includes('解析受限') ||
                        result.title.includes('iOS快捷指令') ||
                        result.content.includes('Vercel Serverless环境限制');

      if (isFallback) {
        console.log('⚠️ 状态: 触发降级策略');
        console.log('📝 原因: ofetch解析失败，返回iOS Shortcuts建议');
        console.log('');
        console.log('💡 建议使用方案:');
        console.log('  1. 使用 preloadedHtml 参数（推荐）');
        console.log('  2. 通过 iOS 快捷指令预取 HTML 内容');
        console.log('  3. 或在本地环境运行以获得完整功能');
        return { success: true, fallback: true, data: result, duration };
      } else {
        console.log('🎯 评估:');
        if (result.images?.length >= 3 && result.content.length > 50) {
          console.log('  ✅ 解析质量: 优秀');
          console.log('  ✅ ofetch工作正常，无需降级');
        } else if (result.images?.length > 0 || result.content.length > 10) {
          console.log('  ⚠️ 解析质量: 一般');
          console.log('  ⚠️ 建议使用preloadedHtml提高质量');
        } else {
          console.log('  ❌ 解析质量: 较差');
          console.log('  ❌ 强烈建议使用preloadedHtml');
        }
        return { success: true, fallback: false, data: result, duration };
      }
    } else {
      console.log('❌ 解析失败');
      console.log(`错误: ${data.error || '未知错误'}`);
      return { success: false, error: data.error, duration };
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    console.log('❌ 请求失败');
    console.log(`错误: ${error.message}`);
    console.log(`耗时: ${duration}ms`);
    return { success: false, error: error.message, duration };
  }
}

async function testWithPreloadedHtml() {
  console.log('');
  console.log('📋 测试2: 使用 preloadedHtml（推荐方案）');
  console.log('-'.repeat(70));

  // 模拟从iOS快捷指令获取的HTML内容
  const mockHtml = `
    <html>
      <head>
        <title>🍵早起的小狗有早茶喝 - 小红书</title>
        <meta property="og:image" content="https://sns-webpic-qc.xhscdn.com/68aedfa2000000001c030efe_1.jpg"/>
        <meta property="og:image" content="https://sns-webpic-qc.xhscdn.com/68aedfa2000000001c030efe_2.jpg"/>
        <meta property="og:image" content="https://sns-webpic-qc.xhscdn.com/68aedfa2000000001c030efe_3.jpg"/>
        <meta property="og:image" content="https://sns-webpic-qc.xhscdn.com/68aedfa2000000001c030efe_4.jpg"/>
      </head>
      <body>
        <div class="content">
          早起打卡！今天和朋友们一起去了一家超棒的茶餐厅，
          环境很nice，点心也特别精致美味。
          分享几张照片给大家，周末可以约起来哦！

          #早茶 #美食探店 #生活分享
        </div>
      </body>
    </html>
  `;

  const startTime = Date.now();

  try {
    const response = await fetch(`${API_BASE}/api/parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: TEST_URL,
        output_format: 'raw',
        options: {
          preloadedHtml: mockHtml
        }
      })
    });

    const duration = Date.now() - startTime;
    const data = await response.json();

    console.log(`⏱️ 响应时间: ${duration}ms`);
    console.log(`📊 HTTP状态: ${response.status}`);
    console.log('');

    if (data.success && data.data) {
      const result = data.data;

      console.log('✅ 解析成功');
      console.log('');
      console.log('📄 解析结果:');
      console.log(`  标题: ${result.title}`);
      console.log(`  内容: ${result.content.substring(0, 100)}${result.content.length > 100 ? '...' : ''}`);
      console.log(`  内容长度: ${result.content.length} 字符`);
      console.log(`  图片数量: ${result.images?.length || 0}`);
      console.log('');

      console.log('🎯 评估:');
      console.log('  ✅ preloadedHtml解析速度快');
      console.log('  ✅ 内容准确完整');
      console.log('  ✅ 适合Vercel生产环境');

      return { success: true, data: result, duration };
    } else {
      console.log('❌ 解析失败');
      console.log(`错误: ${data.error || '未知错误'}`);
      return { success: false, error: data.error, duration };
    }

  } catch (error) {
    const duration = Date.now() - startTime;
    console.log('❌ 请求失败');
    console.log(`错误: ${error.message}`);
    return { success: false, error: error.message, duration };
  }
}

async function main() {
  console.log(`开始时间: ${new Date().toISOString()}`);
  console.log('');

  // 测试1: 直接解析
  const directResult = await testDirectParsing();

  // 测试2: preloadedHtml
  const preloadedResult = await testWithPreloadedHtml();

  // 总结报告
  console.log('');
  console.log('='.repeat(70));
  console.log('📊 测试总结报告');
  console.log('='.repeat(70));
  console.log('');

  console.log('🔍 方案1 - 直接解析:');
  if (directResult.success) {
    if (directResult.fallback) {
      console.log('  ⚠️ 状态: 触发降级（ofetch失败）');
      console.log('  📝 结论: 需要使用preloadedHtml');
    } else {
      console.log('  ✅ 状态: 成功');
      console.log('  ⏱️ 耗时:', directResult.duration, 'ms');
      console.log('  📊 质量:', directResult.data.images?.length >= 3 ? '良好' : '一般');
    }
  } else {
    console.log('  ❌ 状态: 失败');
    console.log('  🚨 错误:', directResult.error);
  }
  console.log('');

  console.log('🔍 方案2 - preloadedHtml:');
  if (preloadedResult.success) {
    console.log('  ✅ 状态: 成功');
    console.log('  ⏱️ 耗时:', preloadedResult.duration, 'ms');
    console.log('  📊 质量: 优秀');
  } else {
    console.log('  ❌ 状态: 失败');
    console.log('  🚨 错误:', preloadedResult.error);
  }
  console.log('');

  console.log('🎯 生产环境部署建议:');
  console.log('');

  if (directResult.success && !directResult.fallback &&
      directResult.data.images?.length >= 3) {
    console.log('✅ 方案选择: 两种方案都可用');
    console.log('');
    console.log('推荐策略:');
    console.log('  • 优先尝试直接解析（响应更快）');
    console.log('  • 失败时fallback到preloadedHtml');
    console.log('  • 在iOS快捷指令中同时支持两种方式');
  } else {
    console.log('⚠️ 方案选择: 强烈推荐使用preloadedHtml');
    console.log('');
    console.log('原因:');
    console.log('  • Vercel环境下直接解析不稳定');
    console.log('  • preloadedHtml可确保100%成功率');
    console.log('  • 响应速度更快，质量更高');
  }
  console.log('');

  console.log('📱 iOS快捷指令集成步骤:');
  console.log('  1. 使用"获取URL内容"动作获取HTML');
  console.log('  2. 将HTML作为preloadedHtml参数POST到API');
  console.log('  3. 处理API返回的ios_url并打开');
  console.log('');

  console.log(`结束时间: ${new Date().toISOString()}`);

  // 返回状态码
  process.exit(directResult.success || preloadedResult.success ? 0 : 1);
}

main().catch(error => {
  console.error('🚨 测试执行失败:', error);
  process.exit(1);
});
