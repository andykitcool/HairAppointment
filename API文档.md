# 美发预约记账系统 - 后端API接口文档

> 文档生成时间：2026-04-04  
> 基础URL：`http://localhost:3000/api` (开发环境)

---

## 全局说明

### 响应格式

所有接口统一返回以下格式：

```json
{
  "code": 0,        // 0表示成功，其他表示错误
  "message": "ok",  // 提示信息
  "data": {}        // 响应数据
}
```

### 认证方式

- **小程序端**：使用 JWT Token，在请求头中携带：`Authorization: Bearer <token>`
- **Web后台**：使用 Session + JWT 双认证

### 公共错误码

| 错误码 | 说明 |
|--------|------|
| 0 | 成功 |
| 400 | 请求参数错误 |
| 401 | 未登录/Token无效 |
| 403 | 权限不足 |
| 404 | 资源不存在 |
| 409 | 资源冲突（如时间冲突）|
| 500 | 服务器内部错误 |

---

## 1. 认证模块 (/api/auth)

### 1.1 微信登录（小程序）

**POST** `/api/auth/wechat-login`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| code | string | 是 | 微信登录凭证 |

**响应示例：**
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "_id": "xxx",
      "openid": "oXXXXX",
      "nickname": "微信用户",
      "avatar_url": "",
      "phone": "",
      "role": "customer",
      "merchant_id": ""
    }
  }
}
```

---

### 1.2 获取手机号

**POST** `/api/auth/phone`  
**认证：** 需要

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| code | string | 是 | 获取手机号的code |

**响应示例：**
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "phone": "13800138000"
  }
}
```

---

### 1.3 管理员登录（Web后台）

**POST** `/api/auth/admin-login`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

**响应示例：**
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "role": "super_admin",
    "real_name": "管理员"
  }
}
```

---

### 1.4 申请成为店长（旧版，建议用入驻申请）

**POST** `/api/auth/apply-owner`  
**认证：** 需要

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| shop_name | string | 是 | 店铺名称 |
| phone | string | 是 | 联系电话 |
| address | string | 否 | 地址 |
| description | string | 否 | 描述 |

---

### 1.5 获取登录二维码（微信扫码登录）

**GET** `/api/auth/wechat-login-qr`

**响应示例：**
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "scene": "login_xxxxxx",
    "qr_code": "https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=xxx",
    "qr_url": "https://weixin.qq.com/q/xxxx",
    "expire_seconds": 300
  }
}
```

---

### 1.6 查询登录状态（轮询）

**GET** `/api/auth/wechat-login-status`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| scene | string | 是 | 二维码scene标识 |

**响应示例（成功）：**
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "status": "success",
    "token": "eyJhbGci...",
    "role": "super_admin",
    "real_name": "管理员"
  }
}
```

**状态说明：** `pending`（待扫码） | `scanned`（已扫码） | `success`（登录成功） | `expired`（已过期）

---

### 1.7 获取绑定二维码（微信绑定）

**GET** `/api/auth/wechat-bind-qr`  
**认证：** 需要

**响应示例：**
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "scene": "bind_xxx_xxxxxx",
    "qr_code": "https://mp.weixin.qq.com/cgi-bin/showqrcode?ticket=xxx",
    "expire_seconds": 300
  }
}
```

---

### 1.8 查询绑定状态（轮询）

**GET** `/api/auth/wechat-bind-status`

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| scene | string | 是 | 二维码scene标识 |

---

### 1.9 获取当前用户信息

**GET** `/api/auth/profile`  
**认证：** 需要

---

### 1.10 更新用户信息

**PUT** `/api/auth/profile`  
**认证：** 需要

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| nickname | string | 否 | 昵称 |
| avatar_url | string | 否 | 头像 |
| real_name | string | 否 | 真实姓名 |
| customer_note | string | 否 | 客户备注 |

---

### 1.11 获取店长管理信息

**GET** `/api/auth/admin-info`  
**认证：** 需要  
**权限：** owner/merchant_admin

**响应：** 返回商户信息 + 员工列表 + 服务列表

---

### 1.12 获取管理员资料

**GET** `/api/auth/admin/profile`  
**认证：** 需要

---

### 1.13 修改管理员密码

**PUT** `/api/auth/admin/password`  
**认证：** 需要

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| old_password | string | 是 | 旧密码 |
| new_password | string | 是 | 新密码（至少6位）|

