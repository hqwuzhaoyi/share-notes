#!/bin/bash

# 读取HTML文件内容并转义
# HTML_CONTENT=$(cat feizhu_marriott_content.html | sed 's/"/\\"/g' | tr '\n' ' ')

# 构建JSON请求体并测试
curl -X POST http://localhost:4000/api/parse \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://xhslink.com/o/mRDJxDn9Yy",
    "output_format": "raw"
  }' \
  --max-time 15 | jq '.'
