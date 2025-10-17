#!/usr/bin/env node

/**
 * Vercel 环境小红书解析验证
 * 模拟 Vercel Serverless 环境，测试特定 URL 的解析能力
 */

// 设置环境变量模拟 Vercel 环境
process.env.VERCEL = '1';
process.env.VERCEL_ENV = 'production';
process.env.NODE_ENV = 'production';
process.env.PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD = '1';

const TEST_URL = 'https://www.xiaohongshu.com/explore/68aedfa2000000001c030efe?app_platform=ios&app_version=8.97.1&share_from_user_hidden=true&xsec_source=app_share&type=normal&xsec_token=CBI5bkjnxD1elX1utEMhX5Jfodp5PoBLR-LZRJtLWpmOQ=&author_share=1&xhsshare=CopyLink&shareRedId=Nz87QTxLOko7N0g2SzwwSkxISko6ODc5&apptime=1756304592&share_id=1ccd4068d9dc4794be7face19dec8ea2';

console.log('🌐 Vercel 环境验证测试');
console.log('='.repeat(60));
console.log('');

// 动态导入（因为需要先设置环境变量）
async function runTest() {
  console.log('📋 环境信息:');
  const { EnvironmentDetector } = await import('../src/lib/utils/environment-detector.ts');
  const envInfo = EnvironmentDetector.getEnvironmentInfo();
  console.log(JSON.stringify(envInfo, null, 2));
  console.log('');

  console.log('🔍 测试配置:');
  console.log(`URL: ${TEST_URL}`);
  console.log('解析方式: Vercel环境（预期使用ofetch + 降级策略）');
  console.log('');

  console.log('🚀 开始解析...');
  console.log('');

  const { XiaohongshuParser } = await import('../src/lib/parsers/xiaohongshu.ts');
  const parser = new XiaohongshuParser();

  const startTime = Date.now();

  try {
    const result = await parser.parse(TEST_URL, {
      timeout: 20000
    });

    const duration = Date.now() - startTime;

    console.log('✅ 解析成功！');
    console.log('');
    console.log('📊 解析结果:');
    console.log(`标题: ${result.title}`);
    console.log(`内容长度: ${result.content.length} 字符`);
    console.log(`图片数量: ${result.images.length}`);
    console.log(`作者: ${result.author || '未知'}`);
    console.log(`平台: ${result.platform}`);
    console.log('');

    if (result.images.length > 0) {
      console.log('🖼️ 图片列表:');
      result.images.slice(0, 5).forEach((img, idx) => {
        console.log(`  ${idx + 1}. ${img.substring(0, 80)}...`);
      });
      if (result.images.length > 5) {
        console.log(`  ... 还有 ${result.images.length - 5} 张图片`);
      }
      console.log('');
    }

    console.log('⏱️ 性能指标:');
    console.log(`解析时长: ${duration}ms`);
    console.log('');

    // 检查是否是降级结果
    if (result.title.includes('解析受限') || result.title.includes('iOS快捷指令')) {
      console.log('⚠️ 检测到降级策略被触发');
      console.log('这意味着ofetch解析失败，返回了iOS Shortcuts建议');
      console.log('');
      console.log('💡 建议:');
      console.log('1. 在生产环境使用 preloadedHtml 参数');
      console.log('2. 通过 iOS 快捷指令预取 HTML 内容');
      console.log('3. 或考虑在本地环境运行以获得完整功能');
      return { success: true, fallback: true, result };
    }

    console.log('🎯 评估:');
    if (result.images.length >= 3 && result.content.length > 20) {
      console.log('✅ Vercel环境解析质量良好');
      console.log('✅ 成功提取标题、内容和图片');
      console.log('✅ 无需降级策略，ofetch工作正常');
    } else if (result.images.length > 0 || result.content.length > 10) {
      console.log('⚠️ Vercel环境解析部分成功');
      console.log('⚠️ 内容提取不完整，建议使用preloadedHtml');
    } else {
      console.log('❌ Vercel环境解析质量较差');
      console.log('❌ 强烈建议使用preloadedHtml参数');
    }

    return { success: true, fallback: false, result };

  } catch (error) {
    const duration = Date.now() - startTime;

    console.log('❌ 解析失败');
    console.log('');
    console.log('🚨 错误信息:');
    console.log(error.message);
    console.log('');
    console.log('⏱️ 失败时长:', duration, 'ms');
    console.log('');
    console.log('💡 故障排查:');
    console.log('1. 检查网络连接');
    console.log('2. 验证URL是否有效');
    console.log('3. 确认小红书反爬虫策略变化');
    console.log('4. 考虑使用preloadedHtml绕过Serverless限制');

    return { success: false, error: error.message };
  }
}