---

### 1.14 绑定手机号

**PUT** `/api/auth/admin/phone`  
**认证：** 需要

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| phone | string | 是 | 手机号 |
| code | string | 是 | 验证码（当前任意6位数字）|

---

### 1.15 绑定微信（小程序code方式）

**PUT** `/api/auth/admin/wechat`  
**认证：** 需要

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| code | string | 是 | 微信登录code |

---

## 2. 门店管理模块 (/api/merchants)

### 2.1 店长申请入驻（小程序端）

**POST** `/api/merchants/apply`  
**认证：** 需要

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 门店名称 |
| address | string | 是 | 详细地址 |
| phone | string | 是 | 门店电话 |
| business_hours_start | string | 是 | 营业开始时间，如 "09:00" |
| business_hours_end | string | 是 | 营业结束时间，如 "21:00" |
| description | string | 否 | 门店描述 |
| applicant_name | string | 是 | 申请人姓名 |
| applicant_phone | string | 是 | 申请人手机号 |

**响应示例：**
```json
{
  "code": 0,
  "message": "申请已提交，请等待审核",
  "data": {
    "merchant_id": "M123456",
    "status": "applying"
  }
}
```

---

### 2.2 查询申请状态（小程序端）

**GET** `/api/merchants/apply-status`  
**认证：** 需要

**响应示例（有申请）：**
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "has_application": true,
    "merchant_id": "M123456",
    "status": "applying",
    "name": "XX美发店",
    "application_info": {
      "applicant_name": "张三",
      "applicant_phone": "13800138000",
      "apply_time": "2026-04-04T10:00:00.000Z"
    },
    "review_note": ""
  }
}
```

**响应示例（无申请）：**
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "has_application": false
  }
}
```

**状态说明：**
- `applying` - 申请中，等待审核
- `active` - 已通过，正常营业
- `rejected` - 已拒绝
- `inactive` - 已停用

---

### 2.3 获取门店详情

**GET** `/api/merchants/:id`  
**认证：** 需要

---

### 2.4 更新门店信息

**PUT** `/api/merchants/:id`  
**认证：** 需要  
**权限：** owner/merchant_admin

---

### 2.5 创建打烊时段

**POST** `/api/merchants/:id/closed-periods`  
**认证：** 需要  
**权限：** owner/merchant_admin

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| date | string | 是 | 日期 YYYY-MM-DD |
| type | string | 是 | `full_day`全天 / `time_range`时段 |
| start_time | string | 否 | 开始时间（时段类型必填）|
| end_time | string | 否 | 结束时间（时段类型必填）|
| reason | string | 否 | 原因 |
| cancel_appointments | boolean | 否 | 是否自动取消受影响预约 |
| notify_customers | boolean | 否 | 是否通知客户 |

---

### 2.6 获取打烊时段列表

**GET** `/api/merchants/:id/closed-periods`  
**认证：** 需要

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| start_date | string | 否 | 开始日期 |
| end_date | string | 否 | 结束日期 |

---

### 2.7 删除打烊时段

**DELETE** `/api/merchants/:id/closed-periods/:periodId`  
**认证：** 需要  
**权限：** owner/merchant_admin

---

### 2.8 设置延长营业

**POST** `/api/merchants/:id/extended-hours`  
**认证：** 需要  
**权限：** owner/merchant_admin

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| start_date | string | 是 | 开始日期 |
| end_date | string | 是 | 结束日期 |
| extended_end | string | 是 | 延长后的结束时间 |

---

### 2.9 修改延长营业配置

**PUT** `/api/merchants/:id/extended-hours/:index`  
**认证：** 需要  
**权限：** owner/merchant_admin

---

### 2.10 取消延长营业

**DELETE** `/api/merchants/:id/extended-hours/:index`  
**认证：** 需要  
**权限：** owner/merchant_admin

---

## 3. 后台管理模块 (/api/admin) - 超管专用

### 3.1 获取门店列表

**GET** `/api/admin/merchants`  
**认证：** Session + 超管权限

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认1 |
| pageSize | number | 否 | 每页条数，默认20 |
| status | string | 否 | 状态筛选：applying/pending/active/inactive/rejected |

