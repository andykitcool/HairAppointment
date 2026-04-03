<template>
  <div>
    <el-card>
      <template #header>
        <div class="header-row">
          <span class="header-title">顾客管理</span>
          <el-input v-model="searchKeyword" placeholder="搜索顾客姓名/电话" clearable style="width: 240px" @clear="loadData" @keyup.enter="loadData">
            <template #append><el-button @click="loadData">搜索</el-button></template>
          </el-input>
        </div>
      </template>

      <el-table :data="tableData" stripe v-loading="loading">
        <el-table-column prop="nickname" label="昵称" width="120" />
        <el-table-column prop="real_name" label="真实姓名" width="100" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column label="角色" width="80">
          <template #default="{ row }">
            <el-tag :type="row.role === 'owner' ? 'warning' : 'info'" size="small">{{ row.role === 'owner' ? '店长' : '顾客' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="到店次数" width="90">
          <template #default="{ row }">{{ row.visit_count || 0 }}</template>
        </el-table-column>
        <el-table-column label="累计消费" width="110">
          <template #default="{ row }"><span style="font-weight:600">¥{{ ((row.total_spending || 0) / 100).toFixed(2) }}</span></template>
        </el-table-column>
        <el-table-column prop="last_visit_time" label="最近到店" width="170">
          <template #default="{ row }">{{ row.last_visit_time ? new Date(row.last_visit_time).toLocaleString() : '-' }}</template>
        </el-table-column>
        <el-table-column prop="customer_note" label="顾客备注" show-overflow-tooltip />
        <el-table-column prop="merchant_note" label="店家备注" width="140">
          <template #default="{ row }">
            <el-button size="small" @click="editNote(row)">{{ row.merchant_note || '添加备注' }}</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination v-if="total > pageSize" style="margin-top: 16px; justify-content: flex-end" background layout="prev, pager, next" :total="total" :page-size="pageSize" v-model:current-page="currentPage" @current-change="loadData" />
    </el-card>

    <el-dialog v-model="noteDialogVisible" title="编辑店家备注" width="420px">
      <el-input v-model="editNoteValue" type="textarea" :rows="3" placeholder="输入店家备注（发型偏好等）" />
      <template #footer>
        <el-button @click="noteDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveNote">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { customerApi } from '@/api/request'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const authStore = useAuthStore()
const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const pageSize = 20
const currentPage = ref(1)
const searchKeyword = ref('')
const noteDialogVisible = ref(false)
const editNoteValue = ref('')
const editingCustomerId = ref('')

async function loadData() {
  loading.value = true
  try {
    const params: any = { merchant_id: authStore.user.merchantId, page: currentPage.value, pageSize }
    if (searchKeyword.value) params.keyword = searchKeyword.value
    const res = await customerApi.getList(params) as any
    tableData.value = res?.list || (Array.isArray(res) ? res : [])
    total.value = res?.total || tableData.value.length
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

function editNote(row: any) {
  editingCustomerId.value = row._id
  editNoteValue.value = row.merchant_note || ''
  noteDialogVisible.value = true
}

async function saveNote() {
  try {
    await customerApi.updateMerchantNote(editingCustomerId.value, editNoteValue.value)
    ElMessage.success('备注已更新')
    noteDialogVisible.value = false
    await loadData()
  } catch (e: any) { ElMessage.error(e?.response?.data?.message || '失败') }
}

onMounted(() => loadData())
</script>

<style scoped>
.header-row { display: flex; justify-content: space-between; align-items: center; }
.header-title { font-weight: 600; font-size: 16px; }
</style>
