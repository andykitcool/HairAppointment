<template>
  <view class="container">
    <text class="page-title">申请成为店长</text>
    <text class="page-desc">填写以下信息，提交入驻申请后等待平台审核。</text>

    <view v-if="applicationStatus" class="section">
      <text class="section-label">审核状态</text>
      <view class="status-row">
        <text class="status-label">当前状态</text>
        <text class="status-value" :class="`status-${applicationStatus}`">{{ statusText }}</text>
      </view>
      <view class="status-row" v-if="applicationStatus === 'rejected' && reviewNote">
        <text class="status-label">拒绝理由</text>
        <text class="status-note">{{ reviewNote }}</text>
      </view>
    </view>

    <!-- 门店基本信息 -->
    <view class="section">
      <text class="section-label">门店信息</text>
      <view class="form-group">
        <text class="form-label">门店名称 *</text>
        <input class="form-input" v-model="form.name" :disabled="formReadonly" placeholder="如：XX造型" />
      </view>
      <view class="form-group">
        <text class="form-label">联系电话 *</text>
        <input class="form-input" type="number" v-model="form.phone" :disabled="formReadonly" placeholder="门店联系电话" />
      </view>
      <view class="form-group">
        <text class="form-label">门店地址</text>
        <input class="form-input" v-model="form.address" :disabled="formReadonly" placeholder="门店详细地址（选填）" />
      </view>
      <view class="form-group">
        <text class="form-label">门店简介</text>
        <textarea class="form-textarea" v-model="form.description" :disabled="formReadonly" placeholder="简单介绍门店（选填）" maxlength="200" />
      </view>
    </view>

    <!-- 营业时间 -->
    <view class="section">
      <text class="section-label">营业时间</text>
      <view class="hours-row">
        <picker mode="time" :disabled="formReadonly" :value="form.business_hours.start" @change="form.business_hours.start = $event.detail.value">
          <view class="time-picker">{{ form.business_hours.start || '开始时间' }}</view>
        </picker>
        <text class="time-sep">至</text>
        <picker mode="time" :disabled="formReadonly" :value="form.business_hours.end" @change="form.business_hours.end = $event.detail.value">
          <view class="time-picker">{{ form.business_hours.end || '结束时间' }}</view>
        </picker>
      </view>
    </view>

    <!-- 个人信息确认 -->
    <view class="section">
      <text class="section-label">申请人信息</text>
      <view class="info-row">
        <text class="info-label">微信昵称</text>
        <text class="info-value">{{ userStore.userInfo.nickname || '-' }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">手机号</text>
        <text class="info-value">{{ userStore.userInfo.phone || '-' }}</text>
      </view>
    </view>

    <!-- 提交 -->
    <view class="bottom-area">
      <button v-if="formReadonly" class="btn-submit btn-submit-disabled" disabled>审核中</button>
      <button v-else class="btn-submit" @tap="onSubmit">{{ applicationStatus === 'rejected' ? '再次申请' : '提交申请' }}</button>
      <text class="submit-hint">{{ formReadonly ? '申请审核中，请耐心等待' : '提交后将在1-3个工作日内完成审核' }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { authApi } from '@/api/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const OWNER_APPLY_DRAFT_KEY = 'owner_apply_draft_v1'

const form = ref({
  name: '',
  phone: '',
  address: '',
  description: '',
  business_hours: { start: '09:00', end: '21:00' },
})
const applicationStatus = ref('')
const reviewNote = ref('')

const formReadonly = computed(() => ['applying', 'pending', 'active'].includes(applicationStatus.value))
const statusText = computed(() => {
  const map: Record<string, string> = {
    applying: '申请中',
    pending: '待审核',
    active: '已通过',
    rejected: '已拒绝',
  }
  return map[applicationStatus.value] || applicationStatus.value
})

async function ensureLogin() {
  if (userStore.isLoggedIn && userStore.token) return true
  try {
    const loginRes = await uni.login({ provider: 'weixin' })
    if (!loginRes?.code) return false
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

function loadDraft() {
  const draft = uni.getStorageSync(OWNER_APPLY_DRAFT_KEY)
  if (!draft || typeof draft !== 'object') return
  form.value = {
    name: String(draft.name || ''),
    phone: String(draft.phone || ''),
    address: String(draft.address || ''),
    description: String(draft.description || ''),
    business_hours: {
      start: String(draft.business_hours?.start || '09:00'),
      end: String(draft.business_hours?.end || '21:00'),
    },
  }
}

function saveDraft() {
  uni.setStorageSync(OWNER_APPLY_DRAFT_KEY, form.value)
}

async function loadOwnerApplication() {
  try {
    const data = await authApi.getOwnerApplication() as any
    if (!data?.has_application) {
      applicationStatus.value = ''
      reviewNote.value = ''
      return
    }
    applicationStatus.value = String(data.status || '')
    reviewNote.value = String(data.review_note || '')

    form.value = {
      name: String(data.name || ''),
      phone: String(data.phone || ''),
      address: String(data.address || ''),
      description: String(data.description || ''),
      business_hours: {
        start: String(data.business_hours?.start || '09:00'),
        end: String(data.business_hours?.end || '21:00'),
      },
    }
  } catch {
    applicationStatus.value = ''
    reviewNote.value = ''
  }
}

async function onSubmit() {
  if (formReadonly.value) return
  if (!form.value.name.trim()) return uni.showToast({ title: '请输入门店名称', icon: 'none' })
  if (!form.value.phone.trim()) return uni.showToast({ title: '请输入联系电话', icon: 'none' })

  uni.showModal({
    title: '确认提交',
    content: '确认提交店长入驻申请？提交后需等待平台审核。',
    success: async (res) => {
      if (!res.confirm) return
      uni.showLoading({ title: '提交中...' })
      try {
        const logged = await ensureLogin()
        if (!logged) {
          uni.hideLoading()
          uni.showToast({ title: '请先登录后再提交', icon: 'none' })
          return
        }

        await authApi.applyOwner({
          shop_name: form.value.name.trim(),
          phone: form.value.phone.trim(),
          address: form.value.address.trim() || undefined,
          description: form.value.description.trim() || undefined,
          business_hours: form.value.business_hours,
        })
        saveDraft()
        await loadOwnerApplication()
        uni.hideLoading()
        uni.showToast({ title: applicationStatus.value === 'rejected' ? '已再次提交' : '申请已提交', icon: 'success' })
      } catch (err: any) {
        uni.hideLoading()
        if (String(err?.message || '').includes('401')) {
          uni.showToast({ title: '登录状态已失效，请重试', icon: 'none' })
          return
        }
        uni.showToast({ title: err.message || '提交失败', icon: 'none' })
      }
    }
  })
}

watch(form, () => {
  if (!formReadonly.value) {
    saveDraft()
  }
}, { deep: true })

onShow(async () => {
  const logged = await ensureLogin()
  if (!logged) return
  loadDraft()
  await loadOwnerApplication()
})
</script>

<style scoped>
.container { min-height: 100vh; background: var(--color-bg, #F5F5F5); padding: 30rpx; padding-bottom: 240rpx; }

.page-title { font-size: 36rpx; font-weight: 700; color: #1A1A1A; display: block; margin-bottom: 8rpx; }
.page-desc { font-size: 26rpx; color: #999; display: block; margin-bottom: 30rpx; }

.section { margin-bottom: 24rpx; background: #fff; border-radius: 16rpx; padding: 24rpx; }
.section-label { font-size: 30rpx; font-weight: 700; color: #1A1A1A; display: block; margin-bottom: 20rpx; }

.status-row { display: flex; justify-content: space-between; align-items: flex-start; padding: 12rpx 0; }
.status-label { font-size: 26rpx; color: #666; min-width: 150rpx; }
.status-value { font-size: 26rpx; font-weight: 600; }
.status-applying, .status-pending { color: #e6a23c; }
.status-active { color: #67c23a; }
.status-rejected { color: #f56c6c; }
.status-note { flex: 1; font-size: 26rpx; color: #f56c6c; line-height: 1.5; text-align: right; }

.form-group { margin-bottom: 20rpx; }
.form-label { font-size: 26rpx; color: #666; display: block; margin-bottom: 8rpx; }
.form-input { width: 100%; height: 80rpx; background: #F5F5F5; border-radius: 12rpx; padding: 0 20rpx; font-size: 28rpx; box-sizing: border-box; }
.form-textarea { width: 100%; height: 140rpx; background: #F5F5F5; border-radius: 12rpx; padding: 20rpx; font-size: 28rpx; box-sizing: border-box; }

.hours-row { display: flex; align-items: center; gap: 20rpx; }
.time-picker { flex: 1; height: 80rpx; background: #F5F5F5; border-radius: 12rpx; display: flex; align-items: center; justify-content: center; font-size: 28rpx; color: #1A1A1A; }
.time-sep { font-size: 28rpx; color: #999; }

.info-row { display: flex; justify-content: space-between; align-items: center; padding: 16rpx 0; border-bottom: 1rpx solid #F5F5F5; }
.info-row:last-child { border-bottom: none; }
.info-label { font-size: 26rpx; color: #666; }
.info-value { font-size: 26rpx; color: #1A1A1A; }

.bottom-area { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; padding: 20rpx 30rpx; padding-bottom: calc(20rpx + env(safe-area-inset-bottom)); box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.05); text-align: center; }
.btn-submit { width: 100%; height: 88rpx; background: #000; color: #fff; border-radius: 44rpx; font-size: 30rpx; font-weight: 600; border: none; margin-bottom: 10rpx; }
.btn-submit-disabled { background: #c0c4cc; }
.btn-submit::after { border: none; }
.submit-hint { font-size: 22rpx; color: #999; }
</style>
