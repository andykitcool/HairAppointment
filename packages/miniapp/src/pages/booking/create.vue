<template>
  <view class="container">
    <!-- 顶部服务信息 -->
    <view class="header">
      <view class="header-store">{{ merchantName }}</view>
    </view>

    <!-- 步骤指示 -->
    <view class="steps">
      <view class="step" :class="{ active: step >= 1, done: step > 1 }">
        <view class="step-dot">1</view>
        <text class="step-label">选服务</text>
      </view>
      <view class="step-line" :class="{ active: step > 1 }"></view>
      <view class="step" :class="{ active: step >= 2, done: step > 2 }">
        <view class="step-dot">2</view>
        <text class="step-label">选时间</text>
      </view>
      <view class="step-line" :class="{ active: step > 2 }"></view>
      <view class="step" :class="{ active: step >= 3 }">
        <view class="step-dot">3</view>
        <text class="step-label">确认</text>
      </view>
    </view>

    <!-- Step 1: 选择服务 -->
    <view v-if="step === 1" class="step-content">
      <text class="section-title">选择服务项目</text>
      <view v-if="services.length === 0" class="loading-state">
        <text class="loading-text">加载中...</text>
      </view>
      <view
        v-for="service in services"
        :key="service.service_id"
        class="service-card"
        :class="{ selected: selectedService?.service_id === service.service_id }"
        @tap="selectService(service)"
      >
        <view class="service-info">
          <text class="service-name">{{ service.name }}</text>
          <text class="service-desc">{{ service.description || '' }}</text>
        </view>
        <view class="service-meta">
          <text class="service-price">¥{{ formatPrice(service.price) }}</text>
          <text class="service-dur">{{ service.total_duration }}min</text>
        </view>
      </view>
    </view>

    <!-- Step 2: 选择日期和时间 -->
    <view v-if="step === 2" class="step-content">
      <!-- 已选服务摘要 -->
      <view class="selected-summary">
        <text class="summary-label">已选服务</text>
        <text class="summary-value">{{ selectedService?.name }} · {{ selectedService?.total_duration }}分钟</text>
      </view>

      <!-- 日期选择 -->
      <view class="date-section">
        <text class="section-title">到店日期</text>
        <scroll-view scroll-x class="date-scroll">
          <view
            v-for="(day, index) in dateList"
            :key="day.date"
            class="date-item"
            :class="{ active: selectedDateIndex === index, closed: day.closed }"
            @tap="!day.closed && selectDate(index)"
          >
            <text class="date-weekday">{{ day.weekday }}</text>
            <text class="date-day">{{ day.day }}</text>
            <text class="date-month">{{ day.month }}月</text>
            <text v-if="day.closed" class="date-closed">休</text>
          </view>
        </scroll-view>
      </view>

      <!-- 时间段选择 -->
      <view class="time-section">
        <view class="section-header">
          <text class="section-title">选择时间</text>
          <text v-if="slotsClosed" class="closed-tip">当日打烊</text>
        </view>
        <view v-if="loadingSlots" class="loading-state">
          <text class="loading-text">加载时段...</text>
        </view>
        <view v-else-if="availableSlots.length === 0 && !slotsClosed" class="loading-state">
          <text class="loading-text">暂无可用时段</text>
        </view>
        <view v-else class="time-groups">
          <view v-for="group in groupedSlots" :key="group.start" class="time-group">
            <text v-if="groupedSlots.length > 1" class="time-group-label">{{ group.label }}</text>
            <view class="time-grid">
              <view
                v-for="slot in group.slots"
                :key="slot.start"
                class="time-slot"
                :class="{ active: selectedTime === slot.start, disabled: !slot.available }"
                @tap="slot.available && (selectedTime = slot.start)"
              >
                <text class="time-text">{{ slot.start }}</text>
              </view>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- Step 3: 确认预约 -->
    <view v-if="step === 3" class="step-content">
      <view class="confirm-card">
        <text class="confirm-title">预约详情</text>
        <view class="confirm-row">
          <text class="confirm-label">服务项目</text>
          <text class="confirm-value">{{ selectedService?.name }}</text>
        </view>
        <view class="confirm-row">
          <text class="confirm-label">服务时长</text>
          <text class="confirm-value">{{ selectedService?.total_duration }} 分钟</text>
        </view>
        <view class="confirm-row">
          <text class="confirm-label">参考价格</text>
          <text class="confirm-value price">¥{{ formatPrice(selectedService?.price || 0) }}</text>
        </view>
        <view class="confirm-row">
          <text class="confirm-label">到店日期</text>
          <text class="confirm-value">{{ selectedDateLabel }}</text>
        </view>
        <view class="confirm-row">
          <text class="confirm-label">到店时间</text>
          <text class="confirm-value">{{ selectedTime }}</text>
        </view>

        <view class="contact-section">
          <text class="confirm-label">预约联系人</text>
          <input v-model="contactName" class="contact-input" placeholder="请输入联系人姓名" maxlength="20" />
          <input v-model="contactPhone" class="contact-input" placeholder="请输入手机号" type="number" maxlength="11" />
        </view>

        <!-- 备注 -->
        <view class="note-section">
          <text class="confirm-label">备注</text>
          <textarea
            v-model="note"
            class="note-input"
            placeholder="选填，如发型偏好等"
            maxlength="200"
            :auto-height="true"
          />
        </view>
      </view>
    </view>

    <!-- 底部按钮 -->
    <view class="bottom-bar">
      <button v-if="step === 1" class="btn-primary" :disabled="!selectedService" @tap="step = 2">
        下一步：选择时间
      </button>
      <button v-if="step === 2" class="btn-secondary" @tap="step = 1">
        上一步
      </button>
      <button v-if="step === 2" class="btn-primary" :disabled="!selectedTime" @tap="step = 3">
        下一步：确认预约
      </button>
      <button v-if="step === 3" class="btn-secondary" @tap="step = 2">
        上一步
      </button>
      <button v-if="step === 3" class="btn-primary" :disabled="submitting" @tap="onSubmit">
        {{ submitting ? '提交中...' : '确认预约' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { serviceApi, appointmentApi, authApi, merchantApi } from '@/api/request'
import { useMerchantStore } from '@/stores/merchant'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const merchantStore = useMerchantStore()
const DEFAULT_MERCHANT_ID = 'M000001'

const merchantId = ref('')
const merchantName = ref('美发工作室')

// 步骤
const step = ref(1)
const services = ref<any[]>([])
const selectedService = ref<any>(null)
const dateList = ref<any[]>([])
const selectedDateIndex = ref(0)
const allSlots = ref<any[]>([])
const selectedTime = ref('')
const note = ref('')
const contactName = ref('')
const contactPhone = ref('')
const submitting = ref(false)
const loadingSlots = ref(false)
const slotsClosed = ref(false)
const businessIntervals = ref<Array<{ start: string; end: string }>>([]) 

// 可用时段
const availableSlots = computed(() => allSlots.value.filter((s: any) => s.available))

function timeToMins(t: string): number {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function intervalLabel(start: string): string {
  const h = parseInt(start.split(':')[0], 10)
  if (h < 12) return '上午'
  if (h < 17) return '下午'
  return '晚上'
}

// 按营业时段分组
const groupedSlots = computed(() => {
  if (!businessIntervals.value.length) {
    return allSlots.value.length ? [{ label: '', slots: allSlots.value }] : []
  }
  return businessIntervals.value
    .map((itv) => ({
      label: intervalLabel(itv.start),
      start: itv.start,
      slots: allSlots.value.filter((s: any) => {
        const m = timeToMins(s.start)
        return m >= timeToMins(itv.start) && m < timeToMins(itv.end)
      }),
    }))
    .filter((g) => g.slots.length > 0)
})

// 选中日期标签
const selectedDateLabel = computed(() => {
  const d = dateList.value[selectedDateIndex.value]
  if (!d) return ''
  return `${d.date} ${d.weekday}`
})

// 当前选中日期
const selectedDate = computed(() => dateList.value[selectedDateIndex.value]?.date || '')

// 格式化价格
function formatPrice(fen: number): string {
  return (fen / 100).toFixed(0)
}

// 格式化日期 YYYY-MM-DD
function formatDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// 生成未来14天日期
function generateDateList() {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const list: any[] = []
  for (let i = 0; i < 14; i++) {
    const date = new Date()
    date.setDate(date.getDate() + i)
    const weekday = i === 0 ? '今天' : i === 1 ? '明天' : weekdays[date.getDay()]
    list.push({
      date: formatDateStr(date),
      weekday,
      day: date.getDate(),
      month: date.getMonth() + 1,
      closed: false,
    })
  }
  return list
}

// 选择服务
function selectService(service: any) {
  selectedService.value = service
}

// 选择日期
function selectDate(index: number) {
  selectedDateIndex.value = index
  selectedTime.value = ''
  loadSlots()
}

// 加载时间段
async function loadSlots() {
  if (!selectedDate.value || !merchantId.value) return

  loadingSlots.value = true
  slotsClosed.value = false

  try {
    const data = await appointmentApi.getAvailableSlots({
      merchant_id: merchantId.value,
      date: selectedDate.value,
      service_id: selectedService.value?.service_id || '',
    }) as any

    if (data?.closed) {
      slotsClosed.value = true
      allSlots.value = []
      businessIntervals.value = []
    } else {
      allSlots.value = data?.slots || []
      businessIntervals.value = data?.business_hours || []
    }
  } catch {
    allSlots.value = []
  } finally {
    loadingSlots.value = false
  }
}

// 提交预约
async function onSubmit() {
  if (submitting.value) return
  if (!selectedService.value || !selectedTime.value || !selectedDate.value) return
  if (!merchantId.value) {
    uni.showToast({ title: '门店信息异常，请返回重试', icon: 'none' })
    return
  }

  if (!contactName.value.trim()) {
    uni.showToast({ title: '请输入联系人姓名', icon: 'none' })
    return
  }

  if (!/^1\d{10}$/.test(contactPhone.value.trim())) {
    uni.showToast({ title: '请输入正确手机号', icon: 'none' })
    return
  }

  submitting.value = true
  try {
    const data = await appointmentApi.create({
      merchant_id: merchantId.value,
      service_id: selectedService.value.service_id,
      date: selectedDate.value,
      start_time: selectedTime.value,
      customer_name: contactName.value.trim(),
      customer_phone: contactPhone.value.trim(),
      note: note.value || undefined,
    }) as any

    void data
    uni.showToast({ title: '预约成功', icon: 'success' })
    setTimeout(() => {
      uni.switchTab({ url: '/pages/index/index' })
    }, 1500)
  } catch (err: any) {
    uni.showToast({ title: err.message || '预约失败', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

async function ensureLogin() {
  if (userStore.isLoggedIn && userStore.token) {
    return true
  }

  try {
    const loginRes = await uni.login({ provider: 'weixin' })
    if (!loginRes?.code) {
      uni.showToast({ title: '请先登录', icon: 'none' })
      return false
    }
    const data = await authApi.wechatLogin(loginRes.code) as any
    if (data?.token && data?.user) {
      userStore.setToken(data.token)
      userStore.setUser(data.user)
      return true
    }
    uni.showToast({ title: '请先登录', icon: 'none' })
    return false
  } catch {
    uni.showToast({ title: '请先登录', icon: 'none' })
    return false
  }
}

watch([step, selectedDate, selectedService], async ([currentStep]) => {
  if (currentStep === 2 && selectedService.value && selectedDate.value) {
    await loadSlots()
  }
})

// 页面初始化
onLoad(async (query: any) => {
  const ok = await ensureLogin()
  if (!ok) return

  merchantId.value = query?.merchantId || query?.merchant_id || userStore.userInfo.merchant_id || DEFAULT_MERCHANT_ID
  const preServiceId = query?.serviceId || query?.service_id || ''
  contactName.value = userStore.userInfo.realName || userStore.userInfo.nickname || ''
  contactPhone.value = userStore.userInfo.phone || ''

  if (merchantStore.merchantInfo.merchant_id === merchantId.value && merchantStore.merchantInfo.name) {
    merchantName.value = merchantStore.merchantInfo.name
  } else if (merchantId.value) {
    try {
      const merchant = await merchantApi.getInfo(merchantId.value) as any
      merchantName.value = merchant?.name || merchantName.value
      merchantStore.setMerchant(merchant)
    } catch {
      merchantName.value = '黑白造型工作室'
    }
  }

  // 生成日期列表
  dateList.value = generateDateList()

  // 加载服务列表
  if (merchantId.value) {
    try {
      const data = await serviceApi.getList(merchantId.value) as any
      services.value = Array.isArray(data) ? data : []
    } catch {
      services.value = []
    }
  } else {
    // 无商户时使用预设
    services.value = [
      { service_id: 'preset_1', name: '儿童剪发', category: 'cut', price: 2000, total_duration: 20, description: '儿童专属剪发服务' },
      { service_id: 'preset_2', name: '男士剪发', category: 'cut', price: 3000, total_duration: 25, description: '男士精剪服务' },
      { service_id: 'preset_3', name: '女士剪发', category: 'cut', price: 5000, total_duration: 30, description: '女士精剪造型服务' },
      { service_id: 'preset_4', name: '染发', category: 'dye', price: 15000, total_duration: 80, description: '专业染发服务，含洗剪吹' },
      { service_id: 'preset_5', name: '烫发', category: 'perm', price: 20000, total_duration: 75, description: '专业烫发服务，含造型' },
    ]
  }

  // 预选服务
  if (preServiceId) {
    const found = services.value.find((s: any) => s.service_id === preServiceId)
    if (found) {
      selectedService.value = found
      // 直接跳到选时间步骤
      step.value = 2
      await loadSlots()
    }
  }
})
</script>

<style scoped>
.container {
  min-height: 100vh;
  background: var(--color-bg, #F5F5F5);
  padding-bottom: 180rpx;
}

/* 头部 */
.header {
  background: #000;
  padding: 40rpx;
  color: #fff;
}

.header-store {
  font-size: 34rpx;
  font-weight: 700;
}

/* 步骤指示 */
.steps {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30rpx 60rpx;
  background: #fff;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8rpx;
}

.step-dot {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: #E0E0E0;
  color: #999;
  font-size: 24rpx;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}

.step.active .step-dot {
  background: #000;
  color: #fff;
}

.step.done .step-dot {
  background: #07C160;
  color: #fff;
}

.step-label {
  font-size: 22rpx;
  color: #999;
}

.step.active .step-label {
  color: #1A1A1A;
  font-weight: 600;
}

.step-line {
  flex: 1;
  height: 4rpx;
  background: #E0E0E0;
  margin: 0 16rpx;
  margin-bottom: 30rpx;
}

.step-line.active {
  background: #07C160;
}

/* 步骤内容 */
.step-content {
  padding: 30rpx;
}

.section-title {
  font-size: 30rpx;
  font-weight: 700;
  color: #1A1A1A;
  display: block;
  margin-bottom: 20rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.closed-tip {
  font-size: 24rpx;
  color: #FF9500;
}

/* 服务卡片 */
.service-card {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx;
  margin-bottom: 16rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 2rpx solid transparent;
  transition: all 0.2s;
}

.service-card.selected {
  border-color: #07C160;
  background: #07C160;
}

.service-card.selected .service-name,
.service-card.selected .service-price {
  color: #fff;
}

.service-card.selected .service-desc,
.service-card.selected .service-dur {
  color: rgba(255, 255, 255, 0.82);
}

.service-info {
  flex: 1;
  min-width: 0;
}

.service-name {
  font-size: 30rpx;
  font-weight: 600;
  color: #1A1A1A;
  display: block;
  margin-bottom: 6rpx;
}

.service-desc {
  font-size: 24rpx;
  color: #999;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.service-meta {
  text-align: right;
  margin-left: 20rpx;
}

.service-price {
  font-size: 32rpx;
  font-weight: 700;
  color: #1A1A1A;
  display: block;
  margin-bottom: 4rpx;
}

.service-dur {
  font-size: 22rpx;
  color: #999;
}

/* 已选服务摘要 */
.selected-summary {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-label {
  font-size: 26rpx;
  color: #999;
}

.summary-value {
  font-size: 26rpx;
  color: #1A1A1A;
  font-weight: 600;
}

/* 日期选择 */
.date-section {
  margin-bottom: 30rpx;
}

.date-scroll {
  white-space: nowrap;
}

.date-item {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  padding: 16rpx 24rpx;
  margin-right: 16rpx;
  border-radius: 16rpx;
  background: #fff;
  min-width: 100rpx;
  position: relative;
}

.date-item.active {
  background: #000;
}

.date-item.closed {
  opacity: 0.35;
}

.date-weekday {
  font-size: 22rpx;
  color: #999;
  margin-bottom: 4rpx;
}

.date-day {
  font-size: 32rpx;
  font-weight: 700;
  color: #1A1A1A;
}

.date-month {
  font-size: 20rpx;
  color: #999;
}

.date-closed {
  position: absolute;
  top: 4rpx;
  right: 4rpx;
  font-size: 18rpx;
  color: #FA5151;
  font-weight: 600;
}

.date-item.active .date-weekday,
.date-item.active .date-day,
.date-item.active .date-month {
  color: #fff;
}

/* 时间段分组 */
.time-groups {
  display: flex;
  flex-direction: column;
  gap: 8rpx;
}

.time-group {
  margin-bottom: 16rpx;
}

.time-group-label {
  font-size: 24rpx;
  color: #999;
  display: block;
  margin-bottom: 14rpx;
  padding-left: 4rpx;
}

/* 时间段 */
.time-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.time-slot {
  background: #fff;
  border-radius: 12rpx;
  padding: 16rpx 24rpx;
  min-width: 140rpx;
  text-align: center;
}

.time-slot.active {
  background: #000;
}

.time-slot.disabled {
  opacity: 0.25;
}

.time-text {
  font-size: 26rpx;
  color: #1A1A1A;
}

.time-slot.active .time-text {
  color: #fff;
}

/* 确认卡片 */
.confirm-card {
  background: #fff;
  border-radius: 20rpx;
  padding: 36rpx;
}

.confirm-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1A1A1A;
  display: block;
  margin-bottom: 30rpx;
  padding-bottom: 20rpx;
  border-bottom: 1rpx solid #F0F0F0;
}

.confirm-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.confirm-label {
  font-size: 28rpx;
  color: #999;
}

.confirm-value {
  font-size: 28rpx;
  color: #1A1A1A;
  font-weight: 500;
}

.confirm-value.price {
  font-size: 34rpx;
  font-weight: 700;
  color: #1A1A1A;
}

.contact-section {
  margin-top: 24rpx;
  margin-bottom: 20rpx;
}

.contact-input {
  width: 100%;
  background: #F8F8F8;
  border-radius: 12rpx;
  padding: 18rpx 20rpx;
  font-size: 28rpx;
  color: #1A1A1A;
  margin-top: 12rpx;
  box-sizing: border-box;
}

/* 备注 */
.note-section {
  margin-top: 20rpx;
  padding-top: 20rpx;
  border-top: 1rpx solid #F0F0F0;
}

.note-input {
  background: #F5F5F5;
  border-radius: 12rpx;
  padding: 20rpx;
  font-size: 28rpx;
  margin-top: 12rpx;
  width: 100%;
  min-height: 100rpx;
  box-sizing: border-box;
}

/* 底部按钮 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 30rpx;
  padding-bottom: calc(20rpx + env(safe-area-inset-bottom));
  background: #fff;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
  display: flex;
  gap: 20rpx;
}

.btn-primary {
  flex: 1;
  background: #000;
  color: #fff;
  border: none;
  border-radius: 48rpx;
  height: 88rpx;
  line-height: 88rpx;
  font-size: 30rpx;
  font-weight: 600;
}

.btn-primary::after {
  border: none;
}

.btn-primary[disabled] {
  background: #CCC;
  color: #fff;
}

.btn-secondary {
  background: #fff;
  color: #1A1A1A;
  border: 2rpx solid #E0E0E0;
  border-radius: 48rpx;
  height: 88rpx;
  line-height: 84rpx;
  font-size: 30rpx;
  font-weight: 500;
}

.btn-secondary::after {
  border: none;
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
