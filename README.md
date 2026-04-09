# 美发预约记账系统

> 美发消费者预约工具 + 美发店管理工具 + 美发产品推荐平台，基于 Monorepo 架构开发。

## 功能特性

- **预约管理** — 顾客在线预约、查询空档、代预约，支持服务阶段时间线（染发/烫发中间空闲阶段可接其他顾客）
- **记账管理** — 手动记账 + COZE 语音记账，支持多支付方式
- **打烊管理** — 临时打烊、段打烊（午休）、延长营业时间（节假日）
- **COZE 智能体** — 每店独立绑定 COZE 智能体，通过豆包 App 语音操作（记账、管理预约、查数据等）
- **飞书集成** — 每店独立绑定飞书多维表格，双向数据同步，店内大屏看板
- **消息通知** — 微信订阅消息 / 短信，支持群发通知
- **Web 管理后台** — 超级管理员 + 店长双角色，门店审核、数据统计、服务管理
- **微信小程序** — 顾客端 + 店长端共用，店长登录后展示管理功能

## 系统架构

```
微信小程序（顾客/店长）  Web 管理后台（超管/店长）  COZE 智能体（豆包 App）
           │                    │                      │
           └─────────── Nginx 反向代理 + HTTPS ─────────┘
                              │
                      ┌───────┴───────┐
                      │  Node.js API  │
                      │  (Koa.js)     │
                      └───────┬───────┘
                              │
                 ┌────────────┼────────────┐
                 │            │            │
            ┌────┴────┐  ┌───┴───┐   ┌────┴────┐
            │ MongoDB │  │ Redis │   │  飞书    │
            └─────────┘  └───────┘   └─────────┘
```

## 技术栈

| 层 | 技术 |
|----|------|
| 小程序前端 | uni-app (Vue 3) + TypeScript + Pinia |
| Web 管理后台 | Vue 3 + Element Plus + TypeScript + Pinia + Vite |
| 后端 API | Node.js + Koa + TypeScript + Mongoose |
| 数据库 | MongoDB 7 |
| 缓存 | Redis 7 |
| 定时任务 | node-cron |
| 智能体 | COZE (HTTP API) |
| 管理看板 | 飞书多维表格 |
| 部署 | Docker + Docker Compose |
| 包管理 | pnpm Workspaces (Monorepo) |

## 快速开始

### 环境要求

- Node.js >= 18
- pnpm >= 9
- MongoDB >= 7
- Redis >= 7

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
# 启动后端 API 服务
pnpm dev:server

# 启动微信小程序开发
pnpm dev:miniapp

# 启动 Web 管理后台
pnpm dev:admin
```

### 构建

```bash
# 构建共享包、后端和后台
pnpm build:shared && pnpm build:server && pnpm build:admin

# 构建小程序
pnpm build:miniapp
```

## 生产/预发部署

建议先用预发域名做联调，再进入正式环境。当前仓库已经具备生产环境进一步测试的基础条件，但仍有少量已知限制，见文末“已知风险”。

### 1. 准备环境变量

根目录容器环境：

```bash
Copy-Item .env.deploy .env
```

然后按实际环境修改 `.env`，至少包括：

- `JWT_SECRET`：替换为高强度随机串
- `WX_APPID` / `WX_APPSECRET`：替换为真实小程序配置
- 如使用外部数据库或 Redis，改成实际连接地址

管理后台静态资源访问地址：参考 `packages/admin/.env.example`

- `VITE_PUBLIC_FILE_BASE_URL` 应指向可被浏览器访问的 API 域名，例如 `https://api.example.com` 或统一入口域名

小程序接口地址：参考 `packages/miniapp/.env.example`

- `VITE_API_BASE_URL` 必须指向线上 API，例如 `https://api.example.com/api`
- 生产构建下如果未配置该值，小程序会直接报“接口地址未配置”

### 2. 构建与启动

先做本地构建校验：

```bash
pnpm lint
pnpm build:shared
pnpm build:server
pnpm build:admin
pnpm build:miniapp
```

再构建生产镜像并启动：

```bash
docker compose -f docker-compose.yml build api admin
docker compose -f docker-compose.yml up -d
```

如果生产环境通过镜像仓库拉取部署，推荐使用仓库根目录新增的 `docker-compose.images.yml`：

```bash
# 1) 准备镜像部署变量
Copy-Item .env.images.example .env.images

# 2) 登录镜像仓库
docker login <your-registry>

# 3) 构建并推送 API / Admin 镜像
docker build -f packages/server/Dockerfile -t <image-prefix>/api:<tag> .
docker build -f packages/admin/Dockerfile -t <image-prefix>/admin:<tag> .
docker push <image-prefix>/api:<tag>
docker push <image-prefix>/admin:<tag>

# 4) 在生产服务器拉取并启动
docker compose --env-file .env.images -f docker-compose.images.yml pull
docker compose --env-file .env.images -f docker-compose.images.yml up -d
```

其中：

- `<image-prefix>` 形如 `registry.example.com/your-namespace/hairappointment`
- `<tag>` 建议使用发布日期或 Git commit SHA，避免线上误拉取 `latest`
- `.env` 继续提供 API 运行时环境变量，`.env.images` 负责镜像地址与标签

