<template>
  <view class="container">
    <!-- 用户信息头部 -->
    <view class="profile-header">
      <view class="avatar-wrapper" @tap="onTapAvatar">
        <image v-if="userInfo.avatarUrl" class="avatar" :src="userInfo.avatarUrl" mode="aspectFill" />
        <view v-else class="avatar-default">
          <text class="avatar-text">{{ userInfo.nickname?.charAt(0) || '?' }}</text>
        </view>
        <view v-if="!isLoggedIn" class="login-badge">
          <text class="login-badge-text">点击登录</text>
        </view>
      </view>
      <view class="user-info">
        <text class="nickname">{{ userInfo.nickname || '微信用户' }}</text>
        <text class="phone" v-if="userInfo.phone">{{ maskPhone(userInfo.phone) }}</text>
        <text class="role-tag" v-if="userInfo.role === 'owner'">店长</text>
      </view>
    </view>

    <!-- 消费统计 -->
    <view class="stats-card">
      <view class="stat-item">
        <text class="stat-value">¥{{ formatSpending(userInfo.totalSpending || 0) }}</text>
        <text class="stat-label">累计消费</text>
      </view>
      <view class="stat-divider"></view>
      <view class="stat-item">
        <text class="stat-value">{{ userInfo.visitCount || 0 }}</text>
        <text class="stat-label">到店次数</text>
      </view>
    </view>

    <!-- 我的预约（合并原预约页核心能力） -->
    <view class="appointments-card">
      <view class="appointments-head">
        <text class="appointments-title">我的预约</text>
        <view class="appointments-tabs">
          <view
            class="appointments-tab"
            :class="{ 'appointments-tab-on': appointmentTab === 'current' }"
            @tap="appointmentTab = 'current'"
          >
            <text>当前</text>
          </view>
          <view
            class="appointments-tab"
            :class="{ 'appointments-tab-on': appointmentTab === 'history' }"
            @tap="appointmentTab = 'history'"
          >
            <text>历史</text>
          </view>
        </view>
      </view>

      <view v-if="appointmentLoading" class="appointments-status">加载中...</view>
      <view v-else-if="displayAppointments.length === 0" class="appointments-status">
        {{ appointmentTab === 'current' ? '暂无当前预约' : '暂无历史预约' }}
      </view>
      <view
        v-for="item in displayAppointments"
        :key="item._id || item.appointment_id"
        class="appointment-item"
        @tap="toggleAppointmentDetail(item)"
      >
        <view class="appointment-row">
          <text class="appointment-name">{{ item.service_name || '服务项目' }}</text>
          <text class="appointment-status">{{ statusText(item.status) }}</text>
        </view>
        <text class="appointment-time">{{ item.date }} {{ item.start_time }}-{{ item.end_time }}</text>
        <text class="appointment-id">编号 {{ item.appointment_id }}</text>

        <view v-if="isExpanded(item)" class="appointment-detail">
          <view class="detail-row">
            <text class="detail-label">发型师</text>
            <text class="detail-value">{{ item.staff_name || '待分配' }}</text>
          </view>
          <view class="detail-row" v-if="item.note">
            <text class="detail-label">备注</text>
            <text class="detail-value">{{ item.note }}</text>
          </view>
          <view v-if="item.timeline && item.timeline.length > 0" class="timeline-list">
            <view class="timeline-item" v-for="(stage, idx) in item.timeline" :key="idx">
              <view class="timeline-dot" :class="{ 'timeline-dot-busy': stage.staff_busy }"></view>
              <text class="timeline-name">{{ stage.stage_name }}</text>
              <text class="timeline-time">{{ stage.start }}-{{ stage.end }}</text>
            </view>
          </view>
        </view>

        <view class="appointment-expand-hint">
          <text class="appointment-expand-text">{{ isExpanded(item) ? '收起详情' : '查看详情' }}</text>
        </view>

        <view v-if="appointmentTab === 'history'" class="appointment-actions">
          <button class="btn-rebook" @tap.stop="rebook(item)">再次预约</button>
        </view>

        <view v-if="canCancel(item.status)" class="appointment-actions">
          <button class="btn-cancel-appointment" @tap.stop="cancelAppointment(item)">取消预约</button>
        </view>
      </view>
    </view>

    <!-- 菜单列表 -->
    <view class="menu-section">
      <view class="menu-group">
        <view class="menu-item" @tap="navigateTo('/pages/owner/dashboard')" v-if="isOwner">
          <view class="menu-left">
            <text class="menu-icon">📊</text>
            <text class="menu-text">店务总览</text>
          </view>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" v-if="!isOwner" @tap="navigateTo('/pages/owner/apply')">
          <view class="menu-left">
            <text class="menu-icon">🏪</text>
            <text class="menu-text">申请成为店长</text>
          </view>
          <text class="menu-arrow">›</text>
        </view>
      </view>

      <view class="menu-group">
        <view class="menu-item" @tap="navigateTo('/pages/owner/customers')" v-if="isOwner">
          <view class="menu-left">
            <text class="menu-icon">👥</text>
            <text class="menu-text">顾客管理</text>
          </view>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @tap="navigateTo('/pages/owner/billing')" v-if="isOwner">
          <view class="menu-left">
            <text class="menu-icon">💰</text>
            <text class="menu-text">手动记账</text>
          </view>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @tap="navigateTo('/pages/owner/stats')" v-if="isOwner">
          <view class="menu-left">
            <text class="menu-icon">📈</text>
            <text class="menu-text">营收统计</text>
          </view>
          <text class="menu-arrow">›</text>
        </view>
      </view>

      <view class="menu-group">
        <view class="menu-item" @tap="editNote">
          <view class="menu-left">
            <text class="menu-icon">📝</text>
            <text class="menu-text">我的备注</text>
          </view>
          <text class="menu-desc" v-if="userInfo.customerNote">已填写</text>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @tap="navigateTo('/pages/owner/notifications')" v-if="isOwner">
          <view class="menu-left">
            <text class="menu-icon">🔔</text>
            <text class="menu-text">消息通知</text>
          </view>
          <text class="menu-arrow">›</text>
        </view>
      </view>

      <!-- 店长专属菜单 -->
      <view class="menu-group" v-if="isOwner">
        <view class="menu-item" @tap="navigateTo('/pages/owner/appointments')">
          <view class="menu-left">
            <text class="menu-icon">📋</text>
            <text class="menu-text">预约管理</text>
          </view>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @tap="navigateTo('/pages/owner/services')">
          <view class="menu-left">
            <text class="menu-icon">✂️</text>
            <text class="menu-text">服务管理</text>
          </view>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @tap="navigateTo('/pages/owner/schedule')">
          <view class="menu-left">
            <text class="menu-icon">🕐</text>
            <text class="menu-text">营业设置</text>
          </view>
          <text class="menu-arrow">›</text>
        </view>
        <view class="menu-item" @tap="navigateTo('/pages/owner/proxy-booking')">
          <view class="menu-left">
            <text class="menu-icon">📞</text>
            <text class="menu-text">代预约</text>
          </view>
          <text class="menu-arrow">›</text>
        </view>
      </view>
    </view>

    <!-- 退出登录 -->
    <view class="logout-section" v-if="isLoggedIn">
      <button class="btn-logout" @tap="onLogout">退出登录</button>
    </view>

    <view class="dev-section">
      <view class="dev-card">
        <view class="dev-header">
          <text class="dev-title">开发环境</text>
          <text class="dev-mode">真实接口</text>
        </view>
        <view class="dev-row" @tap="editBaseUrl">
          <text class="dev-label">接口地址</text>
          <text class="dev-value">{{ apiBaseUrl }}</text>
        </view>
        <view class="dev-actions">
          <button class="btn-dev" @tap="editBaseUrl">修改地址</button>
        </view>
      </view>
    </view>

    <!-- 版本信息 -->
    <view class="version-info">
      <text class="version-text">美发预约 v1.0.0</text>
    </view>

    <view style="height: 120rpx;"></view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { authApi, appointmentApi, getApiEnv, setApiBaseUrl } from '@/api/request'
