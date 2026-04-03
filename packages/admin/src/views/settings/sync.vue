<template>
  <div>
    <el-card>
      <template #header>
        <div style="display: flex; justify-content: space-between; align-items: center">
          <span style="font-weight:600">同步配置</span>
          <el-switch v-model="enabled" active-text="同步已启用" @change="saveConfig" />
        </div>
      </template>

      <el-table :data="bindings" stripe size="default">
        <el-table-column prop="collection" label="数据表" width="140">
          <template #default="{ row }">{{ collectionLabel(row.collection) }}</template>
        </el-table-column>
        <el-table-column prop="table_token" label="飞书表 Token" width="200" />
        <el-table-column prop="enabled" label="启用" width="100">
          <template #default="{ row }">
            <el-switch v-model="row.enabled" @change="saveConfig" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160">
          <template #default="{ row, $index }">
            <el-button size="small" @click="editBinding(row, $index)">编辑</el-button>
            <el-button size="small" type="danger" plain @click="removeBinding($index)" :disabled="bindings.length <= 1">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-button type="primary" plain size="small" style="margin-top: 16px" @click="addBinding">+ 添加绑定</el-button>
    </el-card>

    <el-dialog v-model="dialogVisible" title="编辑绑定" width="420px">
      <el-form :model="editForm" label-width="100px">
        <el-form-item label="数据表">
          <el-select v-model="editForm.collection" style="width: 100%">
            <el-option label="预约表" value="appointments" />
            <el-option label="交易表" value="transactions" />
          </el-select>
        </el-form-item>
        <el-form-item label="飞书表 Token">
          <el-input v-model="editForm.table_token" placeholder="飞书多维表格 Token" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveBinding">保存</el-button>
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
const enabled = ref(true)
const bindings = ref<any[]>([])
const dialogVisible = ref(false)
const editIndex = ref(-1)
const editForm = ref({ collection: 'appointments', table_token: '' })

const collectionLabel = (c: string) => ({ appointments: '预约表', transactions: '交易表' }[c] || c)

async function loadConfig() {
  try {
    const res = await merchantApi.getInfo(authStore.user.merchantId) as any
    const config = res?.sync_config
    enabled.value = config?.enabled ?? true
    bindings.value = config?.bindings?.length ? config.bindings.map((b: any) => ({ ...b })) : [
      { collection: 'appointments', table_token: '', enabled: true },
    ]
  } catch (e) {
    bindings.value = [{ collection: 'appointments', table_token: '', enabled: true }]
  }
}

async function saveConfig() {
  try {
    await merchantApi.update(authStore.user.merchantId, { sync_config: { enabled: enabled.value, bindings: bindings.value } })
    ElMessage.success('配置已保存')
  } catch (e: any) { ElMessage.error(e?.response?.data?.message || '保存失败') }
}

function addBinding() {
  editIndex.value = -1
  editForm.value = { collection: 'transactions', table_token: '' }
  dialogVisible.value = true
}

function editBinding(row: any, idx: number) {
  editIndex.value = idx
  editForm.value = { ...row }
  dialogVisible.value = true
}

function saveBinding() {
  if (editIndex.value >= 0) {
    bindings.value[editIndex.value] = { ...editForm.value }
  } else {
    bindings.value.push({ ...editForm.value, enabled: true })
  }
  dialogVisible.value = false
  saveConfig()
}

function removeBinding(idx: number) {
  bindings.value.splice(idx, 1)
  saveConfig()
}

onMounted(() => loadConfig())
</script>
