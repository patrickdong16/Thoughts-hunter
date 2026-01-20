# 🚀 思想雷达 - 本地启动完全指南

**可以直接复制粘贴的命令清单**

---

## 📋 步骤1：环境准备

### 1.1 安装 Node.js

**检查是否已安装：**
```bash
node --version
npm --version
```

**期望输出：**
```
v16.0.0 或更高
v8.0.0 或更高
```

**如果未安装，下载安装：**
- macOS: https://nodejs.org/en/download/
- 或使用 Homebrew:
```bash
brew install node@18
```

---

### 1.2 安装 PostgreSQL

**检查是否已安装：**
```bash
psql --version
```

**期望输出：**
```
psql (PostgreSQL) 12.0 或更高
```

**如果未安装：**

**选项A: Homebrew (macOS - 推荐)**
```bash
# 安装
brew install postgresql@15

# 启动服务
brew services start postgresql@15

# 验证运行状态
brew services list | grep postgresql
```

**选项B: Docker (最简单)**
```bash
# 运行PostgreSQL容器
docker run --name thoughts-radar-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=thoughts_radar \
  -p 5432:5432 \
  -d postgres:15

# 验证容器运行
docker ps | grep thoughts-radar-db
```

**选项C: Ubuntu/Debian**
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo service postgresql start
```

---

### 1.3 安装项目依赖

**进入项目目录：**
```bash
cd /Users/dq/Thoughts\ Hunter/Thoughts-hunter
```

**安装根目录依赖：**
```bash
npm install
```

**安装所有子项目依赖：**
```bash
npm run install:all
```

或者手动安装：
```bash
# 后端
cd backend
npm install

# CMS
cd ../cms
npm install

# 移动端
cd ../mobile
npm install

# 返回根目录
cd ..
```

---

### 1.4 安装 Expo CLI (可选，移动端开发需要)

```bash
npm install -g expo-cli
```

**验证安装：**
```bash
expo --version
```

---

## 📊 步骤2：数据库初始化

### 2.1 创建数据库

**选项A: 如果使用本地PostgreSQL**

```bash
# 创建数据库
createdb thoughts_radar

# 验证数据库创建成功
psql -l | grep thoughts_radar
```

**选项B: 如果使用Docker PostgreSQL**

数据库已在容器启动时创建，跳过此步。

---

### 2.2 配置数据库连接

**复制环境变量文件：**
```bash
cd backend
cp .env.example .env
```

**编辑 backend/.env 文件：**

**如果使用本地PostgreSQL：**
```bash
# 使用你喜欢的编辑器打开
nano .env
# 或
vi .env
# 或
code .env
```

确保配置正确：
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=thoughts_radar
DB_USER=postgres
DB_PASSWORD=postgres
```

**如果使用Docker PostgreSQL：**
配置同上，密码已在容器中设置为 `postgres`

**保存文件后，返回根目录：**
```bash
cd ..
```

---

### 2.3 初始化数据库表和数据

**运行初始化脚本：**
```bash
npm run init-db
```

**期望输出：**
```
✅ Tables created successfully
✅ Data seeded successfully
📊 Database Statistics:
   - Bands: 16
   - Radar Items: 6
   - User Actions: 0
```

**如果出错，手动运行：**
```bash
cd backend
node scripts/init-db.js
cd ..
```

---

### 2.4 验证数据库

**连接数据库查看：**
```bash
psql thoughts_radar
```

**在psql中执行：**
```sql
-- 查看所有表
\dt

-- 查看频段数量
SELECT COUNT(*) FROM bands;

-- 查看雷达条目
SELECT COUNT(*) FROM radar_items;

-- 退出
\q
```

**期望输出：**
- 应该有3个表：bands, radar_items, user_actions
- bands应该有16条记录
- radar_items应该有6条记录

---

## 🚀 步骤3：启动服务

### 3.1 启动后端API

**打开终端1，运行：**
```bash
cd /Users/dq/Thoughts\ Hunter/Thoughts-hunter
npm run server
```

或者：
```bash
cd backend
npm run dev
```

**期望输出：**
```
╔═══════════════════════════════════════╗
║      思想雷达 API Server              ║
╚═══════════════════════════════════════╝

Database connected successfully
Server running on: http://localhost:3000
Environment: development
```

**保持此终端运行！**

---

### 3.2 启动 CMS

