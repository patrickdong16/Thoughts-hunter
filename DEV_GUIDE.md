# 🚀 思想雷达 - 本地开发快速启动

最简单的方式启动完整的思想雷达系统。

---

## ⚡ 超快速启动（5分钟）

如果你已经安装了所有依赖，直接运行：

```bash
# 在项目根目录
npm run dev
```

这会同时启动后端和CMS！APP需要单独启动：

```bash
npm run app
```

**然后访问:**
- CMS: http://localhost:5173
- APP: 按 `i` (iOS) 或 `a` (Android)

---

## 📋 首次设置（10-15分钟）

### 1. 检查环境

```bash
# 必须
node --version   # 需要 v16+
npm --version    # 需要 v8+

# PostgreSQL（必须）
psql --version   # 需要 v12+

# 可选（移动端开发）
npx expo --version
```

### 2. 安装PostgreSQL

**macOS (Homebrew):**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Ubuntu/Debian:**
```bash
sudo apt-get install postgresql
sudo service postgresql start
```

**Windows:**
- 下载安装包: https://www.postgresql.org/download/windows/

**Docker（推荐的快速方式）:**
```bash
docker run --name thoughts-radar-db \
  -e POSTGRES_PASSWORD=mypassword \
  -e POSTGRES_DB=thoughts_radar \
  -p 5432:5432 \
  -d postgres:15
```

### 3. 创建数据库

```bash
# 本地PostgreSQL
createdb thoughts_radar

# Docker不需要这步（已在上面创建）
```

### 4. 安装项目依赖

```bash
# 在项目根目录
npm install
npm run install:all
```

这会安装：
- 根目录依赖（concurrently）
- backend依赖
- cms依赖
- mobile依赖

### 5. 配置环境变量

**后端:**
```bash
cd backend
cp .env.example .env
```

编辑 `backend/.env`:
```bash
# 如果使用Docker，修改密码
DB_PASSWORD=mypassword

# 其他保持默认即可
```

**CMS和Mobile:**
```bash
# 默认配置已经够用，无需修改
cd cms
cp .env.example .env

cd ../mobile  
cp .env.example .env
```

### 6. 初始化数据库

```bash
# 在项目根目录
npm run init-db
```

应该看到:
```
✅ Tables created successfully
✅ Data seeded successfully
📊 Database Statistics:
   - Bands: 16
   - Radar Items: 6
```

---

## 🎯 启动系统

### 方案A：一键启动（推荐）

**启动后端和CMS:**
```bash
npm run dev
```

**启动移动端（新终端）:**
```bash
npm run app
```

### 方案B：分别启动

**终端1 - 后端:**
```bash
npm run server
# 或
cd backend && npm run dev
```

看到这个表示成功:
```
╔═══════════════════════════════════════╗
║      思想雷达 API Server              ║
╚═══════════════════════════════════════╝

Server running on: http://localhost:3000
```

**终端2 - CMS:**
```bash
npm run cms
# 或
cd cms && npm run dev
```

看到这个表示成功:
```
VITE v7.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
```

**终端3 - 移动端:**
```bash
npm run app
# 或
cd mobile && npx expo start
```

看到这个表示成功:
```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above
```

---

## 🧪 验证系统

### 1. 测试后端

```bash
# 健康检查
curl http://localhost:3000/health

# 获取频段
curl http://localhost:3000/api/bands

# 获取今日雷达
curl http://localhost:3000/api/radar/today
```

### 2. 测试CMS

1. 浏览器打开: http://localhost:5173
2. 应该看到"思想雷达 CMS"绿色标题
3. 能看到示例内容（6条）
4. 点击"添加内容"能打开表单

### 3. 测试APP

1. 在Expo终端按 `i`（iOS）或 `a`（Android）
2. 等待模拟器启动
3. 应该看到"思想雷达"APP
4. 能看到今日6条内容

---

## 🛠️ 开发工具

### 快捷命令

```bash
# 查看数据库统计
npm run stats

# 检查环境配置
npm run check

# 重新初始化数据库（清空所有数据）
npm run init-db

# 构建CMS生产版本
npm run build:cms
```

