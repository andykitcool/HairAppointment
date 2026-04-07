<template>
  <view class="container">
    <!-- ── 门店卡片 ── -->
    <view class="merchant-card">
      <view
        class="merchant-card-inner"
        :style="{
          paddingTop: statusBarHeight + 12 + 'px',
          backgroundImage: displaySettings.hero_image ? `url(${displaySettings.hero_image})` : 'none',
        }"
      >
        <view class="merchant-card-mask" :style="heroMaskStyle"></view>
        <view class="merchant-card-left">
          <view class="merchant-name-row" @tap="openMerchantPicker">
            <text class="merchant-name">{{ merchantInfo.merchant_id ? merchantInfo.name : '初始化中...' }}</text>
            <view class="merchant-switch-btn" :style="themeSoftBgStyle">
              <text class="merchant-switch-icon" :style="themeTextStyle">⇄</text>
            </view>
          </view>
          <view class="merchant-addr-row" v-if="merchantInfo.address">
            <text class="merchant-meta-icon">📍</text>
            <text class="merchant-meta-text">{{ merchantInfo.address }}</text>
          </view>
          <view class="merchant-hours-row">
            <text class="merchant-meta-icon">🕐</text>
            <text class="merchant-meta-text">{{ todayBusinessLabel }}</text>
          </view>
        </view>
        <!-- 右侧：头像在上，称呼+电话在下 -->
        <view class="merchant-card-right">
          <image v-if="displaySettings.owner_avatar" class="owner-avatar-lg" :src="displaySettings.owner_avatar" mode="aspectFill" />
          <view v-else class="owner-avatar-lg owner-avatar-placeholder-lg" :style="themeSoftBgStyle">
            <text class="owner-avatar-placeholder-text" :style="themeTextStyle">店</text>
          </view>
          <view class="owner-bottom-row">
            <text class="owner-title">{{ displaySettings.owner_title || '店长' }}</text>
            <view class="phone-action" :style="themeSoftBgStyle" @tap="onCallMerchant">
              <text class="phone-icon" :style="themeTextStyle">☎</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- ── 预约项目（横向滑动卡片）── -->
    <view class="section-block">
      <view class="section-head-row">
        <text class="section-title">预约项目</text>
        <view class="notice-wrap">
          <view class="notice-track">
            <text class="notice-text">{{ marqueeText }}</text>
            <text class="notice-text notice-gap">{{ marqueeText }}</text>
          </view>
        </view>
      </view>
      <view v-if="displayServices.length === 0" class="slots-tip">
        <text class="slots-tip-text">暂无可预约服务，请联系门店配置</text>
      </view>
      <scroll-view scroll-x class="svc-scroll">
        <view class="svc-row">
          <view
            v-for="svc in displayServices"
            :key="svc.service_id"
            class="svc-card"
            :class="{ 'svc-card-on': selectedCategory?.service_id === svc.service_id }"
            :style="selectedCategory?.service_id === svc.service_id ? selectedServiceCardStyle : null"
            @tap="onSelectCategory(svc)"
          >
            <view class="svc-head">
              <text class="svc-ico">{{ svc.icon }}</text>
              <text class="svc-price">{{ svc.apiPrice ? '¥' + formatPrice(svc.apiPrice) : '面议' }}</text>
            </view>
            <text class="svc-nm">{{ svc.name }}</text>
            <text class="svc-desc">{{ svc.desc }}</text>
            <view class="svc-foot">
              <text class="svc-dur">约 {{ svc.duration }} 分钟</text>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>

    <!-- ── 到店时间（选完项目后展示）── -->
    <view id="time-section" class="section-block">
      <view class="time-header">
        <text class="time-title">到店时间</text>
        <text class="rest-badge" v-if="restPeriodsText">{{ restPeriodsText }} 休息</text>
      </view>

      <!-- 日期横向选择 -->
      <scroll-view scroll-x class="date-scroll">
        <view class="date-row">
          <view
            v-for="(d, i) in dateList"
            :key="d.date"
            class="date-tab"
            :class="{ 'date-tab-on': selectedDateIndex === i, 'date-tab-off': d.closed }"
            :style="selectedDateIndex === i ? selectedDateStyle : null"
            @tap="!d.closed && selectDate(i)"
          >
            <text class="date-wday">{{ d.weekday }}</text>
            <text class="date-md">{{ d.month }}/{{ d.day }}</text>
          </view>
        </view>
      </scroll-view>

      <!-- 时间段网格 -->
      <view v-if="slotsClosed" class="slots-tip">
        <text class="slots-tip-text">当日打烊，暂不可预约</text>
      </view>
      <view v-else-if="allSlots.length === 0" class="slots-tip">
        <text class="slots-tip-text">暂无可用时段</text>
      </view>
      <view v-else class="time-groups">
        <view v-for="group in groupedSlots" :key="group.start" class="time-group">
          <text v-if="groupedSlots.length > 1" class="time-group-label">{{ group.label }}</text>
          <view class="time-grid">
            <view
              v-for="slot in group.slots"
              :key="slot.start"
              class="time-slot"
              :class="{ 'time-slot-on': selectedTime === slot.start, 'time-slot-dim': !slot.available }"
              :style="selectedTime === slot.start ? selectedTimeStyle : null"
              @tap="slot.available && selectTime(slot.start)"
            >
              <text class="time-text">{{ slot.start }}</text>
            </view>
          </view>
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
      :style="bookButtonStyle"
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

  <!-- ── 选店弹层 ── -->
  <view v-if="showMerchantPicker" class="picker-wrap">
    <view class="picker-mask" @tap="closeMerchantPicker"></view>
    <view class="picker-dialog">
      <view class="picker-head">
        <text class="picker-title">选择门店</text>
        <view class="picker-close" @tap="closeMerchantPicker">
          <text class="picker-close-text">✕</text>
        </view>
      </view>

      <!-- 搜索框 -->
      <view class="picker-search-wrap">
        <input
          class="picker-search-input"
          v-model="pickerSearch"
          placeholder="搜索门店名称"
          placeholder-class="picker-search-ph"
          @input="onPickerSearch"
          @confirm="onPickerSearch"
        />
      </view>

      <scroll-view class="picker-scroll" scroll-y="true">
        <!-- 当前门店 -->
        <view v-if="merchantInfo.merchant_id && !pickerSearch.trim()" class="picker-section">
          <text class="picker-section-title">当前门店</text>
          <view class="picker-item picker-item-active">
            <view class="picker-item-left">
              <text class="picker-item-name">{{ merchantInfo.name }}</text>
              <text class="picker-item-addr">{{ merchantInfo.address || '' }}</text>
            </view>
            <text class="picker-item-check">✓</text>
          </view>
        </view>

        <!-- 搜索结果 -->
        <view v-if="pickerSearch.trim()" class="picker-section">
          <text class="picker-section-title">搜索结果</text>
          <view v-if="pickerSearchLoading" class="picker-loading">
            <text class="picker-loading-text">搜索中...</text>
          </view>
          <view v-else-if="pickerSearchList.length === 0" class="picker-empty">
            <text class="picker-empty-text">未找到相关门店</text>
          </view>
          <view
            v-for="m in pickerSearchList"
            :key="m.merchant_id"
            class="picker-item"
            :class="{ 'picker-item-active': m.merchant_id === merchantInfo.merchant_id }"
            @tap="onSelectMerchant(m)"
          >
            <view class="picker-item-left">
              <text class="picker-item-name">{{ m.name }}</text>
              <text class="picker-item-addr">{{ m.address || '' }}</text>
            </view>
            <text v-if="m.merchant_id === merchantInfo.merchant_id" class="picker-item-check">✓</text>
          </view>
        </view>

        <!-- 附近门店 -->
        <view v-if="!pickerSearch.trim()" class="picker-section">
          <text class="picker-section-title">附近 3km 门店</text>
          <view v-if="pickerNearbyLoading" class="picker-loading">
            <text class="picker-loading-text">获取位置中...</text>
          </view>
          <view v-else-if="pickerLocationDenied" class="picker-empty">
            <text class="picker-empty-text">未授权定位，可通过搜索找到门店</text>
          </view>
          <view v-else-if="pickerNearbyList.length === 0" class="picker-empty">
            <text class="picker-empty-text">3km 内暂无其他门店</text>
          </view>
          <view
            v-for="m in pickerNearbyList"
            :key="m.merchant_id"
            class="picker-item"
            :class="{ 'picker-item-active': m.merchant_id === merchantInfo.merchant_id }"
            @tap="onSelectMerchant(m)"
          >
            <view class="picker-item-left">
              <text class="picker-item-name">{{ m.name }}</text>
              <text class="picker-item-addr">{{ m.address || '' }}</text>
            </view>
            <view class="picker-item-right">
              <text v-if="m.distance !== undefined" class="picker-item-dist">{{ m.distance < 1 ? (m.distance * 1000).toFixed(0) + 'm' : m.distance.toFixed(1) + 'km' }}</text>
              <text v-if="m.merchant_id === merchantInfo.merchant_id" class="picker-item-check">✓</text>
            </view>
          </view>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { onShow, onPullDownRefresh, onLoad, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import { serviceApi, appointmentApi, merchantApi, authApi, request } from '@/api/request'
import { useUserStore } from '@/stores/user'
import { useMerchantStore } from '@/stores/merchant'

const userStore = useUserStore()
const merchantStore = useMerchantStore()

const DEFAULT_MERCHANT_ID = 'M000001'
const incomingMerchantId = ref('')
const incomingServiceId = ref('')

// 状态栏高度（自定义导航栏时需要）
const statusBarHeight = ref(0)
try {
  const sys = uni.getSystemInfoSync()
  statusBarHeight.value = sys.statusBarHeight || 0
} catch {
  statusBarHeight.value = 0
}

const CATEGORY_ICON_MAP: Record<string, string> = {
  cut: '✂',
  perm: '〜',
  dye: '◉',
  care: '❋',
  wash: '◌',
}

const displaySettings = ref({
  hero_image: '',
  owner_avatar: '',
  owner_title: '店长',
  theme_color: '#1890ff',
  welcome_text: '欢迎预约，我们将为您提供专业服务',
})

const merchantInfo = ref<any>({
  merchant_id: '', name: '黑白造型工作室',
  address: '星光大道 88号2楼', phone: '',
  business_hours: { start: '09:00', end: '18:00' }, status: 'active',
})

const apiServices = ref<any[]>([])

// 直接使用后台服务管理内容
const displayServices = computed(() =>
  apiServices.value.map((svc: any) => ({
    service_id: svc.service_id,
    category: svc.category,
    icon: CATEGORY_ICON_MAP[svc.category] || '✦',
    name: svc.name || '服务项目',
    apiPrice: svc.price ?? null,
    duration: Number(svc.total_duration || 30),
    desc: svc.description || '专业服务',
  }))
)

// 已选服务分类
const selectedCategory = ref<any>(null)

// 日期时间
const dateList = ref<any[]>([])
const selectedDateIndex = ref(0)
const allSlots = ref<any[]>([])
const businessIntervals = ref<Array<{ start: string; end: string }>>([])
const selectedTime = ref('')
const loadingSlots = ref(false)
const slotsClosed = ref(false)

// 联系人弹层
const showSheet = ref(false)
const contactName = ref('')
const contactPhone = ref('')
const submitting = ref(false)

// ── 选店弹层 ──
const showMerchantPicker = ref(false)
const pickerSearch = ref('')
const pickerSearchList = ref<any[]>([])
const pickerSearchLoading = ref(false)
const pickerNearbyList = ref<any[]>([])
const pickerNearbyLoading = ref(false)
const pickerLocationDenied = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | null = null

// ── Computed ──
const canBook = computed(() => !!selectedCategory.value && !!selectedTime.value)
const marqueeText = computed(() => displaySettings.value.welcome_text || '欢迎预约，我们将为您提供专业服务')
const selectedDate = computed(() => dateList.value[selectedDateIndex.value]?.date || '')
const selectedDateShort = computed(() => {
  const d = dateList.value[selectedDateIndex.value]
  return d ? `${d.month}/${d.day}` : ''
})

const themeColor = computed(() => displaySettings.value.theme_color || '#1890ff')
const themeSoftBgStyle = computed(() => ({ background: hexToRgba(themeColor.value, 0.14) }))
const themeTextStyle = computed(() => ({ color: themeColor.value }))
const selectedServiceCardStyle = computed(() => ({
  background: themeColor.value,
  borderColor: themeColor.value,
}))
const selectedDateStyle = computed(() => ({ background: themeColor.value }))
const selectedTimeStyle = computed(() => ({ background: themeColor.value }))
const bookButtonStyle = computed(() => ({
  background: themeColor.value,
  boxShadow: `0 10rpx 26rpx ${hexToRgba(themeColor.value, 0.28)}`,
}))
const heroMaskStyle = computed(() => ({ background: `linear-gradient(180deg, ${hexToRgba('#000000', 0.08)}, ${hexToRgba('#000000', 0.48)})` }))
const restPeriodsText = computed(() => getRestPeriods(businessIntervals.value).join(' / '))
const groupedSlots = computed(() => {
  if (!businessIntervals.value.length) {
    return allSlots.value.length ? [{ label: '', start: '', slots: allSlots.value }] : []
  }
  return businessIntervals.value
    .map((itv) => ({
      label: intervalLabel(itv.start),
      start: itv.start,
      slots: allSlots.value.filter((slot: any) => {
        const minutes = timeToMinutes(slot.start)
        return minutes >= timeToMinutes(itv.start) && minutes < timeToMinutes(itv.end)
      }),
    }))
    .filter((group) => group.slots.length > 0)
})
const todayBusinessLabel = computed(() => {
  const intervals = getBusinessIntervals(new Date(), merchantInfo.value.business_hours)
  if (!intervals.length) return '今日休息'
  return intervals.map((it) => `${it.start}-${it.end}`).join(' / ')
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

function hexToRgba(hex: string, alpha: number): string {
  const normalized = (hex || '').replace('#', '').trim()
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    return `rgba(24, 144, 255, ${alpha})`
  }
  const r = parseInt(normalized.slice(0, 2), 16)
  const g = parseInt(normalized.slice(2, 4), 16)
  const b = parseInt(normalized.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function timeToMinutes(t: string): number {
  const [h, m] = String(t || '00:00').split(':').map(Number)
  return h * 60 + m
}

function intervalLabel(start: string): string {
  const hour = parseInt(String(start || '00:00').split(':')[0], 10)
  if (hour < 12) return '上午'
  if (hour < 18) return '下午'
  return '晚上'
}

function getRestPeriods(intervals: Array<{ start: string; end: string }>): string[] {
  if (intervals.length < 2) return []
  const sorted = [...intervals].sort((a, b) => timeToMinutes(a.start) - timeToMinutes(b.start))
  const rests: string[] = []
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const current = sorted[i]
    const next = sorted[i + 1]
    if (timeToMinutes(current.end) < timeToMinutes(next.start)) {
      rests.push(`${current.end}-${next.start}`)
    }
  }
  return rests
}

function getBusinessIntervals(date: Date, businessHours: any): Array<{ start: string; end: string }> {
  if (!businessHours || typeof businessHours !== 'object') {
    return [{ start: '09:00', end: '21:00' }]
  }
  const weekMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const dayKey = weekMap[date.getDay()]
  const day = businessHours[dayKey]
  if (!day || day.is_open === false) return []
  const slotKeys = ['morning', 'afternoon', 'evening']
  const ranges: Array<{ start: string; end: string }> = []
  slotKeys.forEach((k) => {
    const slot = day[k]
    if (!slot || slot.is_open === false || !slot.open || !slot.close) return
    ranges.push({ start: slot.open, end: slot.close })
  })
  if (ranges.length > 0) return ranges

  if (businessHours.start && businessHours.end) {
    return [{ start: businessHours.start, end: businessHours.end }]
  }

  return ranges
}

function normalizeIntervalsFromApi(businessHours: any): Array<{ start: string; end: string }> {
  if (!businessHours) return []
  if (Array.isArray(businessHours)) {
    return businessHours
      .filter((it: any) => it?.start && it?.end)
      .map((it: any) => ({ start: String(it.start), end: String(it.end) }))
  }
  if (typeof businessHours === 'object' && businessHours.start && businessHours.end) {
    return [{ start: String(businessHours.start), end: String(businessHours.end) }]
  }
  return []
}

function isWithinIntervals(time: string, intervals: Array<{ start: string; end: string }>): boolean {
  if (!intervals.length) return true
  const t = timeToMinutes(time)
  return intervals.some((it) => t >= timeToMinutes(it.start) && t < timeToMinutes(it.end))
}

function normalizeImageUrl(url: string): string {
  if (!url) return ''
  if (/^https?:\/\//.test(url)) return url
  const base = (uni.getStorageSync('api_base_url') || 'http://127.0.0.1:3100/api').replace(/\/api\/?$/, '')
  return `${base}${url}`
}

async function loadDisplaySettings(merchantId: string) {
  try {
    const data = await request.publicGet<any>(`/merchants/${merchantId}/display-settings`) as any
    const ds = data?.display_settings || {}
    displaySettings.value = {
      hero_image: normalizeImageUrl(ds.hero_image || ''),
      owner_avatar: normalizeImageUrl(ds.owner_avatar || ''),
      owner_title: ds.owner_title || '店长',
      theme_color: ds.theme_color || '#1890ff',
      welcome_text: ds.welcome_text || '欢迎预约，我们将为您提供专业服务',
    }
  } catch {
    displaySettings.value = {
      hero_image: '',
      owner_avatar: '',
      owner_title: '店长',
      theme_color: '#1890ff',
      welcome_text: '欢迎预约，我们将为您提供专业服务',
    }
  }
}

function onCallMerchant() {
  const phone = String(merchantInfo.value.phone || '').trim()
  if (!phone) {
    uni.showToast({ title: '门店电话暂未配置', icon: 'none' })
    return
  }
  uni.makePhoneCall({ phoneNumber: phone })
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
async function onSelectCategory(svc: any) {
  if (selectedCategory.value?.service_id === svc.service_id) return
  selectedCategory.value = svc
  if (selectedDate.value && merchantInfo.value.merchant_id) await loadSlots()
}

function selectDate(index: number) {
  selectedDateIndex.value = index
  selectedTime.value = ''
  loadSlots()
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
      businessIntervals.value = []
      allSlots.value = []
      selectedTime.value = ''
    } else {
      const rawSlots = data?.slots || []
      const dateObj = new Date(`${selectedDate.value}T00:00:00`)
      const merchantIntervals = getBusinessIntervals(dateObj, merchantInfo.value.business_hours)
      const apiIntervals = normalizeIntervalsFromApi(data?.business_hours)

      // 优先使用门店信息中的营业区间；若为空再退回 API 返回
      businessIntervals.value = merchantIntervals.length ? merchantIntervals : apiIntervals

      // 二次过滤，确保展示严格落在营业区间内
      allSlots.value = rawSlots.filter((slot: any) => isWithinIntervals(String(slot.start || ''), businessIntervals.value))
      if (selectedTime.value) {
        const keepSelectedTime = allSlots.value.some((slot: any) => {
          return slot.start === selectedTime.value && slot.available
        })
        if (!keepSelectedTime) selectedTime.value = ''
      }
    }
  } catch {
    businessIntervals.value = []
    allSlots.value = []
    selectedTime.value = ''
  } finally {
    loadingSlots.value = false
  }
}

// 每次选中日期有效时自动加载时段
watch(selectedDate, (val) => {
  if (val) loadSlots()
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
      uni.switchTab({ url: '/pages/index/index' })
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
  if (incomingMerchantId.value) {
    try {
      const data = await merchantApi.getInfo(incomingMerchantId.value) as any
      merchantInfo.value = data
      merchantStore.setMerchant(data)
      return data.merchant_id
    } catch {
      // ignore and fallback
    }
  }

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
  await loadDisplaySettings(mid)
  dateList.value = generateDateList()
  let preselectedByIncomingService = false
  try {
    const data = await serviceApi.getList(mid) as any
    apiServices.value = Array.isArray(data) ? data : []
  } catch {
    apiServices.value = []
  }

  if (incomingServiceId.value) {
    const matched = displayServices.value.find((svc: any) => {
      return svc.service_id === incomingServiceId.value
    })
    if (matched) {
      selectedCategory.value = matched
      preselectedByIncomingService = true
    }
  }

  if (!selectedCategory.value && displayServices.value.length > 0) {
    selectedCategory.value = displayServices.value[0]
  }

  await loadSlots()

  // 从“再次预约”进入时，自动滚动到到店时间区，减少二次操作
  if (preselectedByIncomingService) {
    await nextTick()
    setTimeout(() => {
      uni.pageScrollTo({ selector: '#time-section', duration: 280 })
    }, 60)
  }
}

onLoad((options: any) => {
  if (options?.merchant_id) {
    incomingMerchantId.value = String(options.merchant_id)
  }
  if (options?.service_id) {
    incomingServiceId.value = String(options.service_id)
  }
})

onShow(() => { void init() })
onPullDownRefresh(async () => {
  await init()
  uni.stopPullDownRefresh()
})

onShareAppMessage(() => {
  const merchantId = merchantInfo.value?.merchant_id || merchantStore.merchantInfo.merchant_id || ''
  return {
    title: merchantInfo.value?.name ? `${merchantInfo.value.name}，点击立即预约` : '推荐你这家美发门店',
    path: merchantId ? `/pages/index/index?merchant_id=${merchantId}` : '/pages/platform/index',
  }
})

onShareTimeline(() => {
  const merchantId = merchantInfo.value?.merchant_id || merchantStore.merchantInfo.merchant_id || ''
  return {
    title: merchantInfo.value?.name || '推荐一家不错的美发门店',
    query: merchantId ? `merchant_id=${merchantId}` : '',
  }
})

// ── 选店弹层逻辑 ──
function openMerchantPicker() {
  pickerSearch.value = ''
  pickerSearchList.value = []
  showMerchantPicker.value = true
  loadNearbyMerchants()
}

function closeMerchantPicker() {
  showMerchantPicker.value = false
}

async function loadNearbyMerchants() {
  pickerNearbyLoading.value = true
  pickerLocationDenied.value = false
  try {
    const location = await new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
      uni.getLocation({
        type: 'gcj02',
        success: (res) => resolve({ latitude: res.latitude, longitude: res.longitude }),
        fail: () => reject(new Error('denied')),
      })
    })
    const data = await merchantApi.nearby({ lat: location.latitude, lng: location.longitude, radius: 3 }) as any
    const list: any[] = Array.isArray(data?.list) ? data.list : []
    pickerNearbyList.value = list.filter((m: any) => m.merchant_id !== merchantInfo.value.merchant_id)
  } catch {
    pickerLocationDenied.value = true
    pickerNearbyList.value = []
  } finally {
    pickerNearbyLoading.value = false
  }
}

function onPickerSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  const keyword = pickerSearch.value.trim()
  if (!keyword) {
    pickerSearchList.value = []
    return
  }
  searchTimer = setTimeout(async () => {
    pickerSearchLoading.value = true
    try {
      const data = await merchantApi.search({ name: keyword, limit: 20 }) as any
      pickerSearchList.value = Array.isArray(data?.list) ? data.list : []
    } catch {
      pickerSearchList.value = []
    } finally {
      pickerSearchLoading.value = false
    }
  }, 400)
}

async function onSelectMerchant(m: any) {
  if (m.merchant_id === merchantInfo.value.merchant_id) {
    closeMerchantPicker()
    return
  }
  closeMerchantPicker()
  try {
    const data = await merchantApi.getInfo(m.merchant_id) as any
    merchantInfo.value = data
    merchantStore.setMerchant(data)
  } catch {
    merchantInfo.value = { ...m }
    merchantStore.setMerchant(m)
  }
  // 重置时段选择并刷新服务
  selectedCategory.value = null
  selectedTime.value = ''
  allSlots.value = []
  await loadDisplaySettings(m.merchant_id)
  try {
    const svcData = await serviceApi.getList(m.merchant_id) as any
    apiServices.value = Array.isArray(svcData) ? svcData : []
    if (displayServices.value.length > 0) {
      selectedCategory.value = displayServices.value[0]
    }
  } catch {
    apiServices.value = []
  }
}
</script>

<style scoped>
/* ── 容器 ── */
.container {
  min-height: 100vh;
  background: #F8F8F8;
  padding-bottom: 40rpx;
  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", "PingFang SC", "Helvetica Neue", sans-serif;
  font-weight: 400;
}

/* ── 门店卡片（替代原英雄横幅）── */
.merchant-card {
  background: #FFFFFF;
  border-bottom: 1rpx solid #F0F0F0;
}

.merchant-card-inner {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 0 32rpx 28rpx;
  background-size: cover;
  background-position: center;
  overflow: hidden;
}

.merchant-card-mask {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
}

.merchant-card-left {
  position: relative;
  z-index: 1;
  flex: 1;
  margin-right: 20rpx;
}

.merchant-name-row {
  display: inline-flex;
  align-items: center;
  gap: 10rpx;
  margin-bottom: 12rpx;
}

.merchant-name {
  display: block;
  font-size: 44rpx;
  font-weight: 700;
  color: #FFFFFF;
  letter-spacing: 0.5rpx;
  text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.24);
}

