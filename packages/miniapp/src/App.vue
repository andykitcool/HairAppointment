<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { authApi } from '@/api/request'
import { useUserStore } from '@/stores/user'

onLaunch(() => {
  console.log('App Launch')
  // 全局初始化
  initApp()
})

onShow(() => {
  console.log('App Show')
})

onHide(() => {
  console.log('App Hide')
})

async function initApp() {
  const userStore = useUserStore()

  // 如果本地有 token，尝试静默登录刷新
  if (userStore.token) {
    try {
      const data = await authApi.getProfile() as any
      if (data) {
        userStore.setUser(data)
      }
    } catch {
      // token 过期，清除
      userStore.logout()
    }
  } else {
    await silentWechatLogin()
  }

  // 获取系统信息
  const systemInfo = uni.getSystemInfoSync()
  console.log('System Info:', systemInfo.platform, systemInfo.system)
}

async function silentWechatLogin() {
  const userStore = useUserStore()
  try {
    const loginRes = await uni.login({ provider: 'weixin' })
    if (!loginRes?.code) {
      return
    }
    const data = await authApi.wechatLogin(loginRes.code) as any
    if (data?.token && data?.user) {
      userStore.setToken(data.token)
      userStore.setUser(data.user)
    }
  } catch {
    // 静默登录失败不阻塞应用启动，页面会按未登录态处理
  }
}
</script>

<style>
/* 全局样式 - 黑白极简风 */
page {
  background-color: #F5F5F5;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
  color: #1A1A1A;
  font-size: 28rpx;
  line-height: 1.5;
}

/* CSS 变量 */
page {
  --color-primary: #000000;
  --color-bg: #F5F5F5;
  --color-card: #FFFFFF;
  --color-text: #1A1A1A;
  --color-text-secondary: #666666;
  --color-text-hint: #999999;
  --color-success: #07C160;
  --color-danger: #FA5151;
  --color-warning: #FF9500;
  --radius-card: 20rpx;
  --radius-button: 48rpx;
  --radius-tag: 8rpx;
}

/* 全局重置 */
view, text, image, scroll-view, swiper, button, input, textarea {
  box-sizing: border-box;
}

button {
  margin: 0;
  padding: 0;
  background: none;
  line-height: inherit;
}

button::after {
  border: none;
}

/* 全局通用类 */
.flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
