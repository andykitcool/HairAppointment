<template>
  <view class="container">
    <text class="page-title">营业设置</text>

    <!-- 营业时间 -->
    <view class="section">
      <text class="section-label">日常营业时间</text>
      <view class="time-range-row">
        <picker mode="time" :value="businessHours.start" @change="businessHours.start = $event.detail.value">
          <view class="time-btn">{{ businessHours.start }}</view>
        </picker>
        <text class="time-sep">至</text>
        <picker mode="time" :value="businessHours.end" @change="businessHours.end = $event.detail.value">
          <view class="time-btn">{{ businessHours.end }}</view>
        </picker>
      </view>
      <button class="btn-save-sm" @tap="saveBusinessHours">保存营业时间</button>
    </view>

  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { merchantApi } from '@/api/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const mid = userStore.userInfo.merchantId

const businessHours = ref({ start: '09:00', end: '21:00' })

async function loadData() {
  try {
    const data = await merchantApi.getInfo(mid) as any
    if (data?.business_hours) {
      businessHours.value = data.business_hours
    }
  } catch {}
}

async function saveBusinessHours() {
  try {
    await merchantApi.update(mid, { business_hours: businessHours.value })
    uni.showToast({ title: '已保存', icon: 'success' })
  } catch (err: any) { uni.showToast({ title: err.message, icon: 'none' }) }
}

onShow(() => loadData())
</script>

<style scoped>
.container { min-height: 100vh; background: var(--color-bg, #F5F5F5); padding: 30rpx; padding-bottom: 60rpx; }
.page-title { font-size: 34rpx; font-weight: 700; color: #1A1A1A; display: block; margin-bottom: 30rpx; }
.section { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 24rpx; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.section-header .section-label { margin-bottom: 0; }
.section-label { font-size: 28rpx; font-weight: 600; color: #1A1A1A; display: block; margin-bottom: 16rpx; }
.time-range-row { display: flex; align-items: center; gap: 20rpx; margin-bottom: 20rpx; }
.time-btn { flex: 1; background: #F5F5F5; padding: 20rpx; border-radius: 12rpx; text-align: center; font-size: 32rpx; font-weight: 600; color: #1A1A1A; }
.time-sep { font-size: 28rpx; color: #999; }
.btn-save-sm { font-size: 26rpx; background: #000; color: #fff; padding: 12rpx 28rpx; border-radius: 24rpx; border: none; align-self: flex-end; }
.btn-save-sm::after { border: none; }
</style>
