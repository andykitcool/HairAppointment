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
        <el-table-column prop="type" label="类型" min-width="80">
          <template #default="{ row }">
            <el-tag :type="row.type === 'service' ? 'success' : 'primary'">
              {{ row.type === 'service' ? '服务号' : '小程序' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="appid" label="AppID" min-width="140" show-overflow-tooltip />
        <el-table-column prop="token" label="Token" min-width="80">
          <template #default="{ row }">
            <el-tag v-if="row.token" type="success" size="small">已设置</el-tag>
            <el-tag v-else type="info" size="small">未设置</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="app_secret" label="AppSecret" min-width="90">
          <template #default="{ row }">
            <el-tag v-if="row.app_secret" type="success" size="small">已设置</el-tag>
            <el-tag v-else type="info" size="small">未设置</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="encoding_aes_key" label="AESKey" min-width="80">
          <template #default="{ row }">
            <el-tag v-if="row.encoding_aes_key" type="success" size="small">已设置</el-tag>
            <el-tag v-else type="info" size="small">未设置</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="upload_key" label="上传密钥" min-width="80">
          <template #default="{ row }">
            <el-tag v-if="row.upload_key" type="success" size="small">已设置</el-tag>
            <el-tag v-else type="info" size="small">未设置</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="is_active" label="状态" min-width="70">
          <template #default="{ row }">
            <el-switch
              v-model="row.is_active"
              @change="(val: boolean) => handleStatusChange(row, val)"
            />
          </template>
        </el-table-column>
        <el-table-column prop="update_time" label="更新时间" min-width="140">
          <template #default="{ row }">
            {{ formatDate(row.update_time) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="240" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="handleEdit(row)">编辑</el-button>
            <template v-if="row.type === 'mp'">
              <el-button type="success" link @click="showUploadDialog(row)">上传代码</el-button>
              <el-button type="warning" link @click="handleSubmit(row)">提交审核</el-button>
              <el-button type="danger" link @click="handleRelease(row)">发布</el-button>
            </template>
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
    <el-dialog v-model="showEditDialog" title="编辑微信配置" width="500px">
      <el-form :model="editForm" ref="editFormRef" label-width="140px" v-loading="editLoading">
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
        <el-form-item label="上传密钥" v-if="editForm.type === 'mp'">
          <el-input
            v-model="editForm.upload_key"
            type="textarea"
            :rows="4"
            placeholder="请输入小程序代码上传密钥（从微信小程序后台下载的 .key 文件内容）"
          />
          <div class="form-tip">用于 CI 自动上传小程序代码，在小程序后台-开发管理-开发设置-小程序代码上传中获取</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleUpdate">确认</el-button>
      </template>
    </el-dialog>

    <!-- 上传小程序代码对话框 -->
    <el-dialog v-model="showUploadCodeDialog" title="上传小程序代码" width="500px">
      <el-form :model="uploadForm" ref="uploadFormRef" label-width="100px">
        <el-form-item label="版本号" prop="version" required>
          <el-input v-model="uploadForm.version" placeholder="如: 1.0.0" />
        </el-form-item>
        <el-form-item label="版本描述" prop="desc">
          <el-input v-model="uploadForm.desc" type="textarea" :rows="3" placeholder="请输入版本描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUploadCodeDialog = false">取消</el-button>
        <el-button type="primary" :loading="uploading" @click="handleUpload">开始上传</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { wechatConfigApi } from '@/api/request'
import axios from 'axios'

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
  token: [{ 
    validator: (rule: any, value: string, callback: Function) => {
      if (createForm.type === 'service' && !value) {
        callback(new Error('服务号必须填写Token'))
      } else {
        callback()
      }
    },
    trigger: 'blur'
  }],
}

// 编辑对话框
const showEditDialog = ref(false)
const editLoading = ref(false)
const editFormRef = ref()
const editForm = reactive({
  _id: '',
  type: 'mp' as 'mp' | 'service',
  appid: '',
  app_secret: '',
  token: '',
  encoding_aes_key: '',
  upload_key: '',
})

// 上传代码对话框
const showUploadCodeDialog = ref(false)
const uploadFormRef = ref()
const uploadForm = reactive({
  version: '',
  desc: '',
})
const uploading = ref(false)
const currentMpConfig = ref<any>(null)

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
async function handleEdit(row: any) {
  console.log('Editing row:', row)

  // 重置表单
  editForm._id = ''
  editForm.type = row.type || 'mp'
  editForm.appid = ''
  editForm.app_secret = ''
  editForm.token = ''
  editForm.encoding_aes_key = ''
  editForm.upload_key = ''

  // 先打开对话框
  showEditDialog.value = true
  editLoading.value = true

  try {
    // 调用详情接口获取真实数据
    const res: any = await wechatConfigApi.getById(row._id)
    console.log('Config detail:', res)

    if (res.code === 0 && res.data) {
      const config = res.data

      // 赋值表单数据
      editForm._id = config._id ? String(config._id) : ''
      editForm.type = config.type || 'mp'
      editForm.appid = config.appid || ''
      editForm.app_secret = config.app_secret || ''
      editForm.token = config.token || ''
      editForm.encoding_aes_key = config.encoding_aes_key || ''
      editForm.upload_key = config.upload_key || ''

      console.log('Edit form after assignment:', { ...editForm })
    } else {
      ElMessage.error(res.message || '获取配置详情失败')
      showEditDialog.value = false
    }
  } catch (error: any) {
    console.error('Get config detail error:', error)
    ElMessage.error(error?.response?.data?.message || '获取配置详情失败')
    showEditDialog.value = false
  } finally {
    editLoading.value = false
  }
}

async function handleUpdate() {
  submitting.value = true
  try {
    const data: any = {}
    if (editForm.app_secret) data.app_secret = editForm.app_secret.trim()
    if (editForm.token !== undefined) data.token = editForm.token.trim()
    if (editForm.encoding_aes_key !== undefined) data.encoding_aes_key = editForm.encoding_aes_key.trim()
    if (editForm.upload_key !== undefined) data.upload_key = editForm.upload_key.trim()

    console.log('Update data:', data)
    console.log('Edit form upload_key:', editForm.upload_key)

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

// 显示上传代码对话框
function showUploadDialog(row: any) {
  currentMpConfig.value = row
  uploadForm.version = ''
  uploadForm.desc = ''
  showUploadCodeDialog.value = true
}

// 上传小程序代码
async function handleUpload() {
  if (!uploadForm.version) {
    ElMessage.warning('请输入版本号')
    return
  }

  uploading.value = true
  try {
    const res: any = await axios.post(
      `/api/wechat-config/${currentMpConfig.value._id}/upload`,
      {
        version: uploadForm.version,
        desc: uploadForm.desc,
      }
    )
    if (res.data.code === 0) {
      ElMessage.success('上传成功')
      showUploadCodeDialog.value = false
    } else {
      ElMessage.error(res.data.message || '上传失败')
    }
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '上传失败')
  } finally {
    uploading.value = false
  }
}

// 提交审核
async function handleSubmit(row: any) {
  try {
    await ElMessageBox.confirm('确定要提交小程序审核吗？', '提示', {
      type: 'warning',
    })
    const res: any = await axios.post(`/api/wechat-config/${row._id}/submit`)
    if (res.data.code === 0) {
      ElMessage.success('提交审核成功')
    } else {
      ElMessage.error(res.data.message || '提交审核失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.response?.data?.message || '提交审核失败')
    }
  }
}

// 发布小程序
async function handleRelease(row: any) {
  try {
    await ElMessageBox.confirm('确定要发布小程序吗？发布后用户将看到新版本。', '提示', {
      type: 'warning',
    })
    const res: any = await axios.post(`/api/wechat-config/${row._id}/release`)
    if (res.data.code === 0) {
      ElMessage.success('发布成功')
    } else {
      ElMessage.error(res.data.message || '发布失败')
    }
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.response?.data?.message || '发布失败')
    }
  }
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
