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
          <text class="dev-mode">{{ apiModeLabel }}</text>
        </view>
        <view class="dev-row">
          <text class="dev-label">Mock 接口</text>
          <switch :checked="useMock" color="#000000" @change="onMockToggle" />
        </view>
        <view class="dev-row" @tap="editBaseUrl">
          <text class="dev-label">接口地址</text>
          <text class="dev-value">{{ apiBaseUrl }}</text>
        </view>
        <view class="dev-actions">
          <button class="btn-dev" @tap="editBaseUrl">修改地址</button>
          <button class="btn-dev btn-dev-secondary" @tap="resetMockData">重置 Mock 数据</button>
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
import { authApi, getApiEnv, setMockEnabled, setApiBaseUrl, resetMockDb } from '@/api/request'
import { useMerchantStore } from '@/stores/merchant'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const merchantStore = useMerchantStore()

const isLoggedIn = computed(() => userStore.isLoggedIn)
const isOwner = computed(() => userStore.userInfo.role === 'owner')
const userInfo = computed(() => userStore.userInfo)
const useMock = ref(true)
const apiBaseUrl = ref('')
const apiModeLabel = computed(() => (useMock.value ? 'Mock 模式' : '真实接口'))

function syncApiEnv() {
  const env = getApiEnv()
  useMock.value = env.useMock
  apiBaseUrl.value = env.baseUrl
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

function onMockToggle(event: any) {
  const enabled = !!event.detail.value
  setMockEnabled(enabled)
  syncApiEnv()
  uni.showToast({ title: enabled ? '已切换为 Mock' : '已切换为真实接口', icon: 'none' })
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

function resetMockData() {
  resetMockDb()
  merchantStore.clearMerchant()
  uni.showToast({ title: 'Mock 数据已重置', icon: 'success' })
}

onShow(() => {
  syncApiEnv()
  loadProfile()
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
