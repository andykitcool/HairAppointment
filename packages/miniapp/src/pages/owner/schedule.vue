<template>
  <view class="container">
    <text class="page-title">营业设置</text>

    <!-- 营业时间 -->
    <view class="section">
      <text class="section-label">日常营业时间</text>
      <view class="time-range-row">
        <picker mode="time" :value="businessHours.start" @change="businessHours.start = $event.detail.value">
          <view class="time-btn">{{ businessHours.start }}</view>
        </picker>
        <text class="time-sep">至</text>
        <picker mode="time" :value="businessHours.end" @change="businessHours.end = $event.detail.value">
          <view class="time-btn">{{ businessHours.end }}</view>
        </picker>
      </view>
      <button class="btn-save-sm" @tap="saveBusinessHours">保存营业时间</button>
    </view>

    <!-- 延长营业 -->
    <view class="section">
      <view class="section-header">
        <text class="section-label">延长营业时间</text>
        <text class="link-text" @tap="showExtForm(null)">+ 添加</text>
      </view>
      <view v-if="extList.length === 0" class="hint"><text class="hint-text">暂无延长营业设置</text></view>
      <view v-for="(ext, idx) in extList" :key="idx" class="ext-card">
        <view class="ext-info">
          <text class="ext-dates">{{ ext.start_date }} ~ {{ ext.end_date }}</text>
          <text class="ext-time">延至 {{ ext.extended_end }}</text>
        </view>
        <text class="ext-del" @tap="deleteExt(idx)">删除</text>
      </view>
    </view>

    <!-- 休息/打烊 -->
    <view class="section">
      <view class="section-header">
        <text class="section-label">休息/打烊设置</text>
        <text class="link-text" @tap="showClosedForm">+ 添加</text>
      </view>
      <view v-if="closedList.length === 0" class="hint"><text class="hint-text">暂无打烊设置</text></view>
      <view v-for="item in closedList" :key="item._id" class="closed-card">
        <view class="closed-info">
          <text class="closed-date">{{ item.date }}</text>
          <text class="closed-detail">
            {{ item.type === 'full_day' ? '全天休息' : `${item.start_time} ~ ${item.end_time}` }}
          </text>
          <text class="closed-reason" v-if="item.reason">{{ item.reason }}</text>
        </view>
        <text class="ext-del" @tap="deleteClosed(item)">删除</text>
      </view>
    </view>

    <!-- 延长营业弹窗 -->
    <view v-if="extFormVisible" class="modal-mask" @tap="extFormVisible = false">
      <view class="modal-box" @tap.stop>
        <text class="modal-title">添加延长营业</text>
        <view class="form-group">
          <text class="form-label">开始日期</text>
          <picker mode="date" @change="extForm.start_date = $event.detail.value">
            <view class="picker-btn">{{ extForm.start_date || '选择开始日期' }}</view>
          </picker>
        </view>
        <view class="form-group">
          <text class="form-label">结束日期</text>
          <picker mode="date" @change="extForm.end_date = $event.detail.value">
            <view class="picker-btn">{{ extForm.end_date || '选择结束日期' }}</view>
          </picker>
        </view>
        <view class="form-group">
          <text class="form-label">延至时间</text>
          <picker mode="time" @change="extForm.extended_end = $event.detail.value">
            <view class="picker-btn">{{ extForm.extended_end || '选择时间' }}</view>
          </picker>
        </view>
        <button class="btn-submit" @tap="saveExtHours">保存</button>
      </view>
    </view>

    <!-- 打烊弹窗 -->
    <view v-if="closedFormVisible" class="modal-mask" @tap="closedFormVisible = false">
      <view class="modal-box" @tap.stop>
        <text class="modal-title">添加休息/打烊</text>
        <view class="form-group">
          <text class="form-label">日期</text>
          <picker mode="date" @change="closedForm.date = $event.detail.value">
            <view class="picker-btn">{{ closedForm.date || '选择日期' }}</view>
          </picker>
        </view>
        <view class="form-group">
          <text class="form-label">类型</text>
          <view class="type-picker">
            <view class="type-item" :class="{ active: closedForm.type === 'full_day' }" @tap="closedForm.type = 'full_day'">
              <text class="type-text">全天休息</text>
            </view>
            <view class="type-item" :class="{ active: closedForm.type === 'time_range' }" @tap="closedForm.type = 'time_range'">
              <text class="type-text">部分时段</text>
            </view>
          </view>
        </view>
        <view v-if="closedForm.type === 'time_range'" class="form-row">
          <view class="form-group half">
            <text class="form-label">开始时间</text>
            <picker mode="time" @change="closedForm.start_time = $event.detail.value">
              <view class="picker-btn">{{ closedForm.start_time || '选择' }}</view>
            </picker>
          </view>
          <view class="form-group half">
            <text class="form-label">结束时间</text>
            <picker mode="time" @change="closedForm.end_time = $event.detail.value">
              <view class="picker-btn">{{ closedForm.end_time || '选择' }}</view>
            </picker>
          </view>
        </view>
        <view class="form-group">
          <text class="form-label">原因（选填）</text>
          <input class="form-input" v-model="closedForm.reason" placeholder="如：店庆休息" />
        </view>
        <button class="btn-submit" @tap="saveClosedPeriod">保存</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { merchantApi } from '@/api/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const mid = userStore.userInfo.merchantId

