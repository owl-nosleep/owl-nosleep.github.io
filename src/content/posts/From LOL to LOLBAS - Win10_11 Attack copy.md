---
title: "【30天學習新語言-Ruby】Day 1：用 Ruby 寫一個簡易 Port Scanner"
published: 2025-08-09T15:41:46.000Z
description: ""
tags: [Learning, Ruby, 30天學Ruby挑戰]
category: Learning
draft: false
---
# 【30天學習新語言-Ruby】Day 1：用 Ruby 寫一個簡易 Port Scanner 

## 💡 為什麼學 Ruby？
先講一下 Ruby 跟其他語言的差別好了，
Ruby 是強調「開發者體驗」的語言，所以很適合拿來快速開發工具跟腳本，
如果跟 Python 比較的話，Ruby 在字串處理、DSL設計上更靈活，
網頁跟自動化相關生態也可以很常看到它的身影出現。

舉個例子來說：Metasploit 就是用 Ruby 寫的


這邊也整理了一些查到的優點：
- **快速原型開發**：少量程式碼即可完成想法驗證  
- **易讀性高**：即使隔很久回來看程式碼也容易理解  
- **資安工具生態**：許多滲透測試框架與工具（Metasploit、Ronin）使用 Ruby  
- **跨平台支援**：同一份程式碼在 Windows、Linux、macOS 上幾乎不需修改即可運行  


## 🎯 大綱
- 學會在 Ruby 載入 `socket` 標準庫
- 使用 `TCPSocket` 嘗試連線
- 抓 Exception，判斷 port 開關狀態

## 📚 知識點
- `require 'socket'` -- 可以想像成是 python 的 import
- `TCPSocket.new(ip, port)` -- 可以拿來 TCP 連線
- `begin…rescue…end` 例外處理
- `(1..100).each do |port|` 迴圈掃描多個埠 -- for loop
- `puts` 輸出內容

## 💻 實作
```ruby
require 'socket'

ip = '127.0.0.1'  # 目標 IP
(1..100).each do |port| # Ruby 的 for loop
  begin
    socket = TCPSocket.new(ip, port)
    puts "Port #{port} is open on #{ip}"
    socket.close
  rescue Errno::ECONNREFUSED
    puts "Port #{port} is closed on #{ip}"
  end
end # 記得最後也要一個end！
```

## 🚀 執行方式

1. 建立檔案 `port_scanner.rb` --記得副檔名是 .rb
2. 我自己是用 wsl 在 Linux 環境下跑
3. 執行指令：
```bash
ruby port_scanner.rb
```
4. 如果有服務（例如在 80 port 開了 HTTP Server），你會看到：

```
Port 80 is open on 127.0.0.1
```

![image](https://hackmd.io/_uploads/HkRBhJBdgl.png)

![image](https://hackmd.io/_uploads/SJyDhyBuex.png)
