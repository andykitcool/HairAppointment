<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="aside">
      <div class="logo">
        <h2>美发预约</h2>
        <p>管理后台</p>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#001529"
        text-color="#ffffffa6"
        active-text-color="#fff"
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据总览</span>
        </el-menu-item>
        <el-menu-item index="/appointments">
          <el-icon><Calendar /></el-icon>
          <span>预约管理</span>
        </el-menu-item>
        <el-menu-item index="/transactions">
          <el-icon><Wallet /></el-icon>
          <span>记账管理</span>
        </el-menu-item>
        <el-menu-item index="/services">
          <el-icon><Scissors /></el-icon>
          <span>服务管理</span>
        </el-menu-item>
        <el-menu-item index="/customers">
          <el-icon><User /></el-icon>
          <span>顾客管理</span>
        </el-menu-item>
        <el-menu-item index="/schedule">
          <el-icon><Clock /></el-icon>
          <span>营业设置</span>
        </el-menu-item>
        <el-menu-item index="/stats">
          <el-icon><TrendCharts /></el-icon>
          <span>营收统计</span>
        </el-menu-item>

        <el-sub-menu index="settings">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统设置</span>
          </template>
          <el-menu-item index="/settings/coze">COZE 配置</el-menu-item>
          <el-menu-item index="/settings/feishu">飞书配置</el-menu-item>
          <el-menu-item index="/settings/sync">同步配置</el-menu-item>
          <el-menu-item index="/settings/notify">通知配置</el-menu-item>
        </el-sub-menu>

        <el-sub-menu v-if="isAdmin" index="admin">
          <template #title>
            <el-icon><Tools /></el-icon>
            <span>超管功能</span>
          </template>
          <el-menu-item index="/admin/merchants">门店管理</el-menu-item>
          <el-menu-item index="/admin/applications">入驻审核</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-right">
          <el-dropdown>
            <span class="user-dropdown">
              {{ username }} <el-icon><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()

const activeMenu = computed(() => route.path)
const username = computed(() => authStore.user.realName || authStore.user.username || '管理员')
const isAdmin = computed(() => authStore.isAdmin())

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

onMounted(async () => {
  if (!authStore.isLoggedIn) {
    // Check if there's an active session
    try {
      const { authApi } = await import('@/api/request')
      const res = await authApi.getProfile() as any
      if (res?.user) authStore.setUser(res.user)
    } catch {
      router.push('/login')
    }
  }
})
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.aside {
  background-color: #001529;
  overflow-y: auto;
}

.logo {
  padding: 20px;
  text-align: center;
  color: #fff;
  border-bottom: 1px solid #ffffff1a;
}

.logo h2 {
  font-size: 18px;
  margin: 0 0 4px;
}

.logo p {
  font-size: 12px;
  color: #ffffffa6;
  margin: 0;
}

.header {
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
  padding: 0 20px;
}

.user-dropdown {
  cursor: pointer;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.main {
  background: #f0f2f5;
  min-height: 0;
  overflow-y: auto;
}
</style>
