const DEFAULT_BASE_URL = 'http://localhost:3000/api'
const MOCK_FLAG_KEY = 'miniapp_use_mock_api'
const MOCK_DB_KEY = 'miniapp_mock_db'

function getToken(): string {
  return uni.getStorageSync('token') || ''
}

function getBaseUrl(): string {
  return uni.getStorageSync('api_base_url') || DEFAULT_BASE_URL
}

function isMockEnabled(): boolean {
  const saved = uni.getStorageSync(MOCK_FLAG_KEY)
  if (saved === false || saved === 'false' || saved === 0 || saved === '0') {
    return false
  }
  return true
}

export function setMockEnabled(enabled: boolean) {
  uni.setStorageSync(MOCK_FLAG_KEY, enabled)
}

export function setApiBaseUrl(baseUrl: string) {
  const normalized = (baseUrl || '').trim()
  if (!normalized) {
    uni.removeStorageSync('api_base_url')
    return
  }
  uni.setStorageSync('api_base_url', normalized.replace(/\/$/, ''))
}

export function resetMockDb() {
  uni.removeStorageSync(MOCK_DB_KEY)
}

export function getApiEnv() {
  return {
    useMock: isMockEnabled(),
    baseUrl: getBaseUrl(),
    defaultBaseUrl: DEFAULT_BASE_URL,
  }
}

interface MockDb {
  merchant: any
  user: any
  services: any[]
  appointments: any[]
  appointmentSeq: number
}

function createDefaultMockDb(): MockDb {
  const now = new Date().toISOString()
  return {
    merchant: {
      merchant_id: 'M_mock_001',
      name: '黑白造型工作室',
      address: '测试路 88 号',
      phone: '13800000000',
      business_hours: { start: '09:00', end: '21:00' },
      status: 'active',
    },
    user: {
      _id: 'U_mock_001',
      openid: 'openid_mock_001',
      nickname: '体验用户',
      avatar_url: '',
      phone: '13800138000',
      role: 'customer',
      merchant_id: 'M_mock_001',
      customer_note: '',
      total_spending: 0,
      visit_count: 0,
      create_time: now,
      update_time: now,
    },
    services: [
      { service_id: 'S_mock_001', merchant_id: 'M_mock_001', name: '洗剪吹定制', category: 'cut', price: 5800, total_duration: 60, description: '精准剪裁，塑造完美发型' },
      { service_id: 'S_mock_002', merchant_id: 'M_mock_001', name: '质感纹理烫发', category: 'perm', price: 28000, total_duration: 120, description: '持久定型，自然蓬松质感' },
      { service_id: 'S_mock_003', merchant_id: 'M_mock_001', name: '高级色彩染发', category: 'dye', price: 18000, total_duration: 90, description: '潮流色系，呵护发质光泽' },
      { service_id: 'S_mock_004', merchant_id: 'M_mock_001', name: '深层结构修护', category: 'care', price: 9800, total_duration: 60, description: '深层修护，锁水润泽养发' },
    ],
    appointments: [],
    appointmentSeq: 0,
  }
}

function loadMockDb(): MockDb {
  const raw = uni.getStorageSync(MOCK_DB_KEY)
  if (raw) {
    return raw as MockDb
  }
  const initial = createDefaultMockDb()
  uni.setStorageSync(MOCK_DB_KEY, initial)
  return initial
}

function saveMockDb(db: MockDb) {
  uni.setStorageSync(MOCK_DB_KEY, db)
}

function createSlots(start = '09:00', end = '21:00') {
  const slots: Array<{ start: string; end: string; available: boolean }> = []
  const [sh, sm] = start.split(':').map((n) => parseInt(n, 10))
  const [eh, em] = end.split(':').map((n) => parseInt(n, 10))
  let current = sh * 60 + sm
  const endMin = eh * 60 + em

  while (current < endMin) {
    const next = current + 30
    const startH = String(Math.floor(current / 60)).padStart(2, '0')
    const startM = String(current % 60).padStart(2, '0')
    const endH = String(Math.floor(next / 60)).padStart(2, '0')
    const endM = String(next % 60).padStart(2, '0')
    slots.push({
      start: `${startH}:${startM}`,
      end: `${endH}:${endM}`,
      available: true,
    })
    current = next
  }

  return slots
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map((n) => parseInt(n, 10))
  return h * 60 + m
}

