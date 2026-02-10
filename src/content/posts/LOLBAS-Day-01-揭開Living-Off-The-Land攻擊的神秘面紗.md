---
title: "LOLBAS鐵人賽Day1揭開Living Off The Land攻擊的神秘面紗"
published: 2025-09-15T10:44:41.000Z
description: "LOLBAS 系列第 1 天"
tags: [LOLBAS, Windows, Security]
category: Research
draft: false
---

## 什麼是LOLBAS？

**LOLBAS**的全名是**Living Off The Land Binaries, Scripts and Libraries**，  
中文可以翻譯成就地取材  
這個概念是指攻擊者利用目標系統中既有的合法工具腳本或程式庫來執行惡意活動，  
而且不需要額外安裝或下載惡意軟體

白話一點，就是 **用你自己的工具來攻擊你**

## Living Off The Land的核心理念

### 1\. 隱蔽性

傳統的惡意軟體需要被投放到目標系統中，  
過程其實很容易被防毒軟體或安全監控系統偵測到  
但LOLBAS技術使用的都是系統內建的合法工具，  
這些工具本身不會被標記為惡意程式，  
所以大幅降低了被發現的機率

### 2\. 無檔案攻擊（Fileless Attack）

許多LOLBAS攻擊完全在記憶體中執行，  
不會在硬碟上留下惡意檔案，  
所以傳統基於檔案掃描的安全解決方案就會變得很難偵測

### 3\. 繞過白名單機制

就像前面說的，  
LOLBAS使用的都是系統合法程式，  
即使目標有設應用程式白名單，  
這些工具通常也在允許執行的清單中

## 為什麼LOLBAS如此危險？

### 傳統攻擊 vs LOLBAS攻擊對比

| 比較項目 | 傳統惡意軟體攻擊 | LOLBAS攻擊 |
|---|---|---|
| **檔案投放** | 需要投放惡意檔案 | 使用系統內建工具 |
| **防毒偵測** | 容易被特徵碼偵測 | 繞過傳統防毒軟體 |
| **白名單繞過** | 被應用程式白名單阻擋 | 合法程式，通常在白名單中 |
| **數位簽章** | 通常無合法簽章 | Microsoft官方簽章 |
| **系統管理員懷疑** | 明顯的惡意行為 | 看似正常的系統操作 |
| **取證分析** | 留下明顯證據 | 難以區分惡意與正常使用 |

### 合法性掩護

下面這些工具都是Microsoft官方提供或系統管理員日常使用的合法程式，它們的執行不會觸發安全警報：

| 工具名稱 | 原始用途 | 惡意利用方式 |
|---|---|---|
| `PowerShell.exe` | 系統管理自動化 | 執行惡意腳本下載檔案 |
| `Certutil.exe` | 證書管理 | 下載惡意檔案編碼解碼 |
| `Regsvr32.exe` | DLL註冊 | 執行遠程腳本 |
| `Rundll32.exe` | DLL執行器 | 執行惡意DLL函數 |
| `Mshta.exe` | HTML應用程序執行 | 執行惡意HTA檔案 |

### 功能強大

許多系統內建工具能做到的事情很多，攻擊者用LOLBAS可以達到這些事：

*   下載檔案
*   執行代碼
*   建立持久性機制
*   繞過安全限制

### 難以防範

由於這些工具是系統正常運作所必需的，企業很難完全禁用它們，只能透過監控和限制使用方式來降低風險

## LOLBAS的常見分類

| 類別 | 技術描述 | 常用工具 |
|---|---|---|
| **檔案下載** | 從遠程伺服器下載惡意檔案 | `certutil`, `bitsadmin`, `powershell` |
| **代碼執行** | 直接執行惡意代碼或腳本 | `powershell`, `wscript`, `rundll32` |
| **編碼/解碼** | 對惡意負載進行編碼隱藏 | `certutil`, `powershell` |
| **網路通訊** | 建立C&C通訊通道 | `powershell`, `wmic` |
| **檔案操作** | 操作移動或刪除檔案 | `forfiles`, `xcopy`, `robocopy` |

## LOLBAS項目的誕生

為了幫助資安人員更好了解和防範這類攻擊，  
安全研究社群創建了**LOLBAS Project**（https://lolbas-project.github.io/），  
這是一個開源專案，  
收集和整理了各種可被惡意利用的Windows系統內建工具

### 項目功能與貢獻

| 功能 | 說明 | 使用者群體 |
|---|---|---|
| **技術文件** | 詳細的濫用技術說明和範例 | 紅隊滲透測試員 |
| **檢測規則** | 提供YARASigma等檢測規則 | 藍隊SOC分析師 |
| **ATT&CK對應** | 映射到MITRE ATT&CK框架 | 威脅情報分析師 |
| **社群貢獻** | 開放式協作平台 | 資安研究人員 |

這個專案的目標是：

*   提供詳細的工具濫用技術說明
*   幫助藍隊了解潛在的攻擊向量
*   協助紅隊進行滲透測試
*   推動更好的檢測和防護機制

## 真實世界的威脅

LOLBAS技術不是單純的理論概念，在真實的網路攻擊中它們也被廣泛使用：

### 威脅行為者使用統計

| 威脅類型 | 使用LOLBAS比例 | 常用工具 | 攻擊目標 |
|---|---|---|---|
| **APT組織** | 85%+ | PowerShell, WMI, Certutil | 政府機關關鍵基礎設施 |
| **勒索軟體** | 70%+ | PsExec, WMIC, PowerShell | 企業網路醫院學校 |
| **銀行木馬** | 60%+ | PowerShell, Regsvr32 | 金融機構個人用戶 |
| **商業間諜** | 90%+ | PowerShell, BITS, Certutil | 企業研發機構 |
| **加密貨幣挖礦** | 40%+ | PowerShell, WMI | 個人電腦企業伺服器 |

### 知名APT組織使用案例

| APT組織 | 地區 | 主要使用的LOLBAS工具 | 攻擊特徵 |
|---|---|---|---|
| **APT29 (Cozy Bear)** | 俄羅斯 | PowerShell, WMI, Regsvr32 | 長期潛伏，政府目標 |
| **APT1 (Comment Crew)** | 中國 | PowerShell, Certutil | 知識產權竊取 |
| **APT28 (Fancy Bear)** | 俄羅斯 | PowerShell, WMIC | 軍事情報收集 |
| **Lazarus Group** | 北韓 | PowerShell, Rundll32 | 金融犯罪破壞活動 |
| **APT40 (Leviathan)** | 中國 | Certutil, PowerShell | 海事產業間諜 |

## 小結

Living Off The Land攻擊代表了現代網路威脅的一個重要發展方向  
攻擊者不再依賴複雜的惡意軟體，  
而是巧妙地利用目標系統中既有的工具來達成攻擊目標

## 參考資源

*   [LOLBAS Project](https://lolbas-project.github.io/)
*   [MITRE ATT&CK Framework](https://attack.mitre.org/)
*   [Microsoft Security Blog](https://www.microsoft.com/security/blog/)