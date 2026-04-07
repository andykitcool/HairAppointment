const DEFAULT_BASE_URL = 'http://127.0.0.1:3100/api'

function getToken(): string {
  return uni.getStorageSync('token') || ''
}

function getBaseUrl(): string {
  const saved = String(uni.getStorageSync('api_base_url') || '').trim()
  if (!saved) return DEFAULT_BASE_URL

  // 兼容旧版本遗留的线上地址，开发环境默认回到本地 API
  if (saved.includes('wechat.vidiu.cn')) {
    uni.setStorageSync('api_base_url', DEFAULT_BASE_URL)
    return DEFAULT_BASE_URL
  }

  return saved
}

export function setApiBaseUrl(baseUrl: string) {
  const normalized = (baseUrl || '').trim()
  if (!normalized) {
    uni.removeStorageSync('api_base_url')
    return
  }
  uni.setStorageSync('api_base_url', normalized.replace(/\/$/, ''))
}

export function getApiEnv() {
  return {
    baseUrl: getBaseUrl(),
    defaultBaseUrl: DEFAULT_BASE_URL,
  }
}

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  needAuth?: boolean
}

export function request<T = any>(options: RequestOptions): Promise<T> {
  return new Promise((resolve, reject) => {
    const header: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    const token = getToken()
    if (token) {
      header['Authorization'] = `Bearer ${token}`
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
        } else if (res.statusCode === 401 && options.needAuth !== false) {
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
  search: (params: { name?: string; page?: number; limit?: number }) =>
    request.publicGet<any>('/merchants/search', params),
  nearby: (params: { lat: number; lng: number; radius?: number }) =>
    request.publicGet<any>('/merchants/nearby', params),
}

/** 平台 API */
export const platformApi = {
  getAds: () => request.publicGet<any>('/platform/ads'),
  getCozeConfig: () => request.publicGet<any>('/platform/coze-config'),
  hairstyleRecommend: (data: any) => request.post<any>('/platform/hairstyle-recommend', data),
  getLatestHairstyle: (clientId: string) => request.publicGet<any>('/platform/hairstyle-recommend/latest', { client_id: clientId }),
  getHairstyleTask: (taskId: string) => request.publicGet<any>(`/platform/hairstyle-recommend/${taskId}`),
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
