#!/usr/bin/env node

const API_BASE = 'http://localhost:4000';

async function verifyFlomoFormat() {
  console.log('✅ 验证 flomo URL 格式修复\n');

  const mockHtml = `
    <html>
      <head>
        <title>测试标题</title>
        <meta property="og:image" content="https://example.com/img1.jpg"/>
        <meta property="og:image" content="https://example.com/img2.jpg"/>
      </head>
      <body>测试内容</body>
    </html>
  `;

  try {
    const response = await fetch(`${API_BASE}/api/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://www.xiaohongshu.com/explore/test',
        output_format: 'flomo',
        options: { preloadedHtml: mockHtml }
      })
    });

    const data = await response.json();
    const urlObj = new URL(data.ios_url);
    const imageUrlsParam = urlObj.searchParams.get('image_urls');

    console.log('🔗 完整URL:');
    console.log(data.ios_url);
    console.log('\n📊 image_urls 参数（URL编码）:');
    console.log(imageUrlsParam);

    // 解码
    const decoded = decodeURIComponent(imageUrlsParam);
    console.log('\n📝 解码后:');
    console.log(decoded);

    // 验证是否为JSON数组
    const parsed = JSON.parse(decoded);
    console.log('\n✅ 验证结果:');
    console.log('1. 能否解析为JSON: ✅ 成功');
    console.log('2. 是否为数组:', Array.isArray(parsed) ? '✅ 是' : '❌ 否');
    console.log('3. 数组元素:', parsed.length);
    console.log('4. 格式示例:', JSON.stringify(parsed[0]));

    // 对比正确格式
    console.log('\n🎯 格式对比:');
    const correctExample = '["url1","url2"]';
    const correctEncoded = encodeURIComponent(correctExample);
    console.log('正确格式（解码前）:', correctEncoded);
    console.log('正确格式（解码后）:', correctExample);
    console.log('\n我们的格式（解码前）:', imageUrlsParam);
    console.log('我们的格式（解码后）:', decoded);

    // URL开头检查
    console.log('\n🔍 URL编码检查:');
    if (imageUrlsParam.startsWith('%5B') && imageUrlsParam.endsWith('%5D')) {
      console.log('✅ URL以 %5B 开头（对应 [）');
      console.log('✅ URL以 %5D 结尾（对应 ]）');
      console.log('✅ 格式正确！符合 flomo 要求！');
    } else {
      console.log('❌ 格式不正确');
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

verifyFlomoFormat();
