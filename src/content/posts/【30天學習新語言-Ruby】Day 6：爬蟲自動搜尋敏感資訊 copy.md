---
title: "【30天學習新語言-Ruby】Day 6：爬蟲自動搜尋敏感資訊"
published: 2025-08-15T04:16:46.000Z
description: ""
tags: [Learning, Ruby, 30天學Ruby挑戰]
category: Learning
draft: false
---

## 💡 為什麼要寫爬蟲？
如果去看常見的一些資安事件，
應該會發現很多資料外洩其實不是被駭，
而是開發者不小心把敏感資訊放在公開的地方。

像是 API key 寫在 JavaScript 裡、
測試帳號密碼放在註解、
或是 Email 地址沒有做好保護等等。

今天要寫一個爬蟲，自動在網頁中搜尋這些可能的敏感資訊，
再用正規表達式（Regex）來找出特定模式的資料。

## 🎯 大綱
- 使用 `open-uri` 抓取網頁內容
- 撰寫 Regex 找出 Email、API Key、密碼等
- 遞迴爬取多層網頁
- 將結果輸出成報告

## 📚 知識點
- `URI.open()` -- 開啟網頁並讀取內容
- `/pattern/` -- Ruby 的正規表達式
- `string.scan(/regex/)` -- 找出所有符合的字串
- `Set.new` -- 使用集合避免重複
- `URI.join()` -- 處理相對路徑

## 💻 實作
```ruby
require 'open-uri'
require 'nokogiri'
require 'uri'
require 'set'

class SensitiveCrawler
  def initialize(base_url, max_depth = 2)
    @base_url = base_url
    @max_depth = max_depth
    @visited = Set.new
    @findings = {
      emails: Set.new,
      api_keys: Set.new,
      passwords: Set.new,
      tokens: Set.new,
      private_ips: Set.new,
      s3_buckets: Set.new
    }
  end
  
  # 定義各種敏感資訊的 Regex
  def patterns
    {
      emails: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
      
      # 常見的 API Key 格式
      api_keys: /(?:api[_\-]?key|apikey|api_secret)[\s]*[:=][\s]*["']?([a-zA-Z0-9_-]{20,})["']?/i,
      
      # AWS Access Key
      aws_keys: /AKIA[0-9A-Z]{16}/,
      
      # 可能的密碼
      passwords: /(?:password|passwd|pwd)[\s]*[:=][\s]*["']([^"']{4,})["']/i,
      
      # JWT Token
      tokens: /eyJ[A-Za-z0-9_=-]+\.[A-Za-z0-9_=-]+\.?[A-Za-z0-9_.+\/=-]*/,
      
      # 私有 IP
      private_ips: /(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})/,
      
      # S3 Bucket
      s3_buckets: /(?:s3\.amazonaws\.com\/[a-z0-9.-]+|[a-z0-9.-]+\.s3\.amazonaws\.com)/i
    }
  end
  
  def crawl(url = @base_url, depth = 0)
    return if depth > @max_depth
    return if @visited.include?(url)
    
    @visited.add(url)
    puts "Crawling: #{url} (depth: #{depth})"
    
    begin
      html = URI.open(url, 'User-Agent' => 'Mozilla/5.0')
      content = html.read
      
      # 搜尋敏感資訊
      search_sensitive_data(content, url)
      
      # 如果還沒到最大深度，繼續爬取連結
      if depth < @max_depth
        doc = Nokogiri::HTML(content)
        links = doc.css('a[href]').map { |link| link['href'] }
        
        links.each do |link|
          next if link.nil? || link.empty?
          
          # 處理相對路徑
          begin
            absolute_url = URI.join(url, link).to_s
            # 只爬取同網域的連結
            if absolute_url.start_with?(@base_url)
              crawl(absolute_url, depth + 1)
            end
          rescue => e
            # 忽略無效的 URL
          end
        end
      end
      
    rescue => e
      puts "Error crawling #{url}: #{e.message}"
    end
  end
  
  def search_sensitive_data(content, source_url)
    patterns.each do |type, pattern|
      matches = content.scan(pattern)
      next if matches.empty?
      
      matches.flatten.each do |match|
        next if match.nil? || match.empty?
        
        # 根據類型儲存
        case type
        when :emails
          @findings[:emails].add(match) if match.include?('@')
        when :api_keys, :aws_keys
          @findings[:api_keys].add(match)
        when :passwords
          # 過濾掉明顯的假密碼
          unless match =~ /^(password|example|test|demo|sample)$/i
            @findings[:passwords].add("#{match} (found in: #{source_url})")
          end
        when :tokens
          @findings[:tokens].add(match[0..50] + '...') # 只顯示部分
        when :private_ips
          @findings[:private_ips].add(match)
        when :s3_buckets
          @findings[:s3_buckets].add(match)
        end
      end
    end
  end
  
  def report
    puts "\n" + "=" * 60
    puts "SENSITIVE DATA REPORT"
    puts "=" * 60
    
    @findings.each do |type, items|
      next if items.empty?
      
      puts "\n#{type.to_s.upcase.gsub('_', ' ')} (Found: #{items.size})"
      items.first(10).each do |item|
        puts "    - #{item}"
      end
      puts "    ... and #{items.size - 10} more" if items.size > 10
    end
    
    if @findings.values.all?(&:empty?)
      puts "\nNo sensitive data found"
    end
    
    puts "\nTotal pages crawled: #{@visited.size}"
  end
end

# 使用範例
if __FILE__ == $0
  target = ARGV[0] || 'http://example.com'
  
  puts "Starting sensitive data crawler"
  puts "Target: #{target}"
  puts "Max depth: 2"
  
  crawler = SensitiveCrawler.new(target, 2)
  crawler.crawl
  crawler.report
end

```

## 🚀 執行方式

1. 建立檔案 `sensitive_crawler.rb`

2. 執行指令（可以指定目標網站）：
```bash
ruby sensitive_crawler.rb http://target-website.com
```

3. 預期輸出：

```
Starting sensitive data crawler
Target: http://example.com
Max depth: 2

Crawling: http://example.com (depth: 0)
Crawling: http://example.com/about (depth: 1)
Crawling: http://example.com/contact (depth: 1)

============================================================
SENSITIVE DATA REPORT
============================================================

EMAILS (Found: 5)
    - admin@example.com
    - support@example.com
    - test@example.com

API Keys (Found: 2)
    - Example123
    - Example123456

PRIVATE IPS (Found: 1)
    - 192.168.1.100

Total pages crawled: 15
```
![image](https://hackmd.io/_uploads/BJ_BgB7cex.png)
