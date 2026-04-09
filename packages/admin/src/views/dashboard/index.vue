<template>
  <div class="platform-dashboard">
    <template v-if="isSuperAdmin">
    <section class="hero">
      <div>
        <p class="hero-subtitle">PLATFORM CONTROL TOWER</p>
        <h1>平台数据总览</h1>
        <p class="hero-desc">
          以平台视角统一监控全量门店经营、预约流量与 AI 发型推荐使用趋势。
        </p>
      </div>
      <div class="hero-meta">
        <div>
          <span>统计日期</span>
          <strong>{{ stats.daily.date || '--' }}</strong>
        </div>
        <div>
          <span>最后更新</span>
          <strong>{{ formatDateTime(stats.updated_at) }}</strong>
        </div>
        <el-button type="primary" plain @click="loadData">刷新数据</el-button>
      </div>
    </section>

    <section class="kpi-grid">
      <article v-for="card in metricCards" :key="card.title" class="kpi-card">
        <p class="kpi-title">{{ card.title }}</p>
        <p class="kpi-value">{{ card.value }}</p>
        <p class="kpi-extra">{{ card.extra }}</p>
      </article>
    </section>

    <section class="panel-grid panel-grid-2">
      <el-card class="panel-card" shadow="never">
        <template #header>
          <div class="panel-header">
            <span>门店状态结构</span>
            <small>总门店 {{ stats.merchant_status.total }} 家</small>
          </div>
        </template>
        <div class="status-list">
          <div v-for="item in statusCards" :key="item.label" class="status-item">
            <div class="status-top">
              <span>{{ item.label }}</span>
              <b>{{ item.value }}</b>
            </div>
            <el-progress :percentage="item.percent" :stroke-width="10" :color="item.color" />
          </div>
        </div>
      </el-card>

      <el-card class="panel-card" shadow="never">
        <template #header>
          <div class="panel-header">
            <span>近7天趋势</span>
            <small>预约量 / AI 生图次数</small>
          </div>
        </template>
        <div class="trend-rows">
          <div v-for="item in trendRows" :key="item.date" class="trend-row">
            <span class="trend-date">{{ item.date.slice(5) }}</span>
            <div class="trend-bar-wrap">
              <div class="trend-bar appointment" :style="{ width: `${item.appointmentRatio}%` }"></div>
              <div class="trend-bar ai" :style="{ width: `${item.aiRatio}%` }"></div>
            </div>
            <span class="trend-value">{{ item.appointments }} / {{ item.aiUsage }}</span>
          </div>
        </div>
      </el-card>
    </section>

    <section class="panel-grid panel-grid-2">
      <el-card class="panel-card" shadow="never" v-loading="mapLoading" element-loading-text="地图加载中...">
        <template #header>
          <div class="panel-header">
            <span>用户地理分布（估算）</span>
            <small>口径：按门店地址 + 近30天预约活跃度</small>
          </div>
        </template>
        <div ref="chinaMapRef" class="china-map" v-show="stats.geo_distribution.length"></div>
        <div class="geo-list" v-if="stats.geo_distribution.length">
          <div v-for="item in stats.geo_distribution" :key="item.region" class="geo-item">
            <div class="geo-line">
              <span>{{ item.region }}</span>
              <span>门店 {{ item.merchant_count }} · 近30天预约 {{ item.appointment_count_30d }} · AI {{ item.ai_usage_count_30d }}</span>
            </div>
            <div class="geo-heat-track">
              <div
                class="geo-heat-fill"
                :style="{ width: `${getGeoPercent(item.appointment_count_30d)}%` }"
              ></div>
            </div>
          </div>
        </div>
        <el-empty v-else description="暂无区域数据" :image-size="68" />
      </el-card>

      <el-card class="panel-card" shadow="never">
        <template #header>
          <div class="panel-header">
            <span>活跃门店排行（今日）</span>
            <small>按预约量优先排序</small>
          </div>
        </template>
        <el-table :data="stats.top_merchants" stripe size="small" max-height="360">
          <el-table-column label="#" width="56">
            <template #default="{ $index }">{{ $index + 1 }}</template>
          </el-table-column>
          <el-table-column prop="merchant_name" label="门店" min-width="140" show-overflow-tooltip />
          <el-table-column prop="today_appointments" label="今日预约" width="96" />
          <el-table-column prop="ai_usage_today" label="AI次数" width="88" />
          <el-table-column label="今日营收" width="118">
            <template #default="{ row }">¥{{ toYuan(row.revenue_today) }}</template>
          </el-table-column>
        </el-table>
        <el-empty v-if="!stats.top_merchants.length" description="暂无排行数据" :image-size="68" />
      </el-card>
    </section>
    </template>

    <template v-else>
      <section class="hero merchant-hero">
        <div>
          <p class="hero-subtitle">MERCHANT PERFORMANCE</p>
          <h1>门店数据总览</h1>
          <p class="hero-desc">
            仅展示当前账号所属门店的预约、营收与到店经营数据。
          </p>
        </div>
        <div class="hero-meta">
          <div>
            <span>门店ID</span>
            <strong>{{ authStore.user.merchantId || '--' }}</strong>
          </div>
          <div>
            <span>统计日期</span>
            <strong>{{ merchantStats.date || '--' }}</strong>
          </div>
          <el-button type="primary" plain @click="loadData">刷新数据</el-button>
        </div>
      </section>

      <section class="kpi-grid merchant-grid">
        <article class="kpi-card">
          <p class="kpi-title">今日预约</p>
          <p class="kpi-value">{{ merchantStats.todayAppointments }}</p>
          <p class="kpi-extra">待处理 {{ merchantStats.pendingCount }}</p>
        </article>
        <article class="kpi-card">
          <p class="kpi-title">今日营收</p>
          <p class="kpi-value">¥{{ toYuan(merchantStats.todayRevenue) }}</p>
          <p class="kpi-extra">基于今日交易统计</p>
        </article>
        <article class="kpi-card">
          <p class="kpi-title">累计顾客</p>
          <p class="kpi-value">{{ merchantStats.totalCustomers }}</p>
          <p class="kpi-extra">当前门店客户沉淀</p>
        </article>
        <article class="kpi-card">
          <p class="kpi-title">今日客单价</p>
          <p class="kpi-value">¥{{ merchantAvgPrice }}</p>
          <p class="kpi-extra">按今日完成单估算</p>
        </article>
      </section>

      <section class="panel-grid panel-grid-2">
        <el-card class="panel-card" shadow="never">
          <template #header>
            <div class="panel-header">
              <span>待处理预约</span>
              <small>仅当前门店</small>
            </div>
          </template>
          <el-table :data="merchantPendingList" stripe size="small" max-height="360">
            <el-table-column prop="appointment_id" label="预约号" width="132" />
            <el-table-column prop="customer_name" label="顾客" width="100" />
            <el-table-column prop="service_name" label="服务" min-width="120" show-overflow-tooltip />
            <el-table-column prop="start_time" label="时间" width="90" />
            <el-table-column prop="staff_name" label="员工" width="90" />
          </el-table>
          <el-empty v-if="!merchantPendingList.length" description="暂无待处理预约" :image-size="68" />
        </el-card>

        <el-card class="panel-card" shadow="never">
          <template #header>
            <div class="panel-header">
              <span>最近交易</span>
              <small>仅当前门店</small>
            </div>
          </template>
          <el-table :data="merchantRecentTransactions" stripe size="small" max-height="360">
            <el-table-column prop="transaction_date" label="日期" width="110" />
            <el-table-column prop="customer_name" label="顾客" width="100" />
            <el-table-column label="项目" min-width="130">
              <template #default="{ row }">{{ (row.items || []).map((i: any) => i.service_name).join('、') }}</template>
            </el-table-column>
            <el-table-column label="金额" width="110">
              <template #default="{ row }">¥{{ toYuan(row.total_amount) }}</template>
            </el-table-column>
          </el-table>
          <el-empty v-if="!merchantRecentTransactions.length" description="暂无交易记录" :image-size="68" />
        </el-card>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { adminApi, appointmentApi, customerApi, statsApi, transactionApi } from '@/api/request'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '@/stores/auth'

