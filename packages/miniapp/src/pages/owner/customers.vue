<template>
  <view class="container">
    <text class="page-title">顾客管理</text>

    <!-- 搜索 -->
    <view class="search-bar">
      <input class="search-input" v-model="keyword" placeholder="搜索姓名/电话" @confirm="onSearch" />
    </view>

    <!-- 列表 -->
    <view v-if="loading" class="loading-state"><text class="loading-text">加载中...</text></view>
    <view v-else-if="list.length === 0" class="empty-state"><text class="empty-text">暂无顾客</text></view>
    <view v-else class="customer-list">
      <view v-for="item in list" :key="item._id" class="customer-card" @tap="showDetail(item)">
        <view class="card-avatar">
          <image v-if="item.avatar_url" class="avatar-img" :src="item.avatar_url" mode="aspectFill" />
          <text v-else class="avatar-text">{{ (item.nickname || item.real_name || '?')[0] }}</text>
        </view>
        <view class="card-info">
          <text class="cust-name">{{ item.nickname || item.real_name || '未设置昵称' }}</text>
          <text class="cust-phone" v-if="item.phone">{{ item.phone }}</text>
          <view class="cust-stats">
            <text class="stat-item">到店 {{ item.visit_count }} 次</text>
            <text class="stat-item">消费 ¥{{ (item.total_spending / 100).toFixed(0) }}</text>
          </view>
        </view>
        <text class="arrow">›</text>
      </view>
    </view>

    <!-- 详情弹窗 -->
    <view v-if="detailVisible" class="modal-mask" @tap="detailVisible = false">
      <view class="modal-box" @tap.stop>
        <view class="detail-header">
          <view class="card-avatar big">
            <image v-if="currentCustomer?.avatar_url" class="avatar-img" :src="currentCustomer.avatar_url" mode="aspectFill" />
            <text v-else class="avatar-text">{{ (currentCustomer?.nickname || currentCustomer?.real_name || '?')[0] }}</text>
          </view>
          <view class="detail-info">
            <text class="cust-name">{{ currentCustomer?.nickname || currentCustomer?.real_name || '未设置昵称' }}</text>
            <text class="cust-phone" v-if="currentCustomer?.phone">{{ currentCustomer.phone }}</text>
          </view>
        </view>

        <view class="detail-stats">
          <view class="ds-item"><text class="ds-num">{{ currentCustomer?.visit_count || 0 }}</text><text class="ds-label">到店次数</text></view>
          <view class="ds-item"><text class="ds-num">¥{{ ((currentCustomer?.total_spending || 0) / 100).toFixed(0) }}</text><text class="ds-label">累计消费</text></view>
          <view class="ds-item"><text class="ds-num">{{ currentCustomer?.last_visit_time ? formatDate(currentCustomer.last_visit_time) : '-' }}</text><text class="ds-label">最近到店</text></view>
        </view>

        <view class="note-section">
          <text class="section-label">商户备注</text>
          <textarea class="form-textarea" v-model="merchantNote" placeholder="添加备注信息..." maxlength="500" />
          <button class="btn-save-note" @tap="saveNote">保存备注</button>
        </view>

        <view class="detail-actions" v-if="currentCustomer?.phone">
          <button class="btn-action" @tap="callPhone">拨打电话</button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { customerApi } from '@/api/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const loading = ref(false)
const list = ref<any[]>([])
const keyword = ref('')

const detailVisible = ref(false)
const currentCustomer = ref<any>(null)
const merchantNote = ref('')

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('zh-CN')
}

async function loadList() {
  loading.value = true
  try {
    const params: any = { merchant_id: userStore.userInfo.merchantId, pageSize: 50 }
    if (keyword.value.trim()) params.keyword = keyword.value.trim()
    const data = await customerApi.getList(params) as any
    list.value = data?.list || (Array.isArray(data) ? data : [])
  } catch { list.value = [] }
  finally { loading.value = false }
}

function onSearch() { loadList() }

function showDetail(item: any) {
  currentCustomer.value = item
  merchantNote.value = item.merchant_note || ''
  detailVisible.value = true
}

