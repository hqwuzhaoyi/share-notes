#!/usr/bin/env node

const API_BASE = 'http://localhost:4000';
const TEST_URL = 'https://www.xiaohongshu.com/explore/68aedfa2000000001c030efe?app_platform=ios&app_version=8.97.1&share_from_user_hidden=true&xsec_source=app_share&type=normal&xsec_token=CBI5bkjnxD1elX1utEMhX5Jfodp5PoBLR-LZRJtLWpmOQ=&author_share=1&xhsshare=CopyLink&shareRedId=Nz87QTxLOko7N0g2SzwwSkxISko6ODc5&apptime=1756304592&share_id=1ccd4068d9dc4794be7face19dec8ea2';

async function showFlomoURL() {
  console.log('🔍 查看 flomo URL 格式\n');

  try {
    const response = await fetch(`${API_BASE}/api/parse`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: TEST_URL,
        output_format: 'flomo'
      })
    });

    const data = await response.json();

    if (!data.success) {
      console.log('❌ 解析失败:', data.error);
      return;
    }

    const ios_url = data.ios_url;
    console.log('📱 完整 flomo URL:');
    console.log(ios_url);
    console.log('\n');

    // 解析URL参数
    const urlObj = new URL(ios_url);
    const content = urlObj.searchParams.get('content');
    const image_urls = urlObj.searchParams.get('image_urls');

    console.log('📊 参数详情:');
    console.log('─'.repeat(70));

    // content参数
    console.log('\n1️⃣ content 参数:');
    console.log('长度:', content?.length, '字符');
    console.log('预览:', content?.substring(0, 100) + '...');

    // image_urls参数
    console.log('\n2️⃣ image_urls 参数:');
    if (image_urls) {
      console.log('原始（URL编码）:', image_urls);
      console.log('\n解码后:', decodeURIComponent(image_urls));

      try {
        const imagesArray = JSON.parse(decodeURIComponent(image_urls));
        console.log('\n✅ JSON解析成功!');
        console.log('类型:', Array.isArray(imagesArray) ? '数组 ✅' : '非数组 ❌');
        console.log('图片数量:', imagesArray.length);
        console.log('\n图片列表:');
        imagesArray.forEach((url, idx) => {
          console.log(`  ${idx + 1}. ${url.substring(0, 60)}...`);
        });
      } catch (e) {
        console.log('\n❌ JSON解析失败:', e.message);
      }
    } else {
      console.log('无图片数据');
    }

    // 格式验证
    console.log('\n');
    console.log('🎯 格式验证:');
    console.log('─'.repeat(70));

    if (image_urls) {
      const hasSquareBrackets = image_urls.startsWith('%5B') && image_urls.endsWith('%5D');
      const hasQuotes = image_urls.includes('%22');
      const hasCommas = image_urls.includes('%2C');

      console.log('✅ 以 %5B 开头（[）:', hasSquareBrackets ? '是' : '否');
      console.log('✅ 以 %5D 结尾（]）:', hasSquareBrackets ? '是' : '否');
      console.log('✅ 包含 %22（"）:', hasQuotes ? '是' : '否');
      console.log('✅ 包含 %2C（,）:', hasCommas ? '是' : '否');

      if (hasSquareBrackets && hasQuotes) {
        console.log('\n✅ 格式正确！符合 flomo 的 JSON 数组要求');
      } else {
        console.log('\n❌ 格式不正确');
      }
    }

    // 对比示例
    console.log('\n📋 格式对比:');
    console.log('─'.repeat(70));
    console.log('\nflomo 官方示例:');
    console.log('image_urls=%5B%22url1%22%2C%22url2%22%5D');
    console.log('解码: ["url1","url2"]');

    console.log('\n我们的格式:');
    console.log('image_urls=' + (image_urls || '无'));
    if (image_urls) {
      console.log('解码:', decodeURIComponent(image_urls));
    }

  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

showFlomoURL();
