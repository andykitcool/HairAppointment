<template>
  <div class="settings-page">
    <!-- 第一行：门店基本信息 + 小程序展示设置 -->
    <el-row :gutter="16">
      <el-col :span="10">
        <el-card class="compact-card">
          <template #header>
            <span class="card-title">门店基本信息</span>
          </template>
          <el-form :model="form" label-width="90px" v-loading="loading" size="default">
            <el-form-item label="门店名称" required>
              <el-input v-model="form.name" placeholder="请输入门店名称" />
            </el-form-item>
            <el-form-item label="联系电话" required>
              <el-input v-model="form.phone" placeholder="请输入联系电话" />
            </el-form-item>
            <el-form-item label="门店地址" required>
              <el-input v-model="form.address" type="textarea" :rows="2" placeholder="请输入门店地址" />
            </el-form-item>
            <el-form-item label="门店介绍">
              <el-input v-model="form.description" type="textarea" :rows="2" placeholder="请输入门店介绍" />
            </el-form-item>
            <el-form-item label="门店位置">
              <div class="location-picker-row">
                <el-input :model-value="form.latitude ?? ''" placeholder="纬度" readonly class="location-input" />
                <el-input :model-value="form.longitude ?? ''" placeholder="经度" readonly class="location-input" />
                <el-button type="primary" plain @click="openMapPicker">地图选点</el-button>
              </div>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveBasicInfo" :loading="saving">保存</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :span="14">
        <el-card class="compact-card">
          <template #header>
            <span class="card-title">小程序展示设置</span>
          </template>
          <el-form :model="displayForm" label-width="100px" v-loading="loadingDisplay">
            <el-row :gutter="16">
              <el-col :span="12">
                <el-form-item label="店长称呼">
                  <el-input v-model="displayForm.owner_title" placeholder="如：店长、老板" />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item label="主题色">
                  <el-color-picker v-model="displayForm.theme_color" />
                </el-form-item>
              </el-col>
            </el-row>
            <el-form-item label="门店头图">
              <div class="image-section">
                <!-- 已上传图片显示 -->
                <div v-if="displayForm.hero_image" class="image-preview-wrapper">
                  <img 
                    :src="displayForm.hero_image" 
                    class="hero-image-preview" 
                    @click="triggerUpload"
                    @error="handleImageError"
                  />
                  <div class="image-overlay">
                    <el-button type="danger" size="small" plain @click="removeHeroImage">删除</el-button>
                  </div>
                </div>
                <!-- 上传控件 -->
                <el-upload
                  v-else
                  ref="uploadRef"
                  class="hero-image-uploader"
                  action="/api/upload/image"
                  :headers="uploadHeaders"
                  :show-file-list="false"
                  :on-success="handleUploadSuccess"
                  :on-error="handleUploadError"
                  :before-upload="beforeUpload"
                  accept="image/*"
                >
                  <el-icon class="hero-image-uploader-icon"><Plus /></el-icon>
                </el-upload>
                <div v-if="displayForm.hero_image" class="image-tip">点击图片可重新上传</div>
              </div>
            </el-form-item>
            <el-form-item label="店长头像">
              <div class="image-section">
                <div v-if="displayForm.owner_avatar" class="avatar-preview-wrapper">
                  <img
                    :src="displayForm.owner_avatar"
                    class="owner-avatar-preview"
                    @click="triggerAvatarUpload"
                    @error="handleAvatarImageError"
                  />
                  <div class="image-overlay">
                    <el-button type="danger" size="small" plain @click="removeOwnerAvatar">删除</el-button>
                  </div>
                </div>
                <el-upload
                  v-else
                  ref="uploadAvatarRef"
                  class="owner-avatar-uploader"
                  action="/api/upload/image"
                  :headers="uploadHeaders"
                  :show-file-list="false"
                  :on-success="handleAvatarUploadSuccess"
                  :on-error="handleUploadError"
                  :before-upload="beforeUpload"
                  accept="image/*"
                >
                  <el-icon class="hero-image-uploader-icon"><Plus /></el-icon>
                </el-upload>
                <div v-if="displayForm.owner_avatar" class="image-tip">点击头像可重新上传</div>
              </div>
            </el-form-item>
            <el-form-item label="欢迎语">
              <el-input v-model="displayForm.welcome_text" type="textarea" :rows="2" placeholder="小程序首页显示的欢迎语" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveDisplaySettings" :loading="savingDisplay">保存</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>

    <!-- 第二行：营业时间设置 -->
    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header-with-action">
              <span class="card-title">营业时间设置</span>
              <el-button type="primary" size="small" @click="saveBusinessHours" :loading="savingHours">保存营业时间</el-button>
            </div>
          </template>
          <div class="business-hours-grid">
            <div v-for="(item, index) in weekDays" :key="index" class="business-day-block">
              <div class="day-header">
                <span class="day-label">{{ item.label }}</span>
                <el-switch 
                  v-model="form.business_hours[item.key].is_open" 
                  active-text="营业" 
                  inactive-text="休息"
                  size="small"
                />
              </div>
              <div v-if="form.business_hours[item.key].is_open" class="time-slots">
                <div class="time-slot-row">
                  <span class="slot-name">上午</span>
                  <el-time-picker
                    v-model="form.business_hours[item.key].morning.open"
                    placeholder="开始"
                    format="HH:mm"
                    value-format="HH:mm"
                    style="width: 90px"
                    size="small"
                  />
                  <span class="time-separator">-</span>
                  <el-time-picker
                    v-model="form.business_hours[item.key].morning.close"
                    placeholder="结束"
                    format="HH:mm"
                    value-format="HH:mm"
                    style="width: 90px"
                    size="small"
                  />
                  <el-checkbox v-model="form.business_hours[item.key].morning.is_open" size="small">开</el-checkbox>
                </div>
                <div class="time-slot-row">
                  <span class="slot-name">下午</span>
                  <el-time-picker
                    v-model="form.business_hours[item.key].afternoon.open"
                    placeholder="开始"
                    format="HH:mm"
                    value-format="HH:mm"
                    style="width: 90px"
                    size="small"
                  />
                  <span class="time-separator">-</span>
                  <el-time-picker
                    v-model="form.business_hours[item.key].afternoon.close"
                    placeholder="结束"
                    format="HH:mm"
                    value-format="HH:mm"
                    style="width: 90px"
                    size="small"
                  />
                  <el-checkbox v-model="form.business_hours[item.key].afternoon.is_open" size="small">开</el-checkbox>
                </div>
                <div class="time-slot-row">
                  <span class="slot-name">晚上</span>
                  <el-time-picker
                    v-model="form.business_hours[item.key].evening.open"
                    placeholder="开始"
                    format="HH:mm"
                    value-format="HH:mm"
                    style="width: 90px"
                    size="small"
                  />
                  <span class="time-separator">-</span>
                  <el-time-picker
                    v-model="form.business_hours[item.key].evening.close"
                    placeholder="结束"
                    format="HH:mm"
                    value-format="HH:mm"
                    style="width: 90px"
                    size="small"
                  />
                  <el-checkbox v-model="form.business_hours[item.key].evening.is_open" size="small">开</el-checkbox>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="mapDialogVisible" title="地图点选门店位置" width="760px" @open="initMapPicker">
      <div class="map-tip">点击地图选择门店位置，确认后自动回填经纬度与门店地址。</div>
      <div v-if="mapInitError" class="map-error">{{ mapInitError }}</div>
      <div v-loading="mapLoading" class="map-container" ref="mapContainerRef"></div>
      <template #footer>
        <el-button @click="mapDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmMapLocation">确认位置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, computed, nextTick } from 'vue'
