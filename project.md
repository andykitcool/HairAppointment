# 美发预约记账系统 - 项目开发记录

> 本文档用于记录开发过程中的关键信息、踩过的坑、解决方案等，防止上下文丢失。
> 最后更新：2026-04-04

---

## 1. 项目概述

### 1.1 基本信息
- **项目名称**: 美发预约记账系统
- **技术栈**: uni-app (Vue 3) + Node.js (Koa) + MongoDB + Redis
- **输出端**: 微信小程序（顾客/店长）+ Web 管理后台（超级管理员/店长）
- **部署**: 阿里云 2 核 2G 云服务器

### 1.2 项目结构
```
HairAppointment/
├── packages/
│   ├── server/      # Node.js + Koa 后端 API (端口 3000)
│   ├── admin/       # Vue 3 + Element Plus 管理后台 (端口 80)
│   ├── miniapp/     # uni-app 微信小程序
│   └── shared/      # 共享类型定义和工具函数
├── docker-compose.yml
└── project.md       # 本文件
```

---

## 2. 已解决的关键问题

### 2.1 微信扫码绑定/登录无响应问题 ⭐⭐⭐ ✅ 已解决

**问题描述**: 在管理后台点"绑定微信"后弹出的二维码，扫描后无任何反应（既不提示绑定成功，也不提示绑定失败）。

**解决状态**: ✅ 2026-04-04 已完全解决，绑定和扫码登录功能正常

**根因分析**:
1. **竞态条件**: `app.ts` 中微信消息接收的 `end` 事件被重复监听
2. **XML解析不完善**: 原来的正则表达式无法处理所有XML格式
3. **缺少日志**: 无法判断微信消息是否到达服务器
4. **网络问题**: 微信服务器可能无法访问本地开发环境
5. **koa-body 冲突**: koa-body 尝试读取已被消耗的流，导致 `stream is not readable` 错误

**修复方案**:

1. **修复 app.ts 中的竞态条件** (`packages/server/src/app.ts:45-62`):
```typescript
// 修改前：重复监听 end 事件
ctx.req.on('end', () => { ctx.request.body = rawBody })
await new Promise<void>((resolve) => {
  ctx.req.on('end', resolve)  // 重复监听！
})

// 修改后：合并到一个监听器
await new Promise<void>((resolve) => {
  ctx.req.on('end', () => {
    ctx.request.body = rawBody
    console.log('[WechatMessage] Raw body received:', rawBody.substring(0, 500))
    resolve()
  })
})
```

2. **增强 XML 解析** (`packages/server/src/controllers/wechatMessage.ts`):
```typescript
// 支持 CDATA 和普通标签
function getXmlValue(xml: string, tag: string): string {
  const cdataRegex = new RegExp(`<${tag}>\\s*<!\\[CDATA\\[(.*?)\\]\\]>\\s*</${tag}>`, 'is')
  const cdataMatch = xml.match(cdataRegex)
  if (cdataMatch) return cdataMatch[1].trim()
  
  const normalRegex = new RegExp(`<${tag}>(.*?)</${tag}>`, 'is')
  const normalMatch = xml.match(normalRegex)
  if (normalMatch) return normalMatch[1].trim()
  
  return ''
}
```

3. **添加详细日志**: 在 `wechatMessage.ts` 和 `auth.ts` 的关键位置添加日志

4. **修复 koa-body 冲突** (`packages/server/src/app.ts`):
```typescript
// 问题：koa-body 会再次读取 ctx.req 流，但流已被微信中间件消耗
// 错误：stream is not readable

// 解决方案：添加 onError 处理忽略微信路径的错误
app.use(koaBody({
  multipart: true,
  jsonLimit: '10mb',
  formLimit: '10mb',
  onError: (err, ctx) => {
    if (ctx.path === '/api/wechat/message') {
      console.log('[WechatMessage] koaBody error ignored')
      return
    }
    throw err
  },
}))
```

