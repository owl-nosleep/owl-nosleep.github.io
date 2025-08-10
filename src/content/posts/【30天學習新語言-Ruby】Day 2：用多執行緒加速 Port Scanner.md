---
title: "【30天學習新語言-Ruby】Day 2：用多執行緒加速 Port Scanner Scanner"
published: 2025-08-10T23:41:46.000Z
description: ""
tags: [Learning, Ruby, 30天學Ruby挑戰]
category: Learning
draft: false
---

# 【30 天學習新語言-Ruby】Day 2：用多執行緒加速 Port Scanner

## 💡 為什麼要用多執行緒？

在資安方面，很多任務都是 **I/O 密集型**（例如網路掃描、HTTP 請求），
如果只用單執行緒，就會一個一個等，速度非常慢。

多執行緒（Multi-threading）的好處是可以**同時**對多個目標發送請求，
大幅縮短掃描時間。
雖然 Ruby 有 GIL（Global Interpreter Lock）限制，但對於網路 I/O 任務，多執行緒就會很有效。

這邊也整理一些常見應用：

- 掃描大量 port
- 對多個 URL 同時發送請求
- 弱密碼爆破測試（多帳號並行）

---

## 🎯 大綱

- 學會在 Ruby 建立多個執行緒
- 同時掃描多個 port
- 用 `join` 等待執行緒完成
- 使用 `map` 建立執行緒陣列

---

## 📚 知識點

- `Thread.new { … }` -- 建立一個新執行緒
- `join` / `&:join` -- 等待執行緒結束
- `map` -- 建立新陣列（這裡用來儲存 Thread）
- 在執行緒中使用 `begin…rescue…end` 捕捉例外

---

## 💻 實作

```ruby
require 'socket'

ip = '127.0.0.1'   # 目標 IP
ports = (1..100).to_a  # 埠口範圍轉成 Array

threads = ports.map do |port|
  Thread.new(port) do |p|
    begin
      socket = TCPSocket.new(ip, p)
      puts "Port #{p} is open on #{ip}"
      socket.close
    rescue Errno::ECONNREFUSED
      puts "Port #{p} is closed on #{ip}"
    rescue Errno::ETIMEDOUT
      puts "Port #{p} timed out on #{ip}"
    end
  end
end

threads.each(&:join) # 等待所有執行緒完成
```

---

## 🚀 指令

1. 建立檔案 `threaded_scanner.rb`
2. 執行：

```bash
ruby threaded_scanner.rb
```

3. 你會發現速度比 Day 1 明顯加快（因為是多執行緒並行）

---

## ⚙️ 附註

如果一次開太多執行緒，可能：

- 吃光系統資源
- 被目標機器 ban 掉

可以限制同時的執行緒數，例如一次最多 10 條：

```ruby
require 'socket'

ip = '127.0.0.1'
ports = (1..100).to_a
max_threads = 10
threads = []

ports.each do |port|
  threads << Thread.new do
    begin
      socket = TCPSocket.new(ip, port)
      puts "Port #{port} is open"
      socket.close
    rescue Errno::ECONNREFUSED
      puts "Port #{port} is closed"
    end
  end

  # 超過上限就等待其中一個執行緒結束
  if threads.size >= max_threads
    threads.shift.join
  end
end

threads.each(&:join)
```

---

![image](https://hackmd.io/_uploads/B1AqR4Udxl.png)
![image](https://hackmd.io/_uploads/HkHn0N8uex.png)
