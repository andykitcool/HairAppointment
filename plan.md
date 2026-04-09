## 产品概述

美发预约记账系统 -- 面向 C 端消费者的预约工具 + B 端美发店管理工具 + 产品推荐平台。Phase 1 核心目标：服务 1 家特定美发店打磨产品，验证核心流程。

## 2026-04-07 结构调整说明

- 平台首页搜索店面后，点击“预约”进入门店预约页 `pages/index/index`。
- TAB 中间“预约”页直接绑定门店预约页 `pages/index/index`。
- 原 `pages/appointment/list` 页面内容下线（预约信息已整合进个人中心）。
- 预约成功后的跳转统一为 `uni.switchTab({ url: '/pages/index/index' })`。

## 系统角色

- **超级管理员**：平台运营者，Web 后台登录，管理所有门店
- **店长**：门店管理者，小程序微信登录 + Web 后台账号密码
- **顾客**：消费者，小程序微信登录，预约和管理预约

## 核心功能模块

- **顾客端小程序**：门店浏览、查询空档、创建/修改/取消预约、历史预约、个人中心
- **店长端小程序**：店务总览、预约管理（确认/取消/修改）、代预约、服务管理、手动记账、营业设置（打烊/延长营业）、顾客管理、营收统计、消息通知
- **后端 API**：认证、预约全生命周期管理（5分钟自动确认）、记账、服务/门店/顾客管理、飞书集成、COZE 智能体接口、定时任务
- **Web 管理后台**：超管+店长共用，数据总览、预约/交易/服务/顾客管理、COZE/飞书/通知配置、超管门店审核
- **预约冲突检测**：基于 timeline 中 staff_busy=true 阶段检测重叠
- **消息通知**：微信订阅消息 + 短信（可配置）
- **飞书集成**：每店独立绑定多维表格，双向同步
- **COZE 智能体**：每店独立绑定，语音记账/预约状态变更/散客登记等

## 关键业务规则

- 单店主模式（Phase 1），跳过选择发型师步骤
- 预约状态流转：pending -> confirmed -> in_progress -> completed
- 5分钟超时自动确认，修改预约后重置为 pending
- 价格以**元**为单位存储（Number 类型，如 30 表示 30 元），appointment_id 格式 YYYYMMDD-NNN
- 染发/烫发中间有静置阶段（staff_busy=false），发型师可服务其他顾客

## 技术栈选型

| 层 | 技术选型 | 说明 |
| --- | --- | --- |
| 小程序前端 | uni-app (Vue 3) + Pinia + uni-ui | 微信小程序，顾客端 + 店长端 |
| Web 管理后台 | Vue 3 + Element Plus + Pinia + Vue Router | 超管和店长 Web 管理界面 |
| 后端 API | Node.js + Koa + Koa-router + Koa-body | REST API 服务 |
| ORM | Mongoose | MongoDB 数据模型定义与查询 |
| 数据库 | MongoDB（本地部署） | 9 个集合 |
| 缓存 | Redis + ioredis | 会话管理、预约锁、频繁查询缓存 |
| 定时任务 | node-cron | 5项定时任务 |
| 认证 | JWT (小程序) + koa-session (Web) | 多端认证 |
| 部署 | Nginx + PM2 | 阿里云 2 核 2G |
| 包管理 | pnpm workspace | Monorepo 管理 |


## 实现方案

### 整体架构

采用 pnpm workspace monorepo 结构，三个子包独立开发、共享类型定义：

```
HairAppointment/
  packages/
    shared/        -- 共享类型定义、常量、工具函数
    server/        -- Node.js + Koa 后端 API
    miniapp/       -- uni-app 微信小程序
    admin/         -- Vue 3 + Element Plus Web 管理后台
```

### 后端架构

分层架构：路由层 -> 控制器层 -> 服务层 -> 数据访问层（Mongoose Model）

- **路由层**（routes/）：按业务模块拆分路由文件，统一挂载到 Koa 实例
- **控制器层**（controllers/）：请求参数校验、调用 service、组装响应
- **服务层**（services/）：核心业务逻辑（预约冲突检测、状态流转、记账等）
- **数据访问层**（models/）：Mongoose Schema + 静态方法/实例方法
- **中间件**（middleware/）：JWT 认证、Session 认证、COZE API Key 认证、权限校验、错误处理
- **定时任务**（cron/）：node-cron 集成在 Koa 服务中，5 项定时任务
- **任务调度器**（jobs/）：飞书同步重试等异步任务

### 小程序架构

