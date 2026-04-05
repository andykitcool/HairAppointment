<template>
  <view class="container">
    <!-- 发送通知 -->
    <view class="section">
      <text class="section-title">群发通知</text>
      <view class="form-section">
        <text class="form-label">接收对象</text>
        <view class="target-row">
          <view v-for="t in targets" :key="t.key" class="target-chip" :class="{ active: form.target === t.key }" @tap="form.target = t.key">
            <text class="target-text">{{ t.label }}</text>
          </view>
        </view>
      </view>
      <view class="form-section">
        <text class="form-label">通知内容</text>
        <textarea class="form-textarea" v-model="form.content" placeholder="输入要发送的通知内容..." maxlength="500" />
        <text class="char-count">{{ form.content.length }}/500</text>
      </view>
      <button class="btn-send" :class="{ disabled: !canSend }" @tap="onSend">
        发送通知
      </button>
    </view>

    <!-- 通知历史 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">发送记录</text>
      </view>
      <view v-if="historyList.length === 0" class="empty-box">
        <text class="empty-text">暂无发送记录</text>
      </view>
      <view v-for="item in historyList" :key="item._id" class="history-card">
        <view class="history-header">
          <text class="history-target">{{ getTargetLabel(item.target) }}</text>
          <text class="history-time">{{ formatTime(item.create_time) }}</text>
        </view>
        <text class="history-content">{{ item.content }}</text>
        <view class="history-footer">
          <text class="history-status" :class="item.status">{{ getStatusLabel(item.status) }}</text>
          <text class="history-count" v-if="item.sent_count">{{ item.sent_count }} 人已发送</text>
        </view>
      </view>
    </view>

    <view style="height: 40rpx;"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { notificationApi } from '@/api/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const targets = [
  { key: 'all', label: '全部顾客' },
  { key: 'recent_7d', label: '近7天到店' },
  { key: 'recent_30d', label: '近30天到店' },
  { key: 'vip', label: '消费超500元' },
]

const form = ref({
  target: 'all',
  content: '',
})

const canSend = computed(() => form.value.content.trim().length > 0)

const historyList = ref<any[]>([])

function getTargetLabel(key: string): string {
  return targets.find(t => t.key === key)?.label || key
}

function getStatusLabel(status: string): string {
  const map: Record<string, string> = { success: '发送成功', failed: '发送失败', pending: '发送中' }
  return map[status] || status
}

function formatTime(time: string): string {
  if (!time) return ''
  const d = new Date(time)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mi = String(d.getMinutes()).padStart(2, '0')
  return `${mm}-${dd} ${hh}:${mi}`
}

async function onSend() {
  if (!canSend.value) return

  uni.showModal({
    title: '确认发送',
    content: `向「${getTargetLabel(form.value.target)}」发送通知？`,
    success: async (res) => {
      if (!res.confirm) return
      uni.showLoading({ title: '发送中...' })
      try {
        await notificationApi.broadcast({
          merchant_id: userStore.userInfo.merchantId,
          target: form.value.target,
          content: form.value.content.trim(),
        })
        uni.hideLoading()
        uni.showToast({ title: '发送成功', icon: 'success' })
        form.value.content = ''
        await loadHistory()
      } catch (err: any) {
        uni.hideLoading()
        uni.showToast({ title: err.message || '发送失败', icon: 'none' })
      }
    }
  })
}

async function loadHistory() {
  const mid = userStore.userInfo.merchantId
  if (!mid) return
  try {
    const data = await notificationApi.broadcast({ merchant_id: mid, action: 'history' }) as any
    historyList.value = data?.list || []
  } catch {
    historyList.value = []
  }
}

onShow(() => loadHistory())
</script>

<style scoped>
.container { min-height: 100vh; background: var(--color-bg, #F5F5F5); padding: 30rpx; }

.section { margin-bottom: 30rpx; background: #fff; border-radius: 16rpx; padding: 24rpx; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.section-title { font-size: 30rpx; font-weight: 700; color: #1A1A1A; display: block; margin-bottom: 20rpx; }
.section-header .section-title { margin-bottom: 0; }

.form-section { margin-bottom: 24rpx; }
.form-label { font-size: 26rpx; color: #666; display: block; margin-bottom: 12rpx; }

.target-row { display: flex; gap: 12rpx; flex-wrap: wrap; }
.target-chip { padding: 12rpx 24rpx; border-radius: 20rpx; border: 2rpx solid #E0E0E0; }
.target-chip.active { border-color: #000; background: #000; }
.target-text { font-size: 24rpx; color: #333; }
.target-chip.active .target-text { color: #fff; }

.form-textarea { width: 100%; height: 200rpx; background: #F5F5F5; border-radius: 12rpx; padding: 20rpx; font-size: 28rpx; box-sizing: border-box; }
.char-count { font-size: 22rpx; color: #999; text-align: right; display: block; margin-top: 8rpx; }

.btn-send { width: 100%; height: 88rpx; background: #000; color: #fff; border-radius: 44rpx; font-size: 30rpx; font-weight: 600; border: none; margin-top: 16rpx; }
.btn-send::after { border: none; }
.btn-send.disabled { opacity: 0.4; }

.empty-box { text-align: center; padding: 40rpx; }
.empty-text { font-size: 26rpx; color: #999; }

.history-card { padding: 20rpx 0; border-bottom: 1rpx solid #F5F5F5; }
.history-card:last-child { border-bottom: none; }
.history-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10rpx; }
.history-target { font-size: 24rpx; color: #000; font-weight: 600; background: #F5F5F5; padding: 4rpx 14rpx; border-radius: 6rpx; }
.history-time { font-size: 22rpx; color: #999; }
.history-content { font-size: 26rpx; color: #333; line-height: 1.6; margin-bottom: 10rpx; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.history-footer { display: flex; justify-content: space-between; align-items: center; }
.history-status { font-size: 22rpx; }
.history-status.success { color: #07C160; }
.history-status.failed { color: #FA5151; }
.history-status.pending { color: #FF9500; }
.history-count { font-size: 22rpx; color: #999; }
</style>
