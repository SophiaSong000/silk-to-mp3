FROM node:18-alpine

# 安装ffmpeg和其他必要工具
RUN apk add --no-cache \
    ffmpeg \
    build-base \
    python3 \
    make \
    g++

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装Node.js依赖
RUN npm ci --only=production

# 复制应用源代码
COPY . .

# 如果有silk_v3_decoder二进制文件，复制并设置权限
# COPY silk_v3_decoder /usr/local/bin/
# RUN chmod +x /usr/local/bin/silk_v3_decoder

# 创建必要的目录
RUN mkdir -p public uploads temp

# 设置权限
RUN chown -R node:node /app
USER node

# 暴露端口
EXPOSE 5000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:5000/api/test || exit 1

# 启动应用
CMD ["node", "server-fixed.js"]