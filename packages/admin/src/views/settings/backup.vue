<template>
  <div class="page">
    <el-card>
      <template #header>
        <div class="header">数据备份</div>
      </template>

      <el-alert
        type="warning"
        show-icon
        :closable="false"
        title="点击发送后，系统会将当前门店数据库备份导出为 JSON 附件并发送到个人设置中的邮箱。"
        style="margin-bottom: 16px;"
      />

      <el-descriptions :column="1" border>
        <el-descriptions-item label="接收邮箱">
          <span v-if="profile.email">{{ profile.email }}</span>
          <el-tag v-else type="danger">未绑定邮箱</el-tag>
        </el-descriptions-item>
      </el-descriptions>

      <div class="actions">
        <el-button type="primary" :disabled="!profile.email" :loading="sending" @click="sendBackup">发送数据库备份到邮箱</el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { authApi, backupApi } from '@/api/request'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const sending = ref(false)
const profile = reactive({
  email: '',
})

async function loadProfile() {
  try {
    const res = await authApi.getAdminProfile() as any
    const data = res?.data || {}
    profile.email = data.email || ''
  } catch (e) {
    console.error(e)
  }
}

async function sendBackup() {
  if (!authStore.user.merchantId) {
    ElMessage.error('当前账号未绑定门店')
    return
  }

  sending.value = true
  try {
    const res = await backupApi.sendMerchantBackup(authStore.user.merchantId) as any
    ElMessage.success(res?.message || '备份发送成功')
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '发送失败')
  } finally {
    sending.value = false
  }
}

onMounted(loadProfile)
</script>

<style scoped>
.header {
  font-weight: 600;
}

.actions {
  margin-top: 16px;
}
</style>