### 数据库管理

```bash
# 连接数据库
psql thoughts_radar

# 查看所有表
\dt

# 查看频段
SELECT * FROM bands;

# 查看雷达条目
SELECT * FROM radar_items;

# 退出
\q
```

### API测试工具

浏览器访问: http://localhost:3000/tools/api-tester.html

可视化测试所有API端点！

---

## 📱 移动端开发技巧

### iOS模拟器

```bash
# 默认配置即可
API_BASE_URL=http://localhost:3000
```

### Android模拟器

需要修改 `mobile/.env`:
```bash
API_BASE_URL=http://10.0.2.2:3000
```

### 真机测试

1. 获取电脑IP:
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows
ipconfig | findstr IPv4
```

2. 修改 `mobile/.env`:
```bash
API_BASE_URL=http://192.168.1.100:3000  # 你的IP
```

3. 确保手机和电脑在同一WiFi

---

## 🐛 常见问题

### Q1: "数据库连接失败"

```bash
# 检查PostgreSQL是否运行
brew services list | grep postgresql

# 重启PostgreSQL
brew services restart postgresql@15

# 检查密码
cat backend/.env
```

### Q2: "端口被占用"

```bash
# 查找占用端口的进程
lsof -i :3000   # 后端
lsof -i :5173   # CMS
lsof -i :8081   # Expo

# 杀死进程
kill -9 <PID>
```

### Q3: CMS显示"加载失败"

```bash
# 确保后端正在运行
curl http://localhost:3000/health

# 检查CMS环境变量
cat cms/.env

# 清除缓存重启
cd cms
rm -rf node_modules .vite
npm install
npm run dev
```

### Q4: 移动端白屏

```bash
# 清除缓存
cd mobile
npx expo start -c

# 检查API配置
cat .env

# 查看Metro日志
# 按 j 打开调试菜单
```

### Q5: "npm run dev失败"

如果 concurrently 报错:
```bash
# 安装缺失的依赖
npm install

# 或手动启动
cd backend && npm run dev    # 终端1
cd cms && npm run dev        # 终端2
```

---

## 🎨 开发工作流

### 添加新内容

1. 打开CMS: http://localhost:5173
2. 点击"添加内容"
3. 填写表单
4. 点击"创建"
5. 在APP下拉刷新查看

### 修改代码

**后端:**
- 修改 `backend/routes/*.js`
- Nodemon会自动重启
- 刷新页面查看效果

**CMS:**
- 修改 `cms/src/**/*.jsx`
- Vite会热重载
- 自动刷新浏览器

**APP:**
- 修改 `mobile/**/*.js`
- Expo会自动刷新
- 或按 `r` 手动刷新

### 调试技巧

**后端:**
```javascript
console.log('Debug:', data);
// 查看终端输出
```

**CMS:**
```javascript
console.log('Debug:', data);
// 查看浏览器控制台(F12)
```

**APP:**
```javascript
console.log('Debug:', data);
// 查看Expo Metro终端
// 或在App中按 m 打开调试菜单
```

---

## 📚 学习资源

### 项目文档

- `README.md` - 项目总览
- `DEPLOY.md` - 部署指南
- `CHECKLIST.md` - 测试检查清单
- `backend/README.md` - 后端API文档
- `cms/README.md` - CMS使用指南
- `mobile/README.md` - 移动端文档

### 技术文档

- Express: https://expressjs.com
- React: https://react.dev
- Vite: https://vitejs.dev
- React Native: https://reactnative.dev
- Expo: https://docs.expo.dev
- PostgreSQL: https://www.postgresql.org/docs/

---

## 🎉 准备好了！

现在你可以:

✅ 在CMS添加每日内容  
✅ 在APP查看雷达  
✅ 收藏喜欢的内容  
✅ 表达你的立场  
✅ 开发新功能  

**开始开发吧！** 🚀

---

有任何问题？查看 `CHECKLIST.md` 或提交Issue。
