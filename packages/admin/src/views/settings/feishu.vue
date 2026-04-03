<template>
  <div>
    <el-card>
      <template #header><span style="font-weight:600">飞书多维表格配置</span></template>
      <el-form :model="form" label-width="140px" style="max-width: 560px">
        <el-form-item label="App ID">
          <el-input v-model="form.app_id" placeholder="飞书应用 App ID" />
        </el-form-item>
        <el-form-item label="App Secret">
          <el-input v-model="form.app_secret" type="password" show-password placeholder="飞书应用 App Secret" />
        </el-form-item>
        <el-form-item label="多维表格 Token">
          <el-input v-model="form.app_token" placeholder="多维表格 Token（如 tblxxx）" />
        </el-form-item>
        <el-divider>数据表绑定</el-divider>
        <el-form-item label="预约表 Token">
          <el-input v-model="form.table_tokens.appointments" placeholder="预约表 Token" />
        </el-form-item>
        <el-form-item label="交易表 Token">
          <el-input v-model="form.table_tokens.transactions" placeholder="交易表 Token（选填）" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveConfig">保存配置</el-button>
          <el-button @click="testConnection" :loading="testing">测试连接</el-button>
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
const form = ref({
  app_id: '',
  app_secret: '',
  app_token: '',
  table_tokens: { appointments: '', transactions: '' },
})
const testing = ref(false)
const testResult = ref('')
const testSuccess = ref(false)

async function loadConfig() {
  try {
    const res = await merchantApi.getInfo(authStore.user.merchantId) as any
    if (res?.feishu_config) {
      form.value = { ...form.value, ...res.feishu_config }
      if (res.feishu_config.table_tokens) {
        form.value.table_tokens = { ...form.value.table_tokens, ...res.feishu_config.table_tokens }
      }
    }
  } catch (e) { console.error(e) }
}

async function saveConfig() {
  try {
    await merchantApi.update(authStore.user.merchantId, { feishu_config: form.value })
    ElMessage.success('配置已保存')
  } catch (e: any) { ElMessage.error(e?.response?.data?.message || '保存失败') }
}

async function testConnection() {
  testing.value = true
  testResult.value = ''
  try {
    const res = await fetch(`https://open.feishu.cn/open-apis/bitable/v1/apps/${form.value.app_token}/tables/${form.value.table_tokens.appointments}/records?page_size=1`, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${form.value.app_secret}` },
    })
    testSuccess.value = res.ok
    testResult.value = res.ok ? '飞书连接测试成功' : `连接失败: ${res.status}`
  } catch (e: any) {
    testSuccess.value = false
    testResult.value = `连接失败: ${e.message}`
  }
  testing.value = false
}

onMounted(() => loadConfig())
</script>