**调试方法**:
1. 观察服务器控制台是否输出 `[WechatMessage]` 日志
2. 如果无日志，检查：
   - 微信配置是否正确（Token、AppID、AppSecret）
   - 服务号是否启用
   - 服务器URL是否可达（微信后台测试）
   - IP白名单是否添加
3. 如果有日志但绑定失败，检查 `bindQRStore` 中的 scene 是否匹配

**配置检查清单**:
- [x] 管理后台：系统设置 → 微信配置 → 添加并启用服务号
- [x] 微信开放平台/公众平台：开发 → 基本配置 → 服务器配置
  - URL: `http://wechat.vidiu.cn/api/wechat/message` (开发环境 NPS 转发)
  - Token: 与后台配置完全一致
- [x] 验证扫码绑定功能正常（2026-04-04 ✅）
- [x] 验证微信扫码登录功能正常（2026-04-04 ✅）

**验证结果**: 
- ✅ 前端提示"已绑定"
- ✅ 退出系统后使用微信扫码登录成功

---

## 3. 微信扫码登录/绑定流程

### 3.1 技术流程
```
用户点击"绑定微信"
  ↓
前端调用 GET /api/auth/wechat-bind-qr
  ↓
后端生成带参数二维码（scene = bind_${adminId}_${timestamp}_${random}）
  ↓
存储到 bindQRStore: { status: 'pending', admin_id, create_time }
  ↓
用户用微信扫描二维码
  ↓
微信服务器推送扫码事件到 /api/wechat/message
  ↓
后端解析 XML，提取 EventKey (scene) 和 FromUserName (openid)
  ↓
调用 handleWechatBindEvent(scene, openid)
  ↓
更新 bindQRStore: status = 'success'
  ↓
更新 AdminModel: wx_openid = openid
  ↓
前端轮询 GET /api/auth/wechat-bind-status?scene=xxx
  ↓
检测到 status = 'success'，显示"绑定成功"
```

### 3.2 关键代码文件
| 文件 | 作用 |
|------|------|
| `packages/admin/src/views/settings/profile.vue` | 前端绑定界面 |
| `packages/server/src/controllers/auth.ts` | 生成二维码、处理绑定逻辑 |
| `packages/server/src/controllers/wechatMessage.ts` | 接收微信消息推送 |
| `packages/server/src/app.ts` | 原始请求体接收 |

---

## 4. 开发环境注意事项

### 4.1 端口映射 (Docker)
| 服务 | 容器端口 | 宿主机端口 |
|------|----------|------------|
| MongoDB | 27017 | 27018 |
| Redis | 6379 | 6380 |
| API | 3000 | 3100 |
| Admin | 80 | 9080 |

### 4.2 本地开发 vs 生产环境
- **本地 Docker 开发**: `localhost:3100` 无法被微信服务器访问
- **解决方案**: 
  - 部署到有公网IP的服务器
  - 或使用内网穿透工具（如 ngrok）
  - **当前使用 NPS 内网穿透**: `http://wechat.vidiu.cn/api/wechat/message`

### 4.3 微信消息推送配置（开发环境）
| 配置项 | 值 |
|--------|-----|
| **消息推送 URL** | `http://wechat.vidiu.cn/api/wechat/message` |
| **转发方式** | NPS 内网穿透服务器转发到本地开发服务器 |
| **使用场景** | 微信扫码登录/绑定功能开发调试 |
| **注意事项** | 开发阶段使用，生产环境需配置正式域名 |

### 4.3 常用命令

```bash
# 启动开发环境
docker-compose -f docker-compose.dev.yml up -d

# 查看日志
docker-compose -f docker-compose.dev.yml logs -f api

# 重启服务
docker-compose -f docker-compose.dev.yml restart api

# 前端代码修改后需要重新构建
docker-compose -f docker-compose.dev.yml up -d --build admin

# 后端代码修改后需要重新构建
docker-compose -f docker-compose.dev.yml up -d --build api

# 重新构建并启动所有服务
docker-compose -f docker-compose.dev.yml up -d --build
```

