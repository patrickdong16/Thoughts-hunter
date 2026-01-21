#!/bin/bash

# 思想雷达 Web 版本一键部署脚本

echo "📱 思想雷达 Web 版本部署"
echo "========================"
echo ""

# 检查是否在 web 目录
if [ ! -f "index.html" ]; then
    echo "❌ 错误: 请在 web 目录下运行此脚本"
    echo "   cd web && ./deploy.sh"
    exit 1
fi

echo "📦 步骤 1: 安装/检查 Vercel CLI"
if ! command -v vercel &> /dev/null; then
    echo "→ 正在通过 npx 使用 Vercel..."
    VERCEL_CMD="npx vercel"
else
    echo "✓ Vercel CLI 已安装"
    VERCEL_CMD="vercel"
fi

echo ""
echo "🚀 步骤 2: 部署到 Vercel"
echo "→ 首次部署需要登录 Vercel 账号"
echo "→ 按照提示操作即可"
echo ""

# 执行部署
$VERCEL_CMD

echo ""
echo "✅ 部署完成!"
echo ""
echo "📝 后续步骤:"
echo "1. 复制 Vercel 提供的 URL"
echo "2. 用手机浏览器打开该 URL"
echo "3. 测试应用功能"
echo ""
echo "⚠️  注意: 需要配置后端 API 地址"
echo "   编辑 index.html 第 692 行,替换为你的后端地址"
echo ""