interface EChartsLike {
  init: (el: HTMLElement) => EChartsInstanceLike
  getInstanceByDom: (el: HTMLElement) => EChartsInstanceLike | undefined
  registerMap: (mapName: string, geoJson: unknown) => void
}

interface EChartsInstanceLike {
  setOption: (option: Record<string, unknown>, notMerge?: boolean) => void
  resize: () => void
  dispose: () => void
}

declare global {
  interface Window {
    echarts?: EChartsLike
  }
}

interface TrendItem {
  date: string
  count: number
}

interface GeoItem {
  region: string
  merchant_count: number
  appointment_count_30d: number
  ai_usage_count_30d: number
}

interface TopMerchantItem {
  merchant_id: string
  merchant_name: string
  today_appointments: number
  ai_usage_today: number
  revenue_today: number
}

interface PlatformStatsPayload {
  summary: {
    total_merchants: number
    active_merchants: number
    total_customers: number
    total_appointments: number
    total_revenue: number
  }
  daily: {
    date: string
    today_appointments: number
    yesterday_appointments: number
    today_revenue: number
    yesterday_revenue: number
    today_ai_usage: number
    yesterday_ai_usage: number
  }
  merchant_status: {
    active: number
    inactive: number
    pending: number
    applying: number
    rejected: number
    total: number
  }
  trends: {
    appointments_7d: TrendItem[]
    ai_usage_7d: TrendItem[]
    revenue_7d: TrendItem[]
  }
  geo_distribution: GeoItem[]
  top_merchants: TopMerchantItem[]
  updated_at: string
}