**打开终端2，运行：**
```bash
cd /Users/dq/Thoughts\ Hunter/Thoughts-hunter
npm run cms
```

或者：
```bash
cd cms
npm run dev
```

**期望输出：**
```
VITE v7.x.x  ready in xxx ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

**保持此终端运行！**

---

### 3.3 启动移动端 APP (Expo)

**打开终端3，运行：**
```bash
cd /Users/dq/Thoughts\ Hunter/Thoughts-hunter
npm run app
```

或者：
```bash
cd mobile
npx expo start
```

**期望输出：**
```
› Metro waiting on exp://192.168.x.x:8081
› Scan the QR code above with Expo Go (Android) or the Camera app (iOS)

› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web

› Press j │ open debugger
› Press r │ reload app
› Press m │ toggle menu
› Press o │ open project code in your editor

› Press ? │ show all commands
```

**保持此终端运行！**

---

## ✅ 步骤4：验证测试

### 4.1 测试后端API

**在终端4中运行：**

**健康检查：**
```bash
curl http://localhost:3000/health
```

**期望输出：**
```json
{
  "success": true,
  "message": "Thoughts Radar API is running",
  "timestamp": "2026-01-19T11:22:00.000Z",
  "database": "connected"
}
```

**获取今日雷达：**
```bash
curl http://localhost:3000/api/radar/today
```

**期望输出：**
```json
{
  "success": true,
  "date": "2026-01-19",
  "count": 6,
  "items": [...]
}
```

**获取所有频段：**
```bash
curl http://localhost:3000/api/bands
```

**期望输出：**
```json
{
  "success": true,
  "count": 16,
  "bands": [...]
}
```

---

### 4.2 测试 CMS

**1. 打开浏览器，访问：**
```
http://localhost:5173
```

**2. 应该看到：**
- "思想雷达 CMS" 绿色标题
- 今天的日期
- "📝 内容管理" 和 "📊 频段管理" 两个按钮
- 今日6条内容的列表

**3. 测试添加内容：**

- 点击 "✨ 添加内容" 按钮
- 填写表单：
  - 发布日期：选择明天 (2026-01-20)
  - 频段：选择 T2
  - 立场倾向：选择 A极
  - 标题：`GPT-5的创意产业革命`
  - 作者姓名：`Andrew Ng`
  - 作者头像：`AN`
  - 作者简介：`AI教育家、Coursera联合创始人`
  - 出处：`DeepLearning.AI`
  - 正文内容（至少500字）：
    ```
    GPT-5的发布标志着人工智能进入了一个新的时代。这个模型不仅在技术能力上有了质的飞跃，更重要的是它对创意产业的影响将是革命性的。

    从技术角度来看，GPT-5在理解复杂上下文、生成连贯长文本、以及多模态处理方面都有了显著提升。它能够理解并生成更加细腻的情感表达，这对于创意写作、剧本创作、音乐创作等领域都有重要意义。

    然而，这也引发了一个深刻的问题：当AI可以创作出接近甚至超越人类水平的艺术作品时，我们如何定义创造力？创意产业的从业者应该如何应对？

    我认为，AI并不是要取代人类创作者，而是成为他们的工具和伙伴。就像摄影的出现并没有让绘画消失，AI的发展也会催生新的艺术形式和创作方式。关键是我们要学会与AI协作，发挥各自的优势。

    对于创意产业从业者来说，现在是时候重新思考自己的价值了。纯粹的技术性工作可能会被AI替代，但真正有独特视角、深刻洞察和情感共鸣的创作仍然是人类的专属领域。我们需要培养的是批判性思维、原创性构思和情感表达能力。
    ```
  - 张力问题：`AI是否会取代人类创造力？`
  - A极描述：`AI增强人类创造力`
  - B极描述：`AI威胁创意产业就业`
  - 关键词：`GPT-5, 创意产业, AI艺术, 技术失业`

- 点击 "创建" 按钮

**4. 验证：**
- 应该看到 "创建成功" 或列表自动刷新
- 新内容出现在列表中（明天的日期）

---

### 4.3 测试移动端 APP

**方法A: iOS 模拟器 (仅 macOS)**

**在Expo终端（终端3）按 `i` 键**

- Xcode会自动打开iOS模拟器
- APP自动安装并启动
- 应该看到 "📡 思想雷达" 界面

**方法B: Android 模拟器**

**前置：确保Android Studio已安装并配置了模拟器**

**在Expo终端按 `a` 键**

- Android模拟器启动
- APP自动安装
- 应该看到 "📡 思想雷达" 界面

**注意：Android需要修改API地址**
```bash
# 编辑 mobile/.env
echo "API_BASE_URL=http://10.0.2.2:3000" > mobile/.env

