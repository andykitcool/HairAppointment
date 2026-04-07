<template>
  <el-card>
    <template #header>
      <span style="font-weight: 600">系统邮件配置</span>
    </template>

    <el-alert
      type="info"
      :closable="false"
      show-icon
      title="用于配置平台 SMTP 发信参数，保存后可供系统邮件功能统一使用。"
      style="margin-bottom: 16px"
    />

    <el-form :model="form" label-width="130px" style="max-width: 760px" v-loading="loading">
      <el-form-item label="启用邮件发送">
        <el-switch v-model="form.enabled" />
      </el-form-item>
      <el-form-item label="SMTP Host">
        <el-input v-model="form.host" placeholder="例如：smtp.qq.com" />
      </el-form-item>
      <el-form-item label="SMTP 端口">
        <el-input-number v-model="form.port" :min="1" :max="65535" />
      </el-form-item>
      <el-form-item label="使用 SSL/TLS">
        <el-switch v-model="form.secure" />
      </el-form-item>
      <el-form-item label="SMTP 用户名">
        <el-input v-model="form.user" placeholder="邮箱账号或授权用户名" />
      </el-form-item>
      <el-form-item label="SMTP 密码/授权码">
        <el-input v-model="form.pass" type="password" show-password placeholder="请输入 SMTP 密码或授权码" />
      </el-form-item>
      <el-form-item label="发件人名称">
        <el-input v-model="form.from_name" placeholder="例如：美发预约平台" />
      </el-form-item>
      <el-form-item label="发件邮箱">
        <el-input v-model="form.from_email" placeholder="例如：noreply@example.com" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="saving" @click="save">保存配置</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { adminApi } from '@/api/request'

const loading = ref(false)
const saving = ref(false)
const form = reactive({
  enabled: false,
  host: '',
  port: 465,
  secure: true,
  user: '',
  pass: '',
  from_name: '',
  from_email: '',
})

async function loadData() {
  loading.value = true
  try {
    const res: any = await adminApi.getSystemEmailConfig()
    const data = res?.data || res || {}
    form.enabled = !!data.enabled
    form.host = data.host || ''
    form.port = Number(data.port) || 465
    form.secure = data.secure !== undefined ? !!data.secure : true
    form.user = data.user || ''
    form.pass = data.pass || ''
    form.from_name = data.from_name || ''
    form.from_email = data.from_email || ''
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    await adminApi.updateSystemEmailConfig({ ...form })
    ElMessage.success('保存成功')
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>
