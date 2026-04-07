<template>
  <div class="page">
    <el-card v-loading="loading">
      <template #header>
        <div class="header">
          <span>会员字典配置</span>
          <el-button type="primary" :loading="saving" @click="saveSettings">保存</el-button>
        </div>
      </template>

      <el-alert type="info" :closable="false" show-icon title="用于顾客资料中的会员卡级别下拉选项，至少保留 1 个级别。" style="margin-bottom: 16px;" />

      <div class="level-list">
        <div v-for="(item, index) in levels" :key="index" class="level-item">
          <el-input v-model="levels[index]" placeholder="请输入会员级别名称" maxlength="20" />
          <el-button type="danger" plain :disabled="levels.length <= 1" @click="removeLevel(index)">删除</el-button>
        </div>
      </div>

      <el-button plain @click="addLevel">新增级别</el-button>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { merchantApi } from '@/api/request'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const loading = ref(false)
const saving = ref(false)
const levels = ref<string[]>(['普通会员'])

async function loadSettings() {
  if (!authStore.user.merchantId) return
  loading.value = true
  try {
    const res = await merchantApi.getCustomerSettings(authStore.user.merchantId) as any
    const payload = res?.data ?? res
    const serverLevels = Array.isArray(payload?.membership_levels) ? payload.membership_levels : []
    if (serverLevels.length > 0) {
      levels.value = serverLevels
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('读取会员字典失败')
  } finally {
    loading.value = false
  }
}

function addLevel() {
  levels.value.push('')
}

function removeLevel(index: number) {
  levels.value.splice(index, 1)
}

async function saveSettings() {
  if (!authStore.user.merchantId) return

  const normalized = Array.from(new Set(levels.value.map((x) => String(x || '').trim()).filter(Boolean)))
  if (normalized.length < 1) {
    ElMessage.warning('请至少保留一个会员级别')
    return
  }

  saving.value = true
  try {
    const res = await merchantApi.updateCustomerSettings(authStore.user.merchantId, {
      membership_levels: normalized,
    }) as any
    const payload = res?.data ?? res
    levels.value = Array.isArray(payload?.membership_levels) ? payload.membership_levels : normalized
    ElMessage.success('会员字典已保存')
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

onMounted(loadSettings)
</script>

<style scoped>
.page {
  padding: 0;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.level-list {
  margin-bottom: 16px;
}

.level-item {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}
</style>
