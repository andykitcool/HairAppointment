import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAuthStore = defineStore('auth', () => {
  const isLoggedIn = ref(false)
  const user = ref({
    id: '',
    username: '',
    realName: '',
    role: '' as 'admin' | 'owner',
    merchantId: ''
  })

  function setUser(info: any) {
    user.value = info
    isLoggedIn.value = true
  }

  function logout() {
    user.value = { id: '', username: '', realName: '', role: 'owner', merchantId: '' }
    isLoggedIn.value = false
  }

  const isAdmin = () => user.value.role === 'admin'

  return { isLoggedIn, user, setUser, logout, isAdmin }
})
