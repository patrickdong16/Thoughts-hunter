# 思想雷达项目 - 完整系统

一个用于追踪全球顶级思想者对时代级问题最新观点的完整系统。

## 📋 核心文档

- 📌 [需求规格书](REQUIREMENTS.md) ⭐ **唯一需求源**
- 📚 [内容来源体系](CONTENT_SOURCES.md)

## 🚀 快速开始

**生产环境：**
| 服务 | 平台 | URL |
|------|------|-----|
| 后端 API | Railway | `https://thoughts-radar-backend-production.up.railway.app` |
| 海外前端 | Vercel | `https://thoughts-hunter.vercel.app` |
| 大陆前端 | CloudBase | `https://thoughts-rador26-2f3u8ht52110fab.tcloudbaseapp.com` |

**本地开发：**
- 📖 [本地启动指南](LOCAL_SETUP.md)
- ⚡ [快速命令表](QUICK_COMMANDS.md)
- 🔧 [开发指南](DEV_GUIDE.md)

**部署上线：**
- 🚀 [部署指南](DEPLOY.md)
- ✅ [测试检查清单](CHECKLIST.md)

---

## 📁 项目结构
```
Thoughts-hunter/
├── backend/                    # 后端API服务
│   ├── config/                 # 数据库配置
│   ├── database/               # 数据库schema和种子数据
│   ├── routes/                 # API路由
│   ├── scripts/                # 实用脚本
│   ├── public/                 # API测试工具
│   └── server.js              # Express服务器
│
├── cms/                        # 内容管理系统
│   ├── src/
│   │   ├── components/        # React组件
│   │   ├── services/          # API服务层
│   │   └── App.jsx            # 主应用
│   └── package.json
│
├── mobile/                     # React Native移动端APP
│   ├── screens/               # 页面
│   ├── components/            # 组件
│   ├── services/              # API服务
│   ├── constants/             # 主题配置
│   └── App.js                 # 应用入口
│
├── REQUIREMENTS.md             # 需求规格书
├── CONTENT_SOURCES.md          # 内容来源体系
└── README.md                   # 本文件
```

## 🎯 系统组成

| 组件 | 技术栈 | 说明 |
|------|--------|------|
| 后端 API | Node.js + Express + PostgreSQL | 17 个 RESTful 端点 |
| CMS | React + Vite | 内容管理系统 |
| 移动端 | React Native + Expo | iOS/Android APP |

## 🚀 一键启动
```bash
# 终端1: 后端
cd backend && npm run dev

# 终端2: CMS
cd cms && npm run dev

# 终端3: 移动端
cd mobile && npx expo start
```

访问：
- CMS: http://localhost:5173
- API: http://localhost:3000
- 移动端: 按 i (iOS) 或 a (Android)

---

详细技术文档见各子目录的 README.md
