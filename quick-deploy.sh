#!/bin/bash

# 快速部署腳本 - 自動提交並部署到 Vercel
# 使用方法: ./quick-deploy.sh [commit-message]

set -e  # 遇到錯誤時停止執行

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函數定義
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 檢查是否有 Git 變更
check_git_changes() {
    if git diff --quiet && git diff --staged --quiet; then
        print_warning "沒有檢測到任何變更，是否繼續部署？ [y/N]"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            print_status "取消部署"
            exit 0
        fi
    fi
}

# 顯示變更摘要
show_changes() {
    print_status "檢測到以下變更："
    echo ""
    
    # 顯示修改的檔案
    if ! git diff --quiet; then
        echo "📝 修改的檔案："
        git diff --name-only | sed 's/^/  - /'
        echo ""
    fi
    
    # 顯示新增的檔案
    local new_files=$(git ls-files --others --exclude-standard)
    if [ -n "$new_files" ]; then
        echo "➕ 新增的檔案："
        echo "$new_files" | sed 's/^/  - /'
        echo ""
    fi
    
    # 顯示已暫存的檔案
    if ! git diff --staged --quiet; then
        echo "📋 已暫存的檔案："
        git diff --staged --name-only | sed 's/^/  - /'
        echo ""
    fi
}

# 自動生成提交訊息
generate_commit_message() {
    local modified_files=$(git diff --name-only)
    local staged_files=$(git diff --staged --name-only)
    local new_files=$(git ls-files --others --exclude-standard)
    
    # 合併所有變更的檔案
    local all_files=$(echo -e "$modified_files\n$staged_files\n$new_files" | sort -u | grep -v '^$')
    
    # 根據檔案類型生成訊息
    if echo "$all_files" | grep -q "src/content/experiences/"; then
        echo "更新經歷內容"
    elif echo "$all_files" | grep -q "src/content/spec/about.md"; then
        echo "更新關於頁面"
    elif echo "$all_files" | grep -q "src/content/posts/"; then
        echo "更新部落格文章"
    elif echo "$all_files" | grep -q "src/pages/"; then
        echo "更新頁面"
    elif echo "$all_files" | grep -q "src/components/"; then
        echo "更新組件"
    elif echo "$all_files" | grep -q "src/styles/"; then
        echo "更新樣式"
    else
        echo "更新網站內容"
    fi
}

# 提交變更
commit_changes() {
    local commit_message="$1"
    
    print_status "準備提交變更..."
    
    # 加入所有變更
    git add .
    
    # 如果沒有提供提交訊息，自動生成或詢問
    if [ -z "$commit_message" ]; then
        local auto_message=$(generate_commit_message)
        print_status "自動生成的提交訊息: '$auto_message'"
        print_status "使用此訊息？ [Y/n]"
        read -r response
        if [[ "$response" =~ ^[Nn]$ ]]; then
            echo -n "請輸入提交訊息: "
            read -r commit_message
        else
            commit_message="$auto_message"
        fi
    fi
    
    # 提交
    git commit -m "$commit_message"
    print_success "變更已提交: $commit_message"
}

# 推送到 GitHub
push_to_github() {
    print_status "推送到 GitHub..."
    git push origin main
    print_success "已推送到 GitHub"
}

# 等待 Vercel 部署完成
wait_for_deployment() {
    print_status "等待 Vercel 自動部署完成..."
    print_status "這通常需要 2-3 分鐘..."
    
    echo ""
    echo "📊 部署進度："
    echo "  ✓ Git 提交完成"
    echo "  ✓ 推送到 GitHub 完成"
    echo "  ⏳ Vercel 自動部署中..."
    echo ""
    
    # 簡單的進度指示
    for i in {1..30}; do
        printf "."
        sleep 2
    done
    echo ""
    
    print_success "部署應該已完成！"
}

# 檢查部署狀態
check_deployment() {
    print_status "檢查網站狀態..."
    
    if command -v curl &> /dev/null; then
        if curl -s --head --fail https://owld.tw > /dev/null; then
            print_success "網站正常運行：https://owld.tw"
        else
            print_warning "無法連接到網站，可能仍在部署中"
        fi
    else
        print_status "請手動檢查網站：https://owld.tw"
    fi
}

# 主要執行流程
main() {
    local commit_message="$1"
    
    echo "=========================================="
    echo "       OWLD Blog 快速部署"
    echo "=========================================="
    echo ""
    
    # 檢查 Git 狀態
    check_git_changes
    
    # 顯示變更
    show_changes
    
    # 確認部署
    print_status "確定要部署這些變更嗎？ [Y/n]"
    read -r response
    if [[ "$response" =~ ^[Nn]$ ]]; then
        print_status "取消部署"
        exit 0
    fi
    
    # 提交變更
    commit_changes "$commit_message"
    
    # 推送到 GitHub
    push_to_github
    
    # 等待部署
    wait_for_deployment
    
    # 檢查部署狀態
    check_deployment
    
    echo ""
    print_success "快速部署完成！"
    echo ""
    echo "🌐 網站地址: https://owld.tw"
    echo "📱 GitHub: https://github.com/owl-nosleep/owl-nosleep.github.io"
    echo "🚀 Vercel: https://vercel.com/dashboard"
    echo ""
    echo "=========================================="
}

# 處理命令行參數
case "${1:-}" in
    "help"|"-h"|"--help")
        echo "快速部署腳本 - 自動提交並部署 OWLD Blog"
        echo ""
        echo "使用方法: $0 [commit-message]"
        echo ""
        echo "參數:"
        echo "  commit-message  可選的提交訊息"
        echo ""
        echo "範例:"
        echo "  $0                           # 使用自動生成的提交訊息"
        echo "  $0 \"更新關於頁面\"            # 使用自定義提交訊息"
        echo "  $0 help                      # 顯示此說明"
        exit 0
        ;;
    *)
        main "$1"
        ;;
esac
