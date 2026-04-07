<template>
  <div>
    <el-card>
      <template #header>
        <div class="header-row">
          <span class="header-title">预约管理</span>
          <div class="header-filters">
            <el-date-picker v-model="filterDate" type="date" placeholder="按日期筛选" size="default" value-format="YYYY-MM-DD" clearable style="width: 160px" @change="loadData" />
            <el-select v-model="filterStatus" placeholder="状态筛选" clearable style="width: 130px; margin-left: 10px" @change="loadData">
              <el-option v-for="s in statusOptions" :key="s.value" :label="s.label" :value="s.value" />
            </el-select>
          </div>
        </div>
      </template>

      <el-table :data="tableData" stripe size="default" v-loading="loading">
        <el-table-column prop="appointment_id" label="预约编号" width="150" />
        <el-table-column prop="customer_name" label="顾客" width="100" />
        <el-table-column prop="customer_phone" label="电话" width="120" />
        <el-table-column prop="service_name" label="服务项目" width="120" />
        <el-table-column prop="staff_name" label="发型师" width="90" />
        <el-table-column prop="date" label="日期" width="110" />
        <el-table-column label="时间" width="120">
          <template #default="{ row }">{{ row.start_time }} - {{ row.end_time }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="source" label="来源" width="90">
          <template #default="{ row }">{{ sourceLabel(row.source) }}</template>
        </el-table-column>
        <el-table-column prop="note" label="备注" show-overflow-tooltip />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'pending'" type="primary" size="small" @click="confirmApt(row)">确认</el-button>
            <el-button v-if="row.status === 'confirmed'" type="success" size="small" @click="startApt(row)">开始服务</el-button>
            <el-button v-if="row.status === 'in_progress'" type="warning" size="small" @click="completeApt(row)">完成</el-button>
            <el-button v-if="row.status === 'confirmed'" type="info" size="small" plain @click="markNoShow(row)">未到店</el-button>
            <el-button v-if="['pending', 'confirmed'].includes(row.status)" type="danger" size="small" plain @click="cancelApt(row)">取消</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination v-if="total > pageSize" style="margin-top: 16px; justify-content: flex-end" background layout="prev, pager, next" :total="total" :page-size="pageSize" v-model:current-page="currentPage" @current-change="loadData" />
    </el-card>

    <!-- 完成服务弹窗 -->
    <el-dialog v-model="completeDialogVisible" title="完成服务并记账" width="480px">
      <el-form :model="completeForm" label-width="100px">
        <el-form-item label="顾客">
          <span>{{ completeForm.customer_name }}</span>
        </el-form-item>
        <el-form-item label="服务项目">
          <span>{{ completeForm.service_name }}</span>
        </el-form-item>
        <el-form-item label="金额（元）" required>
          <el-input-number v-model="completeForm.amountYuan" :min="0" :precision="2" style="width: 200px" />
        </el-form-item>
        <el-form-item label="支付方式" required>
          <el-select v-model="completeForm.payment_method" style="width: 200px">
            <el-option v-for="m in payMethods" :key="m.value" :label="m.label" :value="m.value" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="completeDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitComplete">确认完成并记账</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { appointmentApi, serviceApi } from '@/api/request'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'

const authStore = useAuthStore()
const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const pageSize = 20
const currentPage = ref(1)
const filterDate = ref('')
const filterStatus = ref('')

