# Content Source Management System

## 概览 Overview

内容源管理系统用于追踪和管理思想雷达的高质量内容来源，包括YouTube频道、关键人物和出版机构。系统支持自动排名、智能发现和性能分析。

The Content Source Management System tracks and manages high-quality content sources for Thoughts Radar, including YouTube channels, thought leaders, and publications. Features automatic ranking, intelligent discovery, and performance analytics.

---

## 🚀 快速开始 Quick Start

### 1. 应用数据库迁移 Apply Database Migration

```bash
cd backend
psql -U postgres -d thoughts_radar -f database/schema-sources.sql
psql -U postgres -d thoughts_radar -f database/seed-sources.sql
```

### 2. 验证数据 Verify Data

```bash
psql -U postgres -d thoughts_radar -c "SELECT COUNT(*), type FROM content_sources GROUP BY type;"
```

预期结果 Expected:
- 36 channels (YouTube频道)
- 52 people (关键人物)
- 8 publications (出版机构)
- **Total: 96 sources**

### 3. 测试API Test API

确保后端服务器运行中:
```bash
npm start
```

测试端点:
```bash
# 获取所有来源
curl 'http://localhost:3000/api/sources' | jq

# 按领域过滤（技术）
curl 'http://localhost:3000/api/sources?domain=T' | jq

# 查看热门人物
curl 'http://localhost:3000/api/sources/people/trending' | jq
```

---

## 📊 数据结构 Data Structure

### 内容源分类 Source Categories

| 领域 Domain | 频道 Channels | 人物 People | 出版物 Publications |
|------------|--------------|------------|-------------------|
| **T** (技术/Tech) | 9 | 13 | 1 |
| **P** (政治/Politics) | 9 | 10 | 4 |
| **Φ** (哲学/Philosophy) | 8 | 10 | 2 |
| **H** (历史/History) | - | 7 | - |
| **F** (金融/Finance) | 7 | 8 | 1 |
| **R** (宗教/Religion) | 3 | 4 | - |

---

## 🔧 自动化脚本 Automation Scripts

### 月度排名更新 Monthly Ranking Update

```bash
# 更新当前月排名
node scripts/update-rankings.js

# 更新指定月份
node scripts/update-rankings.js 2026-02-01
```

**建议Cron设置**:
```cron
# 每月1日凌晨2点运行
0 2 1 * * cd /path/to/backend && node scripts/update-rankings.js
```

---

### 周度来源发现 Weekly Source Discovery

```bash
# 扫描最近30天内容
node scripts/discover-sources.js

# 自定义天数
node scripts/discover-sources.js 60
```

**建议Cron设置**:
```cron
# 每周一上午9点运行
0 9 * * 1 cd /path/to/backend && node scripts/discover-sources.js
```

---

## 📡 API 端点 API Endpoints

### 内容源管理 Source Management

```
GET    /api/sources              # 列表（支持过滤: ?domain=T&type=channel&status=active）
GET    /api/sources/:id          # 详情
POST   /api/sources              # 创建
PUT    /api/sources/:id          # 更新
DELETE /api/sources/:id          # 归档（软删除）
```

### 性能分析 Analytics

```
GET    /api/sources/:id/metrics           # 历史性能指标
GET    /api/sources/rankings/all          # 排名（按领域分组）
GET    /api/sources/people/trending       # 热门人物（默认30天）
```

### 推荐管理 Recommendations

```
GET    /api/sources/recommendations/pending    # 待审核推荐
POST   /api/sources/recommendations/:id/approve  # 批准
POST   /api/sources/recommendations/:id/reject   # 拒绝
```

### 手动触发 Manual Triggers

```
POST   /api/sources/discover              # 运行发现扫描
POST   /api/sources/update-rankings       # 刷新排名
POST   /api/sources/update-person-metrics # 更新人物热度
```

---

## 🎯 使用示例 Usage Examples

### 添加新的内容源 Add New Source

```bash
curl -X POST http://localhost:3000/api/sources \
  -H 'Content-Type: application/json' \
  -d '{
    "type": "person",
    "name": "新思想家",
    "url": "https://example.com",
    "domain": "Φ",
    "description": "当代哲学家",
    "priority_rank": 50
  }'
```

### 查看领域排名 View Domain Rankings

