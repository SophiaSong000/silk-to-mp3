# 微信语音转换器部署指南

## 部署架构概述

由于你的项目是前后端分离的架构，需要分别部署：
- **前端 (React)**: 可以部署到 Vercel/Netlify/GitHub Pages
- **后端 (Node.js)**: 需要支持服务器端运行的平台

## 🚨 重要限制说明

### 关键问题：依赖工具
你的项目依赖两个关键工具：
1. **silk_v3_decoder** - 解码微信语音文件
2. **ffmpeg** - 音频格式转换

这些工具需要在服务器上安装，但大多数免费平台都有限制：
- Vercel/Netlify: 主要用于静态网站和简单API，不支持安装系统工具
- Railway/Render: 免费版有使用时间限制
- Heroku: 已停止免费服务

## 推荐部署方案

### 方案一：Railway (推荐) 🌟
**优点**: 支持Docker，可以安装系统工具，有免费额度
**缺点**: 免费版每月500小时限制

### 方案二：Render
**优点**: 支持Docker，界面友好
**缺点**: 免费版会休眠，启动较慢

### 方案三：自建VPS (最稳定)
**优点**: 完全控制，无限制
**缺点**: 需要购买服务器（最低约$5/月）

## 详细部署步骤

### 🚀 方案一：Railway 部署 (推荐)

#### 1. 准备工作
```bash
# 1. 将代码推送到GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/silk-converter.git
git push -u origin main
```

#### 2. 创建 Dockerfile
```dockerfile
# 在项目根目录创建 Dockerfile
FROM node:18-alpine

# 安装系统依赖
RUN apk add --no-cache \
    ffmpeg \
    wget \
    build-base

# 设置工作目录
WORKDIR /app

# 复制后端代码
COPY silk-converter/server/package*.json ./
RUN npm install

# 下载并安装 silk_v3_decoder
RUN wget https://github.com/kn007/silk-v3-decoder/raw/master/converter/unix/silk_v3_decoder \
    && chmod +x silk_v3_decoder \
    && mv silk_v3_decoder /usr/local/bin/

# 复制应用代码
COPY silk-converter/server/ ./

# 创建必要目录
RUN mkdir -p public uploads temp

# 暴露端口
EXPOSE 5000

# 启动应用
CMD ["node", "server-fixed.js"]
```

#### 3. Railway 部署步骤
1. 访问 [railway.app](https://railway.app)
2. 使用GitHub账号登录
3. 点击 "New Project" → "Deploy from GitHub repo"
4. 选择你的仓库
5. Railway会自动检测Dockerfile并部署

#### 4. 配置环境变量
在Railway控制台设置：
```
PORT=5000
NODE_ENV=production
```

### 🌐 前端部署到Vercel

#### 1. 修改前端API地址
```javascript
// 在 silk-converter-new-client/src/App.js 中
// 将所有 http://localhost:5000 替换为你的Railway后端地址
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-app.railway.app';

// 修改所有API调用
const response = await axios.post(`${API_BASE_URL}/api/upload`, formData, {
  // ...
});
```

#### 2. 创建环境变量文件
```bash
# silk-converter-new-client/.env.production
REACT_APP_API_URL=https://your-railway-app.railway.app
```

#### 3. Vercel部署
1. 访问 [vercel.com](https://vercel.com)
2. 导入GitHub仓库
3. 选择 `silk-converter-new-client` 目录
4. 设置环境变量 `REACT_APP_API_URL`
5. 部署

### 🔧 方案二：完全免费方案 (有限制)

如果你想完全免费，可以考虑：

#### 使用 Glitch.com
1. 支持Node.js应用
2. 有一定的免费额度
3. 可能需要简化功能（去掉silk_v3_decoder，只支持标准音频格式）

#### 使用 Replit
1. 在线IDE和托管平台
2. 支持安装系统包
3. 免费版有限制但可用

## 生产环境优化

### 1. 创建生产版服务器文件
```javascript
// server/server-production.js
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// 生产环境CORS配置
app.use(cors({
  origin: [
    'https://your-vercel-app.vercel.app',
    'https://your-domain.com'
  ],
  credentials: true
}));

// 其他配置...
```

### 2. 添加健康检查端点
```javascript
// 添加到服务器文件
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});
```

### 3. 添加错误处理和日志
```javascript
// 全局错误处理
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});
```

## 成本分析

### 免费方案
- **Railway**: 500小时/月免费 (约20天)
- **Vercel**: 前端托管完全免费
- **总成本**: $0/月

### 付费方案 (推荐生产环境)
- **Railway Pro**: $5/月
- **或 DigitalOcean Droplet**: $5/月
- **Vercel**: 免费
- **总成本**: $5/月

## 部署检查清单

### 部署前
- [ ] 代码推送到GitHub
- [ ] 创建Dockerfile
- [ ] 配置环境变量
- [ ] 测试本地Docker构建

### 部署后
- [ ] 检查后端健康状态
- [ ] 测试文件上传功能
- [ ] 测试文件转换功能
- [ ] 检查CORS配置
- [ ] 监控资源使用情况

## 故障排除

### 常见问题
1. **silk_v3_decoder 找不到**
   - 确保Dockerfile中正确安装
   - 检查文件权限

2. **ffmpeg 错误**
   - 确保Alpine Linux包正确安装
   - 检查音频文件格式

3. **CORS 错误**
   - 检查前端API地址配置
   - 确认后端CORS设置

4. **文件上传失败**
   - 检查文件大小限制
   - 确认临时目录权限

## 监控和维护

### 日志监控
- Railway提供内置日志查看
- 可以集成第三方监控服务

### 性能优化
- 定期清理临时文件
- 监控内存使用
- 设置文件大小限制

## 下一步行动

1. **立即开始**: 选择Railway方案，按步骤部署
2. **测试验证**: 部署后全面测试功能
3. **域名配置**: 可选择绑定自定义域名
4. **监控设置**: 配置错误报告和性能监控

需要我帮你创建具体的配置文件吗？