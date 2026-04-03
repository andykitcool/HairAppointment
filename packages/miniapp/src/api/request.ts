const BASE_URL = 'http://localhost:3000/api'

function getToken(): string {
  return uni.getStorageSync('token') || ''
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

    if (options.needAuth !== false) {
      const token = getToken()
      if (token) {
        header['Authorization'] = `Bearer ${token}`
      }
    }

    uni.request({
      url: `${BASE_URL}${options.url}`,
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