const loading = ref(false)
const mapLoading = ref(false)
const chinaMapRef = ref<HTMLElement | null>(null)
const authStore = useAuthStore()
const isSuperAdmin = computed(() => authStore.isSuperAdmin)

const merchantStats = ref({
  date: '',
  todayAppointments: 0,
  pendingCount: 0,
  todayRevenue: 0,
  totalCustomers: 0,
  completedCount: 0,
})
const merchantPendingList = ref<any[]>([])
const merchantRecentTransactions = ref<any[]>([])

let mapInstance: EChartsInstanceLike | null = null
let mapReadyPromise: Promise<void> | null = null
let chinaMapReadyPromise: Promise<void> | null = null
let chinaMapRegistered = false

const stats = ref<PlatformStatsPayload>({
  summary: {
    total_merchants: 0,
    active_merchants: 0,
    total_customers: 0,
    total_appointments: 0,
    total_revenue: 0,
  },
  daily: {
    date: '',
    today_appointments: 0,
    yesterday_appointments: 0,
    today_revenue: 0,
    yesterday_revenue: 0,
    today_ai_usage: 0,
    yesterday_ai_usage: 0,
  },
  merchant_status: {
    active: 0,
    inactive: 0,
    pending: 0,
    applying: 0,
    rejected: 0,
    total: 0,
  },
  trends: {
    appointments_7d: [],
    ai_usage_7d: [],
    revenue_7d: [],
  },
  geo_distribution: [],
  top_merchants: [],
  updated_at: '',
})

const metricCards = computed(() => {
  const summary = stats.value.summary
  const daily = stats.value.daily
  return [
    {
      title: '平台总门店',
      value: `${summary.total_merchants}`,
      extra: `活跃 ${summary.active_merchants} 家`,
    },
    {
      title: '今日预约总量',
      value: `${daily.today_appointments}`,
      extra: `昨日 ${daily.yesterday_appointments}`,
    },
    {
      title: '今日 AI 发型生成',
      value: `${daily.today_ai_usage}`,
      extra: `昨日 ${daily.yesterday_ai_usage}`,
    },
    {
      title: '今日平台营收',
      value: `¥${toYuan(daily.today_revenue)}`,
      extra: `昨日 ¥${toYuan(daily.yesterday_revenue)}`,
    },
    {
      title: '平台累计预约',
      value: `${summary.total_appointments}`,
      extra: '全门店累计',
    },
    {
      title: '平台累计用户',
      value: `${summary.total_customers}`,
      extra: 'customer 角色用户',
    },
  ]
})

