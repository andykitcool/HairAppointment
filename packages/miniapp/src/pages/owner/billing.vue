<template>
  <view class="container">
    <text class="page-title">手动记账</text>

    <!-- 关联预约（选填） -->
    <view class="section">
      <text class="section-label">关联预约（选填）</text>
      <view class="form-group">
        <picker mode="date" :start="todayStr" @change="onAptDateChange">
          <view class="picker-btn">{{ aptDate || '选择日期筛选预约' }}</view>
        </picker>
      </view>
      <view v-if="aptList.length > 0" class="apt-list-mini">
        <view v-for="a in aptList" :key="a.appointment_id" class="apt-chip" :class="{ active: selectedApt?.appointment_id === a.appointment_id }" @tap="selectApt(a)">
          <text class="apt-chip-text">{{ a.customer_name }} · {{ a.start_time }} · {{ a.service_name }}</text>
        </view>
      </view>
    </view>

    <!-- 客户信息 -->
    <view class="section">
      <text class="section-label">客户信息</text>
      <view class="form-group">
        <text class="form-label">客户姓名 *</text>
        <input class="form-input" v-model="form.customer_name" placeholder="输入客户姓名" />
      </view>
    </view>

    <!-- 服务明细 -->
    <view class="section">
      <view class="section-header">
        <text class="section-label">服务明细</text>
        <text class="link-text" @tap="addItem">+ 添加</text>
      </view>
      <view v-for="(item, idx) in form.items" :key="idx" class="item-row">
        <input class="item-input item-name" v-model="item.service_name" placeholder="服务名称" />
        <input class="item-input item-price" type="digit" v-model="item.priceYuan" placeholder="金额(元)" />
        <input class="item-input item-qty" type="number" v-model="item.quantity" placeholder="数量" />
        <text class="item-del" @tap="removeItem(idx)">×</text>
      </view>
      <view v-if="form.items.length === 0" class="hint"><text class="hint-text">请添加至少一项服务</text></view>
    </view>

    <!-- 支付方式 -->
    <view class="section">
      <text class="section-label">支付方式</text>
      <view class="pay-grid">
        <view v-for="m in payMethods" :key="m.key"
          class="pay-item" :class="{ active: form.payment_method === m.key }"
          @tap="form.payment_method = m.key">
          <text class="pay-text">{{ m.label }}</text>
        </view>
      </view>
    </view>

    <!-- 备注 -->
    <view class="section">
      <text class="section-label">备注（选填）</text>
      <textarea class="form-textarea" v-model="form.note" placeholder="备注信息" maxlength="200" />
    </view>

    <!-- 合计 & 提交 -->
    <view class="bottom-bar">
      <view class="total-row">
        <text class="total-label">合计：</text>
        <text class="total-amount">¥{{ totalYuan }}</text>
      </view>
      <button class="btn-submit" @tap="onSubmit">确认记账</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { transactionApi, appointmentApi } from '@/api/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const today = new Date()
