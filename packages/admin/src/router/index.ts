import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', public: true }
  },
  {
    path: '/',
    component: () => import('@/layouts/MainLayout.vue'),
    redirect: '/dashboard',
    children: [
      { path: 'dashboard', name: 'Dashboard', component: () => import('@/views/dashboard/index.vue'), meta: { title: '数据总览' } },
      { path: 'appointments', name: 'Appointments', component: () => import('@/views/appointments/index.vue'), meta: { title: '预约管理' } },
      { path: 'transactions', name: 'Transactions', component: () => import('@/views/transactions/index.vue'), meta: { title: '记账管理' } },
      { path: 'services', name: 'Services', component: () => import('@/views/services/index.vue'), meta: { title: '服务管理' } },
      { path: 'customers', name: 'Customers', component: () => import('@/views/customers/index.vue'), meta: { title: '顾客管理' } },
      { path: 'schedule', name: 'Schedule', component: () => import('@/views/schedule/index.vue'), meta: { title: '营业设置' } },
      { path: 'stats', name: 'Stats', component: () => import('@/views/stats/index.vue'), meta: { title: '营收统计' } },
      { path: 'settings/profile', name: 'ProfileSettings', component: () => import('@/views/settings/profile.vue'), meta: { title: '个人设置' } },
      { path: 'settings/coze', name: 'CozeSettings', component: () => import('@/views/settings/coze.vue'), meta: { title: 'COZE 配置' } },
      { path: 'settings/feishu', name: 'FeishuSettings', component: () => import('@/views/settings/feishu.vue'), meta: { title: '飞书配置' } },
      { path: 'settings/sync', name: 'SyncSettings', component: () => import('@/views/settings/sync.vue'), meta: { title: '同步配置' } },
      { path: 'settings/notify', name: 'NotifySettings', component: () => import('@/views/settings/notify.vue'), meta: { title: '通知配置' } },
      { path: 'settings/wechat', name: 'WechatSettings', component: () => import('@/views/settings/wechat.vue'), meta: { title: '微信配置', admin: true } },
      // 超管专用
      { path: 'admin/merchants', name: 'AdminMerchants', component: () => import('@/views/admin/merchants.vue'), meta: { title: '门店管理', admin: true } },
      { path: 'admin/applications', name: 'AdminApplications', component: () => import('@/views/admin/applications.vue'), meta: { title: '入驻审核', admin: true } },
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title || '管理后台'} - 美发预约系统`
  if (to.meta.public) {
    next()
    return
  }
  // 从 localStorage 检查登录状态
  const token = localStorage.getItem('auth_token')
  const storedUser = localStorage.getItem('auth_user')
  if (!token || !storedUser) {
    alert(`路由守卫: 未登录\n路径: ${to.path}\ntoken: ${!!token}\nuser: ${!!storedUser}`)
    next('/login')
    return
  }
  // 超管页面权限校验
  if (to.meta.admin) {
    const user = JSON.parse(storedUser)
    if (user.role !== 'admin' && user.role !== 'super_admin') {
      next('/dashboard')
      return
    }
  }
  next()
})

export default router
