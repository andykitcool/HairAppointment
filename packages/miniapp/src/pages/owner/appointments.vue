<template>
  <view class="container">
    <!-- 筛选 Tab -->
    <view class="tabs">
      <view v-for="tab in statusTabs" :key="tab.key" class="tab-item" :class="{ active: currentStatus === tab.key }" @tap="currentStatus = tab.key">
        <text class="tab-text">{{ tab.label }}</text>
      </view>
    </view>

    <!-- 日期筛选 -->
    <view class="date-filter">
      <picker mode="date" :value="filterDate" @change="onDateChange">
        <view class="date-picker">
          <text class="date-text">{{ filterDate || '选择日期' }}</text>
          <text class="date-arrow">▾</text>
        </view>
      </picker>
    </view>

    <!-- 预约列表 -->
    <view v-if="loading" class="loading-state"><text class="loading-text">加载中...</text></view>
    <view v-else-if="filteredList.length === 0" class="empty-state"><text class="empty-text">暂无预约</text></view>
    <view v-else class="apt-list">
      <view v-for="item in filteredList" :key="item.appointment_id" class="apt-card">
        <view class="card-top">
          <text class="apt-id">{{ item.appointment_id }}</text>
          <text class="status-tag" :class="item.status">{{ statusMap[item.status] }}</text>
        </view>
        <view class="card-body">
          <text class="customer-name">{{ item.customer_name }}</text>
          <text class="apt-time">{{ item.date }} {{ item.start_time }}-{{ item.end_time }}</text>
          <text class="service-text">{{ item.service_name }}</text>
          <text class="staff-text" v-if="item.staff_name">发型师：{{ item.staff_name }}</text>
        </view>
        <!-- 操作按钮 -->
        <view class="card-actions">
          <button v-if="item.status === 'pending'" class="btn-sm btn-black" @tap="onConfirm(item)">确认</button>
          <button v-if="item.status === 'confirmed'" class="btn-sm btn-black" @tap="onStart(item)">开始服务</button>
          <button v-if="['pending', 'confirmed'].includes(item.status)" class="btn-sm btn-red" @tap="onCancel(item)">取消</button>
          <button v-if="item.customer_phone" class="btn-sm btn-outline" @tap="callCustomer(item)">拨号</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onShow } from 'vue'
import { appointmentApi } from '@/api/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const currentStatus = ref('all')
const filterDate = ref('')
const loading = ref(false)
const list = ref<any[]>([])

const statusTabs = [
  { key: 'all', label: '全部' },
  { key: 'pending', label: '待确认' },
  { key: 'confirmed', label: '已确认' },
  { key: 'in_progress', label: '服务中' },
  { key: 'completed', label: '已完成' },
]

const statusMap: Record<string, string> = {
  pending: '待确认', confirmed: '已确认', in_progress: '服务中',
  completed: '已完成', cancelled: '已取消', no_show: '未到店',
}

const filteredList = computed(() => {
  if (currentStatus.value === 'all') return list.value
  return list.value.filter(i => i.status === currentStatus.value)
})

function onDateChange(e: any) {
  filterDate.value = e.detail.value
  loadData()
}

async function loadData() {
  loading.value = true
  try {
    const params: any = { merchant_id: userStore.userInfo.merchantId, pageSize: 100 }
    if (filterDate.value) params.date = filterDate.value
    const data = await appointmentApi.getList(params) as any
    list.value = data?.list || (Array.isArray(data) ? data : [])
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

async function onConfirm(item: any) {
  try {
    await appointmentApi.confirm(item.appointment_id)
    uni.showToast({ title: '已确认', icon: 'success' })
    await loadData()
  } catch (err: any) { uni.showToast({ title: err.message, icon: 'none' }) }
}

async function onStart(item: any) {
  try {
    await appointmentApi.update(item.appointment_id, { status: 'in_progress' })
    uni.showToast({ title: '服务已开始', icon: 'success' })
    await loadData()
  } catch (err: any) { uni.showToast({ title: err.message, icon: 'none' }) }
}

function onCancel(item: any) {
  uni.showModal({
    title: '确认取消', content: `取消 ${item.customer_name} 的预约？`,
    success: async (res) => {
      if (res.confirm) {
        try { await appointmentApi.cancel(item.appointment_id); uni.showToast({ title: '已取消', icon: 'success' }); await loadData() }
        catch (err: any) { uni.showToast({ title: err.message, icon: 'none' }) }
      }
    },
  })
}

function callCustomer(item: any) {
  uni.makePhoneCall({ phoneNumber: item.customer_phone })
}

onShow(() => loadData())
</script>

<style scoped>
.container { min-height: 100vh; background: var(--color-bg, #F5F5F5); padding-bottom: 40rpx; }
.tabs { display: flex; background: #fff; padding: 0 10rpx; overflow-x: auto; }
.tab-item { padding: 24rpx 24rpx; font-size: 26rpx; color: #999; white-space: nowrap; border-bottom: 4rpx solid transparent; }
.tab-item.active { color: #000; font-weight: 600; border-bottom-color: #000; }
.tab-text { font-size: 26rpx; }
.date-filter { padding: 20rpx 30rpx; }
.date-picker { display: flex; align-items: center; gap: 8rpx; background: #fff; padding: 16rpx 24rpx; border-radius: 12rpx; }
.date-text { font-size: 28rpx; color: #1A1A1A; }
.date-arrow { font-size: 24rpx; color: #999; }
.loading-state, .empty-state { text-align: center; padding: 80rpx 0; }
.loading-text, .empty-text { font-size: 28rpx; color: #999; }
.apt-list { padding: 0 30rpx; }
.apt-card { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 16rpx; }
.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.apt-id { font-size: 24rpx; color: #999; font-family: monospace; }
.status-tag { font-size: 22rpx; padding: 4rpx 14rpx; border-radius: 6rpx; }
.status-tag.pending { background: #FFF5E6; color: #FF9500; }
.status-tag.confirmed { background: #E6F9EE; color: #07C160; }
.status-tag.in_progress { background: #E6F0FF; color: #1677FF; }
.status-tag.completed { background: #F0F0F0; color: #999; }
.card-body { padding-top: 12rpx; border-top: 1rpx solid #F5F5F5; margin-bottom: 16rpx; }
.customer-name { font-size: 30rpx; font-weight: 600; color: #1A1A1A; display: block; margin-bottom: 8rpx; }
.apt-time { font-size: 26rpx; color: #666; display: block; margin-bottom: 4rpx; }
.service-text { font-size: 26rpx; color: #999; display: block; }
.staff-text { font-size: 24rpx; color: #999; display: block; margin-top: 4rpx; }
.card-actions { display: flex; gap: 12rpx; flex-wrap: wrap; }
.btn-sm { font-size: 24rpx; padding: 10rpx 24rpx; border-radius: 8rpx; line-height: 1.2; border: none; }
.btn-sm::after { border: none; }
.btn-black { background: #000; color: #fff; }
.btn-red { background: none; color: #FA5151; border: 1rpx solid #FA5151; }
.btn-outline { background: none; color: #1A1A1A; border: 1rpx solid #E0E0E0; }
</style>