import { useMerchantStore } from '@/stores/merchant'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const merchantStore = useMerchantStore()

const isLoggedIn = computed(() => userStore.isLoggedIn)
const isOwner = computed(() => userStore.userInfo.role === 'owner')
const userInfo = computed(() => userStore.userInfo)
const apiBaseUrl = ref('')
const appointmentLoading = ref(false)
const appointmentList = ref<any[]>([])
const appointmentTab = ref<'current' | 'history'>('current')
const expandedAppointmentId = ref('')

const currentAppointments = computed(() =>
  appointmentList.value.filter((a) => ['pending', 'confirmed', 'in_progress'].includes(a.status))
)
const historyAppointments = computed(() =>
  appointmentList.value.filter((a) => ['completed', 'cancelled', 'no_show'].includes(a.status))
)
const displayAppointments = computed(() =>
  appointmentTab.value === 'current' ? currentAppointments.value : historyAppointments.value
)

function syncApiEnv() {
  const env = getApiEnv()
  apiBaseUrl.value = env.baseUrl
}

function statusText(status: string): string {
  const map: Record<string, string> = {
    pending: '待确认',
    confirmed: '已确认',
    in_progress: '服务中',
    completed: '已完成',
    cancelled: '已取消',
    no_show: '未到店',
  }
  return map[status] || status
}