.merchant-addr-row,
.merchant-hours-row {
  display: flex;
  align-items: center;
  margin-bottom: 6rpx;
}

.merchant-meta-icon {
  font-size: 22rpx;
  margin-right: 8rpx;
}

.merchant-meta-text {
  font-size: 22rpx;
  font-weight: 400;
  color: rgba(255, 255, 255, 0.92);
  flex: 1;
  text-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.2);
}

.merchant-switch-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42rpx;
  height: 42rpx;
  border-radius: 50%;
  border: 1rpx solid rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(6rpx);
}

.merchant-switch-icon {
  font-size: 22rpx;
  font-weight: 600;
}

.merchant-card-right {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10rpx;
  padding-bottom: 4rpx;
}

.owner-avatar-lg {
  width: 100rpx;
  height: 100rpx;
  border-radius: 50%;
  border: 3rpx solid rgba(255, 255, 255, 0.6);
}

.owner-avatar-placeholder-lg {
  display: flex;
  align-items: center;
  justify-content: center;
}

.owner-avatar-placeholder-text {
  font-size: 28rpx;
  font-weight: 700;
}

.owner-bottom-row {
  display: flex;
  align-items: center;
  gap: 8rpx;
}

.owner-title {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.95);
  text-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.28);
  font-weight: 600;
}

