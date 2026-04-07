<template>
  <view class="page">
    <view class="search-wrap">
      <input
        v-model="keyword"
        class="search-input"
        placeholder="搜索门店名称"
        confirm-type="search"
        @confirm="loadSearch"
      />
      <view v-if="keyword" class="search-clear" @tap="clearSearch">重置</view>
      <view class="search-btn" @tap="loadSearch">
        <text class="search-btn-text">查找</text>
      </view>
    </view>

    <view class="banner-wrap" v-if="ads.length">
      <swiper class="banner-swiper" :autoplay="true" :interval="3500" :duration="380" circular>
        <swiper-item v-for="ad in ads" :key="ad.ad_id" @tap="openAd(ad)">
          <image class="banner-image" :src="ad.image_url" mode="aspectFill" />
        </swiper-item>
      </swiper>
    </view>
    <view class="banner-empty" v-else>
      <text class="banner-empty-text">广告位（暂无投放）</text>
    </view>

    <view class="section ai-section">
      <view class="ai-head">
        <text class="ai-title">AI发型推荐</text>
        <text class="coze-badge" :class="{ 'coze-badge-on': cozeEnabled }">{{ cozeEnabled ? '已启用' : '未启用' }}</text>
      </view>

      <view class="ai-pair-wrap">
        <view class="ai-pair-item">
          <text class="ai-sub-title">已上传照片</text>
          <view class="ai-pair-box ai-upload-box" @tap="goHairstyleRecommend">
            <image v-if="aiSourceImage" class="ai-pair-image" :src="aiSourceImage" mode="aspectFill" />
            <view v-else class="ai-upload-placeholder">
              <view class="ai-upload-icon"></view>
            </view>
          </view>
        </view>

        <view class="ai-pair-item">
          <text class="ai-sub-title">推荐效果图</text>
          <view class="ai-pair-box">
            <image
              v-if="aiResultImage"
              class="ai-pair-image"
              :src="aiResultImage"
              mode="aspectFill"
              @tap="previewAiResult"
            />
            <view v-else class="ai-result-placeholder">
              <text class="ai-result-placeholder-text">{{ aiGenerating ? 'AI 生成中...' : '' }}</text>
            </view>
          </view>
        </view>
      </view>

      <view v-if="aiSourceImage || aiResultImage" class="ai-progress-wrap">
        <view class="ai-progress-row">
          <text class="ai-progress-text">{{ aiResultImage ? 'AI 生成完成' : (aiStatusText || 'AI 正在处理中...') }}</text>
          <text class="ai-progress-num">{{ aiResultImage ? '2/2' : '1/2' }}</text>
        </view>
      </view>
      <view v-if="aiError" class="ai-error">{{ aiError }}</view>
    </view>

    <view v-if="!keyword && locationDenied" class="location-tip">
      <view>
        <text class="location-tip-title">附近门店需要定位授权</text>
        <text class="location-tip-desc">你也可以直接搜索门店名称进入预约</text>
      </view>
      <view class="location-tip-btn" @tap="retryNearby">重新定位</view>
    </view>

    <view class="section">
      <view v-if="displayMerchantList.length" class="list-summary">
        <text class="list-summary-text">{{ searched && keyword ? '搜索结果' : '附近优选' }}</text>
        <text class="list-summary-count">共 {{ displayMerchantList.length }} 家</text>
      </view>
      <view v-if="searchLoading || nearbyLoading" class="status">加载中...</view>
      <view v-else-if="displayMerchantList.length === 0" class="status">
        {{ locationDenied ? '未授权定位，请先使用搜索' : (searched ? '未找到相关门店' : '暂无可展示门店') }}
      </view>
      <view
        v-for="m in displayMerchantList"
        :key="m.merchant_id"
        class="merchant-card"
        @tap="goMerchant(m)"
      >
        <view class="merchant-main">
          <text class="merchant-name">{{ m.name }}</text>
          <text class="merchant-addr">{{ m.address || '暂无地址' }}</text>
        </view>
        <view class="merchant-right">
          <text v-if="formatDistance(m.distance)" class="distance">{{ formatDistance(m.distance) }}</text>
          <text class="enter">去预约</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { onShow, onHide, onUnload, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import { merchantApi, platformApi, getApiEnv } from '@/api/request'
import { useMerchantStore } from '@/stores/merchant'

const merchantStore = useMerchantStore()
const AI_CLIENT_ID_KEY = 'platform_ai_client_id_v1'

const keyword = ref('')
const searchList = ref<any[]>([])
const nearbyList = ref<any[]>([])
const searchLoading = ref(false)
const nearbyLoading = ref(false)
const locationDenied = ref(false)
const searched = ref(false)
const ads = ref<any[]>([])
const cozeEnabled = ref(false)
const aiGenerating = ref(false)
const aiProgress = ref(0)
const aiStatusText = ref('')
const aiTaskId = ref('')
const aiSourceImage = ref('')
const aiResultImage = ref('')
const aiError = ref('')
let aiPollTimer: ReturnType<typeof setInterval> | null = null

function getAiClientId() {
  let clientId = String(uni.getStorageSync(AI_CLIENT_ID_KEY) || '')
  if (!clientId) {
    clientId = `c_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
    uni.setStorageSync(AI_CLIENT_ID_KEY, clientId)
  }
  return clientId
}

async function loadLatestAiFromServer() {
  try {
    const data = await platformApi.getLatestHairstyle(getAiClientId()) as any
    if (!data) return
    aiTaskId.value = String(data.task_id || '')
    aiSourceImage.value = String(data.input_image_url || '')
    aiResultImage.value = String(data.image_url || '')
    aiProgress.value = Number(data.progress || 0)
    aiStatusText.value = String(data.message || '')
    aiError.value = String(data.error_message || '')
    aiGenerating.value = data.status === 'processing' && !!aiTaskId.value && !aiResultImage.value
    if (aiTaskId.value && aiGenerating.value && !aiResultImage.value) {
      startAiPolling()
    }
  } catch {
    // ignore
  }
}

const displayMerchantList = computed(() => {
  const hasKeyword = keyword.value.trim().length > 0
  return hasKeyword ? searchList.value : nearbyList.value
})

function normalizeAdImageUrl(url: string): string {
  if (!url) return ''
  // 后台若存了 localhost，需替换为小程序当前 API 域名
  if (url.includes('localhost:3100') || url.includes('127.0.0.1:3100')) {
    const env = getApiEnv()
    const base = String(env.baseUrl || '').replace(/\/api\/?$/, '')
    const match = url.match(/\/uploads\/.*$/)
    if (base && match?.[0]) {
      return `${base}${match[0]}`
    }
  }
  return url
}

async function loadAds() {
  try {
    const res = await platformApi.getAds() as any
    const list = Array.isArray(res?.list) ? res.list : []
    ads.value = list
      .map((ad: any) => ({
        ...ad,
        image_url: normalizeAdImageUrl(String(ad.image_url || '')),
      }))
      .filter((ad: any) => !!ad.image_url)
  } catch {
    ads.value = []
  }
}

async function loadCozeConfig() {
  try {
    const res = await platformApi.getCozeConfig() as any
    cozeEnabled.value = !!res?.enabled
  } catch {
    cozeEnabled.value = false
  }
}

async function loadSearch() {
  const name = keyword.value.trim()
  if (!name) {
    searched.value = false
    searchList.value = []
    if (!nearbyList.value.length) {
      void loadNearby()
    }
    return
  }
  searched.value = true
  searchLoading.value = true
  try {
    const res = await merchantApi.search({ name, page: 1, limit: 20 }) as any
    searchList.value = res?.list || []
  } catch {
    searchList.value = []
  } finally {
    searchLoading.value = false
  }
}

async function loadNearby() {
  nearbyLoading.value = true
  locationDenied.value = false
  try {
    const loc = await new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
      uni.getLocation({
        type: 'wgs84',
        success: (res) => resolve({ latitude: res.latitude, longitude: res.longitude }),
        fail: reject,
      })
    })
    const res = await merchantApi.nearby({ lat: loc.latitude, lng: loc.longitude, radius: 3 }) as any
    nearbyList.value = res?.list || []
  } catch {
    locationDenied.value = true
    nearbyList.value = []
  } finally {
    nearbyLoading.value = false
  }
}

function goMerchant(m: any) {
  merchantStore.setMerchant(m)
  uni.navigateTo({ url: `/pages/index/index?merchant_id=${m.merchant_id}` })
}

function clearSearch() {
  keyword.value = ''
  searched.value = false
  searchList.value = []
  if (!nearbyList.value.length) {
    void loadNearby()
  }
}

function retryNearby() {
  void loadNearby()
}

function formatDistance(distance: any) {
  const value = Number(distance)
  if (!Number.isFinite(value) || value <= 0) {
    return ''
  }
  if (value < 1) {
    return `${Math.round(value * 1000)}m`
  }
  return `${value.toFixed(value < 10 ? 1 : 0)}km`
}

function openAd(ad: any) {
  const link = String(ad?.link_url || '')
  if (!link) return

  if (link.startsWith('/pages/')) {
    if (link.includes('tab=')) {
      uni.switchTab({ url: link.replace(/^.*?(\/pages\/)/, '/pages/') })
    } else {
      uni.navigateTo({ url: link })
    }
    return
  }

  if (/^https?:\/\//.test(link)) {
    uni.setClipboardData({
      data: link,
      success: () => uni.showToast({ title: '链接已复制', icon: 'none' }),
    })
  }
}

function stopAiPolling() {
  if (aiPollTimer) {
    clearInterval(aiPollTimer)
    aiPollTimer = null
  }
}

function previewAiResult() {
  if (!aiResultImage.value) return
  uni.previewImage({ urls: [aiResultImage.value] })
}

async function pollAiTaskOnce() {
  if (!aiTaskId.value) return
  try {
    const data = await platformApi.getHairstyleTask(aiTaskId.value) as any
    const progress = Number(data?.progress || 0)
    aiProgress.value = Math.min(100, Math.max(aiProgress.value, progress))
    aiStatusText.value = String(data?.message || 'AI 正在处理中...')
    if (data?.input_image_url) {
      aiSourceImage.value = String(data.input_image_url)
    }

    if (data?.status === 'done' && data?.image_url) {
      aiGenerating.value = false
      aiProgress.value = 100
      aiResultImage.value = String(data.image_url)
      aiError.value = ''
      stopAiPolling()
      return
    }

    if (data?.status === 'failed') {
      aiGenerating.value = false
      aiProgress.value = 100
      aiError.value = String(data?.error_message || 'AI 生成失败，请重试')
      stopAiPolling()
    }
  } catch (err: any) {
    aiGenerating.value = false
    aiError.value = err?.message || '查询进度失败'
    stopAiPolling()
  }
}

function startAiPolling() {
  stopAiPolling()
  aiPollTimer = setInterval(() => {
    void pollAiTaskOnce()
  }, 2000)
  void pollAiTaskOnce()
}

async function uploadAiPhoto(filePath: string) {
  const env = getApiEnv()
  const url = `${String(env.baseUrl || '').replace(/\/$/, '')}/platform/hairstyle-recommend`

  const uploadRes = await new Promise<any>((resolve, reject) => {
    uni.uploadFile({
      url,
      filePath,
      name: 'photo',
      formData: { client_id: getAiClientId() },
      success: (res) => {
        try {
          const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
          if (Number(data?.code) === 0) {
            resolve(data?.data || {})
          } else {
            reject(new Error(data?.message || '上传失败'))
          }
        } catch {
          reject(new Error('上传返回解析失败'))
        }
      },
      fail: (e) => reject(new Error(e?.errMsg || '上传失败')),
    })
  })

  const taskId = String(uploadRes?.task_id || '')
  if (!taskId) {
    throw new Error('未获取到任务ID')
  }
  aiTaskId.value = taskId
  if (uploadRes?.input_image_url) {
    aiSourceImage.value = String(uploadRes.input_image_url)
  }
}

function goHairstyleRecommend() {
  if (!cozeEnabled.value) {
    uni.showToast({ title: '平台暂未开启发型推荐', icon: 'none' })
    return
  }

  uni.chooseImage({
    count: 1,
    sizeType: ['compressed'],
    sourceType: ['album', 'camera'],
    success: async (res) => {
      const filePath = res.tempFilePaths?.[0]
      if (!filePath) return
      aiGenerating.value = true
      aiProgress.value = 8
      aiStatusText.value = '照片上传中...'
      aiError.value = ''
      aiTaskId.value = ''
      aiSourceImage.value = filePath
      aiResultImage.value = ''

      try {
        await uploadAiPhoto(filePath)
        aiProgress.value = 20
        aiStatusText.value = '上传成功，AI 正在生成效果图...'
        startAiPolling()
      } catch (err: any) {
        aiGenerating.value = false
        aiProgress.value = 100
        aiError.value = err?.message || '发起任务失败'
        uni.showToast({ title: aiError.value.slice(0, 30), icon: 'none' })
      }
    },
  })
}

onShow(() => {
  void loadLatestAiFromServer()
  void loadAds()
  void loadCozeConfig()
  if (!nearbyList.value.length) {
    void loadNearby()
  }
})

onHide(() => {
  stopAiPolling()
})

onUnload(() => {
  stopAiPolling()
})

onShareAppMessage(() => {
  const currentMerchantId = merchantStore.merchantInfo.merchant_id
  if (currentMerchantId) {
    const title = merchantStore.merchantInfo.name
      ? `${merchantStore.merchantInfo.name}，点击立即预约`
      : '推荐你这家美发门店，点击立即预约'
    return {
      title,
      path: `/pages/index/index?merchant_id=${currentMerchantId}`,
    }
  }
  return {
    title: '发现附近优质美发门店，点击查看',
    path: '/pages/platform/index',
  }
})

onShareTimeline(() => {
  const currentMerchantId = merchantStore.merchantInfo.merchant_id
  if (currentMerchantId) {
    return {
      title: merchantStore.merchantInfo.name || '推荐一家不错的美发门店',
      query: `merchant_id=${currentMerchantId}`,
    }
  }
  return {
    title: '发现附近优质美发门店',
    query: '',
  }
})
</script>

<style scoped>
.page { padding: 24rpx; background: #f6f7f8; min-height: 100vh; }
.banner-wrap { margin-bottom: 18rpx; }
.banner-swiper { width: 100%; height: 260rpx; border-radius: 18rpx; overflow: hidden; }
.banner-image { width: 100%; height: 100%; }
.banner-empty {
  width: 100%;
  height: 180rpx;
  border-radius: 18rpx;
  margin-bottom: 18rpx;
  background: #ECEFF1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.banner-empty-text { color: #7a7a7a; font-size: 24rpx; }
.search-wrap { display: flex; gap: 12rpx; margin-bottom: 18rpx; align-items: center; }
.search-input { flex: 1; height: 78rpx; background: #fff; border-radius: 16rpx; padding: 0 24rpx; border: 1rpx solid #eef1f3; }
.search-clear {
  flex-shrink: 0;
  font-size: 24rpx;
  color: #5b6b73;
  padding: 0 10rpx;
}
.search-btn {
  min-width: 132rpx;
  height: 78rpx;
  border-radius: 16rpx;
  background: linear-gradient(135deg, #36c46f 0%, #2aa65d 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 16rpx rgba(42, 166, 93, 0.22);
}
.search-btn-text { color: #fff; font-size: 26rpx; font-weight: 600; letter-spacing: 1rpx; }
.section { margin-bottom: 24rpx; background: #fff; border-radius: 18rpx; padding: 20rpx; }
.section-title { font-size: 30rpx; font-weight: 700; color: #1a1a1a; }
.coze-badge { font-size: 22rpx; color: #999; background: #f2f2f2; border-radius: 999rpx; padding: 6rpx 14rpx; }
.coze-badge-on { color: #149647; background: #EAF7EE; }
.ai-section { padding-top: 18rpx; }
.ai-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14rpx;
}
.ai-title { display: block; font-size: 28rpx; color: #1c2a31; font-weight: 700; }
.ai-sub-title { display: block; font-size: 24rpx; color: #54636b; margin-bottom: 10rpx; }
.ai-pair-wrap {
  display: flex;
  gap: 14rpx;
  margin-bottom: 16rpx;
}
.ai-pair-item {
  flex: 1;
}
.ai-pair-image {
  width: 100%;
  height: 100%;
  border-radius: 12rpx;
  border: 1rpx solid #edf1f2;
  background: #f5f6f7;
  display: block;
  object-fit: cover;
}
.ai-pair-box {
  width: 100%;
  position: relative;
  overflow: hidden;
  border-radius: 12rpx;
}
.ai-upload-box { cursor: pointer; }
.ai-pair-box::before {
  content: '';
  display: block;
  padding-top: 100%;
}
.ai-pair-box image,
.ai-pair-box .ai-upload-placeholder,
.ai-pair-box .ai-result-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border-radius: 12rpx;
}
.ai-upload-placeholder {
  border: 1rpx dashed #d5dde2;
  background: #f7f8fa;
  display: flex;
  align-items: center;
  justify-content: center;
}
.ai-upload-icon {
  width: 120rpx;
  height: 120rpx;
  background: transparent;
  border-radius: 2rpx;
  position: relative;
}
.ai-upload-icon::before,
.ai-upload-icon::after {
  content: '';
  position: absolute;
  background: #b7b7b7;
  border-radius: 3rpx;
}
.ai-upload-icon::before {
  width: 52rpx;
  height: 4rpx;
  left: 34rpx;
  top: 58rpx;
}
.ai-upload-icon::after {
  width: 4rpx;
  height: 52rpx;
  left: 58rpx;
  top: 34rpx;
}
.ai-result-placeholder {
  border: 1rpx solid #edf1f2;
  background-color: #f2f2f2;
  background-image:
    linear-gradient(45deg, #ffffff 25%, transparent 25%),
    linear-gradient(-45deg, #ffffff 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ffffff 75%),
    linear-gradient(-45deg, transparent 75%, #ffffff 75%);
  background-size: 28rpx 28rpx;
  background-position: 0 0, 0 14rpx, 14rpx -14rpx, -14rpx 0;
}
.ai-result-placeholder-text {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  color: #8c99a3;
  font-size: 22rpx;
  background: rgba(255, 255, 255, 0.78);
  border-radius: 999rpx;
  padding: 6rpx 14rpx;
}
.ai-progress-wrap {
  background: #f8fbfa;
  border: 1rpx solid #e5f1ec;
  border-radius: 14rpx;
  padding: 16rpx;
  margin-bottom: 14rpx;
}
.ai-progress-bar {
  width: 100%;
  height: 16rpx;
  background: #eaf0ed;
  border-radius: 999rpx;
  overflow: hidden;
}
.ai-progress-inner {
  height: 100%;
  background: linear-gradient(90deg, #35c26b 0%, #23a15b 100%);
}
.ai-progress-row {
  margin-top: 12rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.ai-progress-text { font-size: 23rpx; color: #466158; }
.ai-progress-num { font-size: 23rpx; color: #1c8f4f; font-weight: 600; }
.ai-error {
  margin: 10rpx 0 14rpx;
  padding: 16rpx;
  border-radius: 12rpx;
  background: #fff3f3;
  color: #da3b35;
  font-size: 24rpx;
}
.ai-reason {
  display: block;
  margin-top: 8rpx;
  font-size: 24rpx;
  line-height: 1.7;
  color: #3a4a53;
}
.location-tip {
  margin-bottom: 24rpx;
  padding: 20rpx 22rpx;
  border-radius: 18rpx;
  background: linear-gradient(135deg, #fff5e8 0%, #fffaf2 100%);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 18rpx;
}
.location-tip-title { display: block; font-size: 26rpx; color: #8b4c12; font-weight: 600; }
.location-tip-desc { display: block; margin-top: 6rpx; font-size: 22rpx; color: #b16b2d; }
.location-tip-btn {
  flex-shrink: 0;
  padding: 14rpx 20rpx;
  border-radius: 999rpx;
  background: #fff;
  color: #8b4c12;
  font-size: 23rpx;
  font-weight: 600;
}
.list-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}
.list-summary-text { font-size: 25rpx; color: #2d3b42; font-weight: 600; }
.list-summary-count { font-size: 22rpx; color: #7c8b92; }
.status { color: #999; font-size: 24rpx; padding: 22rpx 0; }
.merchant-card { display: flex; justify-content: space-between; align-items: center; padding: 18rpx 0; border-bottom: 1rpx solid #f0f0f0; }
.merchant-main { flex: 1; margin-right: 16rpx; }
.merchant-name { display: block; font-size: 28rpx; color: #111; font-weight: 600; margin-bottom: 6rpx; }
.merchant-addr { display: block; font-size: 23rpx; color: #777; }
.merchant-right { display: flex; flex-direction: column; align-items: flex-end; }
.distance { font-size: 22rpx; color: #34c759; margin-bottom: 6rpx; }
.enter { font-size: 24rpx; color: #333; }
</style>