function canCancel(status: string): boolean {
  return status === 'pending' || status === 'confirmed'
}

function appointmentId(item: any): string {
  return String(item?._id || item?.appointment_id || '')
}

function isExpanded(item: any): boolean {
  return expandedAppointmentId.value === appointmentId(item)
}

function toggleAppointmentDetail(item: any) {
  const id = appointmentId(item)
  if (!id) return
  expandedAppointmentId.value = expandedAppointmentId.value === id ? '' : id
}

async function loadAppointments() {
  if (!userStore.isLoggedIn) {
    appointmentList.value = []
    return
  }
  appointmentLoading.value = true
  try {
    const data = await appointmentApi.getList({ pageSize: 50 }) as any
    const list = data?.list || (Array.isArray(data) ? data : [])
    appointmentList.value = list
  } catch {
    appointmentList.value = []
  } finally {
    appointmentLoading.value = false
  }
}

function cancelAppointment(item: any) {
  uni.showModal({
    title: '确认取消',
    content: `确定取消预约「${item.service_name || ''}」吗？`,
    success: async (res) => {
      if (!res.confirm) return
      try {
        const id = item.appointment_id || item._id
        await appointmentApi.cancel(id)
        uni.showToast({ title: '已取消', icon: 'success' })
        await loadAppointments()
      } catch (err: any) {
        uni.showToast({ title: err?.message || '取消失败', icon: 'none' })
      }
    },
  })
}

function rebook(item: any) {
  const merchantId = item?.merchant_id || userStore.userInfo.merchant_id || merchantStore.merchantInfo.merchant_id
  if (!merchantId) {
    uni.showToast({ title: '缺少门店信息', icon: 'none' })
    return
  }
  const serviceId = item?.service_id || ''
  merchantStore.setMerchant({ merchant_id: merchantId })
  const query = serviceId
    ? `merchant_id=${merchantId}&service_id=${serviceId}`
    : `merchant_id=${merchantId}`
  uni.navigateTo({ url: `/pages/index/index?${query}` })
}

// 手机号脱敏
function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone
  return phone.slice(0, 3) + '****' + phone.slice(-4)
}

// 格式化消费金额（分转元）
function formatSpending(fen: number): string {
  return (fen / 100).toFixed(0)
}

// 加载用户信息
async function loadProfile() {
  if (!userStore.isLoggedIn) {
    // 自动登录
    await autoLogin()
    return
  }
  try {
    const data = await authApi.getProfile() as any
    userStore.setUser(data)
  } catch {
    // token 过期，重新登录
    await autoLogin()
  }
}

// 自动微信登录
async function autoLogin() {
  try {
    const loginRes = await uni.login({ provider: 'weixin' })

    if (!loginRes?.code) {
      console.log('uni.login failed: missing code')
      return
    }

    const data = await authApi.wechatLogin(loginRes.code) as any
    if (data?.token && data?.user) {
      userStore.setToken(data.token)
      userStore.setUser(data.user)
    }
  } catch (err) {
    console.log('Auto login failed:', err)
  }
}

// 点击头像
function onTapAvatar() {
  if (!isLoggedIn.value) {
    autoLogin()
    return
  }
  // 更新头像/昵称
  uni.chooseMedia({
    count: 1,
    mediaType: ['image'],
    sizeType: ['compressed'],
    success: async (res) => {
      const tempFilePath = res.tempFiles[0]?.tempFilePath
      if (tempFilePath) {
        // 上传头像到服务器（后续实现上传功能）
        uni.showToast({ title: '头像更新功能开发中', icon: 'none' })
      }
    },
  })
}