.phone-action {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1rpx solid rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(6rpx);
}

.phone-icon {
  font-size: 22rpx;
  font-weight: 700;
}

/* ── 选店弹层 ── */
.picker-wrap {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.picker-mask {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.55);
}

.picker-dialog {
  position: relative;
  width: 680rpx;
  max-height: 80vh;
  background: #FFFFFF;
  border-radius: 32rpx;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.picker-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 40rpx 40rpx 24rpx;
  flex-shrink: 0;
}

.picker-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1A1A1A;
}

.picker-close {
  width: 60rpx;
  height: 60rpx;
  border-radius: 50%;
  background: #F5F5F5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.picker-close-text {
  font-size: 26rpx;
  color: #666666;
}

.picker-search-wrap {
  padding: 0 40rpx 20rpx;
  flex-shrink: 0;
}

.picker-search-input {
  width: 100%;
  height: 80rpx;
  background: #F5F5F7;
  border-radius: 20rpx;
  padding: 0 28rpx;
  font-size: 26rpx;
  color: #1A1A1A;
  box-sizing: border-box;
}

.picker-scroll {
  flex: 1;
  height: 0;
  min-height: 300rpx;
  max-height: 60vh;
}

.picker-section {
  padding: 4rpx 0 16rpx;
}

.picker-section-title {
  display: block;
  font-size: 22rpx;
  font-weight: 600;
  color: #8E8E93;
  padding: 16rpx 40rpx 8rpx;
  letter-spacing: 0.5rpx;
}

