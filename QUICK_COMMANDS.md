# ⚡ 思想雷达 - 快速命令表

超快速参考，所有常用命令一目了然。

---

## 🚀 启动命令

### 方式1：一键启动（推荐）

```bash
# 在项目根目录
npm run dev        # 启动后端+CMS
npm run app        # 启动移动端（新终端）
```

### 方式2：分别启动

```bash
# 终端1 - 后端
npm run server

# 终端2 - CMS
npm run cms

# 终端3 - 移动端
npm run app
```

### 方式3：手动启动

```bash
# 后端
cd backend && npm run dev

# CMS
cd cms && npm run dev

# 移动端
cd mobile && npx expo start
```

---

## 📊 数据库命令

```bash
# 初始化数据库（会清空现有数据）
npm run init-db

# 查看统计
npm run stats

# 手动连接数据库
psql thoughts_radar

# 在psql中查看表
\dt

# 查看数据
SELECT * FROM bands;
SELECT * FROM radar_items;
SELECT * FROM user_actions;

# 退出psql
\q
```

---

## 🔧 开发工具

```bash
# 环境检查
npm run check

# 安装所有依赖
npm run install:all

# 构建CMS
npm run build:cms

# 清除缓存（移动端）
cd mobile && npx expo start -c
```

---

## 🧪 测试命令

### 后端API测试

```bash
# 健康检查
curl http://localhost:3000/health

# 获取今日雷达
curl http://localhost:3000/api/radar/today

# 获取所有频段
curl http://localhost:3000/api/bands

# 创建新条目（POST）
curl -X POST http://localhost:3000/api/radar \
  -H "Content-Type: application/json" \
  -d '{
    "date": "2026-01-20",
    "freq": "T1",
    "stance": "A",
    "title": "测试标题",
    "author_name": "测试作者",
    "content": "这是一段至少500字的测试内容..."
  }'
```

### 访问地址

```bash
# CMS
open http://localhost:5173

# API文档
open http://localhost:3000

# API测试工具
open http://localhost:3000/tools/api-tester.html
```

---

## 📱 移动端命令

### Expo常用快捷键

```bash
# 在Expo终端按这些键：

i - 打开iOS模拟器
a - 打开Android模拟器
w - 打开Web版本
r - 重新加载APP
j - 打开调试器
m - 切换菜单
c - 清除缓存并重启
? - 显示所有命令
```

### 移动端配置

```bash
# iOS模拟器
echo "API_BASE_URL=http://localhost:3000" > mobile/.env

# Android模拟器
echo "API_BASE_URL=http://10.0.2.2:3000" > mobile/.env

# 真机（替换为你的IP）
echo "API_BASE_URL=http://192.168.1.100:3000" > mobile/.env

# 获取本机IP
ifconfig | grep "inet " | grep -v 127.0.0.1
```

---

## 🐛 故障排查

### 端口占用

```bash
# 查找占用端口的进程
lsof -i :3000   # 后端
lsof -i :5173   # CMS
lsof -i :8081   # Expo

# 杀死进程
kill -9 <PID>
```

### 数据库问题

```bash
# 检查PostgreSQL状态
brew services list | grep postgresql

# 启动PostgreSQL
brew services start postgresql@15

# 重启PostgreSQL
brew services restart postgresql@15

# Docker方式
docker ps | grep thoughts-radar-db
docker start thoughts-radar-db
docker restart thoughts-radar-db
```

### 清理重建

```bash
# 清理node_modules
rm -rf backend/node_modules cms/node_modules mobile/node_modules
npm run install:all

# 重置数据库
npm run init-db

# 清除Expo缓存
cd mobile
npx expo start -c
```

---

## 📦 包管理

```bash
# 安装新依赖
cd backend && npm install <package-name>
cd cms && npm install <package-name>
cd mobile && npm install <package-name>

# 更新依赖
npm update

# 检查过期依赖
npm outdated
```

---

## 🔐 环境变量

### 快速配置

