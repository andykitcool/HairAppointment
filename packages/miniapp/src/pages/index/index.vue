<template>
  <view class="container">
    <!-- ── 英雄横幅 ── -->
    <view class="hero" :style="{ paddingTop: statusBarHeight + 'px' }">
      <view class="hero-gradient"></view>
      <view class="hero-body">
        <view class="hero-left">
          <text class="hero-name">{{ merchantInfo.name }}</text>
          <view class="hero-meta-row">
            <text class="hero-meta-icon">📍</text>
            <text class="hero-meta-text">{{ merchantInfo.address || '暂无地址' }}</text>
          </view>
          <view class="hero-meta-row">
            <text class="hero-meta-icon">🕐</text>
            <text class="hero-meta-text">{{ merchantInfo.business_hours?.start || '09:00' }} – {{ merchantInfo.business_hours?.end || '18:00' }}</text>
          </view>
        </view>
        <view class="hero-staff">
          <view class="staff-circle">
            <text class="staff-circle-icon">✂</text>
          </view>
          <view class="staff-badge-row">
            <text class="staff-star">★</text>
            <text class="staff-score">4.9</text>
          </view>
          <text class="staff-name">Tony</text>
          <text class="staff-title">技术总监</text>
        </view>
      </view>
    </view>

    <!-- ── 预约项目（横向滑动卡片）── -->
    <view class="section-block">
      <text class="section-title">预约项目</text>
      <scroll-view scroll-x class="svc-scroll">
        <view class="svc-row">
          <view
            v-for="svc in displayServices"
            :key="svc.id"
            class="svc-card"
            :class="{ 'svc-card-on': selectedCategory?.id === svc.id }"
            @tap="onSelectCategory(svc)"
          >
            <text class="svc-ico">{{ svc.icon }}</text>
            <text class="svc-nm">{{ svc.name }}</text>
            <text class="svc-dur">{{ svc.duration }} 分钟</text>
            <text class="svc-price">{{ svc.apiPrice ? '¥' + formatPrice(svc.apiPrice) : '面议' }}</text>
            <text class="svc-desc">{{ svc.desc }}</text>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- ── 到店时间（选完项目后展示）── -->
    <view class="section-block" v-if="selectedCategory">
      <view class="time-header">
        <text class="time-title">到店时间</text>
        <text class="rest-badge" v-if="restPeriod">{{ restPeriod }} 休息</text>
      </view>

      <!-- 日期横向选择 -->
      <scroll-view scroll-x class="date-scroll">
        <view class="date-row">
          <view
            v-for="(d, i) in dateList"
            :key="d.date"
            class="date-tab"
            :class="{ 'date-tab-on': selectedDateIndex === i, 'date-tab-off': d.closed }"
            @tap="!d.closed && selectDate(i)"
          >
            <text class="date-wday">{{ d.weekday }}</text>
            <text class="date-md">{{ d.month }}/{{ d.day }}</text>
          </view>
        </view>
      </scroll-view>

      <!-- 时间段网格 -->
      <view v-if="loadingSlots" class="slots-tip">
        <text class="slots-tip-text">加载时段...</text>
      </view>
      <view v-else-if="slotsClosed" class="slots-tip">
        <text class="slots-tip-text">当日打烊，暂不可预约</text>
      </view>
      <view v-else-if="allSlots.length === 0" class="slots-tip">
        <text class="slots-tip-text">暂无可用时段</text>
      </view>
      <view v-else class="time-grid">
        <view
          v-for="slot in allSlots"
          :key="slot.start"
          class="time-slot"
          :class="{ 'time-slot-on': selectedTime === slot.start, 'time-slot-dim': !slot.available }"
          @tap="slot.available && selectTime(slot.start)"
        >
          <text class="time-text">{{ slot.start }}</text>
        </view>
      </view>
    </view>

    <view class="bottom-safe"></view>
  </view>

  <!-- ── 底部预约按钮 ── -->
  <view class="bottom-bar">
    <view
      class="btn-book"
      :class="{ 'btn-book-dim': !canBook }"
      @tap="onBook"
    >
      <text class="btn-book-text">预约</text>
    </view>
  </view>

  <!-- ── 联系人弹层 ── -->
  <view v-if="showSheet" class="sheet-wrap">
    <view class="sheet-mask" @tap="showSheet = false"></view>
    <view class="sheet-panel">
      <view class="sheet-head">
        <text class="sheet-title">预约联系人</text>
        <view class="sheet-x" @tap="showSheet = false">
          <text class="sheet-x-text">✕</text>
        </view>
      </view>
      <view class="sheet-body">
        <text class="field-label">姓名</text>
        <input
          class="field-input"
          v-model="contactName"
          placeholder="您的姓名"
          placeholder-class="field-ph"
          maxlength="20"
        />
        <text class="field-label">手机号码</text>
        <input
          class="field-input"
          v-model="contactPhone"
          placeholder="您的联系电话"
          placeholder-class="field-ph"
          type="number"
          maxlength="11"
        />
        <view class="summary-card">
          <view class="summary-row">
            <text class="summary-key">服务项目</text>
            <text class="summary-val">{{ selectedCategory?.name }}</text>
          </view>
          <view class="summary-row">
            <text class="summary-key">发型师</text>
            <text class="summary-val">Tony</text>
          </view>
          <view class="summary-row">
            <text class="summary-key">到店时间</text>
            <text class="summary-val">{{ selectedDateShort }} {{ selectedTime }}</text>
          </view>
        </view>
      </view>
      <view class="sheet-foot">
        <view
          class="btn-confirm"
          :class="{ 'btn-confirm-dim': submitting }"
          @tap="onSubmit"
        >
          <text class="btn-confirm-text">{{ submitting ? '提交中...' : '确认预约' }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { serviceApi, appointmentApi, merchantApi, authApi } from '@/api/request'
import { useUserStore } from '@/stores/user'
import { useMerchantStore } from '@/stores/merchant'

const userStore = useUserStore()
const merchantStore = useMerchantStore()

const DEFAULT_MERCHANT_ID = 'M_mock_001'
const REST_PERIOD = '12:00-13:00'

// 状态栏高度（自定义导航栏时需要）
const statusBarHeight = ref(0)
try {
  statusBarHeight.value = uni.getSystemInfoSync().statusBarHeight || 0
} catch {
  statusBarHeight.value = 0
}

// ── 4 个预设服务分类 ──
const CATEGORIES = [
  { id: 'cat_cut',  name: '剪发', category: 'cut',  icon: '✂', duration: 45,  desc: '精准剪裁，塑造完美发型' },
  { id: 'cat_perm', name: '烫发', category: 'perm', icon: '〜', duration: 120, desc: '持久定型，自然蓬松质感' },
  { id: 'cat_dye',  name: '染发', category: 'dye',  icon: '◉', duration: 90,  desc: '潮流色系，呵护发质光泽' },
  { id: 'cat_care', name: '养护', category: 'care', icon: '❋', duration: 60,  desc: '深层修护，锁水润泽养发' },
]

const merchantInfo = ref<any>({
  merchant_id: '', name: '黑白造型工作室',
  address: '星光大道 88号2楼', phone: '',
  business_hours: { start: '09:00', end: '18:00' }, status: 'active',
})

const apiServices = ref<any[]>([])

// 将 API 服务映射到4个固定分类上
const displayServices = computed(() =>
  CATEGORIES.map(cat => {
    const matched = apiServices.value.find((s: any) => s.category === cat.category)
    return {
      ...cat,
      service_id: matched?.service_id || cat.id,
      apiPrice: matched?.price ?? null,
      duration: matched?.total_duration ?? cat.duration,
      desc: matched?.description || cat.desc,
    }
  })
)

// 已选服务分类
const selectedCategory = ref<any>(null)

// 日期时间
const dateList = ref<any[]>([])
const selectedDateIndex = ref(0)
const allSlots = ref<any[]>([])
const selectedTime = ref('')
const loadingSlots = ref(false)
const slotsClosed = ref(false)

// 联系人弹层
const showSheet = ref(false)
const contactName = ref('')
const contactPhone = ref('')
const submitting = ref(false)

// ── Computed ──
const canBook = computed(() => !!selectedCategory.value && !!selectedTime.value)
const restPeriod = computed(() => REST_PERIOD)
const selectedDate = computed(() => dateList.value[selectedDateIndex.value]?.date || '')
const selectedDateShort = computed(() => {
  const d = dateList.value[selectedDateIndex.value]
  return d ? `${d.month}/${d.day}` : ''
})

// ── 工具函数 ──
function formatPrice(fen: number): string {
  return (fen / 100).toFixed(0)
}

function formatDateStr(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function generateDateList() {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return Array.from({ length: 7 }, (_, i) => {
    const date = new Date()
    date.setDate(date.getDate() + i)
    return {
      date: formatDateStr(date),
      weekday: i === 0 ? '今天' : i === 1 ? '明天' : weekdays[date.getDay()],
      day: date.getDate(),
      month: date.getMonth() + 1,
      closed: false,
    }
  })
}

// ── 交互处理 ──
function onSelectCategory(svc: any) {
  if (selectedCategory.value?.id === svc.id) return
  selectedCategory.value = svc
  selectedTime.value = ''
  if (selectedDate.value && merchantInfo.value.merchant_id) loadSlots()
}

function selectDate(index: number) {
  selectedDateIndex.value = index
  selectedTime.value = ''
  if (selectedCategory.value) loadSlots()
}

function selectTime(time: string) {
  selectedTime.value = time
}

async function loadSlots() {
  if (!selectedDate.value || !merchantInfo.value.merchant_id) return
  loadingSlots.value = true
  slotsClosed.value = false
  try {
    const data = await appointmentApi.getAvailableSlots({
      merchant_id: merchantInfo.value.merchant_id,
      date: selectedDate.value,
      service_id: selectedCategory.value?.service_id || '',
    }) as any
    if (data?.closed) {
      slotsClosed.value = true
      allSlots.value = []
    } else {
      allSlots.value = data?.slots || []
    }
  } catch {
    allSlots.value = []
  } finally {
    loadingSlots.value = false
  }
}

// 每次选中日期有效时自动加载时段
watch(selectedDate, (val) => {
  if (val && selectedCategory.value) loadSlots()
})

// ── 预约入口 ──
function onBook() {
  if (!canBook.value) return

  const storedName = userStore.userInfo.realName || userStore.userInfo.nickname || ''
  const storedPhone = userStore.userInfo.phone || ''
  const storedAvatar = userStore.userInfo.avatarUrl || userStore.userInfo.avatar_url || ''

  if (storedName && storedPhone && storedAvatar) {
    // 三项均有 → 直接下单
    contactName.value = storedName
    contactPhone.value = storedPhone
    void createAppointment()
  } else {
    // 缺少信息 → 弹层补全
    contactName.value = storedName
    contactPhone.value = storedPhone
    showSheet.value = true
  }
}

async function onSubmit() {
  if (submitting.value) return
  if (!contactName.value.trim()) {
    uni.showToast({ title: '请输入联系人姓名', icon: 'none' })
    return
  }
  if (!/^1\d{10}$/.test(contactPhone.value.trim())) {
    uni.showToast({ title: '请输入正确手机号', icon: 'none' })
    return
  }
  await createAppointment()
}

async function createAppointment() {
  if (submitting.value) return
  submitting.value = true
  try {
    await appointmentApi.create({
      merchant_id: merchantInfo.value.merchant_id,
      service_id: selectedCategory.value.service_id,
      date: selectedDate.value,
      start_time: selectedTime.value,
      customer_name: contactName.value.trim(),
      customer_phone: contactPhone.value.trim(),
    }) as any
    showSheet.value = false
    uni.showToast({ title: '预约成功', icon: 'success' })
    setTimeout(() => {
      uni.switchTab({ url: '/pages/appointment/list' })
    }, 1500)
  } catch (err: any) {
    uni.showToast({ title: err?.message || '预约失败，请重试', icon: 'none' })
  } finally {
    submitting.value = false
  }
}

// ── 登录 & 数据加载 ──
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

async function loadMerchant(): Promise<string> {
  if (merchantStore.merchantInfo.merchant_id) {
    merchantInfo.value = { ...merchantStore.merchantInfo }
    return merchantStore.merchantInfo.merchant_id
  }
  const mid = userStore.userInfo.merchant_id || DEFAULT_MERCHANT_ID
  try {
    const data = await merchantApi.getInfo(mid) as any
    merchantInfo.value = data
    merchantStore.setMerchant(data)
    return data.merchant_id
  } catch {
    merchantInfo.value = {
      merchant_id: DEFAULT_MERCHANT_ID,
      name: '黑白造型工作室',
      address: '星光大道 88号2楼',
      phone: '13800000000',
      business_hours: { start: '09:00', end: '18:00' },
      status: 'active',
    }
    return DEFAULT_MERCHANT_ID
  }
}

async function init() {
  await ensureLogin()
  const mid = await loadMerchant()
  dateList.value = generateDateList()
  try {
    const data = await serviceApi.getList(mid) as any
    apiServices.value = Array.isArray(data) ? data : []
  } catch {
    apiServices.value = []
  }
}

onShow(() => { void init() })
onPullDownRefresh(async () => {
  await init()
  uni.stopPullDownRefresh()
})
</script>

<style scoped>
/* ── 容器 ── */
.container {
  min-height: 100vh;
  background: #F5F5F5;
  padding-bottom: 200rpx;
}

/* ── 英雄横幅 ── */
.hero {
  position: relative;
  height: 460rpx;
  background: #1A1A1A;
  overflow: hidden;
}

.hero-gradient {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(160deg, #2A2A2A 0%, #0A0A0A 100%);
}

.hero-body {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 0 40rpx 48rpx;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
}

.hero-left {
  flex: 1;
  margin-right: 24rpx;
}

.hero-name {
  display: block;
  font-size: 48rpx;
  font-weight: 800;
  color: #FFFFFF;
  letter-spacing: 2rpx;
  margin-bottom: 18rpx;
}

.hero-meta-row {
  display: flex;
  align-items: center;
  margin-bottom: 8rpx;
}

.hero-meta-icon {
  font-size: 24rpx;
  margin-right: 8rpx;
}

.hero-meta-text {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.75);
}

/* 员工卡片 */
.hero-staff {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 120rpx;
}

.staff-circle {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.12);
  border: 2rpx solid rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8rpx;
}

.staff-circle-icon {
  font-size: 36rpx;
  color: #FFFFFF;
}

.staff-badge-row {
  display: flex;
  align-items: center;
  margin-bottom: 6rpx;
}

.staff-star {
  font-size: 22rpx;
  color: #FFD700;
  margin-right: 4rpx;
}

.staff-score {
  font-size: 22rpx;
  color: #FFFFFF;
  font-weight: 600;
}

.staff-name {
  font-size: 24rpx;
  font-weight: 700;
  color: #FFFFFF;
  margin-bottom: 2rpx;
}

.staff-title {
  font-size: 20rpx;
  color: rgba(255, 255, 255, 0.6);
}

/* ── 通用区块 ── */
.section-block {
  margin: 24rpx 0 0;
  background: #FFFFFF;
  padding: 36rpx 0 36rpx 40rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1A1A1A;
  display: block;
  margin-bottom: 28rpx;
  padding-right: 40rpx;
}

/* ── 服务分类横滑 ── */
.svc-scroll {
  white-space: nowrap;
}

.svc-row {
  display: inline-flex;
  padding-right: 40rpx;
}

.svc-card {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 220rpx;
  min-height: 280rpx;
  border-radius: 24rpx;
  border: 2rpx solid #E8E8E8;
  background: #FAFAFA;
  margin-right: 20rpx;
  padding: 32rpx 20rpx;
  box-sizing: border-box;
}

.svc-card-on {
  background: #1A1A1A;
  border-color: #1A1A1A;
}

.svc-ico {
  font-size: 48rpx;
  margin-bottom: 16rpx;
  color: #1A1A1A;
}

.svc-card-on .svc-ico {
  color: #FFFFFF;
}

.svc-nm {
  font-size: 32rpx;
  font-weight: 700;
  color: #1A1A1A;
  margin-bottom: 10rpx;
}

.svc-card-on .svc-nm {
  color: #FFFFFF;
}

.svc-dur {
  font-size: 22rpx;
  color: #999999;
  margin-bottom: 8rpx;
}

.svc-card-on .svc-dur {
  color: rgba(255, 255, 255, 0.6);
}

.svc-price {
  font-size: 26rpx;
  font-weight: 600;
  color: #1A1A1A;
  margin-bottom: 12rpx;
}

.svc-card-on .svc-price {
  color: #FFFFFF;
}

.svc-desc {
  font-size: 20rpx;
  color: #BBBBBB;
  text-align: center;
  line-height: 1.4;
  white-space: normal;
}

.svc-card-on .svc-desc {
  color: rgba(255, 255, 255, 0.5);
}

/* ── 到店时间 ── */
.time-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-right: 40rpx;
  margin-bottom: 28rpx;
}

