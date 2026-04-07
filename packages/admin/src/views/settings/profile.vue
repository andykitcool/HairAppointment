<template>
  <div class="profile-container">
    <el-card class="profile-card">
      <template #header>
        <div class="card-header">
          <span>个人设置</span>
        </div>
      </template>

      <el-descriptions :column="2" border v-loading="loading">
        <el-descriptions-item label="用户名">{{ profile.username }}</el-descriptions-item>
        <el-descriptions-item label="真实姓名">{{ profile.real_name }}</el-descriptions-item>
        <el-descriptions-item label="手机号">
          <span v-if="profile.phone">{{ profile.phone }}</span>
          <el-tag v-else type="info" size="small">未绑定</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="邮箱地址">
          <span v-if="profile.email">{{ profile.email }}</span>
          <el-tag v-else type="info" size="small">未绑定</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="微信绑定">
          <el-tag v-if="profile.wx_openid" type="success" size="small">已绑定</el-tag>
          <el-tag v-else type="info" size="small">未绑定</el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <div class="action-buttons">
        <el-button type="primary" @click="showPasswordDialog = true">修改密码</el-button>
        <el-button type="primary" plain @click="showPhoneDialog = true">
          {{ profile.phone ? '更换手机号' : '绑定手机号' }}
        </el-button>
        <el-button type="primary" plain @click="openEmailDialog">
          {{ profile.email ? '更换邮箱' : '绑定邮箱' }}
        </el-button>
        <el-button type="success" plain @click="showWechatDialog = true">
          {{ profile.wx_openid ? '更换微信' : '绑定微信' }}
        </el-button>
      </div>
    </el-card>

    <!-- 修改密码对话框 -->
    <el-dialog v-model="showPasswordDialog" title="修改密码" width="400px" destroy-on-close>
      <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px">
        <el-form-item label="旧密码" prop="old_password">
          <el-input v-model="passwordForm.old_password" type="password" show-password placeholder="请输入旧密码" />
        </el-form-item>
        <el-form-item label="新密码" prop="new_password">
          <el-input v-model="passwordForm.new_password" type="password" show-password placeholder="请输入新密码（至少6位）" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirm_password">
          <el-input v-model="passwordForm.confirm_password" type="password" show-password placeholder="请再次输入新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPasswordDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleChangePassword">确认修改</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showEmailDialog" :title="profile.email ? '更换邮箱' : '绑定邮箱'" width="400px" destroy-on-close>
      <el-form :model="emailForm" :rules="emailRules" ref="emailFormRef" label-width="100px">
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="emailForm.email" placeholder="请输入邮箱地址" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEmailDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleBindEmail">确认绑定</el-button>
      </template>
    </el-dialog>

    <!-- 绑定手机号对话框 -->
    <el-dialog v-model="showPhoneDialog" :title="profile.phone ? '更换手机号' : '绑定手机号'" width="400px" destroy-on-close>
      <el-form :model="phoneForm" :rules="phoneRules" ref="phoneFormRef" label-width="100px">
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="phoneForm.phone" placeholder="请输入手机号" maxlength="11" />
        </el-form-item>
        <el-form-item label="验证码" prop="code">
          <div class="code-input-wrapper">
            <el-input v-model="phoneForm.code" placeholder="请输入6位验证码" maxlength="6" />
            <el-button 
              type="primary" 
              :disabled="countdown > 0 || !phoneForm.phone" 
              @click="sendCode"
              style="margin-left: 10px; white-space: nowrap;"
            >
              {{ countdown > 0 ? `${countdown}秒后重试` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPhoneDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleBindPhone">确认绑定</el-button>
      </template>
    </el-dialog>

    <!-- 绑定微信对话框 -->
    <el-dialog 
      v-model="showWechatDialog" 
      :title="profile.wx_openid ? '更换微信' : '绑定微信'" 
      width="400px" 
      destroy-on-close
      @open="onWechatDialogOpen"
      @closed="onWechatDialogClose"
    >
      <div class="wechat-bind-content">
        <p class="wechat-tips">请使用微信扫一扫功能扫描下方公众号二维码完成绑定</p>
        <div class="qr-wrapper" v-loading="qrLoading">
          <img v-if="qrCode" :src="qrCode" alt="微信绑定二维码" class="qr-code" />
          <div v-else class="qr-placeholder">
            <span style="color:#909399;font-size:14px;">二维码生成中...</span>
            <p>正在生成二维码...</p>
          </div>
        </div>
        <p class="wechat-note">二维码有效期为5分钟，请尽快扫描</p>
      </div>
      <template #footer>
        <el-button @click="showWechatDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { authApi } from '@/api/request'

const loading = ref(false)
const submitting = ref(false)
const showPasswordDialog = ref(false)
const showPhoneDialog = ref(false)
const showEmailDialog = ref(false)
const showWechatDialog = ref(false)

const profile = reactive({
  username: '',
  real_name: '',
  phone: '',
  email: '',
  wx_openid: '',
})

// 密码表单
const passwordFormRef = ref()
const passwordForm = reactive({
  old_password: '',
  new_password: '',
  confirm_password: '',
})

const validateConfirmPassword = (_rule: any, value: string, callback: Function) => {
  if (value !== passwordForm.new_password) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const passwordRules = {
  old_password: [{ required: true, message: '请输入旧密码', trigger: 'blur' }],
  new_password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度至少6位', trigger: 'blur' },
  ],
  confirm_password: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' },
  ],
}

// 手机号表单
const phoneFormRef = ref()
const phoneForm = reactive({
  phone: '',
  code: '',
})

const validatePhone = (_rule: any, value: string, callback: Function) => {
  const phoneRegex = /^1[3-9]\d{9}$/
  if (!phoneRegex.test(value)) {
    callback(new Error('请输入正确的手机号'))
  } else {
    callback()
  }
}

const phoneRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { validator: validatePhone, trigger: 'blur' },
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为6位数字', trigger: 'blur' },
  ],
}

