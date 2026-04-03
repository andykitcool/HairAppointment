<template>
  <div>
    <el-card>
      <template #header><span style="font-weight:600">COZE 智能体配置</span></template>
      <el-form :model="form" label-width="120px" style="max-width: 560px">
        <el-form-item label="Bot ID">
          <el-input v-model="form.bot_id" placeholder="COZE 智能体 ID" />
        </el-form-item>
        <el-form-item label="API Key">
          <el-input v-model="form.api_key" type="password" show-password placeholder="COZE API Key" />
        </el-form-item>
        <el-form-item label="API 端点">
          <el-input v-model="form.api_endpoint" placeholder="https://api.coze.cn/v1/..." />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveConfig">保存配置</el-button>
          <el-button @click="testConnection" :loading="testing">测试连通性</el-button>
        </el-form-item>
      </el-form>
      <el-alert v-if="testResult" :title="testResult" :type="testSuccess ? 'success' : 'error'" show-icon style="margin-top: 16px" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { merchantApi } from '@/api/request'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const authStore = useAuthStore()
const form = ref({ bot_id: '', api_key: '', api_endpoint: '' })
const testing = ref(false)
const testResult = ref('')
const testSuccess = ref(false)

async function loadConfig() {
  try {
    const res = await merchantApi.getInfo(authStore.user.merchantId) as any
    if (res?.coze_config) form.value = { ...res.coze_config }
  } catch (e) { console.error(e) }
}

async function saveConfig() {
  try {
    await merchantApi.update(authStore.user.merchantId, { coze_config: form.value })
    ElMessage.success('配置已保存')
  } catch (e: any) { ElMessage.error(e?.response?.data?.message || '保存失败') }
}

async function testConnection() {
  testing.value = true
  testResult.value = ''
  try {
    const res = await fetch(form.value.api_endpoint || 'https://api.coze.cn/v1/chat', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${form.value.api_key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ bot_id: form.value.bot_id, user_id: 'test', query: 'test', stream: false }),
    })
    testSuccess.value = res.ok
    testResult.value = res.ok ? '连通性测试成功' : `连接失败: ${res.status}`
  } catch (e: any) {
    testSuccess.value = false
    testResult.value = `连接失败: ${e.message}`
  }
  testing.value = false
}

onMounted(() => loadConfig())
</script>
