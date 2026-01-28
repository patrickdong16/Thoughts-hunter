# 思想雷达 - 项目规则

> 本文件补充全局规则，仅对思想雷达项目生效
> **Claude 必须严格遵守，违反即停止**

---

## 🚨 最高优先级：内容真实性

### 绝对禁止（零容忍）
1. **禁止虚构任何内容**
   - 禁止虚构 URL（必须是真实可访问的链接）
   - 禁止虚构演讲/发言（必须是真实发生的）
   - 禁止虚构引用（必须来自真实来源）
   - 禁止虚构作者/人物言论
   - 禁止虚构日期/事件

2. **如果没有真实来源，必须停止**
   - 不要编造"可能说的话"
   - 不要根据人物立场推测内容
   - 没有真实 URL = 不能发布

### 违反后果
- 立即停止生成
- 告知用户无法找到真实来源
- 建议用户提供真实来源或更换主题

---

## 🚫 Railway 配置禁区（2026-01-27 复盘新增）

### cronSchedule 陷阱（强制遵守）
- **禁止**在 Web Service 的 `railway.json` 中添加 `cronSchedule`
- 原因：`cronSchedule` 会将服务从持续运行的 Web Service 变为一次性定时任务，导致 502 错误
- 如需定时任务：创建独立的 Cron Service，与 Web Service 分离

### 正确的定时任务方案
1. 使用 Railway 独立的 Cron Service（与 Web Service 分开部署）
2. 或使用外部调度服务（如 GitHub Actions）触发 API

---

## 📋 需求来源

**唯一需求源**：`REQUIREMENTS.md`

---

## ✅ 内容质检规则

### 字数要求
- 正文 **≥ 500 字符**

### 零重复规则
- **URL 唯一**：同一 URL 不能出现两次
- **视频ID 唯一**：同一 YouTube 视频不能重复
- **标题去重**：相似度 ≥ 80% 必须阻断

### 频段匹配
- 内容必须与选择的频段相关
- 立场（A/B）必须与内容实际观点一致

---

## 📅 每日内容生成流程 v2.0（强制）

> **核心原则**：以人为本 — 思想跟踪体系驱动采集，非平台驱动

### 采集优先级体系

| 优先级 | 来源 | 渠道 | 说明 |
|--------|------|------|------|
| **P0** | 跟踪名单内人物 | RSS/博客/Google | 最高优先级 |
| **P1** | 同级别思想者 | RSS/博客/Google | 补充层 |
| **P2** | YouTube 视频 | 跟踪频道优先 | 视频补充 |

### 普通日配额（强制）

| 配额项 | 要求 |
|--------|------|
| 非视频（RSS/博客） | **5-7 条** |
| 视频（YouTube） | **≥1 条** |
| 频段覆盖 | **T1/P1/H1/Φ1/F1/R1 各≥1** |

### 主题日配额（灵活）

| 配额项 | 要求 |
|--------|------|
| 总数量 | 10-20 条 |
| 内容类型 | **不限** |
| 频段覆盖 | **尽量涉猎** |

### 🆕 推荐：统一扫描入口 (v3.0)
```bash
# 一键扫描：RSS 优先 + 频段平衡 + 配额检查
curl -X POST https://thoughts-radar-backend-production.up.railway.app/api/automation/daily-radar
```

配置驱动：`CONTENT_SOURCES.json` 包含 35 个 RSS 源（Tier 1-3），修改即自动生效。

---

### 步骤 1：P0 - 思想领袖 RSS/博客采集
```bash
# 扫描跟踪名单内人物的最新发布
curl -X POST https://thoughts-radar-backend-production.up.railway.app/api/automation/generate-from-leaders
```

### 步骤 2：配额检查
```bash
# 检查非视频/视频配额和频段覆盖
curl https://thoughts-radar-backend-production.up.railway.app/api/automation/content-gap
```

返回示例：
```json
{
  "stats": {
    "nonVideo": { "count": 5, "min": 5, "gap": 0 },
    "video": { "count": 0, "min": 1, "gap": 1 },
    "frequency": { "missing": ["R1"], "gap": 1 }
  }
}
```

