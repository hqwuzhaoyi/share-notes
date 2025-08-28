// 简单的API测试脚本
const http = require('http');
const https = require('https');

// 测试用的URL样例
const testCases = [
  {
    name: '微信公众号文章',
    url: 'https://mp.weixin.qq.com/s/example-article-id',
    expected_platform: 'wechat'
  },
  {
    name: 'B站视频',
    url: 'https://www.bilibili.com/video/BV1234567890',
    expected_platform: 'bilibili'
  },
  {
    name: '小红书笔记',
    url: 'https://www.xiaohongshu.com/explore/example-note-id',
    expected_platform: 'xiaohongshu'
  }
];

// AI功能测试用例
const aiTestCases = [
  {
    name: '基础AI增强测试',
    request: {
      url: 'https://example.com/long-article',
      ai_enhance: true,
      ai_options: {
        enable_summary: true,
        enable_title_optimization: true,
        enable_categorization: true
      }
    }
  },
  {
    name: '选择性AI功能测试',
    request: {
      url: 'https://example.com/simple-content',
      ai_enhance: true,
      ai_options: {
        enable_summary: true,
        enable_title_optimization: false,
        enable_categorization: false,
        model: 'qwen-plus'
      }
    }
  },
  {
    name: '高质量AI模型测试',
    request: {
      url: 'https://example.com/complex-content', 
      ai_enhance: true,
      ai_options: {
        enable_summary: true,
        enable_title_optimization: true,
        enable_categorization: true,
        model: 'qwen-plus'
      }
    }
  }
];

// API基础URL
const API_BASE = process.env.API_BASE || 'http://localhost:3000';