// 编辑备注
function editNote() {
  if (!isLoggedIn.value) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return
  }
  uni.showModal({
    title: '我的备注',
    editable: true,
    placeholderText: '记录您的发型偏好等',
    content: userInfo.value.customerNote || '',
    success: async (res) => {
      if (res.confirm && res.content !== undefined) {
        try {
          await authApi.updateProfile({ customer_note: res.content })
          userStore.setUser({ ...userInfo.value, customerNote: res.content })
          uni.showToast({ title: '已保存', icon: 'success' })
        } catch {
          uni.showToast({ title: '保存失败', icon: 'none' })
        }
      }
    },
  })
}

// 导航
function navigateTo(url: string) {
  uni.navigateTo({ url })
}

// 退出登录
function onLogout() {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        userStore.logout()
        merchantStore.clearMerchant()
        uni.showToast({ title: '已退出', icon: 'success' })
      }
    },
  })
}

function editBaseUrl() {
  uni.showModal({
    title: '设置接口地址',
    editable: true,
    placeholderText: '例如 http://localhost:3000/api',
    content: apiBaseUrl.value,
    success: (res) => {
      if (!res.confirm || res.content === undefined) {
        return
      }
      setApiBaseUrl(res.content)
      syncApiEnv()
      uni.showToast({ title: '接口地址已更新', icon: 'success' })
    },
  })
}

onShow(() => {
  syncApiEnv()
  loadProfile()
  loadAppointments()
})
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: var(--color-bg, #F5F5F5);
}

/* 头部 */
.profile-header {
  background: #fff;
  padding: 60rpx 40rpx 40rpx;
  display: flex;
  align-items: center;
}

.avatar-wrapper {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  overflow: hidden;
  background: #F0F0F0;
  margin-right: 30rpx;
  position: relative;
  flex-shrink: 0;
}

.avatar {
  width: 100%;
  height: 100%;
}

.avatar-default {
  width: 100%;
  height: 100%;
  background: #000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.avatar-text {
  font-size: 44rpx;
  font-weight: 700;
  color: #fff;
}

.login-badge {
  position: absolute;
  bottom: -4rpx;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.6);
  border-radius: 16rpx;
  padding: 2rpx 12rpx;
}

.login-badge-text {
  font-size: 18rpx;
  color: #fff;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.nickname {
  font-size: 34rpx;
  font-weight: 700;
  color: #1A1A1A;
  display: block;
  margin-bottom: 8rpx;
}

.phone {
  font-size: 26rpx;
  color: #999;
  display: block;
  margin-bottom: 8rpx;
}

.role-tag {
  display: inline-block;
  font-size: 20rpx;
  padding: 4rpx 16rpx;
  background: #000;
  color: #fff;
  border-radius: 6rpx;
  font-weight: 600;
}

/* 统计卡片 */
.stats-card {
  display: flex;
  background: #fff;
  margin: 20rpx 30rpx;
  border-radius: 20rpx;
  padding: 30rpx 0;
}

.stat-item {
  flex: 1;
  text-align: center;
}

.stat-value {
  font-size: 36rpx;
  font-weight: 700;
  color: #1A1A1A;
  display: block;
  margin-bottom: 8rpx;
}

.stat-label {
  font-size: 24rpx;
  color: #999;
}

.stat-divider {
  width: 1rpx;
  background: #F0F0F0;
}

/* 我的预约 */
.appointments-card {
  margin: 0 30rpx 20rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 24rpx;
}

.appointments-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 18rpx;
}

.appointments-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1A1A1A;
}

.appointments-tabs {
  display: inline-flex;
  background: #F5F5F7;
  border-radius: 999rpx;
  padding: 4rpx;
}

.appointments-tab {
  min-width: 92rpx;
  height: 46rpx;
  border-radius: 999rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22rpx;
  color: #666;
}

.appointments-tab-on {
  background: #FFFFFF;
  color: #1A1A1A;
  font-weight: 600;
}

.appointments-status {
  font-size: 24rpx;
  color: #999;
  padding: 22rpx 0;
}

.appointment-item {
  border-top: 1rpx solid #F2F2F2;
  padding: 18rpx 0;
}

