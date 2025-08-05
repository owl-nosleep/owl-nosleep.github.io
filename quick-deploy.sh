#!/bin/bash

# 快速部署腳本 - 簡化版部署流程
# 使用方法: ./quick-deploy.sh [preview|prod]
# 適用於開發期間的快速測試部署

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

# 快速檢查
quick_check() {
    print_status "執行快速檢查..."
    
    # 檢查是否在正確的目錄
    if [ ! -f "package.json" ]; then
        print_error "未找到 package.json，請確保在正確的專案目錄中執行"
        exit 1
    fi
    
    # 檢查 Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js 未安裝"
        exit 1
    fi
    
    # 檢查包管理器
    if command -v pnpm &> /dev/null; then
        PKG_MANAGER="pnpm"
    elif command -v npm &> /dev/null; then
        PKG_MANAGER="npm"
    else
        print_error "未找到包管理器 (npm 或 pnpm)"
        exit 1
    fi
    
    # 檢查 Vercel CLI
    if ! command -v vercel &> /dev/null; then
        print_warning "Vercel CLI 未安裝，正在安裝..."
        npm install -g vercel
    fi
    
    print_success "快速檢查完成，使用包管理器: $PKG_MANAGER"
}

# 快速構建
quick_build() {
    print_status "執行快速構建..."
    
    # 跳過依賴安裝（假設已安裝）
    if [ ! -d "node_modules" ]; then
        print_status "安裝依賴..."
        $PKG_MANAGER install
    else
        print_status "跳過依賴安裝 (node_modules 已存在)"
    fi
    
    # 快速構建（跳過類型檢查）
    print_status "構建專案..."
    $PKG_MANAGER run build
    
    print_success "構建完成"
}

# 快速部署
quick_deploy() {
    local mode=$1
    
    print_status "開始快速部署..."
    
    if [ "$mode" = "prod" ] || [ "$mode" = "production" ]; then
        print_status "部署到生產環境..."
        vercel --prod --yes
    else
        print_status "部署到預覽環境..."
        vercel --yes
    fi
    
    print_success "部署完成"
}

# 顯示結果
show_result() {
    local mode=$1
    
    echo ""
    echo "🎉 快速部署完成！"
    echo ""
    
    if [ "$mode" = "prod" ] || [ "$mode" = "production" ]; then
        echo "✅ 生產環境部署成功"
        echo "🔗 網站: https://owld.tw"
    else
        echo "✅ 預覽環境部署成功"
        echo "🔗 查看 Vercel 輸出獲取預覽 URL"
    fi
    
    echo ""
    echo "快速驗證清單："
    echo "• 首頁載入正常"
    echo "• 導航選單顯示 '文章' (而非 '彙整')"
    echo "• GitHub 連結指向 Fuwari 專案"
    echo "• 時間軸中 '成大資安社' 顯示為成就 🏆"
    echo "• 背景橫幅效果正常"
}

# 主要執行流程
main() {
    local deploy_mode=${1:-preview}
    
    echo "=========================================="
    echo "       OWLD Blog 快速部署"
    echo "=========================================="
    echo ""
    
    print_status "開始快速部署流程 (模式: $deploy_mode)"
    echo ""
    
    # 記錄開始時間
    start_time=$(date +%s)
    
    # 執行快速流程
    quick_check
    quick_build
    quick_deploy "$deploy_mode"
    
    # 計算耗時
    end_time=$(date +%s)
    duration=$((end_time - start_time))
    
    show_result "$deploy_mode"
    
    echo ""
    print_success "快速部署完成，耗時: ${duration}秒"
    echo "=========================================="
}

# 處理命令行參數
case "${1:-}" in
    "preview"|"pre"|"")
        main "preview"
        ;;
    "production"|"prod")
        main "production"
        ;;
    "help"|"-h"|"--help")
        echo "OWLD Blog 快速部署腳本"
        echo ""
        echo "使用方法: $0 [preview|prod]"
        echo ""
        echo "選項:"
        echo "  preview/pre  預覽部署 (預設)"
        echo "  prod         生產部署"
        echo "  help         顯示此說明"
        echo ""
        echo "特點:"
        echo "• 跳過完整的安全檢查"
        echo "• 跳過類型檢查（加速構建）"
        echo "• 自動檢測包管理器 (pnpm/npm)"
        echo "• 適合開發期間快速測試"
        echo ""
        exit 0
        ;;
    *)
        print_error "未知的參數: $1"
        echo "使用 '$0 help' 查看可用選項"
        exit 1
        ;;
esac