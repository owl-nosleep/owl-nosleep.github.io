---
title: "【30天學習新語言-Ruby】Day 3：Banner Grabbing 抓取服務資訊"
published: 2025-08-12T04:16:46.000Z
description: ""
tags: [Learning, Ruby, 30天學Ruby挑戰]
category: Learning
draft: false
---

# 【30天學習新語言-Ruby】Day 3：Banner Grabbing 抓取服務資訊

## 💡 為什麼 Banner Grabbing 在資安很重要？
在偵查的時候，知道某個 Port 有沒有開還不夠，通常還會去看**背後是什麼服務**、**版本是多少**。  
**Banner Grabbing** 就是透過連線到該服務，讀取它回傳的第一段訊息（Banner），來識別服務跟版本。

常見的一些應用：
- 判斷 HTTP Server 是 Apache、Nginx 還是其他  
- 確認 FTP、SMTP 等服務的版本  
- 收集後續滲透所需的目標環境資訊  

---

## 🎯 大綱
- 用 Ruby 連線後嘗試讀取服務回應
- 設定讀取 Timeout，避免卡住
- 搭配多執行緒加速

---

## 📚 知識點
- `socket = TCPSocket.new(ip, port)` -- 建立 TCP 連線  
- `socket.recv(1024)` -- 讀取 1024 bytes 回應  
- `socket.close` -- 關閉連線  
- `rescue` 捕捉例外（拒絕、逾時）  
- `Timeout.timeout(sec) { … }` -- 限制等待時間  

---

## 💻 實作
```ruby
require 'socket'
require 'timeout'

ip = '127.0.0.1'
ports = [21, 22, 25, 80, 443] # 常見有 Banner 的服務

ports.each do |port|
  begin
    Timeout.timeout(2) do
      socket = TCPSocket.new(ip, port)
      banner = socket.recv(1024) # 嘗試讀取回應
      puts "Port #{port} is open - Banner: #{banner.strip}"
      socket.close
    end
  rescue Errno::ECONNREFUSED
    puts "Port #{port} is closed"
  rescue Errno::ETIMEDOUT, Timeout::Error
    puts "Port #{port} connection timed out"
  rescue => e
    puts "Error on port #{port}: #{e.class} - #{e.message}"
  end
end
````

---

## 🚀 指令

1. 建立檔案 `banner_grabber.rb`
2. 貼上程式碼
3. 執行：

```bash
ruby banner_grabber.rb
```

4. 如果目標在某個 Port 有服務，會看到類似：

```
Port 80 is open - Banner: HTTP/1.1 400 Bad Request
Server: nginx/1.18.0 (Ubuntu)
```

---

## ⚙️ 補充：多執行緒 Banner Grabbing

```ruby
require 'socket'
require 'timeout'

ip = '127.0.0.1'
ports = (1..1024).to_a

threads = ports.map do |port|
  Thread.new(port) do |p|
    begin
      Timeout.timeout(2) do
        socket = TCPSocket.new(ip, p)
        banner = socket.recv(1024)
        puts "[+] Port #{p} is open - Banner: #{banner.strip}" unless banner.empty?
        socket.close
      end
    rescue Errno::ECONNREFUSED
      # 關閉的 Port 不輸出，避免刷屏
    rescue Timeout::Error, Errno::ETIMEDOUT
      # 超時忽略
    end
  end
end

threads.each(&:join)
```

這樣可以同時抓取多個 Port 的 Banner，速度會比單執行緒快很多。

---
這邊用一台HackTheBox的機器來實作：
![image](https://hackmd.io/_uploads/H1bpCpvuee.png)
