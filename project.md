# 项目工作总结

## 本次工作内容

### 问题排查
用户反馈之前创建的门店在系统中看不到了，经排查发现是**后端API服务因ES Module配置问题未能正常启动**，导致前端无法获取门店数据。

### 修复内容

#### 1. ES Module 配置迁移
将项目从 CommonJS 迁移到 ES Module，统一模块系统。

**修改的文件：**
- `packages/server/tsconfig.json` - 更新 `module` 和 `moduleResolution` 为 `NodeNext`
- `tsconfig.base.json` - 同步更新基础配置
- `packages/server/package.json` - 添加 `"type": "module"`
- `packages/shared/package.json` - 添加 `"type": "module"`

#### 2. 导入路径修复
ES Module 要求相对导入必须包含 `.js` 后缀，修复了以下文件：

- `packages/server/src/controllers/admin.ts`
- `packages/server/src/routes/admin.ts`
- `packages/server/src/models/index.ts`
- `packages/server/src/middleware/auth.ts`
- `packages/server/src/cron/` 目录下所有文件
- `packages/shared/src/index.ts` - 统一更新所有导出路径

**修改示例：**
```typescript
// 修改前
import { AdminModel } from '../models'

// 修改后
import { AdminModel } from '../models/index.js'
```

#### 3. Docker Compose 配置调整
修改 `docker-compose.dev.yml`，将 shared 包的挂载路径从源码改为编译后的 dist：

```yaml
volumes:
  - ./packages/server/dist:/app/packages/server/dist
  - ./packages/shared/dist:/app/packages/shared/dist  # 只挂载 dist
```

### 项目架构说明

#### Monorepo 结构
```
packages/
├── server/    # 后端 API 服务 (Node.js + Koa)
├── admin/     # 管理后台前端
└── shared/    # 公共共享包 (@hair/shared)
```

#### shared 包作用
存放项目通用的代码，供其他模块复用：
- `types/` - TypeScript 类型定义（UserRole、Merchant 等）
- `constants/` - 常量（PRESET_SERVICES 预设服务）
- `utils/` - 工具函数（generateShortId 等）

### 服务状态

| 服务 | 地址 | 状态 |
|------|------|------|
| API 服务 | http://localhost:3100 | ✅ 正常运行 |
| 管理后台 | http://localhost:9080 | ✅ 正常访问 |
| 数据库 | MongoDB/Redis | ✅ 连接正常 |

### 后续维护注意事项

1. **导入规范**：所有新的相对导入必须带 `.js` 后缀
2. **编译顺序**：修改 shared 包后需先编译 shared，再编译 server
3. **重启服务**：代码修改后需要重新编译并重启 Docker 容器

---

## BUG 解决记录

### 问题：门店设置/员工管理页面白屏，路由匹配失败

**现象：**
- 访问 `/store/settings` 和 `/store/staff` 页面全白
- Console 报错：`[Vue Router warn]: No match found for location with path "/store/settings"`

**根本原因：**

1. **旧的编译文件残留**：`main.ts` 导入的是 `router/index.js`（旧的编译版本），而不是 `router/index.ts`（源文件）
   ```typescript
   // 错误
   import router from './router/index.js'
   
   // 正确
   import router from './router/index.ts'
   ```

2. **命名冲突**：`views/store/` 目录名与 Pinia 状态管理的 `store` 命名冲突

3. **路径别名问题**：`@/views/store/...` 在 Docker 卷挂载环境下解析失败

**解决步骤：**

1. **修改 main.ts**：将导入路径从 `.js` 改为 `.ts`
   ```typescript
   import router from './router/index.ts'
   ```

2. **删除旧编译文件**：
   ```bash
   rm packages/admin/src/router/index.js
   rm packages/admin/src/router/index.js.map
   rm packages/admin/src/router/index.d.ts
   ```

3. **重命名目录**：将 `views/store/` 重命名为 `views/merchant/` 避免命名冲突

4. **更新路由配置**：使用相对路径代替 `@` 别名
   ```typescript
   import StoreSettings from '../views/merchant/settings.vue'
   import StoreStaff from '../views/merchant/staff.vue'
   ```

**Docker 卷挂载注意事项：**
- Windows Docker Desktop 下，文件变更同步可能存在延迟
- 建议修改后重启容器：`docker-compose restart admin`
- 强制刷新浏览器清除缓存：`Ctrl+F5`

---

### 问题：微信扫码登录后门店设置页面提示"您还未绑定门店"

**现象：**
- 微信扫码登录成功
- 进入门店设置页面提示"您还未绑定门店"
- Console 显示 `merchantId from authStore: undefined`

**根本原因：**

1. **微信扫码登录未返回 merchant_id**
   - 后端 `handleWechatScanEvent` 函数登录成功时没有保存 `merchant_id`
   - 后端 `checkLoginStatus` 函数返回数据时没有包含 `merchant_id`

2. **前端扫码登录处理未接收 merchant_id**
   - `login/index.vue` 中扫码登录成功后调用 `setUser` 时没有传递 `merchantId`

