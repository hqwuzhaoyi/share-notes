#!/bin/bash

# 读取HTML文件内容并转义
HTML_CONTENT=$(cat test_xhs_content.html | sed 's/"/\\"/g' | tr '\n' ' ')

# 构建JSON请求体
curl -X POST http://localhost:4000/api/parse \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://xhslink.com/n/9qQs6fCAtZN",
    "output_format": "raw",
    "options": {
      "preloadedHtml": "'"$HTML_CONTENT"'"
    }
  }' \
  --max-time 15 | jq '.'