- **分包策略**：采用 uni-app 分包加载，顾客端页面为主包（默认加载），店长端页面为独立分包（pages/owner/），按需加载
  - 主包（customer）：首页、创建预约、我的预约、个人中心、公共组件
  - 分包（owner）：店务总览、预约管理、代预约、服务管理、手动记账、营业设置、顾客管理、营收统计、消息通知、申请店长
- Pinia stores 管理：用户状态、预约列表、门店信息
- API 层封装统一请求（uni.request + JWT 拦截器）
- 角色判断在 onShow 中动态切换 tabBar 和个人中心入口

### Web 后台架构

- Vue Router 路由守卫实现权限控制（超管/店长角色路由）
- Element Plus 组件库 + 自定义主题色
- API 层封装 axios 请求 + Session Cookie
- 按功能模块拆分视图和组件

## 实现要点

### 预约冲突检测

- 只检查 timeline 中 staff_busy=true 的阶段
- 依次校验：营业时间（含延长营业）-> 打烊时段 -> 已有预约冲突
- 创建预约时前后端双重校验，后端原子操作防并发

### 5分钟自动确认

- node-cron 每分钟扫描 pending 状态预约
- 检查 create_time + 5min < now() 条件
- 批量更新 + 批量发送通知

### 飞书同步防循环

- 飞书写入本地标记 _sync_source = 'feishu'
- 同步到飞书前检查标记，已存在则跳过
- sync_logs 记录所有同步操作，支持失败重试（最多3次）

### 性能考虑

- Redis 缓存门店信息、服务列表等频繁读取数据
- MongoDB 索引优化：merchant_id + date 组合索引、status 索引
- 预约列表查询限制分页，避免全量加载

## 目录结构

```
f:/code/HairAppointment/
├── pnpm-workspace.yaml              # [NEW] pnpm workspace 配置
├── package.json                     # [NEW] 根 package.json
├── .gitignore                       # [NEW]
├── .env.example                     # [NEW] 环境变量模板
├── packages/
│   ├── shared/                      # [NEW] 共享模块
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── types/               # 类型定义（Role, AppointmentStatus, PaymentMethod 等枚举和接口）
│   │       ├── constants/           # 常量（预设服务数据、状态映射等）
│   │       └── utils/               # 工具函数（时间重叠判断、ID生成逻辑等）
│   ├── server/                      # [NEW] 后端 API
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── app.ts               # Koa 应用入口
│   │       ├── config/              # 环境配置、数据库连接
│   │       ├── models/              # 9 个 Mongoose Schema（admins, merchants, users, services, staff, appointments, transactions, shop_closed_periods, sync_logs）
│   │       ├── routes/              # 路由定义（auth, appointments, transactions, services, merchants, customers, notifications, feishu, admin）
│   │       ├── controllers/         # 控制器（对应每个路由模块）
│   │       ├── services/            # 业务逻辑（appointmentService, billingService, slotService, notificationService, feishuService 等）
│   │       ├── middleware/           # JWT/Session/COZE 认证、权限校验、错误处理、请求日志
│   │       ├── cron/                # 定时任务（重置计数器、自动确认、超时标记、预约提醒、同步重试）
│   │       └── utils/               # 服务端工具（JWT 工具、微信 API 调用、短信发送等）
│   ├── miniapp/                     # [NEW] 微信小程序
│   │   ├── package.json
│   │   ├── src/
│   │   │   ├── App.vue
│   │   │   ├── main.ts
│   │   │   ├── pages.json           # 页面路由和 tabBar 配置
│   │   │   ├── manifest.json        # 微信小程序配置
│   │   │   ├── pages/
│   │   │   │   ├── index/           # 首页（门店信息 + 服务卡片 + 今日空档）
│   │   │   │   ├── booking/         # 创建预约（选日期 -> 选时间 -> 确认）
│   │   │   │   ├── appointment/     # 我的预约列表（Tab 切换状态）
│   │   │   │   ├── profile/         # 个人中心
│   │   │   │   └── owner/           # 店长页面（dashboard, appointments, proxy-booking, services, billing, schedule, customers, notifications, stats, apply）
│   │   │   ├── stores/              # Pinia stores（user, appointment, merchant）
│   │   │   ├── api/                 # 封装 uni.request 请求方法
│   │   │   ├── components/          # 公共组件（预约卡片、时间选择器、服务卡片等）
│   │   │   ├── utils/               # 工具函数（登录、授权、格式化）
│   │   │   └── static/              # 静态资源
│   │   └── uni.scss
│   └── admin/                       # [NEW] Web 管理后台
│       ├── package.json
│       ├── vite.config.ts
│       ├── index.html
│       └── src/
│           ├── main.ts
│           ├── App.vue
│           ├── router/              # 路由配置 + 导航守卫
│           ├── stores/              # Pinia stores（auth, merchant）
│           ├── api/                 # axios 请求封装
│           ├── views/               # 页面视图（login, dashboard, appointments, transactions, services, customers, schedule, stats, settings/, admin/）
│           ├── components/          # 公共组件
│           ├── layouts/             # 布局组件（侧边栏 + 顶栏）
│           └── utils/               # 工具函数
```