.picker-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24rpx 40rpx;
  border-bottom: 1rpx solid #F5F5F7;
}

.picker-item-active {
  background: rgba(255, 149, 0, 0.05);
}

.picker-item-left {
  flex: 1;
  margin-right: 16rpx;
}

.picker-item-name {
  display: block;
  font-size: 28rpx;
  font-weight: 600;
  color: #1A1A1A;
  margin-bottom: 6rpx;
}

.picker-item-addr {
  display: block;
  font-size: 22rpx;
  font-weight: 400;
  color: #8E8E93;
}

.picker-item-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4rpx;
}

.picker-item-dist {
  font-size: 22rpx;
  font-weight: 600;
  color: #FF9500;
}

.picker-item-check {
  font-size: 28rpx;
  font-weight: 700;
  color: #FF9500;
}

.picker-loading,
.picker-empty {
  padding: 40rpx;
  text-align: center;
}

.picker-loading-text,
.picker-empty-text {
  font-size: 24rpx;
  color: #BBBBBB;
}

/* ── 通用区块 ── */
.section-block {
  margin: 24rpx 0 0;
  background: #FFFFFF;
  padding: 36rpx 0 36rpx 40rpx;
}

.section-head-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
  padding-right: 24rpx;
}

.section-title {
  font-size: 34rpx;
  font-weight: 700;
  color: #1A1A1A;
  display: block;
  margin-bottom: 0;
  padding-right: 12rpx;
}

