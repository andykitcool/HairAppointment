<template>
  <div>
    <el-card>
      <template #header>
        <div class="header-row">
          <span style="font-weight:600">门店管理</span>
        </div>
      </template>

      <el-table :data="tableData" stripe v-loading="loading">
        <el-table-column prop="merchant_id" label="商户ID" width="140" />
        <el-table-column prop="name" label="门店名称" width="160" />
        <el-table-column prop="phone" label="联系电话" width="130" />
        <el-table-column prop="address" label="地址" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">{{ statusLabel(row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="owner_id" label="店长ID" width="120" />
        <el-table-column label="营业时间" width="140">
          <template #default="{ row }">
            {{ row.business_hours?.start || '-' }} - {{ row.business_hours?.end || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'pending'" type="success" size="small" @click="updateStatus(row, 'active')">通过</el-button>
            <el-button v-if="row.status === 'pending'" type="danger" size="small" plain @click="updateStatus(row, 'rejected')">拒绝</el-button>
            <el-button v-if="row.status === 'active'" type="warning" size="small" plain @click="updateStatus(row, 'inactive')">停用</el-button>
            <el-button v-if="row.status === 'inactive'" type="success" size="small" @click="updateStatus(row, 'active')">启用</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination v-if="total > pageSize" style="margin-top: 16px; justify-content: flex-end" background layout="prev, pager, next" :total="total" :page-size="pageSize" v-model:current-page="currentPage" @current-change="loadData" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { adminApi } from '@/api/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const tableData = ref<any[]>([])
const total = ref(0)
const pageSize = 20
const currentPage = ref(1)

const statusLabel = (s: string) => ({ pending: '待审核', active: '已启用', inactive: '已停用', rejected: '已拒绝' }[s] || s)
const statusTagType = (s: string) => ({ pending: 'warning', active: 'success', inactive: 'info', rejected: 'danger' }[s] || 'info') as any

async function loadData() {
  loading.value = true
  try {
    const res = await adminApi.getMerchants({ page: currentPage.value, pageSize }) as any
    tableData.value = res?.list || (Array.isArray(res) ? res : [])
    total.value = res?.total || tableData.value.length
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

async function updateStatus(row: any, status: string) {
  const label = status === 'active' ? '通过' : status === 'rejected' ? '拒绝' : status === 'inactive' ? '停用' : '启用'
  await ElMessageBox.confirm(`${label}门店「${row.name}」？`, '确认')
  try {
    await adminApi.updateMerchantStatus(row._id, status)
    ElMessage.success(`${label}成功`)
    await loadData()
  } catch (e: any) { ElMessage.error(e?.response?.data?.message || '操作失败') }
}

onMounted(() => loadData())
</script>

<style scoped>
.header-row { display: flex; justify-content: space-between; align-items: center; }
</style>