.time-header .section-title {
  margin-bottom: 0;
}

.time-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #1A1A1A;
}

.rest-badge {
  font-size: 22rpx;
  color: #999999;
  background: #F5F5F5;
  border-radius: 20rpx;
  padding: 6rpx 18rpx;
}

/* 日期选择 */
.date-scroll {
  white-space: nowrap;
  margin-bottom: 28rpx;
}

.date-row {
  display: inline-flex;
  padding-right: 40rpx;
}

.date-tab {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 96rpx;
  height: 96rpx;
  border-radius: 20rpx;
  background: #F5F5F5;
  margin-right: 16rpx;
}

.date-tab-on {
  background: #1A1A1A;
}

.date-tab-off {
  opacity: 0.4;
}

.date-wday {
  font-size: 20rpx;
  color: #999999;
  margin-bottom: 4rpx;
}

.date-tab-on .date-wday {
  color: rgba(255, 255, 255, 0.7);
}

.date-md {
  font-size: 26rpx;
  font-weight: 700;
  color: #1A1A1A;
}

.date-tab-on .date-md {
  color: #FFFFFF;
}

/* 时间占位提示 */
.slots-tip {
  padding: 40rpx 0;
  text-align: center;
  padding-right: 40rpx;
}

.slots-tip-text {
  font-size: 28rpx;
  color: #BBBBBB;
}

