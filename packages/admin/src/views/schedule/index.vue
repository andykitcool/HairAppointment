<template>
  <div>
    <!-- 营业时间 -->
    <el-card style="margin-bottom: 16px">
      <template #header><span style="font-weight:600">营业时间</span></template>
      <el-form :model="hoursForm" label-width="100px" inline>
        <el-form-item label="开始时间">
          <el-time-picker v-model="hoursForm.start" format="HH:mm" value-format="HH:mm" placeholder="开始" />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-time-picker v-model="hoursForm.end" format="HH:mm" value-format="HH:mm" placeholder="结束" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveHours">保存营业时间</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 延长营业时间 -->
    <el-card style="margin-bottom: 16px">
      <template #header>
        <div class="header-row">
          <span style="font-weight:600">延长营业时间</span>
          <el-button type="primary" size="small" @click="openExtendedDialog()">添加</el-button>
        </div>
      </template>
      <el-table :data="extendedList" stripe size="small" empty-text="暂无延长营业配置">
        <el-table-column label="生效日期" width="240">
          <template #default="{ row }">{{ row.start_date }} ~ {{ row.end_date }}</template>
        </el-table-column>
        <el-table-column label="延长至" width="100">
          <template #default="{ row }">{{ row.extended_end }}</template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row, $index }">
            <el-button size="small" @click="openExtendedDialog(row, $index)">编辑</el-button>
            <el-popconfirm title="删除该配置？" @confirm="deleteExtended($index)">
              <template #reference><el-button type="danger" size="small" plain>删除</el-button></template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 打烊管理 -->
    <el-card>
      <template #header>
        <div class="header-row">
          <span style="font-weight:600">打烊管理</span>
          <el-button type="primary" size="small" @click="openClosedDialog()">设置打烊</el-button>
        </div>
      </template>
      <el-table :data="closedList" stripe size="small" empty-text="暂无打烊记录">
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">{{ row.type === 'full_day' ? '全天打烊' : '段打烊' }}</template>
        </el-table-column>
        <el-table-column label="时段">
          <template #default="{ row }">
            {{ row.type === 'time_range' ? `${row.start_time} ~ ${row.end_time}` : '全天' }}
          </template>
        </el-table-column>
        <el-table-column prop="reason" label="原因" show-overflow-tooltip />
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-popconfirm title="取消该打烊记录？" @confirm="deleteClosed(row)">
              <template #reference><el-button type="danger" size="small" plain>取消</el-button></template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 延长营业弹窗 -->
    <el-dialog v-model="extDialogVisible" title="设置延长营业" width="440px">
      <el-form :model="extForm" label-width="100px">
        <el-form-item label="生效日期" required>
          <el-date-picker v-model="extForm.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="延长至" required>
          <el-time-picker v-model="extForm.extended_end" format="HH:mm" value-format="HH:mm" placeholder="结束时间" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="extDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveExtended">保存</el-button>
      </template>
    </el-dialog>

    <!-- 打烊弹窗 -->
    <el-dialog v-model="closedDialogVisible" title="设置打烊" width="440px">
      <el-form :model="closedForm" label-width="100px">
        <el-form-item label="打烊日期" required>
          <el-date-picker v-model="closedForm.date" type="date" placeholder="选择日期" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="打烊类型" required>
          <el-radio-group v-model="closedForm.type">
            <el-radio value="full_day">全天打烊</el-radio>
            <el-radio value="time_range">段打烊</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="closedForm.type === 'time_range'" label="打烊时段" required>
          <div style="display: flex; gap: 8px; align-items: center">
            <el-time-picker v-model="closedForm.start_time" format="HH:mm" value-format="HH:mm" placeholder="开始" />
            <span>至</span>
            <el-time-picker v-model="closedForm.end_time" format="HH:mm" value-format="HH:mm" placeholder="结束" />
          </div>
        </el-form-item>
        <el-form-item label="原因">
          <el-input v-model="closedForm.reason" placeholder="打烊原因（选填）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closedDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveClosed">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { merchantApi } from '@/api/request'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const authStore = useAuthStore()
