<template>
  <view class="container">
    <!-- 状态筛选 Tab -->
    <view class="tabs">
      <scroll-view scroll-x class="tabs-scroll">
        <view
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-item"
          :class="{ active: currentTab === tab.key }"
          @tap="switchTab(tab.key)"
        >
          <text class="tab-text">{{ tab.label }}</text>
          <view v-if="tab.count > 0" class="tab-badge">{{ tab.count > 99 ? '99+' : tab.count }}</view>
          <view v-if="currentTab === tab.key" class="tab-underline"></view>
        </view>
      </scroll-view>
    </view>

    <!-- 空状态 -->
    <view v-if="!loading && filteredList.length === 0" class="empty-state">
      <view class="empty-icon-wrap">
        <text class="empty-icon-text">📋</text>
      </view>
      <text class="empty-text">{{ currentTab === 'all' ? '暂无预约记录' : `暂无${currentTabLabel}` }}</text>
      <button v-if="currentTab !== 'completed' && currentTab !== 'cancelled'" class="btn-empty" @tap="goBooking">
        去预约
      </button>
    </view>

    <!-- 加载状态 -->
    <view v-if="loading" class="loading-state">
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 预约列表 -->
    <view v-if="!loading && filteredList.length > 0" class="appointment-list">
      <view
        v-for="item in filteredList"
        :key="item._id || item.appointment_id"
        class="appointment-card"
        @tap="toggleExpand(item)"
      >
        <!-- 卡片头部 -->
        <view class="card-header">
          <text class="service-name">{{ item.service_name }}</text>
          <text class="status-tag" :class="item.status">{{ statusMap[item.status] || item.status }}</text>
        </view>

        <!-- 基本信息 -->
        <view class="card-body">
          <view class="info-row">
            <text class="info-label">预约编号</text>
            <text class="info-value mono">{{ item.appointment_id }}</text>
          </view>
          <view class="info-row">
            <text class="info-label">预约时间</text>
            <text class="info-value">{{ item.date }} {{ item.start_time }}-{{ item.end_time }}</text>
          </view>
        </view>

        <!-- 展开详情 -->
        <view v-if="expandedId === (item._id || item.appointment_id)" class="card-detail">
          <view class="detail-row">
            <text class="detail-label">发型师</text>
            <text class="detail-value">{{ item.staff_name }}</text>
          </view>
          <view v-if="item.note" class="detail-row">
            <text class="detail-label">备注</text>
            <text class="detail-value">{{ item.note }}</text>
          </view>
          <view v-if="item.timeline && item.timeline.length > 0" class="timeline-section">
            <text class="detail-label">服务阶段</text>
            <view class="timeline-list">
              <view v-for="(stage, idx) in item.timeline" :key="idx" class="timeline-item">
                <view class="timeline-dot" :class="{ busy: stage.staff_busy }"></view>
                <text class="timeline-name">{{ stage.stage_name }}</text>
                <text class="timeline-time">{{ stage.start }}-{{ stage.end }}</text>
              </view>
            </view>
          </view>

          <!-- 操作按钮 -->
          <view v-if="canCancel(item)" class="card-actions">
            <button class="btn-cancel" @tap.stop="onCancel(item)">取消预约</button>
          </view>
        </view>

        <!-- 展开/收起箭头 -->
        <view class="expand-arrow">
          <text class="arrow-text">{{ expandedId === (item._id || item.appointment_id) ? '收起' : '详情' }}</text>
        </view>
      </view>
    </view>

    <!-- 底部安全区域 -->
    <view style="height: 120rpx;"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onPullDownRefresh, onShow } from '@dcloudio/uni-app'
import { appointmentApi, authApi } from '@/api/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

const currentTab = ref('pending')
const loading = ref(false)
const expandedId = ref('')

const tabs = ref([
  { key: 'pending', label: '待确认', count: 0 },
  { key: 'confirmed', label: '已确认', count: 0 },
  { key: 'completed', label: '已完成', count: 0 },
  { key: 'cancelled', label: '已取消', count: 0 },
])

const statusMap: Record<string, string> = {
  pending: '待确认',
  confirmed: '已确认',
  in_progress: '服务中',
  completed: '已完成',
  cancelled: '已取消',
  no_show: '未到店',
}

const appointmentList = ref<any[]>([])

const currentTabLabel = computed(() => {
  const tab = tabs.value.find(t => t.key === currentTab.value)
  return tab?.label || ''
})

const filteredList = computed(() => {
  return appointmentList.value.filter(i => i.status === currentTab.value)
})

async function ensureLogin() {
  if (userStore.isLoggedIn && userStore.token) {
    return true
  }

  try {
    const loginRes = await uni.login({ provider: 'weixin' })
    if (!loginRes?.code) {
      return false
    }
    const data = await authApi.wechatLogin(loginRes.code) as any
    if (data?.token && data?.user) {
      userStore.setToken(data.token)
      userStore.setUser(data.user)
      return true
    }
    return false
  } catch {
    return false
  }
}

// 判断是否可以取消
function canCancel(item: any): boolean {
  return ['pending', 'confirmed'].includes(item.status)
}

// 切换 Tab
function switchTab(key: string) {
  currentTab.value = key
}

// 展开/收起
function toggleExpand(item: any) {
  const id = item._id || item.appointment_id
  expandedId.value = expandedId.value === id ? '' : id
}

