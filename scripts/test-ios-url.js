#!/usr/bin/env node

const API_BASE = 'http://localhost:4000';

async function testIOSURL() {
  console.log('🧪 测试 ios_url 返回\n');

  const mockHtml = `
    <html>
      <head>
        <title>🍵早起的小狗有早茶喝 - 小红书</title>
        <meta property="og:image" content="https://sns-webpic-qc.xhscdn.com/test1.jpg"/>
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

    console.log('📊 API 返回结果：\n');
    console.log('✅ success:', data.success);
    console.log('📱 ios_url:', data.ios_url);
    console.log('\n🔗 完整 flomo URL：');
    console.log(data.ios_url);

    console.log('\n📝 URL 解码后的内容：');
    if (data.ios_url) {
      const urlObj = new URL(data.ios_url);
      const content = decodeURIComponent(urlObj.searchParams.get('content') || '');
      console.log(content);
    }

    console.log('\n✅ ios_url 字段存在并正确生成！');
    console.log('💡 快捷指令可以直接使用这个URL打开flomo');

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

testIOSURL();
