# 🚀 OWLD Blog 重新部署指南 (安全版)

> **重要更新 (2025-08-05)**: 已完全移除管理介面，現為零攻擊面的純靜態博客

## 📋 目前狀態
- ✅ **完全靜態** - 無伺服器端代碼
- ✅ **零認證系統** - 無密碼或登入功能
- ✅ **GitHub 安全** - 可安全公開所有代碼
- ✅ **自動部署** - 推送即部署

## 🔄 重新部署方式

### 方法 1: 自動部署 (推薦) ⭐
任何推送到 GitHub 的更改都會自動觸發 Vercel 部署：

```bash
# 進入專案目錄
cd /Users/moneychan/Documents/CyberSecurity/owld_blog/owld_blog_new

# 進行修改後提交
git add .
git commit -m "描述您的修改"
git push origin main

# Vercel 會自動檢測並部署 (約 1-2 分鐘)
```

### 方法 2: 使用部署腳本
```bash
# 完整部署流程 (包含檢查和驗證)
./deploy.sh production

# 快速預覽部署
./deploy.sh preview
```

### 方法 3: 手動 Vercel CLI
```bash
# 預覽部署
vercel

# 生產部署
vercel --prod
```

## 📝 常見修改場景

### ✏️ 新增博客文章
```bash
# 1. 在 src/content/posts/ 創建新的 .md 文件
# 2. 編寫文章內容
# 3. 提交並推送
git add src/content/posts/new-article.md
git commit -m "新增文章: 文章標題"
git push origin main
```

### 📅 更新經歷時間線
```bash
# 1. 編輯 src/content/experiences/ 中的相關 .md 文件
# 2. 或創建新的經歷文件
# 3. 提交並推送
git add src/content/experiences/
git commit -m "更新經歷時間線"
git push origin main
```

**經歷文件格式範例**:
```markdown
---
title: "新經歷名稱"
year: "2025"
description: "簡短描述"
type: "achievement"  # achievement/education/competition/certification
order: 1
---

這裡可以用 Markdown 格式寫詳細內容...
```

### ⚙️ 修改網站配置
```bash
# 編輯 src/config.ts 文件
# 例如：修改網站標題、描述、橫幅設定等
git add src/config.ts
git commit -m "更新網站配置"
git push origin main
```

### 🎨 更新樣式或佈局
```bash
# 修改 src/components/ 或 src/layouts/ 中的檔案
git add src/
git commit -m "更新網站樣式"
git push origin main
```

## 🔍 部署狀態檢查

### 檢查當前部署
```bash
# 使用檢查腳本
./check-domain.sh

# 或手動檢查
curl -I https://owld.tw
vercel ls
```

### 監控部署過程
- **Vercel Dashboard**: https://vercel.com/dashboard
- **GitHub Actions**: 在 GitHub 儲存庫中查看
- **實時狀態**: 訪問 https://owld.tw 確認更新

## ⚡ 快速部署流程

### 全自動部署 (推薦)
```bash
#!/bin/bash
# 一鍵部署腳本

# 檢查是否有更改
if [[ -n $(git status -s) ]]; then
    read -p "提交訊息: " message
    git add .
    git commit -m "$message"
    git push origin main
    echo "✅ 部署已觸發，請前往 https://owld.tw 查看"
else
    echo "ℹ️ 沒有更改需要部署"
fi
```

### 本地測試流程
```bash
# 1. 開發模式測試
npm run dev                # 在 http://localhost:4321 測試

# 2. 構建測試
npm run build             # 確保能成功構建

# 3. 預覽構建結果
npm run preview           # 在 http://localhost:4321 預覽

# 4. 確認無誤後推送
git push origin main
```

## 🛠️ 故障排除

### 構建失敗
```bash
# 檢查本地構建
npm run build

# 查看詳細錯誤
npm run build 2>&1 | tee build.log

# 檢查最近的提交
git log --oneline -5
```

### 部署失敗
```bash
# 查看 Vercel 部署日誌
vercel logs

# 回滾到上一個版本
vercel rollback

# 重新觸發部署
git commit --allow-empty -m "觸發重新部署"
git push origin main
```

### 網站無法訪問
```bash
# 檢查 DNS 狀態
./check-domain.sh

# 檢查 Vercel 狀態
vercel inspect
```

## 📊 部署性能指標

### 當前性能
- **構建時間**: ~4 秒
- **頁面數量**: 18 個靜態頁面
- **搜索索引**: 3067 個詞彙
- **圖片優化**: 自動 WebP 轉換
- **載入速度**: <500ms

### 最佳實踐
1. **小量提交**: 避免一次性大量更改
2. **測試優先**: 推送前先本地測試
3. **清晰訊息**: 使用描述性的提交訊息
4. **定期備份**: 重要內容定期下載備份

## 🔒 安全注意事項

### ✅ 已解決的安全問題
- 無管理介面 - 無攻擊入口
- 無認證系統 - 無密碼洩露風險
- 無 API 端點 - 無注入攻擊可能
- 無環境變數 - 無機密資訊

### 🛡️ 持續安全實踐
- 定期更新依賴套件
- 監控 GitHub 安全警告
- 保持構建工具最新版本
- 定期檢查部署狀態

## 📁 重要文件位置

### 內容文件
- **博客文章**: `src/content/posts/`
- **經歷資料**: `src/content/experiences/`
- **網站配置**: `src/config.ts`

### 樣式和佈局
- **主要佈局**: `src/layouts/`
- **組件**: `src/components/`
- **樣式**: `src/styles/`

### 靜態資源
- **圖片**: `public/images/`
- **圖示**: `public/favicon/`
- **其他資源**: `public/`

## 🌟 新功能部署

### 新增頁面
```bash
# 在 src/pages/ 創建新的 .astro 文件
# 自動生成路由，無需額外配置
```

### 新增組件
```bash
# 在 src/components/ 創建新組件
# 在需要的頁面中導入使用
```

### 修改背景橫幅
```bash
# 1. 替換 public/images/background.jpg
# 2. 或修改 src/config.ts 中的 banner.src 路徑
# 3. 推送更改
```

---

## 🎯 總結

**OWLD Blog 現在是一個完全安全、易於維護的靜態博客系統**

### 部署優勢
- 🚀 **一鍵部署** - git push 即可
- 🔒 **零安全風險** - 無認證系統
- ⚡ **極快速度** - 純靜態頁面
- 🛠️ **易於維護** - 簡單的文件管理

### 訪問連結
- **主要網址**: https://owld.tw
- **Vercel Dashboard**: https://vercel.com/dashboard
- **GitHub Repository**: https://github.com/owl-nosleep/owl-nosleep.github.io

---
**更新時間**: 2025年8月5日  
**版本**: 安全靜態版本  
**狀態**: 🟢 生產就緒