function minutesToTime(minutes: number): string {
  const h = String(Math.floor(minutes / 60)).padStart(2, '0')
  const m = String(minutes % 60).padStart(2, '0')
  return `${h}:${m}`
}

function ensureMockAuth(needAuth?: boolean) {
  if (needAuth === false) return
  const token = getToken()
  if (!token) {
    throw new Error('请先登录')
  }
}

async function handleMockRequest<T = any>(options: RequestOptions): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, 120))

  const db = loadMockDb()
  const url = options.url
  const method = options.method || 'GET'
  const data = options.data || {}

  if (url === '/auth/wechat-login' && method === 'POST') {
    const token = `mock_token_${Date.now()}`
    uni.setStorageSync('token', token)
    db.user.update_time = new Date().toISOString()
    saveMockDb(db)
    return { token, user: db.user } as T
  }

  if (url === '/auth/profile' && method === 'GET') {
    ensureMockAuth(options.needAuth)
    return db.user as T
  }

  if (url === '/auth/profile' && method === 'PUT') {
    ensureMockAuth(options.needAuth)
    db.user = {
      ...db.user,
      ...data,
      customer_note: data.customer_note ?? db.user.customer_note,
      update_time: new Date().toISOString(),
    }
    saveMockDb(db)
    return db.user as T
  }

  if (url.startsWith('/merchants/') && method === 'GET') {
    ensureMockAuth(options.needAuth)
    return db.merchant as T
  }

  if (url === '/services' && method === 'GET') {
    const merchantId = data.merchant_id || db.merchant.merchant_id
    return db.services.filter((s) => s.merchant_id === merchantId) as T
  }

  if (url === '/slots/available' && method === 'GET') {
    const merchantId = data.merchant_id || db.merchant.merchant_id
    const date = data.date
    const serviceId = data.service_id
    const service = db.services.find((s) => s.service_id === serviceId) || db.services[0]
    const serviceDuration = service?.total_duration || 30
    const baseSlots = createSlots(db.merchant.business_hours.start, db.merchant.business_hours.end)

    const appointments = db.appointments.filter((a) => a.merchant_id === merchantId && a.date === date && a.status !== 'cancelled')

    const slots = baseSlots.map((slot) => {
      const slotStart = timeToMinutes(slot.start)
      const slotEnd = slotStart + serviceDuration
      const hasConflict = appointments.some((appt) => {
        const apptStart = timeToMinutes(appt.start_time)
        const apptEnd = timeToMinutes(appt.end_time)
        return slotStart < apptEnd && apptStart < slotEnd
      })

      // 不允许超出营业时间
      const businessEnd = timeToMinutes(db.merchant.business_hours.end)
      return {
        ...slot,
        available: !hasConflict && slotEnd <= businessEnd,
      }
    })

    return {
      slots,
      closed: false,
      business_hours: db.merchant.business_hours,
    } as T
  }

  if (url === '/appointments' && method === 'POST') {
    ensureMockAuth(options.needAuth)

    if (!data.merchant_id || !data.service_id || !data.date || !data.start_time) {
      throw new Error('预约参数不完整')
    }

    const service = db.services.find((s) => s.service_id === data.service_id)
      || db.services.find((s) => s.category === data.service_id.replace('cat_', ''))
      || db.services[0]
    if (!service) {
      throw new Error('服务不存在')
    }

    const startMin = timeToMinutes(data.start_time)
    const endMin = startMin + (service.total_duration || 30)
    const endTime = minutesToTime(endMin)

    const hasConflict = db.appointments.some((appt) => {
      if (appt.merchant_id !== data.merchant_id || appt.date !== data.date || appt.status === 'cancelled') {
        return false
      }
      const apptStart = timeToMinutes(appt.start_time)
      const apptEnd = timeToMinutes(appt.end_time)
      return startMin < apptEnd && apptStart < endMin
    })

    if (hasConflict) {
      throw new Error('该时段已被预约，请选择其他时间')
    }

    db.appointmentSeq += 1
    const seq = String(db.appointmentSeq).padStart(3, '0')
    const appointmentId = `${data.date.replace(/-/g, '')}-${seq}`
    const now = new Date().toISOString()
    const record = {
      _id: `A_${Date.now()}`,
      appointment_id: appointmentId,
      merchant_id: data.merchant_id,
      customer_id: db.user._id,
      customer_name: db.user.nickname,
      customer_phone: db.user.phone,
      staff_id: 'staff_mock_001',
      staff_name: '店长',
      service_id: service.service_id,
      service_name: service.name,
      date: data.date,
      start_time: data.start_time,
      end_time: endTime,
      status: 'pending',
      source: 'mini_program',
      note: data.note || '',
      timeline: [
        {
          stage_name: service.name,
          start: data.start_time,
          end: endTime,
          staff_busy: true,
        },
      ],
      create_time: now,
      update_time: now,
    }

    db.appointments.unshift(record)
    saveMockDb(db)
    return { appointment_id: appointmentId, end_time: endTime } as T
  }

  if (url === '/appointments' && method === 'GET') {
    ensureMockAuth(options.needAuth)
    const status = data.status
    const list = db.appointments.filter((a) => {
      if (status && a.status !== status) return false
      return a.customer_id === db.user._id
    })
    return {
      list,
      total: list.length,
      page: 1,
      pageSize: data.pageSize || list.length,
    } as T
  }

  const appointmentIdMatch = url.match(/^\/appointments\/([^/]+)$/)
  if (appointmentIdMatch && method === 'GET') {
    ensureMockAuth(options.needAuth)
    const found = db.appointments.find((a) => a.appointment_id === appointmentIdMatch[1] || a._id === appointmentIdMatch[1])
    if (!found) throw new Error('预约不存在')
    return found as T
  }

  if (appointmentIdMatch && method === 'DELETE') {
    ensureMockAuth(options.needAuth)
    const found = db.appointments.find((a) => a.appointment_id === appointmentIdMatch[1] || a._id === appointmentIdMatch[1])
    if (!found) throw new Error('预约不存在')
    if (!['pending', 'confirmed'].includes(found.status)) {
      throw new Error('当前状态不可取消')
    }
    found.status = 'cancelled'
    found.update_time = new Date().toISOString()
    saveMockDb(db)
    return null as T
  }

  throw new Error(`Mock 未实现接口: ${method} ${url}`)
}

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  needAuth?: boolean
}

