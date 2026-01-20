# 思想雷达后端 - 快速启动指南

## 📋 前置要求

✅ Node.js已安装（依赖已完成安装）  
⚠️ 需要PostgreSQL数据库

---

## 🗄️ PostgreSQL数据库设置

### 方案一：使用Homebrew安装PostgreSQL（推荐）

```bash
# 1. 安装PostgreSQL
brew install postgresql@15

# 2. 启动PostgreSQL服务
brew services start postgresql@15

# 3. 创建数据库
createdb thoughts_radar

# 4. 验证数据库创建成功
psql thoughts_radar -c "\l"
```

### 方案二：使用Docker运行PostgreSQL

```bash
# 1. 运行PostgreSQL容器
docker run --name thoughts-radar-db \
  -e POSTGRES_PASSWORD=mypassword \
  -e POSTGRES_DB=thoughts_radar \
  -p 5432:5432 \
  -d postgres:15

# 2. 修改.env文件中的DB_PASSWORD为mypassword
```

### 方案三：使用现有的PostgreSQL

如果你已经有PostgreSQL运行：

```bash
# 使用psql连接
psql -U postgres

# 在PostgreSQL命令行中创建数据库
CREATE DATABASE thoughts_radar;

# 退出
\q
```

---

## ⚙️ 配置环境变量

编辑 `backend/.env` 文件，设置你的数据库密码：

```env
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=thoughts_radar
DB_USER=postgres
DB_PASSWORD=YOUR_PASSWORD_HERE  # ⬅️ 修改这里
```

---

## 🚀 初始化并启动

### 1. 初始化数据库（创建表和导入数据）

```bash
cd backend
npm run init-db
```

你应该看到：
```
✅ Tables created successfully
✅ Data seeded successfully
📊 Database Statistics:
   - Bands: 16
   - Radar Items: 6
```

### 2. 启动开发服务器

```bash
npm run dev
```

你应该看到：
```
╔═══════════════════════════════════════╗
║      思想雷达 API Server              ║
╚═══════════════════════════════════════╝

Server running on: http://localhost:3000
```

---

## 🧪 测试API

打开新终端，测试API是否正常：

```bash
# 1. 健康检查
curl http://localhost:3000/health

# 2. 获取今日雷达
curl http://localhost:3000/api/radar/today

# 3. 获取所有频段
curl http://localhost:3000/api/bands
```

---

## 📡 主要API端点

### 雷达数据
- `GET /api/radar/today` - 获取今日雷达（6-8条内容）
- `GET /api/radar/:date` - 获取指定日期（格式：2026-01-19）
- `GET /api/radar/item/:id` - 获取单条详情

### 频段信息
- `GET /api/bands` - 获取所有18个频段及TTI值
- `GET /api/bands/:id` - 获取单个频段（如：T1, P1, Φ1）

### 用户操作
- `POST /api/user/like` - 收藏/取消收藏
- `POST /api/user/stance` - 记录立场（A或B）
- `GET /api/user/:user_id/likes` - 获取用户收藏列表
- `GET /api/user/:user_id/stances` - 获取用户立场列表

---

## 🎯 下一步

1. **连接前端**：修改前端的API请求地址为 `http://localhost:3000`
2. **添加内容**：每天手动或通过脚本向数据库添加新的雷达条目
3. **用户认证**：集成JWT或其他认证方案（当前使用简单的user_id字符串）

---

## 🐛 常见问题

### Q: 数据库连接失败
A: 检查PostgreSQL是否运行：`brew services list` 或 `docker ps`

### Q: 端口3000被占用
A: 修改`.env`中的`PORT`为其他值（如3001）

### Q: init-db脚本失败
A: 检查`.env`中的数据库配置是否正确

---

## 📚 更多信息

查看 `README.md` 获取完整的API文档和使用说明。