/* 时间网格 */
.time-grid {
  display: flex;
  flex-wrap: wrap;
  padding-right: 40rpx;
  gap: 16rpx;
}

.time-slot {
  width: calc(25% - 12rpx);
  height: 80rpx;
  border-radius: 16rpx;
  background: #F5F5F5;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.time-slot-on {
  background: #1A1A1A;
}

.time-slot-dim {
  opacity: 0.3;
}

.time-text {
  font-size: 26rpx;
  font-weight: 500;
  color: #1A1A1A;
}

.time-slot-on .time-text {
  color: #FFFFFF;
}

.bottom-safe {
  height: 40rpx;
}

/* ── 底部预约按钮 ── */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 20rpx 40rpx 60rpx;
  background: #FFFFFF;
  box-shadow: 0 -2rpx 20rpx rgba(0, 0, 0, 0.06);
}

.btn-book {
  background: #1A1A1A;
  border-radius: 24rpx;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-book-dim {
  opacity: 0.4;
}

.btn-book-text {
  font-size: 34rpx;
  font-weight: 700;
  color: #FFFFFF;
  letter-spacing: 4rpx;
}

/* ── 联系人弹层 ── */
.sheet-wrap {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 999;
}

.sheet-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
}

.sheet-panel {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: #FFFFFF;
  border-radius: 40rpx 40rpx 0 0;
  padding: 40rpx 40rpx 60rpx;
}