const emailFormRef = ref()
const emailForm = reactive({
  email: '',
})

const validateEmail = (_rule: any, value: string, callback: Function) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(value)) {
    callback(new Error('请输入正确的邮箱地址'))
  } else {
    callback()
  }
}

const emailRules = {
  email: [
    { required: true, message: '请输入邮箱地址', trigger: 'blur' },
    { validator: validateEmail, trigger: 'blur' },
  ],
}

const countdown = ref(0)
let countdownTimer: number | null = null

// 二维码相关
const qrCode = ref('')
const qrLoading = ref(false)
const qrScene = ref('')
let pollTimer: number | null = null

// 获取管理员信息
async function fetchProfile() {
  loading.value = true
  try {
    const res: any = await authApi.getAdminProfile()
    if (res.code === 0 && res.data) {
      Object.assign(profile, res.data)
    }
  } catch (error) {
    ElMessage.error('获取个人信息失败')
  } finally {
    loading.value = false
  }
}

// 修改密码
async function handleChangePassword() {
  const valid = await passwordFormRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const res: any = await authApi.changePassword({
      old_password: passwordForm.old_password,
      new_password: passwordForm.new_password,
    })
    if (res.code === 0) {
      ElMessage.success('密码修改成功')
      showPasswordDialog.value = false
      // 重置表单
      passwordForm.old_password = ''
      passwordForm.new_password = ''
      passwordForm.confirm_password = ''
    } else {
      ElMessage.error(res.message || '修改失败')
    }
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '修改失败')
  } finally {
    submitting.value = false
  }
}

// 发送验证码
function sendCode() {
  const phoneRegex = /^1[3-9]\d{9}$/
  if (!phoneRegex.test(phoneForm.phone)) {
    ElMessage.error('请输入正确的手机号')
    return
  }

  // 模拟发送验证码
  ElMessage.success('验证码已发送（演示模式：请输入任意6位数字）')
  countdown.value = 60
  countdownTimer = window.setInterval(() => {
    countdown.value--
    if (countdown.value <= 0 && countdownTimer) {
      clearInterval(countdownTimer)
    }
  }, 1000)
}

