# 思想雷达 - Web 移动版

移动端 Web 应用,部署到 Vercel 供手机浏览器访问测试。

## 快速部署

### 方法 1: Vercel CLI

```bash
# 安装 Vercel CLI
npm install -g vercel

# 部署
cd web
vercel deploy

# 生产部署
vercel deploy --prod
```

### 方法 2: GitHub + Vercel 自动部署

1. 推送代码到 GitHub
2. 在 Vercel 控制台导入仓库
3. 设置 Root Directory 为 `web`
4. 自动部署

## 配置后端 API

编辑 `index.html` 第 692 行:

```javascript
: (window.API_URL || 'https://YOUR-BACKEND-URL');
```

将 `YOUR-BACKEND-URL` 替换为:
- Railway 部署: `https://xxx.railway.app`
- Ngrok 隧道: `https://xxx.ngrok.io`
- 其他托管服务 URL

## 后端 CORS 配置

确保后端允许 Vercel 域名跨域访问:

```javascript
// backend/server.js
const corsOptions = {
  origin: [
    'http://localhost:5173',
    'https://your-app.vercel.app',
    /\.vercel\.app$/  // 允许所有 vercel.app 子域名
  ]
};
```

## 测试

1. 本地测试:
   ```bash
   # 启动本地服务器
   npx serve web
   # 访问 http://localhost:3000
   ```

2. 手机测试:
   - 获取 Vercel 部署 URL
   - 手机浏览器打开
   - 测试所有功能
