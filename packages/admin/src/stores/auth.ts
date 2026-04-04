import { defineStore } from 'pinia'
import { ref } from 'vue'

// 从 localStorage 读取初始状态
const storedUser = localStorage.getItem('auth_user')
const initialUser = storedUser ? JSON.parse(storedUser) : {
  id: '',
  username: '',
  realName: '',
  role: '' as 'admin' | 'owner' | 'super_admin',
  merchantId: ''
}

export const useAuthStore = defineStore('auth', () => {
  const isLoggedIn = ref(!!localStorage.getItem('auth_token'))
  const user = ref(initialUser)

  function setUser(info: any) {
    user.value = info
    isLoggedIn.value = true
    // 持久化到 localStorage
    localStorage.setItem('auth_user', JSON.stringify(info))
    localStorage.setItem('auth_token', info.token || '')
  }

  function logout() {
    user.value = { id: '', username: '', realName: '', role: 'owner', merchantId: '' }
    isLoggedIn.value = false
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_token')
  }

  // 支持 admin 和 super_admin 角色
  const isAdmin = () => user.value.role === 'admin' || user.value.role === 'super_admin'

  return { isLoggedIn, user, setUser, logout, isAdmin }
})
