# 云服务器部署说明

本项目为 **Node + Express 后端**（`/api`、页面）+ **Vite 构建的前端**（`dist`）。推荐用 **Docker** 部署到任意云厂商的 Linux 主机（阿里云 ECS、腾讯云轻量、华为云、AWS 等流程类似）。

## 一、服务器准备

1. 购买一台 **Linux** 云主机（Ubuntu 22.04 / Debian 12 等），记下 **公网 IP**。
2. 在云平台控制台打开 **安全组 / 防火墙**，放行 **TCP 3000**（若你改用 80/443，则放行对应端口）。
3. SSH 登录服务器，安装 Docker（官方文档：<https://docs.docker.com/engine/install/>）。若已安装 Docker Compose 插件，可使用下文 `docker compose` 命令。

## 二、把代码放到服务器

任选一种方式：

- **Git**：在服务器上 `git clone` 你的仓库，再 `cd` 到项目目录。
- **本地上传**：用 WinSCP、scp、`rsync` 将整个项目文件夹上传到服务器（需包含 `package-lock.json`）。

## 三、配置环境变量（可选）

若需要使用 **AI 对话**（Gemini），在服务器项目根目录创建 `.env`：

```bash
cp .env.example .env
nano .env   # 填写 GEMINI_API_KEY=
```

不配置密钥时，站点仍可访问，但依赖 Gemini 的接口会返回不可用提示。

## 四、Docker 一键构建并运行

在项目根目录执行：

```bash
docker compose up -d --build
```

浏览器访问：`http://<服务器公网IP>:3000`

- 修改宿主机映射端口：在 `.env` 中设置 `HOST_PORT=8080`，再执行 `docker compose up -d`。
- 查看日志：`docker compose logs -f web`
- 停止：`docker compose down`

### 仅使用 Docker（不用 Compose）

```bash
docker build -t student-legal-app .
docker run -d --name student-legal -p 3000:3000 \
  -e NODE_ENV=production \
  -e GEMINI_API_KEY="你的密钥" \
  --restart unless-stopped \
  student-legal-app
```

## 五、不用 Docker：直接在服务器跑 Node

```bash
npm ci
npm run build
export NODE_ENV=production
npx tsx server.ts
```

生产环境长期运行建议用 **systemd** 或 **pm2** 守护进程，并配合 **Nginx** 做 HTTPS 与反向代理。

## 六、域名与 HTTPS（简要）

1. 域名 DNS **A 记录** 指向服务器公网 IP。
2. 安装 Nginx，将 `server_name` 设为域名，`location /` **反向代理**到 `http://127.0.0.1:3000`。
3. 使用 **Let’s Encrypt**（如 `certbot`）申请证书，开启 `listen 443 ssl`。

具体 Nginx 配置因系统而异，可把 `proxy_set_header Host $host;` 等一并写上以保证前端路由与接口路径正常。

## 七、注意事项

- **Firebase**：前端使用仓库内的 `firebase-applet-config.json`。若你在控制台限制了域名，需把 **生产环境域名** 加入 Firebase 授权列表。
- **数据目录**：`data/` 下 JSON 在镜像构建时打入镜像；若需在容器外持久化，可自行给 `data` 挂载卷并在文档中说明（当前 `docker-compose` 未挂载卷，升级镜像会覆盖容器内未持久化数据）。
