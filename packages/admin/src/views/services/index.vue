<template>
  <div>
    <el-card>
      <template #header>
        <div class="header-row">
          <span class="header-title">服务管理</span>
          <el-button type="primary" @click="openDialog()">新增服务</el-button>
        </div>
      </template>

      <el-table :data="tableData" stripe v-loading="loading">
        <el-table-column prop="name" label="服务名称" width="140" />
        <el-table-column prop="category" label="分类" width="100">
          <template #default="{ row }">{{ categoryLabel(row.category) }}</template>
        </el-table-column>
        <el-table-column label="价格" width="100">
          <template #default="{ row }"><span style="font-weight:600">¥{{ (row.price / 100).toFixed(0) }}</span></template>
        </el-table-column>
        <el-table-column label="总时长" width="90">
          <template #default="{ row }">{{ row.total_duration }}分钟</template>
        </el-table-column>
        <el-table-column label="忙碌时长" width="90">
          <template #default="{ row }">{{ row.staff_busy_duration }}分钟</template>
        </el-table-column>
        <el-table-column label="服务阶段" min-width="200">
          <template #default="{ row }">
            <el-tag v-for="(stage, idx) in (row.stages || [])" :key="idx" size="small" style="margin: 2px" :type="stage.staff_busy ? 'danger' : 'success'">
              {{ stage.name }} {{ stage.duration }}min {{ stage.staff_busy ? '(忙)' : '(闲)' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="is_active" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.is_active ? 'success' : 'info'" size="small">{{ row.is_active ? '上架' : '下架' }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort_order" label="排序" width="70" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="openDialog(row)">编辑</el-button>
            <el-popconfirm title="确定删除该服务？" @confirm="deleteItem(row)">
              <template #reference>
                <el-button type="danger" size="small" plain :disabled="row.is_active">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑服务' : '新增服务'" width="560px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="服务名称" required>
          <el-input v-model="form.name" style="width: 300px" />
        </el-form-item>
        <el-form-item label="分类" required>
          <el-select v-model="form.category" style="width: 300px">
            <el-option label="剪发" value="cut" />
            <el-option label="烫发" value="perm" />
            <el-option label="染发" value="dye" />
            <el-option label="护理" value="care" />
          </el-select>
        </el-form-item>
        <el-form-item label="价格（元）" required>
          <el-input-number v-model="form.priceYuan" :min="0" :precision="0" style="width: 300px" />
        </el-form-item>
        <el-form-item label="总时长（分钟）" required>
          <el-input-number v-model="form.total_duration" :min="1" style="width: 300px" />
        </el-form-item>
        <el-form-item label="忙碌时长（分钟）" required>
          <el-input-number v-model="form.staff_busy_duration" :min="0" :max="form.total_duration" style="width: 300px" />
        </el-form-item>
        <el-form-item label="服务阶段">
          <div style="width: 100%">
            <div v-for="(stage, idx) in form.stages" :key="idx" style="display: flex; gap: 8px; margin-bottom: 8px; align-items: center">
              <el-input v-model="stage.name" placeholder="阶段名称" style="flex: 2" />
              <el-input-number v-model="stage.duration" :min="1" placeholder="时长" style="width: 100px" />
              <el-switch v-model="stage.staff_busy" active-text="忙碌" inactive-text="空闲" />
              <el-button type="danger" plain size="small" @click="removeStage(idx)" :disabled="form.stages.length <= 1">×</el-button>
            </div>
            <el-button type="primary" plain size="small" @click="addStage">+ 添加阶段</el-button>
          </div>
        </el-form-item>
        <el-form-item label="上架">
          <el-switch v-model="form.is_active" />
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort_order" :min="0" style="width: 300px" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" style="width: 300px" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="onSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { serviceApi } from '@/api/request'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const authStore = useAuthStore()
const loading = ref(false)
const tableData = ref<any[]>([])
const dialogVisible = ref(false)
const editingId = ref('')

const categoryLabel = (c: string) => ({ cut: '剪发', perm: '烫发', dye: '染发', care: '护理' }[c] || c)

const emptyForm = () => ({
  name: '', category: 'cut', priceYuan: 0, total_duration: 30, staff_busy_duration: 30,
  stages: [{ name: '', duration: 30, staff_busy: true }], is_active: true, sort_order: 0, description: '',
})

const form = ref<any>(emptyForm())

function addStage() { form.value.stages.push({ name: '', duration: 10, staff_busy: false }) }
function removeStage(idx: number) { form.value.stages.splice(idx, 1) }

function openDialog(row?: any) {
  if (row) {
    editingId.value = row._id
    form.value = {
      ...row,
      priceYuan: row.price / 100,
      stages: row.stages?.length ? [...row.stages.map((s: any) => ({ ...s }))] : [{ name: '', duration: row.total_duration, staff_busy: true }],
    }
  } else {
    editingId.value = ''
    form.value = emptyForm()
  }
  dialogVisible.value = true
}

async function onSubmit() {
  if (!form.value.name.trim()) return ElMessage.warning('请输入服务名称')
  try {
    const data = {
      ...form.value,
      price: Math.round(form.value.priceYuan * 100),
      merchant_id: authStore.user.merchantId,
    }
    delete data.priceYuan
    delete data._id
    delete data.create_time
    delete data.update_time
    if (editingId.value) {
      await serviceApi.update(editingId.value, data)
      ElMessage.success('更新成功')
    } else {
      await serviceApi.create(data)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    await loadData()
  } catch (e: any) { ElMessage.error(e?.response?.data?.message || '操作失败') }
}

async function deleteItem(row: any) {
  try {
    await serviceApi.delete(row._id)
    ElMessage.success('已删除')
    await loadData()
  } catch (e: any) { ElMessage.error(e?.response?.data?.message || '删除失败') }
}

async function loadData() {
  loading.value = true
  try {
    const res = await serviceApi.getList({ merchant_id: authStore.user.merchantId }) as any
    tableData.value = res?.list || (Array.isArray(res) ? res : [])
  } catch (e) { console.error(e) }
  finally { loading.value = false }
}

onMounted(() => loadData())
</script>

<style scoped>
.header-row { display: flex; justify-content: space-between; align-items: center; }
.header-title { font-weight: 600; font-size: 16px; }
</style>
