<template>
  <view class="container">
    <!-- 门店信息头部 -->
    <view class="header">
      <view class="header-bg"></view>
      <view class="header-content">
        <view class="store-info">
          <text class="store-name">{{ merchant.name || '美发工作室' }}</text>
          <view class="store-meta">
            <text class="store-address" v-if="merchant.address">{{ merchant.address }}</text>
            <text class="store-sep" v-if="merchant.address">·</text>
            <text class="store-hours" :class="{ closed: !isBusinessOpen }">
              {{ isBusinessOpen ? `营业中 ${merchant.business_hours?.start || '09:00'}-${effectiveEndTime}` : '已打烊' }}
            </text>
          </view>
        </view>
        <text class="store-phone" v-if="merchant.phone" @tap="callStore">{{ merchant.phone }}</text>
      </view>
    </view>

    <!-- 今日空档快览 -->
    <view class="slots-preview" v-if="todaySlots.length > 0">
      <view class="section-header">
        <text class="section-title">今日空档</text>
        <text class="section-more" @tap="goBooking('')">查看更多</text>
      </view>
      <scroll-view scroll-x class="slots-scroll">
        <view class="slot-chip" v-for="slot in todaySlots.slice(0, 8)" :key="slot.start" @tap="quickBook(slot)">
          <text class="slot-text">{{ slot.start }}</text>
        </view>
      </scroll-view>
    </view>

    <!-- 打烊提示 -->
    <view class="closed-notice" v-if="todayClosed">
      <text class="closed-text">今日打烊，暂不可预约</text>
    </view>

    <!-- 服务项目列表 -->
    <view class="service-list">
      <text class="section-title">预约项目</text>
      <view v-if="services.length === 0" class="loading-state">
        <text class="loading-text">加载中...</text>
      </view>
      <view v-else>
        <view
          v-for="service in services"
          :key="service.service_id"
          class="service-card"
          @tap="onServiceTap(service)"
        >
          <view class="service-main">
            <view class="service-name-row">
              <text class="service-name">{{ service.name }}</text>
              <view v-if="isHot(service)" class="hot-tag">HOT</view>
            </view>
            <text class="service-desc">{{ service.description || getCategoryLabel(service.category) }}</text>
            <text class="service-duration">{{ service.total_duration }}分钟</text>
          </view>
          <view class="service-right">
            <text class="service-price">¥{{ formatPrice(service.price) }}</text>
            <view class="btn-book">预约</view>
          </view>
        </view>
      </view>
    </view>

    <!-- 底部安全区域 -->
    <view style="height: 120rpx;"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onShow } from 'vue'
import { onPullDownRefresh } from '@dcloudio/uni-app'
import { serviceApi, appointmentApi, merchantApi } from '@/api/request'
import { useUserStore } from '@/stores/user'
import { useMerchantStore } from '@/stores/merchant'

const userStore = useUserStore()
const merchantStore = useMerchantStore()

// 当前商户 ID（Phase 1 默认使用第一个活跃商户）
const DEFAULT_MERCHANT_ID = 'M_default'

const merchant = ref({
  merchant_id: '',
  name: '',
  address: '',
  phone: '',
  business_hours: { start: '09:00', end: '21:00' },
  status: 'active',
})
const services = ref<any[]>([])
const todaySlots = ref<any[]>([])
const todayClosed = ref(false)

// 计算有效结束时间（简化版，前端只展示默认时间）
const effectiveEndTime = computed(() => merchant.value.business_hours?.end || '21:00')

// 判断当前是否营业
const isBusinessOpen = computed(() => {
  const now = new Date()
  const h = now.getHours()
  const m = now.getMinutes()
  const minutes = h * 60 + m
  const start = merchant.value.business_hours?.start || '09:00'
  const end = effectiveEndTime.value
  const startMin = parseInt(start.split(':')[0]) * 60 + parseInt(start.split(':')[1])
  const endMin = parseInt(end.split(':')[0]) * 60 + parseInt(end.split(':')[1])
  return minutes >= startMin && minutes < endMin
})

// 判断是否热门服务
function isHot(service: any): boolean {
  return ['cut', 'dye'].includes(service.category) && service.price >= 3000
}

// 分类标签
function getCategoryLabel(category: string): string {
  const map: Record<string, string> = { cut: '剪发', perm: '烫发', dye: '染发', care: '养护' }
  return map[category] || ''
}

// 分转元
function formatPrice(fen: number): string {
  return (fen / 100).toFixed(0)
}

// 拨打店铺电话
function callStore() {
  uni.makePhoneCall({ phoneNumber: merchant.value.phone })
}

// 点击服务卡片
function onServiceTap(service: any) {
  goBooking(service.service_id)
}

// 快速预约
function quickBook(slot: any) {
  goBooking('')
}

// 跳转预约页
function goBooking(serviceId: string) {
  uni.navigateTo({
    url: `/pages/booking/create?serviceId=${serviceId}&merchantId=${merchant.value.merchant_id}`,
  })
}