# 重启Expo（按 r 重新加载）
```

**方法C: 真机测试 (最简单)**

**1. 下载 Expo Go App：**
- iOS: App Store搜索 "Expo Go"
- Android: Google Play搜索 "Expo Go"

**2. 扫描二维码：**
- 在Expo终端看到的二维码
- iOS: 使用相机App扫描
- Android: 在Expo Go App中扫描

**3. 确保手机和电脑同一WiFi**

**4. APP应该自动加载**

---

### 4.4 完整功能测试

**在移动端APP中：**

**1. 查看今日雷达：**
- 应该看到6条内容（来自seed数据）
- 向下滚动查看所有卡片
- 点击 "展开全文" 查看完整内容

**2. 测试筛选：**
- 左右滑动顶部筛选器
- 点击 "科技" - 应该只显示科技类内容
- 点击 "全部" - 显示所有内容

**3. 测试收藏：**
- 点击某条内容的 ❤️ 图标
- 图标应该变红
- 切换到 "👤 我的" Tab
- 选择 "我的收藏"
- 应该看到刚才收藏的内容

**4. 测试立场：**
- 回到 "📡 今日" Tab
- 点击某条内容的 "我倾向A" 按钮
- 按钮应该高亮
- 切换到 "👤 我的" Tab
- 选择 "我的立场"
- 应该看到刚才的选择

**5. 测试张力指数：**
- 切换到 "📊 张力" Tab
- 应该看到所有18个频段
- 每个频段有渐变光谱条
- 按领域分组显示

**6. 测试历史记录：**
- 切换到 "📅 历史" Tab
- 选择今天的日期
- 应该看到今日内容

**7. 测试下拉刷新：**
- 在 "📡 今日" Tab
- 向下拉动列表
- 应该看到刷新动画
- 数据重新加载

---

## 🎯 快速命令参考

### 一键启动所有服务

**在项目根目录开3个终端：**

**终端1 - 后端：**
```bash
npm run server
```

**终端2 - CMS：**
```bash
npm run cms
```

**终端3 - APP：**
```bash
npm run app
```

### 一键启动（后端+CMS）

```bash
npm run dev
```

### 重置数据库

```bash
npm run init-db
```

### 查看数据统计

```bash
npm run stats
```

### 环境检查

```bash
npm run check
```

---

## 🐛 常见问题

### Q1: "数据库连接失败"

```bash
# 检查PostgreSQL是否运行
brew services list | grep postgresql

# 如果没运行，启动它
brew services start postgresql@15

# 或检查Docker容器
docker ps | grep thoughts-radar-db
```

### Q2: "端口3000已被占用"

```bash
# 查找占用端口的进程
lsof -i :3000

# 杀死进程
kill -9 <PID>
```

### Q3: CMS显示"加载失败"

```bash
# 确认后端正在运行
curl http://localhost:3000/health

# 检查CORS配置
cat backend/.env | grep CORS
```

### Q4: 移动端白屏或报错

```bash
# 清除缓存重启
cd mobile
npx expo start -c

# 检查API配置
cat .env
```

### Q5: npm run install:all 失败

```bash
# 手动安装
cd backend && npm install
cd ../cms && npm install
cd ../mobile && npm install
```

---

## ✅ 验证清单

启动后检查：

- [ ] 后端在 http://localhost:3000 运行
- [ ] curl http://localhost:3000/health 返回成功
- [ ] CMS在 http://localhost:5173 可访问
- [ ] CMS能看到今日雷达列表
- [ ] CMS能添加新内容
- [ ] Expo显示二维码或打开模拟器
- [ ] APP能显示今日雷达
- [ ] APP各个Tab页面正常
- [ ] APP能收藏和表态

全部✅后，系统完全就绪！🎉

---

## 📚 相关文档

- **部署指南**: `DEPLOY.md`
- **检查清单**: `CHECKLIST.md`
- **开发指南**: `DEV_GUIDE.md`

---

**现在开始吧！** 🚀
