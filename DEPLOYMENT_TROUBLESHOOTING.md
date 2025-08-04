# GitHub Pages 部署故障排除指南

## 🔍 當前問題分析

### 問題症狀：
- `https://owl-nosleep.github.io/` 顯示舊的 Hexo 部落格
- `https://owld.tw` 顯示 404 錯誤
- GitHub Actions 部署失敗

### 🛠️ 解決方案步驟

#### 1. GitHub Pages 設定
請手動前往 GitHub 倉庫設定頁面完成以下設定：

**步驟 1.1：設定部署來源**
1. 前往：https://github.com/owl-nosleep/owl-nosleep.github.io/settings/pages
2. 在 "Source" 部分選擇 **"GitHub Actions"**
3. 保存設定

**步驟 1.2：設定自訂域名**
1. 在同一頁面的 "Custom domain" 欄位輸入：`owld.tw`
2. 勾選 **"Enforce HTTPS"**
3. 點擊 "Save"

#### 2. Actions 權限設定
**步驟 2.1：檢查工作流程權限**
1. 前往：https://github.com/owl-nosleep/owl-nosleep.github.io/settings/actions
2. 在 "Workflow permissions" 部分選擇：**"Read and write permissions"**
3. 勾選 **"Allow GitHub Actions to create and approve pull requests"**
4. 點擊 "Save"

#### 3. 手動觸發部署
**步驟 3.1：重新運行 Actions**
1. 前往：https://github.com/owl-nosleep/owl-nosleep.github.io/actions
2. 找到最新的失敗的工作流程
3. 點擊 "Re-run all jobs"

### 📋 檢查清單

- [ ] GitHub Pages Source 設定為 "GitHub Actions"
- [ ] 自訂域名設定為 "owld.tw"
- [ ] 啟用 "Enforce HTTPS"
- [ ] Actions 有 "Read and write permissions"
- [ ] CNAME 檔案存在於 public/ 目錄
- [ ] Astro config 中 site 設定為 "https://owld.tw"

### 🔧 已完成的技術修復

✅ **語法高亮修復**：所有程式碼區塊語法錯誤已修復
✅ **CNAME 檔案**：已創建並包含 owld.tw
✅ **Astro 配置**：site URL 已更新為自訂域名
✅ **pnpm 配置**：GitHub Actions 已優化 pnpm 設定
✅ **依賴項安裝**：Node.js 快取和穩定性改善

### 🌐 預期結果

完成上述設定後：
- `https://owld.tw` 將顯示新的 Astro 部落格
- `https://owl-nosleep.github.io/` 將重新導向到 owld.tw
- 所有部落格文章將正確顯示，無程式碼溢出問題
- About 頁面的時間軸動畫將正常工作

### ⏱️ 部署時間

首次正確設定後，部署通常需要：
- GitHub Actions 建構：2-3 分鐘
- DNS 傳播：5-10 分鐘（自訂域名）
- HTTPS 證書生成：最多 24 小時

### 📞 如果仍有問題

如果完成所有步驟後仍有問題，可能需要：
1. 檢查域名 DNS 設定是否正確指向 GitHub Pages
2. 等待 DNS 快取清除（可能需要數小時）
3. 檢查 GitHub Actions 日誌獲取詳細錯誤信息