import { merchantApi } from '@/api/request'
import { useAuthStore } from '@/stores/auth'
import { ElMessage } from 'element-plus'
import { Plus, Check } from '@element-plus/icons-vue'

const authStore = useAuthStore()
const loading = ref(false)
const loadingDisplay = ref(false)
const saving = ref(false)
const savingHours = ref(false)
const savingDisplay = ref(false)

const weekDays = [
  { key: 'monday', label: '周一' },
  { key: 'tuesday', label: '周二' },
  { key: 'wednesday', label: '周三' },
  { key: 'thursday', label: '周四' },
  { key: 'friday', label: '周五' },
  { key: 'saturday', label: '周六' },
  { key: 'sunday', label: '周日' },
]

// 默认时间段配置
const defaultTimeSlot = () => ({
  open: '09:00',
  close: '12:00',
  is_open: true,
})

const defaultDaySchedule = () => ({
  is_open: true,
  morning: { open: '09:00', close: '12:00', is_open: true },
  afternoon: { open: '14:00', close: '18:00', is_open: true },
  evening: { open: '19:00', close: '21:00', is_open: true },
})

const defaultBusinessHours = () => ({
  monday: defaultDaySchedule(),
  tuesday: defaultDaySchedule(),
  wednesday: defaultDaySchedule(),
  thursday: defaultDaySchedule(),
  friday: defaultDaySchedule(),
  saturday: defaultDaySchedule(),
  sunday: defaultDaySchedule(),
})

