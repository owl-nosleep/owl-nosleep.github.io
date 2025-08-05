# OWLD 部落格自訂網域設定指南

## 🎯 目標
將 OWLD 部落格從 Vercel 預設網域遷移到自訂網域 `owld.tw`

## 📋 目前狀態
- ✅ 新版 OWLD 部落格已成功部署到 Vercel
- ✅ 橫幅背景圖片已啟用（滾動時會有漸變效果）
- ✅ 網域 `owld.tw` 已添加到 Vercel 專案
- ⏳ 等待 DNS 設定更新

## 🌐 目前的部署 URL
- **Vercel 部署**: https://owld-blog-ljwfd5o17-matts-projects-1a76c8a0.vercel.app
- **目標自訂網域**: https://owld.tw

## 🔧 DNS 設定步驟

### 方法 1: 修改 A 記錄（推薦）

1. **登入您的 DNS 提供商**（如 GoDaddy、Cloudflare、或網域註冊商）

2. **找到 DNS 管理或 DNS 設定頁面**

3. **修改或添加 A 記錄**：
   ```
   類型: A
   名稱: @ (或留空，代表根網域 owld.tw)
   值: 76.76.21.21
   TTL: 3600 (或保持預設)
   ```

4. **如果您想要 www.owld.tw 也指向相同網站**，添加 CNAME 記錄：
   ```
   類型: CNAME
   名稱: www
   值: owld.tw
   TTL: 3600
   ```

### 方法 2: 更改 Nameservers（完全委託給 Vercel）

如果您希望 Vercel 完全管理您的 DNS：

1. **在您的網域註冊商更改 Nameservers** 為：
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`

2. **移除現有的 nameservers**：
   - `a.g-dns.com`
   - `b.g-dns.com`
   - `c.g-dns.com`

## ⏱ DNS 傳播時間
- DNS 變更通常需要 **15 分鐘到 48 小時** 才會完全生效
- 您可以使用 [DNS Checker](https://dnschecker.org/) 檢查傳播狀態

## 🔍 驗證步驟

### 1. 檢查 DNS 設定
```bash
nslookup owld.tw
```
應該看到 IP 位址 `76.76.21.21`

### 2. 檢查 HTTPS 憑證
Vercel 會自動建立 SSL 憑證，通常需要幾分鐘到幾小時

### 3. 測試網站
前往 https://owld.tw 確認網站正常運作

## 🚨 疑難排解

### DNS 未生效
- 清除瀏覽器快取
- 嘗試無痕模式
- 使用不同的 DNS 服務器（如 8.8.8.8）

### SSL 憑證問題
- 等待 Vercel 完成憑證生成
- 確認 DNS 已正確指向 Vercel

### 網站無法訪問
- 檢查 Vercel 專案設定
- 確認網域已正確添加到專案

## 📞 支援
如果遇到問題，可以：
1. 檢查 Vercel Dashboard 的網域設定
2. 查看 DNS 提供商的文件
3. 聯繫您的網域註冊商支援

---

**更新時間**: 2025年8月5日
**狀態**: 等待 DNS 設定更新
