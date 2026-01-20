# 思想雷达 - 部署指南

完整的部署步骤，包括后端、CMS和移动端。

---

## 📋 部署前准备

### 1. 环境检查

```bash
# 确保已安装
node --version  # v16+
npm --version   # v8+
git --version   # 任意版本
```

### 2. 代码准备

```bash
# 确保所有代码已提交
git status

# 确保.gitignore正确配置
cat .gitignore

# 应该忽略:
# .env
# node_modules/
# dist/
# build/
```

---

## 🚀 选项A：Railway 部署（推荐）

Railway 提供免费额度，非常适合开发测试。

### 1. 后端部署到 Railway

#### 步骤1：创建账号
1. 访问 https://railway.app
2. 使用GitHub账号登录
3. 同意授权

#### 步骤2：创建项目
1. 点击 "New Project"
2. 选择 "Deploy from GitHub repo"
3. 选择你的 `Thoughts-hunter` 仓库
4. 选择 `backend` 目录

#### 步骤3：添加PostgreSQL数据库
1. 在项目中点击 "+ New"
2. 选择 "Database" > "PostgreSQL"
3. 等待数据库创建完成

#### 步骤4：配置环境变量
在后端服务的 "Variables" 标签中添加：

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}  # Railway自动提供
CORS_ORIGIN=https://your-cms.vercel.app  # 稍后更新
```

#### 步骤5：初始化数据库

Railway提供了一个临时的SSH连接，你需要：

1. 在PostgreSQL服务中找到 "Connect"
2. 复制连接命令
3. 在本地运行数据库初始化脚本：

```bash
# 临时方案：在本地连接Railway数据库
cd backend

# 设置DATABASE_URL环境变量（从Railway复制）
export DATABASE_URL="postgresql://postgres:xxx@xxx.railway.app:5432/railway"

# 运行初始化（需要临时修改init-db.js使用DATABASE_URL）
node scripts/init-db.js
```

或者使用Railway CLI:

```bash
# 安装Railway CLI
npm install -g @railway/cli

# 登录
railway login

# 链接项目
railway link

# 运行命令
railway run npm run init-db
```

#### 步骤6：部署
- Railway会自动检测到代码变更
- 自动构建和部署
- 查看日志确认启动成功

#### 步骤7：获取后端URL
- 在 "Settings" > "Domains" 中生成公开域名
- 类似: `https://thoughts-radar-production.up.railway.app`
- **记录这个URL** 用于CMS和APP配置

### 2. CMS部署到 Vercel

#### 步骤1：创建账号
1. 访问 https://vercel.com
2. 使用GitHub账号登录

#### 步骤2：导入项目
1. 点击 "Add New..." > "Project"
2. 选择 `Thoughts-hunter` 仓库
3. Framework Preset: 选择 "Vite"
4. Root Directory: 选择 `cms`

#### 步骤3：配置环境变量
在 "Environment Variables" 添加：

```bash
VITE_API_BASE_URL=https://your-backend.railway.app
```

**重要**: 替换为实际的Railway后端URL

#### 步骤4：部署
- 点击 "Deploy"
- 等待构建完成
- 访问生成的URL测试

#### 步骤5：更新后端CORS
回到Railway后端配置,更新CORS_ORIGIN:

```bash
CORS_ORIGIN=https://your-cms.vercel.app
```

### 3. 移动端配置

移动端不需要部署到服务器，但需要配置生产API地址。

#### 更新API地址

编辑 `mobile/.env`:

```bash
API_BASE_URL=https://your-backend.railway.app
```

#### 构建APP（可选）

**使用Expo Application Services (EAS):**

```bash
cd mobile

# 安装EAS CLI
npm install -g eas-cli

# 登录Expo账号
eas login

# 配置项目
eas build:configure

# 构建iOS
eas build --platform ios

# 构建Android
eas build --platform android

# 构建两个平台
eas build --platform all
```

构建完成后会得到:
- iOS: `.ipa` 文件（可上传到App Store）
- Android: `.apk` 或 `.aab` 文件（可上传到Google Play）

**或者使用Expo Go测试:**

用户可以下载Expo Go App，扫码运行你的APP（需要发布到Expo）:

```bash
# 发布到Expo
expo publish
```

---

## 🔧 选项B：Render 部署

Render 也提供免费套餐。

### 1. 后端部署到 Render

#### 步骤1：创建账号
1. 访问 https://render.com
2. 使用GitHub账号登录

#### 步骤2：创建Web Service
1. 点击 "New +"选择 "Web Service"
2. 连接GitHub仓库 `Thoughts-hunter`
3. 配置:
   - Name: `thoughts-radar-api`
   - Root Directory: `backend`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`

#### 步骤3：添加PostgreSQL数据库
1. 点击 "New +" > "PostgreSQL"
2. 填写:
   - Name: `thoughts-radar-db`
   - Database: `thoughts_radar`
   - User: `postgres`
3. 创建后记录 "Internal Database URL"

#### 步骤4：配置环境变量
在Web Service的 "Environment" 标签添加:

```bash
NODE_ENV=production
PORT=3000
DATABASE_URL=<从PostgreSQL复制Internal Database URL>
CORS_ORIGIN=https://your-cms.vercel.app
```

#### 步骤5：初始化数据库
使用Render Shell或者本地连接:

```bash
# 使用Render Shell（在Web Service页面）
npm run init-db
```

#### 步骤6：部署
- 保存后自动部署
- 查看日志确认成功
- 记录生成的URL（类似 `https://thoughts-radar-api.onrender.com`）

### 2. CMS和移动端
同Railway方案的步骤2和步骤3。

---

## 🛠️ 本地开发完整指南

### 首次设置

#### 1. 克隆仓库