const businessHours = ref({ start: '09:00', end: '21:00' })
const extList = ref<any[]>([])
const closedList = ref<any[]>([])

const extFormVisible = ref(false)
const extForm = ref({ start_date: '', end_date: '', extended_end: '' })

const closedFormVisible = ref(false)
const closedForm = ref({ date: '', type: 'full_day', start_time: '', end_time: '', reason: '' })

function showExtForm(_item: any | null) {
  extForm.value = { start_date: '', end_date: '', extended_end: '' }
  extFormVisible.value = true
}

function showClosedForm() {
  closedForm.value = { date: '', type: 'full_day', start_time: '', end_time: '', reason: '' }
  closedFormVisible.value = true
}

async function loadData() {
  try {
    const data = await merchantApi.getInfo(mid) as any
    if (data?.business_hours) {
      businessHours.value = data.business_hours
    }
    extList.value = data?.extended_hours || []
  } catch {}

  try {
    const cData = await merchantApi.getClosedPeriods(mid) as any
    closedList.value = Array.isArray(cData) ? cData : (cData?.list || [])
  } catch { closedList.value = [] }
}

async function saveBusinessHours() {
  try {
    await merchantApi.update(mid, { business_hours: businessHours.value })
    uni.showToast({ title: '已保存', icon: 'success' })
  } catch (err: any) { uni.showToast({ title: err.message, icon: 'none' }) }
}

async function saveExtHours() {
  const { start_date, end_date, extended_end } = extForm.value
  if (!start_date || !end_date || !extended_end) return uni.showToast({ title: '请填写完整', icon: 'none' })
  try {
    await merchantApi.setExtendedHours(mid, { start_date, end_date, extended_end })
    uni.showToast({ title: '已添加', icon: 'success' })
    extFormVisible.value = false
    await loadData()
  } catch (err: any) { uni.showToast({ title: err.message, icon: 'none' }) }
}

async function deleteExt(idx: number) {
  uni.showModal({ title: '确认删除', content: '删除此延长营业设置？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await merchantApi.deleteExtendedHours(mid, idx)
          uni.showToast({ title: '已删除', icon: 'success' })
          await loadData()
        } catch (err: any) { uni.showToast({ title: err.message, icon: 'none' }) }
      }
    },
  })
}

async function saveClosedPeriod() {
  const { date, type, start_time, end_time, reason } = closedForm.value
  if (!date) return uni.showToast({ title: '请选择日期', icon: 'none' })
  if (type === 'time_range' && (!start_time || !end_time)) return uni.showToast({ title: '请选择时间段', icon: 'none' })
  try {
    await merchantApi.createClosedPeriod(mid, {
      date, type,
      start_time: type === 'time_range' ? start_time : undefined,
      end_time: type === 'time_range' ? end_time : undefined,
      reason: reason || undefined,
    })
    uni.showToast({ title: '已添加', icon: 'success' })
    closedFormVisible.value = false
    await loadData()
  } catch (err: any) { uni.showToast({ title: err.message, icon: 'none' }) }
}