type DaySchedule = ReturnType<typeof defaultDaySchedule>
type BusinessHoursMap = Record<string, DaySchedule>

const form = reactive({
  name: '',
  phone: '',
  address: '',
  description: '',
  latitude: null as number | null,
  longitude: null as number | null,
  business_hours: defaultBusinessHours() as BusinessHoursMap,
})

const displayForm = reactive({
  hero_image: '',
  owner_avatar: '',
  owner_title: '店长',
  theme_color: '#1890ff',
  welcome_text: '欢迎预约，我们将为您提供专业服务',
})

// 上传请求头（添加认证）
const uploadRef = ref<any>(null)
const uploadAvatarRef = ref<any>(null)

// 高德地图选点
const AMAP_KEY = (import.meta as any).env?.VITE_AMAP_KEY || ''
const mapDialogVisible = ref(false)
const mapLoading = ref(false)
const mapInitError = ref('')
const mapContainerRef = ref<HTMLDivElement | null>(null)
const pickedLocation = ref<{ lat: number; lng: number } | null>(null)
let amapInstance: any = null
let amapMarker: any = null
let amapGeocoder: any = null
let amapScriptPromise: Promise<void> | null = null

function openMapPicker() {
  mapDialogVisible.value = true
}

function loadAmapScript() {
  if (window && (window as any).AMap) {
    return Promise.resolve()
  }
  if (amapScriptPromise) return amapScriptPromise

  amapScriptPromise = new Promise<void>((resolve, reject) => {
    if (!AMAP_KEY) {
      reject(new Error('未配置高德地图 Key，请在 admin 环境变量中设置 VITE_AMAP_KEY'))
      return
    }
    const script = document.createElement('script')
    script.src = `https://webapi.amap.com/maps?v=2.0&key=${AMAP_KEY}&plugin=AMap.Geocoder`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('高德地图脚本加载失败'))
    document.head.appendChild(script)
  })

  return amapScriptPromise
}

function setMapMarker(lng: number, lat: number) {
  if (!amapInstance) return
  const AMap = (window as any).AMap
  if (!amapMarker) {
    amapMarker = new AMap.Marker({
      position: [lng, lat],
      offset: new AMap.Pixel(-13, -30),
    })
    amapInstance.add(amapMarker)
  } else {
    amapMarker.setPosition([lng, lat])
  }
  pickedLocation.value = { lat, lng }
}

function reverseGeocode(lng: number, lat: number) {
  if (!amapGeocoder) return
  amapGeocoder.getAddress([lng, lat], (status: string, result: any) => {
    if (status === 'complete' && result?.regeocode?.formattedAddress) {
      form.address = result.regeocode.formattedAddress
    }
  })
}