const statusCards = computed(() => {
  const st = stats.value.merchant_status
  const total = st.total || 1
  return [
    {
      label: '营业中',
      value: st.active,
      percent: Number(((st.active / total) * 100).toFixed(1)),
      color: '#0f766e',
    },
    {
      label: '暂停营业',
      value: st.inactive,
      percent: Number(((st.inactive / total) * 100).toFixed(1)),
      color: '#b45309',
    },
    {
      label: '待审核/申请中',
      value: st.pending + st.applying,
      percent: Number((((st.pending + st.applying) / total) * 100).toFixed(1)),
      color: '#1d4ed8',
    },
    {
      label: '已拒绝',
      value: st.rejected,
      percent: Number(((st.rejected / total) * 100).toFixed(1)),
      color: '#b91c1c',
    },
  ]
})

const trendRows = computed(() => {
  const appointments = stats.value.trends.appointments_7d
  const aiUsage = stats.value.trends.ai_usage_7d
  const maxAppointment = Math.max(...appointments.map((item) => item.count), 1)
  const maxAi = Math.max(...aiUsage.map((item) => item.count), 1)

  return appointments.map((item, index) => {
    const ai = aiUsage[index]?.count || 0
    return {
      date: item.date,
      appointments: item.count,
      aiUsage: ai,
      appointmentRatio: Number(((item.count / maxAppointment) * 100).toFixed(1)),
      aiRatio: Number(((ai / maxAi) * 100).toFixed(1)),
    }
  })
})

const mapSeriesData = computed(() => {
  return stats.value.geo_distribution.map((item) => ({
    name: normalizeProvinceName(item.region),
    value: item.appointment_count_30d,
    merchantCount: item.merchant_count,
    aiUsage: item.ai_usage_count_30d,
    rawRegion: item.region,
  }))
})

const merchantAvgPrice = computed(() => {
  const completed = Number(merchantStats.value.completedCount || 0)
  if (!completed) return '0.00'
  return (Number(merchantStats.value.todayRevenue || 0) / completed / 100).toFixed(2)
})

function getGeoPercent(value: number): number {
  const max = Math.max(...stats.value.geo_distribution.map((item) => item.appointment_count_30d), 1)
  return Number(((value / max) * 100).toFixed(1))
}

function normalizeProvinceName(region: string): string {
  const value = String(region || '').trim()
  const aliases: Record<string, string> = {
    北京市: '北京',
    上海市: '上海',
    天津市: '天津',
    重庆市: '重庆',
    内蒙古自治区: '内蒙古',
    广西壮族自治区: '广西',
    宁夏回族自治区: '宁夏',
    新疆维吾尔自治区: '新疆',
    西藏自治区: '西藏',
    香港特别行政区: '香港',
    澳门特别行政区: '澳门',
    新疆生产建设兵团: '新疆',
  }
  if (aliases[value]) return aliases[value]
  return value.replace(/省|市|自治区|特别行政区/g, '')
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = window.setTimeout(() => {
      reject(new Error(`加载脚本超时: ${src}`))
    }, 8000)

    const existing = document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null
    if (existing) {
      if ((existing as any).dataset.loaded === 'true') {
        window.clearTimeout(timeout)
        resolve()
        return
      }
      existing.addEventListener('load', () => {
        window.clearTimeout(timeout)
        resolve()
      }, { once: true })
      existing.addEventListener('error', () => {
        window.clearTimeout(timeout)
        reject(new Error(`加载脚本失败: ${src}`))
      }, { once: true })
      return
    }

    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.onload = () => {
      ;(script as any).dataset.loaded = 'true'
      window.clearTimeout(timeout)
      resolve()
    }
    script.onerror = () => {
      window.clearTimeout(timeout)
      reject(new Error(`加载脚本失败: ${src}`))
    }
    document.head.appendChild(script)
  })
}