export function request<T = any>(options: RequestOptions): Promise<T> {
  if (isMockEnabled()) {
    return handleMockRequest<T>(options)
  }

  return new Promise((resolve, reject) => {
    const header: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (options.needAuth !== false) {
      const token = getToken()
      if (token) {
        header['Authorization'] = `Bearer ${token}`
      }
    }

    uni.request({
      url: `${getBaseUrl()}${options.url}`,
      method: options.method || 'GET',
      data: options.data,
      header,
      success: (res: any) => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          const body = res.data
          if (body.code === 0) {
            resolve(body.data)
          } else {
            reject(new Error(body.message || '请求失败'))
          }
        } else if (res.statusCode === 401) {
          uni.removeStorageSync('token')
          uni.removeStorageSync('user_info')
          reject(new Error('登录已过期'))
        } else {
          reject(new Error(res.data?.message || '请求失败'))
        }
      },
      fail: (err) => {
        reject(new Error(err.errMsg || '网络错误'))
      },
    })
  })
}

request.get = <T = any>(url: string, data?: any) =>
  request<T>({ url, method: 'GET', data, needAuth: true })

request.post = <T = any>(url: string, data?: any) =>
  request<T>({ url, method: 'POST', data, needAuth: true })

request.put = <T = any>(url: string, data?: any) =>
  request<T>({ url, method: 'PUT', data, needAuth: true })

