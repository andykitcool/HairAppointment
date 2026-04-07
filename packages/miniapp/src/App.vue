<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import { authApi } from '@/api/request'
import { useUserStore } from '@/stores/user'
import { useMerchantStore } from '@/stores/merchant'

let lastHandledEntryKey = ''

onLaunch((options: any) => {
  console.log('App Launch')
  // 全局初始化
  initApp()
  handleEntryRouting(options)
})

onShow((options: any) => {
  console.log('App Show')
  handleEntryRouting(options)
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

function parseQueryFromPath(path: string): Record<string, string> {
  const idx = path.indexOf('?')
  if (idx < 0) return {}
  const raw = path.slice(idx + 1)
  const out: Record<string, string> = {}
  raw.split('&').forEach((part) => {
    const [k, v] = part.split('=')
    if (k) out[decodeURIComponent(k)] = decodeURIComponent(v || '')
  })
  return out
}

function parseMerchantIdFromScene(sceneRaw: string): string {
  if (!sceneRaw) return ''
  let scene = sceneRaw
  try {
    scene = decodeURIComponent(sceneRaw)
  } catch {
    scene = sceneRaw
  }

  const params: Record<string, string> = {}
  if (scene.includes('=')) {
    scene.split('&').forEach((part) => {
      const [k, v] = part.split('=')
      if (k) params[k] = v || ''
    })
  }

  const byKey = params.merchant_id || params.mid || params.m || ''
  if (byKey) return byKey

  // 兼容 scene 直接传 merchant_id 的情况
  if (/^M[\w-]+$/.test(scene)) {
    return scene
  }
  return ''
}

function extractMerchantId(options: any): string {
  if (!options) return ''
  const q = options.query || {}
  if (q.merchant_id) return String(q.merchant_id)

  if (options.path) {
    const pathQuery = parseQueryFromPath(String(options.path))
    if (pathQuery.merchant_id) return pathQuery.merchant_id
  }

  if (q.scene) {
    const fromScene = parseMerchantIdFromScene(String(q.scene))
    if (fromScene) return fromScene
  }
  return ''
}

function handleEntryRouting(options: any) {
  const merchantId = extractMerchantId(options)
  if (!merchantId) return

  const entryKey = `${merchantId}|${options?.path || ''}|${options?.query?.scene || ''}`
  if (lastHandledEntryKey === entryKey) return
  lastHandledEntryKey = entryKey

  const merchantStore = useMerchantStore()
  merchantStore.setMerchant({ merchant_id: merchantId })

  uni.reLaunch({ url: `/pages/index/index?merchant_id=${merchantId}` })
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