### 步骤 3：P2 - YouTube 视频扫描与采集 🆕
```bash
# 步骤 3a: 扫描频道填充队列（自动 RSS fallback）
curl -X POST https://thoughts-radar-backend-production.up.railway.app/api/automation/scan-channels \
  -H "Content-Type: application/json" \
  -d '{"maxVideosPerChannel": 3, "daysBack": 7}'

# 返回示例：
# { "method": "rss", "results": { "videosAdded": 5, "channelsScanned": 11 } }

# 步骤 3b: 处理队列生成内容
curl -X POST https://thoughts-radar-backend-production.up.railway.app/api/automation/process-video-queue
```

> **智能 Fallback**：优先使用 YouTube API，配额用完或失败自动切换 RSS  
> **配额节省**：RSS 模式扫描 27 频道仅需 ~135 单位（全 API 需 ~2700 单位）

### 步骤 4：最终验证
```bash
curl https://thoughts-radar-backend-production.up.railway.app/api/radar/today
```



---

## 🛡️ 发布前质检清单（必须全部通过）

### A. 自动验证（由 API 执行）
- [x] 内容长度 ≥ 500 字符
- [x] 频段 ID 有效
- [x] 立场为 A 或 B

### B. 人工验证（Claude 必须确认）
发布每条内容前，Claude 必须逐条确认：

| 检查项 | 要求 |
|--------|------|
| **source_url 有效** | 链接可访问且为原始来源 |
| **作者权威性** | 是否为该领域公认的思想领袖？ |
| **频段分散度** | 今日内容是否覆盖 6 大领域（T/P/H/Φ/R/F）各 1 条？ |
| **视频配额** | 今日是否有 1-2 条 YouTube 视频内容？ |
| **内容深度** | 是否有结构解释，而非新闻摘要？ |

> ⚠️ **任何一项未通过 = 禁止发布**
> 如不确定，询问用户而非假设通过

---

## 🤖 自动化API端点

### 内容缺口检查
```bash
GET /api/automation/content-gap
# 返回: 当前内容数量、目标数量、可用频段
```

### 多来源搜索计划
```bash
GET /api/automation/search-plan
# 返回: Web/YouTube/RSS/HN搜索查询列表
```

### P2 视频扫描（自动 RSS fallback）🆕
```bash
POST /api/automation/scan-channels
# Body: {"maxVideosPerChannel": 3, "daysBack": 7}
# 返回: { "method": "rss|api", "videosAdded": N, "channelsScanned": N }

POST /api/automation/process-video-queue
# 返回: { "processed": N, "failed": N }
```

### 每日生成入口
```bash
POST /api/automation/generate-daily-v2
# 返回: 搜索计划 + 执行指南（注意：只返回计划，需手动执行 MCP 调用）
```

---

## 🧪 测试规范（2026-01-28 复盘新增）

### 核心原则：全路径覆盖

> **教训来源**：RSS fallback 代码直接发布英文原文，跳过 AI 分析。因测试只覆盖 P2 视频路径，问题上线后才暴露。

### 必须测试的代码路径

| 模块 | 主路径 | Fallback 路径 | 备注 |
|------|--------|---------------|------|
| 内容生成 | P2 视频分析 | **P0 RSS fallback** | 两者都必须测试 |
| 视频扫描 | YouTube API | RSS fallback | API 配额耗尽时触发 |
| 字幕获取 | YouTube 字幕 | 元数据分析 | 无字幕时触发 |

### 测试检查清单

新功能上线前，Claude 必须确认：

- [ ] **主路径测试**：正常流程是否通过？
- [ ] **Fallback 路径测试**：降级流程是否正确执行？
- [ ] **输出质量验证**：生成内容是否符合规范（中文、字数、多样性）？
- [ ] **集成测试**：端到端流程是否完整？

### 验证要点

1. **内容生成必须产出中文**
   - 标题必须是中文
   - 正文 ≥ 400 字符
   - 来源多样化（避免单一作者）

2. **API 响应验证**
   - 检查 `analyzed` 字段是否存在（表示 AI 分析执行）
   - 检查 `errors` 数组是否为空

---

*本文件仅对思想雷达项目生效*
*最后更新：2026-01-28（新增测试规范 - RSS fallback 教训）*
