# 🚀 生产环境部署完整指南

## 📋 部署概述

我们的项目是**前后端分离架构**：
- **前端**：React应用（静态文件）
- **后端**：Node.js Express服务器（API服务）

需要分别部署到不同的服务器或服务上。

## 🛠 部署前准备工作

### 1. 服务器要求

#### 后端服务器要求：
- **操作系统**：Linux (推荐 Ubuntu 20.04+) 或 Windows Server
- **Node.js**：版本 16+ 
- **内存**：至少 1GB RAM
- **存储**：至少 10GB 可用空间
- **网络**：公网IP，开放端口（如5000）

#### 前端部署要求：
- **静态文件托管**：可以是CDN、Nginx、或云服务
- **HTTPS支持**：推荐使用SSL证书
- **域名**：准备好你的域名

### 2. 必需的工具和依赖

#### 后端服务器需要安装：
```bash
# Node.js 和 npm
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2 (进程管理器)
npm install -g pm2

# FFmpeg (音频处理)
sudo apt update
sudo apt install ffmpeg

# silk_v3_decoder (需要编译或下载)
# 这个我们稍后详细说明
```

## 📦 第一步：准备部署文件

### 1. 创建生产环境配置

<function_calls>
<invoke name="fsWrite">
<parameter name="path">server/ecosystem.config.jsxports = {
  apps: [{
    name: 'silk-converter-api',
    script: 'server.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};