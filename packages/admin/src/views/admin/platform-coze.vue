<template>
  <el-card>
    <template #header>
      <span style="font-weight: 600">平台 AI 发型推荐配置</span>
    </template>

    <el-form :model="form" label-width="120px" style="max-width: 760px" v-loading="loading">
      <el-form-item label="启用状态">
        <el-switch v-model="form.enabled" />
      </el-form-item>
      <el-form-item label="API Key">
        <el-input v-model="form.api_key" type="password" show-password placeholder="请输入火山引擎 API Key" />
      </el-form-item>
      <el-form-item label="模型">
        <el-select v-model="form.model" placeholder="请选择模型" style="width: 100%">
          <el-option label="doubao-seedream-5-0-260128" value="doubao-seedream-5-0-260128" />
          <el-option label="doubao-seedream-5-0-250928" value="doubao-seedream-5-0-250928" />
          <el-option label="doubao-seedream-4.5" value="doubao-seedream-4.5" />
          <el-option label="doubao-seedream-4-0-250828" value="doubao-seedream-4-0-250828" />
          <el-option label="doubao-seedream-3.0-t2i" value="doubao-seedream-3.0-t2i" />
        </el-select>
      </el-form-item>
      <el-form-item label="Prompt">
        <el-input v-model="form.prompt" type="textarea" :rows="6" placeholder="请输入推荐发型效果图生成提示词" />
      </el-form-item>
      <el-form-item label="尺寸">
        <el-select v-model="form.size" placeholder="请选择尺寸" style="width: 100%">
          <el-option label="1K" value="1K" />
          <el-option label="2K" value="2K" />
          <el-option label="4K" value="4K" />
        </el-select>
      </el-form-item>
      <el-form-item label="接口说明">
        <el-text type="info">使用火山引擎图片生成接口，当前按单图输出配置。</el-text>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :loading="saving" @click="save">保存配置</el-button>
      </el-form-item>
    </el-form>
  </el-card>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { adminApi } from '@/api/request'

const loading = ref(false)
const saving = ref(false)
const form = reactive({
  enabled: false,
  api_key: '',
  model: 'doubao-seedream-5-0-260128',
  prompt: '',
  size: '2K',
})

async function loadData() {
  loading.value = true
  try {
    const res: any = await adminApi.getPlatformCoze()
    const data = res?.data || res || {}
    form.enabled = !!data.enabled
    form.api_key = data.api_key || ''
    form.model = data.model === 'doubao-seedream-4.0' ? 'doubao-seedream-4-0-250828' : (data.model || 'doubao-seedream-5-0-260128')
    form.prompt = data.prompt || ''
    form.size = data.size || '2K'
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

async function save() {
  saving.value = true
  try {
    await adminApi.updatePlatformCoze({ ...form })
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