// 加载预约列表
async function loadAppointments() {
  loading.value = true
  try {
    const data = await appointmentApi.getList({ pageSize: 50 }) as any
    const list = data?.list || (Array.isArray(data) ? data : [])
    appointmentList.value = list

    // 更新 Tab 计数
    tabs.value = tabs.value.map(tab => ({
      ...tab,
      count: list.filter((i: any) => i.status === tab.key).length,
    }))
  } catch {
    appointmentList.value = []
  } finally {
    loading.value = false
  }
}

// 取消预约
async function onCancel(item: any) {
  uni.showModal({
    title: '确认取消',
    content: `确定要取消预约「${item.service_name}」吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          const id = item.appointment_id || item._id
          await appointmentApi.cancel(id)
          uni.showToast({ title: '已取消', icon: 'success' })
          await loadAppointments()
        } catch (err: any) {
          uni.showToast({ title: err.message || '取消失败', icon: 'none' })
        }
      }
    },
  })
}

// 去预约
function goBooking() {
  uni.switchTab({ url: '/pages/index/index' })
}

onShow(async () => {
  const ok = await ensureLogin()
  if (!ok) {
    appointmentList.value = []
    return
  }
  loadAppointments()
})

onPullDownRefresh(async () => {
  await loadAppointments()
  uni.stopPullDownRefresh()
})
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: var(--color-bg, #F5F5F5);
}

/* Tab 筛选 */
.tabs {
  background: #fff;
}

.tabs-scroll {
  white-space: nowrap;
}

.tab-item {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  padding: 24rpx 32rpx;
  position: relative;
  min-width: 140rpx;
}

.tab-text {
  font-size: 28rpx;
  color: #999;
}

.tab-item.active .tab-text {
  color: #000;
  font-weight: 600;
}

.tab-badge {
  position: absolute;
  top: 12rpx;
  right: 12rpx;
  background: #FA5151;
  color: #fff;
  font-size: 20rpx;
  min-width: 32rpx;
  height: 32rpx;
  border-radius: 16rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8rpx;
}

.tab-underline {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 40rpx;
  height: 6rpx;
  background: #000;
  border-radius: 3rpx;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-top: 200rpx;
}

.empty-icon-wrap {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: #F0F0F0;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30rpx;
}

.empty-icon-text {
  font-size: 60rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 40rpx;
}

.btn-empty {
  background: #000;
  color: #fff;
  border: none;
  border-radius: 48rpx;
  padding: 16rpx 60rpx;
  font-size: 28rpx;
}

.btn-empty::after {
  border: none;
}

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: 120rpx 0;
}

.loading-text {
  font-size: 28rpx;
  color: #999;
}

/* 预约列表 */
.appointment-list {
  padding: 20rpx 30rpx;
}

.appointment-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  position: relative;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.service-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #1A1A1A;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-tag {
  font-size: 22rpx;
  padding: 6rpx 16rpx;
  border-radius: 8rpx;
  margin-left: 16rpx;
  white-space: nowrap;
}

.status-tag.pending { background: #FFF5E6; color: #FF9500; }
.status-tag.confirmed { background: #E6F9EE; color: #07C160; }
.status-tag.in_progress { background: #E6F0FF; color: #1677FF; }
.status-tag.completed { background: #F0F0F0; color: #999; }
.status-tag.cancelled { background: #F5F5F5; color: #CCC; }
.status-tag.no_show { background: #FFF0F0; color: #FA5151; }

.card-body {
  padding-top: 16rpx;
  border-top: 1rpx solid #F5F5F5;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8rpx;
}

.info-label {
  font-size: 26rpx;
  color: #999;
}

.info-value {
  font-size: 26rpx;
  color: #1A1A1A;
}

.info-value.mono {
  font-family: 'SF Mono', 'Menlo', monospace;
  font-size: 24rpx;
  color: #666;
}

/* 展开详情 */
.card-detail {
  padding-top: 20rpx;
  margin-top: 20rpx;
  border-top: 1rpx solid #F0F0F0;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12rpx;
}

.detail-label {
  font-size: 26rpx;
  color: #999;
}

.detail-value {
  font-size: 26rpx;
  color: #1A1A1A;
}

/* 时间线 */
.timeline-section {
  margin-top: 16rpx;
}

.timeline-list {
  margin-top: 12rpx;
  padding-left: 20rpx;
}

.timeline-item {
  display: flex;
  align-items: center;
  gap: 16rpx;
  margin-bottom: 12rpx;
}

.timeline-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #E0E0E0;
}

.timeline-dot.busy {
  background: #000;
}

.timeline-name {
  font-size: 26rpx;
  color: #1A1A1A;
  flex: 1;
}

.timeline-time {
  font-size: 24rpx;
  color: #999;
}

/* 操作按钮 */
.card-actions {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #F0F0F0;
  display: flex;
  justify-content: flex-end;
}

.btn-cancel {
  background: none;
  color: #FA5151;
  border: 2rpx solid #FA5151;
  border-radius: 48rpx;
  font-size: 26rpx;
  padding: 12rpx 36rpx;
  line-height: 1;
}

.btn-cancel::after {
  border: none;
}

/* 展开箭头 */
.expand-arrow {
  text-align: center;
  padding-top: 16rpx;
}

.arrow-text {
  font-size: 22rpx;
  color: #CCC;
}
</style>
