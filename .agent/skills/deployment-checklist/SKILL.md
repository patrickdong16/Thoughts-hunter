---
name: deployment-checklist
description: 部署 Vercel/Railway/腾讯云、定时任务前的强制检查清单，确保执行入口同步、环境变量配置、错误处理完备
---

# 部署检查清单 Skill

## 激活条件

以下场景必须执行此检查：
- 部署到 Vercel / Railway / 腾讯云
- 配置或修改定时任务（GitHub Actions, Railway Cron）
- 新增自动化端点
- 修改涉及调度的配置

---

## 🚨 核心检查项

### 1. 环境变量

- [ ] 所有环境变量已在部署平台配置
- [ ] `.env.example` 已更新包含新变量
- [ ] 启动时验证必需环境变量存在

```javascript
// 示例：启动验证
const required = ['DATABASE_URL', 'YOUTUBE_API_KEY'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`❌ Missing required env: ${key}`);
    process.exit(1);
  }
}
```

### 2. 执行入口同步 (关键!)

> **经验教训**: 新端点写好了，但 workflow 还在调用旧端点

**必须检查**：
```bash
# 列出 workflow 调用的 API
grep -r "api/automation" .github/workflows/

# 检查是否有过时的调用
# 例如：workflow 调用 v1，代码已有 v2
```

- [ ] GitHub Actions workflow 调用正确的端点
- [ ] Railway cron 配置正确
- [ ] 新端点有对应的调用方

### 3. 定时任务可靠性

- [ ] 所有定时任务有超时限制 (`--max-time`)
- [ ] 有失败通知机制（邮件/报告）
- [ ] 有重试机制（或幂等设计）
- [ ] 日志记录完整

### 4. 错误处理

- [ ] 所有 async 函数有 try-catch
- [ ] 所有外部调用有 timeout
- [ ] API 返回格式统一：`{ success, data?, error? }`
- [ ] 失败时有通知机制

### 5. 端到端验证

- [ ] 手动触发一次完整流程
- [ ] 检查日志输出符合预期
- [ ] 确认数据正确写入/读取

---

## 检查模板

```markdown
## 部署检查清单 ✓

### 环境变量
- [ ] `DATABASE_URL` 已配置
- [ ] `YOUTUBE_API_KEY` 已配置
- [ ] `.env.example` 已同步

### 执行入口
- [ ] `daily-update.yml` 调用 `/api/automation/generate-daily`
- [ ] `railway.json` cron 配置正确

### 定时任务
- [ ] 有 `--max-time` 超时限制
- [ ] 有 `/api/report/send-daily` 失败通知

### 端到端验证
- [ ] 已手动触发 workflow
- [ ] 日志输出正常
```

---

## 快速验证命令

```bash
# 1. 检查 workflow 状态
gh run list --workflow=daily-update.yml -L 3

# 2. 检查 API 健康
curl -s https://your-backend/health | jq .

# 3. 检查今日内容
curl -s https://your-backend/api/radar/today | jq length

# 4. 检查内容缺口
curl -s https://your-backend/api/automation/content-gap | jq .
```

---

## 常见问题

| 问题 | 原因 | 解决 |
|------|------|------|
| 定时任务"成功"但没内容 | API 返回 200 但 published=0 | 检查日志，分析筛选条件 |
| 新端点没被调用 | workflow 未更新 | 更新 .github/workflows/ |
| 规则不生效 | 代码没读取配置 | grep 规则名，确认引用 |

---

## 总结

**核心原则**：
1. 环境变量必须在平台配置
2. 执行入口必须同步更新
3. 定时任务必须有超时和通知
4. 部署后必须端到端验证
