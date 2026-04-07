<template>
  <div class="staff-page">
    <el-card>
      <template #header>
        <div class="header-row">
          <span class="header-title">员工管理</span>
          <el-button type="primary" @click="openDialog()">新增员工</el-button>
        </div>
        <div class="header-tip">未新增员工时，店长默认作为唯一服务人员。</div>
      </template>

      <el-table :data="tableData" stripe v-loading="loading" empty-text="暂无员工数据">
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="title" label="职位" width="120">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ row.title || '店员' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="联系电话" width="140">
          <template #default="{ row }">
            {{ row.phone || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="可服务项目" min-width="200">
          <template #default="{ row }">
            <el-tag v-for="service in getServiceNames(row.service_ids)" :key="service" size="small" style="margin: 2px">
              {{ service }}
            </el-tag>
            <span v-if="!row.service_ids || row.service_ids.length === 0" class="text-gray">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="is_active" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'" size="small">
              {{ row.is_active ? '在职' : '离职' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openDialog(row)">编辑</el-button>
            <el-popconfirm :disabled="row.is_default_owner" title="确定删除该员工？" @confirm="deleteItem(row)">
              <template #reference>
                <el-button type="danger" size="small" plain :disabled="row.is_default_owner">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 新增/编辑员工弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑员工' : '新增员工'" width="500px">
      <el-form :model="form" label-width="100px" :rules="rules" ref="formRef">
        <el-form-item label="姓名" prop="name" required>
          <el-input v-model="form.name" placeholder="请输入员工姓名" />
        </el-form-item>
        <el-form-item label="职位">
          <el-input v-model="form.title" placeholder="如：店长、发型师、助理" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="form.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="可服务项目">
          <el-select v-model="form.service_ids" multiple placeholder="请选择该员工可服务的服务项目" style="width: 100%">
            <el-option
              v-for="service in serviceList"
              :key="service.service_id"
              :label="service.name"
              :value="service.service_id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="在职状态">
          <el-switch v-model="form.is_active" active-text="在职" inactive-text="离职" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="onSubmit" :loading="submitting">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { staffApi, serviceApi } from '@/api/request'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const authStore = useAuthStore()
const loading = ref(false)
const submitting = ref(false)
const tableData = ref<any[]>([])
const serviceList = ref<any[]>([])
const dialogVisible = ref(false)
const editingId = ref('')
const formRef = ref<any>()

const form = reactive({
  name: '',
  title: '',
  phone: '',
  service_ids: [] as string[],
  is_active: true,
})

const rules = {
  name: [{ required: true, message: '请输入员工姓名', trigger: 'blur' }],
}

function openDialog(row?: any) {
  if (row) {
    editingId.value = row.staff_id
    form.name = row.name
    form.title = row.title || ''
    form.phone = row.phone || ''
    form.service_ids = row.service_ids || []
    form.is_active = row.is_active !== false
  } else {
    editingId.value = ''
    resetForm()
  }
  dialogVisible.value = true
}

function resetForm() {
  form.name = ''
  form.title = ''
  form.phone = ''
  form.service_ids = []
  form.is_active = true
}

async function onSubmit() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return

    const merchantId = authStore.user.merchantId
    if (!merchantId) {
      ElMessage.warning('您还未绑定门店')
      return
    }

    submitting.value = true
    try {
      const data = {
        merchant_id: merchantId,
        name: form.name,
        title: form.title,
        phone: form.phone,
        service_ids: form.service_ids,
        is_active: form.is_active,
      }

      if (editingId.value) {
        await staffApi.update(editingId.value, data)
        ElMessage.success('更新成功')
      } else {
        await staffApi.create(data)
        ElMessage.success('创建成功')
      }
      dialogVisible.value = false
      await loadData()
    } catch (e: any) {
      ElMessage.error(e?.response?.data?.message || '操作失败')
    } finally {
      submitting.value = false
    }
  })
}

async function deleteItem(row: any) {
  if (row.is_default_owner) {
    ElMessage.warning('默认店长员工不可删除')
    return
  }
  try {
    await staffApi.delete(row.staff_id, { merchant_id: authStore.user.merchantId })
    ElMessage.success('删除成功')
    await loadData()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '删除失败')
  }
}

function getServiceNames(serviceIds: string[]) {
  if (!serviceIds || serviceIds.length === 0) return []
  return serviceIds
    .map(id => {
      const service = serviceList.value.find(s => s.service_id === id)
      return service?.name || id
    })
    .filter(Boolean)
}

async function loadServices() {
  const merchantId = authStore.user.merchantId
  if (!merchantId) return

  try {
    const res = await serviceApi.getList({ merchant_id: merchantId, is_active: true }) as any
    const payload = res?.data ?? res
    serviceList.value = payload?.list || (Array.isArray(payload) ? payload : [])
  } catch (e) {
    console.error('加载服务列表失败', e)
  }
}

async function loadData() {
  const merchantId = authStore.user.merchantId
  if (!merchantId) {
    ElMessage.warning('您还未绑定门店')
    return
  }

  loading.value = true
  try {
    const res = await staffApi.getList({ merchant_id: merchantId }) as any
    const payload = res?.data ?? res
    tableData.value = payload?.list || (Array.isArray(payload) ? payload : [])
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '加载数据失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
  loadServices()
})
</script>

<style scoped>
.staff-page {
  padding: 0;
}
.header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.header-title {
  font-weight: 600;
  font-size: 16px;
}
.header-tip {
  margin-top: 8px;
  color: #909399;
  font-size: 13px;
}
.text-gray {
  color: #999;
}
</style>
