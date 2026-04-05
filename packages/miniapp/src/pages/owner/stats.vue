<template>
  <view class="container">
    <!-- 时间段切换 -->
    <view class="period-tabs">
      <view v-for="p in periods" :key="p.key" class="period-tab" :class="{ active: activePeriod === p.key }" @tap="switchPeriod(p.key)">
        <text class="period-text">{{ p.label }}</text>
      </view>
    </view>

    <!-- 日期选择器（自定义） -->
    <view class="date-picker-row">
      <text class="date-arrow" @tap="shiftDate(-1)">‹</text>
      <text class="date-label">{{ displayDateRange }}</text>
      <text class="date-arrow" @tap="shiftDate(1)">›</text>
    </view>

    <!-- 核心数据卡片 -->
    <view class="revenue-card">
      <text class="revenue-amount">¥{{ totalYuan }}</text>
      <text class="revenue-label">总营收</text>
    </view>

    <view class="stats-grid">
      <view class="stat-item">
        <text class="stat-val">{{ statsData.appointmentCount || 0 }}</text>
        <text class="stat-lbl">预约数</text>
      </view>
      <view class="stat-item">
        <text class="stat-val">{{ statsData.completedCount || 0 }}</text>
        <text class="stat-lbl">完成数</text>
      </view>
      <view class="stat-item">
        <text class="stat-val">¥{{ avgYuan }}</text>
        <text class="stat-lbl">客单价</text>
      </view>
      <view class="stat-item">
        <text class="stat-val">{{ statsData.cancelCount || 0 }}</text>
        <text class="stat-lbl">取消数</text>
      </view>
    </view>

    <!-- 服务项目营收排行 -->
    <view class="section">
      <text class="section-title">服务项目排行</text>
      <view v-if="serviceRanking.length === 0" class="empty-box">
        <text class="empty-text">暂无数据</text>
      </view>
      <view v-for="(item, idx) in serviceRanking" :key="item.service_name" class="rank-row">
        <view class="rank-badge" :class="{ top3: idx < 3 }">
          <text class="rank-num">{{ idx + 1 }}</text>
        </view>
        <view class="rank-info">
          <text class="rank-name">{{ item.service_name }}</text>
          <text class="rank-detail">{{ item.count }} 次</text>
        </view>
        <text class="rank-amount">¥{{ (item.amount / 100).toFixed(0) }}</text>
      </view>
    </view>

    <!-- 每日营收趋势（简单柱状） -->
    <view class="section" v-if="dailyData.length > 1">
      <text class="section-title">每日营收趋势</text>
      <scroll-view scroll-x class="chart-scroll">
        <view class="chart-area">
          <view v-for="d in dailyData" :key="d.date" class="chart-bar-wrap">
            <view class="chart-bar" :style="{ height: barHeight(d.amount) }">
              <text class="chart-val">¥{{ (d.amount / 100).toFixed(0) }}</text>
            </view>
            <text class="chart-label">{{ shortDate(d.date) }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <view style="height: 40rpx;"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { statsApi } from '@/api/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const activePeriod = ref<'day' | 'week' | 'month'>('week')
const weekOffset = ref(0)

const periods = [
  { key: 'day' as const, label: '日' },
  { key: 'week' as const, label: '周' },
  { key: 'month' as const, label: '月' },
]

const statsData = ref<any>({})
const serviceRanking = ref<any[]>([])
const dailyData = ref<any[]>([])

const totalYuan = computed(() => ((statsData.value.totalRevenue || 0) / 100).toFixed(2))
const avgYuan = computed(() => {
  const count = statsData.value.completedCount || 0
  if (count === 0) return '0'
  return ((statsData.value.totalRevenue || 0) / count / 100).toFixed(0)
})

function getDateRange(): { start: string; end: string } {
  const now = new Date()
  if (activePeriod.value === 'day') {
    const d = formatDate(now)
    return { start: d, end: d }
  }
  if (activePeriod.value === 'week') {
    const day = now.getDay() || 7
    const start = new Date(now)
    start.setDate(start.getDate() - day + 1 + weekOffset.value * 7)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    return { start: formatDate(start), end: formatDate(end) }
  }
  const start = new Date(now.getFullYear(), now.getMonth() + weekOffset.value, 1)
  const end = new Date(start.getFullYear(), start.getMonth() + 1, 0)
  return { start: formatDate(start), end: formatDate(end) }
}

const displayDateRange = computed(() => {
  const r = getDateRange()
  return r.start === r.end ? r.start : `${r.start} ~ ${r.end}`
})

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function shortDate(dateStr: string): string {
  const parts = dateStr.split('-')
  return `${parseInt(parts[1])}/${parseInt(parts[2])}`
}

function switchPeriod(key: 'day' | 'week' | 'month') {
  activePeriod.value = key
  weekOffset.value = 0
  loadData()
}

function shiftDate(dir: number) {
  if (dir > 0 && activePeriod.value === 'day') return
  weekOffset.value += dir
  loadData()
}

function barHeight(amount: number): string {
  const max = Math.max(...dailyData.value.map(d => d.amount), 1)
  const pct = Math.round((amount / max) * 100)
  return `${Math.max(pct, 8)}%`
}

async function loadData() {
  const mid = userStore.userInfo.merchantId
  if (!mid) return
  const { start, end } = getDateRange()
  try {
    const data = await statsApi.getRevenueStats({ merchant_id: mid, start_date: start, end_date: end }) as any
    statsData.value = data?.summary || {}
    serviceRanking.value = data?.serviceRanking || []
    dailyData.value = data?.daily || []
  } catch {
    statsData.value = {}
    serviceRanking.value = []
    dailyData.value = []
  }
}

onShow(() => {
  weekOffset.value = 0
  loadData()
})
</script>

<style scoped>
.container { min-height: 100vh; background: var(--color-bg, #F5F5F5); padding: 30rpx; }

.period-tabs { display: flex; gap: 16rpx; margin-bottom: 24rpx; }
.period-tab { flex: 1; padding: 16rpx 0; border-radius: 10rpx; text-align: center; background: #fff; }
.period-tab.active { background: #000; }
.period-text { font-size: 26rpx; color: #1A1A1A; }
.period-tab.active .period-text { color: #fff; }

.date-picker-row { display: flex; align-items: center; justify-content: center; gap: 30rpx; margin-bottom: 30rpx; }
.date-arrow { font-size: 40rpx; color: #999; padding: 10rpx 20rpx; }
.date-label { font-size: 28rpx; font-weight: 600; color: #1A1A1A; }

.revenue-card { background: #000; border-radius: 20rpx; padding: 40rpx; text-align: center; margin-bottom: 24rpx; }
.revenue-amount { font-size: 52rpx; font-weight: 700; color: #fff; display: block; margin-bottom: 8rpx; }
.revenue-label { font-size: 24rpx; color: #ffffff99; }

.stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12rpx; margin-bottom: 30rpx; }
.stat-item { background: #fff; border-radius: 14rpx; padding: 20rpx 0; text-align: center; }
.stat-val { font-size: 32rpx; font-weight: 700; color: #1A1A1A; display: block; margin-bottom: 4rpx; }
.stat-lbl { font-size: 22rpx; color: #999; }

.section { margin-bottom: 30rpx; background: #fff; border-radius: 16rpx; padding: 24rpx; }
.section-title { font-size: 30rpx; font-weight: 700; color: #1A1A1A; display: block; margin-bottom: 20rpx; }

.empty-box { text-align: center; padding: 40rpx; }
.empty-text { font-size: 26rpx; color: #999; }

.rank-row { display: flex; align-items: center; padding: 16rpx 0; border-bottom: 1rpx solid #F5F5F5; }
.rank-row:last-child { border-bottom: none; }
.rank-badge { width: 40rpx; height: 40rpx; border-radius: 50%; background: #F0F0F0; display: flex; align-items: center; justify-content: center; margin-right: 16rpx; flex-shrink: 0; }
.rank-badge.top3 { background: #000; }
.rank-num { font-size: 22rpx; color: #999; font-weight: 600; }
.rank-badge.top3 .rank-num { color: #fff; }
.rank-info { flex: 1; min-width: 0; }
.rank-name { font-size: 28rpx; color: #1A1A1A; display: block; margin-bottom: 2rpx; }
.rank-detail { font-size: 22rpx; color: #999; }
.rank-amount { font-size: 28rpx; font-weight: 600; color: #1A1A1A; }

.chart-scroll { width: 100%; white-space: nowrap; }
.chart-area { display: inline-flex; align-items: flex-end; gap: 16rpx; padding: 20rpx 0; height: 300rpx; }
.chart-bar-wrap { display: flex; flex-direction: column; align-items: center; width: 60rpx; }
.chart-bar { background: #000; border-radius: 8rpx 8rpx 0 0; min-height: 30rpx; width: 100%; display: flex; align-items: flex-start; justify-content: center; }
.chart-val { font-size: 18rpx; color: #fff; padding-top: 4rpx; white-space: nowrap; }
.chart-label { font-size: 20rpx; color: #999; margin-top: 8rpx; white-space: nowrap; }
</style>
