---
title: "【30天學習新語言-Ruby】Day 4：使用 HTTP 請求偵測 Web 服務狀態"
published: 2025-08-13T04:16:46.000Z
description: ""
tags: [Learning, Ruby, 30天學Ruby挑戰]
category: Learning
draft: false
---

## 💡 為什麼要會 HTTP 偵測？
在做滲透測試的時候，只知道 port 開著還不夠，
我們還需要知道這個 port 上跑的是什麼服務，
特別是 Web 服務，因為 Web 通常是攻擊面最大的地方。

今天會用 Ruby 的 `net/http` 來偵測目標是否為 HTTP/HTTPS 服務，
並且抓取一些基本資訊，像是 Server Header、回應狀態碼等等，
這些資訊對後續的滲透測試都很有幫助。

## 🎯 大綱
- 學會使用 `net/http` 發送 HTTP 請求
- 偵測服務是 HTTP 還是 HTTPS
- 抓取 HTTP Response Headers
- 處理連線錯誤和逾時

## 📚 知識點
- `require 'net/http'` -- Ruby 內建的 HTTP 客戶端
- `URI.parse(url)` -- 解析 URL 字串
- `Net::HTTP.get_response()` -- 發送 GET 請求
- `response.code` -- 取得 HTTP 狀態碼
- `response.each_header` -- 遍歷所有 headers
- `Timeout.timeout()` -- 設定連線逾時

## 💻 實作
```ruby
require 'net/http'
require 'uri'
require 'timeout'

def check_web_service(target, port)
  protocols = ['http', 'https']
  
  protocols.each do |protocol|
    begin
      url = "#{protocol}://#{target}:#{port}"
      uri = URI.parse(url)
      
      # 設定 5 秒逾時
      Timeout.timeout(5) do
        response = Net::HTTP.get_response(uri)
        
        puts "#{url} is alive!"
        puts "    Status Code: #{response.code}"
        puts "    Server: #{response['server']}" if response['server']
        puts "    Content-Type: #{response['content-type']}" if response['content-type']
        
        # 列出其他有趣的 headers
        interesting_headers = ['x-powered-by', 'x-aspnet-version', 'x-generator']
        interesting_headers.each do |header|
          if response[header]
            puts "    #{header}: #{response[header]}"
          end
        end
        
        return true
      end
    rescue Timeout::Error
      puts "#{url} timeout"
    rescue => e
      puts "#{url} error: #{e.message}"
    end
  end
  
  false
end

# 掃描常見的 Web port
targets = {
  '127.0.0.1' => [80, 443, 8080, 8443, 3000, 5000]
}

targets.each do |ip, ports|
  puts "\nScanning #{ip}..."
  ports.each do |port|
    check_web_service(ip, port)
  end
end
```

## 🚀 執行方式

1. 建立檔案 `web_detector.rb`
2. 執行指令：
```bash
ruby web_detector.rb
```
3. 如果有 Web 服務在跑，會看到類似這樣的輸出：

```
Scanning 127.0.0.1...
http://127.0.0.1:80 is alive!
    Status Code: 200
    Server: nginx/1.18.0
    Content-Type: text/html
http://127.0.0.1:3000 is alive!
    Status Code: 200
    Server: WEBrick/1.7.0
    x-powered-by: Express
```


![image](https://hackmd.io/_uploads/rkOK9zXcgx.png)
![image](https://hackmd.io/_uploads/rk5Isfmcgg.png)

