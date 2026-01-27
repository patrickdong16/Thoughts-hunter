---
name: execution-entry-sync
description: 新功能实现后检查所有执行入口（workflow, cron, 调度器）是否同步更新，避免"代码写了但没被调用"的问题
---

# 执行入口同步检查 Skill

## 问题背景

**典型失败场景**：
- 新增 `generate-daily-v2` 端点，但 GitHub Actions 仍调用旧的 `generate-daily`
- 更新 `day-config.json` 规则，但代码没有读取该规则
- 实现新服务，但没有任何定时任务或入口调用它

**根本原因**：Claude 专注于"新功能"，忽略了"调用方"

---

## 激活条件

以下场景必须执行此检查：
- 新增或修改自动化端点
- 更新配置文件（如 day-config.json）
- 修改定时任务相关逻辑
- 任何需要被调度器/workflow 调用的功能

---

## 强制检查清单

### 1. 搜索执行入口

```bash
# 检查 GitHub Actions 调用了哪些 API
grep -r "api/automation" .github/workflows/
grep -r "api/collection" .github/workflows/

# 检查 Railway cron 配置
cat railway.json | jq '.deploy.cron'

# 找出所有定时触发点
grep -r "cron:" .github/workflows/
```

### 2. 配置规则引用检查

对于配置文件中的每个规则，必须验证代码是否读取：

```bash
# 示例：检查 maxVideos 规则
grep -r "maxVideos" backend/

# 如果搜索结果为空 → 规则未被使用 → 需要修复
```

### 3. 新端点调用检查

新增端点后，必须回答：
- [ ] 谁会调用这个端点？（workflow? 前端? 手动?）
- [ ] 如果是自动调用，调用方是否已更新？
- [ ] 如果是替代旧端点，旧调用方是否已切换？

### 4. 端到端验证

**不能只测试新代码，必须模拟完整流程**：

```bash
# 手动触发 workflow
gh workflow run daily-update.yml

# 或调用完整链路
curl -X POST https://your-backend/api/automation/generate-daily
```

---

## 检查模板

提交代码前，填写此模板：

```markdown
## 执行入口检查 ✓

### 本次新增/修改的端点:
- [ ] `POST /api/xxx` - 用途：___

### 调用方确认:
| 调用方 | 文件位置 | 是否已更新 |
|--------|----------|------------|
| GitHub Actions | .github/workflows/xxx.yml | ✅/❌ |
| Railway Cron | railway.json | ✅/❌ |
| 前端 | web/xxx.js | ✅/❌ |

### 配置规则确认:
| 规则名 | 配置文件 | 代码引用位置 |
|--------|----------|--------------|
| xxx | day-config.json | routes/xxx.js |

### 端到端验证:
- [ ] 已手动触发一次完整流程
- [ ] 日志输出符合预期
```

---

## 典型错误案例

### ❌ 错误做法
```
1. 创建 generate-daily-v2 端点
2. 测试端点可以返回正确数据
3. 提交代码，声称"功能完成"
4. → 第二天发现定时任务还在调用 v1
```

### ✅ 正确做法
```
1. 创建 generate-daily-v2 端点
2. 搜索 "generate-daily" 在 .github/ 中的引用
3. 发现 daily-update.yml 调用了 v1
4. 更新 workflow 或修改 v1 代码
5. 手动触发一次 workflow 验证
6. 提交代码
```

---

## 自动化命令

将此脚本添加到项目，每次提交前运行：

```bash
#!/bin/bash
# scripts/check-entry-sync.sh

echo "🔍 检查执行入口同步..."

# 1. 列出所有自动化端点
echo "📡 后端自动化端点:"
grep -h "router.post\|router.get" backend/routes/automation.js | head -10

# 2. 列出 workflow 调用的 API
echo ""
echo "🔄 Workflow 调用的 API:"
grep -h "api/automation" .github/workflows/*.yml

# 3. 检查配置规则
echo ""
echo "⚙️ day-config.json 规则引用检查:"
for rule in maxVideos minItems minDuration; do
  count=$(grep -r "$rule" backend/routes/ backend/services/ | wc -l)
  if [ $count -gt 0 ]; then
    echo "  ✅ $rule: 被引用 $count 次"
  else
    echo "  ❌ $rule: 未被引用!"
  fi
done
```

---

## 总结

**核心原则**：代码实现 ≠ 功能上线

**必须验证**：
1. 新端点有调用方
2. 配置规则被代码读取
3. 旧入口已切换到新逻辑
4. 端到端流程可用

**一句话**：实现功能后，grep 一下 .github/ 和 railway.json
