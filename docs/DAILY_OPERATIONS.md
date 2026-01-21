# 思想雷达 - 每日运维手册

本文档记录系统每日自动化任务和故障排查指南。

---

## 服务配置

| 服务 | 平台 | URL/ID |
|------|------|--------|
| 后端 API | Railway | `https://thoughts-radar-backend-production.up.railway.app` |
| 海外前端 | Vercel | `https://thoughts-hunter.vercel.app` |
| 大陆前端 | CloudBase | `https://thoughts-rador26-2f3u8ht52110fab.tcloudbaseapp.com` |
| CloudBase ENV | 腾讯云 | `thoughts-rador26-2f3u8ht52110fab` |

---

## 每日自动化任务时间表

| 时间（北京） | 任务 | 触发方式 | 说明 |
|-------------|------|---------|------|
| 06:00 | 内容采集 | GitHub Actions | 检查 YouTube 频道新视频 |
| 06:00 | 推送通知 | GitHub Actions | 向已注册设备发送每日推送 |

---

## 任务详情

### 1. 内容采集 (`check-all`)

**触发**：GitHub Actions `daily-update.yml` 每天 UTC 22:00（北京 06:00）

**流程**：
1. 调用 `POST /api/collection/check-all`
2. 遍历所有 `status='active'` 的 YouTube 频道
3. 获取每个频道最新视频
4. 记录新视频到 `collection_log` 表

**注意**：此任务只是采集候选内容，**不会自动生成 `radar_items`**。需要：
- 人工通过 CMS 审核发布
- 或调用 AI 分析接口

### 2. 推送通知 (`send-daily`)

**触发**：GitHub Actions 在内容采集后执行

**流程**：
1. 调用 `POST /api/push/send-daily`
2. 查询当日 `radar_items` 数量
3. 向所有活跃 `push_tokens` 发送推送
4. 记录结果到 `push_log` 表

---

## 故障排查

### 问题：用户未收到推送

**检查步骤**：

1. **检查推送令牌是否注册**
   ```bash
   curl https://thoughts-radar-backend-production.up.railway.app/api/push/stats
   ```
   确认 `activeTokens` 有数据

2. **检查推送日志**
   查看 `push_log` 表最近记录，确认 `success_count > 0`

3. **手动触发推送测试**
   ```bash
   curl -X POST https://thoughts-radar-backend-production.up.railway.app/api/push/send-daily \
     -H "Content-Type: application/json"
   ```

### 问题：今日内容不显示

**检查步骤**：

1. **确认"今天"的日期**
   API 使用北京时区，检查返回的 `date` 字段：
   ```bash
   curl https://thoughts-radar-backend-production.up.railway.app/api/radar/today
   ```

2. **检查数据库是否有该日期的内容**
   ```sql
   SELECT date, COUNT(*) FROM radar_items GROUP BY date ORDER BY date DESC LIMIT 5;
   ```

3. **手动添加今日内容**
   通过 CMS 或 API 添加 `radar_items`

### 问题：GitHub Actions 未运行

**检查步骤**：

1. 访问仓库 Actions 页面确认 workflow 状态
2. 检查 cron 表达式：`0 22 * * *`（UTC 22:00 = 北京 06:00）
3. 手动触发：点击 "Run workflow" 按钮

---

## 监控检查清单

每日应检查：

- [ ] 后端健康：`GET /health` 返回成功
- [ ] 今日内容：`GET /api/radar/today` 有数据
- [ ] 推送状态：`GET /api/push/stats` 查看发送记录
- [ ] GitHub Actions：检查 workflow 运行状态

---

## API 快速参考

| 操作 | 命令 |
|------|------|
| 健康检查 | `curl .../health` |
| 今日内容 | `curl .../api/radar/today` |
| 手动采集 | `curl -X POST .../api/collection/check-all` |
| 手动推送 | `curl -X POST .../api/push/send-daily` |
| 推送统计 | `curl .../api/push/stats` |

**基础 URL**：`https://thoughts-radar-backend-production.up.railway.app`