.notice-wrap {
  width: 300rpx;
  height: 44rpx;
  border-radius: 999rpx;
  background: rgba(0, 0, 0, 0.05);
  overflow: hidden;
  flex-shrink: 0;
  border: 1rpx solid rgba(0, 0, 0, 0.08);
}

.notice-track {
  height: 44rpx;
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
  animation: notice-marquee 7s linear infinite;
}

.notice-text {
  font-size: 20rpx;
  color: #1A1A1A;
  line-height: 44rpx;
  font-weight: 600;
  letter-spacing: 0.5rpx;
}

.notice-gap {
  margin-left: 80rpx;
}

@keyframes notice-marquee {
  0% {
    transform: translateX(100%);
  }
  100% {
    transform: translateX(-100%);
  }
}

/* ── 服务分类横滑 ── */
.svc-scroll {
  white-space: nowrap;
}

.svc-row {
  display: inline-flex;
  padding-right: 24rpx;
}

.svc-card {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-start;
  width: 208rpx;
  height: 140rpx;
  border-radius: 16rpx;
  border: 1rpx solid #E5E5EA;
  background: #FFFFFF;
  margin-right: 14rpx;
  padding: 12rpx;
  box-sizing: border-box;
}

.svc-head {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8rpx;
}

.svc-card-on {
  background: #3A3A3C;
  border-color: #3A3A3C;
}

