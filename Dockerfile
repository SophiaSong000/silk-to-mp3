# 微信语音转换器 Docker 配置
FROM node:18-alpine

# 安装系统依赖
RUN apk add --no-cache \
    ffmpeg \
    wget \
    build-base \
    python3 \
    make \
    g++

# 设置工作目录
WORKDIR /app

# 复制package.json文件
COPY silk-converter/server/package*.json ./

# 安装Node.js依赖
RUN npm install --production

# 下载并安装 silk_v3_decoder
RUN wget -O silk_v3_decoder https://github.com/kn007/silk-v3-decoder/raw/master/converter/unix/silk_v3_decoder && \
    chmod +x silk_v3_decoder && \
    mv silk_v3_decoder /usr/local/bin/

# 复制应用代码
COPY silk-converter/server/ ./

# 创建必要目录
RUN mkdir -p public uploads temp && \
    chmod 755 public uploads temp

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=5000

# 暴露端口
EXPOSE 5000

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# 启动应用
CMD ["node", "server-fixed.js"]