async function loadScriptFromCandidates(candidates: string[], label: string) {
  let lastError: unknown = null
  for (const src of candidates) {
    try {
      await loadScript(src)
      return
    } catch (error) {
      lastError = error
    }
  }
  const detail = lastError instanceof Error ? lastError.message : String(lastError || '未知错误')
  throw new Error(`${label} 资源加载失败，请检查网络或代理设置。${detail}`)
}

async function ensureMapReady() {
  if (window.echarts) return
  if (!mapReadyPromise) {
    mapReadyPromise = (async () => {
      await loadScriptFromCandidates(
        [
          'https://fastly.jsdelivr.net/npm/echarts@5/dist/echarts.min.js',
          'https://cdn.jsdelivr.net/npm/echarts@5/dist/echarts.min.js',
          'https://unpkg.com/echarts@5/dist/echarts.min.js',
          'https://cdnjs.cloudflare.com/ajax/libs/echarts/5.5.1/echarts.min.js',
        ],
        'ECharts',
      )
    })()
  }
  try {
    await mapReadyPromise
  } catch (error) {
    mapReadyPromise = null
    throw error
  }
}

async function ensureChinaMapRegistered() {
  if (chinaMapRegistered) return
  if (!window.echarts) {
    throw new Error('ECharts 尚未加载完成')
  }
  if (!chinaMapReadyPromise) {
    chinaMapReadyPromise = (async () => {
      const response = await fetch('/maps/china.json', { cache: 'no-store' })
      if (!response.ok) {
        throw new Error(`本地地图数据加载失败: HTTP ${response.status}`)
      }
      const geoJson = await response.json()
      window.echarts?.registerMap('china', geoJson)
      chinaMapRegistered = true
    })()
  }
  try {
    await chinaMapReadyPromise
  } catch (error) {
    chinaMapReadyPromise = null
    throw error
  }
}

async function renderChinaMap() {
  if (!chinaMapRef.value || !stats.value.geo_distribution.length) {
    mapLoading.value = false
    return
  }

  mapLoading.value = true

  try {
    await ensureMapReady()
    await ensureChinaMapRegistered()
  } catch (error: any) {
    ElMessage.error(error?.message || '加载地图资源失败')
    mapLoading.value = false
    return
  }

  const echarts = window.echarts
  if (!echarts || !chinaMapRef.value) return

  mapInstance = echarts.getInstanceByDom(chinaMapRef.value) || echarts.init(chinaMapRef.value)

  const maxValue = Math.max(...mapSeriesData.value.map((item) => Number(item.value || 0)), 1)
  mapInstance.setOption(
    {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          const data = params?.data
          if (!data) {
            return `${params?.name || '未知地区'}<br/>近30天预约：0`
          }
          return [
            `${data.rawRegion || params.name}`,
            `近30天预约：${data.value || 0}`,
            `门店数：${data.merchantCount || 0}`,
            `AI使用：${data.aiUsage || 0}`,
          ].join('<br/>')
        },
      },
      visualMap: {
        min: 0,
        max: maxValue,
        left: 10,
        bottom: 0,
        text: ['高活跃', '低活跃'],
        calculable: true,
        itemWidth: 10,
        itemHeight: 72,
        inRange: {
          color: ['#dbeafe', '#7dd3fc', '#0ea5e9', '#0369a1', '#f97316'],
        },
        textStyle: {
          color: '#475569',
        },
      },
      series: [
        {
          name: '近30天预约热力',
          type: 'map',
          map: 'china',
          roam: true,
          zoom: 1.08,
          label: {
            show: true,
            fontSize: 10,
            color: '#334155',
          },
          emphasis: {
            label: {
              color: '#0f172a',
              fontWeight: 'bold',
            },
            itemStyle: {
              areaColor: '#facc15',
            },
          },
          itemStyle: {
            borderColor: '#cbd5e1',
            borderWidth: 1,
            areaColor: '#eff6ff',
          },
          data: mapSeriesData.value,
        },
      ],
    },
    true,
  )

  mapLoading.value = false
}

