# 思想雷达 - React Native 移动端APP

每日思想追踪APP，追踪全球顶级思想者对时代级问题的最新观点。

## ✨ 功能特性

### 📡 今日雷达
- 每日6-8条精选思想内容
- 按领域筛选（科技/政治/历史/哲学/宗教/金融）
- 展开/收起正文
- 收藏和立场表态
- 下拉刷新

### 📊 张力指数(TTI)
- 18个频段的TTI光谱图
- 渐变色颜色编码（绿/橙/红）
- AB两极对比展示
- 按领域分组

### 📅 历史记录
- 按日期浏览历史内容
- 最近7天快速选择

### 👤 个人中心
- 我的收藏列表
- 我的立场记录
- 下拉刷新

## 🚀 快速开始

### 前置要求

- Node.js 16+
- Expo CLI
- iOS模拟器或Android模拟器（或真机）
- 后端API运行在 http://localhost:3000

### 安装依赖

```bash
cd mobile
npm install
```

### 启动开发服务器

```bash
# 启动Expo
npx expo start

# 或使用
npm start
```

然后按照提示：
- 按 `i` 打开iOS模拟器
- 按 `a` 打开Android模拟器
- 扫描二维码在真机上运行（需要Expo Go App）

### 修改API地址

如果后端不在本机，编辑 `services/api.js`:

```javascript
const API_BASE_URL = 'http://your-backend-url:3000';
```

注意：
- iOS模拟器可以使用 `http://localhost:3000`
- Android模拟器需要使用 `http://10.0.2.2:3000`
- 真机需要使用局域网IP，如 `http://192.168.1.x:3000`

## 📁 项目结构

```
mobile/
├── screens/                  # 页面
│   ├── TodayScreen.js        # 今日雷达
│   ├── TTIScreen.js          # 张力指数
│   ├── HistoryScreen.js      # 历史记录
│   └── ProfileScreen.js      # 个人中心
├── components/               # 组件
│   └── RadarCard.js          # 雷达卡片
├── services/                 # 服务
│   └── api.js                # API服务层
├── constants/                # 常量
│   └── theme.js              # 主题配置
├── App.js                    # 应用入口
├── app.json                  # Expo配置
└── package.json              # 依赖配置
```

## 🎨 设计规范

### 颜色系统
- **主色**: `#00ff88` (荧光绿)
- **背景**: `#08090c` (深黑)
- **卡片**: `#12151a` (深灰)
- **A极**: `#4a9eff` (蓝色)
- **B极**: `#f0a500` (琥珀色)

### 字体
- 基础大小: 15px
- 标题大小: 20-32px
- iOS: San Francisco
- Android: Roboto

## 💾 本地存储

使用 AsyncStorage 实现：

- ✅ 今日雷达缓存（离线可读）
- ✅ 频段数据缓存
- ✅ 用户收藏本地存储
- ✅ 用户立场本地存储
- ✅ 最后更新时间记录

### 缓存策略
- 今日内容会缓存到本地
- 网络请求失败时读取缓存
- 每天首次打开自动刷新
- 用户操作立即同步到服务器
- 失败时仅更新本地缓存

## 📱 功能演示

### 1. 查看今日雷达
1. 打开App，默认显示今日内容
2. 向下滑动可筛选领域
3. 点击"展开全文"查看完整内容

### 2. 收藏和表态
1. 点击❤️图标收藏喜欢的内容
2. 点击"我倾向A"或"我倾向B"表达立场
3. 操作会实时保存到服务器

### 3. 查看TTI
1. 切换到"张力"Tab
2. 查看18个频段的张力指数
3. 颜色越红表示张力越大

### 4. 浏览历史
1. 切换到"历史"Tab
2. 选择日期查看该日内容

### 5. 管理收藏
1. 切换到"我的"Tab
2. 查看所有收藏和立场记录

## 🔧 开发技巧

### 调试

```bash
# 查看日志
npx expo start --tunnel

# 清除缓存
npx expo start -c
```

### 构建

```bash
# iOS
expo build:ios

# Android
expo build:android
```

## 🐛 故障排查

### 无法连接API

**问题**: 显示"加载失败"

**解决**:
1. 确保后端正在运行
2. 检查API地址配置
3. Android模拟器使用 `10.0.2.2:3000`
4. 真机使用局域网IP

### 样式问题

**问题**: 界面显示不正常

**解决**:
```bash
# 清除缓存重启
npx expo start -c
```

### 依赖问题

**解决**:
```bash
# 删除node_modules重新安装
rm -rf node_modules
npm install
```

## 📚 技术栈

- **框架**: React Native + Expo
- **导航**: React Navigation v6
- **状态**: React Hooks
- **存储**: AsyncStorage
- **HTTP**: Fetch API
- **UI**: 自定义组件

## ⚡ 性能优化

- ✅ FlatList虚拟化渲染
- ✅ 图片懒加载
- ✅ API请求缓存
- ✅ 离线支持
- ✅ memo优化组件
- ✅ useCallback优化函数

## 🎯 后续优化

- [ ] 推送通知
- [ ] 分享功能
- [ ] 深色/浅色主题切换
- [ ] 字体大小调节
- [ ] 阅读进度记录
- [ ] 搜索功能
- [ ] 评论功能

## 📄 许可证

MIT

---

**准备好了吗？**

```bash
# 确保后端运行
cd ../backend && npm run dev

# 启动移动端
cd mobile && npx expo start
```

然后按 `i` (iOS) 或 `a` (Android) 启动模拟器！🚀