### 4.4 重要提示

#### ⚠️ 后端代码修改后需要重新编译并重启容器才能生效

**原因**：后端使用 TypeScript 编写，需要编译成 JavaScript 后才能运行。Docker 容器挂载的是编译后的 `dist` 目录，而不是源码。

**正确步骤**：
```bash
# 1. 修改 packages/server/src/ 下的源码

# 2. 重新编译 TypeScript
pnpm --filter @hair/server build

# 3. 重启 API 容器
docker-compose -f docker-compose.dev.yml restart api

# 或者完整重建
docker-compose -f docker-compose.dev.yml up -d --build api
```

**常见问题**：
- 现象：修改后端代码后功能没有变化
- 原因：忘记编译或重启容器
- 解决：执行上述步骤 2 和 3

---

## 5. 关键配置

### 5.1 环境变量
```env
# 小程序（用于顾客的微信小程序）
WX_APPID=xxx
WX_APP_SECRET=xxx

# 服务号（用于管理员扫码登录）
# 在数据库的 wechat_configs 集合中配置
```

### 5.2 数据库集合
| 集合 | 用途 |
|------|------|
| admins | 超级管理员账号 |
| merchants | 门店信息 |
| users | 微信用户（顾客/店长） |
| wechat_configs | 微信配置（小程序/服务号） |
| appointments | 预约记录 |
| transactions | 账目记录 |

---

## 6. 角色权限设计

### 6.1 角色定义

系统统一使用 **4 种角色**：

| 角色值 | 说明 | 使用场景 |
|--------|------|----------|
| `super_admin` | 超级管理员 | Web后台唯一最高权限，管理所有门店 |
| `owner` | 门店管理员（店长） | Web后台门店管理 / 小程序店长端 |
| `staff` | 店员 | 小程序店员端 |
| `customer` | 顾客 | 小程序顾客端 |

**注意**：`owner` 角色统一了之前的 `merchant_admin`（Web后台门店管理员）和 `owner`（小程序店长），两者是同一角色。

### 6.2 权限矩阵

| 功能模块 | 顾客 | 店员 | 店长 | 超管 |
|----------|:--:|:--:|:--:|:--:|
| **服务管理** |
| 查看服务列表 | ✓ | ✓ | ✓ | ✓ |
| 创建/修改/删除服务 | ✗ | ✗ | ✓ | ✓ |
| **交易/记账** |
| 创建交易记录 | ✗ | ✓ | ✓ | ✓ |
| 查看交易记录 | ✗ | ✓ | ✓ | ✓ |
| 查看营收统计 | ✗ | ✓ | ✓ | ✓ |
| **门店设置** |
| 营业时间设置 | ✗ | ✗ | ✓ | ✓ |
| 打烊/延长营业 | ✗ | ✗ | ✓ | ✓ |
| **门店管理（超管专用）** |
| 创建/审核门店 | ✗ | ✗ | ✗ | ✓ |
| 管理所有门店 | ✗ | ✗ | ✗ | ✓ |

### 6.3 权限中间件

| 中间件 | 允许的角色 | 用途 |
|--------|-----------|------|
| `requireAuth` | 任何登录用户 | 基础登录验证 |
| `requireOwner` | `owner`, `super_admin` | 店长及以上权限（店员不可用） |
| `requireStaffOrOwner` | `staff`, `owner`, `super_admin` | 员工及以上权限 |
| `requireSuperAdmin` | `super_admin` | 仅超管可用 |

### 6.4 实现文件

| 文件 | 说明 |
|------|------|
| `packages/shared/src/types/enums.ts` | 角色枚举定义 |
| `packages/server/src/middleware/auth.ts` | 权限中间件实现 |
| `packages/server/src/models/Admin.ts` | Admin 模型 role 字段 |
| `packages/admin/src/stores/auth.ts` | 前端角色判断逻辑 |
| `packages/admin/src/layouts/MainLayout.vue` | 菜单权限控制 |

---

