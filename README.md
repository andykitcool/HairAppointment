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
# 构建所有包
pnpm build:server && pnpm build:shared && pnpm build:admin

# 构建小程序
pnpm build:miniapp
```

## Docker 部署

项目根目录提供了 `docker-compose.yml`，一键启动所有服务：

```bash
docker-compose up -d
```

包含以下服务：

| 服务 | 容器名 | 端口 | 说明 |
|------|--------|------|------|
| mongo | hair-mongo | 27017 | MongoDB 数据库 |
| redis | hair-redis | 6379 | Redis 缓存 |
| api | hair-api | 3000 | 后端 API 服务 |
| admin | hair-admin | 8080 | Web 管理后台（Nginx 静态服务） |

> 启动前需要在项目根目录创建 `.env` 文件配置环境变量。

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

在项目根目录创建 `.env` 文件：

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
