<template>
  <el-card>
    <template #header>
      <span style="font-weight: 600">高德开放平台配置</span>
    </template>

    <el-alert
      type="info"
      :closable="false"
      show-icon
      title="用于配置高德 Web JS API 与安全参数，店长门店设置中的地图选点会直接读取这里的配置。"
      style="margin-bottom: 16px"
    />

    <el-form :model="form" label-width="150px" style="max-width: 820px" v-loading="loading">
      <el-form-item label="启用高德地图">
        <el-switch v-model="form.enabled" />
      </el-form-item>
      <el-form-item label="Web JS API Key">
        <el-input v-model="form.js_api_key" placeholder="请输入高德 Web JS API Key" />
      </el-form-item>
      <el-form-item label="Security Js Code">
        <el-input v-model="form.security_js_code" placeholder="请输入安全密钥对应的 securityJsCode" />
      </el-form-item>
      <el-form-item label="Service Host">
        <el-input v-model="form.service_host" placeholder="可选，例如 /_AMapService" />
      </el-form-item>
      <el-form-item label="Web 服务 Key">
        <el-input v-model="form.web_service_key" placeholder="可选，用于 REST 服务能力扩展" />
      </el-form-item>
      <el-form-item label="配置说明">
        <el-text type="info">若启用了高德 Web JS API 安全校验，请同时填写 Security Js Code；如已配置代理服务，可填写 Service Host。</el-text>
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
  js_api_key: '',
  security_js_code: '',
  service_host: '',
  web_service_key: '',
})

async function loadData() {
  loading.value = true
  try {
    const res: any = await adminApi.getAmapConfig()
    const data = res?.data || res || {}
    form.enabled = !!data.enabled
    form.js_api_key = data.js_api_key || ''
    form.security_js_code = data.security_js_code || ''
    form.service_host = data.service_host || ''
    form.web_service_key = data.web_service_key || ''
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    await adminApi.updateAmapConfig({ ...form })
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