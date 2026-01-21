#!/bin/bash

# 思想雷达 Web 版本 - 腾讯云 CloudBase 部署脚本
# 适用于中国大陆用户访问

echo "📱 思想雷达 Web 版本 - 腾讯云 CloudBase 部署"
echo "================================================"
echo ""

# 检查是否在 web 目录
if [ ! -f "index.html" ]; then
    echo "❌ 错误: 请在 web 目录下运行此脚本"
    echo "   cd web && ./deploy-cloudbase.sh"
    exit 1
fi

# 使用 npx 运行，无需全局安装
TCB_CMD="npx -y @cloudbase/cli"

echo "📦 步骤 1: 使用 npx 运行 CloudBase CLI（无需安装）"
echo "✓ 将使用 npx 自动下载并运行"

echo ""
echo "🔐 步骤 2: 登录腾讯云"
echo "→ 如果未登录，将打开浏览器进行授权"
$TCB_CMD login

echo ""
echo "📋 步骤 3: 初始化环境"
echo "→ 如果没有 CloudBase 环境，请先在控制台创建:"
echo "   https://console.cloud.tencent.com/tcb/env/index"
echo ""
read -p "请输入你的 CloudBase 环境 ID (env-xxxxxx): " ENV_ID

if [ -z "$ENV_ID" ]; then
    echo "❌ 错误: 环境 ID 不能为空"
    exit 1
fi

echo ""
echo "🚀 步骤 4: 部署到 CloudBase"
# 使用 hosting 命令直接部署静态文件
$TCB_CMD hosting deploy . -e $ENV_ID

echo ""
echo "✅ 部署完成!"
echo ""
echo "📝 访问地址:"
echo "   https://${ENV_ID}.tcloudbaseapp.com"
echo ""
echo "⚠️  注意事项:"
echo "1. 首次部署可能需要几分钟生效"
echo "2. 如果无法访问，请在控制台检查静态托管是否已开启"
echo "3. 可以在控制台绑定自定义域名（需要备案）"
echo ""