.sheet-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 40rpx;
}

.sheet-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #1A1A1A;
}

.sheet-x {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: #F5F5F5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.sheet-x-text {
  font-size: 28rpx;
  color: #666666;
}

.sheet-body {
  margin-bottom: 32rpx;
}

.field-label {
  display: block;
  font-size: 26rpx;
  font-weight: 600;
  color: #1A1A1A;
  margin-bottom: 12rpx;
}

.field-input {
  width: 100%;
  height: 96rpx;
  background: #F8F8F8;
  border-radius: 20rpx;
  padding: 0 28rpx;
  font-size: 30rpx;
  color: #1A1A1A;
  margin-bottom: 24rpx;
  box-sizing: border-box;
}

.summary-card {
  background: #F8F8F8;
  border-radius: 20rpx;
  padding: 24rpx 28rpx;
  margin-top: 12rpx;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10rpx 0;
}

.summary-key {
  font-size: 26rpx;
  color: #888888;
}

.summary-val {
  font-size: 26rpx;
  font-weight: 500;
  color: #1A1A1A;
}

.sheet-foot {
  margin-top: 8rpx;
}

.btn-confirm {
  background: #1A1A1A;
  border-radius: 24rpx;
  height: 96rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-confirm-dim {
  opacity: 0.5;
}

.btn-confirm-text {
  font-size: 32rpx;
  font-weight: 700;
  color: #FFFFFF;
  letter-spacing: 2rpx;
}
</style>
