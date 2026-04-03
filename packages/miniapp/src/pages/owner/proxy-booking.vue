<template>
  <view class="container">
    <text class="page-title">代客预约</text>

    <!-- Step 1: 选服务 -->
    <view class="section">
      <text class="section-label">选择服务</text>
      <view class="service-grid">
        <view v-for="s in services" :key="s._id" class="srv-item" :class="{ active: selectedService?._id === s._id }" @tap="selectedService = s">
          <text class="srv-name">{{ s.name }}</text>
          <text class="srv-price">¥{{ (s.price / 100).toFixed(0) }}</text>
        </view>
      </view>
    </view>

    <!-- Step 2: 选时间 -->
    <view class="section" v-if="selectedService">
      <text class="section-label">选择日期</text>
      <view class="date-row">
        <picker mode="date" :start="todayStr" @change="onDateChange">
          <view class="date-btn">{{ selectedDate || '请选择日期' }}</view>
        </picker>
      </view>

      <text class="section-label" style="margin-top: 24rpx;">选择时间</text>
      <view v-if="!selectedDate" class="hint"><text class="hint-text">请先选择日期</text></view>
      <view v-else-if="slotsLoading" class="hint"><text class="hint-text">加载中...</text></view>
      <view v-else-if="availableSlots.length === 0" class="hint"><text class="hint-text">该日期暂无可用时段</text></view>
      <view v-else class="time-grid">
        <view v-for="slot in availableSlots" :key="slot.start_time"
          class="time-item" :class="{ active: selectedTime === slot.start_time, disabled: !slot.available }"
          @tap="slot.available && (selectedTime = slot.start_time)">
          <text class="time-text">{{ slot.start_time }}</text>
        </view>
      </view>
    </view>

    <!-- Step 3: 客户信息 -->
    <view class="section" v-if="selectedService && selectedDate && selectedTime">
      <text class="section-label">客户信息</text>
      <view class="form-group">
        <text class="form-label">客户姓名 *</text>
        <input class="form-input" v-model="customerName" placeholder="输入客户姓名" />
      </view>
      <view class="form-group">
        <text class="form-label">联系电话</text>
        <input class="form-input" type="number" v-model="customerPhone" placeholder="输入联系电话（选填）" />
      </view>
      <view class="form-group">
        <text class="form-label">备注</text>
        <textarea class="form-textarea" v-model="note" placeholder="备注信息（选填）" maxlength="200" />
      </view>
    </view>

    <!-- 提交 -->
    <button v-if="canSubmit" class="btn-submit" @tap="onSubmit">确认预约</button>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { serviceApi, appointmentApi } from '@/api/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const services = ref<any[]>([])
const selectedService = ref<any>(null)
const selectedDate = ref('')
const selectedTime = ref('')
const slotsLoading = ref(false)
const availableSlots = ref<any[]>([])
const customerName = ref('')
const customerPhone = ref('')
const note = ref('')

const today = new Date()
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

const canSubmit = computed(() =>
  selectedService.value && selectedDate.value && selectedTime.value && customerName.value.trim()
)

async function loadServices() {
  try {
    const data = await serviceApi.getList(userStore.userInfo.merchantId) as any
    services.value = Array.isArray(data) ? data : (data?.list || [])
  } catch { services.value = [] }
}

async function onDateChange(e: any) {
  selectedDate.value = e.detail.value
  selectedTime.value = ''
  await loadSlots()
}

async function loadSlots() {
  if (!selectedService.value || !selectedDate.value) return
  slotsLoading.value = true
  try {
    const data = await appointmentApi.getAvailableSlots({
      merchant_id: userStore.userInfo.merchantId,
      service_id: selectedService.value._id,
      date: selectedDate.value,
    }) as any
    availableSlots.value = Array.isArray(data) ? data : (data?.slots || [])
  } catch { availableSlots.value = [] }
  finally { slotsLoading.value = false }
}

async function onSubmit() {
  if (!customerName.value.trim()) return uni.showToast({ title: '请输入客户姓名', icon: 'none' })

  try {
    await appointmentApi.create({
      merchant_id: userStore.userInfo.merchantId,
      service_id: selectedService.value._id,
      date: selectedDate.value,
      start_time: selectedTime.value,
      customer_name: customerName.value.trim(),
      customer_phone: customerPhone.value.trim() || undefined,
      note: note.value.trim() || undefined,
      source: 'mini_program',
    })
    uni.showToast({ title: '预约创建成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 1500)
  } catch (err: any) {
    uni.showToast({ title: err.message || '创建失败', icon: 'none' })
  }
}

loadServices()
</script>

<style scoped>
.container { min-height: 100vh; background: var(--color-bg, #F5F5F5); padding: 30rpx; padding-bottom: 120rpx; }
.page-title { font-size: 34rpx; font-weight: 700; color: #1A1A1A; display: block; margin-bottom: 30rpx; }
.section { margin-bottom: 30rpx; }
.section-label { font-size: 28rpx; font-weight: 600; color: #1A1A1A; display: block; margin-bottom: 16rpx; }
.service-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16rpx; }
.srv-item { background: #fff; border-radius: 12rpx; padding: 20rpx; text-align: center; border: 2rpx solid transparent; }
.srv-item.active { border-color: #000; background: #F5F5F5; }
.srv-name { font-size: 26rpx; color: #1A1A1A; display: block; margin-bottom: 6rpx; }
.srv-price { font-size: 24rpx; color: #999; }
.date-row { display: flex; gap: 16rpx; }
.date-btn { background: #fff; padding: 20rpx 24rpx; border-radius: 12rpx; font-size: 28rpx; color: #1A1A1A; }
.hint { padding: 30rpx; text-align: center; }
.hint-text { font-size: 26rpx; color: #999; }
.time-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12rpx; }
.time-item { background: #fff; padding: 16rpx; border-radius: 10rpx; text-align: center; border: 2rpx solid transparent; }
.time-item.active { border-color: #000; background: #000; }
.time-item.active .time-text { color: #fff; }
.time-item.disabled { opacity: 0.35; }
.time-text { font-size: 26rpx; color: #1A1A1A; }
.form-group { margin-bottom: 20rpx; }
.form-label { font-size: 26rpx; color: #666; display: block; margin-bottom: 8rpx; }
.form-input { width: 100%; height: 80rpx; background: #fff; border-radius: 12rpx; padding: 0 20rpx; font-size: 28rpx; }
.form-textarea { width: 100%; height: 140rpx; background: #fff; border-radius: 12rpx; padding: 20rpx; font-size: 28rpx; }
.btn-submit { position: fixed; bottom: 40rpx; left: 30rpx; right: 30rpx; height: 88rpx; background: #000; color: #fff; border-radius: 44rpx; font-size: 30rpx; font-weight: 600; border: none; }
.btn-submit::after { border: none; }
</style>
