<template>
  <div>
    <el-card>
      <template #header>
        <div class="header-row">
          <span style="font-weight:600">入驻审核</span>
          <el-radio-group v-model="filterStatus" size="small" @change="handleStatusChange">
            <el-radio-button label="applying">申请中</el-radio-button>
            <el-radio-button label="pending">待审核</el-radio-button>
            <el-radio-button label="all">全部</el-radio-button>
          </el-radio-group>
        </div>
      </template>

      <el-table :data="tableData" stripe v-loading="loading">
        <el-table-column prop="merchant_id" label="商户ID" width="130" />
        <el-table-column prop="name" label="门店名称" width="150" />
        <el-table-column prop="phone" label="联系电话" width="120" />
        <el-table-column prop="address" label="地址" show-overflow-tooltip min-width="150" />
        <el-table-column label="营业时间" width="120">
          <template #default="{ row }">
            {{ row.business_hours?.start || '-' }} - {{ row.business_hours?.end || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="申请人" width="120">
          <template #default="{ row }">
            {{ row.application_info?.applicant_name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="申请手机号" width="120">
          <template #default="{ row }">
            {{ row.application_info?.applicant_phone || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="create_time" label="申请时间" width="160">
          <template #default="{ row }">{{ row.create_time ? new Date(row.create_time).toLocaleString() : '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'applying' || row.status === 'pending'">
              <el-button type="success" size="small" @click="approve(row)">通过</el-button>
              <el-button type="danger" size="small" plain @click="reject(row)">拒绝</el-button>
            </template>
            <div v-else-if="row.application_info?.review_note" style="color: #909399; font-size: 12px">
              备注: {{ row.application_info.review_note }}
            </div>
            <span v-else style="color: #909399; font-size: 13px">已处理</span>
          </template>
        </el-table-column>
      </el-table>

      <el-pagination v-if="total > pageSize" style="margin-top: 16px; justify-content: flex-end" background layout="prev, pager, next" :total="total" :page-size="pageSize" v-model:current-page="currentPage" @current-change="loadData" />
    </el-card>

    <!-- 审核通过弹窗 - 显示账号信息 -->
    <el-dialog v-model="showAccountDialog" title="审核通过" width="400px" :close-on-click-modal="false">
      <el-result icon="success" title="门店创建成功" sub-title="店长管理员账号已生成">
        <template #extra>
          <div style="text-align: left; background: #f5f7fa; padding: 16px; border-radius: 8px; margin-bottom: 16px;">
            <div style="margin-bottom: 8px;"><strong>登录账号：</strong>{{ createdAccount?.username }}</div>
            <div style="margin-bottom: 8px;"><strong>临时密码：</strong>{{ createdAccount?.temp_password }}</div>
            <div style="color: #f56c6c; font-size: 13px;">请复制保存，密码只会显示一次！</div>
          </div>
          <el-button type="primary" @click="showAccountDialog = false">确定</el-button>
        </template>
      </el-result>
    </el-dialog>

    <!-- 拒绝弹窗 - 填写拒绝原因 -->
    <el-dialog v-model="showRejectDialog" title="拒绝申请" width="400px">
      <el-form :model="rejectForm" label-width="80px">
        <el-form-item label="拒绝原因">
          <el-input v-model="rejectForm.note" type="textarea" rows="3" placeholder="请输入拒绝原因（可选）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showRejectDialog = false">取消</el-button>
        <el-button type="danger" @click="confirmReject">确认拒绝</el-button>
      </template>
    </el-dialog>
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
const filterStatus = ref('applying')

// 审核通过弹窗
const showAccountDialog = ref(false)
const createdAccount = ref<any>(null)

// 拒绝弹窗
const showRejectDialog = ref(false)
const rejectForm = ref({ note: '' })
const currentRejectRow = ref<any>(null)

const statusLabel = (s: string) => ({
  applying: '申请中',
  pending: '待审核',
  active: '已通过',
  inactive: '已停用',
  rejected: '已拒绝'
}[s] || s)

const statusTagType = (s: string) => ({
  applying: 'primary',
  pending: 'warning',
  active: 'success',
  inactive: 'info',
  rejected: 'danger'
}[s] || 'info') as any

async function loadData() {
  loading.value = true
  try {
    const params: any = { page: currentPage.value, pageSize }
    if (filterStatus.value !== 'all') {
      params.status = filterStatus.value
    }
    const res = await adminApi.getApplications(params) as any
    tableData.value = res?.list || (Array.isArray(res) ? res : [])
    total.value = res?.total || tableData.value.length
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

function handleStatusChange() {
  currentPage.value = 1
  loadData()
}

async function approve(row: any) {
  await ElMessageBox.confirm(`通过「${row.name}」的入驻申请？\n\n申请人：${row.application_info?.applicant_name}\n手机号：${row.application_info?.applicant_phone}`, '审核确认')
  try {
    const res: any = await adminApi.reviewApplication(row.merchant_id, 'approve')
    ElMessage.success('审核通过')

    // 显示创建的账号信息
    if (res?.data?.admin_account) {
      createdAccount.value = res.data.admin_account
      showAccountDialog.value = true
    }

    await loadData()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '操作失败')
  }
}

function reject(row: any) {
  currentRejectRow.value = row
  rejectForm.value.note = ''
  showRejectDialog.value = true
}

async function confirmReject() {
  if (!currentRejectRow.value) return

  try {
    await adminApi.reviewApplication(
      currentRejectRow.value.merchant_id,
      'reject',
      rejectForm.value.note
    )
    ElMessage.success('已拒绝')
    showRejectDialog.value = false
    await loadData()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '操作失败')
  }
}

onMounted(() => loadData())
</script>

<style scoped>
.header-row { display: flex; justify-content: space-between; align-items: center; }
</style>