async function initMapPicker() {
  mapLoading.value = true
  mapInitError.value = ''
  try {
    await nextTick()
    await loadAmapScript()
    const AMap = (window as any).AMap
    if (!mapContainerRef.value) {
      throw new Error('地图容器未准备好')
    }

    const initLng = Number(form.longitude) || 121.4737
    const initLat = Number(form.latitude) || 31.2304

    if (!amapInstance) {
      amapInstance = new AMap.Map(mapContainerRef.value, {
        zoom: 13,
        center: [initLng, initLat],
      })
      amapGeocoder = new AMap.Geocoder()
      amapInstance.on('click', (e: any) => {
        const lng = Number(e?.lnglat?.lng)
        const lat = Number(e?.lnglat?.lat)
        if (!Number.isFinite(lng) || !Number.isFinite(lat)) return
        setMapMarker(lng, lat)
        reverseGeocode(lng, lat)
      })
    } else {
      amapInstance.setZoomAndCenter(13, [initLng, initLat])
    }

    setMapMarker(initLng, initLat)
  } catch (err: any) {
    mapInitError.value = err?.message || '地图初始化失败'
  } finally {
    mapLoading.value = false
  }
}

function confirmMapLocation() {
  if (!pickedLocation.value) {
    ElMessage.warning('请先点击地图选择位置')
    return
  }
  form.latitude = Number(pickedLocation.value.lat.toFixed(6))
  form.longitude = Number(pickedLocation.value.lng.toFixed(6))
  mapDialogVisible.value = false
  ElMessage.success('已回填门店位置')
}

const uploadHeaders = computed(() => {
  const token = localStorage.getItem('auth_token')
  return {
    Authorization: token ? `Bearer ${token}` : '',
  }
})

// 触发上传
function triggerUpload() {
  uploadRef.value?.$el?.querySelector('input')?.click()
}

function triggerAvatarUpload() {
  uploadAvatarRef.value?.$el?.querySelector('input')?.click()
}

// 上传前的检查
function beforeUpload(file: File) {
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只支持图片文件！')
    return false
  }
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB！')
    return false
  }
  return true
}

