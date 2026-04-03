<template>
  <div>
    <el-card>
      <template #header><span style="font-weight:600">入驻审核</span></template>

      <el-table :data="tableData" stripe v-loading="loading">
        <el-table-column prop="merchant_id" label="商户ID" width="140" />
        <el-table-column prop="name" label="门店名称" width="160" />
        <el-table-column prop="phone" label="联系电话" width="130" />
        <el-table-column prop="address" label="地址" show-overflow-tooltip />
        <el-table-column prop="description" label="简介" show-overflow-tooltip />
        <el-table-column prop="owner_id" label="申请人" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'pending' ? 'warning' : row.status === 'active' ? 'success' : 'danger'" size="small">
              {{ row.status === 'pending' ? '待审核' : row.status === 'active' ? '已通过' : '已拒绝' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="申请时间" width="170">
          <template #default="{ row }">{{ row.create_time ? new Date(row.create_time).toLocaleString() : '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'pending'">
              <el-button type="success" size="small" @click="approve(row)">通过</el-button>
              <el-button type="danger" size="small" plain @click="reject(row)">拒绝</el-button>
            </template>
            <span v-else style="color: #909399; font-size: 13px">已处理</span>
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

async function loadData() {
  loading.value = true
  try {
    const res = await adminApi.getMerchants({ page: currentPage.value, pageSize, status: 'pending' }) as any
    tableData.value = res?.list || (Array.isArray(res) ? res : [])
    total.value = res?.total || tableData.value.length
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

async function approve(row: any) {
  await ElMessageBox.confirm(`通过「${row.name}」的入驻申请？`, '审核确认')
  try {
    await adminApi.updateMerchantStatus(row._id, 'active')
    ElMessage.success('已通过')
    await loadData()
  } catch (e: any) { ElMessage.error(e?.response?.data?.message || '操作失败') }
}

async function reject(row: any) {
  await ElMessageBox.confirm(`拒绝「${row.name}」的入驻申请？`, '审核确认')
  try {
    await adminApi.updateMerchantStatus(row._id, 'rejected')
    ElMessage.success('已拒绝')
    await loadData()
  } catch (e: any) { ElMessage.error(e?.response?.data?.message || '操作失败') }
}

onMounted(() => loadData())
</script>
