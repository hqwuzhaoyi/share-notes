#!/usr/bin/env node

const API_BASE = 'http://localhost:4000';

async function testFlomoFormat() {
  console.log('🧪 测试 flomo URL 格式修复\n');

  const mockHtml = `
    <html>
      <head>
        <title>🍵早起的小狗有早茶喝 - 小红书</title>
        <meta property="og:image" content="https://sns-webpic-qc.xhscdn.com/test1.jpg"/>
        <meta property="og:image" content="https://sns-webpic-qc.xhscdn.com/test2.jpg"/>
        <meta property="og:image" content="https://sns-webpic-qc.xhscdn.com/test3.jpg"/>
      </head>
      <body>
        <div class="content">早起打卡，享受惬意的早茶时光。</div>
      </body>
    </html>
  `;

  try {
    const response = await fetch(`${API_BASE}/api/parse`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: 'https://www.xiaohongshu.com/explore/test',
        output_format: 'flomo',
        options: {
          preloadedHtml: mockHtml
        }
      })
    });

    const data = await response.json();

    console.log('📊 API 返回：\n');
    console.log('✅ success:', data.success);
    console.log('\n🔗 完整 flomo URL：');
    console.log(data.ios_url);

    // 解析URL
    const urlObj = new URL(data.ios_url);

    console.log('\n📝 参数解析：');
    console.log('content参数:', urlObj.searchParams.get('content')?.substring(0, 50) + '...');
    console.log('\nimage_urls参数（原始）:', urlObj.searchParams.get('image_urls'));

    // 解码image_urls
    const imageUrlsEncoded = urlObj.searchParams.get('image_urls');
    if (imageUrlsEncoded) {
      try {
        const imageUrlsArray = JSON.parse(decodeURIComponent(imageUrlsEncoded));
        console.log('\nimage_urls参数（解码后）:');
        console.log('类型:', Array.isArray(imageUrlsArray) ? '✅ 数组' : '❌ 不是数组');
        console.log('内容:', JSON.stringify(imageUrlsArray, null, 2));
      } catch (e) {
        console.log('\n❌ image_urls解析失败:', e.message);
      }
    }

    // 对比正确格式
    console.log('\n🎯 格式对比：');
    console.log('\n正确格式（flomo官方）:');
    console.log('image_urls=%5B%22url1%22%2C%22url2%22%5D');
    console.log('解码后: ["url1","url2"]');

    console.log('\n我们的格式:');
    console.log('image_urls=', imageUrlsEncoded);

    // 验证格式
    console.log('\n✅ 格式验证：');
    if (imageUrlsEncoded && imageUrlsEncoded.startsWith('%5B') && imageUrlsEncoded.endsWith('%5D')) {
      console.log('✅ 使用JSON数组格式（正确）');
    } else if (imageUrlsEncoded && !imageUrlsEncoded.includes('%5B')) {
      console.log('❌ 使用逗号分隔格式（错误）');
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testFlomoFormat();