.svc-ico {
  font-size: 30rpx;
  color: #3A3A3C;
}

.svc-card-on .svc-ico {
  color: #FFFFFF;
}

.svc-nm {
  font-size: 24rpx;
  font-weight: 600;
  color: #1A1A1A;
  margin-bottom: 4rpx;
}

.svc-card-on .svc-nm {
  color: #FFFFFF;
}

.svc-dur {
  font-size: 16rpx;
  font-weight: 500;
  color: #8E8E93;
}

.svc-card-on .svc-dur {
  color: rgba(255, 255, 255, 0.6);
}

.svc-price {
  font-size: 22rpx;
  font-weight: 700;
  color: #FF9500;
}

.svc-card-on .svc-price {
  color: #FF9500;
}

.svc-desc {
  font-size: 16rpx;
  font-weight: 500;
  color: #8E8E93;
  text-align: left;
  line-height: 1.4;
  white-space: normal;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 1;
  margin-bottom: 4rpx;
}

.svc-card-on .svc-desc {
  color: rgba(255, 255, 255, 0.7);
}

.svc-foot {
  margin-top: auto;
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-start;
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
  font-size: 34rpx;
  font-weight: 700;
  color: #1A1A1A;
}

.rest-badge {
  font-size: 20rpx;
  font-weight: 500;
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
  background: #F5F5F7;
  margin-right: 16rpx;
}

