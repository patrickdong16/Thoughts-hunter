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

## 📦 v5.1 双池管道架构（2026-01-28 新增）

### 数据流

```
Phase 1: Google News + RSS → leads_pool
Phase 2: AI分析 + 深挖 → content_reservoir  
Phase 3: 配额发布 → radar_items
```

### 核心规则（强制执行）

| 规则 | 说明 |
|------|------|
| URL 去重 | 发布前检查 `radar_items` 中已有的 `source_url` |
| 频段去重 | 发布前从 `radar_items` 同步已用频段，maxPerFreq=1 |
| 参数验证 | SQL LIMIT 参数必须使用 `Number.isFinite()` 验证 |

### 核心服务文件

| 文件 | 功能 |
|------|------|
| `leads-manager.js` | 候选池管理 + Lead 深挖 |
| `content-reservoir.js` | 储备池管理 + 发布逻辑 |
| `content-radar.js` | 统一扫描入口（dailyScan） |

---

## ✅ 内容质检规则

### 字数要求（场景分级）

| 场景 | 最小长度 | 说明 |
|------|----------|------|
| RSS/文字分析 | **500 字符** | AI 分析后产出 |
| 视频字幕分析 | **500 字符** | 有字幕时 |
| 视频元数据分析 | **400 字符** | 无字幕 fallback |
| API 验证 | **300 字符** | 最低阻断线 |

### 零重复规则
- **URL 唯一**：同一 URL 不能出现两次
- **视频ID 唯一**：同一 YouTube 视频不能重复
- **标题去重**：相似度 ≥ 80% 必须阻断

### 频段匹配
- 内容必须与选择的频段相关
- 立场（A/B）必须与内容实际观点一致

---

## 📅 每日内容生成流程 v3.0（强制）

> **核心原则**：配置驱动 + 以人为本  
> **配置中心**：`CONTENT_SOURCES.json` (修改即自动生效)

### 采集优先级

| 内容类型 | 优先级顺序 |
|----------|------------|
| **非视频** | Tier1 RSS → Tier2 RSS → Tier3 Substack → Leader RSS → Google |
| **视频** | YouTube 频道扫描 → YouTube 搜索 |

### 配额要求

| 类型 | 普通日 | 主题日 |
|------|--------|--------|
| 非视频 | 5-7 条 | 不限 |
| 视频 | ≥1 条 | 不限 |
| 频段覆盖 | T1/P1/H1/Φ1/F1/R1 各≥1 | 尽量涉猎 |
| 总数 | 6-8 条 | 10-20 条 |

### 推荐流程：一键扫描

```bash
# Step 1: 统一扫描入口（RSS 优先 + 频段平衡）
curl -X POST https://thoughts-radar-backend-production.up.railway.app/api/automation/daily-radar

# Step 2: 视频补充（如视频配额未满）
curl -X POST https://thoughts-radar-backend-production.up.railway.app/api/automation/scan-channels \
  -H "Content-Type: application/json" \
  -d '{"maxVideosPerChannel": 3, "daysBack": 7}'

# Step 3: 处理视频队列
curl -X POST https://thoughts-radar-backend-production.up.railway.app/api/automation/process-video-queue

# Step 4: 最终验证
curl https://thoughts-radar-backend-production.up.railway.app/api/radar/today
```

> **配置驱动**：35 个 RSS 源 (Tier 1-3) 在 `CONTENT_SOURCES.json` 中配置  
> **智能 Fallback**：YouTube API 配额用完自动切换 RSS

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

## 🤖 自动化 API 端点汇总

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/automation/daily-radar` | POST | **统一入口**：RSS 优先扫描 + 频段平衡 |
| `/api/automation/content-gap` | GET | 配额缺口检查 |
| `/api/automation/generate-from-leaders` | POST | P0 思想领袖 RSS 扫描 |
| `/api/automation/scan-channels` | POST | P2 视频扫描（自动 RSS fallback） |
| `/api/automation/process-video-queue` | POST | 处理视频队列 |
| `/api/automation/search-plan` | GET | 多来源搜索计划 |
| `/api/radar/today` | GET | 今日内容验证 |

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
   - 正文长度符合场景规则（见「内容质检规则」表）
   - 来源多样化（避免单一作者）

2. **API 响应验证**
   - 检查 `analyzed` 字段是否存在（表示 AI 分析执行）
   - 检查 `errors` 数组是否为空

---

## 🔧 已知 Bug 修复记录（2026-01-28 复盘）

### 修复清单

| 问题 | 根因 | 修复 |
|------|------|------|
| 内容重复发布 | `publishFromReservoir` 缺少 URL 检查 | 发布前查询 `radar_items` 已有 URL |
| 频段分布违规 | `usedFreqs` 未与数据库同步 | 发布前从 `radar_items` 加载已用频段 |
| INSERT 失败 | 代码列名与表结构不匹配 | 修正为 stance/author_name/tension_q |
| NaN bigint 错误 | `gap.gap + 10` 未验证 | 使用 `Number.isFinite()` 防护 |

### radar_items 表实际结构（重要）

```sql
radar_items (
  id, date, freq, stance,  -- 注意：stance 不是 speaker/tti
  title, author_name, author_avatar, author_bio,
  source, source_url, content,
  tension_q,  -- 注意：不是 tension_question  
  tension_a, tension_b,
  keywords, video_id, yt_view_count...
)
```

---

*本文件仅对思想雷达项目生效*
*最后更新：2026-01-28（v5.1 双池架构 + Bug修复记录）*