const mid = authStore.user.merchantId

const hoursForm = ref({ start: '09:00', end: '21:00' })
const extendedList = ref<any[]>([])
const closedList = ref<any[]>([])

const extDialogVisible = ref(false)
const extEditIndex = ref(-1)
const extForm = ref<any>({ dateRange: null, extended_end: '' })

const closedDialogVisible = ref(false)
const closedForm = ref<any>({ date: '', type: 'full_day', start_time: '', end_time: '', reason: '' })

async function loadData() {
  try {
    const [merchantRes, closedRes] = await Promise.all([
      merchantApi.getInfo(mid) as any,
      merchantApi.getClosedPeriods(mid) as any,
    ])
    const merchant = merchantRes || merchantRes?.data
    if (merchant?.business_hours) {
      hoursForm.value.start = merchant.business_hours.start || '09:00'
      hoursForm.value.end = merchant.business_hours.end || '21:00'
    }
    extendedList.value = merchant?.extended_hours || []
    closedList.value = closedRes?.list || (Array.isArray(closedRes) ? closedRes : [])
  } catch (e) { console.error(e) }
}

async function saveHours() {
  try {
    await merchantApi.update(mid, { business_hours: { start: hoursForm.value.start, end: hoursForm.value.end } })
    ElMessage.success('营业时间已更新')
  } catch (e: any) { ElMessage.error(e?.response?.data?.message || '失败') }
}

function openExtendedDialog(row?: any, idx?: number) {
  if (row) {
    extEditIndex.value = idx!
    extForm.value = { dateRange: [row.start_date, row.end_date], extended_end: row.extended_end }
  } else {
    extEditIndex.value = -1
    extForm.value = { dateRange: null, extended_end: '' }
  }
  extDialogVisible.value = true
}

async function saveExtended() {
  if (!extForm.value.dateRange?.length || !extForm.value.extended_end) return ElMessage.warning('请填写完整')
  try {
    const data = { start_date: extForm.value.dateRange[0], end_date: extForm.value.dateRange[1], extended_end: extForm.value.extended_end }
    if (extEditIndex.value >= 0) {
      await merchantApi.updateExtendedHours(mid, extEditIndex.value, data)
    } else {
      await merchantApi.setExtendedHours(mid, data)
    }
    ElMessage.success('保存成功')
    extDialogVisible.value = false
    await loadData()
  } catch (e: any) { ElMessage.error(e?.response?.data?.message || '失败') }
}

async function deleteExtended(idx: number) {
  try {
    await merchantApi.deleteExtendedHours(mid, idx)
    ElMessage.success('已删除')
    await loadData()
  } catch (e: any) { ElMessage.error(e?.response?.data?.message || '失败') }
}

function openClosedDialog() {
  closedForm.value = { date: '', type: 'full_day', start_time: '', end_time: '', reason: '' }
  closedDialogVisible.value = true
}

async function saveClosed() {
  if (!closedForm.value.date) return ElMessage.warning('请选择日期')
  if (closedForm.value.type === 'time_range' && (!closedForm.value.start_time || !closedForm.value.end_time)) return ElMessage.warning('请填写打烊时段')
  try {
    await merchantApi.createClosedPeriod(mid, closedForm.value)
    ElMessage.success('设置成功')
    closedDialogVisible.value = false
    await loadData()
  } catch (e: any) { ElMessage.error(e?.response?.data?.message || '失败') }
}

async function deleteClosed(row: any) {
  try {
    await merchantApi.deleteClosedPeriod(mid, row._id)
    ElMessage.success('已取消')
    await loadData()
  } catch (e: any) { ElMessage.error(e?.response?.data?.message || '失败') }
}

onMounted(() => loadData())
</script>

<style scoped>
.header-row { display: flex; justify-content: space-between; align-items: center; }
</style>
