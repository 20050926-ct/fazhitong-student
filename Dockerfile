# 在云服务器上用 Docker 构建并运行（单阶段，兼容常见云厂商 Linux 环境）
FROM node:22-bookworm-slim

WORKDIR /app

# 先装依赖再拷源码，利用层缓存
COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

# 生产模式由 server.ts 读取 NODE_ENV，提供 dist 静态资源 + /api
CMD ["./node_modules/.bin/tsx", "server.ts"]
