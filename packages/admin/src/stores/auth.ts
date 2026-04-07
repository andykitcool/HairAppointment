import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

// 用户角色类型
export type UserRole = 'super_admin' | 'merchant_admin' | 'admin' | 'owner' | 'staff' | ''

function normalizeUser(raw: any) {
  const source = raw || {}
  return {
    id: source.id || source._id || '',
    username: source.username || '',
    realName: source.realName || source.real_name || '',
    role: (source.role || '') as UserRole,
    merchantId: source.merchantId || source.merchant_id || '',
    type: source.type || '',
    token: source.token || '',
  }
}

// 从 localStorage 读取初始状态
const storedUser = localStorage.getItem('auth_user')
const initialUser = storedUser ? normalizeUser(JSON.parse(storedUser)) : {
  id: '',
  username: '',
  realName: '',
  role: '' as UserRole,
  merchantId: '',
  type: '' // 'system' | 'merchant'
}

export const useAuthStore = defineStore('auth', () => {
  const isLoggedIn = ref(!!localStorage.getItem('auth_token'))
  const user = ref(initialUser)

  function setUser(info: any) {
    const normalized = normalizeUser(info)
    user.value = normalized
    isLoggedIn.value = true
    // 持久化到 localStorage
    localStorage.setItem('auth_user', JSON.stringify(normalized))
    localStorage.setItem('auth_token', normalized.token || '')
  }

  function logout() {
    user.value = { id: '', username: '', realName: '', role: '', merchantId: '', type: '' }
    isLoggedIn.value = false
    localStorage.removeItem('auth_user')
    localStorage.removeItem('auth_token')
  }

  // 判断是否为超级管理员
  const isSuperAdmin = computed(() => user.value.role === 'super_admin')

  // 判断是否为门店管理员（兼容旧的 owner 角色）
  const isMerchantAdmin = computed(() => 
    user.value.role === 'merchant_admin' || user.value.role === 'owner' || user.value.role === 'admin'
  )

  // 判断是否为管理员（超管或门店管理员）
  const isAdmin = () => {
    const roles = ['super_admin', 'owner', 'merchant_admin', 'admin']
    return roles.includes(user.value.role)
  }

  // 获取用户角色显示名称
  const roleDisplayName = computed(() => {
    const names: Record<string, string> = {
      super_admin: '超级管理员',
      merchant_admin: '门店管理员',
      admin: '门店管理员',
      owner: '门店管理员',
      staff: '店员'
    }
    return names[user.value.role] || '用户'
  })

  return { 
    isLoggedIn, 
    user, 
    setUser, 
    logout, 
    isAdmin,
    isSuperAdmin,
    isMerchantAdmin,
    roleDisplayName
  }
})
