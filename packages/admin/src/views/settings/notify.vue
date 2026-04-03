<template>
  <div>
    <el-card>
      <template #header><span style="font-weight:600">消息通知配置</span></template>
      <el-form :model="form" label-width="120px" style="max-width: 560px">
        <el-form-item label="通知渠道" required>
          <el-radio-group v-model="form.channel">
            <el-radio value="wechat_subscribe">微信订阅消息</el-radio>
            <el-radio value="sms">短信</el-radio>
            <el-radio value="both">两者兼用</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-divider v-if="form.channel !== 'wechat_subscribe'">短信配置</el-divider>
        <template v-if="form.channel !== 'wechat_subscribe'">
          <el-form-item label="短信服务商">
            <el-select v-model="form.sms_config.provider" style="width: 100%">
              <el-option label="阿里云短信" value="aliyun" />
              <el-option label="腾讯云短信" value="tencent" />
            </el-select>
          </el-form-item>
          <el-form-item label="Access Key ID">
            <el-input v-model="form.sms_config.access_key_id" placeholder="短信服务商 Access Key ID" />
          </el-form-item>
          <el-form-item label="Access Key Secret">
            <el-input v-model="form.sms_config.access_key_secret" type="password" show-password placeholder="短信服务商 Access Key Secret" />
          </el-form-item>
          <el-form-item label="签名">
            <el-input v-model="form.sms_config.sign_name" placeholder="短信签名" />
          </el-form-item>
          <el-form-item label="模板编码">
            <el-input v-model="form.sms_config.template_code" placeholder="短信模板编码" />
          </el-form-item>
        </template>

        <el-divider v-if="form.channel !== 'sms'">微信订阅消息配置</el-divider>
        <template v-if="form.channel !== 'sms'">
          <el-form-item label="预约确认模板">
            <el-input v-model="form.wechat_template_ids.appointment_confirm" placeholder="预约确认通知模板 ID" />
          </el-form-item>
          <el-form-item label="预约提醒模板">
            <el-input v-model="form.wechat_template_ids.appointment_remind" placeholder="预约提醒通知模板 ID" />
          </el-form-item>
          <el-form-item label="取消通知模板">
            <el-input v-model="form.wechat_template_ids.cancel_notice" placeholder="取消通知模板 ID" />
          </el-form-item>
        </template>

        <el-form-item>
          <el-button type="primary" @click="saveConfig">保存配置</el-button>
        </el-form-item>
      </el-form>
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
  channel: 'wechat_subscribe' as string,
  sms_config: { provider: 'aliyun', access_key_id: '', access_key_secret: '', sign_name: '', template_code: '' },
  wechat_template_ids: { appointment_confirm: '', appointment_remind: '', cancel_notice: '' },
})

async function loadConfig() {
  try {
    const res = await merchantApi.getInfo(authStore.user.merchantId) as any
    if (res?.notify_config) {
      form.value = { ...form.value, ...res.notify_config }
      if (res.notify_config.sms_config) form.value.sms_config = { ...form.value.sms_config, ...res.notify_config.sms_config }
      if (res.notify_config.wechat_template_ids) form.value.wechat_template_ids = { ...form.value.wechat_template_ids, ...res.notify_config.wechat_template_ids }
    }
  } catch (e) { console.error(e) }
}

async function saveConfig() {
  try {
    await merchantApi.update(authStore.user.merchantId, { notify_config: form.value })
    ElMessage.success('配置已保存')
  } catch (e: any) { ElMessage.error(e?.response?.data?.message || '保存失败') }
}

onMounted(() => loadConfig())
</script>
