# 思想雷达 - 应用图标和启动画面配置

为APP生成图标和启动画面的完整指南。

---

## 📱 所需资源

### 1. 应用图标 (icon.png)

**要求:**
- 尺寸: 1024x1024 px
- 格式: PNG
- 无透明度（或白色背景）
- 圆角会自动处理

**设计建议:**
- 深色背景 (#08090c)
- 绿色雷达logo (#00ff88)
- 简洁的图标设计
- 可辨识度高

**放置位置:**
```
mobile/assets/icon.png
```

### 2. 启动画面 (splash.png)

**要求:**
- 尺寸: 1284x2778 px (iPhone 14 Pro Max)
- 格式: PNG
- 背景: #08090c

**设计建议:**
- 居中放置Logo
- "思想雷达" 文字
- "Thoughts Radar" 英文副标题
- 可选：加载动画

**放置位置:**
```
mobile/assets/splash.png
```

### 3. Android自适应图标 (adaptive-icon.png)

**要求:**
- 尺寸: 1024x1024 px
- 格式: PNG
- 前景图层（内容在安全区域内）

**放置位置:**
```
mobile/assets/adaptive-icon.png
```

### 4. Favicon (favicon.png)

**要求:**
- 尺寸: 48x48 px 或 更大
- 格式: PNG

**放置位置:**
```
mobile/assets/favicon.png
```

---

## 🎨 快速生成工具

### 方法1: 使用Figma设计

1. 创建 1024x1024 画布
2. 设计你的图标
3. 导出为PNG
4. 使用以下工具生成各种尺寸

### 方法2: 使用AI生成

**提示词示例:**
```
Design a minimalist app icon for "Thoughts Radar", 
a daily thoughts tracking app. 
- Dark background (#08090c)
- Neon green (#00ff88) radar wave design
- Modern, tech-inspired
- Clean and recognizable
- 1024x1024px, flat design
```

推荐工具:
- Midjourney
- DALL-E
- Stable Diffusion

### 方法3: 使用图标生成器

在线工具:
- https://www.appicon.co
- https://makeappicon.com
- https://icon.kitchen

步骤:
1. 上传你的 1024x1024 图标
2. 选择平台（iOS + Android）
3. 下载生成的所有尺寸
4. 替换 `mobile/assets/` 中的文件

---

## 🔧 手动生成（如果需要）

### 使用ImageMagick

```bash
# 安装ImageMagick
brew install imagemagick  # macOS
sudo apt-get install imagemagick  # Ubuntu

# 从1024x1024生成icon
convert icon-1024.png -resize 1024x1024 mobile/assets/icon.png

# 生成splash（添加背景色）
convert -size 1284x2778 xc:'#08090c' \
  icon-1024.png -gravity center -composite \
  mobile/assets/splash.png
```

---

## 📋 Expo配置

图标和启动画面的路径在 `mobile/app.json` 中配置:

```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#08090c"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#08090c"
      }
    },
    "web": {
      "favicon": "./assets/favicon.png"
    }
  }
}
```

---

## 🎯 设计模板

### 简单Logo方案

**icon.png (1024x1024):**
```
┌──────────────────────────┐
│                          │
│                          │
│       📡                 │
│   思想雷达               │
│                          │
│                          │
└──────────────────────────┘
背景: #08090c
emoji/文字: #00ff88
```

### 专业Logo方案

设计元素:
- 雷达波纹（同心圆）
- 绿色渐变 (#00ff88 到 #00cc6a)
- 科技感线条
- 中央思想气泡或雷达点

**Figma步骤:**
1. 创建 1024x1024 画布
2. 背景填充 #08090c
3. 绘制雷达波纹圆
4. 添加中心图标
5. 导出为PNG

---

## ✅ 验证和测试

### 1. 本地预览

```bash
cd mobile
npx expo start
```

按 `i` 或 `a` 启动模拟器，查看:
- 应用图标（主屏幕）
- 启动画面（打开APP时）

### 2. 检查清单

- [ ] icon.png 存在且为 1024x1024
- [ ] splash.png 存在且为 1284x2778
- [ ] adaptive-icon.png 存在（Android）
- [ ] favicon.png 存在（Web）
- [ ] 所有图片格式为PNG
- [ ] 颜色符合品牌（#08090c + #00ff88）
- [ ] 图标在深色和浅色背景都清晰可见
- [ ] 启动画面居中且不会被截断

### 3. 多设备测试

- [ ] iPhone SE（小屏）显示正常
- [ ] iPhone 14 Pro（标准屏）显示正常
- [ ] iPad（平板）显示正常
- [ ] Android 小屏设备
- [ ] Android 大屏设备

---

## 🚀 生产构建

使用EAS Build时，图标会自动处理:

```bash
# iOS
eas build --platform ios

# Android  
eas build --platform android
```

Expo会:
- 自动生成所有需要的图标尺寸
- 处理圆角（iOS）
- 生成adaptive icon（Android）
- 优化文件大小

---

## 📝 设计规范参考

### iOS人机界面指南
- App图标不要有透明度
- 不要在图标中添加文字（除非是品牌Logo）
- 保持简洁
- 使用一致的风格

### Android Material Design
- 自适应图标遵循网格
- 前景在安全区域内（512x512的中心432x432）
- 背景可以是纯色或简单图案

---

## 🎨 临时方案（快速开始）

如果你现在想快速测试，可以先用Emoji:

**创建简单icon.png:**
```bash
# 使用ImageMagick创建一个简单图标
convert -size 1024x1024 xc:'#08090c' \
  -pointsize 600 -fill '#00ff88' \
  -gravity center -annotate +0+0 '📡' \
  mobile/assets/icon.png

convert -size 1024x1024 xc:'#08090c' \
  mobile/assets/adaptive-icon.png

convert -size 1284x2778 xc:'#08090c' \
  -pointsize 200 -fill '#00ff88' \
  -gravity center -annotate +0-300 '📡' \
  -pointsize 100 -annotate +0-100 '思想雷达' \
  -pointsize 60 -fill '#6b7280' -annotate +0+0 'Thoughts Radar' \
  mobile/assets/splash.png

convert -size 48x48 xc:'#08090c' \
  -pointsize 32 -fill '#00ff88' \
  -gravity center -annotate +0+0 '📡' \
  mobile/assets/favicon.png
```

这样就有了可用的临时图标！

---

## 📚 相关资源

### 在线工具
- **Icon生成**: https://icon.kitchen
- **颜色选择**: https://coolors.co
- **设计灵感**: https://dribbble.com
- **免费图标**: https://www.flaticon.com

### 设计软件
- **Figma**: 免费，强大
- **Sketch**: macOS专业工具
- **Canva**: 在线设计
- **GIMP**: 免费Photoshop替代

---

## 🎉 完成

图标和启动画面配置完成后：

1. 重启Expo查看效果
2. 在真机测试
3. 使用EAS构建生产版本
4. 上传到App Store/Google Play

**享受你的思想雷达APP！** 📱✨
