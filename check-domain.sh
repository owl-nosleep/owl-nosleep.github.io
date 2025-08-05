#!/bin/bash

# OWLD 部落格網域檢查腳本
# 檢查 owld.tw 的 DNS 設定和部署狀態

echo "🌐 OWLD 部落格網域檢查"
echo "======================="

echo -e "\n📋 檢查項目:"
echo "1. DNS 設定狀態"
echo "2. SSL 憑證狀態"
echo "3. 網站可用性"
echo "4. Vercel 部署狀態"

echo -e "\n🔍 1. 檢查 DNS 設定..."
echo "目標 IP: 76.76.21.21"
echo "當前 DNS 解析:"
nslookup owld.tw

echo -e "\n🔒 2. 檢查 SSL 憑證..."
echo "檢查 HTTPS 狀態..."
if curl -s -I https://owld.tw | head -n 1 | grep -q "200"; then
    echo "✅ HTTPS 正常"
else
    echo "❌ HTTPS 無法訪問"
fi

echo -e "\n🌍 3. 檢查網站可用性..."
echo "測試網站回應..."
response=$(curl -s -o /dev/null -w "%{http_code}" https://owld.tw)
if [ "$response" -eq 200 ]; then
    echo "✅ 網站正常運行"
else
    echo "❌ 網站無法訪問 (HTTP $response)"
fi

echo -e "\n🚀 4. Vercel 部署狀態..."
echo "最新部署 URL:"
echo "https://owld-blog-ljwfd5o17-matts-projects-1a76c8a0.vercel.app"

# 檢查 Vercel 部署是否正常
response=$(curl -s -o /dev/null -w "%{http_code}" https://owld-blog-ljwfd5o17-matts-projects-1a76c8a0.vercel.app)
if [ "$response" -eq 200 ]; then
    echo "✅ Vercel 部署正常"
else
    echo "❌ Vercel 部署有問題 (HTTP $response)"
fi

echo -e "\n📊 總結:"
echo "如果 owld.tw 還無法訪問，請："
echo "1. 檢查您的 DNS 設定是否正確"
echo "2. 等待 DNS 傳播（可能需要 15 分鐘到 48 小時）"
echo "3. 確認 A 記錄指向 76.76.21.21"
echo ""
echo "DNS 檢查工具: https://dnschecker.org/"
echo "Vercel Dashboard: https://vercel.com/dashboard"