request.delete = <T = any>(url: string, data?: any) =>
  request<T>({ url, method: 'DELETE', data, needAuth: true })

// 不需要认证的接口
request.publicGet = <T = any>(url: string, data?: any) =>
  request<T>({ url, method: 'GET', data, needAuth: false })

request.publicPost = <T = any>(url: string, data?: any) =>
  request<T>({ url, method: 'POST', data, needAuth: false })

/** 认证 API */
export const authApi = {
  wechatLogin: (code: string) => request.publicPost<any>('/auth/wechat-login', { code }),
  getPhone: (code: string) => request.post<any>('/auth/phone', { code }),
  getProfile: () => request.get<any>('/auth/profile'),
  updateProfile: (data: any) => request.put<any>('/auth/profile', data),
  applyOwner: (data: any) => request.post<any>('/auth/apply-owner', data),
  adminLogin: (data: any) => request.publicPost<any>('/auth/admin-login', data),
}

/** 预约 API */
export const appointmentApi = {
  getAvailableSlots: (params: any) => request.publicGet<any>('/slots/available', params),
  create: (data: any) => request.post<any>('/appointments', data),
  getList: (params?: any) => request.get<any>('/appointments', params),
  getById: (id: string) => request.get<any>(`/appointments/${id}`),
  cancel: (id: string) => request.delete(`/appointments/${id}`),
  update: (id: string, data: any) => request.put(`/appointments/${id}`, data),
  confirm: (id: string) => request.post(`/appointments/${id}/confirm`),
}

/** 服务 API */
export const serviceApi = {
  getList: (merchantId: string) => request.get<any>('/services', { merchant_id: merchantId }),
  create: (data: any) => request.post<any>('/services', data),
  update: (id: string, data: any) => request.put<any>(`/services/${id}`, data),
  delete: (id: string) => request.delete(`/services/${id}`),
}

/** 商户 API */
export const merchantApi = {
  getInfo: (id: string) => request.get<any>(`/merchants/${id}`),
  update: (id: string, data: any) => request.put<any>(`/merchants/${id}`, data),
  getClosedPeriods: (id: string, params?: any) => request.get<any>(`/merchants/${id}/closed-periods`, params),
  createClosedPeriod: (id: string, data: any) => request.post<any>(`/merchants/${id}/closed-periods`, data),
  deleteClosedPeriod: (merchantId: string, periodId: string) => request.delete(`/merchants/${merchantId}/closed-periods/${periodId}`),
  setExtendedHours: (merchantId: string, data: any) => request.post<any>(`/merchants/${merchantId}/extended-hours`, data),
  updateExtendedHours: (merchantId: string, index: number, data: any) => request.put<any>(`/merchants/${merchantId}/extended-hours/${index}`, data),
  deleteExtendedHours: (merchantId: string, index: number) => request.delete(`/merchants/${merchantId}/extended-hours/${index}`),
}

/** 交易 API */
export const transactionApi = {
  create: (data: any) => request.post<any>('/transactions', data),
  getList: (params?: any) => request.get<any>('/transactions', params),
}

/** 统计 API */
export const statsApi = {
  getRevenue: (params?: any) => request.get<any>('/stats/revenue', params),
  getRevenueStats: (params?: any) => request.get<any>('/stats/revenue', params),
}

/** 顾客 API */
export const customerApi = {
  getList: (params?: any) => request.get<any>('/customers', params),
  updateMerchantNote: (id: string, note: string) => request.put(`/customers/${id}/merchant-note`, { merchant_note: note }),
}

/** 通知 API */
export const notificationApi = {
  broadcast: (data: any) => request.post<any>('/notifications/broadcast', data),
}