**响应示例：**
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "list": [...],
    "total": 100,
    "page": 1,
    "pageSize": 20
  }
}
```

---

### 3.2 手动创建门店（超管直接创建）

**POST** `/api/admin/merchants`  
**认证：** Session + 超管权限

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 门店名称 |
| phone | string | 是 | 门店电话 |
| address | string | 否 | 地址 |
| description | string | 否 | 描述 |
| business_hours_start | string | 否 | 营业开始时间，默认09:00 |
| business_hours_end | string | 否 | 营业结束时间，默认21:00 |
| owner_phone | string | 是 | 店长手机号 |
| owner_name | string | 是 | 店长姓名 |

**响应示例：**
```json
{
  "code": 0,
  "message": "门店创建成功",
  "data": {
    "merchant_id": "M123456",
    "admin_account": {
      "username": "owner_234567",
      "temp_password": "AbC123Xy"
    }
  }
}
```

---

### 3.3 修改门店状态

**PUT** `/api/admin/merchants/:id/status`  
**认证：** Session + 超管权限

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| status | string | 是 | `active`/`inactive`/`rejected` |

---

### 3.4 重置店长密码

**POST** `/api/admin/merchants/:id/reset-password`  
**认证：** Session + 超管权限

**响应示例：**
```json
{
  "code": 0,
  "message": "密码重置成功",
  "data": {
    "new_password": "XyZ789Ab"
  }
}
```

---

### 3.5 获取入驻申请列表

**GET** `/api/admin/applications`  
**认证：** Session + 超管权限

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码，默认1 |
| pageSize | number | 否 | 每页条数，默认20 |
| status | string | 否 | applying/pending/不传表示全部 |

---

### 3.6 审核入驻申请

**POST** `/api/admin/merchants/:id/review`  
**认证：** Session + 超管权限

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| action | string | 是 | `approve`通过 / `reject`拒绝 |
| note | string | 否 | 审核备注/拒绝原因 |

**响应示例（通过）：**
```json
{
  "code": 0,
  "message": "审核通过",
  "data": {
    "admin_account": {
      "username": "owner_234567",
      "temp_password": "AbC123Xy"
    }
  }
}
```

---

### 3.7 获取平台统计数据

**GET** `/api/admin/stats`  
**认证：** Session + 超管权限

**响应示例：**
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "total_merchants": 50,
    "total_customers": 1000,
    "total_appointments": 5000,
    "total_revenue": 150000
  }
}
```

---

## 4. 预约管理模块 (/api)

### 4.1 查询可用时间段

**GET** `/api/slots/available`  
**认证：** 公开（无需登录）

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| merchant_id | string | 是 | 门店ID |
| date | string | 是 | 日期 YYYY-MM-DD |
| staff_id | string | 否 | 发型师ID |
| service_id | string | 否 | 服务ID（用于计算时长）|

