<template>
  <view class="page">
    <view class="header">
      <text class="title">AI 发型推荐</text>
      <text class="subtitle">描述你想要的发型，AI 为你生成效果图</text>
    </view>

    <!-- 提示词输入 -->
    <view class="section">
      <text class="label">发型描述（可选）</text>
      <textarea
        v-model="promptExtra"
        class="textarea"
        placeholder="例如：短发、波浪卷、清爽风格……留空则使用平台默认描述"
        maxlength="100"
        :disabled="loading"
      />
      <text class="char-count">{{ promptExtra.length }}/100</text>
    </view>

    <!-- 生成按钮 -->
    <view class="generate-btn" :class="{ disabled: loading }" @tap="generate">
      <text v-if="!loading" class="generate-btn-text">✨ 生成发型效果图</text>
      <view v-else class="loading-wrap">
        <text class="loading-text">AI 生成中，请稍候…</text>
      </view>
    </view>

    <!-- 结果展示 -->
    <view v-if="resultUrl" class="result-section">
      <text class="result-label">生成结果</text>
      <image
        class="result-image"
        :src="resultUrl"
        mode="widthFix"
        @tap="previewImage"
      />
      <view class="result-tip">
        <text>图片仅供参考，有效期 24 小时</text>
      </view>
      <view class="action-row">
        <view class="action-btn" @tap="saveImage">保存图片</view>
        <view class="action-btn action-btn-outline" @tap="reset">重新生成</view>
      </view>
    </view>

    <!-- 错误提示 -->
    <view v-if="errorMsg" class="error-tip">
      <text>{{ errorMsg }}</text>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { platformApi } from '@/api/request'
import { useMerchantStore } from '@/stores/merchant'

const promptExtra = ref('')
const loading = ref(false)
const resultUrl = ref('')
const errorMsg = ref('')
const merchantStore = useMerchantStore()

async function generate() {
  if (loading.value) return
  errorMsg.value = ''
  resultUrl.value = ''
  loading.value = true
  try {
    const merchantId = merchantStore.merchantInfo?.merchant_id || ''
    const res = await platformApi.hairstyleRecommend({
      prompt_extra: promptExtra.value.trim(),
      merchant_id: merchantId,
    }) as any
    if (res?.image_url) {
      resultUrl.value = res.image_url
    } else {
      errorMsg.value = '生成失败，请稍后重试'
    }
  } catch (err: any) {
    const msg = err?.message || err?.data?.message || '生成失败，请稍后重试'
    errorMsg.value = msg
    uni.showToast({ title: msg.slice(0, 30), icon: 'none' })
  } finally {
    loading.value = false
  }
}

function previewImage() {
  if (!resultUrl.value) return
  uni.previewImage({ urls: [resultUrl.value] })
}

function saveImage() {
  if (!resultUrl.value) return
  uni.showLoading({ title: '保存中…' })
  uni.downloadFile({
    url: resultUrl.value,
    success: (res) => {
      uni.hideLoading()
      if (res.statusCode === 200) {
        uni.saveImageToPhotosAlbum({
          filePath: res.tempFilePath,
          success: () => uni.showToast({ title: '已保存到相册', icon: 'success' }),
          fail: () => uni.showToast({ title: '保存失败，请检查相册权限', icon: 'none' }),
        })
      }
    },
    fail: () => {
      uni.hideLoading()
      uni.showToast({ title: '下载图片失败', icon: 'none' })
    },
  })
}

function reset() {
  resultUrl.value = ''
  errorMsg.value = ''
  promptExtra.value = ''
}
</script>

<style scoped>
.page {
  min-height: 100vh;
  background: #f7f8fa;
  padding: 32rpx 28rpx;
  box-sizing: border-box;
}
.header {
  margin-bottom: 36rpx;
}
.title {
  display: block;
  font-size: 40rpx;
  font-weight: 700;
  color: #1a1a1a;
}
.subtitle {
  display: block;
  font-size: 26rpx;
  color: #888;
  margin-top: 8rpx;
}
.section {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx 24rpx 16rpx;
  margin-bottom: 24rpx;
}
.label {
  display: block;
  font-size: 26rpx;
  color: #555;
  margin-bottom: 12rpx;
}
.textarea {
  width: 100%;
  min-height: 140rpx;
  font-size: 28rpx;
  color: #222;
  line-height: 1.6;
  background: #f7f8fa;
  border-radius: 10rpx;
  padding: 16rpx;
  box-sizing: border-box;
}
.char-count {
  display: block;
  text-align: right;
  font-size: 22rpx;
  color: #bbb;
  margin-top: 8rpx;
}
.generate-btn {
  background: linear-gradient(135deg, #4caf7d, #2e9a5e);
  border-radius: 48rpx;
  height: 88rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 32rpx;
}
.generate-btn.disabled {
  opacity: 0.7;
}
.generate-btn-text {
  font-size: 32rpx;
  font-weight: 600;
  color: #fff;
  letter-spacing: 2rpx;
}
.loading-wrap {
  display: flex;
  align-items: center;
  gap: 12rpx;
}
.loading-text {
  font-size: 28rpx;
  color: #fff;
}
.result-section {
  background: #fff;
  border-radius: 16rpx;
  padding: 28rpx 24rpx;
  margin-bottom: 24rpx;
}
.result-label {
  display: block;
  font-size: 26rpx;
  color: #555;
  margin-bottom: 16rpx;
}
.result-image {
  width: 100%;
  border-radius: 12rpx;
  display: block;
}
.result-tip {
  margin-top: 12rpx;
  margin-bottom: 20rpx;
}
.result-tip text {
  font-size: 22rpx;
  color: #bbb;
}
.action-row {
  display: flex;
  gap: 20rpx;
}
.action-btn {
  flex: 1;
  height: 72rpx;
  background: #4caf7d;
  border-radius: 36rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #fff;
  font-weight: 500;
}
.action-btn-outline {
  background: #fff;
  color: #4caf7d;
  border: 2rpx solid #4caf7d;
}
.error-tip {
  background: #fff3f3;
  border-radius: 12rpx;
  padding: 20rpx 24rpx;
  margin-top: 4rpx;
}
.error-tip text {
  font-size: 26rpx;
  color: #e53935;
}
</style>
