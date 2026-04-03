<template>
  <div>
    <el-card style="margin-bottom: 16px">
      <template #header>
        <div class="header-row">
          <span style="font-weight:600">营收统计</span>
          <div class="header-filters">
            <el-radio-group v-model="period" @change="loadData">
              <el-radio-button value="day">日</el-radio-button>
              <el-radio-button value="week">周</el-radio-button>
              <el-radio-button value="month">月</el-radio-button>
            </el-radio-group>
            <el-date-picker v-model="dateRange" :type="period === 'day' ? 'date' : 'daterange'" :start-placeholder="period === 'day' ? '选择日期' : '开始日期'" :end-placeholder="'结束日期'" value-format="YYYY-MM-DD" clearable style="width: 240px; margin-left: 16px" @change="loadData" />
          </div>
        </div>
      </template>

      <el-row :gutter="16" style="margin-bottom: 20px">
        <el-col :span="6">
          <div class="summary-card">
            <div class="summary-value">¥{{ ((summary.totalRevenue || 0) / 100).toFixed(2) }}</div>
            <div class="summary-label">总营收</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="summary-card">
            <div class="summary-value">{{ summary.appointmentCount || 0 }}</div>
            <div class="summary-label">预约数</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="summary-card">
            <div class="summary-value">{{ summary.completedCount || 0 }}</div>
            <div class="summary-label">完成数</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="summary-card">
            <div class="summary-value">¥{{ avgPrice }}</div>
            <div class="summary-label">客单价</div>
          </div>
        </el-col>
      </el-row>

      <!-- 支付方式分布 -->
      <el-row :gutter="16" style="margin-bottom: 20px">
        <el-col :span="12">
          <h4 style="margin: 0 0 12px">支付方式分布</h4>
          <el-table :data="paymentData" size="small" stripe>
            <el-table-column prop="method" label="支付方式" />
            <el-table-column prop="count" label="笔数" width="80" />
            <el-table-column label="金额" width="120">
              <template #default="{ row }">¥{{ (row.amount / 100).toFixed(2) }}</template>
            </el-table-column>
          </el-table>
        </el-col>
        <el-col :span="12">
          <h4 style="margin: 0 0 12px">服务项目排行</h4>
          <el-table :data="serviceRanking" size="small" stripe>
            <el-table-column prop="service_name" label="服务" />
            <el-table-column prop="count" label="次数" width="80" />
            <el-table-column label="金额" width="120">
              <template #default="{ row }">¥{{ (row.amount / 100).toFixed(2) }}</template>
            </el-table-column>
          </el-table>
        </el-col>
      </el-row>

      <!-- 每日趋势 -->
      <h4 style="margin: 0 0 12px">每日营收趋势</h4>
      <el-table :data="dailyData" size="small" stripe>
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column label="营收" width="120">
          <template #default="{ row }"><span style="font-weight:600">¥{{ (row.amount / 100).toFixed(2) }}</span></template>
        </el-table-column>
        <el-table-column prop="appointmentCount" label="预约" width="80" />
        <el-table-column prop="completedCount" label="完成" width="80" />
        <el-table-column prop="cancelCount" label="取消" width="80" />
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { statsApi } from '@/api/request'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const period = ref('week')
const dateRange = ref<any>(null)

const summary = ref<any>({})
const paymentData = ref<any[]>([])
const serviceRanking = ref<any[]>([])
const dailyData = ref<any[]>([])

const avgPrice = computed(() => {
  const count = summary.value.completedCount || 0
  return count > 0 ? ((summary.value.totalRevenue || 0) / count / 100).toFixed(2) : '0.00'
})

function getDateParams(): any {
  const params: any = { merchant_id: authStore.user.merchantId }
  if (dateRange.value) {
    if (period.value === 'day') {
      params.start_date = dateRange.value
      params.end_date = dateRange.value
    } else if (Array.isArray(dateRange.value)) {
      params.start_date = dateRange.value[0]
      params.end_date = dateRange.value[1]
    }
  }
  return params
}

async function loadData() {
  try {
    const data = await statsApi.getRevenue(getDateParams()) as any
    summary.value = data?.summary || {}
    paymentData.value = data?.paymentDistribution || []
    serviceRanking.value = data?.serviceRanking || []
    dailyData.value = data?.daily || []
  } catch (e) { console.error(e) }
}

onMounted(() => loadData())
</script>

<style scoped>
.header-row { display: flex; justify-content: space-between; align-items: center; }
.header-filters { display: flex; align-items: center; }
.summary-card { background: #f5f7fa; border-radius: 8px; padding: 20px; text-align: center; }
.summary-value { font-size: 24px; font-weight: 700; color: #303133; }
.summary-label { font-size: 13px; color: #909399; margin-top: 4px; }
</style>