const statusOptions = [
  { value: 'pending', label: '待确认' },
  { value: 'confirmed', label: '已确认' },
  { value: 'in_progress', label: '服务中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
  { value: 'no_show', label: '未到店' },
]

const payMethods = [
  { value: 'wechat', label: '微信支付' },
  { value: 'alipay', label: '支付宝' },
  { value: 'cash', label: '现金' },
  { value: 'stored_value', label: '储值卡' },
  { value: 'punch_card', label: '次卡' },
  { value: 'other', label: '其他' },
]

const statusLabel = (s: string) => ({ pending: '待确认', confirmed: '已确认', in_progress: '服务中', completed: '已完成', cancelled: '已取消', no_show: '未到店' }[s] || s)
const statusTagType = (s: string) => ({ pending: 'warning', confirmed: 'success', in_progress: 'primary', completed: 'info', cancelled: 'danger', no_show: 'danger' }[s] || 'info') as any
const sourceLabel = (s: string) => ({ mini_program: '小程序', coze: 'COZE', feishu: '飞书', web: 'Web' }[s] || s || '-')

const completeDialogVisible = ref(false)
const servicePriceMap = ref<Record<string, number>>({})
const completeForm = ref<any>({ appointment_id: '', customer_name: '', service_name: '', amountYuan: 0, payment_method: 'wechat' })

async function loadServicePrices() {
  try {
    const res = await serviceApi.getList({ merchant_id: authStore.user.merchantId }) as any
    const payload = res?.data ?? res
    const list = payload?.list || (Array.isArray(payload) ? payload : [])
    servicePriceMap.value = Object.fromEntries(
      list.map((service: any) => [service.service_id, Number(service.price) || 0])
    )
  } catch (e) {
    console.error('Load service prices failed', e)
  }
}

async function loadData() {
  loading.value = true
  try {
    const params: any = { merchant_id: authStore.user.merchantId, page: currentPage.value, pageSize }
    if (filterDate.value) params.date = filterDate.value
    if (filterStatus.value) params.status = filterStatus.value
    const res = await appointmentApi.getList(params) as any
    const payload = res?.data ?? res
    tableData.value = payload?.list || (Array.isArray(payload) ? payload : [])
    total.value = payload?.total ?? tableData.value.length
  } catch (e: any) {
    console.error(e)
    ElMessage.error(e?.response?.data?.message || '加载预约失败')
  }
  finally { loading.value = false }
}

async function confirmApt(row: any) {
  try {
    await appointmentApi.confirm(row.appointment_id)
    ElMessage.success('已确认')
    await loadData()
  } catch (e: any) { ElMessage.error(e?.response?.data?.message || '操作失败') }
}

async function startApt(row: any) {
  try {
    await appointmentApi.start(row.appointment_id)
    ElMessage.success('服务已开始')
    await loadData()
  } catch (e: any) { ElMessage.error(e?.response?.data?.message || '操作失败') }
}

function completeApt(row: any) {
  const servicePriceFen = Number(servicePriceMap.value[row.service_id]) || 0
  completeForm.value = {
    appointment_id: row.appointment_id,
    customer_name: row.customer_name,
    service_name: row.service_name,
    amountYuan: servicePriceFen / 100,
    payment_method: 'wechat',
  }
  completeDialogVisible.value = true
}

async function submitComplete() {
  try {
    await appointmentApi.complete(completeForm.value.appointment_id, {
      total_amount: Math.round(completeForm.value.amountYuan * 100),
      payment_method: completeForm.value.payment_method,
    })
    ElMessage.success('已完成并记账')
    completeDialogVisible.value = false
    await loadData()
  } catch (e: any) { ElMessage.error(e?.response?.data?.message || '操作失败') }
}

async function markNoShow(row: any) {
  await ElMessageBox.confirm(`标记 ${row.customer_name} 未到店？`, '确认')
  try {
    await appointmentApi.markNoShow(row.appointment_id)
    ElMessage.success('已标记')
    await loadData()
  } catch (e: any) { ElMessage.error(e?.response?.data?.message || '操作失败') }
}

async function cancelApt(row: any) {
  await ElMessageBox.confirm(`取消 ${row.customer_name} 的预约？`, '确认')
  try {
    await appointmentApi.cancel(row.appointment_id)
    ElMessage.success('已取消')
    await loadData()
  } catch (e: any) { ElMessage.error(e?.response?.data?.message || '操作失败') }
}

onMounted(() => {
  loadServicePrices()
  loadData()
})
</script>

<style scoped>
.header-row { display: flex; justify-content: space-between; align-items: center; }
.header-title { font-weight: 600; font-size: 16px; }
.header-filters { display: flex; align-items: center; }
</style>