**响应示例：**
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "slots": [
      { "start": "09:00", "end": "09:15", "available": true },
      { "start": "09:15", "end": "09:30", "available": false }
    ],
    "closed": false,
    "business_hours": { "start": "09:00", "end": "21:00" }
  }
}
```

---

### 4.2 创建预约

**POST** `/api/appointments`  
**认证：** 需要

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| merchant_id | string | 是 | 门店ID |
| service_id | string | 是 | 服务ID |
| date | string | 是 | 日期 YYYY-MM-DD |
| start_time | string | 是 | 开始时间 HH:mm |
| customer_id | string | 否 | 客户ID（新客不传）|
| customer_name | string | 否 | 客户姓名 |
| customer_phone | string | 否 | 客户电话 |
| note | string | 否 | 备注 |

**响应示例：**
```json
{
  "code": 0,
  "message": "预约成功",
  "data": {
    "appointment_id": "20260404001",
    "end_time": "10:30"
  }
}
```

---

### 4.3 获取预约列表

**GET** `/api/appointments`  
**认证：** 需要

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| merchant_id | string | 否 | 门店ID（不传则查当前用户所有）|
| date | string | 否 | 日期筛选 |
| status | string | 否 | 状态筛选 |

---

### 4.4 获取预约详情

**GET** `/api/appointments/:id`  
**认证：** 需要

---

### 4.5 更新预约

**PUT** `/api/appointments/:id`  
**认证：** 需要

---

### 4.6 取消预约

**DELETE** `/api/appointments/:id`  
**认证：** 需要

---

### 4.7 确认预约

**POST** `/api/appointments/:id/confirm`  
**认证：** 需要  
**权限：** owner/merchant_admin

---

### 4.8 到店登记（COZE专用）

**POST** `/api/appointments/walk-in`  
**认证：** COZE专用密钥

---

### 4.9 开始服务（COZE专用）

**POST** `/api/appointments/:id/start`  
**认证：** COZE专用密钥

---

### 4.10 完成服务（COZE专用）

**POST** `/api/appointments/:id/complete`  
**认证：** COZE专用密钥

---

### 4.11 标记未到店（COZE专用）

**POST** `/api/appointments/:id/no-show`  
**认证：** COZE专用密钥

---

## 5. 服务管理模块 (/api/services)

### 5.1 获取服务列表

**GET** `/api/services`  
**认证：** 需要

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| merchant_id | string | 是 | 门店ID |

**响应示例：**
```json
{
  "code": 0,
  "message": "ok",
  "data": [
    {
      "service_id": "S123456",
      "name": "洗剪吹",
      "category": "basic",
      "price": 58,
      "total_duration": 45,
      "stages": [
        { "name": "洗发", "duration": 10, "staff_busy": false },
        { "name": "剪发", "duration": 30, "staff_busy": true },
        { "name": "吹干", "duration": 5, "staff_busy": false }
      ]
    }
  ]
}
```

---

### 5.2 创建服务

**POST** `/api/services`  
**认证：** 需要  
**权限：** owner/merchant_admin

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| merchant_id | string | 是 | 门店ID |
| name | string | 是 | 服务名称 |
| category | string | 是 | 分类：basic基础/dye染发/perm烫发/treatment护理 |
| price | number | 是 | 价格（元）|
| total_duration | number | 否 | 总时长（分钟）|
| staff_busy_duration | number | 否 | 发型师忙碌时长 |
| stages | array | 否 | 服务阶段数组 |
| description | string | 否 | 描述 |

**stages 结构：**
```json
[
  { "name": "洗发", "duration": 10, "staff_busy": false },
  { "name": "剪发", "duration": 30, "staff_busy": true }
]
```

---

### 5.3 更新服务

**PUT** `/api/services/:id`  
**认证：** 需要  
**权限：** owner/merchant_admin

---

### 5.4 删除服务（软删除）

**DELETE** `/api/services/:id`  
**认证：** 需要  
**权限：** owner/merchant_admin

---

## 6. 顾客管理模块 (/api/customers)

### 6.1 获取顾客列表

**GET** `/api/customers`  
**认证：** 需要  
**权限：** owner/merchant_admin

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页条数 |
| keyword | string | 否 | 搜索关键词（昵称/手机号/姓名）|

---

### 6.2 更新店家备注

**PUT** `/api/customers/:id/merchant-note`  
**认证：** 需要  
**权限：** owner/merchant_admin

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| merchant_note | string | 是 | 备注内容 |

---

## 7. 交易/记账模块 (/api)

### 7.1 创建交易记录

**POST** `/api/transactions`  
**认证：** 需要  
**权限：** owner/merchant_admin

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| merchant_id | string | 是 | 门店ID |
| customer_id | string | 否 | 客户ID |
| customer_name | string | 是 | 客户姓名 |
| staff_id | string | 是 | 服务员工ID |
| total_amount | number | 是 | 总金额（元）|
| items | array | 否 | 消费项目明细 |
| payment_method | string | 否 | wechat/alipay/cash/card |
| note | string | 否 | 备注 |
| transaction_date | string | 否 | 交易日期，默认今天 |

**items 结构：**
```json
[
  {
    "service_id": "S123",
    "service_name": "洗剪吹",
    "quantity": 1,
    "unit_price": 58,
    "amount": 58
  }
]
```

**响应示例：**
```json
{
  "code": 0,
  "message": "记账成功",
  "data": {
    "transaction_id": "TX123456"
  }
}
```

---

### 7.2 获取交易列表

**GET** `/api/transactions`  
**认证：** 需要

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| merchant_id | string | 否 | 门店ID |
| date | string | 否 | 日期筛选 |
| page | number | 否 | 页码 |
| pageSize | number | 否 | 每页条数 |

---

### 7.3 营收统计

**GET** `/api/stats/revenue`  
**认证：** 需要

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| merchant_id | string | 否 | 门店ID（不传用当前用户）|
| start_date | string | 否 | 开始日期 |
| end_date | string | 否 | 结束日期 |

**响应示例：**
```json
{
  "code": 0,
  "message": "ok",
  "data": {
    "total_revenue": 1580.00,
    "total_transactions": 25,
    "total_appointments": 30,
    "completed_appointments": 28,
    "cancelled_appointments": 2,
    "daily_revenue": [
      { "date": "2026-04-01", "revenue": 500 },
      { "date": "2026-04-02", "revenue": 1080 }
    ],
    "service_ranking": [
      { "service_name": "洗剪吹", "count": 20, "revenue": 1160 },
      { "service_name": "染发", "count": 2, "revenue": 420 }
    ]
  }
}
```

---

## 8. 微信配置模块 (/api/wechat-config)

### 8.1 获取微信配置列表

**GET** `/api/wechat-config`  
**认证：** 需要

---

### 8.2 获取单个配置

**GET** `/api/wechat-config/:id`  
**认证：** 需要

---

### 8.3 创建微信配置

**POST** `/api/wechat-config`  
**认证：** 需要  
**权限：** owner/merchant_admin

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 配置名称 |
| appid | string | 是 | 微信AppID |
| app_secret | string | 是 | 微信AppSecret |
| type | string | 是 | `mini_program`/`service_account` |
| is_active | boolean | 否 | 是否激活 |

---

### 8.4 更新微信配置

**PUT** `/api/wechat-config/:id`  
**认证：** 需要  
**权限：** owner/merchant_admin

---

### 8.5 删除微信配置

**DELETE** `/api/wechat-config/:id`  
**认证：** 需要  
**权限：** owner/merchant_admin

---

## 9. 通知模块 (/api/notifications)

### 9.1 发送广播通知

**POST** `/api/notifications/broadcast`  
**认证：** 需要  
**权限：** owner/merchant_admin

---

## 10. 微信消息模块 (/api/wechat)

### 10.1 微信服务器验证

**GET** `/api/wechat/message`

微信服务器配置URL验证用，无需调用。

---

### 10.2 接收微信消息推送

**POST** `/api/wechat/message`

接收微信服务号消息推送，无需主动调用。

---

## 11. 健康检查

### 11.1 服务健康检查

**GET** `/health`

**响应示例：**
```json
{
  "status": "ok",
  "timestamp": "2026-04-04T08:58:00.000Z"
}
```

---

## 数据模型参考

### 用户角色 (role)

| 角色 | 说明 |
|------|------|
| customer | 普通顾客 |
| pending_owner | 待审核店长（已申请入驻）|
| owner | 店长（小程序端）|
| staff | 员工 |
| merchant_admin | 门店管理员（Web后台）|
| super_admin | 超级管理员 |

### 门店状态 (status)

| 状态 | 说明 |
|------|------|
| applying | 申请中（等待审核）|
| pending | 待处理 |
| active | 正常营业 |
| inactive | 已停用 |
| rejected | 已拒绝 |

### 预约状态 (appointment status)

| 状态 | 说明 |
|------|------|
| pending | 待确认 |
| confirmed | 已确认 |
| in_progress | 服务中 |
| completed | 已完成 |
| cancelled | 已取消 |
| no_show | 未到店 |

---

## 小程序端开发建议

### 申请入驻流程

```
1. 调用 POST /api/merchants/apply 提交申请
   → 用户角色变为 pending_owner

2. 调用 GET /api/merchants/apply-status 查询状态
   → 显示申请进度/结果

3. 状态变为 active
   → 用户角色变为 owner
   → 可以正常使用店长功能
```

### 常用API调用顺序

```
首页加载：
  1. 检查登录状态 → GET /api/auth/profile
  2. 查询申请状态 → GET /api/merchants/apply-status
  3. 如果已入驻，加载门店数据

预约流程：
  1. 获取服务列表 → GET /api/services?merchant_id=xxx
  2. 查询可用时间 → GET /api/slots/available?merchant_id=xxx&date=xxx&service_id=xxx
  3. 创建预约 → POST /api/appointments
```

---

*文档版本：v1.0*  
*如有问题请参考项目源码或联系后端开发人员*
