#!/bin/bash

# 🚀 強制部署 Astro 部落格到 GitHub Pages
# 
# 此腳本會：
# 1. 檢查當前 Git 狀態
# 2. 建構 Astro 網站
# 3. 強制推送到 GitHub
# 4. 觸發 GitHub Actions 部署

set -e

echo "🔍 檢查當前目錄..."
if [ ! -f "astro.config.mjs" ]; then
    echo "❌ 錯誤：請在 Astro 項目根目錄下運行此腳本"
    exit 1
fi

echo "📦 安裝依賴..."
pnpm install

echo "🏗️ 建構網站..."
pnpm run build

echo "✅ 檢查建構結果..."
if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
    echo "❌ 建構失敗：dist 目錄或 index.html 不存在"
    exit 1
fi

echo "📄 確保 .nojekyll 文件存在..."
touch dist/.nojekyll

echo "📋 添加所有更改到 Git..."
git add .

echo "💾 提交更改..."
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
git commit -m "🚀 強制部署 Astro 部落格 - $TIMESTAMP" || echo "沒有新的更改需要提交"

echo "🚀 推送到 GitHub..."
git push origin main

echo "✅ 部署已觸發！"
echo "📱 請前往以下連結查看部署狀態："
echo "   https://github.com/owl-nosleep/owl-nosleep.github.io/actions"
echo ""
echo "🌐 網站將在幾分鐘後更新："
echo "   https://owld.tw"
