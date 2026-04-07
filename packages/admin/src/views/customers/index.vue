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
        <el-table-column label="性别" width="80">
          <template #default="{ row }">{{ genderLabel(row.gender) }}</template>
        </el-table-column>
        <el-table-column prop="age" label="年龄" width="70" />
        <el-table-column prop="birthday" label="生日" width="110" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column label="到店次数" width="90">
          <template #default="{ row }">{{ row.visit_count || 0 }}</template>
        </el-table-column>
        <el-table-column label="累计消费" width="110">
          <template #default="{ row }"><span style="font-weight:600">¥{{ ((row.total_spending || 0) / 100).toFixed(2) }}</span></template>
        </el-table-column>
        <el-table-column prop="points" label="积分" width="80" />
        <el-table-column label="会员卡级别" width="120">
          <template #default="{ row }">{{ membershipLabel(row.membership_level) }}</template>
        </el-table-column>
        <el-table-column prop="punch_card_remaining" label="次卡剩余" width="100" />
        <el-table-column label="储值卡余额" width="110">
          <template #default="{ row }">¥{{ ((row.stored_value_balance || 0) / 100).toFixed(2) }}</template>
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
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openEditDialog(row)">编辑</el-button>
            <el-button size="small" type="danger" plain @click="deleteCustomer(row)">删除</el-button>
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

    <el-dialog v-model="editDialogVisible" title="编辑顾客" width="480px">
      <el-form :model="editForm" label-width="90px">
        <el-form-item label="昵称">
          <el-input v-model="editForm.nickname" placeholder="请输入昵称" />
        </el-form-item>
        <el-form-item label="真实姓名">
          <el-input v-model="editForm.real_name" placeholder="请输入真实姓名" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="editForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="性别">
          <el-select v-model="editForm.gender" style="width: 100%">
            <el-option label="未知" value="unknown" />
            <el-option label="男" value="male" />
            <el-option label="女" value="female" />
          </el-select>
        </el-form-item>
        <el-form-item label="年龄">
          <el-input-number v-model="editForm.age" :min="0" :max="120" style="width: 100%" />
        </el-form-item>
        <el-form-item label="生日">
          <el-date-picker v-model="editForm.birthday" type="date" value-format="YYYY-MM-DD" placeholder="请选择生日" style="width: 100%" />
        </el-form-item>
        <el-form-item label="积分">
          <el-input-number v-model="editForm.points" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="会员卡级别">
          <el-select v-model="editForm.membership_level" style="width: 100%">
            <el-option v-for="level in membershipLevels" :key="level" :label="level" :value="level" />
          </el-select>
        </el-form-item>
        <el-form-item label="次卡剩余">
          <el-input-number v-model="editForm.punch_card_remaining" :min="0" style="width: 100%" />
        </el-form-item>
        <el-form-item label="储值卡余额">
          <el-input-number v-model="editForm.stored_value_balance_yuan" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="顾客备注">
          <el-input v-model="editForm.customer_note" type="textarea" :rows="2" placeholder="请输入顾客备注" />
        </el-form-item>
        <el-form-item label="店家备注">
          <el-input v-model="editForm.merchant_note" type="textarea" :rows="2" placeholder="请输入店家备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCustomer">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { customerApi, merchantApi } from '@/api/request'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'

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
const editDialogVisible = ref(false)
const membershipLevels = ref<string[]>(['普通会员', '银卡会员', '金卡会员', '钻石会员'])
const legacyMembershipMap: Record<string, string> = {
  normal: '普通会员',
  silver: '银卡会员',
  gold: '金卡会员',
  diamond: '钻石会员',
}
const editForm = ref<any>({
  id: '',
  nickname: '',
  real_name: '',
  phone: '',
  gender: 'unknown',
  age: 0,
  birthday: '',
  points: 0,
  membership_level: '普通会员',
  punch_card_remaining: 0,
  stored_value_balance_yuan: 0,
  customer_note: '',
  merchant_note: '',
})

const genderLabel = (gender: string) => ({ male: '男', female: '女', unknown: '未知' }[gender] || '未知')
const membershipLabel = (value: string) => legacyMembershipMap[value] || value || '-'

async function loadMembershipLevels() {
  if (!authStore.user.merchantId) return
  try {
    const res = await merchantApi.getCustomerSettings(authStore.user.merchantId) as any
    const payload = res?.data ?? res
    const levels = Array.isArray(payload?.membership_levels) ? payload.membership_levels : []
    if (levels.length) membershipLevels.value = levels
  } catch (e) {
    console.error(e)
  }
}

async function loadData() {
  loading.value = true
  try {
    const params: any = { merchant_id: authStore.user.merchantId, page: currentPage.value, pageSize }
    if (searchKeyword.value) params.keyword = searchKeyword.value
    const res = await customerApi.getList(params) as any
    const payload = res?.data ?? res
    tableData.value = payload?.list || (Array.isArray(payload) ? payload : [])
    total.value = payload?.total ?? tableData.value.length
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

function editNote(row: any) {
  editingCustomerId.value = row._id
  editNoteValue.value = row.merchant_note || ''
  noteDialogVisible.value = true
}

function openEditDialog(row: any) {
  editForm.value = {
    id: row._id,
    nickname: row.nickname || '',
    real_name: row.real_name || '',
    phone: row.phone || '',
    gender: row.gender || 'unknown',
    age: row.age || 0,
    birthday: row.birthday || '',
    points: row.points || 0,
    membership_level: legacyMembershipMap[row.membership_level] || row.membership_level || membershipLevels.value[0] || '普通会员',
    punch_card_remaining: row.punch_card_remaining || 0,
    stored_value_balance_yuan: (Number(row.stored_value_balance) || 0) / 100,
    customer_note: row.customer_note || '',
    merchant_note: row.merchant_note || '',
  }
  editDialogVisible.value = true
}

async function saveNote() {
  try {
    await customerApi.updateMerchantNote(editingCustomerId.value, editNoteValue.value)
    ElMessage.success('备注已更新')
    noteDialogVisible.value = false
    await loadData()
  } catch (e: any) { ElMessage.error(e?.response?.data?.message || '失败') }
}

async function saveCustomer() {
  try {
    await customerApi.update(editForm.value.id, {
      nickname: editForm.value.nickname,
      real_name: editForm.value.real_name,
      phone: editForm.value.phone,
      gender: editForm.value.gender,
      age: editForm.value.age,
      birthday: editForm.value.birthday,
      points: editForm.value.points,
      membership_level: editForm.value.membership_level,
      punch_card_remaining: editForm.value.punch_card_remaining,
      stored_value_balance: Math.round((Number(editForm.value.stored_value_balance_yuan) || 0) * 100),
      customer_note: editForm.value.customer_note,
      merchant_note: editForm.value.merchant_note,
    })
    ElMessage.success('顾客资料已更新')
    editDialogVisible.value = false
    await loadData()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '保存失败')
  }
}

async function deleteCustomer(row: any) {
  await ElMessageBox.confirm(`确认删除顾客「${row.real_name || row.nickname || '未命名顾客'}」？`, '确认')
  try {
    await customerApi.delete(row._id)
    ElMessage.success('顾客已删除')
    await loadData()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '删除失败')
  }
}

onMounted(async () => {
  await loadMembershipLevels()
  await loadData()
})
</script>

<style scoped>
.header-row { display: flex; justify-content: space-between; align-items: center; }
.header-title { font-weight: 600; font-size: 16px; }
</style>