## 设计风格

### 小程序端 UI 风格（参考用户提供的截图）

**默认配色方案：黑白极简风**
- 主色调：纯黑 `#000000` / 纯白 `#FFFFFF`
- 背景色：浅灰 `#F5F5F5`
- 文字色：主文字 `#1A1A1A` / 次要文字 `#666666` / 辅助文字 `#999999`
- 功能色：成功绿 `#07C160` / 错误红 `#FA5151` / 警告橙 `#FF9500`

**视觉特征（参考截图）**：
- 圆角卡片设计（大圆角 16-20px）
- 圆角胶囊按钮（黑色填充白字，圆角 24px）
- 服务项目卡片列表式布局（非网格），每项含名称、描述、时长、HOT 标签
- 日期选择：横向滚动日期列表，选中项黑色背景白字高亮
- 时间段选择：白色圆角胶囊网格按钮
- 底部固定黑色大按钮
- 弹窗/弹层：白色圆角卡片 + 右上角关闭按钮

**配色可配置性**：
- merchants 表新增 `theme_config` 字段，存储店长自定义配色（primary、background、text 等 CSS 变量值）
- Web 后台提供「外观设置」页面供店长调整主题色和风格
- 小程序启动时拉取门店主题配置，动态注入 CSS 变量
- 默认使用黑白极简风格，未配置时走默认样式

### Web 管理后台

基于 Vue 3 + Element Plus，左侧菜单 + 右侧内容区经典管理后台布局。超管和店长通过路由守卫控制菜单可见性。Element Plus 使用默认蓝紫色调或跟随小程序主题配置。

## 小程序端页面规划

### 页面1：首页 (pages/index/index) — 顾客端主包

**参考截图风格：**
- **顶部头图区**：门店封面大图（模糊背景）+ 叠加门店信息（店名、地址、营业时间）+ 右侧发型师头像/名称
- **预约项目列表**：白色圆角卡片容器，内部服务项目纵向排列
  - 每项：服务名称（左）+ HOT 标签（右，黑底白字圆角小标签）、描述文字、时长（右侧带时钟图标）
  - 可点击进入创建预约流程
- **底部 TabBar**：首页 / 预约 / 我的（纯图标 + 文字）

### 页面2：创建预约 (pages/booking/create) — 顾客端主包

**参考截图1风格：**
- **顶部**：门店信息头部（与首页同款）
- **预约项目**：已选服务卡片展示
- **到店日期选择**：
  - 标题「到店日期」+ 右侧休息提示
  - 横向滚动日期列表（今天/明天/周日/周一...），格式「周X M/D」
  - 选中项黑色背景白字高亮圆角胶囊，未选中灰色文字
- **时间段网格**：
  - 多列网格展示可用时段（09:00, 09:30, 10:00...）
  - 白色圆角胶囊按钮，已占用时段置灰不可点
- **底部固定按钮**：「下一步：填写信息」（黑色圆角大按钮）

**确认步骤（截图2风格）：**
- **弹窗式确认页**：白色圆角弹窗
  - 标题「预约联系人」+ 关闭按钮
  - 姓名输入框、手机号输入框
  - 服务摘要区（项目/发型师/到店时间）
  - 底部「确认预约」黑色按钮

### 页面3：我的预约 (pages/appointment/list) — 顾客端主包

- Tab 切换（待确认/已确认/已完成）
- 预约卡片列表（黑白极简风）
- 空状态引导

### 页面4：个人中心 (pages/profile/index) — 顾客端主包

- 用户信息卡片 + 消费统计 + 功能入口列表

### 店长端页面 (pages/owner/) — 独立分包

全部在 `subPackages.owner` 分包中按需加载：
dashboard(店务总览), appointments(预约管理), proxy-boarding(代预约), services(服务管理), billing(手动记账), schedule(营业设置), customers(顾客管理), notifications(消息通知), stats(营收统计), apply(申请店长)

