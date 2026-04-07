<template>
  <div class="page">
    <el-card>
      <template #header>
        <div class="header-row">
          <span>AI生图配置</span>
          <el-button type="primary" :loading="saving" @click="saveSettings">保存</el-button>
        </div>
      </template>

      <el-form :model="form" label-width="140px" style="max-width: 560px" v-loading="loading">
        <el-form-item label="启用用户限额">
          <el-switch v-model="form.enabled" active-text="启用" inactive-text="不限制" />
        </el-form-item>

        <template v-if="form.enabled">
          <el-form-item label="统计周期">
            <el-radio-group v-model="form.period">
              <el-radio value="day">按天</el-radio>
              <el-radio value="month">按月</el-radio>
            </el-radio-group>
          </el-form-item>

          <el-form-item label="每用户可用次数">
            <el-input-number v-model="form.max_count" :min="1" :max="999" />
          </el-form-item>

          <el-alert
            type="info"
            :closable="false"
            show-icon
            :title="`当前策略：每个顾客用户每${form.period === 'day' ? '天' : '月'}最多可使用 ${form.max_count} 次 AI 发型推荐`"
          />
        </template>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { merchantApi } from '@/api/request'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const loading = ref(false)
const saving = ref(false)

const form = reactive({
  enabled: false,
  period: 'month' as 'day' | 'month',
  max_count: 4,
})

async function loadSettings() {
  const merchantId = authStore.user.merchantId
  if (!merchantId) return

  loading.value = true
  try {
    const res = await merchantApi.getInfo(merchantId) as any
    const data = res?.data ?? res
    const settings = data?.ai_image_settings || {}
    form.enabled = !!settings.enabled
    form.period = settings.period === 'day' ? 'day' : 'month'
    form.max_count = Math.max(1, Number(settings.max_count || 4))
  } catch (e) {
    console.error(e)
    ElMessage.error('读取配置失败')
  } finally {
    loading.value = false
  }
}

async function saveSettings() {
  const merchantId = authStore.user.merchantId
  if (!merchantId) return

  saving.value = true
  try {
    await merchantApi.update(merchantId, {
      ai_image_settings: {
        enabled: !!form.enabled,
        period: form.period === 'day' ? 'day' : 'month',
        max_count: Math.max(1, Number(form.max_count || 1)),
      },
    })
    ElMessage.success('AI生图配置已保存')
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(loadSettings)
</script>

<style scoped>
.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}
</style>
