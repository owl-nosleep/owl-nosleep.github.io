# Astro 部落格部署指南

## 已完成設定

✅ 網站配置更新（標題、語言、主題）
✅ 內容從 Hexo 遷移到 Astro（9篇文章）
✅ GitHub Actions 部署配置
✅ 建構測試成功

## 部署到 GitHub Pages

### 步驟 1：推送到 GitHub 倉庫

```bash
cd owld_blog_new
git init
git add .
git commit -m "Initial Astro blog setup with migrated content"
git branch -M main
git remote add origin https://github.com/owl-nosleep/owl-nosleep.github.io.git
git push -u origin main
```

### 步驟 2：設定 GitHub Pages

1. 前往 GitHub 倉庫設定
2. 在 "Pages" 設定中選擇 "GitHub Actions" 作為來源
3. 部署會自動觸發

### 步驟 3：修正程式碼語法高亮（可選）

如需修正語法高亮警告，可以執行：

```bash
# 手動修正以下文件中的程式碼區塊標籤：
# - AIS3-Pre-Exam-2025-Writeups.md
# - 作業二-write-up.md

# 替換錯誤的語法標籤：
# =py → python
# =python → python  
# cpp= → cpp
# =js → javascript
# =wasm → wasm
# mar= → markdown
```

## 優勢對比

### Astro vs Hexo

**Astro 優勢：**
- 🚀 更快的載入速度（零 JS 默認）
- 🎨 現代化的 UI 設計
- 🔍 內建搜尋功能 (Pagefind)
- 📱 更好的行動端體驗
- 🛡️ 更好的 TypeScript 支援
- 🎯 更強大的內容管理
- 🔧 解決了程式碼溢出問題

**功能特色：**
- 🌓 自動深色/淺色模式切換
- 📊 內建閱讀時間計算
- 🏷️ 標籤和分類系統
- 🔗 自動生成目錄
- 📐 響應式設計
- ⚡ 快速頁面切換
- 🔍 即時搜尋

## 網站結構

```
owld_blog_new/
├── src/
│   ├── content/posts/     # 部落格文章
│   ├── pages/             # 頁面
│   └── config.ts          # 網站配置
├── public/                # 靜態資源
└── scripts/               # 輔助腳本
```

## 常用指令

```bash
# 開發模式
pnpm run dev

# 建構
pnpm run build

# 預覽建構結果
pnpm run preview

# 新增文章
pnpm run new-post

# 程式碼格式化
pnpm run format
```
