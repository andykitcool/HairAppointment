import axios from 'axios'
import type { AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import router from '@/router'

const http: AxiosInstance = axios.create({
  baseURL: '/api',
  timeout: 15000,
  withCredentials: true
})

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      alert(`API返回401错误\n路径: ${error.config?.url}`)
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      router.push('/login')
    }
    return Promise.reject(error)
  }
)

export default http

export const authApi = {
  login: (data: { username: string; password: string }) => http.post('/auth/admin-login', data),
  getProfile: () => http.get('/auth/profile'),
  // 管理员相关接口
  getAdminProfile: () => http.get('/auth/admin/profile'),
  changePassword: (data: { old_password: string; new_password: string }) => http.put('/auth/admin/password', data),
  bindPhone: (data: { phone: string; code: string }) => http.put('/auth/admin/phone', data),
  bindWechat: (data: { code: string }) => http.put('/auth/admin/wechat', data),
  // 微信扫码登录
  getWechatLoginQR: () => http.get('/auth/wechat-login-qr'),
  checkWechatLoginStatus: (scene: string) => http.get('/auth/wechat-login-status', { params: { scene } }),
  // 微信绑定
  getWechatBindQR: () => http.get('/auth/wechat-bind-qr'),
  checkWechatBindStatus: (scene: string) => http.get('/auth/wechat-bind-status', { params: { scene } }),
}

// 微信配置管理
export const wechatConfigApi = {
  getList: () => http.get('/wechat-config'),
  getById: (id: string) => http.get(`/wechat-config/${id}`),
  create: (data: any) => http.post('/wechat-config', data),
  update: (id: string, data: any) => http.put(`/wechat-config/${id}`, data),
  delete: (id: string) => http.delete(`/wechat-config/${id}`),
}

export const appointmentApi = {
  getList: (params?: any) => http.get('/appointments', { params }),
  getById: (id: string) => http.get(`/appointments/${id}`),
  update: (id: string, data: any) => http.put(`/appointments/${id}`, data),
  cancel: (id: string) => http.delete(`/appointments/${id}`),
  confirm: (id: string) => http.post(`/appointments/${id}/confirm`),
  start: (id: string, data?: any) => http.post(`/appointments/${id}/start`, data),
  complete: (id: string, data: any) => http.post(`/appointments/${id}/complete`, data),
  markNoShow: (id: string) => http.post(`/appointments/${id}/no-show`),
}

export const transactionApi = {
  getList: (params?: any) => http.get('/transactions', { params }),
  create: (data: any) => http.post('/transactions', data),
  getById: (id: string) => http.get(`/transactions/${id}`),
  update: (id: string, data: any) => http.put(`/transactions/${id}`, data),
}

export const serviceApi = {
  getList: (params?: any) => http.get('/services', { params }),
  create: (data: any) => http.post('/services', data),
  update: (id: string, data: any) => http.put(`/services/${id}`, data),
  delete: (id: string) => http.delete(`/services/${id}`),
}

export const merchantApi = {
  getInfo: (id: string) => http.get(`/merchants/${id}`),
  update: (id: string, data: any) => http.put(`/merchants/${id}`, data),
  getClosedPeriods: (id: string, params?: any) => http.get(`/merchants/${id}/closed-periods`, { params }),
  createClosedPeriod: (id: string, data: any) => http.post(`/merchants/${id}/closed-periods`, data),
  deleteClosedPeriod: (merchantId: string, periodId: string) => http.delete(`/merchants/${merchantId}/closed-periods/${periodId}`),
  setExtendedHours: (merchantId: string, data: any) => http.post(`/merchants/${merchantId}/extended-hours`, data),
  updateExtendedHours: (merchantId: string, index: number, data: any) => http.put(`/merchants/${merchantId}/extended-hours/${index}`, data),
  deleteExtendedHours: (merchantId: string, index: number) => http.delete(`/merchants/${merchantId}/extended-hours/${index}`),
}

export const customerApi = {
  getList: (params?: any) => http.get('/customers', { params }),
  updateMerchantNote: (id: string, note: string) => http.put(`/customers/${id}/merchant-note`, { merchant_note: note }),
}

export const statsApi = {
  getRevenue: (params?: any) => http.get('/stats/revenue', { params }),
  getPlatformStats: () => http.get('/admin/stats'),
}

export const notificationApi = {
  broadcast: (data: any) => http.post('/notifications/broadcast', data),
}

export const adminApi = {
  getMerchants: (params?: any) => http.get('/admin/merchants', { params }),
  addMerchant: (data: any) => http.post('/admin/merchants', data),
  updateMerchantStatus: (id: string, status: string) => http.put(`/admin/merchants/${id}/status`, { status }),
}