---

## 门店管理业务规划

### 业务背景

当前菜单（数据总览、预约管理、记账管理、服务管理、顾客管理、营业设置、营收统计）都是门店级别的功能，需要重构门店入驻流程，实现完整的门店生命周期管理。

### 目标业务流程

#### 流程一：店长主动申请入驻（小程序端申请）

```
店长（小程序端）                          超级管理员（Web后台）
     │                                           │
     │ 1. 填写门店初始信息                          │
     │    - 门店名称、地址、电话、营业时间            │
     │    - 申请人姓名/手机号                        │
     │────────────────────────────────────────────>│
     │           提交入驻申请                         │
     │                                           │ 2. 审核门店申请
     │                                           │    - 查看申请信息
     │                                           │    - 通过/拒绝
     │<────────────────────────────────────────────│
     │           收到审核结果通知                     │
     │              【审核通过】                      │
     │                                           │ 3. 创建门店管理员账号
     │                                           │ 4. 初始化门店配置
     │ 5. 登录管理后台/Web端                         │
     │    - 使用手机号+验证码/密码登录                 │
     │    - 完善门店信息、配置服务、员工、营业时间       │
     │────────────────────────────────────────────>│
     │           开始使用系统                         │
```

#### 流程二：超级管理员直接创建门店

```
超级管理员（Web后台）
     │
     │ 1. 新建门店（填写名称、地址、电话、营业时间）
     │ 2. 初始化门店配置（默认服务、默认员工）
     │ 3. 创建门店管理员账号（填写店长手机号）
     │              ↓
店长（小程序端/Web端）
     │
     │ 4. 首次登录（手机号+密码，修改初始密码）
     │ 5. 完善门店配置（信息、服务、员工、营业时间）
     │ 6. 开始使用系统
```

### 角色权限设计

#### 角色定义

| 角色 | 描述 | 登录方式 |
|------|------|---------|
| 超级管理员 | 平台运营者，管理所有门店 | Web后台：账号密码 + 微信扫码 |
| 店长 | 门店管理者 | Web后台：账号密码/微信扫码；小程序：微信登录 |
| 店员 | 门店普通员工 | 小程序：微信登录 |
| 顾客 | 消费者 | 小程序：微信登录 |

#### 权限矩阵

| 功能模块 | 超级管理员 | 店长 | 店员 |
|---------|----------|------|------|
| 门店管理（创建/编辑/删除） | ✅ | ❌ | ❌ |
| 入驻审核 | ✅ | ❌ | ❌ |
| 数据总览 | ✅（全部门店） | ✅（本门店） | ✅（本门店简化版） |
| 预约管理 | ✅ | ✅ | ✅ |
| 记账管理 | ✅ | ✅ | ✅ |
| 服务管理 | ✅ | ✅ | ❌ |
| 顾客管理 | ✅ | ✅ | ❌ |
| 营业设置 | ✅ | ✅ | ❌ |
| 营收统计 | ✅（全部门店） | ✅（本门店） | ❌ |
| 系统配置（COZE/飞书/微信） | ✅ | ✅（本门店） | ❌ |

### 菜单结构调整

#### 超级管理员菜单

```
├── 数据总览（全平台视角）
│   └── 所有门店数据统计
├── 门店管理
│   ├── 门店列表
│   ├── 入驻审核
│   └── 新建门店
└── 系统管理
    ├── 超级管理员账号
    ├── 微信配置
    └── 系统设置
```

#### 店长菜单

```
├── 数据总览（本门店视角）
├── 预约管理
├── 记账管理
├── 服务管理
├── 顾客管理
├── 营业设置
├── 营收统计
└── 系统设置
```

### 数据模型调整

#### Admin（管理员）模型扩展

```typescript
interface IAdminDocument {
  // 原有字段
  username: string
  password_hash: string
  real_name: string
  phone?: string
  wx_openid?: string
  is_active: boolean
  
  // 新增字段
  role: 'super_admin' | 'merchant_admin'  // 角色类型
  merchant_id?: string  // 关联门店ID（merchant_admin时必填）
  type: 'system' | 'merchant'  // 账号类型
}
```

#### Merchant（门店）模型状态扩展

