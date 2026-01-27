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

## 📅 每日内容生成流程（强制）

> **核心原则**：配置同步 → 追踪思想领袖 → 扫描多源 → 筛选生成 → 质检发布

### 步骤 0：配置同步 + 思想领袖扫描 🆕 (前导程序)
```bash
# 0a. 从 CONTENT_SOURCES.json 同步领袖列表到数据库
curl -X POST https://thoughts-radar-backend-production.up.railway.app/api/automation/leaders/sync

# 0b. 检查高优先级思想领袖的新发布
curl -X POST https://thoughts-radar-backend-production.up.railway.app/api/automation/leaders/check
```

**配置同步说明**：
- 新增领袖 → 编辑 `CONTENT_SOURCES.json` → 调用 `/leaders/sync`
- 移除领袖 → 从 JSON 删除 → 调用 `/leaders/sync`（数据库标记 inactive）

**处理逻辑**：
1. 若 priority=1 领袖（Dario Amodei, Sam Altman 等）有新文章 → **当日必须收录**
2. 若 priority=2 领袖有新文章 → 优先处理，视频额可调整
3. 若无新发布 → 继续正常流程

### 步骤 1：获取内容缺口
```bash
curl https://thoughts-radar-backend-production.up.railway.app/api/automation/content-gap
# 返回: 当前内容数量、目标数量、可用频段
```

### 步骤 2：调用搜索计划
```bash
curl https://thoughts-radar-backend-production.up.railway.app/api/automation/search-plan
```

### 步骤 3：执行多源搜索（必须执行）
根据搜索计划，使用以下 MCP 工具采集内容：

| 优先级 | 来源类型 | MCP 工具 | 说明 |
|--------|----------|----------|------|
| **0** | 思想领袖 | `/api/automation/leaders/pending` | 高优先级领袖待处理文章 |
| 1 | RSS | `mcp_rss-reader_fetch_feed_entries` | aeon.co, technologyreview.com |
| 2 | HackerNews | `mcp_hackernews_getStories` | top stories |
| 3 | arXiv | `mcp_arxiv_search_papers` | cs.AI 论文 |
| 4 | YouTube | `mcp_youtube-transcript_get_transcript` | 视频字幕 |

### 步骤 4：质检后提交
每条内容必须通过质检清单后才能提交。

### 步骤 5：验证结果
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

### 每日生成入口
```bash
POST /api/automation/generate-daily-v2
# 返回: 搜索计划 + 执行指南（注意：只返回计划，需手动执行 MCP 调用）
```

---

*本文件仅对思想雷达项目生效*
*最后更新：2026-01-27（新增思想领袖前导扫描步骤、重构执行流程，复盘新增 Railway 禁区、多源执行流程、质检清单）*