```bash
git clone <your-repo-url>
cd Thoughts-hunter
```

#### 2. 安装所有依赖

**方法A：使用根目录脚本**

```bash
npm install
npm run install:all
```

**方法B：手动安装**

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
```

#### 3. 配置环境变量

**后端:**

```bash
cd backend
cp .env.example .env
# 编辑.env，配置数据库密码等
```

**CMS:**

```bash
cd cms
cp .env.example .env
# 默认配置通常不需要修改
```

**移动端（可选）:**

```bash
cd mobile
cp .env.example .env
# iOS模拟器默认配置即可
# Android或真机需要修改API_BASE_URL
```

#### 4. 初始化数据库

```bash
# 确保PostgreSQL已安装并运行
brew services start postgresql@15  # macOS
# 或
sudo service postgresql start      # Linux

# 创建数据库
createdb thoughts_radar

# 初始化数据
cd backend
npm run init-db
```

### 日常开发

#### 启动所有服务

**方法A：使用根目录脚本（推荐）**

```bash
# 在项目根目录
npm run dev        # 启动后端+CMS
# 或
npm run dev:all    # 启动后端+CMS+APP
```

**方法B：分别启动（多终端）**

```bash
# 终端1 - 后端
cd backend
npm run dev

# 终端2 - CMS
cd cms
npm run dev

# 终端3 - 移动端
cd mobile
npx expo start
```

#### 快捷命令

```bash
# 检查环境
npm run check

# 查看数据统计
npm run stats

# 重新初始化数据库
npm run init-db

# 构建CMS生产版本
npm run build:cms
```

---

## 🔍 部署后验证

### 1. 后端验证

```bash
# 健康检查
curl https://your-backend.railway.app/health

# 应该返回:
# {"success":true,"message":"Thoughts Radar API is running",...}

# 测试API
curl https://your-backend.railway.app/api/bands
```

### 2. CMS验证

1. 访问 CMS URL
2. 应该能看到界面
3. 点击"内容管理"能看到列表
4. 尝试添加一条内容
5. 检查后端是否收到请求

### 3. 移动端验证

1. 更新 `mobile/.env` 的API地址
2. 重启Expo: `npx expo start -c`
3. 在模拟器中测试
4. 下拉刷新应该能获取数据

---

## 🐛 常见问题

### Railway

**Q: 数据库初始化失败**
```bash
# A: 使用Railway CLI
railway login
railway link
railway run npm run init-db
```

**Q: 部署后502错误**
```bash
# A: 检查日志
# 1. 在Railway查看Build Logs和Deploy Logs
# 2. 确认PORT环境变量
# 3. 确认DATABASE_URL正确
```

### Render

**Q: 构建超时**
```bash
# A: 免费版构建较慢，耐心等待
# 或升级到付费版
```

**Q: 数据库连接失败**
```bash
# A: 使用Internal Database URL，不是External
# 格式: postgresql://user:password@internal-host:5432/db
```

### Vercel

**Q: API请求失败(CORS)**
```bash
# A: 检查后端的CORS_ORIGIN配置
# 确保包含CMS的Vercel域名
```

**Q: 环境变量不生效**
```bash
# A: 环境变量修改后需要重新部署
# 在Vercel Dashboard触发Redeploy
```

### Expo/EAS

**Q: EAS构建失败**
```bash
# A: 检查app.json配置
# 确保bundleIdentifier和package唯一
```

**Q: Expo Go扫码后白屏**
```bash
# A: 检查API地址配置
# 确保手机能访问该API（同一WiFi）
```

---

## 📊 部署架构图

```
Internet
   │
   ├──> Railway/Render (后端)
   │      ├── Node.js + Express
   │      └── PostgreSQL Database
   │
   ├──> Vercel (CMS)
   │      └── React + Vite
   │
   └──> Expo (移动端)
          ├── iOS App
          └── Android App
```

---

## 🔐 安全建议

### 生产环境

1. **环境变量**
   - 不要提交 `.env` 到Git
   - 使用强密码
   - 定期更换密钥

2. **数据库**
   - 使用SSL连接
   - 限制IP访问（如果可能）
   - 定期备份

3. **API**
   - 配置速率限制
   - 添加API认证（JWT）
   - 记录访问日志

4. **CORS**
   - 不要使用 `*`
   - 只允许已知域名

---

## 📈 监控和维护

### 日志监控

**Railway:**
- 查看 "Deployments" 标签
- 实时日志流
- 过滤和搜索

**Render:**
- 查看 "Logs" 标签
- 下载日志文件

### 性能监控

建议集成:
- Sentry (错误追踪)
- New Relic (性能监控)
- LogRocket (用户行为)

### 数据库备份

**Railway:**
```bash
# 使用Railway CLI备份
railway run pg_dump $DATABASE_URL > backup.sql
```

**Render:**
- 使用Render Dashboard的备份功能
- 或手动导出

---

## ✅ 部署检查清单

### 后端
- [ ] 数据库创建成功
- [ ] 环境变量配置正确
- [ ] 数据库已初始化
- [ ] 健康检查返回200
- [ ] API端点可访问
- [ ] CORS配置正确

### CMS
- [ ] 环境变量指向后端
- [ ] 构建成功
- [ ] 能访问界面
- [ ] 能连接后端API
- [ ] 所有功能正常

### APP
- [ ] API地址已更新
- [ ] 能获取数据
- [ ] 所有功能正常
- [ ] (可选) 构建并上传商店

---

## 🎉 完成！

恭喜！系统已成功部署！

**接下来可以:**
1. 分享CMS链接给内容管理员
2. 分享APP给用户测试
3. 收集反馈并迭代

**有问题？** 查看 `CHECKLIST.md` 进行详细检查。