.date-tab-on {
  background: #FF9500;
}

.date-tab-off {
  opacity: 0.4;
}

.date-wday {
  font-size: 19rpx;
  font-weight: 500;
  color: #999999;
  margin-bottom: 4rpx;
}

.date-tab-on .date-wday {
  color: rgba(255, 255, 255, 0.7);
}

.date-md {
  font-size: 28rpx;
  font-weight: 600;
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
  font-size: 24rpx;
  font-weight: 500;
  color: #BBBBBB;
}

.time-groups {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  padding-right: 40rpx;
}

.time-group {
  margin-bottom: 10rpx;
}

.time-group:last-child {
  margin-bottom: 0;
}

.time-group-label {
  display: block;
  margin-bottom: 14rpx;
  font-size: 24rpx;
  color: #999999;
}

/* 时间网格 */
.time-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.time-slot {
  width: calc((100% - 48rpx) / 4);
  flex: 0 0 calc((100% - 48rpx) / 4);
  height: 80rpx;
  border-radius: 16rpx;
  background: #F5F5F7;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.time-slot-on {
  background: #FF9500;
}

.time-slot-dim {
  opacity: 0.3;
}

.time-text {
  font-size: 27rpx;
  font-weight: 600;
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
  pointer-events: none;
}

.btn-book {
  position: fixed;
  bottom: 50rpx;
  right: 40rpx;
  width: 148rpx;
  height: 72rpx;
  border-radius: 999rpx;
  background: #FF9500;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 10rpx 26rpx rgba(255, 149, 0, 0.28);
  z-index: 100;
  pointer-events: auto;
}

.btn-book-dim {
  opacity: 0.4;
}

.btn-book-text {
  font-size: 24rpx;
  font-weight: 600;
  color: #FFFFFF;
  letter-spacing: 1rpx;
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
  font-size: 34rpx;
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
  font-size: 24rpx;
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
  font-size: 28rpx;
  font-weight: 500;
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
  font-size: 24rpx;
  font-weight: 500;
  color: #888888;
}

.summary-val {
  font-size: 24rpx;
  font-weight: 600;
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