## 7. 待办事项 (TODO)

### 7.1 当前进行中的任务
- [x] 配置微信消息推送 URL: `http://wechat.vidiu.cn/api/wechat/message` (NPS转发)
- [x] 测试微信扫码绑定功能 ✅ 2026-04-04 已验证成功
- [x] 验证服务器日志输出
- [x] 在微信开放平台验证服务器配置

### 7.2 已知问题
- [x] ~~微信消息无法到达（已解决 - koa-body 流冲突）~~
- [ ] 生产环境建议使用 Redis 存储扫码状态（当前使用内存 Map）

### 7.3 后续优化
- [ ] 添加微信消息重试机制
- [ ] 完善错误提示（前端显示更友好的错误信息）

## 8. 新功能规划 - 门店管理业务流程

### Phase 2: 后端 API 开发 ✅ 已完成

**实施时间**: 2026-04-04

**完成的 API 接口**:

| 接口 | 方法 | 路径 | 说明 |
|------|------|------|------|
| 店长申请入驻 | POST | `/api/merchants/apply` | 小程序端提交入驻申请 |
| 查询申请状态 | GET | `/api/merchants/apply-status` | 查询当前用户的申请状态 |
| 超管创建门店 | POST | `/api/admin/merchants` | 超管直接创建门店并绑定店长 |
| 审核入驻申请 | POST | `/api/admin/merchants/:id/review` | 通过/拒绝入驻申请 |
| 获取申请列表 | GET | `/api/admin/applications` | 获取待审核列表 |
| 重置店长密码 | POST | `/api/admin/merchants/:id/reset-password` | 重置店长登录密码 |

**实现的功能**:
1. ✅ 店长申请入驻（小程序端）
2. ✅ 超管审核（通过/拒绝）
3. ✅ 超管直接创建门店
4. ✅ 门店初始化（默认服务、默认员工）
5. ✅ 创建门店管理员账号（自动生成用户名/密码）
6. ✅ 路由配置更新

**修改的文件**:
- `packages/server/src/controllers/merchant.ts` - 添加申请入驻、查询状态、初始化方法
- `packages/server/src/controllers/admin.ts` - 完善创建门店、审核逻辑
- `packages/server/src/routes/merchant.ts` - 添加申请入驻路由
- `packages/server/src/routes/admin.ts` - 更新审核路由、添加重置密码路由
- `packages/server/src/middleware/auth.ts` - 更新权限中间件支持 merchant_admin

---

### Phase 3: Web后台页面开发 ✅ 已完成

**实施时间**: 2026-04-04

**完成的页面和功能**:

| 页面 | 功能 |
|------|------|
| 入驻审核 | 申请列表（状态筛选）、通过/拒绝操作、显示申请人信息、显示创建的账号 |
| 门店管理 | 门店列表（状态筛选）、新建门店、通过/拒绝/启用/停用/重置密码 |
| 动态菜单 | 超管显示门店管理菜单，门店管理员显示业务菜单 |

**实现的功能**:
1. ✅ 入驻审核页面 - 支持查看申请列表、通过/拒绝操作
2. ✅ 门店管理页面 - 支持新建门店、状态管理、重置密码
3. ✅ 动态菜单 - 根据角色显示不同菜单
4. ✅ API 层更新 - 添加新的 API 接口调用

**修改的文件**:
- `packages/admin/src/api/request.ts` - 添加新的 API 接口
- `packages/admin/src/views/admin/applications.vue` - 重写入驻审核页面
- `packages/admin/src/views/admin/merchants.vue` - 重写门店管理页面
- `packages/admin/src/layouts/MainLayout.vue` - 动态菜单控制
- `packages/admin/src/stores/auth.ts` - 更新角色管理

---

## 10. 新功能规划

### 10.1 门店管理业务流程调整

**目标**: 重构门店入驻流程，支持两种模式：
1. 店长主动申请入驻（小程序端申请 -> 超管审核）
2. 超管直接创建门店并指定店长

