<template>
  <view class="page">
    <text class="title">预约页已迁移</text>
    <text class="desc">请在“我的”中查看预约记录，或前往中间 TAB 预约</text>
  </view>
</template>

<script setup lang="ts">
import { onShow } from '@dcloudio/uni-app'

onShow(() => {
  uni.switchTab({ url: '/pages/index/index' })
})
</script>

<style scoped>
.page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #f6f7f8;
  padding: 24rpx;
  box-sizing: border-box;
}
.title {
  font-size: 32rpx;
  color: #1a1a1a;
  font-weight: 700;
}
.desc {
  margin-top: 14rpx;
  font-size: 24rpx;
  color: #6f7c84;
  text-align: center;
}
</style>