const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`

const aptDate = ref('')
const aptList = ref<any[]>([])
const selectedApt = ref<any>(null)

const payMethods = [
  { key: 'wechat', label: '微信' }, { key: 'alipay', label: '支付宝' },
  { key: 'cash', label: '现金' }, { key: 'stored_value', label: '储值' },
  { key: 'punch_card', label: '次卡' }, { key: 'other', label: '其他' },
]

const form = ref({
  customer_name: '',
  items: [{ service_name: '', priceYuan: '', quantity: '1' }],
  payment_method: 'cash',
  note: '',
})

const totalYuan = computed(() => {
  let total = 0
  for (const item of form.value.items) {
    total += (Number(item.priceYuan) || 0) * (Number(item.quantity) || 0)
  }
  return total.toFixed(2)
})

function addItem() {
  form.value.items.push({ service_name: '', priceYuan: '', quantity: '1' })
}

function removeItem(idx: number) {
  form.value.items.splice(idx, 1)
}

async function onAptDateChange(e: any) {
  aptDate.value = e.detail.value
  selectedApt.value = null
  try {
    const data = await appointmentApi.getList({
      merchant_id: userStore.userInfo.merchantId, date: aptDate.value, status: 'completed', pageSize: 20,
    }) as any
    aptList.value = data?.list || (Array.isArray(data) ? data : [])
  } catch { aptList.value = [] }
}

function selectApt(apt: any) {
  selectedApt.value = apt
  form.value.customer_name = apt.customer_name
}

async function onSubmit() {
  if (!form.value.customer_name.trim()) return uni.showToast({ title: '请输入客户姓名', icon: 'none' })
  const validItems = form.value.items.filter(i => i.service_name.trim() && Number(i.priceYuan) > 0)
  if (validItems.length === 0) return uni.showToast({ title: '请至少添加一项有效服务', icon: 'none' })

  const items = validItems.map(i => ({
    service_name: i.service_name.trim(),
    amount: Math.round(Number(i.priceYuan) * 100),
    quantity: Number(i.quantity) || 1,
  }))
  const totalAmount = items.reduce((s, i) => s + i.amount * i.quantity, 0)

  try {
    await transactionApi.create({
      merchant_id: userStore.userInfo.merchantId,
      appointment_id: selectedApt.value?.appointment_id || undefined,
      customer_name: form.value.customer_name.trim(),
      staff_id: '',
      total_amount: totalAmount,
      items,
      payment_method: form.value.payment_method,
      note: form.value.note.trim() || undefined,
    })
    uni.showToast({ title: '记账成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 1500)
  } catch (err: any) {
    uni.showToast({ title: err.message || '记账失败', icon: 'none' })
  }
}
</script>

<style scoped>
.container { min-height: 100vh; background: var(--color-bg, #F5F5F5); padding: 30rpx; padding-bottom: 200rpx; }
.page-title { font-size: 34rpx; font-weight: 700; color: #1A1A1A; display: block; margin-bottom: 30rpx; }
.section { margin-bottom: 30rpx; background: #fff; border-radius: 16rpx; padding: 24rpx; }
.section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.section-label { font-size: 28rpx; font-weight: 600; color: #1A1A1A; display: block; margin-bottom: 16rpx; }
.section-header .section-label { margin-bottom: 0; }
.link-text { font-size: 26rpx; color: #000; font-weight: 500; }
.picker-btn { background: #F5F5F5; padding: 16rpx 20rpx; border-radius: 12rpx; font-size: 28rpx; color: #1A1A1A; }
.form-group { margin-bottom: 16rpx; }
.form-label { font-size: 24rpx; color: #666; display: block; margin-bottom: 8rpx; }
.form-input { width: 100%; height: 76rpx; background: #F5F5F5; border-radius: 12rpx; padding: 0 20rpx; font-size: 28rpx; }
.form-textarea { width: 100%; height: 120rpx; background: #F5F5F5; border-radius: 12rpx; padding: 20rpx; font-size: 28rpx; }
.apt-list-mini { max-height: 200rpx; overflow-y: auto; }
.apt-chip { padding: 14rpx 16rpx; border-radius: 8rpx; margin-bottom: 8rpx; border: 2rpx solid transparent; }
.apt-chip.active { border-color: #000; background: #F5F5F5; }
.apt-chip-text { font-size: 24rpx; color: #333; }
.item-row { display: flex; align-items: center; gap: 12rpx; margin-bottom: 12rpx; }
.item-input { height: 68rpx; background: #F5F5F5; border-radius: 10rpx; padding: 0 14rpx; font-size: 26rpx; }
.item-name { flex: 2; }
.item-price { flex: 1.2; }
.item-qty { flex: 0.8; }
.item-del { font-size: 36rpx; color: #FA5151; padding: 0 8rpx; }
.pay-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12rpx; }
.pay-item { padding: 16rpx; border-radius: 10rpx; text-align: center; border: 2rpx solid #E0E0E0; }
.pay-item.active { border-color: #000; background: #F5F5F5; }
.pay-text { font-size: 26rpx; color: #333; }
.hint { text-align: center; padding: 20rpx 0; }
.hint-text { font-size: 26rpx; color: #999; }
.bottom-bar { position: fixed; bottom: 0; left: 0; right: 0; background: #fff; padding: 20rpx 30rpx; padding-bottom: calc(20rpx + env(safe-area-inset-bottom)); box-shadow: 0 -2rpx 10rpx rgba(0,0,0,0.05); }
.total-row { display: flex; justify-content: flex-end; align-items: baseline; margin-bottom: 16rpx; }
.total-label { font-size: 28rpx; color: #666; }
.total-amount { font-size: 36rpx; font-weight: 700; color: #1A1A1A; }
.btn-submit { width: 100%; height: 88rpx; background: #000; color: #fff; border-radius: 44rpx; font-size: 30rpx; font-weight: 600; border: none; }
.btn-submit::after { border: none; }
</style>
