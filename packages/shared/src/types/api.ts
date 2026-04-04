/** 通用 API 响应 */
export interface IApiResponse<T = any> {
  code: number
  message: string
  data: T
}

/** 分页请求参数 */
export interface IPaginationQuery {
  page?: number
  pageSize?: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/** 分页响应数据 */
export interface IPaginatedData<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

/** 创建预约请求 */
export interface ICreateAppointmentBody {
  merchant_id: string
  service_id: string
  date: string           // 'YYYY-MM-DD'
  start_time: string     // 'HH:mm'
  customer_id?: string   // 代预约时可选
  customer_name?: string
  customer_phone?: string
  note?: string
}

/** 修改预约请求 */
export interface IUpdateAppointmentBody {
  service_id?: string
  date?: string
  start_time?: string
  note?: string
}

/** 创建交易记录请求 */
export interface ICreateTransactionBody {
  merchant_id: string
  appointment_id?: string
  customer_id?: string
  customer_name: string
  staff_id: string
  total_amount: number
  items: Array<{
    service_name: string
    amount: number
    quantity: number
  }>
  payment_method: string
  note?: string
}

/** 散客登记请求 */
export interface IWalkInBody {
  merchant_id: string
  service_name: string
  customer_name?: string
  customer_phone?: string
  duration?: number
}

/** 微信登录请求 */
export interface IWechatLoginBody {
  code: string
}

/** 微信登录响应 */
export interface IWechatLoginData {
  token: string
  user: {
    _id: string
    openid: string
    nickname: string
    avatar_url: string
    phone: string
    role: string
    merchant_id?: string
  }
}

/** 管理后台登录请求 */
export interface IAdminLoginBody {
  username: string
  password: string
}

/** 申请成为店长 */
export interface IApplyOwnerBody {
  shop_name: string
  phone: string
  address?: string
  description?: string
}

/** 设置打烊时段请求 */
export interface ICreateClosedPeriodBody {
  date: string
  type: string
  start_time?: string
  end_time?: string
  reason?: string
  cancel_appointments?: boolean
  notify_customers?: boolean
}

/** 设置延长营业时间请求 */
export interface ISetExtendedHoursBody {
  start_date: string
  end_date: string
  extended_end: string
}

/** 营收统计数据 */
export interface IRevenueStats {
  total_revenue: number
  total_transactions: number
  total_appointments: number
  completed_appointments: number
  cancelled_appointments: number
  daily_revenue: Array<{ date: string; revenue: number }>
  service_ranking: Array<{ service_name: string; count: number; revenue: number }>
}

/** 可用时间段 */
export interface IAvailableSlot {
  start_time: string  // 'HH:mm'
  end_time: string    // 'HH:mm'
  available: boolean
}

/** JWT Payload */
export interface IJwtPayload {
  user_id: string
  openid?: string
  role: string
  merchant_id?: string
  type?: string
}
