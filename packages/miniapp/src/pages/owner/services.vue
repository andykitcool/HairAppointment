<template>
  <view class="container">
    <!-- 顶部操作 -->
    <view class="header-row">
      <text class="page-title">服务项目</text>
      <button class="btn-add" @tap="showForm(null)">+ 添加服务</button>
    </view>

    <!-- 服务列表 -->
    <view v-if="loading" class="loading-state"><text class="loading-text">加载中...</text></view>
    <view v-else-if="list.length === 0" class="empty-state"><text class="empty-text">暂无服务项目</text></view>
    <view v-else class="service-list">
      <view v-for="item in list" :key="item._id" class="service-card">
        <view class="card-main">
          <view class="card-left">
            <text class="service-name">{{ item.name }}</text>
            <text class="service-meta">¥{{ (item.price / 100).toFixed(0) }} · {{ item.total_duration }}分钟</text>
          </view>
          <text class="category-tag" :class="item.category">{{ categoryMap[item.category] }}</text>
        </view>
        <view class="card-actions">
          <button class="btn-sm btn-outline" @tap="showForm(item)">编辑</button>
          <button class="btn-sm btn-red" @tap="onDelete(item)">删除</button>
        </view>
      </view>
    </view>

    <!-- 弹窗表单 -->
    <view v-if="formVisible" class="modal-mask" @tap="formVisible = false">
      <view class="modal-box" @tap.stop>
        <text class="modal-title">{{ isEdit ? '编辑服务' : '添加服务' }}</text>

        <view class="form-group">
          <text class="form-label">服务名称</text>
          <input class="form-input" v-model="form.name" placeholder="如：洗剪吹" />
        </view>

        <view class="form-group">
          <text class="form-label">分类</text>
          <view class="category-picker">
            <view v-for="cat in categories" :key="cat.key"
              class="cat-item" :class="{ active: form.category === cat.key }"
              @tap="form.category = cat.key">
              <text class="cat-text">{{ cat.label }}</text>
            </view>
          </view>
        </view>

        <view class="form-row">
          <view class="form-group half">
            <text class="form-label">价格（元）</text>
            <input class="form-input" type="digit" v-model="form.priceYuan" placeholder="0" />
          </view>
          <view class="form-group half">
            <text class="form-label">时长（分钟）</text>
            <input class="form-input" type="number" v-model="form.total_duration" placeholder="0" />
          </view>
        </view>

        <view class="form-group">
          <text class="form-label">描述（选填）</text>
          <textarea class="form-textarea" v-model="form.description" placeholder="服务描述..." maxlength="200" />
        </view>

        <button class="btn-submit" @tap="onSubmit">保存</button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { serviceApi } from '@/api/request'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const loading = ref(false)
const list = ref<any[]>([])

const categoryMap: Record<string, string> = {
  cut: '剪发', perm: '烫发', dye: '染发', care: '护理',
}
const categories = [
  { key: 'cut', label: '剪发' }, { key: 'perm', label: '烫发' },
  { key: 'dye', label: '染发' }, { key: 'care', label: '护理' },
]

const formVisible = ref(false)
const isEdit = ref(false)
const editId = ref('')
const form = ref({
  name: '', category: 'cut', priceYuan: '', total_duration: '', description: '',
})

function showForm(item: any | null) {
  if (item) {
    isEdit.value = true
    editId.value = item._id
    form.value = {
      name: item.name,
      category: item.category,
      priceYuan: String(item.price / 100),
      total_duration: String(item.total_duration),
      description: item.description || '',
    }
  } else {
    isEdit.value = false
    editId.value = ''
    form.value = { name: '', category: 'cut', priceYuan: '', total_duration: '', description: '' }
  }
  formVisible.value = true
}

async function onSubmit() {
  const { name, category, priceYuan, total_duration, description } = form.value
  if (!name.trim()) return uni.showToast({ title: '请输入服务名称', icon: 'none' })
  const price = Math.round(Number(priceYuan) * 100)
  if (!price || price <= 0) return uni.showToast({ title: '请输入有效价格', icon: 'none' })
  const dur = Number(total_duration)
  if (!dur || dur <= 0) return uni.showToast({ title: '请输入有效时长', icon: 'none' })

  const body: any = {
    name: name.trim(), category, price, total_duration: dur,
    staff_busy_duration: dur, stages: [{ name, duration: dur, staff_busy: true }],
    description: description.trim() || undefined, is_active: true, sort_order: list.value.length,
  }

  try {
    if (isEdit.value) {
      await serviceApi.update(editId.value, body)
      uni.showToast({ title: '已更新', icon: 'success' })
    } else {
      body.merchant_id = userStore.userInfo.merchantId
      await serviceApi.create(body)
      uni.showToast({ title: '已添加', icon: 'success' })
    }
    formVisible.value = false
    await loadList()
  } catch (err: any) {
    uni.showToast({ title: err.message || '操作失败', icon: 'none' })
  }
}