.appointment-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.appointment-name {
  font-size: 27rpx;
  font-weight: 600;
  color: #1A1A1A;
}

.appointment-status {
  font-size: 22rpx;
  color: #666;
}

.appointment-time {
  display: block;
  font-size: 24rpx;
  color: #666;
  margin-bottom: 4rpx;
}

.appointment-id {
  display: block;
  font-size: 22rpx;
  color: #999;
}

.appointment-detail {
  margin-top: 12rpx;
  background: #F7F8FA;
  border-radius: 14rpx;
  padding: 14rpx 16rpx;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6rpx;
}

.detail-label {
  font-size: 23rpx;
  color: #999;
}

.detail-value {
  font-size: 23rpx;
  color: #444;
  margin-left: 12rpx;
}

.timeline-list {
  margin-top: 10rpx;
}

.timeline-item {
  display: flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 8rpx;
}

.timeline-dot {
  width: 10rpx;
  height: 10rpx;
  border-radius: 50%;
  background: #ccc;
}

.timeline-dot-busy {
  background: #34C759;
}

.timeline-name {
  flex: 1;
  font-size: 22rpx;
  color: #333;
}

.timeline-time {
  font-size: 22rpx;
  color: #888;
}

.appointment-expand-hint {
  margin-top: 8rpx;
}

.appointment-expand-text {
  font-size: 22rpx;
  color: #999;
}

.appointment-actions {
  margin-top: 12rpx;
}

.btn-cancel-appointment {
  display: inline-flex;
  height: 56rpx;
  line-height: 56rpx;
  padding: 0 22rpx;
  border-radius: 14rpx;
  background: #FFF2F2;
  color: #D93026;
  font-size: 24rpx;
}

.btn-cancel-appointment::after {
  border: none;
}

.btn-rebook {
  display: inline-flex;
  height: 56rpx;
  line-height: 56rpx;
  padding: 0 22rpx;
  border-radius: 14rpx;
  background: #EAF7EE;
  color: #149647;
  font-size: 24rpx;
  margin-right: 10rpx;
}

.btn-rebook::after {
  border: none;
}

/* 菜单 */
.menu-section {
  padding: 0 30rpx;
}

.menu-group {
  background: #fff;
  border-radius: 20rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
}

.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 28rpx 30rpx;
  border-bottom: 1rpx solid #F5F5F5;
}

.menu-item:last-child {
  border-bottom: none;
}

.menu-left {
  display: flex;
  align-items: center;
  gap: 16rpx;
}

.menu-icon {
  font-size: 32rpx;
}

.menu-text {
  font-size: 28rpx;
  color: #1A1A1A;
}

.menu-desc {
  font-size: 24rpx;
  color: #999;
}

.menu-arrow {
  font-size: 32rpx;
  color: #CCC;
  font-weight: 300;
}

/* 退出登录 */
.logout-section {
  padding: 40rpx 30rpx 0;
}

.btn-logout {
  background: #fff;
  color: #FA5151;
  border: none;
  border-radius: 20rpx;
  height: 88rpx;
  line-height: 88rpx;
  font-size: 30rpx;
  font-weight: 500;
}

.btn-logout::after {
  border: none;
}

.dev-section {
  padding: 20rpx 30rpx 0;
}

.dev-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 28rpx 30rpx;
}

.dev-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.dev-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #1A1A1A;
}

.dev-mode {
  font-size: 22rpx;
  color: #666;
}

.dev-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 18rpx 0;
  border-top: 1rpx solid #F3F3F3;
}

.dev-label {
  font-size: 26rpx;
  color: #1A1A1A;
}

.dev-value {
  max-width: 420rpx;
  font-size: 22rpx;
  color: #999;
  text-align: right;
  word-break: break-all;
}

.dev-actions {
  display: flex;
  gap: 16rpx;
  margin-top: 20rpx;
}

.btn-dev {
  flex: 1;
  background: #000;
  color: #fff;
  border-radius: 18rpx;
  height: 76rpx;
  line-height: 76rpx;
  font-size: 26rpx;
}

.btn-dev-secondary {
  background: #F5F5F5;
  color: #1A1A1A;
}

.btn-dev::after {
  border: none;
}

/* 版本信息 */
.version-info {
  text-align: center;
  padding: 40rpx 0;
}

.version-text {
  font-size: 22rpx;
  color: #CCC;
}
</style>