```bash
# 后端
cat > backend/.env << EOF
DB_HOST=localhost
DB_PORT=5432
DB_NAME=thoughts_radar
DB_USER=postgres
DB_PASSWORD=postgres
PORT=3000
CORS_ORIGIN=http://localhost:5173
EOF

# CMS
cat > cms/.env << EOF
VITE_API_BASE_URL=http://localhost:3000
EOF

# 移动端（iOS）
cat > mobile/.env << EOF
API_BASE_URL=http://localhost:3000
EOF
```

---

## 📝 日志查看

```bash
# 后端日志（在终端1）
# 实时显示

# CMS构建日志（在终端2）
# 实时显示

# Expo日志（在终端3）
# 实时显示

# 或使用tail查看（如果重定向到文件）
tail -f backend.log
tail -f cms.log
```

---

## 🎯 快速重启

```bash
# 重启所有服务
# Ctrl+C 停止所有终端
# 然后重新运行：
npm run dev
npm run app
```

---

## 📚 文档快速访问

```bash
# 查看文档
cat LOCAL_SETUP.md      # 完整启动指南
cat CHECKLIST.md        # 检查清单
cat DEPLOY.md           # 部署指南
cat DEV_GUIDE.md        # 开发指南

# 在VS Code打开
code LOCAL_SETUP.md
```

---

## ✅ 每日工作流

### 开始工作

```bash
# 1. 启动数据库（如果未运行）
brew services start postgresql@15

# 2. 启动所有服务
npm run dev    # 后端+CMS
npm run app    # 移动端（新终端）

# 3. 等待所有服务就绪
# 后端: ✅ Server running on: http://localhost:3000
# CMS:  ✅ Local: http://localhost:5173/
# APP:  ✅ Metro waiting...
```

### 结束工作

```bash
# 1. 停止所有服务
# 在每个终端按 Ctrl+C

# 2. 停止数据库（可选）
brew services stop postgresql@15
```

---

## 🔄 Git工作流

```bash
# 查看状态
git status

# 添加更改
git add .

# 提交
git commit -m "feat: 添加新功能"

# 推送
git push origin main

# 拉取最新代码
git pull origin main

# 更新依赖
npm run install:all
```

---

## 🎨 开发技巧

### 热重载

- **后端**: Nodemon自动重启
- **CMS**: Vite自动刷新
- **APP**: Expo自动刷新

### 调试

```bash
# 后端：添加console.log后查看终端
console.log('Debug:', data);

# CMS：打开浏览器控制台(F12)
console.log('Debug:', data);

# APP：在Expo终端查看或按 j 打开调试器
console.log('Debug:', data);
```

### 代码格式化

```bash
# 如果配置了Prettier
npm run format

# 或手动格式化
npx prettier --write "**/*.{js,jsx,json,md}"
```

---

## 🚀 生产构建

```bash
# CMS生产构建
cd cms
npm run build

# 预览构建结果
npm run preview

# 移动端构建（需要EAS CLI）
cd mobile
eas build --platform all
```

---

## 💡 实用一行命令

```bash
# 完整重置（谨慎使用）
npm run init-db && npm run dev

# 快速测试API
curl -s http://localhost:3000/health | jq

# 查看所有Node进程
ps aux | grep node

# 查看端口占用
netstat -an | grep LISTEN | grep -E "3000|5173|8081"

# 一键停止所有Node进程（危险！）
killall node

# 查看项目文件结构
tree -L 2 -I "node_modules"
```

---

## 📱 移动端调试

```bash
# iOS真机调试
# 1. 连接iPhone到Mac
# 2. 信任设备
# 3. 在Expo按 shift+i 选择设备

# Android真机调试
# 1. 开启开发者选项
# 2. 启用USB调试
# 3. 连接设备
# 4. 在Expo按 shift+a 选择设备

# 查看设备
adb devices                    # Android
xcrun simctl list devices      # iOS模拟器
```

---

**保存此文件到书签，随时查阅！** ⭐