// 上传成功
function handleUploadSuccess(response: any) {
  if (response.code === 0) {
    // 构建完整的图片URL（使用后端API地址）
    const baseUrl = 'http://localhost:3100'
    const imageUrl = response.data.url.startsWith('http') 
      ? response.data.url 
      : `${baseUrl}${response.data.url}`
    displayForm.hero_image = imageUrl
    ElMessage.success('图片上传成功，请记得点击"保存展示设置"按钮保存')
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

function handleAvatarUploadSuccess(response: any) {
  if (response.code === 0) {
    const baseUrl = 'http://localhost:3100'
    const imageUrl = response.data.url.startsWith('http')
      ? response.data.url
      : `${baseUrl}${response.data.url}`
    displayForm.owner_avatar = imageUrl
    ElMessage.success('头像上传成功，请记得点击"保存"按钮保存')
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

// 上传失败
function handleUploadError() {
  ElMessage.error('图片上传失败')
}

// 删除头图
function removeHeroImage() {
  displayForm.hero_image = ''
  ElMessage.success('图片已删除，记得保存设置哦')
}

function removeOwnerAvatar() {
  displayForm.owner_avatar = ''
  ElMessage.success('头像已删除，记得保存设置哦')
}

// 图片加载失败
function handleImageError() {
  console.error('[Settings] Image failed to load:', displayForm.hero_image)
  ElMessage.error('图片加载失败，URL: ' + displayForm.hero_image)
}

function handleAvatarImageError() {
  console.error('[Settings] Avatar failed to load:', displayForm.owner_avatar)
  ElMessage.error('头像加载失败，URL: ' + displayForm.owner_avatar)
}

async function loadData() {
  const merchantId = authStore.user.merchantId
  console.log('[Settings] loadData called, merchantId:', merchantId, 'type:', typeof merchantId)
  console.log('[Settings] authStore.user:', JSON.stringify(authStore.user))
  if (!merchantId) {
    console.log('[Settings] merchantId is falsy, showing warning')
    ElMessage.warning('您还未绑定门店')
    return
  }
  console.log('[Settings] merchantId exists, loading data...')

  loading.value = true
  loadingDisplay.value = true

  try {
    // 加载门店基本信息
    console.log('[Settings] Loading merchant info for:', merchantId)
    const res = await merchantApi.getInfo(merchantId) as any
    console.log('[Settings] Merchant API response:', res)
    if (res?.code === 0 && res.data) {
      const data = res.data
      console.log('[Settings] Merchant data:', data)
      form.name = data.name || ''
      form.phone = data.phone || ''
      form.address = data.address || ''
      form.description = data.description || ''
      form.latitude = data.latitude ?? null
      form.longitude = data.longitude ?? null
      if (data.business_hours) {
        // 兼容旧数据结构
        const hours = data.business_hours
        Object.keys(hours).forEach((day) => {
          if (hours[day] && typeof hours[day] === 'object') {
            // 新结构：有 morning/afternoon/evening
            if (hours[day].morning || hours[day].afternoon || hours[day].evening) {
              Object.assign(form.business_hours[day], hours[day])
            } else {
              // 旧结构：只有 open/close/is_open
              form.business_hours[day].is_open = hours[day].is_open
              form.business_hours[day].morning.open = hours[day].open || '09:00'
              form.business_hours[day].morning.close = hours[day].close || '21:00'
              form.business_hours[day].morning.is_open = hours[day].is_open
            }
          }
        })
      }
    } else {
      console.log('[Settings] No data in response:', res)
    }

    // 加载展示设置
    const displayRes = await merchantApi.getDisplaySettings(merchantId) as any
    console.log('[Settings] Display settings response:', displayRes)
    // 先重置，避免显示旧数据
    displayForm.hero_image = ''
    displayForm.owner_avatar = ''
    if (displayRes?.code === 0 && displayRes.data) {
      const ds = displayRes.data.display_settings || {}
      console.log('[Settings] Display settings loaded:', ds)
      // 处理图片URL：确保使用正确的后端地址
      const baseUrl = 'http://localhost:3100'
      let heroImage = ds.hero_image || ''
      let ownerAvatar = ds.owner_avatar || ''
      if (heroImage && !heroImage.startsWith('http')) {
        // 相对路径，添加后端地址前缀
        heroImage = `${baseUrl}${heroImage}`
      }
      if (ownerAvatar && !ownerAvatar.startsWith('http')) {
        ownerAvatar = `${baseUrl}${ownerAvatar}`
      }
      // 使用 nextTick 确保 DOM 更新后再设置新值
      displayForm.hero_image = heroImage
      displayForm.owner_avatar = ownerAvatar
      displayForm.owner_title = ds.owner_title || '店长'
      displayForm.theme_color = ds.theme_color || '#1890ff'
      displayForm.welcome_text = ds.welcome_text || '欢迎预约，我们将为您提供专业服务'
      console.log('[Settings] hero_image set to:', displayForm.hero_image)
    }

  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '加载数据失败')
  } finally {
    loading.value = false
    loadingDisplay.value = false
  }
}

async function saveBasicInfo() {
  if (!form.name.trim()) return ElMessage.warning('请输入门店名称')
  if (!form.phone.trim()) return ElMessage.warning('请输入联系电话')
  if (!form.address.trim()) return ElMessage.warning('请输入门店地址')

  const merchantId = authStore.user.merchantId
  if (!merchantId) return

  saving.value = true
  try {
    await merchantApi.update(merchantId, {
      name: form.name,
      phone: form.phone,
      address: form.address,
      description: form.description,
      latitude: form.latitude,
      longitude: form.longitude,
    })
    ElMessage.success('保存成功')
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '保存失败')
  } finally {
    saving.value = false
  }
}

async function saveBusinessHours() {
  const merchantId = authStore.user.merchantId
  if (!merchantId) return

  savingHours.value = true
  try {
    await merchantApi.update(merchantId, {
      business_hours: form.business_hours,
    })
    ElMessage.success('营业时间保存成功')
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '保存失败')
  } finally {
    savingHours.value = false
  }
}

async function saveDisplaySettings() {
  const merchantId = authStore.user.merchantId
  if (!merchantId) return

  savingDisplay.value = true
  try {
    // 保存时提取相对路径（去掉任何域名部分）
    const baseUrl = 'http://localhost:3100'
    let heroImage = displayForm.hero_image
    let ownerAvatar = displayForm.owner_avatar
    let relativePath = heroImage
    let ownerAvatarRelativePath = ownerAvatar
    // 去掉后端地址前缀
    if (heroImage && heroImage.startsWith(baseUrl)) {
      relativePath = heroImage.replace(baseUrl, '')
    }
    // 去掉前端地址前缀（旧数据兼容）
    else if (heroImage && heroImage.startsWith('http://localhost:9080')) {
      relativePath = heroImage.replace('http://localhost:9080', '')
    }

    if (ownerAvatar && ownerAvatar.startsWith(baseUrl)) {
      ownerAvatarRelativePath = ownerAvatar.replace(baseUrl, '')
    }
    else if (ownerAvatar && ownerAvatar.startsWith('http://localhost:9080')) {
      ownerAvatarRelativePath = ownerAvatar.replace('http://localhost:9080', '')
    }

    await merchantApi.updateDisplaySettings(merchantId, {
      ...displayForm,
      hero_image: relativePath,
      owner_avatar: ownerAvatarRelativePath,
    })
    ElMessage.success('展示设置保存成功')
  } catch (e: any) {
    ElMessage.error(e?.response?.data?.message || '保存失败')
  } finally {
    savingDisplay.value = false
  }
}

onMounted(() => {
  console.log('[Settings] onMounted called')
  console.log('[Settings] authStore.user in onMounted:', JSON.stringify(authStore.user))
  loadData()
})
</script>

<style scoped>
.settings-page {
  padding: 0;
}

.location-picker-row {
  width: 100%;
  display: flex;
  gap: 8px;
}

.location-input {
  width: 160px;
}

.map-tip {
  font-size: 13px;
  color: #606266;
  margin-bottom: 10px;
}

.map-error {
  color: #f56c6c;
  font-size: 13px;
  margin-bottom: 10px;
}

.map-container {
  width: 100%;
  height: 460px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}

.card-title {
  font-weight: 600;
  font-size: 16px;
}
.compact-card {
  height: 100%;
}

.business-hours-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

@media (max-width: 1400px) {
  .business-hours-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 992px) {
  .business-hours-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 576px) {
  .business-hours-grid {
    grid-template-columns: 1fr;
  }
}

.business-day-block {
  padding: 12px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fafafa;
}

.day-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding-bottom: 8px;
  border-bottom: 1px dashed #dcdfe6;
}