function handleMapResize() {
  mapInstance?.resize()
}

function toYuan(cents: number): string {
  return (Number(cents || 0) / 100).toFixed(2)
}

function formatDateTime(input: string): string {
  if (!input) return '--'
  const d = new Date(input)
  if (Number.isNaN(d.getTime())) return '--'
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hour = String(d.getHours()).padStart(2, '0')
  const minute = String(d.getMinutes()).padStart(2, '0')
  return `${month}-${day} ${hour}:${minute}`
}

async function loadData() {
  if (!isSuperAdmin.value) {
    await loadMerchantData()
    return
  }

  loading.value = true
  mapLoading.value = true
  try {
    const res = await adminApi.getPlatformStats() as any
    const payload = (res?.data ?? res) as Partial<PlatformStatsPayload>
    stats.value = {
      ...stats.value,
      ...payload,
      summary: {
        ...stats.value.summary,
        ...(payload.summary || {}),
      },
      daily: {
        ...stats.value.daily,
        ...(payload.daily || {}),
      },
      merchant_status: {
        ...stats.value.merchant_status,
        ...(payload.merchant_status || {}),
      },
      trends: {
        ...stats.value.trends,
        ...(payload.trends || {}),
      },
      geo_distribution: Array.isArray(payload.geo_distribution) ? payload.geo_distribution : [],
      top_merchants: Array.isArray(payload.top_merchants) ? payload.top_merchants : [],
      updated_at: String(payload.updated_at || ''),
    }
    await nextTick()
    void renderChinaMap()
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '加载平台数据失败')
    mapLoading.value = false
  } finally {
    loading.value = false
  }
}

async function loadMerchantData() {
  const merchantId = authStore.user.merchantId
  if (!merchantId) {
    ElMessage.warning('当前账号未绑定门店，无法加载门店总览')
    return
  }

  loading.value = true
  try {
    const today = new Date()
    const month = String(today.getMonth() + 1).padStart(2, '0')
    const day = String(today.getDate()).padStart(2, '0')
    const date = `${today.getFullYear()}-${month}-${day}`

    const [aptRes, revenueRes, txRes, customerRes] = await Promise.all([
      appointmentApi.getList({ merchant_id: merchantId, date, pageSize: 80 }) as any,
      statsApi.getRevenue({ merchant_id: merchantId, start_date: date, end_date: date }) as any,
      transactionApi.getList({ merchant_id: merchantId, pageSize: 12 }) as any,
      customerApi.getList({ merchant_id: merchantId, pageSize: 1 }) as any,
    ])

    const aptPayload = aptRes?.data ?? aptRes
    const revenuePayload = revenueRes?.data ?? revenueRes
    const txPayload = txRes?.data ?? txRes
    const customerPayload = customerRes?.data ?? customerRes

    const aptList = Array.isArray(aptPayload?.list) ? aptPayload.list : []
    const pending = aptList.filter((item: any) => item.status === 'pending')
    const summaryPayload = revenuePayload?.summary || {}

    merchantPendingList.value = pending
    merchantRecentTransactions.value = Array.isArray(txPayload?.list) ? txPayload.list : []
    merchantStats.value = {
      date,
      todayAppointments: aptList.length,
      pendingCount: pending.length,
      todayRevenue: Number(summaryPayload.totalRevenue || revenuePayload?.total_revenue || 0),
      totalCustomers: Number(customerPayload?.total || 0),
      completedCount: Number(summaryPayload.completedCount || revenuePayload?.completed_appointments || 0),
    }
  } catch (error: any) {
    ElMessage.error(error?.response?.data?.message || '加载门店总览失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  window.addEventListener('resize', handleMapResize)
  void loadData()
})

watch(
  () => stats.value.geo_distribution,
  async () => {
    if (!isSuperAdmin.value) return
    await nextTick()
    await renderChinaMap()
  },
  { deep: true },
)

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleMapResize)
  mapInstance?.dispose()
  mapInstance = null
})
</script>

