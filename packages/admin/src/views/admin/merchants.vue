<template>
  <div>
    <el-card>
      <template #header>
        <div class="header-row">
          <span style="font-weight:600">门店管理</span>
          <el-button type="primary" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>新建门店
          </el-button>
        </div>
      </template>

      <!-- 筛选栏 -->
      <div style="margin-bottom: 16px;">
        <el-radio-group v-model="filterStatus" size="small" @change="handleStatusChange">
          <el-radio-button label="">全部</el-radio-button>
          <el-radio-button label="applying">申请中</el-radio-button>
          <el-radio-button label="active">营业中</el-radio-button>
          <el-radio-button label="inactive">已停用</el-radio-button>
          <el-radio-button label="rejected">已拒绝</el-radio-button>
        </el-radio-group>
      </div>

      <el-table :data="tableData" stripe v-loading="loading">
        <el-table-column prop="merchant_id" label="商户ID" width="120" />
        <el-table-column prop="name" label="门店名称" width="150" />
        <el-table-column prop="phone" label="联系电话" width="120" />
        <el-table-column prop="address" label="地址" show-overflow-tooltip min-width="150" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="申请人/店长" width="120">
          <template #default="{ row }">
            {{ row.application_info?.applicant_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="申请/店长手机" width="120">
          <template #default="{ row }">
            {{ row.application_info?.applicant_phone || row.phone || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="营业时间" width="120">
          <template #default="{ row }">
            {{ row.business_hours?.start || '-' }} - {{ row.business_hours?.end || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="创建时间" width="160">
          <template #default="{ row }">{{ row.create_time ? new Date(row.create_time).toLocaleString() : '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="280" fixed="right">
          <template #default="{ row }">
            <!-- 编辑按钮 - 所有状态都显示 -->
            <el-button type="primary" size="small" plain @click="handleEdit(row)">编辑</el-button>
            <!-- 申请中/待审核状态 -->
            <template v-if="row.status === 'applying' || row.status === 'pending'">
              <el-button type="success" size="small" @click="approve(row)">通过</el-button>
              <el-button type="danger" size="small" plain @click="reject(row)">拒绝</el-button>
            </template>
            <!-- 营业中状态 - 不能删除，只能停用 -->
            <template v-else-if="row.status === 'active'">
              <el-button type="warning" size="small" plain @click="updateStatus(row, 'inactive')">停用</el-button>
            </template>
            <!-- 已停用状态 - 可以启用或删除 -->
            <template v-else-if="row.status === 'inactive'">
              <el-button type="success" size="small" @click="updateStatus(row, 'active')">启用</el-button>
              <el-button type="danger" size="small" plain @click="handleDelete(row)">删除</el-button>
            </template>
            <!-- 已拒绝状态 - 只能删除 -->
            <template v-else-if="row.status === 'rejected'">
              <el-button type="danger" size="small" plain @click="handleDelete(row)">删除</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination v-if="total > pageSize" style="margin-top: 16px; justify-content: flex-end" background layout="prev, pager, next" :total="total" :page-size="pageSize" v-model:current-page="currentPage" @current-change="loadData" />
    </el-card>

    <!-- 新建门店弹窗 -->
    <el-dialog v-model="showCreateDialog" title="新建门店" width="500px" :close-on-click-modal="false">
      <el-form :model="createForm" ref="createFormRef" :rules="createRules" label-width="100px">
        <el-form-item label="门店名称" prop="name">
          <el-input v-model="createForm.name" placeholder="请输入门店名称" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="createForm.phone" placeholder="请输入门店联系电话" />
        </el-form-item>
        <el-form-item label="门店地址" prop="address">
          <el-input v-model="createForm.address" placeholder="请输入门店地址" />
        </el-form-item>
        <el-form-item label="营业时间" required>
          <el-col :span="11">
            <el-form-item prop="business_hours_start">
              <el-time-picker v-model="createForm.business_hours_start" placeholder="开始时间" format="HH:mm" value-format="HH:mm" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="2" style="text-align: center;">-</el-col>
          <el-col :span="11">
            <el-form-item prop="business_hours_end">
              <el-time-picker v-model="createForm.business_hours_end" placeholder="结束时间" format="HH:mm" value-format="HH:mm" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-form-item>
        <el-form-item label="门店简介" prop="description">
          <el-input v-model="createForm.description" type="textarea" rows="2" placeholder="请输入门店简介（可选）" />
        </el-form-item>
        <el-divider />
        <el-form-item label="店长姓名" prop="owner_name">
          <el-input v-model="createForm.owner_name" placeholder="请输入店长姓名" />
        </el-form-item>
        <el-form-item label="店长手机号" prop="owner_phone">
          <el-input v-model="createForm.owner_phone" placeholder="请输入店长手机号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleCreate">确认创建</el-button>
      </template>
    </el-dialog>

    <!-- 创建成功弹窗 - 显示账号信息 -->
    <el-dialog v-model="showAccountDialog" title="门店创建成功" width="400px" :close-on-click-modal="false">
      <el-result icon="success" title="创建成功" sub-title="店长管理员账号已生成">
        <template #extra>
          <div style="text-align: left; background: #f5f7fa; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <div style="margin-bottom: 8px;"><strong>登录账号：</strong>{{ createdAccount?.username }}</div>
            <div style="margin-bottom: 8px;"><strong>临时密码：</strong>{{ createdAccount?.temp_password }}</div>
            <div style="color: #f56c6c; font-size: 13px;">请复制保存，密码只会显示一次！</div>
          </div>
          <el-button type="primary" @click="showAccountDialog = false">确定</el-button>
        </template>
      </el-result>
    </el-dialog>

    <!-- 重置密码弹窗 -->
    <el-dialog v-model="showResetDialog" title="重置密码" width="400px">
      <el-result v-if="resetPasswordResult" icon="success" title="密码重置成功">
        <template #sub-title>
          <div style="text-align: left; background: #f5f7fa; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <div style="margin-bottom: 8px;"><strong>新密码：</strong>{{ resetPasswordResult.new_password }}</div>
            <div style="color: #f56c6c; font-size: 13px;">请复制保存，密码只会显示一次！</div>
          </div>
        </template>
        <template #extra>
          <el-button type="primary" @click="showResetDialog = false">确定</el-button>
        </template>
      </el-result>
    </el-dialog>

    <!-- 拒绝弹窗 -->
    <el-dialog v-model="showRejectDialog" title="拒绝申请" width="400px">
      <el-form :model="rejectForm" label-width="80px">
        <el-form-item label="拒绝原因">
          <el-input v-model="rejectForm.note" type="textarea" rows="3" placeholder="请输入拒绝原因（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRejectDialog = false">取消</el-button>
        <el-button type="danger" @click="confirmReject">确认拒绝</el-button>
      </template>
    </el-dialog>

    <!-- 编辑门店弹窗 -->
    <el-dialog v-model="showEditDialog" title="编辑门店" width="500px" :close-on-click-modal="false">
      <el-form :model="editForm" ref="editFormRef" :rules="editRules" label-width="100px">
        <el-form-item label="门店名称" prop="name">
          <el-input v-model="editForm.name" placeholder="请输入门店名称" />
        </el-form-item>
        <el-form-item label="联系电话" prop="phone">
          <el-input v-model="editForm.phone" placeholder="请输入门店联系电话" />
        </el-form-item>
        <el-form-item label="门店地址" prop="address">
          <el-input v-model="editForm.address" placeholder="请输入门店地址" />
        </el-form-item>
        <el-form-item label="营业时间" required>
          <el-col :span="11">
            <el-form-item prop="business_hours_start">
              <el-time-picker v-model="editForm.business_hours_start" placeholder="开始时间" format="HH:mm" value-format="HH:mm" style="width: 100%;" />
            </el-form-item>
          </el-col>
          <el-col :span="2" style="text-align: center;">-</el-col>
          <el-col :span="11">
            <el-form-item prop="business_hours_end">
              <el-time-picker v-model="editForm.business_hours_end" placeholder="结束时间" format="HH:mm" value-format="HH:mm" style="width: 100%;" />
            </el-form-item>
          </el-col>
        </el-form-item>
        <el-form-item label="门店简介" prop="description">
          <el-input v-model="editForm.description" type="textarea" rows="2" placeholder="请输入门店简介（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" :loading="editSubmitting" @click="handleEditSubmit">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { adminApi } from '@/api/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const pageSize = 20
const currentPage = ref(1)
const filterStatus = ref('')

// 新建门店
const showCreateDialog = ref(false)
const createFormRef = ref()
const submitting = ref(false)
const createForm = reactive({
  name: '',
  phone: '',
  address: '',
  business_hours_start: '09:00',
  business_hours_end: '21:00',
  description: '',
  owner_name: '',
  owner_phone: ''
})
const createRules = {
  name: [{ required: true, message: '请输入门店名称', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
  address: [{ required: true, message: '请输入门店地址', trigger: 'blur' }],
  business_hours_start: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  business_hours_end: [{ required: true, message: '请选择结束时间', trigger: 'change' }],
  owner_name: [{ required: true, message: '请输入店长姓名', trigger: 'blur' }],
  owner_phone: [{ required: true, message: '请输入店长手机号', trigger: 'blur' }]
}

// 创建成功弹窗
const showAccountDialog = ref(false)
const createdAccount = ref<any>(null)

// 重置密码弹窗
const showResetDialog = ref(false)
const resetPasswordResult = ref<any>(null)

// 拒绝弹窗
const showRejectDialog = ref(false)
const rejectForm = ref({ note: '' })
const currentRejectRow = ref<any>(null)

// 编辑门店
const showEditDialog = ref(false)
const editFormRef = ref()
const editSubmitting = ref(false)
const currentEditRow = ref<any>(null)
const editForm = reactive({
  name: '',
  phone: '',
  address: '',
  business_hours_start: '09:00',
  business_hours_end: '21:00',
  description: ''
})
const editRules = {
  name: [{ required: true, message: '请输入门店名称', trigger: 'blur' }],
  phone: [{ required: true, message: '请输入联系电话', trigger: 'blur' }],
  address: [{ required: true, message: '请输入门店地址', trigger: 'blur' }],
  business_hours_start: [{ required: true, message: '请选择开始时间', trigger: 'change' }],
  business_hours_end: [{ required: true, message: '请选择结束时间', trigger: 'change' }]
}

const statusLabel = (s: string) => ({
  applying: '申请中',
  pending: '待审核',
  active: '营业中',
  inactive: '已停用',
  rejected: '已拒绝'
}[s] || s)

const statusTagType = (s: string) => ({
  applying: 'primary',
  pending: 'warning',
  active: 'success',
  inactive: 'info',
  rejected: 'danger'
}[s] || 'info') as any

async function loadData() {
  loading.value = true
  try {
    const params: any = { page: currentPage.value, pageSize }
    if (filterStatus.value) {
      params.status = filterStatus.value
    }
    const res: any = await adminApi.getMerchants(params)
    const data = res?.data ?? res
    tableData.value = data?.list || (Array.isArray(data) ? data : [])
    total.value = data?.total ?? tableData.value.length
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

function handleStatusChange() {
  currentPage.value = 1
  loadData()
}

async function handleCreate() {
  await createFormRef.value.validate()
  submitting.value = true
  try {
    const res: any = await adminApi.addMerchant({ ...createForm })
    ElMessage.success('门店创建成功')
    showCreateDialog.value = false
    createFormRef.value.resetFields()

    // 显示创建的账号信息
    if (res?.data?.admin_account) {
      createdAccount.value = res.data.admin_account
      showAccountDialog.value = true
    }

    await loadData()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '创建失败')
  } finally {
    submitting.value = false
  }
}

async function approve(row: any) {
  await ElMessageBox.confirm(`通过「${row.name}」的入驻申请？`, '审核确认')
  try {
    const res: any = await adminApi.reviewApplication(row.merchant_id, 'approve')
    ElMessage.success('审核通过')

    if (res?.data?.admin_account) {
      createdAccount.value = res.data.admin_account
      showAccountDialog.value = true
    }

    await loadData()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '操作失败')
  }
}

function reject(row: any) {
  currentRejectRow.value = row
  rejectForm.value.note = ''
  showRejectDialog.value = true
}

async function confirmReject() {
  if (!currentRejectRow.value) return
  try {
    await adminApi.reviewApplication(
      currentRejectRow.value.merchant_id,
      'reject',
      rejectForm.value.note
    )
    ElMessage.success('已拒绝')
    showRejectDialog.value = false
    await loadData()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '操作失败')
  }
}

async function updateStatus(row: any, status: string) {
  const label = status === 'active' ? '启用' : '停用'
  await ElMessageBox.confirm(`${label}门店「${row.name}」？`, '确认')
  try {
    await adminApi.updateMerchantStatus(row.merchant_id, status)
    ElMessage.success(`${label}成功`)
    await loadData()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '操作失败')
  }
}

async function resetPassword(row: any) {
  await ElMessageBox.confirm(`重置「${row.name}」店长的登录密码？`, '确认')
  try {
    const res: any = await adminApi.resetMerchantAdminPassword(row.merchant_id)
    ElMessage.success('密码重置成功')
    resetPasswordResult.value = res?.data
    showResetDialog.value = true
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '操作失败')
  }
}

// 编辑门店
function handleEdit(row: any) {
  currentEditRow.value = row
  editForm.name = row.name || ''
  editForm.phone = row.phone || ''
  editForm.address = row.address || ''
  editForm.business_hours_start = row.business_hours?.start || '09:00'
  editForm.business_hours_end = row.business_hours?.end || '21:00'
  editForm.description = row.description || ''
  showEditDialog.value = true
}

async function handleEditSubmit() {
  await editFormRef.value.validate()
  editSubmitting.value = true
  try {
    const data = {
      name: editForm.name,
      phone: editForm.phone,
      address: editForm.address,
      description: editForm.description,
      business_hours: {
        start: editForm.business_hours_start,
        end: editForm.business_hours_end
      }
    }
    await adminApi.updateMerchant(currentEditRow.value.merchant_id, data)
    ElMessage.success('门店信息更新成功')
    showEditDialog.value = false
    await loadData()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '更新失败')
  } finally {
    editSubmitting.value = false
  }
}

// 删除门店
async function handleDelete(row: any) {
  await ElMessageBox.confirm(
    `确定删除门店「${row.name}」？此操作将删除该门店的所有数据（服务、员工、预约记录等），不可恢复！`,
    '危险操作确认',
    { type: 'warning', confirmButtonClass: 'el-button--danger' }
  )
  try {
    await adminApi.deleteMerchant(row.merchant_id)
    ElMessage.success('门店删除成功')
    await loadData()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '删除失败')
  }
}

onMounted(() => loadData())
</script>

<style scoped>
.header-row { display: flex; justify-content: space-between; align-items: center; }
</style>
