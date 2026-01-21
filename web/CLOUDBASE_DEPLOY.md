# 腾讯云 CloudBase 部署指南

将思想雷达 Web 版本部署到腾讯云，让中国大陆用户可以访问。

## 前置条件

1. **腾讯云账号** - 注册 https://cloud.tencent.com
2. **实名认证** - 个人实名即可，无需企业认证
3. **开通 CloudBase** - https://console.cloud.tencent.com/tcb

## 快速部署（3分钟）

### 方式一：命令行部署（推荐）

```bash
cd web
chmod +x deploy-cloudbase.sh
./deploy-cloudbase.sh
```

### 方式二：手动部署

#### 1. 安装 CLI
```bash
npm install -g @cloudbase/cli
```

#### 2. 登录
```bash
tcb login
```

#### 3. 创建环境（如果没有）
访问 https://console.cloud.tencent.com/tcb/env/index
- 点击"新建环境"
- 选择"按量计费"（有免费额度）
- 记录环境 ID（形如 `env-xxxxxx`）

#### 4. 开启静态托管
在 CloudBase 控制台 → 静态网站托管 → 开启

#### 5. 部署
```bash
cd web
tcb hosting deploy . -e 你的环境ID
```

## 访问地址

部署成功后，访问：
```
https://你的环境ID.tcloudbaseapp.com
```

例如：`https://env-abc123.tcloudbaseapp.com`

## 免费额度

CloudBase 按量计费环境提供免费额度：
- 存储：5GB
- CDN 流量：5GB/月
- 云函数：每月 100 万次

对于个人测试完全足够。

## 常见问题

### Q: 页面能打开但数据加载不出来？
A: Railway 后端可能被墙，需要：
1. 检查浏览器控制台是否有网络错误
2. 考虑将后端也迁移到国内

### Q: 如何绑定自己的域名？
A: 在 CloudBase 控制台 → 静态网站托管 → 自定义域名
注意：自定义域名需要 ICP 备案

### Q: 如何更新网站？
A: 重新运行部署命令即可：
```bash
tcb hosting deploy . -e 你的环境ID
```