// 绑定手机号
async function handleBindPhone() {
  const valid = await phoneFormRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const res: any = await authApi.bindPhone({
      phone: phoneForm.phone,
      code: phoneForm.code,
    })
    if (res.code === 0) {
      ElMessage.success('手机号绑定成功')
      profile.phone = phoneForm.phone
      showPhoneDialog.value = false
      phoneForm.phone = ''
      phoneForm.code = ''
    } else {
      ElMessage.error(res.message || '绑定失败')
    }
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '绑定失败')
  } finally {
    submitting.value = false
  }
}

function openEmailDialog() {
  emailForm.email = profile.email || ''
  showEmailDialog.value = true
}

async function handleBindEmail() {
  const valid = await emailFormRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const res: any = await authApi.bindEmail({ email: emailForm.email })
    if (res.code === 0) {
      profile.email = emailForm.email
      ElMessage.success('邮箱绑定成功')
      showEmailDialog.value = false
    } else {
      ElMessage.error(res.message || '绑定失败')
    }
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '绑定失败')
  } finally {
    submitting.value = false
  }
}

// 对话框打开时生成二维码
function onWechatDialogOpen() {
  qrCode.value = ''
  qrScene.value = ''
  generateQRCode()
}

// 对话框关闭时清理
function onWechatDialogClose() {
  qrCode.value = ''
  qrScene.value = ''
  if (pollTimer) {
    clearInterval(pollTimer)
    pollTimer = null
  }
}

// 生成微信绑定二维码
async function generateQRCode() {
  qrLoading.value = true
  try {
    const res: any = await authApi.getWechatBindQR()
    if (res.code === 0 && res.data) {
      qrCode.value = res.data.qr_code
      qrScene.value = res.data.scene
      // 开始轮询绑定状态
      startPolling()
    } else {
      ElMessage.error(res.message || '生成二维码失败')
    }
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '生成二维码失败')
  } finally {
    qrLoading.value = false
  }
}

// 轮询绑定状态
function startPolling() {
  // 清除之前的定时器
  if (pollTimer) {
    clearInterval(pollTimer)
  }
  
  // 每2秒查询一次绑定状态
  pollTimer = window.setInterval(async () => {
    try {
      const res: any = await authApi.checkWechatBindStatus(qrScene.value)
      if (res.code === 0) {
        const { status, message } = res.data
        
        if (status === 'success') {
          // 绑定成功
          clearInterval(pollTimer!)
          pollTimer = null
          ElMessage.success('微信绑定成功')
          profile.wx_openid = 'bound' // 标记为已绑定
          showWechatDialog.value = false
        } else if (status === 'expired') {
          // 二维码过期或失败
          clearInterval(pollTimer!)
          pollTimer = null
          ElMessage.warning(message || '绑定失败，请重试')
          qrCode.value = ''
        }
        // pending 和 scanned 状态继续轮询
      }
    } catch (error) {
      console.error('Polling error:', error)
    }
  }, 2000)
  
  // 5分钟后停止轮询
  setTimeout(() => {
    if (pollTimer) {
      clearInterval(pollTimer)
      pollTimer = null
      qrCode.value = ''
      ElMessage.warning('二维码已过期，请重新打开对话框')
    }
  }, 300000)
}

onMounted(() => {
  fetchProfile()
})
</script>

<style scoped>
.profile-container {
  padding: 20px;
}

.profile-card {
  max-width: 800px;
}

.card-header {
  font-size: 16px;
  font-weight: bold;
}

.action-buttons {
  margin-top: 30px;
  display: flex;
  gap: 15px;
}

.code-input-wrapper {
  display: flex;
  align-items: center;
}

.wechat-bind-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.wechat-tips {
  color: #606266;
  margin-bottom: 20px;
  text-align: center;
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
  flex-direction: column;
  align-items: center;
  color: #909399;
}

.qr-placeholder p {
  margin-top: 10px;
  font-size: 14px;
}

.wechat-note {
  font-size: 12px;
  color: #909399;
  margin-top: 10px;
}
</style>