```typescript
interface IMerchantDocument {
  // 原有字段
  merchant_id: string
  name: string
  address?: string
  phone: string
  business_hours: { start: string; end: string }
  owner_id: string
  
  // 状态扩展
  status: 'pending' | 'active' | 'inactive' | 'rejected' | 'applying'
  // pending: 待审核（超管创建但未激活）
  // applying: 店长申请中
  // active: 正常营业
  // inactive: 暂停营业
  // rejected: 申请被拒绝
  
  // 申请信息（仅申请时使用）
  application_info?: {
    applicant_name: string
    applicant_phone: string
    applicant_wx_openid: string
    apply_time: Date
    review_note?: string
    review_time?: Date
    reviewer_id?: string
  }
}
```

#### User（用户）模型角色扩展

```typescript
interface IUserDocument {
  // 角色扩展
  role: 'customer' | 'owner' | 'staff' | 'pending_owner'
  // customer: 普通顾客
  // pending_owner: 待审核店长（申请中）
  // owner: 已认证店长
  // staff: 店员
  
  merchant_id?: string  // 关联门店ID
}
```

### API 接口设计

#### 店长申请入驻接口

```typescript
// POST /api/merchant/apply
// 小程序端调用
interface ApplyMerchantRequest {
  name: string           // 门店名称
  address: string        // 地址
  phone: string          // 联系电话
  business_hours_start: string  // 营业开始时间
  business_hours_end: string    // 营业结束时间
  description?: string   // 门店简介
  applicant_name: string // 申请人姓名
  applicant_phone: string // 申请人手机号
}
```

#### 超级管理员审核接口

```typescript
// POST /api/admin/merchants/:id/review
interface ReviewMerchantRequest {
  action: 'approve' | 'reject'  // 通过/拒绝
  note?: string                 // 审核备注
}
```

#### 超管直接创建门店接口

```typescript
// POST /api/admin/merchants
interface CreateMerchantRequest {
  name: string
  address: string
  phone: string
  business_hours_start: string
  business_hours_end: string
  owner_phone: string  // 店长手机号
  owner_name: string   // 店长姓名
}
```

### 实施计划

| 阶段 | 内容 | 天数 | 状态 |
|------|------|------|------|
| Phase 1 | 数据模型调整（Admin/Merchant/User 角色扩展） | 1天 | ✅ 2026-04-04 完成 |
| Phase 2 | 后端 API 开发（申请/审核/创建接口） | 2天 | ✅ 2026-04-04 完成 |
| Phase 3 | Web后台页面（入驻审核、门店管理、动态菜单） | 2天 | ✅ 2026-04-04 完成 |
| Phase 4 | 小程序页面（申请入驻、状态查询） | 1天 | ⏳ 待开始 |
| Phase 5 | 测试与优化 | 1天 | ⏳ 待开始 |

**已完成: 3/5 阶段**
**总计：7天**

---

## Web 管理后台设计

基于 Vue 3 + Element Plus，左侧菜单 + 右侧内容区经典管理后台布局。超管和店长通过路由守卫控制菜单可见性。Element Plus 使用默认蓝紫色调或跟随小程序主题配置。

## Agent Extensions

### Skill

- **frontend-design**
- Purpose: 在开发小程序和 Web 管理后台时，为关键页面生成高质量的前端代码，确保 UI 设计美观、现代、符合美发行业风格
- Expected outcome: 生成可直接使用的页面组件代码，包含完整的样式、布局和交互逻辑

### SubAgent

- **code-explorer**
- Purpose: 在开发过程中探索已有代码结构、检查依赖关系、验证模式一致性
- Expected outcome: 快速定位代码文件、理解模块依赖、确保新代码与已有架构一致
# 美发预约记账系统 - Docker 部署计划

## 项目结构
- **packages/server**: NestJS 后端 API (Node.js 20)
- **packages/admin**: Vue 3 + Element Plus 管理后台
- **packages/shared**: 共享类型和工具
- **packages/miniapp**: 微信小程序 (不参与 Docker 构建)

## 服务端口映射
| 服务 | 容器端口 | 宿主机端口 | 说明 |
|------|----------|------------|------|
| MongoDB | 27017 | 27018 | 数据库 |
| Redis | 6379 | 6380 | 缓存 |
| API | 3000 | 3100 | 后端 API |
| Admin | 80 | 9080 | 管理后台 |

## 构建状态
- [x] Admin 镜像构建成功
- [x] API 镜像构建成功
- [ ] 容器运行测试

## 已知问题
1. API 容器依赖丢失问题 - 已移除 `pnpm install --prod`
2. ESM/CJS 模块冲突 - 已改为 CommonJS 编译
3. 端口冲突 - 已改用非保留端口

## 访问地址
- 管理后台: http://localhost:9080
- API 服务: http://localhost:3100