<style scoped>
.platform-dashboard {
  display: flex;
  flex-direction: column;
  gap: 16px;
  color: #102a43;
  font-family: 'DIN Alternate', 'Avenir Next', 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

.hero {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  border-radius: 16px;
  background:
    radial-gradient(circle at 12% 18%, rgba(34, 197, 94, 0.28), transparent 42%),
    radial-gradient(circle at 92% 80%, rgba(14, 116, 144, 0.2), transparent 38%),
    linear-gradient(130deg, #062743 0%, #0f766e 50%, #164e63 100%);
  color: #ecfeff;
}

.hero-subtitle {
  margin: 0 0 4px;
  letter-spacing: 1.8px;
  font-size: 12px;
  opacity: 0.85;
}

.hero h1 {
  margin: 0;
  font-size: 30px;
  line-height: 1.15;
  font-weight: 800;
}

.hero-desc {
  margin: 8px 0 0;
  max-width: 560px;
  opacity: 0.94;
}

.hero-meta {
  min-width: 200px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 10px;
  text-align: right;
}

.hero-meta span {
  font-size: 12px;
  opacity: 0.86;
}

.hero-meta strong {
  display: block;
  font-size: 16px;
  font-weight: 700;
}

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 12px;
}

.kpi-card {
  border-radius: 14px;
  padding: 14px;
  border: 1px solid #cbd5e1;
  background: linear-gradient(165deg, #f8fafc 0%, #f1f5f9 100%);
}

.kpi-title {
  margin: 0;
  color: #334155;
  font-size: 13px;
}

.kpi-value {
  margin: 8px 0 4px;
  font-size: 24px;
  line-height: 1;
  font-weight: 800;
  color: #0f172a;
}

.kpi-extra {
  margin: 0;
  font-size: 12px;
  color: #64748b;
}

.panel-grid {
  display: grid;
  gap: 16px;
}

.panel-grid-2 {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.panel-card {
  border-radius: 14px;
  border: 1px solid #dbeafe;
}

.panel-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.panel-header span {
  font-size: 16px;
  font-weight: 700;
  color: #0f172a;
}

.panel-header small {
  color: #64748b;
}

.status-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.status-top {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
  color: #1e293b;
}

.trend-rows {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.trend-row {
  display: grid;
  grid-template-columns: 56px 1fr 86px;
  align-items: center;
  gap: 10px;
}

.trend-date {
  color: #64748b;
  font-size: 12px;
}

.trend-bar-wrap {
  position: relative;
  height: 18px;
  background: #e2e8f0;
  border-radius: 999px;
  overflow: hidden;
}

.trend-bar {
  position: absolute;
  left: 0;
  border-radius: 999px;
  transition: width 0.35s ease;
}

.trend-bar.appointment {
  top: 0;
  height: 10px;
  background: linear-gradient(90deg, #0ea5e9 0%, #0369a1 100%);
}

.trend-bar.ai {
  bottom: 0;
  height: 8px;
  background: linear-gradient(90deg, #22c55e 0%, #15803d 100%);
}

.trend-value {
  text-align: right;
  color: #0f172a;
  font-size: 12px;
}

.geo-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.china-map {
  height: 420px;
  width: 100%;
  margin-bottom: 14px;
  border-radius: 12px;
  background: radial-gradient(circle at 30% 30%, rgba(14, 165, 233, 0.08), transparent 30%), #f8fafc;
}

.geo-line {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 13px;
  color: #1e293b;
  margin-bottom: 4px;
}

.geo-heat-track {
  height: 12px;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
}

.geo-heat-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #f59e0b 0%, #f97316 40%, #ef4444 100%);
  transition: width 0.35s ease;
}

@media (max-width: 1280px) {
  .kpi-grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (max-width: 980px) {
  .hero {
    flex-direction: column;
    align-items: flex-start;
  }

  .hero-meta {
    min-width: 0;
    text-align: left;
  }

  .panel-grid-2 {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .kpi-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .hero h1 {
    font-size: 24px;
  }

  .china-map {
    height: 320px;
  }
}
</style>
