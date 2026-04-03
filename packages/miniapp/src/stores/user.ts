import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUserStore = defineStore('user', () => {
  const token = ref('')
  const userInfo = ref({
    _id: '',
    openid: '',
    nickname: '',
    avatarUrl: '',
    phone: '',
    realName: '',
    role: 'customer' as string,
    merchantId: ''
  })

  const isLoggedIn = ref(false)

  function setToken(t: string) {
    token.value = t
    uni.setStorageSync('token', t)
  }

  function setUser(info: any) {
    userInfo.value = info
    isLoggedIn.value = true
  }

  function logout() {
    token.value = ''
    userInfo.value = {
      _id: '', openid: '', nickname: '', avatarUrl: '',
      phone: '', realName: '', role: 'customer', merchantId: ''
    }
    isLoggedIn.value = false
    uni.removeStorageSync('token')
  }

  // 初始化时从缓存恢复
  const cachedToken = uni.getStorageSync('token')
  if (cachedToken) {
    token.value = cachedToken
  }

  return { token, userInfo, isLoggedIn, setToken, setUser, logout }
})