**规划文档**: `门店管理业务规划.md`

**实施阶段**:
- [x] Phase 1: 数据模型调整（Admin/Merchant/User 角色扩展）✅ 2026-04-04 完成
- [ ] Phase 2: 后端 API 开发（申请/审核/创建接口）
- [ ] Phase 3: Web后台页面（入驻审核、门店管理、动态菜单）
- [ ] Phase 4: 小程序页面（申请入驻、状态查询）
- [ ] Phase 5: 测试与优化

**Phase 1 完成内容**:
| 文件 | 修改内容 |
|------|---------|
| `packages/server/src/models/Admin.ts` | 新增 role、merchant_id、type 字段 |
| `packages/server/src/models/Merchant.ts` | 扩展 status 枚举（applying），新增 application_info |
| `packages/server/src/models/User.ts` | 扩展 role 枚举（pending_owner） |
| `packages/shared/src/types/enums.ts` | 新增 AdminRole、AdminType 枚举，扩展 UserRole、MerchantStatus |
| `packages/shared/src/types/models.ts` | 更新 IAdmin、IMerchant、IUser 接口定义 |

**关键改动**:
- Admin 模型新增 `role` 字段（super_admin / merchant_admin）
- Admin 模型新增 `merchant_id` 字段关联门店
- Merchant 模型新增 `application_info` 存储申请信息
- User 角色扩展 `pending_owner`（申请中店长）
- 菜单根据角色动态显示（超管看所有门店，店长只看本门店）

---

## 10. 踩坑记录

### 10.1 微信开发常见坑
1. **Token 验证失败**: 确保微信后台和数据库中的 Token 完全一致（包括大小写）
2. **IP 白名单**: 服务器IP变更后需要更新微信后台白名单
3. **XML 解析**: 微信推送的 XML 可能包含 CDATA，需要正确处理
4. **HTTPS 要求**: 微信要求服务器必须使用 HTTPS
5. **响应内容**: 微信消息处理必须返回 `success`，即使是错误情况

### 7.2 Koa 相关坑
1. **原始请求体**: koa-body 会解析请求体，但微信需要原始 XML，需要特殊处理
2. **异步流**: 使用 `Promise` 等待请求体接收完成

### 7.3 Vue 3 + Element Plus 坑
1. **对话框 destroy-on-close 导致表单不回显**: 
   - 问题：编辑对话框使用 `destroy-on-close`，点击编辑时表单数据不显示
   - 原因：对话框销毁后重新创建，表单赋值时机不对
   - 解决：使用 `nextTick()` 等待对话框渲染完成后再赋值
   ```typescript
   showEditDialog.value = true
   await nextTick()
   editForm.appid = row.appid
   ```

2. **敏感字段编辑时需要显示真实值**:
   - 问题：Token、AppSecret 等字段列表中显示 `***已设置***`，编辑时需要看到真实值
   - 解决：编辑时调用详情接口获取真实数据
   ```typescript
   // 后端：单个详情接口返回真实值
   app_secret: config.app_secret,
   token: config.token || '',
   
   // 前端：编辑时调用详情接口
   const res = await wechatConfigApi.getById(row._id)
   editForm.token = config.token || ''
   ```

---

## 8. 参考链接

- [微信服务号文档 - 生成带参数二维码](https://developers.weixin.qq.com/doc/offiaccount/Account_Management/Generating_a_Parametric_QR_Code.html)
- [微信服务号文档 - 接收普通消息](https://developers.weixin.qq.com/doc/offiaccount/Message_Management/Receiving_standard_messages.html)
- [微信服务号文档 - 接收事件推送](https://developers.weixin.qq.com/doc/offiaccount/Message_Management/Receiving_event_pushes.html)

---

## 12. 联系方式

如有问题，请查看：
1. 服务器控制台日志
2. 微信公众平台的"消息管理"中的"用户消息"
3. 浏览器开发者工具 Network 面板

---

*本文档将持续更新，记录开发过程中的重要信息。*
