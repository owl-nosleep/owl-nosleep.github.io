---
title: "【30天學習新語言-Ruby】Day 5：基本 HTML 解析找出潛在攻擊點"
published: 2025-08-14T04:16:46.000Z
description: ""
tags: [Learning, Ruby, 30天學Ruby挑戰]
category: Learning
draft: false
---

## 💡 為什麼要解析 HTML？
找到 Web 服務之後，下一步就是分析網頁內容了。
但手動看 HTML 原始碼應該蠻累的 XD，而且容易漏東西，
這時候就可以用自動化工具來幫忙。

今天要用 Ruby 的 `nokogiri` 算是一個很強大的 HTML 解析器，
它可以幫我們快速找出網頁中的表單、連結、註解等等，
這些都會是滲透測試的重要目標。

p.s. Nokogiri 這個名字是日文「鋸」的意思，
猜測應該是這個工具可以把 HTML 鋸開來才這樣取名w

## 🎯 大綱
- 安裝並使用 `nokogiri` gem
- 解析 HTML 找出所有表單
- 提取所有超連結
- 搜尋 HTML 註解（可能有敏感資訊）
- 找出所有 JavaScript 檔案

## 📚 知識點
- `gem install nokogiri` -- 安裝第三方套件
- `Nokogiri::HTML()` -- 解析 HTML 字串
- `doc.css()` -- 使用 CSS selector 查詢
- `doc.xpath()` -- 使用 XPath 查詢
- `element['attribute']` -- 取得元素屬性
- `element.text` -- 取得元素文字內容

## 💻 實作
```ruby
require 'nokogiri'
require 'open-uri'
require 'uri'

def analyze_webpage(url)
  begin
    # 開啟網頁並解析
    html = URI.open(url)
    doc = Nokogiri::HTML(html)
    
    puts "\nAnalyzing: #{url}"
    puts "=" * 50
    
    # 1. 找出所有 Form
    forms = doc.css('form')
    if forms.any?
      puts "\nFound #{forms.count} form(s):"
      forms.each_with_index do |form, i|
        puts "  Form ##{i+1}:"
        puts "    Action: #{form['action'] || 'N/A'}"
        puts "    Method: #{form['method'] || 'GET'}"
        
        # 列出所有 input 欄位
        inputs = form.css('input')
        if inputs.any?
          puts "    Inputs:"
          inputs.each do |input|
            puts "      - #{input['name']} (type: #{input['type']})"
          end
        end
      end
    end
    
    # 2. 提取所有連結
    links = doc.css('a[href]')
    if links.any?
      puts "\nFound #{links.count} link(s):"
      unique_links = links.map { |link| link['href'] }.uniq
      unique_links[0..9].each do |link|  # 只顯示前10個
        puts "  - #{link}"
      end
      puts "  ... and #{unique_links.count - 10} more" if unique_links.count > 10
    end
    
    # 3. 搜尋 HTML 註解
    comments = doc.xpath('//comment()')
    if comments.any?
      puts "\nFound #{comments.count} HTML comment(s):"
      comments.each do |comment|
        content = comment.text.strip
        next if content.empty?
        puts "  <!-- #{content[0..100]}#{content.length > 100 ? '...' : ''} -->"
      end
    end
    
    # 4. 找出所有 JavaScript 檔案
    scripts = doc.css('script[src]')
    if scripts.any?
      puts "\nFound #{scripts.count} JavaScript file(s):"
      scripts.each do |script|
        puts "  - #{script['src']}"
      end
    end
    
    # 5. 找出可能的 API endpoint
    api_patterns = ['/api/', '/v1/', '/v2/', '/graphql', '/rest/']
    all_urls = (links.map { |l| l['href'] } + scripts.map { |s| s['src'] }).compact
    api_endpoints = all_urls.select { |url| api_patterns.any? { |p| url.include?(p) } }
    
    if api_endpoints.any?
      puts "\nPossible API endpoints:"
      api_endpoints.uniq.each do |endpoint|
        puts "  - #{endpoint}"
      end
    end
    
  rescue => e
    puts "Error: #{e.message}"
  end
end

# 測試目標
targets = [
  'http://example.com',
  'http://testphp.vulnweb.com'  # 測試用的脆弱網站
]

targets.each do |target|
  analyze_webpage(target)
end

```

## 🚀 執行方式

1. 先安裝 nokogiri：
```bash
gem install nokogiri
```

2. 建立檔案 `html_analyzer.rb`

3. 執行指令：
```bash
ruby html_analyzer.rb
```

4. 預期輸出會像這樣：

```
Analyzing: http://example.com
==================================================

Found 1 form(s):
  Form #1:
    Action: /search
    Method: POST
    Inputs:
      - q (type: text)
      - submit (type: submit)

Found 15 link(s):
  - /about
  - /contact
  - /api/v1/users
  ...

Possible API endpoints:
  - /api/v1/users
  - /api/v1/posts
```

有了這些資訊，就能快速了解網站架構，找出潛在的攻擊點了

![image](https://hackmd.io/_uploads/ByQYCfXqxg.png)
