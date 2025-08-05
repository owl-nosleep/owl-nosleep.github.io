# 部署指南

## 部署前檢查清單

### 1. 環境變數設置
確保您已經設置了以下環境變數：

```bash
# 本地開發環境 (.env 檔案)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password_here
```

### 2. 安全設置檢查
- ✅ `.env` 檔案已加入 `.gitignore`
- ✅ 管理員路徑已設為隱藏路徑：`/secure-admin-panel-x9z8k/`
- ✅ API 端點有 HTTP Basic 認證保護
- ✅ 密碼強度足夠（請使用強密碼）

## Vercel 部署步驟

### 1. 安裝 Vercel CLI（如果尚未安裝）
```bash
npm i -g vercel
```

### 2. 登入 Vercel
```bash
vercel login
```

### 3. 部署到 Vercel
```bash
# 預覽部署
vercel

# 正式部署
vercel --prod
```

### 4. 在 Vercel Dashboard 設置環境變數
1. 前往 Vercel 專案設置
2. 點選 "Environment Variables"
3. 添加以下變數：
   - `ADMIN_USERNAME`: 您的管理員帳號
   - `ADMIN_PASSWORD`: 您的安全密碼

## 其他部署平台

### Netlify
1. 建立 `netlify.toml` 配置檔案
2. 設置環境變數
3. 連接 Git 倉庫自動部署

### Cloudflare Pages
1. 連接 Git 倉庫
2. 設置建構命令：`npm run build`
3. 設置環境變數

## 部署後驗證

### 1. 功能測試
- [ ] 首頁正常載入
- [ ] 時間軸頁面顯示正確
- [ ] 深色/淺色模式切換正常
- [ ] 標籤在深色模式下可見

### 2. 管理員功能測試
- [ ] 訪問 `https://your-domain.com/secure-admin-panel-x9z8k/`
- [ ] HTTP Basic 認證正常工作
- [ ] 經驗管理介面可以正常載入
- [ ] API 端點需要認證才能訪問

### 3. 安全檢查
- [ ] `/admin/` 路徑已移除（應該返回 404）
- [ ] API 端點無認證時返回 401
- [ ] `.env` 檔案未被推送到 Git

## 更新密碼

如需更改管理員密碼：

1. 在 Vercel Dashboard 更新環境變數
2. 重新部署應用程式
3. 或使用 Vercel CLI：
```bash
vercel env add ADMIN_PASSWORD
```

## 故障排除

### 常見問題

1. **API 認證失效**
   - 檢查環境變數是否正確設置
   - 確認密碼沒有特殊字符導致解析問題

2. **時間軸無法載入**
   - 檢查 `experiences.yaml` 檔案格式是否正確
   - 檢查 YAML 解析是否正常

3. **樣式問題**
   - 清除瀏覽器快取
   - 檢查 Tailwind CSS 建構是否正常

## 備份與恢復

### 備份經驗資料
定期備份 `src/data/experiences.yaml` 檔案：

```bash
# 創建備份
cp src/data/experiences.yaml backup/experiences-$(date +%Y%m%d).yaml
```

### 恢復資料
```bash
# 從備份恢復
cp backup/experiences-YYYYMMDD.yaml src/data/experiences.yaml
```

## 監控與維護

建議定期檢查：
- 網站載入速度
- 管理員認證是否正常
- SSL 憑證狀態
- 依賴套件更新

## 安全建議

1. **強密碼政策**
   - 使用至少 12 個字符
   - 包含大小寫字母、數字和特殊符號
   - 定期更換密碼

2. **存取監控**
   - 定期檢查 Vercel 日誌
   - 監控異常存取嘗試

3. **HTTPS 設置**
   - 確保所有連線都使用 HTTPS
   - 設置適當的安全標頭