```bash
curl 'http://localhost:3000/api/sources/rankings/all' | jq '.data.T | .[0:5]'
```

### 批准推荐 Approve Recommendation

```bash
curl -X POST 'http://localhost:3000/api/sources/recommendations/1/approve' \
  -H 'Content-Type: application/json' \
  -d '{
    "domain": "T",
    "description": "AI安全研究专家",
    "priority_rank": 40
  }'
```

---

## 🧠 排名算法 Ranking Algorithm

### 权重配置 Weights

```javascript
{
  adoptionRate: 0.35,      // 采纳率 35%
  qualityScore: 0.30,      // 质量评分 30%
  contentFrequency: 0.15,  // 内容频率 15%
  engagement: 0.20         // 用户互动 20%
}
```

### 计算公式 Formula

```
总分 = (采纳率 × 0.35) + 
      (质量评分×20 × 0.30) + 
      (内容频率归一化 × 0.15) + 
      (互动分数 × 0.20)

Total Score = (Adoption Rate × 0.35) +
             (Quality Score×20 × 0.30) +
             (Frequency Normalized × 0.15) +
             (Engagement × 0.20)
```

---

## 📁 文件结构 File Structure

```
backend/
├── database/
│   ├── schema-sources.sql      # 数据表定义
│   └── seed-sources.sql        # 初始数据（96个来源）
├── services/
│   ├── source-manager.js       # CRUD操作
│   ├── source-ranker.js        # 排名算法
│   └── source-discovery.js     # 智能发现
├── routes/
│   └── sources.js              # API路由（15+端点）
└── scripts/
    ├── update-rankings.js      # 月度排名更新
    └── discover-sources.js     # 周度来源发现
```

---

## 🎨 CMS集成 CMS Integration (计划中 Planned)

### 待实现组件 Components To Implement

1. **SourceManagement.jsx** - 主管理界面
   - Tab 1: 来源列表（带过滤和排序）
   - Tab 2: 性能指标（图表和趋势）
   - Tab 3: 推荐审核（批准/拒绝）
   - Tab 4: 添加新来源（表单）

2. **sources-api.js** - API客户端封装

3. **App.jsx修改** - 添加导航入口

---

## 🔍 故障排查 Troubleshooting

### 数据库连接问题

```bash
# 检查PostgreSQL是否运行
psql -U postgres -l

# 测试连接
psql -U postgres -d thoughts_radar -c "SELECT COUNT(*) FROM content_sources;"
```

### API返回空结果

```bash
# 验证路由注册
curl http://localhost:3000/ | jq '.endpoints'

# 检查服务器日志
npm start  # 查看console输出
```

### 脚本执行失败

```bash
# 确保执行权限
chmod +x scripts/*.js

# 手动运行查看错误
node scripts/discover-sources.js
```

---

## 📚 相关文档 Related Documentation

- [Implementation Plan](file:///Users/dq/.gemini/antigravity/brain/75d72651-ec1b-4588-9acc-ac1478314c97/implementation_plan.md) - 详细实施计划
- [Walkthrough](file:///Users/dq/.gemini/antigravity/brain/75d72651-ec1b-4588-9acc-ac1478314c97/walkthrough.md) - 完整功能演示
- [System Rules](file:///Users/dq/.gemini/antigravity/knowledge/thoughts_radar_backend/artifacts/governance/system_rules.md) - 内容质量规范

---

## ✅ 验证清单 Verification Checklist

- [x] 数据库表创建成功（4个表）
- [x] 种子数据导入完成（96个来源）
- [x] 后端服务可用（3个服务）
- [x] API端点响应正常（15+端点）
- [x] 自动化脚本可执行
- [ ] CMS界面集成（待实现）

---

## 🤝 贡献指南 Contributing

### 添加新来源领域

1. 修改 `schema-sources.sql` 中的 `domain` CHECK约束
2. 更新 `seed-sources.sql` 添加新领域的来源
3. 运行迁移脚本

### 调整排名权重

编辑 `services/source-ranker.js`:
```javascript
const WEIGHTS = {
  adoptionRate: 0.40,      // 调整权重
  qualityScore: 0.25,
  contentFrequency: 0.15,
  engagement: 0.20
};
```

---

**版本 Version**: 1.0.0  
**最后更新 Last Updated**: 2026-01-20  
**维护者 Maintainer**: Thoughts Radar Team