async function makeRequest(url, data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    const urlObj = new URL(url);
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = (urlObj.protocol === 'https:' ? https : http).request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function testAPI() {
  console.log('🚀 开始测试 iOS Content Parser API v2.0 (包含AI功能)\n');

  // 测试API信息端点
  console.log('📋 测试 API 信息端点...');
  try {
    const response = await makeRequest(`${API_BASE}/api/parse`, {});
    console.log(`✅ GET /api/parse - Status: ${response.status}`);
    if (response.data.name) {
      console.log(`   API Name: ${response.data.name}`);
      console.log(`   Version: ${response.data.version}`);
      console.log(`   Supported Platforms: ${response.data.supported_platforms?.join(', ')}`);
      console.log(`   AI Available: ${response.data.ai_available ? '✅' : '❌'}`);
      if (response.data.ai_models?.length > 0) {
        console.log(`   AI Models: ${response.data.ai_models.join(', ')}`);
      }
    }
  } catch (error) {
    console.log(`❌ GET /api/parse - Error: ${error.message}`);
  }

  console.log('\n📝 测试URL解析功能...\n');

  // 测试各个平台的URL解析
  for (const testCase of testCases) {
    console.log(`🔍 测试: ${testCase.name}`);
    console.log(`   URL: ${testCase.url}`);
    
    try {
      const response = await makeRequest(`${API_BASE}/api/parse`, {
        url: testCase.url,
        output_format: 'flomo'
      });

      if (response.status === 200 && response.data.success) {
        console.log(`   ✅ 解析成功`);
        console.log(`   📱 平台: ${response.data.data?.platform}`);
        console.log(`   📄 标题: ${response.data.data?.title?.substring(0, 50)}...`);
        console.log(`   🖼️  图片数量: ${response.data.data?.images?.length || 0}`);
        
        // 检查AI增强字段
        if (response.data.data?.aiEnhanced) {
          console.log(`   🤖 AI增强: ✅`);
          if (response.data.data.summary) {
            console.log(`   📝 摘要: ${response.data.data.summary.substring(0, 50)}...`);
          }
          if (response.data.data.optimizedTitle) {
            console.log(`   ✨ 优化标题: ${response.data.data.optimizedTitle}`);
          }
          if (response.data.data.categories?.length > 0) {
            console.log(`   🏷️  分类: ${response.data.data.categories.join(', ')}`);
          }
          if (response.data.data.tags?.length > 0) {
            console.log(`   🎯 标签: ${response.data.data.tags.join(', ')}`);
          }
        }
        
        if (response.data.ios_url) {
          console.log(`   📲 iOS URL: ${response.data.ios_url.substring(0, 100)}...`);
        }
      } else {
        console.log(`   ❌ 解析失败: ${response.data.error || '未知错误'}`);
      }
    } catch (error) {
      console.log(`   ❌ 请求失败: ${error.message}`);
    }
    
    console.log(''); // 空行分隔
  }

  // 测试错误处理
  console.log('⚠️  测试错误处理...\n');

  // 无效URL
  try {
    const response = await makeRequest(`${API_BASE}/api/parse`, {
      url: 'invalid-url'
    });
    console.log(`🔍 无效URL测试 - Status: ${response.status}, Success: ${response.data.success}`);
  } catch (error) {
    console.log(`❌ 无效URL测试失败: ${error.message}`);
  }

  // 缺少URL参数
  try {
    const response = await makeRequest(`${API_BASE}/api/parse`, {
      output_format: 'flomo'
    });
    console.log(`🔍 缺少URL参数测试 - Status: ${response.status}, Success: ${response.data.success}`);
  } catch (error) {
    console.log(`❌ 缺少URL参数测试失败: ${error.message}`);
  }

  // 测试AI功能（如果可用）
  console.log('\n🤖 测试AI增强功能...\n');
  
  // 注意：这些测试使用示例URL，实际运行时可能会失败
  // 需要有效的URL和OpenAI API密钥
  for (const aiTest of aiTestCases) {
    console.log(`🔍 测试: ${aiTest.name}`);
    console.log(`   配置: ${JSON.stringify(aiTest.request.ai_options)}`);
    
    try {
      const response = await makeRequest(`${API_BASE}/api/parse`, {
        ...aiTest.request,
        output_format: 'flomo'
      });

      if (response.status === 200) {
        if (response.data.success) {
          console.log(`   ✅ AI增强成功`);
          
          if (response.data.data?.aiEnhanced) {
            console.log(`   🤖 AI字段:`);
            if (response.data.data.summary) {
              console.log(`     📝 摘要: ${response.data.data.summary.substring(0, 60)}...`);
            }
            if (response.data.data.optimizedTitle) {
              console.log(`     ✨ 优化标题: ${response.data.data.optimizedTitle}`);
            }
            if (response.data.data.categories?.length > 0) {
              console.log(`     🏷️  分类: ${response.data.data.categories.join(', ')}`);
            }
            if (response.data.data.tags?.length > 0) {
              console.log(`     🎯 标签: ${response.data.data.tags.slice(0, 3).join(', ')}`);
            }
          } else {
            console.log(`   ⚠️  AI增强未启用或失败`);
          }
        } else {
          console.log(`   ❌ AI增强失败: ${response.data.error}`);
        }
      } else {
        console.log(`   ❌ 请求失败: HTTP ${response.status}`);
      }
    } catch (error) {
      console.log(`   ❌ AI测试失败: ${error.message}`);
    }
    
    console.log(''); // 空行分隔
  }

  // 测试错误处理
  console.log('⚠️  测试错误处理...\n');

  // AI功能参数错误
  try {
    const response = await makeRequest(`${API_BASE}/api/parse`, {
      url: 'https://example.com/test',
      ai_enhance: true,
      ai_options: {
        enable_summary: 'invalid_boolean', // 错误的数据类型
        model: 'invalid_model'
      }
    });
    console.log(`🔍 参数错误测试 - Status: ${response.status}, Success: ${response.data.success}`);
  } catch (error) {
    console.log(`❌ 参数错误测试失败: ${error.message}`);
  }

  console.log('\n🎉 测试完成！');
  console.log('\n💡 提示:');
  console.log('   - 基础解析功能可以直接使用');
  console.log('   - AI功能需要配置 OPENAI_API_KEY');
  console.log('   - 某些测试使用示例URL，可能会失败');
  console.log('   - 在生产环境中，请使用真实的URL进行测试');
}

// 如果直接运行此脚本
if (require.main === module) {
  testAPI().catch(console.error);
}

module.exports = { testAPI };