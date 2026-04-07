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
  bindEmail: (data: { email: string }) => http.put('/auth/admin/email', data),
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
  delete: (id: string) => http.delete(`/transactions/${id}`),
}

export const serviceApi = {
  getList: (params?: any) => http.get('/services', { params }),
  create: (data: any) => http.post('/services', data),
  update: (id: string, data: any) => http.put(`/services/${id}`, data),
  delete: (id: string) => http.delete(`/services/${id}`),
}

export const staffApi = {
  getList: (params?: any) => http.get('/staff', { params }),
  create: (data: any) => http.post('/staff', data),
  update: (id: string, data: any) => http.put(`/staff/${id}`, data),
  delete: (id: string, params?: any) => http.delete(`/staff/${id}`, { params }),
}

export const merchantApi = {
  getInfo: (id: string) => http.get(`/merchants/${id}`),
  update: (id: string, data: any) => http.put(`/merchants/${id}`, data),
  getDisplaySettings: (id: string) => http.get(`/merchants/${id}/display-settings`),
  updateDisplaySettings: (id: string, data: any) => http.put(`/merchants/${id}/display-settings`, data),
  getCustomerSettings: (id: string) => http.get(`/merchants/${id}/customer-settings`),
  updateCustomerSettings: (id: string, data: any) => http.put(`/merchants/${id}/customer-settings`, data),
}

export const backupApi = {
  sendMerchantBackup: (id: string) => http.post(`/merchants/${id}/backup/send-email`),
}

export const customerApi = {
  getList: (params?: any) => http.get('/customers', { params }),
  update: (id: string, data: any) => http.put(`/customers/${id}`, data),
  delete: (id: string) => http.delete(`/customers/${id}`),
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
  // 门店管理
  getMerchants: (params?: any) => http.get('/admin/merchants', { params }),
  addMerchant: (data: any) => http.post('/admin/merchants', data),
  updateMerchant: (id: string, data: any) => http.put(`/admin/merchants/${id}`, data),
  deleteMerchant: (id: string) => http.delete(`/admin/merchants/${id}`),
  updateMerchantStatus: (id: string, status: string) => http.put(`/admin/merchants/${id}/status`, { status }),
  resetMerchantAdminPassword: (id: string) => http.post(`/admin/merchants/${id}/reset-password`),

  // 入驻审核
  getApplications: (params?: any) => http.get('/admin/applications', { params }),
  reviewApplication: (id: string, action: 'approve' | 'reject', note?: string) => http.post(`/admin/merchants/${id}/review`, { action, note }),

  // 店长管理
  getOwners: (params?: any) => http.get('/admin/owners', { params }),
  addOwner: (data: any) => http.post('/admin/owners', data),
  updateOwner: (userId: string, data: any) => http.put(`/admin/owners/${userId}`, data),
  removeOwner: (userId: string) => http.delete(`/admin/owners/${userId}`),

  // 平台广告
  getAds: (params?: any) => http.get('/admin/ads', { params }),
  createAd: (data: any) => http.post('/admin/ads', data),
  updateAd: (id: string, data: any) => http.put(`/admin/ads/${id}`, data),
  deleteAd: (id: string) => http.delete(`/admin/ads/${id}`),

  // 平台 COZE 配置
  getPlatformCoze: () => http.get('/admin/platform-coze'),
  updatePlatformCoze: (data: any) => http.put('/admin/platform-coze', data),

  // 系统邮件配置
  getSystemEmailConfig: () => http.get('/admin/system-email'),
  updateSystemEmailConfig: (data: any) => http.put('/admin/system-email', data),

  // 平台统计
  getPlatformStats: () => http.get('/admin/stats'),
}