.day-label {
  font-weight: 600;
  font-size: 15px;
  color: #303133;
}

.time-slots {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.time-slot-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.slot-name {
  width: 40px;
  font-size: 12px;
  color: #606266;
}

.time-separator {
  color: #999;
}

.card-header-with-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-text {
  text-align: center;
  color: #909399;
  padding: 40px 0;
}

/* 图片区域样式 */
.image-section {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.image-preview-wrapper {
  position: relative;
  width: 178px;
  height: 100px;
  border-radius: 6px;
  overflow: hidden;
}

.hero-image-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  cursor: pointer;
}

.image-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.5);
  padding: 8px;
  display: flex;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.image-preview-wrapper:hover .image-overlay {
  opacity: 1;
}

.avatar-preview-wrapper {
  position: relative;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  overflow: hidden;
}

.avatar-preview-wrapper:hover .image-overlay {
  opacity: 1;
}

.owner-avatar-preview {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  cursor: pointer;
}

.image-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

/* 图片上传样式 */
.hero-image-uploader {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
  width: 178px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.hero-image-uploader:hover {
  border-color: var(--el-color-primary);
}

.hero-image-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 100px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.owner-avatar-uploader {
  border: 1px dashed var(--el-border-color);
  border-radius: 50%;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
  width: 100px;
  height: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.owner-avatar-uploader:hover {
  border-color: var(--el-color-primary);
}

.image-preview-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.hero-image-preview {
  width: 178px;
  height: 100px;
  object-fit: cover;
  display: block;
  border-radius: 6px;
  border: 1px solid #dcdfe6;
  cursor: pointer;
}

.hero-image-preview:hover {
  border-color: var(--el-color-primary);
  opacity: 0.9;
}

.image-actions {
  margin-top: 8px;
}

.image-url {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
  max-width: 178px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