// 加载商户信息
async function loadMerchant() {
  // 优先使用 store 中的商户信息
  if (merchantStore.merchantInfo.merchantId) {
    merchant.value = {
      merchant_id: merchantStore.merchantInfo.merchantId,
      name: merchantStore.merchantInfo.name,
      address: merchantStore.merchantInfo.address,
      phone: merchantStore.merchantInfo.phone,
      business_hours: merchantStore.merchantInfo.businessHours,
      status: merchantStore.merchantInfo.status,
    }
    return merchantStore.merchantInfo.merchantId
  }

  // 否则从 API 加载
  try {
    const merchantId = userStore.userInfo.merchantId || DEFAULT_MERCHANT_ID
    if (!merchantId || merchantId === DEFAULT_MERCHANT_ID) {
      // 未设置商户，显示默认
      return ''
    }
    const data = await merchantApi.getInfo(merchantId) as any
    merchant.value = {
      merchant_id: data.merchant_id,
      name: data.name,
      address: data.address,
      phone: data.phone,
      business_hours: data.business_hours,
      status: data.status,
    }
    merchantStore.setMerchant(data)
    return data.merchant_id
  } catch {
    return ''
  }
}

// 加载服务列表
async function loadServices(merchantId: string) {
  if (!merchantId) {
    // 没有商户ID时，使用预设服务数据作为展示
    services.value = [
      { service_id: 'preset_1', name: '儿童剪发', category: 'cut', price: 2000, total_duration: 20, description: '儿童专属剪发服务' },
      { service_id: 'preset_2', name: '男士剪发', category: 'cut', price: 3000, total_duration: 25, description: '男士精剪服务' },
      { service_id: 'preset_3', name: '女士剪发', category: 'cut', price: 5000, total_duration: 30, description: '女士精剪造型服务' },
      { service_id: 'preset_4', name: '染发', category: 'dye', price: 15000, total_duration: 80, description: '专业染发服务，含洗剪吹' },
      { service_id: 'preset_5', name: '烫发', category: 'perm', price: 20000, total_duration: 75, description: '专业烫发服务，含造型' },
    ]
    return
  }

  try {
    const data = await serviceApi.getList(merchantId) as any
    services.value = Array.isArray(data) ? data : []
  } catch {
    services.value = []
  }
}

// 加载今日空档
async function loadTodaySlots(merchantId: string) {
  if (!merchantId) return

  const today = formatDate(new Date())
  try {
    const data = await appointmentApi.getAvailableSlots({
      merchant_id: merchantId,
      date: today,
    }) as any
    if (data?.closed) {
      todayClosed.value = true
      todaySlots.value = []
    } else {
      todayClosed.value = false
      todaySlots.value = (data?.slots || []).filter((s: any) => s.available)
    }
  } catch {
    todaySlots.value = []
  }
}

function formatDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// 页面加载
onShow(() => {
  loadPageData()
})

// 下拉刷新
onPullDownRefresh(async () => {
  await loadPageData()
  uni.stopPullDownRefresh()
})

async function loadPageData() {
  const merchantId = await loadMerchant()
  await Promise.all([
    loadServices(merchantId),
    loadTodaySlots(merchantId),
  ])
}
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: var(--color-bg, #F5F5F5);
}

/* 头部 */
.header {
  position: relative;
  background: #000;
  padding: 80rpx 40rpx 40rpx;
  color: #fff;
  overflow: hidden;
}

.header-bg {
  position: absolute;
  top: -60rpx;
  right: -40rpx;
  width: 300rpx;
  height: 300rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.05);
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  position: relative;
  z-index: 1;
}

.store-name {
  font-size: 40rpx;
  font-weight: 700;
  display: block;
  margin-bottom: 12rpx;
}

.store-meta {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8rpx;
}

.store-address, .store-hours, .store-sep {
  font-size: 24rpx;
  opacity: 0.8;
}

.store-hours.closed {
  color: #FF6B6B;
  opacity: 1;
}

.store-phone {
  font-size: 24rpx;
  padding: 10rpx 20rpx;
  border: 1rpx solid rgba(255, 255, 255, 0.3);
  border-radius: 30rpx;
  opacity: 0.9;
  margin-top: 8rpx;
}

/* 今日空档 */
.slots-preview {
  background: #fff;
  padding: 24rpx 30rpx;
  margin-bottom: 20rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1A1A1A;
}

.section-more {
  font-size: 24rpx;
  color: #999;
}

.slots-scroll {
  white-space: nowrap;
}

.slot-chip {
  display: inline-block;
  background: #F5F5F5;
  border-radius: 12rpx;
  padding: 12rpx 24rpx;
  margin-right: 16rpx;
}

.slot-text {
  font-size: 26rpx;
  color: #1A1A1A;
  font-weight: 500;
}

/* 打烊提示 */
.closed-notice {
  background: #FFF5E6;
  padding: 24rpx 30rpx;
  margin-bottom: 20rpx;
  text-align: center;
}

.closed-text {
  font-size: 28rpx;
  color: #FF9500;
}

/* 服务列表 */
.service-list {
  padding: 0 30rpx;
}

.service-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.service-main {
  flex: 1;
  min-width: 0;
}

.service-name-row {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 8rpx;
}

.service-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #1A1A1A;
}

.hot-tag {
  background: #000;
  color: #fff;
  font-size: 18rpx;
  padding: 2rpx 12rpx;
  border-radius: 6rpx;
  font-weight: 600;
}

.service-desc {
  font-size: 24rpx;
  color: #999;
  display: block;
  margin-bottom: 4rpx;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.service-duration {
  font-size: 22rpx;
  color: #BBB;
}

.service-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-left: 20rpx;
}

.service-price {
  font-size: 34rpx;
  font-weight: 700;
  color: #1A1A1A;
  margin-bottom: 12rpx;
}

.btn-book {
  background: #000;
  color: #fff;
  font-size: 22rpx;
  padding: 8rpx 24rpx;
  border-radius: 24rpx;
  font-weight: 500;
}

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: 60rpx 0;
}

.loading-text {
  font-size: 28rpx;
  color: #999;
}
</style>
