<template>
  <div class="wechat-config-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>微信配置管理</span>
          <el-button type="primary" @click="showCreateDialog = true">添加配置</el-button>
        </div>
      </template>

      <el-alert
        title="配置说明"
        type="info"
        description="服务号用于后台管理员微信扫码登录功能。配置服务号后，需要在微信公众平台设置服务器URL为：https://您的域名/api/wechat/message"
        show-icon
        :closable="false"
        style="margin-bottom: 20px"
      />

      <el-table :data="configs" v-loading="loading" border>
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="row.type === 'service' ? 'success' : 'primary'">
              {{ row.type === 'service' ? '服务号' : '小程序' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="appid" label="AppID" min-width="200" />
        <el-table-column prop="token" label="Token" width="120">
          <template #default="{ row }">
            <el-tag v-if="row.token" type="success">已设置</el-tag>
            <el-tag v-else type="info">未设置</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="encoding_aes_key" label="EncodingAESKey" width="150">
          <template #default="{ row }">
            <el-tag v-if="row.encoding_aes_key" type="success">已设置</el-tag>
            <el-tag v-else type="info">未设置</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="is_active" label="状态" width="100">
          <template #default="{ row }">
            <el-switch
              v-model="row.is_active"
              @change="(val: boolean) => handleStatusChange(row, val)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="update_time" label="更新时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.update_time) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 创建配置对话框 -->
    <el-dialog v-model="showCreateDialog" title="添加微信配置" width="500px" destroy-on-close>
      <el-form :model="createForm" :rules="formRules" ref="createFormRef" label-width="140px">
        <el-form-item label="配置类型" prop="type">
          <el-radio-group v-model="createForm.type">
            <el-radio label="service">服务号</el-radio>
            <el-radio label="mp">小程序</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="AppID" prop="appid">
          <el-input v-model="createForm.appid" placeholder="请输入微信AppID" />
        </el-form-item>
        <el-form-item label="AppSecret" prop="app_secret">
          <el-input v-model="createForm.app_secret" type="password" placeholder="请输入微信AppSecret" show-password />
        </el-form-item>
        <el-form-item label="Token" prop="token">
          <el-input v-model="createForm.token" placeholder="请输入服务器令牌Token（服务号必填）" />
          <div class="form-tip">在微信公众平台-开发-基本配置中设置服务器配置时使用</div>
        </el-form-item>
        <el-form-item label="EncodingAESKey" prop="encoding_aes_key">
          <el-input v-model="createForm.encoding_aes_key" placeholder="请输入消息加解密密钥（可选）" />
          <div class="form-tip">如启用消息加密，需填写43位字符</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleCreate">确认</el-button>
      </template>
    </el-dialog>

    <!-- 编辑配置对话框 -->
    <el-dialog v-model="showEditDialog" title="编辑微信配置" width="500px" destroy-on-close>
      <el-form :model="editForm" ref="editFormRef" label-width="140px">
        <el-form-item label="AppID">
          <el-input v-model="editForm.appid" disabled />
        </el-form-item>
        <el-form-item label="AppSecret">
          <el-input v-model="editForm.app_secret" type="password" placeholder="留空则不修改" show-password />
        </el-form-item>
        <el-form-item label="Token">
          <el-input v-model="editForm.token" placeholder="请输入服务器令牌Token" />
        </el-form-item>
        <el-form-item label="EncodingAESKey">
          <el-input v-model="editForm.encoding_aes_key" placeholder="请输入消息加解密密钥" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleUpdate">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { wechatConfigApi } from '@/api/request'

const loading = ref(false)
const configs = ref<any[]>([])
const submitting = ref(false)

// 创建对话框
const showCreateDialog = ref(false)
const createFormRef = ref()
const createForm = reactive({
  type: 'service' as 'service' | 'mp',
  appid: '',
  app_secret: '',
  token: '',
  encoding_aes_key: '',
})

const formRules = {
  type: [{ required: true, message: '请选择配置类型', trigger: 'change' }],
  appid: [{ required: true, message: '请输入AppID', trigger: 'blur' }],
  app_secret: [{ required: true, message: '请输入AppSecret', trigger: 'blur' }],
  token: [{ required: true, message: '请输入Token', trigger: 'blur' }],
}

// 编辑对话框
const showEditDialog = ref(false)
const editFormRef = ref()
const editForm = reactive({
  _id: '',
  appid: '',
  app_secret: '',
  token: '',
  encoding_aes_key: '',
})

// 获取配置列表
async function fetchConfigs() {
  loading.value = true
  try {
    const res: any = await wechatConfigApi.getList()
    if (res.code === 0) {
      configs.value = res.data || []
    }
  } catch (error) {
    ElMessage.error('获取配置列表失败')
  } finally {
    loading.value = false
  }
}

// 创建配置
async function handleCreate() {
  const valid = await createFormRef.value?.validate().catch(() => false)
  if (!valid) return

  submitting.value = true
  try {
    const res: any = await wechatConfigApi.create({
      type: createForm.type,
      appid: createForm.appid.trim(),
      app_secret: createForm.app_secret.trim(),
      token: createForm.token.trim(),
      encoding_aes_key: createForm.encoding_aes_key.trim(),
    })
    if (res.code === 0) {
      ElMessage.success('创建成功')
      showCreateDialog.value = false
      // 重置表单
      createForm.type = 'service'
      createForm.appid = ''
      createForm.app_secret = ''
      createForm.token = ''
      createForm.encoding_aes_key = ''
      fetchConfigs()
    } else {
      ElMessage.error(res.message || '创建失败')
    }
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '创建失败')
  } finally {
    submitting.value = false
  }
}