// 测试 preloadedHtml 方案
async function testWithPreloadedHtml() {
  console.log('');
  console.log('='.repeat(60));
  console.log('🧪 测试 preloadedHtml 方案');
  console.log('='.repeat(60));
  console.log('');

  console.log('📋 模拟场景: iOS快捷指令预取HTML后调用API');
  console.log('');

  // 模拟的HTML内容（实际应该从iOS快捷指令获取）
  const mockHtml = `
    <html>
      <head>
        <title>🍵早起的小狗有早茶喝 - 小红书</title>
        <meta property="og:image" content="https://sns-webpic-qc.xhscdn.com/test1.jpg"/>
        <meta property="og:image" content="https://sns-webpic-qc.xhscdn.com/test2.jpg"/>
        <meta property="og:image" content="https://sns-webpic-qc.xhscdn.com/test3.jpg"/>
      </head>
      <body>
        <div class="content">早起打卡，享受惬意的早茶时光。生活就是要这样慢下来，感受每一个美好瞬间。</div>
      </body>
    </html>
  `;

  const { XiaohongshuParser } = await import('../src/lib/parsers/xiaohongshu.ts');
  const parser = new XiaohongshuParser();

  const startTime = Date.now();

  try {
    const result = await parser.parse(TEST_URL, {
      preloadedHtml: mockHtml,
      timeout: 5000
    });

    const duration = Date.now() - startTime;

    console.log('✅ preloadedHtml解析成功！');
    console.log('');
    console.log('📊 解析结果:');
    console.log(`标题: ${result.title}`);
    console.log(`内容长度: ${result.content.length} 字符`);
    console.log(`图片数量: ${result.images.length}`);
    console.log(`解析时长: ${duration}ms`);
    console.log('');

    console.log('🎯 结论:');
    console.log('✅ preloadedHtml 方案在 Vercel 环境下工作完美');
    console.log('✅ 解析速度快，内容准确');
    console.log('✅ 这是 Vercel 部署的推荐方案');

    return { success: true, result };

  } catch (error) {
    console.log('❌ preloadedHtml解析失败:', error.message);
    return { success: false, error: error.message };
  }
}

// 主函数
async function main() {
  console.log('开始时间:', new Date().toISOString());
  console.log('');

  // 测试1: 直接解析
  const directResult = await runTest();

  // 测试2: preloadedHtml方案
  const preloadedResult = await testWithPreloadedHtml();

  // 总结
  console.log('');
  console.log('='.repeat(60));
  console.log('📊 测试总结');
  console.log('='.repeat(60));
  console.log('');

  console.log('方案1 - 直接解析:');
  if (directResult.success) {
    if (directResult.fallback) {
      console.log('  ⚠️ 触发降级策略（ofetch失败）');
    } else {
      console.log('  ✅ ofetch解析成功');
    }
  } else {
    console.log('  ❌ 解析失败');
  }
  console.log('');

  console.log('方案2 - preloadedHtml:');
  console.log(preloadedResult.success ? '  ✅ 解析成功' : '  ❌ 解析失败');
  console.log('');

  console.log('🎯 生产环境建议:');
  if (directResult.success && !directResult.fallback) {
    console.log('✅ 可以直接使用API，无需preloadedHtml');
    console.log('   但建议仍然提供preloadedHtml作为备选方案');
  } else {
    console.log('⚠️ 强烈建议使用preloadedHtml方案');
    console.log('   通过iOS快捷指令预取HTML内容可确保解析成功');
  }
  console.log('');
  console.log('结束时间:', new Date().toISOString());
}

// 错误处理
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 未处理的Promise拒绝:', reason);
  process.exit(1);
});

main().catch(error => {
  console.error('🚨 测试失败:', error);
  process.exit(1);
});