**解决步骤：**

1. **修改后端 auth.ts**：
   - 在 `loginQRStore` 类型定义中添加 `merchant_id` 字段
   - 在 `handleWechatScanEvent` 中登录成功时保存 `loginData.merchant_id = admin.merchant_id`
   - 在 `checkLoginStatus` 中返回 `responseData.merchant_id`

2. **修改前端 login/index.vue**：
   ```typescript
   const { status, token, role, real_name, message, merchant_id } = res.data
   authStore.setUser({ token, role, realName: real_name, merchantId: merchant_id })
   ```

---

### 问题：门店基本信息无法加载，API 返回"商户不存在"

**现象：**
- 门店设置页面不再提示未绑定门店
- 但页面空白，API 返回 `{"code": 404, "message": "商户不存在"}`

**根本原因：**

1. **管理员与门店的 merchant_id 不匹配**
   - 管理员账号 `15531122001` 的 `merchant_id` 是 `M000001`
   - 但门店"红梅美发"的 `merchant_id` 是 `M_gvZvZUbxFGnT`

**数据关系：**
```
admins 集合: { phone: "15531122001", merchant_id: "M000001" }
merchants 集合: { merchant_id: "M_gvZvZUbxFGnT", name: "红梅美发" }
```

**解决步骤：**

1. **统一 merchant_id**：将门店的 `merchant_id` 从 `M_gvZvZUbxFGnT` 改为 `M000001`
   ```javascript
   db.merchants.updateOne(
     { merchant_id: "M_gvZvZUbxFGnT" },
     { $set: { merchant_id: "M000001" } }
   )
   ```

**注意事项：**
- 修改 merchant_id 后需要重新登录，因为 JWT Token 和 localStorage 中缓存了旧的 merchantId
- 创建门店和绑定店长的流程需要确保使用相同的 merchant_id

---
记录时间：2026年4月6日

---

## 2026-04-08 已解决问题汇总

### 一、门店可配置会员卡级别（字典化）

**已解决内容：**
- 在门店配置中新增 `customer_settings.membership_levels`，支持店长自定义会员级别字典。
- 新增“会员字典配置”页面，支持保存门店专属会员级别。
- 顾客管理页编辑弹窗改为读取门店字典，不再硬编码固定级别。
- 兼容历史数据（如 `normal/silver/gold/diamond`）显示映射。

**效果：** 不同门店可按自身运营策略维护会员等级，顾客编辑与展示保持一致。

### 二、数据备份邮件发送链路

**已解决内容：**
- 管理后台新增“数据备份”菜单与页面。
- 个人设置页新增管理员邮箱绑定能力（校验格式、唯一性）。
- 后端新增备份发送接口，支持按门店导出 JSON 并通过 SMTP 邮件发送。
- 完成前后端联调，未绑定邮箱时提供明确提示。

**效果：** 店长可一键触发门店数据备份并收取邮件附件。

### 三、通知配置渠道开关

**已解决内容：**
- 通知配置页新增渠道可用开关（switch）。
- 后端新增 `notify_config.channel_enabled` 存储并支持保存/读取。
- 兼容旧字段与已有配置。

**效果：** 可按渠道灵活启停通知，降低误发风险。

### 四、历史 TypeScript 构建错误修复

**已解决内容：**
- 系统修复 server/admin 多处历史 TS 错误（类型声明、导入、推断、接口签名等）。
- 完成服务端与管理端编译校验，构建通过。

**验证结果：**
- `pnpm --filter @hair/server build` ✅
- `pnpm --filter @hair/admin build` ✅

### 五、AI 生图限额配置与后端拦截

**已解决内容：**
- 店长系统设置新增“AI生图配置”菜单与页面。
- 支持按周期（天/月）与每用户次数上限配置。
- 后端新增门店级配置 `ai_image_settings`。
- 新增 `AiUsageLog` 计数日志模型，按门店+用户+周期统计调用次数。
- 超限返回 429，前端可据此提示。
- 小程序 AI 请求补充 `merchant_id` 透传，确保按门店计数生效。

**效果：** AI 能力具备可运营的额度控制，避免资源被滥用。

### 六、超管系统邮件配置页面

**已解决内容：**
- 超管侧边栏“系统设置”新增“系统邮件配置”。
- 新增页面支持配置 SMTP Host/Port/SSL/User/Pass/From。
- 后端新增 `/api/admin/system-email` 读写接口。
- 平台配置模型新增 `email_config` 持久化字段。

**效果：** 邮件参数由系统后台集中管理，不依赖手工改环境变量。

### 七、顾客列表“角色”列移除

**已解决内容：**
- 顾客管理列表已移除“角色”列显示，保留核心经营字段。

**效果：** 列表信息更聚焦，减少冗余展示。

### 八、运行态排查结论（AI 页面空白）

**结论：**
- 源码中路由、菜单与页面均已存在；空白页更可能来自容器未刷新或浏览器缓存。
- 建议优先重启 admin 容器并强制刷新浏览器验证。

记录时间：2026年4月8日
