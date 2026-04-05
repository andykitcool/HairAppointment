import { defineStore } from 'pinia'
import { ref } from 'vue'

const USER_STORAGE_KEY = 'user_info'

function normalizeUser(info: any = {}) {
  const avatarUrl = info.avatarUrl || info.avatar_url || ''
  const realName = info.realName || info.real_name || ''
  const merchantId = info.merchantId || info.merchant_id || ''
  const customerNote = info.customerNote || info.customer_note || ''
  const totalSpending = Number(info.totalSpending ?? info.total_spending ?? 0)
  const visitCount = Number(info.visitCount ?? info.visit_count ?? 0)

  return {
    _id: info._id || '',
    openid: info.openid || '',
    nickname: info.nickname || '',
    avatarUrl,
    avatar_url: avatarUrl,
    phone: info.phone || '',
    realName,
    real_name: realName,
    role: info.role || 'customer',
    merchantId,
    merchant_id: merchantId,
    customerNote,
    customer_note: customerNote,
    totalSpending,
    total_spending: totalSpending,
    visitCount,
    visit_count: visitCount,
  }
}

export const useUserStore = defineStore('user', () => {
  const token = ref('')
  const userInfo = ref(normalizeUser())

  const isLoggedIn = ref(false)

  function setToken(t: string) {
    token.value = t
    uni.setStorageSync('token', t)
  }

  function setUser(info: any) {
    userInfo.value = normalizeUser(info)
    isLoggedIn.value = true
    uni.setStorageSync(USER_STORAGE_KEY, userInfo.value)
  }

  function logout() {
    token.value = ''
    userInfo.value = normalizeUser()
    isLoggedIn.value = false
    uni.removeStorageSync('token')
    uni.removeStorageSync(USER_STORAGE_KEY)
  }

  // 初始化时从缓存恢复
  const cachedToken = uni.getStorageSync('token')
  const cachedUser = uni.getStorageSync(USER_STORAGE_KEY)

  if (cachedToken) {
    token.value = cachedToken
    isLoggedIn.value = true
  }

  if (cachedUser) {
    userInfo.value = normalizeUser(cachedUser)
    isLoggedIn.value = !!token.value
  }

  return { token, userInfo, isLoggedIn, setToken, setUser, logout }
})
