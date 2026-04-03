<template>
  <div>
    <el-row :gutter="16" style="margin-bottom: 20px">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <el-statistic title="今日预约" :value="overview.todayAppointments || 0" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card revenue">
          <el-statistic title="今日营收" :value="((overview.todayRevenue || 0) / 100).toFixed(2)" prefix="¥" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <el-statistic title="总顾客数" :value="overview.totalCustomers || 0" />
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <el-statistic title="待确认预约" :value="overview.pendingCount || 0" />
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="16">
      <el-col :span="12">
        <el-card>
          <template #header><span style="font-weight:600">待处理预约</span></template>
          <el-table :data="pendingList" stripe size="small" max-height="360">
            <el-table-column prop="appointment_id" label="编号" width="140" />
            <el-table-column prop="customer_name" label="顾客" width="100" />
            <el-table-column prop="service_name" label="服务" />
            <el-table-column prop="start_time" label="时间" width="80" />
            <el-table-column label="操作" width="140" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" @click="confirmApt(row)">确认</el-button>
                <el-button type="danger" size="small" plain @click="cancelApt(row)">取消</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-if="pendingList.length === 0" description="暂无待处理" :image-size="60" />
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card>
          <template #header><span style="font-weight:600">最近交易</span></template>
          <el-table :data="recentTransactions" stripe size="small" max-height="360">
            <el-table-column prop="transaction_date" label="日期" width="110" />
            <el-table-column prop="customer_name" label="顾客" width="100" />
            <el-table-column prop="items" label="项目">
              <template #default="{ row }">{{ (row.items || []).map((i: any) => i.service_name).join('、') }}</template>
            </el-table-column>
            <el-table-column label="金额" width="100">
              <template #default="{ row }">¥{{ (row.total_amount / 100).toFixed(2) }}</template>
            </el-table-column>
          </el-table>
          <el-empty v-if="recentTransactions.length === 0" description="暂无记录" :image-size="60" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { appointmentApi, transactionApi, statsApi } from '@/api/request'
import { useAuthStore } from '@/stores/auth'
import { ElMessage, ElMessageBox } from 'element-plus'

const authStore = useAuthStore()
const overview = ref<any>({})
const pendingList = ref<any[]>([])
const recentTransactions = ref<any[]>([])

async function loadData() {
  const mid = authStore.user.merchantId
  if (!mid) return
  try {
    const today = new Date().toISOString().slice(0, 10)
    const [aptRes, statsRes, txRes] = await Promise.all([
      appointmentApi.getList({ merchant_id: mid, date: today, pageSize: 50 }) as any,
      statsApi.getRevenue({ merchant_id: mid, start_date: today, end_date: today }) as any,
      transactionApi.getList({ merchant_id: mid, pageSize: 10 }) as any,
    ])
    const aptList = aptRes?.list || (Array.isArray(aptRes) ? aptRes : [])
    pendingList.value = aptList.filter((i: any) => i.status === 'pending')
    overview.value = {
      todayAppointments: aptList.length,
      pendingCount: pendingList.value.length,
      todayRevenue: statsRes?.summary?.totalRevenue || 0,
      totalCustomers: statsRes?.summary?.totalCustomers || 0,
    }
    recentTransactions.value = txRes?.list || (Array.isArray(txRes) ? txRes : [])
  } catch (e) {
    console.error('Dashboard load error', e)
  }
}

async function confirmApt(row: any) {
  try {
    await appointmentApi.confirm(row.appointment_id)
    ElMessage.success('已确认')
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

onMounted(() => loadData())
</script>

<style scoped>
.stat-card :deep(.el-statistic__number) { font-size: 24px; font-weight: 700; }
.stat-card.revenue :deep(.el-statistic__number) { color: #e6a23c; }
</style>
