# 使用 Node.js 20 官方镜像
FROM node:20-slim

# 设置工作目录
WORKDIR /app

# 安装 yt-dlp 和 ffmpeg 依赖
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    curl \
    && pip3 install --break-system-packages yt-dlp \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 复制 package 文件
COPY package*.json ./

# 安装 npm 依赖
RUN npm install --omit=dev

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["node", "start-with-init.js"]
