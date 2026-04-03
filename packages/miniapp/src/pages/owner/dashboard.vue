<template>
  <view class="container">
    <!-- 今日概览头部 -->
    <view class="overview-header">
      <text class="header-date">{{ todayLabel }}</text>
      <text class="header-shop">{{ merchantName }}</text>
    </view>

    <!-- 核心指标卡片 -->
    <view class="stats-grid">
      <view class="stat-card">
        <text class="stat-num">{{ todayStats.appointments || 0 }}</text>
        <text class="stat-label">今日预约</text>
      </view>
      <view class="stat-card">
        <text class="stat-num">{{ pendingCount }}</text>
        <text class="stat-label">待确认</text>
      </view>
      <view class="stat-card">
        <text class="stat-num">¥{{ formatMoney(todayStats.revenue || 0) }}</text>
        <text class="stat-label">今日营收</text>
      </view>
      <view class="stat-card">
        <text class="stat-num">{{ completedCount }}</text>
        <text class="stat-label">已完成</text>
      </view>
    </view>

    <!-- 待处理事项 -->
    <view class="section">
      <text class="section-title">待处理</text>
      <view v-if="pendingList.length === 0" class="empty-row">
        <text class="empty-text">暂无待处理事项</text>
      </view>
      <view v-for="item in pendingList.slice(0, 5)" :key="item.appointment_id" class="todo-card" @tap="goAppointment">
        <view class="todo-info">
          <text class="todo-name">{{ item.customer_name }}</text>
          <text class="todo-detail">{{ item.service_name }} · {{ item.start_time }}</text>
        </view>
        <view class="todo-actions">
          <button class="btn-sm btn-confirm" @tap.stop="confirmApt(item)">确认</button>
          <button class="btn-sm btn-cancel" @tap.stop="cancelApt(item)">取消</button>
        </view>
      </view>
    </view>

    <!-- 今日预约流水 -->
    <view class="section">
      <view class="section-header">
        <text class="section-title">今日预约</text>
        <text class="section-more" @tap="goAllAppointments">全部</text>
      </view>
      <view v-if="todayList.length === 0" class="empty-row">
        <text class="empty-text">暂无预约</text>
      </view>
      <view v-for="item in todayList" :key="item.appointment_id" class="apt-row">
        <view class="apt-time">
          <text class="apt-start">{{ item.start_time }}</text>
          <text class="apt-end">{{ item.end_time }}</text>
        </view>
        <view class="apt-divider"></view>
        <view class="apt-info">
          <text class="apt-name">{{ item.customer_name }}</text>
          <text class="apt-service">{{ item.service_name }}</text>
        </view>
        <text class="status-dot" :class="item.status"></text>
      </view>
    </view>

    <view style="height: 40rpx;"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onShow } from 'vue'
import { appointmentApi, statsApi } from '@/api/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const merchantName = computed(() => userStore.userInfo.nickname || '我的店铺')

const todayStats = ref({ appointments: 0, revenue: 0 })
const todayList = ref<any[]>([])

const todayLabel = computed(() => {
  const d = new Date()
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`
})

const pendingList = computed(() => todayList.value.filter(i => i.status === 'pending'))
const pendingCount = computed(() => pendingList.value.length)
const completedCount = computed(() => todayList.value.filter(i => i.status === 'completed').length)

function formatMoney(fen: number): string {
  return (fen / 100).toFixed(0)
}

function formatDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

async function loadData() {
  const today = formatDateStr(new Date())
  const mid = userStore.userInfo.merchantId
  if (!mid) return

  try {
    const [aptData, statsData] = await Promise.all([
      appointmentApi.getList({ merchant_id: mid, date: today, pageSize: 50 }),
      statsApi.getRevenueStats({ merchant_id: mid, start_date: today, end_date: today }),
    ]) as any[]

    todayList.value = aptData?.list || (Array.isArray(aptData) ? aptData : [])
    todayStats.value = statsData || { appointments: 0, revenue: 0 }
  } catch {
    todayList.value = []
  }
}

async function confirmApt(item: any) {
  try {
    await appointmentApi.confirm(item.appointment_id)
    uni.showToast({ title: '已确认', icon: 'success' })
    await loadData()
  } catch (err: any) {
    uni.showToast({ title: err.message || '操作失败', icon: 'none' })
  }
}

async function cancelApt(item: any) {
  uni.showModal({
    title: '确认取消',
    content: `取消 ${item.customer_name} 的 ${item.service_name} 预约？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await appointmentApi.cancel(item.appointment_id)
          uni.showToast({ title: '已取消', icon: 'success' })
          await loadData()
        } catch (err: any) {
          uni.showToast({ title: err.message || '取消失败', icon: 'none' })
        }
      }
    },
  })
}