async function deleteClosed(item: any) {
  uni.showModal({ title: '确认删除', content: '删除此打烊设置？',
    success: async (res) => {
      if (res.confirm) {
        try {
          await merchantApi.deleteClosedPeriod(mid, item._id)
          uni.showToast({ title: '已删除', icon: 'success' })
          await loadData()
        } catch (err: any) { uni.showToast({ title: err.message, icon: 'none' }) }
      }
    },
  })
}

onShow(() => loadData())
</script>

<style scoped>
.container { min-height: 100vh; background: var(--color-bg, #F5F5F5); padding: 30rpx; padding-bottom: 60rpx; }
.page-title { font-size: 34rpx; font-weight: 700; color: #1A1A1A; display: block; margin-bottom: 30rpx; }
.section { background: #fff; border-radius: 16rpx; padding: 24rpx; margin-bottom: 24rpx; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.section-header .section-label { margin-bottom: 0; }
.section-label { font-size: 28rpx; font-weight: 600; color: #1A1A1A; display: block; margin-bottom: 16rpx; }
.link-text { font-size: 26rpx; color: #000; font-weight: 500; }
.time-range-row { display: flex; align-items: center; gap: 20rpx; margin-bottom: 20rpx; }
.time-btn { flex: 1; background: #F5F5F5; padding: 20rpx; border-radius: 12rpx; text-align: center; font-size: 32rpx; font-weight: 600; color: #1A1A1A; }
.time-sep { font-size: 28rpx; color: #999; }
.btn-save-sm { font-size: 26rpx; background: #000; color: #fff; padding: 12rpx 28rpx; border-radius: 24rpx; border: none; align-self: flex-end; }
.btn-save-sm::after { border: none; }
.hint { padding: 16rpx 0; }
.hint-text { font-size: 26rpx; color: #999; }
.ext-card, .closed-card { display: flex; justify-content: space-between; align-items: center; padding: 16rpx 0; border-bottom: 1rpx solid #F0F0F0; }
.ext-card:last-child, .closed-card:last-child { border-bottom: none; }
.ext-info, .closed-info { flex: 1; }
.ext-dates, .closed-date { font-size: 28rpx; color: #1A1A1A; font-weight: 500; display: block; }
.ext-time, .closed-detail { font-size: 24rpx; color: #999; display: block; }
.closed-reason { font-size: 22rpx; color: #999; display: block; }
.ext-del { font-size: 32rpx; color: #FA5151; padding: 10rpx; }

/* 弹窗 */
.modal-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 999; display: flex; align-items: flex-end; }
.modal-box { width: 100%; background: #fff; border-radius: 24rpx 24rpx 0 0; padding: 40rpx 30rpx 60rpx; max-height: 80vh; overflow-y: auto; }
.modal-title { font-size: 32rpx; font-weight: 700; color: #1A1A1A; display: block; margin-bottom: 30rpx; }
.form-group { margin-bottom: 24rpx; }
.form-row { display: flex; gap: 20rpx; }
.half { flex: 1; }
.form-label { font-size: 26rpx; color: #666; display: block; margin-bottom: 10rpx; }
.picker-btn { background: #F5F5F5; padding: 20rpx; border-radius: 12rpx; font-size: 28rpx; color: #1A1A1A; }
.form-input { width: 100%; height: 76rpx; background: #F5F5F5; border-radius: 12rpx; padding: 0 20rpx; font-size: 28rpx; }
.type-picker { display: flex; gap: 16rpx; }
.type-item { flex: 1; padding: 16rpx; border-radius: 10rpx; text-align: center; border: 2rpx solid #E0E0E0; }
.type-item.active { border-color: #000; background: #F5F5F5; }
.type-text { font-size: 26rpx; color: #333; }
.btn-submit { width: 100%; height: 88rpx; background: #000; color: #fff; border-radius: 44rpx; font-size: 30rpx; font-weight: 600; border: none; margin-top: 20rpx; }
.btn-submit::after { border: none; }
</style>
