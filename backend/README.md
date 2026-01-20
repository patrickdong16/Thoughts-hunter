# 思想雷达 - 后端API

思想雷达（Thoughts Radar）后端API服务，提供每日思想追踪数据接口。

## 📁 项目结构

```
backend/
├── config/
│   └── database.js          # 数据库连接配置
├── database/
│   ├── schema.sql           # 数据库表结构
│   └── seed.sql             # 示例数据
├── routes/
│   ├── radar.js             # 雷达数据路由
│   ├── bands.js             # 频段路由
│   └── user.js              # 用户行为路由
├── scripts/
│   └── init-db.js           # 数据库初始化脚本
├── .env.example             # 环境变量示例
├── .gitignore               # Git忽略文件
├── package.json             # 项目依赖
├── server.js                # 服务器入口
└── README.md                # 项目文档
```

## 🚀 快速开始

### 1. 安装依赖

```bash
cd backend
npm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env` 并修改配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=thoughts_radar
DB_USER=postgres
DB_PASSWORD=your_password
```

### 3. 创建数据库

确保PostgreSQL已安装并运行，然后创建数据库：

```bash
# 登录PostgreSQL
psql -U postgres

# 创建数据库
CREATE DATABASE thoughts_radar;

# 退出
\q
```

### 4. 初始化数据库

运行初始化脚本创建表结构并导入示例数据：

```bash
npm run init-db
```

### 5. 启动服务器

```bash
# 开发模式（自动重启）
npm run dev

# 生产模式
npm start
```

服务器将在 `http://localhost:3000` 启动。

## 📡 API端点

### 雷达数据

| 方法 | 端点 | 描述 | 参数 |
|------|------|------|------|
| GET | `/api/radar/today` | 获取今日雷达 | `?user_id=xxx` (可选) |
| GET | `/api/radar/:date` | 获取指定日期雷达 | `:date` (YYYY-MM-DD), `?user_id=xxx` (可选) |
| GET | `/api/radar/item/:id` | 获取单个条目详情 | `:id`, `?user_id=xxx` (可选) |

### 频段

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/api/bands` | 获取所有频段及TTI |
| GET | `/api/bands/:id` | 获取单个频段详情 |

### 用户行为

| 方法 | 端点 | 描述 | Body |
|------|------|------|------|
| POST | `/api/user/like` | 收藏/取消收藏 | `{ user_id, item_id, liked }` |
| POST | `/api/user/stance` | 记录立场 | `{ user_id, item_id, stance }` |
| GET | `/api/user/:user_id/likes` | 获取用户收藏列表 | - |
| GET | `/api/user/:user_id/stances` | 获取用户立场列表 | - |

### 系统

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/health` | 健康检查 |
| GET | `/` | API文档 |

## 📝 API使用示例

### 获取今日雷达

```bash
curl http://localhost:3000/api/radar/today?user_id=user123
```

响应：

```json
{
  "success": true,
  "date": "2026-01-19",
  "count": 6,
  "items": [
    {
      "id": 1,
      "date": "2026-01-19",
      "freq": "T1",
      "stance": "A",
      "title": "GPT-5将终结创意产业",
      "author_name": "Sam Altman",
      "author_avatar": "SA",
      "content": "...",
      "liked": true,
      "user_stance": "A"
    }
  ]
}
```

### 收藏条目

```bash
curl -X POST http://localhost:3000/api/user/like \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "item_id": 1,
    "liked": true
  }'
```

### 记录立场

```bash
curl -X POST http://localhost:3000/api/user/stance \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user123",
    "item_id": 1,
    "stance": "A"
  }'
```

## 🗄️ 数据模型

### bands (频段)

- `id`: 频段ID (T1, T2, P1, etc.)
- `domain`: 领域 (tech/politics/history/philosophy/religion/finance)
- `question`: 核心问题
- `side_a`: A极立场
- `side_b`: B极立场
- `tti`: 张力指数 (0-100)

### radar_items (雷达条目)

- `id`: 自增ID
- `date`: 发布日期
- `freq`: 频段ID
- `stance`: 作者立场 (A/B)
- `title`: 标题
- `author_name`: 作者姓名
- `author_avatar`: 头像缩写
- `author_bio`: 作者简介
- `source`: 出处
- `content`: 正文内容
- `tension_q`: 张力问题
- `tension_a`: A极描述
- `tension_b`: B极描述
- `keywords`: 关键词数组

### user_actions (用户行为)

- `user_id`: 用户ID
- `item_id`: 条目ID
- `liked`: 是否收藏
- `stance`: 用户立场 (A/B/null)

## 🛠️ 开发说明

### 添加新的雷达条目

直接插入到 `radar_items` 表：

```sql
INSERT INTO radar_items (date, freq, stance, title, author_name, author_avatar, author_bio, source, content, tension_q, tension_a, tension_b, keywords)
VALUES (
  '2026-01-20',
  'T1',
  'A',
  '新标题',
  '作者',
  'XX',
  '作者简介',
  '来源',
  '正文内容...',
  '张力问题',
  'A极',
  'B极',
  ARRAY['关键词1', '关键词2']
);
```

### 更新TTI值

```sql
UPDATE bands SET tti = 90 WHERE id = 'T1';
```

## 🔒 注意事项

1. **同一天同一频段只能有一条内容**：通过 `UNIQUE(date, freq)` 约束保证
2. **用户ID管理**：当前版本使用简单的字符串user_id，实际应用需要集成完整的用户认证系统
3. **CORS配置**：生产环境需要配置具体的允许域名
4. **数据库连接池**：已配置最大20个连接，根据实际负载调整

## 📦 依赖说明

- `express`: Web框架
- `pg`: PostgreSQL客户端
- `cors`: 跨域资源共享
- `dotenv`: 环境变量管理
- `body-parser`: 请求体解析
- `nodemon`: 开发时自动重启（开发依赖）

## 🐛 故障排查

### 数据库连接失败

检查：
1. PostgreSQL服务是否运行
2. `.env` 配置是否正确
3. 数据库是否已创建
4. 用户权限是否足够

### 端口被占用

修改 `.env` 中的 `PORT` 配置或停止占用端口的进程。

## 📄 许可证

MIT
