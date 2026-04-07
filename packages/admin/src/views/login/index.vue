<template>
  <div class="login-container">
    <div class="login-card">
      <h2 class="login-title">美发预约管理系统</h2>
      <p class="login-subtitle">管理后台登录</p>
      
      <!-- 账号密码登录 -->
      <div v-if="loginType === 'password'">
        <el-form :model="form" :rules="rules" ref="formRef" @submit.prevent="handleLogin">
          <el-form-item prop="username">
            <el-input v-model="form.username" placeholder="用户名" prefix-icon="User" size="large" />
          </el-form-item>
          <el-form-item prop="password">
            <el-input v-model="form.password" type="password" placeholder="密码" prefix-icon="Lock" size="large" show-password />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" :loading="loading" size="large" style="width: 100%" @click="handleLogin">
              登录
            </el-button>
          </el-form-item>
        </el-form>
        <div class="login-switch">
          <el-link type="primary" @click="switchToWechatLogin">微信扫码登录</el-link>
        </div>
      </div>

      <!-- 微信扫码登录 -->
      <div v-else class="wechat-login">
        <div class="qr-wrapper" v-loading="qrLoading">
          <img v-if="qrCode" :src="qrCode" alt="微信登录二维码" class="qr-code" />
          <div v-else class="qr-placeholder">
            <span style="color:#909399;font-size:14px;">二维码生成中...</span>
          </div>
        </div>
        <p class="qr-tips">请使用微信扫一扫登录</p>
        <div class="login-switch">
          <el-link type="primary" @click="loginType = 'password'">账号密码登录</el-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { authApi } from '@/api/request'
import { ElMessage } from 'element-plus'

const router = useRouter()
const authStore = useAuthStore()
const loading = ref(false)
const formRef = ref()

const form = reactive({ username: '', password: '', _v: 1 })
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

// 登录类型切换
const loginType = ref<'password' | 'wechat'>('password')
const qrCode = ref('')
const qrLoading = ref(false)
const qrScene = ref('')
let pollTimer: number | null = null

async function handleLogin() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    const res = await authApi.login(form) as any
    
    if (res?.code === 0 && res?.data) {
      const userData = {
        token: res.data.token,
        role: res.data.role,
        realName: res.data.real_name,
        username: form.username,
        merchantId: res.data.merchant_id || ''
      }
      authStore.setUser(userData)
      ElMessage.success('登录成功')
      router.push('/dashboard')
    } else {
      ElMessage.error(res?.message || '登录失败')
    }
  } catch (e: any) {
    ElMessage.error(e?.message || '登录失败')
  } finally {
    loading.value = false
  }
}

// 切换到微信登录
async function switchToWechatLogin() {
  loginType.value = 'wechat'
  await generateQRCode()
}

// 生成二维码
async function generateQRCode() {
  qrLoading.value = true
  try {
    const res: any = await authApi.getWechatLoginQR()
    if (res.code === 0 && res.data) {
      qrCode.value = res.data.qr_code
      qrScene.value = res.data.scene
      // 开始轮询登录状态
      startPolling()
    } else {
      ElMessage.error(res.message || '获取二维码失败')
    }
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '获取二维码失败')
  } finally {
    qrLoading.value = false
  }
}

// 轮询登录状态
function startPolling() {
  // 清除之前的定时器
  if (pollTimer) {
    clearInterval(pollTimer)
  }
  
  // 每2秒查询一次登录状态
  pollTimer = window.setInterval(async () => {
    try {
      const res: any = await authApi.checkWechatLoginStatus(qrScene.value)
      if (res.code === 0) {
        const { status, token, role, real_name } = res.data
        
        if (status === 'success' && token) {
          // 登录成功
          clearInterval(pollTimer!)
          pollTimer = null
          
          authStore.setUser({ token, role, realName: real_name, merchantId: res.data.merchant_id || '' })
          ElMessage.success('登录成功')
          router.push('/dashboard')
        } else if (status === 'scanned') {
          // 已扫描，等待确认
          ElMessage.info('已扫描，请确认登录')
        } else if (status === 'expired') {
          // 二维码过期
          clearInterval(pollTimer!)
          pollTimer = null
          ElMessage.warning('二维码已过期，请重新获取')
          qrCode.value = ''
        }
      }
    } catch (error) {
      // 轮询出错继续尝试
      console.error('Polling error:', error)
    }
  }, 2000)
  
  // 5分钟后停止轮询
  setTimeout(() => {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
      qrCode.value = ''
      ElMessage.warning('二维码已过期，请重新获取')
    }
  }, 300000)
}

// 组件卸载时清除定时器
onUnmounted(() => {
  if (pollTimer) {
    clearInterval(pollTimer)
  }
})
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f0f2f5;
}

.login-card {
  width: 400px;
  padding: 40px;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.login-title {
  font-size: 24px;
  margin: 0 0 8px;
  text-align: center;
}

.login-subtitle {
  font-size: 14px;
  color: #999;
  margin: 0 0 30px;
  text-align: center;
}

.login-switch {
  text-align: center;
  margin-top: 20px;
}

.wechat-login {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qr-wrapper {
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 15px;
}

.qr-code {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.qr-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
}

.qr-tips {
  color: #606266;
  font-size: 14px;
  margin: 0 0 15px;
}
</style>