当前 `packages/server/Dockerfile` 已在构建 API 镜像时一并构建并打包微信小程序产物，因此线上后台的“小程序上传代码”功能可以直接复用镜像内的 `packages/miniapp/dist/build/mp-weixin`

包含以下服务：

| 服务 | 容器名 | 端口 | 说明 |
|------|--------|------|------|
| mongo | hair-mongo | 27017 | MongoDB 数据库 |
| redis | hair-redis | 6379 | Redis 缓存 |
| api | hair-api | 3000 | 后端 API 服务 |
| admin | hair-admin | 8080 | Web 管理后台（Nginx 静态服务） |

实际宿主机暴露端口见 `docker-compose.yml`：

- API：`3100`
- Admin：`9080`
- MongoDB：`27018`
- Redis：`6380`

### 3. 启动后验证

- 访问 API 健康检查：`http://<host>:3100/health`
- 打开管理后台：`http://<host>:9080`
- 确认上传文件在重启容器后仍可访问，当前已挂载 `uploads-data` 持久卷
- 如果启用了后台“小程序代码上传”，可在管理后台执行一次上传，确认 API 容器内置的小程序构建产物可正常被 `miniprogram-ci` 使用

### 生产环境变量要求

- `JWT_SECRET` 必须替换为长度不少于 16 位的强随机值，服务端已拒绝弱默认值启动
- `WX_APPID` / `WX_APPSECRET` 在生产环境中不得保留示例占位值
- `CORS_ALLOWED_ORIGINS` 使用英文逗号分隔允许跨域访问的来源；如果 admin 与 API 通过同域反代访问，可保持为空

### 4. 小程序发布前要求

- 在构建前注入 `VITE_API_BASE_URL`
- 确认微信后台业务域名、服务器域名已配置为实际线上域名
- 生产包中已隐藏“开发环境/修改地址”入口，不应再依赖手工改接口地址调试

## 可用脚本

| 命令 | 说明 |
|------|------|
| `pnpm dev:server` | 启动后端 API 开发服务 |
| `pnpm dev:miniapp` | 启动微信小程序开发 |
| `pnpm dev:admin` | 启动 Web 管理后台开发 |
| `pnpm build:server` | 构建后端 API |
| `pnpm build:miniapp` | 构建微信小程序 |
| `pnpm build:admin` | 构建 Web 管理后台 |
| `pnpm build:shared` | 构建共享类型包 |
| `pnpm lint` | ESLint 代码检查 |
| `pnpm clean` | 清理所有 dist 目录 |

## 项目结构

```
HairAppointment/
├── packages/
│   ├── shared/        # 共享类型定义、常量、工具函数
│   ├── server/        # 后端 API 服务 (Koa + Mongoose)
│   ├── admin/         # Web 管理后台 (Vue 3 + Element Plus)
│   └── miniapp/       # 微信小程序 (uni-app + Vue 3)
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

### 子包说明

| 子包 | 包名 | 说明 |
|------|------|------|
| shared | `@hair/shared` | 共享类型定义、枚举常量、校验工具 |
| server | `@hair/server` | REST API 服务，含认证、预约、记账、通知、飞书同步等模块 |
| admin | `@hair/admin` | Web 管理后台，超管/店长双角色 |
| miniapp | `@hair/miniapp` | 微信小程序，顾客端 + 店长端 |

## 环境变量

根目录环境变量可参考 `.env.example` 或 `.env.deploy`：

```env
# 服务器端口
PORT=3000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/hair_appointment

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT 密钥
JWT_SECRET=your_jwt_secret

# 微信小程序
WX_APPID=your_appid
WX_SECRET=your_secret

# COZE（可选，每店在 Web 后台独立配置）
COZE_API_ENDPOINT=https://api.coze.cn/v1
```

## 已知风险

- 当前 `pnpm-lock.yaml` 与部分 `package.json` 仍有漂移；Dockerfile 现使用 `pnpm install --no-frozen-lockfile` 作为临时兜底，适合继续测试，不适合作为最终可复现发布基线。
- 本机 `pnpm install --lockfile-only` 在当前环境会触发 `ERR_INVALID_THIS` 拉取元数据失败，因此 lockfile 需要在网络与 pnpm 环境正常的机器上回正后再提交。
- `pnpm lint` 目前只覆盖 `packages/*/src/**/*.ts`，尚未覆盖 `.vue` 单文件组件。
- 新增的 `docker-compose.images.yml` 依赖 `.env.images` 提供 `IMAGE_PREFIX` 和 `IMAGE_TAG`；若缺失这两个变量，Compose 无法解析 API/Admin 镜像地址。
- 飞书同步、短信/通知等模块仍存在 TODO 占位逻辑，适合功能受控测试，不建议在公开环境默认开启相关承诺能力。

## 开发规范

详细开发规范请参考 [美发预约记账系统-开发规范文档v4.md](./美发预约记账系统-开发规范文档v4.md)，包含：

- 系统角色与权限设计
- 数据库设计（9 个集合）
- 预约冲突检测算法
- COZE 智能体命令集
- API 接口清单
- 消息通知设计
- 产品演进路线

## License

Private
