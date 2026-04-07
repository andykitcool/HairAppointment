<template>
  <div>
    <el-card>
      <template #header>
        <div class="header-row">
          <span style="font-weight:600">店长管理</span>
          <el-button type="primary" @click="showCreateDialog = true">
            <el-icon><Plus /></el-icon>添加店长
          </el-button>
        </div>
      </template>

      <!-- 筛选栏 -->
      <div style="margin-bottom: 16px;">
        <el-input
          v-model="searchKeyword"
          placeholder="搜索店长姓名/手机号"
          style="width: 300px; margin-right: 16px;"
          clearable
          @clear="loadData"
          @keyup.enter="loadData"
        >
          <template #append>
            <el-button @click="loadData">
              <el-icon><Search /></el-icon>
            </el-button>
          </template>
        </el-input>
        <el-select v-model="filterMerchant" placeholder="筛选门店" clearable style="width: 200px;" @change="loadData">
          <el-option
            v-for="item in merchantOptions"
            :key="item.merchant_id"
            :label="item.name"
            :value="item.merchant_id"
          />
        </el-select>
      </div>

      <el-table :data="tableData" stripe v-loading="loading">
        <el-table-column prop="user_id" label="用户ID" width="180" />
        <el-table-column prop="real_name" label="店长姓名" width="120" />
        <el-table-column prop="phone" label="手机号" width="120" />
        <el-table-column prop="nickname" label="微信昵称" width="120" />
        <el-table-column label="所属门店" min-width="150">
          <template #default="{ row }">
            {{ row.merchant_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="role" label="角色" width="100">
          <template #default="{ row }">
            <el-tag :type="roleTagType(row.role)" size="small">
              {{ roleLabel(row.role) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="成为店长时间" width="160">
          <template #default="{ row }">{{ row.create_time ? new Date(row.create_time).toLocaleString() : '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" plain @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" size="small" plain @click="handleRemove(row)">移除店长</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-if="total > pageSize"
        style="margin-top: 16px; justify-content: flex-end"
        background
        layout="prev, pager, next"
        :total="total"
        :page-size="pageSize"
        v-model:current-page="currentPage"
        @current-change="loadData"
      />
    </el-card>

    <!-- 添加店长弹窗 -->
    <el-dialog v-model="showCreateDialog" title="添加店长" width="500px" :close-on-click-modal="false">
      <el-form :model="createForm" ref="createFormRef" :rules="createRules" label-width="100px">
        <el-form-item label="店长姓名" prop="real_name">
          <el-input v-model="createForm.real_name" placeholder="请输入店长姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="createForm.phone" placeholder="请输入店长手机号" />
        </el-form-item>
        <el-form-item label="所属门店" prop="merchant_id">
          <el-select v-model="createForm.merchant_id" placeholder="请选择门店" style="width: 100%;">
            <el-option
              v-for="item in activeMerchantOptions"
              :key="item.merchant_id"
              :label="item.name"
              :value="item.merchant_id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="登录密码" prop="password">
          <el-input v-model="createForm.password" type="password" placeholder="请设置登录密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleCreate">确认添加</el-button>
      </template>
    </el-dialog>

    <!-- 编辑店长弹窗 -->
    <el-dialog v-model="showEditDialog" title="编辑店长" width="500px" :close-on-click-modal="false">
      <el-form :model="editForm" ref="editFormRef" :rules="editRules" label-width="100px">
        <el-form-item label="用户ID">
          <el-input v-model="editForm.user_id" disabled />
        </el-form-item>
        <el-form-item label="店长姓名" prop="real_name">
          <el-input v-model="editForm.real_name" placeholder="请输入店长姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="editForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="所属门店" prop="merchant_id">
          <el-select v-model="editForm.merchant_id" placeholder="请选择门店" style="width: 100%;" clearable>
            <el-option
              v-for="item in activeMerchantOptions"
              :key="item.merchant_id"
              :label="item.name"
              :value="item.merchant_id"
            />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="handleUpdate">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed } from 'vue'
import { adminApi } from '@/api/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const pageSize = 20
const currentPage = ref(1)
const searchKeyword = ref('')
const filterMerchant = ref('')
const merchantOptions = ref<any[]>([])

// 筛选出营业中的门店
const activeMerchantOptions = computed(() => {
  return merchantOptions.value.filter(m => m.status === 'active')
})

// 添加店长弹窗
const showCreateDialog = ref(false)
const createFormRef = ref()
const submitting = ref(false)
const createForm = reactive({
  real_name: '',
  phone: '',
  merchant_id: '',
  password: ''
})
const createRules = {
  real_name: [{ required: true, message: '请输入店长姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  merchant_id: [{ required: false, message: '请选择所属门店', trigger: 'change' }],
  password: [
    { required: true, message: '请设置登录密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ]
}

// 编辑弹窗
const showEditDialog = ref(false)
const editFormRef = ref()
const editForm = reactive({
  user_id: '',
  real_name: '',
  phone: '',
  merchant_id: ''
})
const editRules = {
  real_name: [{ required: true, message: '请输入店长姓名', trigger: 'blur' }],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  merchant_id: [{ required: false, message: '请选择所属门店', trigger: 'change' }]
}

const roleLabel = (role: string) => ({
  customer: '顾客',
  pending_owner: '待审核店长',
  owner: '店长',
  staff: '店员'
}[role] || role)

const roleTagType = (role: string) => ({
  customer: 'info',
  pending_owner: 'warning',
  owner: 'success',
  staff: ''
}[role] || 'info') as any

async function loadData() {
  loading.value = true
  try {
    const params: any = { page: currentPage.value, pageSize }
    if (searchKeyword.value) {
      params.keyword = searchKeyword.value
    }
    if (filterMerchant.value) {
      params.merchant_id = filterMerchant.value
    }
    const res: any = await adminApi.getOwners(params)
    const data = res?.data ?? res
    tableData.value = data?.list || (Array.isArray(data) ? data : [])
    total.value = data?.total ?? tableData.value.length
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

async function loadMerchants() {
  try {
    const res: any = await adminApi.getMerchants({ page: 1, pageSize: 999 })
    const data = res?.data ?? res
    merchantOptions.value = data?.list || (Array.isArray(data) ? data : [])
  } catch (e) { console.error(e) }
}

async function handleCreate() {
  await createFormRef.value.validate()
  submitting.value = true
  try {
    await adminApi.addOwner({ ...createForm })
    ElMessage.success('店长添加成功')
    showCreateDialog.value = false
    createFormRef.value.resetFields()
    // 重置到第1页并刷新
    currentPage.value = 1
    searchKeyword.value = ''
    filterMerchant.value = ''
    await loadData()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '添加失败')
  } finally {
    submitting.value = false
  }
}

function handleEdit(row: any) {
  editForm.user_id = row.user_id
  editForm.real_name = row.real_name || ''
  editForm.phone = row.phone || ''
  editForm.merchant_id = row.merchant_id || ''
  showEditDialog.value = true
}

async function handleUpdate() {
  await editFormRef.value.validate()
  submitting.value = true
  try {
    const { user_id, ...data } = editForm
    await adminApi.updateOwner(user_id, data)
    ElMessage.success('店长信息更新成功')
    showEditDialog.value = false
    await loadData()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '更新失败')
  } finally {
    submitting.value = false
  }
}

async function handleRemove(row: any) {
  await ElMessageBox.confirm(
    `确定移除「${row.real_name || row.nickname}」的店长身份？\n\n移除后该用户将变为普通顾客，无法管理门店。`,
    '确认移除',
    { type: 'warning', confirmButtonClass: 'el-button--danger' }
  )
  try {
    await adminApi.removeOwner(row.user_id)
    ElMessage.success('已移除店长身份')
    await loadData()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '操作失败')
  }
}

onMounted(() => {
  loadData()
  loadMerchants()
})
</script>

<style scoped>
.header-row { display: flex; justify-content: space-between; align-items: center; }
</style>