function onDelete(item: any) {
  uni.showModal({
    title: '确认删除', content: `删除「${item.name}」？删除后不可恢复。`,
    success: async (res) => {
      if (res.confirm) {
        try {
          await serviceApi.delete(item._id)
          uni.showToast({ title: '已删除', icon: 'success' })
          await loadList()
        } catch (err: any) { uni.showToast({ title: err.message, icon: 'none' }) }
      }
    },
  })
}

async function loadList() {
  loading.value = true
  try {
    const mid = userStore.userInfo.merchantId
    const data = await serviceApi.getList(mid) as any
    list.value = Array.isArray(data) ? data : (data?.list || [])
  } catch { list.value = [] }
  finally { loading.value = false }
}

onShow(() => loadList())
</script>

<style scoped>
.container { min-height: 100vh; background: var(--color-bg, #F5F5F5); padding: 30rpx; padding-bottom: 60rpx; }
.header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30rpx; }
.page-title { font-size: 34rpx; font-weight: 700; color: #1A1A1A; }
.btn-add { font-size: 26rpx; background: #000; color: #fff; padding: 12rpx 28rpx; border-radius: 32rpx; border: none; }
.btn-add::after { border: none; }
.loading-state, .empty-state { text-align: center; padding: 80rpx 0; }
.loading-text, .empty-text { font-size: 28rpx; color: #999; }
.service-list { display: flex; flex-direction: column; gap: 16rpx; }
.service-card { background: #fff; border-radius: 16rpx; padding: 24rpx; }
.card-main { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16rpx; }
.card-left { flex: 1; min-width: 0; }
.service-name { font-size: 30rpx; font-weight: 600; color: #1A1A1A; display: block; margin-bottom: 6rpx; }
.service-meta { font-size: 26rpx; color: #999; }
.category-tag { font-size: 22rpx; padding: 6rpx 16rpx; border-radius: 8rpx; flex-shrink: 0; }
.category-tag.cut { background: #F5F5F5; color: #333; }
.category-tag.perm { background: #FFF5E6; color: #FF9500; }
.category-tag.dye { background: #E6F0FF; color: #1677FF; }
.category-tag.care { background: #E6F9EE; color: #07C160; }
.card-actions { display: flex; gap: 12rpx; }
.btn-sm { font-size: 24rpx; padding: 10rpx 24rpx; border-radius: 8rpx; line-height: 1.2; border: none; }
.btn-sm::after { border: none; }
.btn-outline { background: none; color: #1A1A1A; border: 1rpx solid #E0E0E0; }
.btn-red { background: none; color: #FA5151; border: 1rpx solid #FA5151; }

/* 弹窗 */
.modal-mask { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 999; display: flex; align-items: flex-end; }
.modal-box { width: 100%; background: #fff; border-radius: 24rpx 24rpx 0 0; padding: 40rpx 30rpx 60rpx; max-height: 80vh; overflow-y: auto; }
.modal-title { font-size: 32rpx; font-weight: 700; color: #1A1A1A; display: block; margin-bottom: 30rpx; }
.form-group { margin-bottom: 24rpx; }
.form-row { display: flex; gap: 20rpx; }
.half { flex: 1; }
.form-label { font-size: 26rpx; color: #666; display: block; margin-bottom: 10rpx; }
.form-input { width: 100%; height: 80rpx; background: #F5F5F5; border-radius: 12rpx; padding: 0 20rpx; font-size: 28rpx; }
.form-textarea { width: 100%; height: 160rpx; background: #F5F5F5; border-radius: 12rpx; padding: 20rpx; font-size: 28rpx; }
.category-picker { display: flex; gap: 16rpx; flex-wrap: wrap; }
.cat-item { padding: 12rpx 28rpx; border-radius: 24rpx; background: #F5F5F5; }
.cat-item.active { background: #000; }
.cat-text { font-size: 26rpx; color: #666; }
.cat-item.active .cat-text { color: #fff; }
.btn-submit { width: 100%; height: 88rpx; background: #000; color: #fff; border-radius: 44rpx; font-size: 30rpx; font-weight: 600; border: none; margin-top: 20rpx; }
.btn-submit::after { border: none; }
</style>