// 编辑配置
function handleEdit(row: any) {
  editForm._id = row._id
  editForm.appid = row.appid
  editForm.app_secret = ''
  editForm.token = row.token === '***已设置***' ? '' : row.token
  editForm.encoding_aes_key = row.encoding_aes_key === '***已设置***' ? '' : row.encoding_aes_key
  showEditDialog.value = true
}

async function handleUpdate() {
  submitting.value = true
  try {
    const data: any = {}
    if (editForm.app_secret) data.app_secret = editForm.app_secret.trim()
    if (editForm.token) data.token = editForm.token.trim()
    if (editForm.encoding_aes_key) data.encoding_aes_key = editForm.encoding_aes_key.trim()

    const res: any = await wechatConfigApi.update(editForm._id, data)
    if (res.code === 0) {
      ElMessage.success('更新成功')
      showEditDialog.value = false
      fetchConfigs()
    } else {
      ElMessage.error(res.message || '更新失败')
    }
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '更新失败')
  } finally {
    submitting.value = false
  }
}

// 删除配置
async function handleDelete(row: any) {
  try {
    await ElMessageBox.confirm('确定要删除该配置吗？', '提示', {
      type: 'warning',
    })
    const res: any = await wechatConfigApi.delete(row._id)
    if (res.code === 0) {
      ElMessage.success('删除成功')
      fetchConfigs()
    } else {
      ElMessage.error(res.message || '删除失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.response?.data?.message || '删除失败')
    }
  }
}

// 状态切换
async function handleStatusChange(row: any, val: boolean) {
  try {
    const res: any = await wechatConfigApi.update(row._id, { is_active: val })
    if (res.code === 0) {
      ElMessage.success(val ? '已启用' : '已禁用')
    } else {
      row.is_active = !val
      ElMessage.error(res.message || '操作失败')
    }
  } catch (error: any) {
    row.is_active = !val
    ElMessage.error(error?.response?.data?.message || '操作失败')
  }
}

// 格式化日期
function formatDate(date: string) {
  if (!date) return '-'
  return new Date(date).toLocaleString()
}

onMounted(() => {
  fetchConfigs()
})
</script>

<style scoped>
.wechat-config-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}
</style>
