<template>
  <div>
    <el-card>
      <template #header>
        <div class="header-row">
          <span style="font-weight: 600">平台广告管理</span>
          <el-button type="primary" @click="openCreate">
            <el-icon><Plus /></el-icon>新增广告
          </el-button>
        </div>
      </template>

      <el-table :data="tableData" stripe v-loading="loading">
        <el-table-column prop="title" label="标题" min-width="180" />
        <el-table-column label="图片" width="180">
          <template #default="{ row }">
            <el-image :src="row.image_url" fit="cover" style="width: 120px; height: 48px; border-radius: 6px" />
          </template>
        </el-table-column>
        <el-table-column prop="link_url" label="跳转链接" min-width="220" show-overflow-tooltip />
        <el-table-column prop="sort_order" label="排序" width="90" />
        <el-table-column label="状态" width="110">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'info'">
              {{ row.status === 'active' ? '上线' : '下线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" plain @click="removeAd(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑广告' : '新增广告'" width="560px" :close-on-click-modal="false">
      <el-form :model="form" label-width="90px">
        <el-form-item label="标题" required>
          <el-input v-model="form.title" placeholder="请输入广告标题" />
        </el-form-item>
        <el-form-item label="广告图片" required>
          <div class="ad-upload-wrap">
            <el-upload
              class="ad-uploader"
              action="/api/upload/image"
              :show-file-list="false"
              :headers="uploadHeaders"
              :before-upload="beforeUpload"
              :on-success="handleUploadSuccess"
              :on-error="handleUploadError"
            >
              <img v-if="form.image_url" :src="form.image_url" class="ad-preview" />
              <el-icon v-else class="ad-uploader-icon"><Plus /></el-icon>
            </el-upload>
            <div class="ad-upload-tip">支持 JPG/PNG/GIF/WEBP，大小不超过 5MB</div>
          </div>
        </el-form-item>
        <el-form-item label="跳转链接">
          <el-input v-model="form.link_url" placeholder="可选：小程序路径或 H5 链接" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort_order" :min="0" :max="9999" style="width: 100%" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 100%">
            <el-option label="上线" value="active" />
            <el-option label="下线" value="inactive" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { adminApi } from '@/api/request'
import { Plus } from '@element-plus/icons-vue'

const FILE_BASE_URL = String(import.meta.env.VITE_PUBLIC_FILE_BASE_URL || '')
  .trim()
  .replace(/\/$/, '')

const loading = ref(false)
const submitting = ref(false)
const tableData = ref<any[]>([])

const dialogVisible = ref(false)
const isEdit = ref(false)
const currentId = ref('')
const uploadHeaders = computed(() => {
  const token = localStorage.getItem('auth_token')
  return { Authorization: token ? `Bearer ${token}` : '' }
})
const form = reactive({
  title: '',
  image_url: '',
  link_url: '',
  sort_order: 0,
  status: 'active',
})

function resetForm() {
  form.title = ''
  form.image_url = ''
  form.link_url = ''
  form.sort_order = 0
  form.status = 'active'
  currentId.value = ''
}

function buildPublicImageUrl(url: string): string {
  if (!url) return ''
  if (/^https?:\/\//.test(url)) return url

  const protocol = window.location.protocol || 'http:'
  const host = window.location.hostname || 'localhost'
  const fallbackBase = `${protocol}//${host}:3100`
  const base = FILE_BASE_URL || fallbackBase
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`
}

function beforeUpload(file: File) {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只支持图片文件')
    return false
  }
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }
  return true
}

function handleUploadSuccess(response: any) {
  if (response?.code !== 0 || !response?.data?.url) {
    ElMessage.error(response?.message || '上传失败')
    return
  }
  form.image_url = buildPublicImageUrl(response.data.url)
  ElMessage.success('上传成功，已回显预览')
}

function handleUploadError() {
  ElMessage.error('上传失败')
}

async function loadData() {
  loading.value = true
  try {
    const res: any = await adminApi.getAds({ page: 1, pageSize: 200 })
    const data = res?.data ?? res
    const list = data?.list || (Array.isArray(data) ? data : [])
    tableData.value = list.map((item: any) => ({
      ...item,
      image_url: buildPublicImageUrl(item.image_url || ''),
    }))
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '加载失败')
  } finally {
    loading.value = false
  }
}

function openCreate() {
  isEdit.value = false
  resetForm()
  dialogVisible.value = true
}

function openEdit(row: any) {
  isEdit.value = true
  currentId.value = row.ad_id
  form.title = row.title || ''
  form.image_url = buildPublicImageUrl(row.image_url || '')
  form.link_url = row.link_url || ''
  form.sort_order = row.sort_order || 0
  form.status = row.status || 'active'
  dialogVisible.value = true
}

async function submit() {
  if (!form.title.trim()) return ElMessage.warning('请输入标题')
  if (!form.image_url.trim()) return ElMessage.warning('请先上传广告图片')

  submitting.value = true
  try {
    if (isEdit.value && currentId.value) {
      await adminApi.updateAd(currentId.value, { ...form })
      ElMessage.success('更新成功')
    } else {
      await adminApi.createAd({ ...form })
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    await loadData()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '保存失败')
  } finally {
    submitting.value = false
  }
}

async function removeAd(row: any) {
  try {
    await ElMessageBox.confirm(`确定删除广告「${row.title}」吗？`, '确认删除', { type: 'warning' })
    await adminApi.deleteAd(row.ad_id)
    ElMessage.success('删除成功')
    await loadData()
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error(e?.response?.data?.message || '删除失败')
    }
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ad-upload-wrap {
  width: 100%;
}

.ad-uploader :deep(.el-upload) {
  width: 220px;
  height: 88px;
  border: 1px dashed #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.ad-uploader :deep(.el-upload:hover) {
  border-color: #409eff;
}

.ad-preview {
  width: 220px;
  height: 88px;
  object-fit: cover;
}

.ad-uploader-icon {
  font-size: 24px;
  color: #8c939d;
}

.ad-upload-tip {
  margin-top: 8px;
  color: #999;
  font-size: 12px;
}
</style>
