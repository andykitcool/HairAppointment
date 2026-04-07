<template>
  <div>
    <el-card>
      <template #header>
        <div class="header-row">
          <span class="header-title">服务管理</span>
          <el-button type="primary" @click="addNewRow" :disabled="editingCell !== null">新增服务</el-button>
        </div>
      </template>

      <el-table :data="tableData" stripe v-loading="loading" row-key="service_id">
        <el-table-column prop="name" label="服务名称" min-width="160">
          <template #default="{ row }">
            <div @dblclick="startEdit(row, 'name')" class="cell-content">
              <el-input 
                v-if="isEditing(row, 'name')" 
                v-model="editValue" 
                size="small" 
                placeholder="服务名称" 
                style="width: 140px"
                @blur="saveEdit(row, 'name')"
                @keyup.enter="saveEdit(row, 'name')"
                ref="nameInput"
              />
              <span v-else>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" min-width="100">
          <template #default="{ row }">
            <div @dblclick="startEdit(row, 'category')" class="cell-content">
              <el-select 
                v-if="isEditing(row, 'category')" 
                v-model="editValue" 
                size="small" 
                style="width: 90px"
                @change="saveEdit(row, 'category')"
                @blur="saveEdit(row, 'category')"
                ref="categoryInput"
              >
                <el-option label="剪发" value="cut" />
                <el-option label="烫发" value="perm" />
                <el-option label="染发" value="dye" />
                <el-option label="养护" value="care" />
              </el-select>
              <span v-else>{{ categoryLabel(row.category) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="价格" min-width="100">
          <template #default="{ row }">
            <div @dblclick="startEdit(row, 'price')" class="cell-content">
              <el-input-number 
                v-if="isEditing(row, 'price')" 
                v-model="editValue" 
                :min="0" 
                size="small" 
                style="width: 90px"
                @blur="saveEdit(row, 'price')"
                ref="priceInput"
              />
              <span v-else style="font-weight:600">¥{{ (row.price / 100).toFixed(0) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="总时长" min-width="100">
          <template #default="{ row }">
            <div @dblclick="startEdit(row, 'total_duration')" class="cell-content">
              <el-input-number 
                v-if="isEditing(row, 'total_duration')" 
                v-model="editValue" 
                :min="1" 
                size="small" 
                style="width: 80px"
                @blur="saveEdit(row, 'total_duration')"
                ref="totalDurationInput"
              />
              <span v-else>{{ row.total_duration }}分</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="忙碌时长" min-width="100">
          <template #default="{ row }">
            <div @dblclick="startEdit(row, 'staff_busy_duration')" class="cell-content">
              <el-input-number 
                v-if="isEditing(row, 'staff_busy_duration')" 
                v-model="editValue" 
                :min="0" 
                :max="row.total_duration"
                size="small" 
                style="width: 80px"
                @blur="saveEdit(row, 'staff_busy_duration')"
                ref="staffBusyDurationInput"
              />
              <span v-else>{{ row.staff_busy_duration }}分</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="服务阶段" min-width="280">
          <template #default="{ row }">
            <div @dblclick="startEdit(row, 'stages')" class="cell-content">
              <div v-if="isEditing(row, 'stages')" class="stages-edit">
                <div v-for="(stage, idx) in editStages" :key="idx" class="stage-item">
                  <el-input v-model="stage.name" size="small" placeholder="阶段名" style="width: 90px" />
                  <el-input-number v-model="stage.duration" :min="1" size="small" style="width: 60px" />
                  <el-checkbox v-model="stage.staff_busy" size="small">忙</el-checkbox>
                  <el-button type="danger" link size="small" @click="removeStage(idx)" :disabled="editStages.length <= 1">×</el-button>
                </div>
                <div class="stage-actions">
                  <el-button type="primary" link size="small" @click="addStage">+ 添加阶段</el-button>
                  <el-button type="success" link size="small" @click="saveStages(row)">保存</el-button>
                </div>
              </div>
              <div v-else>
                <el-tag v-for="(stage, idx) in (row.stages || [])" :key="idx" size="small" style="margin: 2px" :type="stage.staff_busy ? 'danger' : 'success'">
                  {{ stage.name }} {{ stage.duration }}min
                </el-tag>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="is_active" label="状态" min-width="90">
          <template #default="{ row }">
            <div @dblclick="startEdit(row, 'is_active')" class="cell-content">
              <el-switch 
                v-if="isEditing(row, 'is_active')" 
                v-model="editValue" 
                size="small"
                @change="saveEdit(row, 'is_active')"
                ref="isActiveInput"
              />
              <el-tag v-else :type="row.is_active ? 'success' : 'info'" size="small">{{ row.is_active ? '上架' : '下架' }}</el-tag>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="sort_order" label="排序" min-width="90">
          <template #default="{ row }">
            <div @dblclick="startEdit(row, 'sort_order')" class="cell-content">
              <el-input-number 
                v-if="isEditing(row, 'sort_order')" 
                v-model="editValue" 
                :min="0" 
                size="small" 
                style="width: 70px"
                @blur="saveEdit(row, 'sort_order')"
                ref="sortOrderInput"
              />
              <span v-else>{{ row.sort_order }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="操作" min-width="100" fixed="right">
          <template #default="{ row }">
            <div v-if="row._isNew" class="action-btns">
              <el-button type="primary" size="small" @click="saveNewRow(row)" :loading="saving">保存</el-button>
            </div>
            <div v-else class="action-btns">
              <el-popconfirm title="确定下架该服务？" @confirm="deleteItem(row)">
                <template #reference>
                  <el-button type="danger" size="small" plain :disabled="!row.is_active">下架</el-button>
                </template>
              </el-popconfirm>
            </div>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { serviceApi } from '@/api/request'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'

const authStore = useAuthStore()
const loading = ref(false)
const saving = ref(false)
const tableData = ref<any[]>([])

// 单元格编辑状态: { rowId: string, field: string } | null
const editingCell = ref<{ rowId: string; field: string } | null>(null)
const editValue = ref<any>(null)
const editStages = ref<any[]>([])

// 输入框引用
const nameInput = ref<any>(null)
const categoryInput = ref<any>(null)
const priceInput = ref<any>(null)
const totalDurationInput = ref<any>(null)
const staffBusyDurationInput = ref<any>(null)
const isActiveInput = ref<any>(null)
const sortOrderInput = ref<any>(null)

const categoryLabel = (c: string) => ({ cut: '剪发', perm: '烫发', dye: '染发', care: '养护' }[c] || c)

function isEditing(row: any, field: string) {
  return editingCell.value?.rowId === row.service_id && editingCell.value?.field === field
}

async function startEdit(row: any, field: string) {
  // 如果有其他单元格正在编辑，先保存
  if (editingCell.value && (editingCell.value.rowId !== row.service_id || editingCell.value.field !== field)) {
    // 查找之前编辑的行
    const prevRow = tableData.value.find(r => r.service_id === editingCell.value?.rowId)
    if (prevRow && editingCell.value.field !== 'stages') {
      await saveEdit(prevRow, editingCell.value.field, false)
    }
  }
  
  editingCell.value = { rowId: row.service_id, field }
  
  // 设置编辑值
  if (field === 'price') {
    editValue.value = row.price / 100
  } else if (field === 'stages') {
    editStages.value = row.stages?.length ? JSON.parse(JSON.stringify(row.stages)) : [{ name: '', duration: 30, staff_busy: true }]
  } else {
    editValue.value = row[field]
  }
  
  // 自动聚焦
  await nextTick()
  const inputRef = {
    name: nameInput,
    category: categoryInput,
    price: priceInput,
    total_duration: totalDurationInput,
    staff_busy_duration: staffBusyDurationInput,
    is_active: isActiveInput,
    sort_order: sortOrderInput,
  }[field]
  inputRef?.value?.focus?.()
}

async function saveEdit(row: any, field: string, showMessage = true) {
  if (!editingCell.value || editingCell.value.rowId !== row.service_id || editingCell.value.field !== field) return
  
  saving.value = true
  try {
    let updateData: any = { [field]: editValue.value }
    
    if (field === 'price') {
      updateData.price = Math.round(editValue.value * 100)
    }
    
    await serviceApi.update(row.service_id, updateData)
    if (showMessage) ElMessage.success('更新成功')
    
    // 更新本地数据
    if (field === 'price') {
      row.price = updateData.price
    } else {
      row[field] = editValue.value
    }
    
    editingCell.value = null
    editValue.value = null
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function saveStages(row: any) {
  saving.value = true
  try {
    const normalizedStages = (editStages.value || [])
      .map((stage: any) => ({
        name: (stage?.name || '').trim() || row.name,
        duration: Number(stage?.duration) || 10,
        staff_busy: stage?.staff_busy !== false,
      }))
      .filter((stage: any) => stage.name)

    await serviceApi.update(row.service_id, { stages: normalizedStages })
    ElMessage.success('更新成功')
    row.stages = JSON.parse(JSON.stringify(normalizedStages))
    editingCell.value = null
    editStages.value = []
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

function addStage() {
  editStages.value.push({ name: '', duration: 10, staff_busy: false })
}

function removeStage(idx: number) {
  editStages.value.splice(idx, 1)
}

function addNewRow() {
  const newId = 'temp_' + Date.now()
  const newRow = {
    service_id: newId,
    name: '',
    category: 'cut',
    price: 0,
    total_duration: 30,
    staff_busy_duration: 30,
    stages: [{ name: '', duration: 30, staff_busy: true }],
    is_active: true,
    sort_order: tableData.value.length,
    description: '',
    _isNew: true,
  }
  tableData.value.unshift(newRow)
  // 自动开始编辑名称
  nextTick(() => startEdit(newRow, 'name'))
}

async function saveNewRow(row: any) {
  if (!row.name.trim()) return ElMessage.warning('请输入服务名称')
  
  saving.value = true
  try {
    const normalizedStages = (row.stages || [])
      .map((stage: any) => ({
        name: (stage?.name || '').trim() || row.name.trim(),
        duration: Number(stage?.duration) || row.total_duration || 30,
        staff_busy: stage?.staff_busy !== false,
      }))
      .filter((stage: any) => stage.name)

    const data = {
      name: row.name,
      category: row.category,
      price: row.price,
      total_duration: row.total_duration,
      staff_busy_duration: row.staff_busy_duration,
      stages: normalizedStages,
      is_active: row.is_active,
      sort_order: row.sort_order,
      description: row.description || '',
      merchant_id: authStore.user.merchantId,
    }
    await serviceApi.create(data)
    ElMessage.success('创建成功')
    await loadData()
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '创建失败')
  } finally {
    saving.value = false
  }
}

async function deleteItem(row: any) {
  try {
    await serviceApi.delete(row.service_id)
    ElMessage.success('已下架')
    await loadData()
  } catch (e: any) { 
    ElMessage.error(e?.response?.data?.message || '下架失败') 
  }
}

async function loadData() {
  loading.value = true
  try {
    const res = await serviceApi.getList({ merchant_id: authStore.user.merchantId }) as any
    const payload = res?.data ?? res
    if (Array.isArray(payload?.list)) {
      tableData.value = payload.list
    } else if (Array.isArray(payload)) {
      tableData.value = payload
    } else {
      tableData.value = []
    }
  } catch (e) { 
    console.error(e)
    tableData.value = []
  } finally { 
    loading.value = false 
  }
}

onMounted(() => loadData())
</script>

<style scoped>
.header-row { 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
}
.header-title { 
  font-weight: 600; 
  font-size: 16px; 
}

.cell-content {
  min-height: 24px;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
}

.cell-content:hover {
  background-color: #f5f7fa;
}

.action-btns {
  display: flex;
  gap: 4px;
  flex-wrap: nowrap;
}

.stages-edit {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stage-item {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: nowrap;
}

.stage-actions {
  display: flex;
  gap: 8px;
}

:deep(.el-table .el-table__cell) {
  padding: 12px 8px;
}

:deep(.el-table__row) {
  height: auto;
}

:deep(.el-input__wrapper) {
  padding: 0 8px;
}
</style>