function goAppointment() {}
function goAllAppointments() {
  uni.navigateTo({ url: '/pages/owner/appointments' })
}

onShow(() => loadData())
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: var(--color-bg, #F5F5F5);
  padding: 30rpx;
}

.overview-header {
  margin-bottom: 30rpx;
}

.header-date {
  font-size: 34rpx;
  font-weight: 700;
  color: #1A1A1A;
  display: block;
  margin-bottom: 4rpx;
}

.header-shop {
  font-size: 26rpx;
  color: #999;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16rpx;
  margin-bottom: 30rpx;
}

.stat-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  text-align: center;
}

.stat-num {
  font-size: 40rpx;
  font-weight: 700;
  color: #1A1A1A;
  display: block;
  margin-bottom: 6rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #999;
}

.section {
  margin-bottom: 30rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1A1A1A;
  display: block;
  margin-bottom: 16rpx;
}

.section-more {
  font-size: 24rpx;
  color: #999;
}

.empty-row {
  background: #fff;
  border-radius: 16rpx;
  padding: 40rpx;
  text-align: center;
}

.empty-text {
  font-size: 26rpx;
  color: #999;
}

.todo-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 12rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.todo-info {
  flex: 1;
  min-width: 0;
}

.todo-name {
  font-size: 28rpx;
  font-weight: 600;
  color: #1A1A1A;
  display: block;
  margin-bottom: 4rpx;
}

.todo-detail {
  font-size: 24rpx;
  color: #999;
}

.todo-actions {
  display: flex;
  gap: 12rpx;
}

.btn-sm {
  font-size: 22rpx;
  padding: 8rpx 20rpx;
  border-radius: 8rpx;
  line-height: 1.2;
  border: none;
}

.btn-sm::after { border: none; }

.btn-confirm {
  background: #000;
  color: #fff;
}

.btn-cancel {
  background: none;
  color: #FA5151;
  border: 1rpx solid #FA5151;
}

.apt-row {
  background: #fff;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
  margin-bottom: 10rpx;
  display: flex;
  align-items: center;
}

.apt-time {
  width: 100rpx;
  text-align: center;
}

.apt-start {
  font-size: 28rpx;
  font-weight: 600;
  color: #1A1A1A;
  display: block;
}

.apt-end {
  font-size: 22rpx;
  color: #999;
}

.apt-divider {
  width: 2rpx;
  height: 60rpx;
  background: #F0F0F0;
  margin: 0 20rpx;
}

.apt-info {
  flex: 1;
  min-width: 0;
}

.apt-name {
  font-size: 26rpx;
  font-weight: 500;
  color: #1A1A1A;
  display: block;
  margin-bottom: 4rpx;
}

.apt-service {
  font-size: 22rpx;
  color: #999;
}

.status-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-dot.pending { background: #FF9500; }
.status-dot.confirmed { background: #07C160; }
.status-dot.in_progress { background: #1677FF; }
.status-dot.completed { background: #E0E0E0; }
.status-dot.cancelled { background: #CCC; }
.status-dot.no_show { background: #FA5151; }
</style>
