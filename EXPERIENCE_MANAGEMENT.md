# 經歷時間線管理系統使用說明

## 主要改進

### 1. 移除經歷詳細內容顯示
- Timeline 現在只顯示標題和簡短描述
- 不會顯示 Markdown 格式的詳細內容
- 保持時間線的簡潔性

### 2. 安全的管理面板
原有的 `/admin/` 路徑已被移除，新的管理面板位於：
```
/secure-admin-panel-x9z8k/
```

這個路徑包含：
- `/secure-admin-panel-x9z8k/` - 管理首頁
- `/secure-admin-panel-x9z8k/experiences-table` - 經歷表格檢視
- `/secure-admin-panel-x9z8k/experiences-editor` - 互動式編輯器

## 安全措施

### 1. HTTP Basic Authentication
所有管理頁面都受到密碼保護，需要提供使用者名稱和密碼。

### 2. 環境變數設定
在 `.env` 檔案中設定管理員憑證：
```bash
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_secure_password_here
```

**重要安全提醒：**
- 請修改預設密碼為強密碼
- `.env` 檔案已加入 `.gitignore`，不會被推送到 Git 倉庫
- 在 Vercel 等部署平台上，需要在環境變數設定中添加這些變數

### 3. 隱藏的管理路徑
- 使用難以猜測的路徑名稱
- 不要在公開場合分享管理頁面連結
- 建議定期更換路徑名稱

## 如何使用

### 1. 本地開發
1. 在 `.env` 檔案中設定您的密碼
2. 啟動開發服務器：`pnpm dev`
3. 訪問 `http://localhost:4321/secure-admin-panel-x9z8k/`
4. 輸入設定的使用者名稱和密碼

### 2. 生產環境部署
在 Vercel 或其他平台上：
1. 在部署平台的環境變數設定中添加：
   - `ADMIN_USERNAME`: 您的管理員使用者名稱
   - `ADMIN_PASSWORD`: 您的安全密碼
2. 重新部署專案
3. 訪問 `https://your-domain.com/secure-admin-panel-x9z8k/`

### 3. 經歷管理
1. **查看經歷**: 使用表格檢視頁面
2. **編輯經歷**: 使用互動式編輯器
   - 新增經歷項目
   - 編輯現有經歷
   - 刪除不需要的經歷
   - 調整排序
3. **保存變更**: 點擊"儲存所有變更"按鈕

## 資料結構

經歷資料存儲在 `src/data/experiences.yaml` 檔案中，格式如下：

```yaml
experiences:
  - year: "2025"
    title: "經歷標題"
    description: "簡短描述"
    type: "achievement"  # achievement, education, competition, certification
    order: 1  # 同一年份內的排序
    content: |  # 這個欄位現在不會在時間線上顯示
      詳細描述內容
```

## 安全最佳實踐

1. **強密碼**: 使用包含大小寫字母、數字和特殊符號的強密碼
2. **定期更換**: 建議定期更換管理員密碼
3. **HTTPS**: 確保在生產環境中使用 HTTPS
4. **存取控制**: 不要在公共場所使用管理面板
5. **清除快取**: 使用後清除瀏覽器的認證快取
6. **監控**: 定期檢查網站存取日誌

## 故障排除

### 無法存取管理面板
1. 確認環境變數已正確設定
2. 檢查使用者名稱和密碼是否正確
3. 確認 `.env` 檔案格式正確

### 無法保存經歷
1. 確認已通過身份驗證
2. 檢查瀏覽器控制台是否有錯誤訊息
3. 確認 API 端點可正常存取

## 備份建議

定期備份 `src/data/experiences.yaml` 檔案，以防資料遺失。

---

這個系統現在提供了安全、集中化的經歷管理方式，既保護了您的管理介面，又保持了時間線的簡潔美觀。
