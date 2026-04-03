<template>
  <div>
    <el-card>
      <template #header>
        <div class="header-row">
          <span class="header-title">记账管理</span>
          <el-button type="primary" @click="openDialog()">新增记录</el-button>
        </div>
      </template>

      <div class="filter-row">
        <el-date-picker v-model="filterDate" type="date" placeholder="按日期" value-format="YYYY-MM-DD" clearable style="width: 160px" @change="loadData" />
      </div>

      <el-table :data="tableData" stripe v-loading="loading">
        <el-table-column prop="transaction_id" label="交易编号" width="220" show-overflow-tooltip />
        <el-table-column prop="transaction_date" label="日期" width="110" />
        <el-table-column prop="customer_name" label="顾客" width="100" />
        <el-table-column prop="staff_name" label="员工" width="90" />
        <el-table-column label="项目明细" min-width="160">
          <template #default="{ row }">
            <span v-for="(item, idx) in (row.items || [])" :key="idx">
              {{ item.service_name }} ×{{ item.quantity }}
              <template v-if="idx < row.items.length - 1">；</template>
            </span>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="100">
          <template #default="{ row }"><span style="font-weight:600; color:#e6a23c">¥{{ (row.total_amount / 100).toFixed(2) }}</span></template>
        </el-table-column>
        <el-table-column prop="payment_method" label="支付方式" width="100">
          <template #default="{ row }">{{ payLabel(row.payment_method) }}</template>
        </el-table-column>
        <el-table-column prop="note" label="备注" show-overflow-tooltip />
      </el-table>

      <el-pagination v-if="total > pageSize" style="margin-top: 16px; justify-content: flex-end" background layout="prev, pager, next" :total="total" :page-size="pageSize" v-model:current-page="currentPage" @current-change="loadData" />
    </el-card>

    <!-- 新增记账弹窗 -->
    <el-dialog v-model="dialogVisible" title="新增记账" width="560px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="顾客姓名" required>
          <el-input v-model="form.customer_name" placeholder="输入顾客姓名" style="width: 300px" />
        </el-form-item>
        <el-form-item label="服务明细" required>
          <div style="width: 100%">
            <div v-for="(item, idx) in form.items" :key="idx" style="display: flex; gap: 8px; margin-bottom: 8px">
              <el-input v-model="item.service_name" placeholder="服务名称" style="flex: 2" />
              <el-input-number v-model="item.amount" :min="0" :precision="0" placeholder="金额(分)" style="flex: 1" />
              <el-input-number v-model="item.quantity" :min="1" placeholder="数量" style="width: 100px" />
              <el-button type="danger" plain size="small" @click="removeItem(idx)" :disabled="form.items.length <= 1">×</el-button>
            </div>
            <el-button type="primary" plain size="small" @click="addItem">+ 添加项目</el-button>
          </div>
        </el-form-item>
        <el-form-item label="支付方式" required>
          <el-select v-model="form.payment_method" style="width: 300px">
            <el-option v-for="m in payMethods" :key="m.value" :label="m.label" :value="m.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.note" type="textarea" :rows="2" placeholder="备注" style="width: 300px" />
        </el-form-item>
        <el-form-item label="合计金额">
          <span style="font-size: 20px; font-weight: 700; color: #e6a23c">¥{{ totalYuan }}</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="onSubmit">确认记账</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { transactionApi } from '@/api/request'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const authStore = useAuthStore()
const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const pageSize = 20
const currentPage = ref(1)
const filterDate = ref('')
const dialogVisible = ref(false)

const payMethods = [
  { value: 'wechat', label: '微信支付' },
  { value: 'alipay', label: '支付宝' },
  { value: 'cash', label: '现金' },
  { value: 'stored_value', label: '储值卡' },
  { value: 'punch_card', label: '次卡' },
  { value: 'other', label: '其他' },
]

const payLabel = (v: string) => payMethods.find(m => m.value === v)?.label || v

const form = ref<any>({
  customer_name: '',
  items: [{ service_name: '', amount: 0, quantity: 1 }],
  payment_method: 'cash',
  note: '',
})

const totalYuan = computed(() => (form.value.items.reduce((s: number, i: any) => s + (i.amount || 0) * (i.quantity || 1), 0) / 100).toFixed(2))

function addItem() { form.value.items.push({ service_name: '', amount: 0, quantity: 1 }) }
function removeItem(idx: number) { form.value.items.splice(idx, 1) }

function openDialog() {
  form.value = { customer_name: '', items: [{ service_name: '', amount: 0, quantity: 1 }], payment_method: 'cash', note: '' }
  dialogVisible.value = true
}

async function onSubmit() {
  if (!form.value.customer_name.trim()) return ElMessage.warning('请输入顾客姓名')
  const validItems = form.value.items.filter((i: any) => i.service_name.trim() && i.amount > 0)
  if (validItems.length === 0) return ElMessage.warning('请添加有效服务项目')
  try {
    await transactionApi.create({
      merchant_id: authStore.user.merchantId,
      customer_name: form.value.customer_name.trim(),
      staff_id: '',
      total_amount: validItems.reduce((s: number, i: any) => s + i.amount * i.quantity, 0),
      items: validItems,
      payment_method: form.value.payment_method,
      note: form.value.note.trim() || undefined,
    })
    ElMessage.success('记账成功')
    dialogVisible.value = false
    await loadData()
  } catch (e: any) { ElMessage.error(e?.response?.data?.message || '失败') }
}

async function loadData() {
  loading.value = true
  try {
    const params: any = { merchant_id: authStore.user.merchantId, page: currentPage.value, pageSize }
    if (filterDate.value) params.transaction_date = filterDate.value
    const res = await transactionApi.getList(params) as any
    tableData.value = res?.list || (Array.isArray(res) ? res : [])
    total.value = res?.total || tableData.value.length
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

onMounted(() => loadData())
</script>

<style scoped>
.header-row { display: flex; justify-content: space-between; align-items: center; }
.header-title { font-weight: 600; font-size: 16px; }
.filter-row { margin-bottom: 16px; }
</style>
