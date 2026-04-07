<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="aside">
      <div class="logo">
        <h2>美发预约</h2>
        <p>管理后台</p>
        <p v-if="authStore.roleDisplayName" class="role-tag">{{ authStore.roleDisplayName }}</p>
      </div>
      <el-menu
        :default-active="activeMenu"
        router
        background-color="#001529"
        text-color="#ffffffa6"
        active-text-color="#fff"
      >
        <!-- 超管菜单 -->
        <template v-if="authStore.isSuperAdmin">
          <el-menu-item index="/dashboard">
            <el-icon><DataAnalysis /></el-icon>
            <span>数据总览</span>
          </el-menu-item>

          <el-sub-menu index="admin">
            <template #title>
              <el-icon><Shop /></el-icon>
              <span>门店管理</span>
            </template>
            <el-menu-item index="/admin/merchants">门店列表</el-menu-item>
            <el-menu-item index="/admin/owners">店长管理</el-menu-item>
            <el-menu-item index="/admin/applications">入驻审核</el-menu-item>
            <el-menu-item index="/admin/ads">广告管理</el-menu-item>
            <el-menu-item index="/admin/platform-coze">AI发型推荐</el-menu-item>
          </el-sub-menu>

          <el-sub-menu index="settings">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>系统设置</span>
            </template>
            <el-menu-item index="/settings/profile">个人设置</el-menu-item>
            <el-menu-item index="/settings/wechat">微信配置</el-menu-item>
            <el-menu-item index="/settings/system-email">系统邮件配置</el-menu-item>
          </el-sub-menu>
        </template>

        <!-- 门店管理员菜单 -->
        <template v-else-if="authStore.isMerchantAdmin">
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
            <el-icon><Collection /></el-icon>
            <span>服务管理</span>
          </el-menu-item>
          <el-menu-item index="/customers">
            <el-icon><User /></el-icon>
            <span>顾客管理</span>
          </el-menu-item>
          <el-menu-item index="/merchant/staff">
            <el-icon><Avatar /></el-icon>
            <span>员工管理</span>
          </el-menu-item>
          <el-menu-item index="/merchant/settings">
            <el-icon><Shop /></el-icon>
            <span>门店管理</span>
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
            <el-menu-item index="/settings/profile">个人设置</el-menu-item>
            <el-menu-item index="/settings/membership-levels">会员字典配置</el-menu-item>
            <el-menu-item index="/settings/ai-image">AI生图配置</el-menu-item>
            <el-menu-item index="/settings/coze">COZE 配置</el-menu-item>
            <el-menu-item index="/settings/feishu">飞书配置</el-menu-item>
            <el-menu-item index="/settings/sync">同步配置</el-menu-item>
            <el-menu-item index="/settings/notify">通知配置</el-menu-item>
            <el-menu-item index="/settings/backup">数据备份</el-menu-item>
          </el-sub-menu>
        </template>

        <!-- 默认菜单（未识别角色） -->
        <template v-else>
          <el-menu-item index="/dashboard">
            <el-icon><DataAnalysis /></el-icon>
            <span>数据总览</span>
          </el-menu-item>
        </template>
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
                <el-dropdown-item @click="$router.push('/settings/profile')">个人设置</el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
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

function handleLogout() {
  authStore.logout()
  router.push('/login')
}

onMounted(() => {
  // 从 localStorage 恢复登录状态
  const token = localStorage.getItem('auth_token')
  const storedUser = localStorage.getItem('auth_user')
  console.log('MainLayout onMounted - token:', token?.substring(0, 10))
  console.log('MainLayout onMounted - storedUser:', storedUser?.substring(0, 50))
  if (!token || !storedUser) {
    console.log('MainLayout: 未登录，跳转登录页')
    router.push('/login')
  } else {
    // 恢复 store 状态
    try {
      const user = JSON.parse(storedUser)
      // 如果 store 中没有用户信息，或者用户信息不完整，重新设置
      if (!authStore.isLoggedIn || !authStore.user?.role) {
        authStore.setUser(user)
      }
    } catch (e) {
      console.error('解析用户信息失败', e)
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

.role-tag {
  display: inline-block;
  margin-top: 8px;
  padding: 2px 8px;
  background: rgba(24, 144, 255, 0.2);
  color: #1890ff;
  border-radius: 4px;
  font-size: 11px;
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