async function saveNote() {
  if (!currentCustomer.value) return
  try {
    await customerApi.updateMerchantNote(currentCustomer.value._id, merchantNote.value.trim())
    uni.showToast({ title: '已保存', icon: 'success' })
    currentCustomer.value.merchant_note = merchantNote.value.trim()
  } catch (err: any) { uni.showToast({ title: err.message, icon: 'none' }) }
}

function callPhone() {
  if (currentCustomer.value?.phone) {
    uni.makePhoneCall({ phoneNumber: currentCustomer.value.phone })
  }
}

onShow(() => loadList())
</script>

<style scoped>
.container { min-height: 100vh; background: var(--color-bg, #F5F5F5); padding: 30rpx; }
.page-title { font-size: 34rpx; font-weight: 700; color: #1A1A1A; display: block; margin-bottom: 20rpx; }
.search-bar { margin-bottom: 20rpx; }
.search-input { width: 100%; height: 76rpx; background: #fff; border-radius: 16rpx; padding: 0 24rpx; font-size: 28rpx; }
.loading-state, .empty-state { text-align: center; padding: 80rpx 0; }
.loading-text, .empty-text { font-size: 28rpx; color: #999; }
.customer-list { display: flex; flex-direction: column; gap: 12rpx; }
.customer-card { display: flex; align-items: center; background: #fff; border-radius: 16rpx; padding: 20rpx 24rpx; }
.card-avatar { width: 80rpx; height: 80rpx; border-radius: 50%; background: #F0F0F0; display: flex; align-items: center; justify-content: center; flex-shrink: 0; overflow: hidden; }
.card-avatar.big { width: 100rpx; height: 100rpx; }
.avatar-img { width: 100%; height: 100%; }
.avatar-text { font-size: 32rpx; font-weight: 600; color: #666; }
.card-avatar.big .avatar-text { font-size: 40rpx; }
.card-info { flex: 1; margin-left: 20rpx; min-width: 0; }
.cust-name { font-size: 28rpx; font-weight: 600; color: #1A1A1A; display: block; }
.cust-phone { font-size: 24rpx; color: #999; display: block; }
.cust-stats { display: flex; gap: 20rpx; margin-top: 6rpx; }
.stat-item { font-size: 22rpx; color: #999; }
.arrow { font-size: 36rpx; color: #CCC; margin-left: 12rpx; }

/* 弹窗 */
.modal-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 999; display: flex; align-items: center; justify-content: center; }
.modal-box { width: 85%; background: #fff; border-radius: 24rpx; padding: 40rpx 30rpx; max-height: 80vh; overflow-y: auto; }
.detail-header { display: flex; align-items: center; margin-bottom: 30rpx; }
.detail-info { margin-left: 20rpx; }
.detail-info .cust-name { font-size: 32rpx; }
.detail-stats { display: flex; justify-content: space-around; padding: 24rpx 0; border-top: 1rpx solid #F0F0F0; border-bottom: 1rpx solid #F0F0F0; margin-bottom: 24rpx; }
.ds-item { text-align: center; }
.ds-num { font-size: 28rpx; font-weight: 600; color: #1A1A1A; display: block; margin-bottom: 4rpx; }
.ds-label { font-size: 22rpx; color: #999; }
.note-section { margin-bottom: 20rpx; }
.section-label { font-size: 26rpx; font-weight: 600; color: #1A1A1A; display: block; margin-bottom: 12rpx; }
.form-textarea { width: 100%; height: 140rpx; background: #F5F5F5; border-radius: 12rpx; padding: 16rpx; font-size: 26rpx; }
.btn-save-note { font-size: 26rpx; background: #000; color: #fff; padding: 12rpx 28rpx; border-radius: 24rpx; border: none; margin-top: 16rpx; }
.btn-save-note::after { border: none; }
.detail-actions { padding-top: 16rpx; }
.btn-action { width: 100%; height: 76rpx; background: #F5F5F5; color: #1A1A1A; border-radius: 38rpx; font-size: 28rpx; border: none; }
.btn-action::after { border: none; }
</style>
