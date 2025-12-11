<template>
  <div class="page-wrapper">
    <header class="page-header">
      <h2>销售日报表</h2>
      <div class="filters">
        <label>
          日期：
          <input type="date" v-model="selectedDate" />
        </label>
        <div class="quick-range">
          <button
            v-for="preset in datePresets"
            :key="preset.value"
            :class="['btn', { active: preset.value === activePreset }]"
            @click="handlePresetClick(preset.value)"
          >
            {{ preset.label }}
          </button>
        </div>
      </div>
    </header>

    <!-- KPI 区域 -->
    <section class="kpi-cards">
      <div class="kpi-card">
        <div class="kpi-label">订单数</div>
        <div class="kpi-value">{{ summary.orderCount }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">销售额（¥）</div>
        <div class="kpi-value">{{ summary.revenue.toFixed(2) }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">客单价（¥）</div>
        <div class="kpi-value">{{ summary.avgOrderValue.toFixed(2) }}</div>
      </div>
    </section>

    <!-- 折线图：近 7 天销售趋势 -->
    <section class="chart-section">
      <h3>近 7 天销售趋势</h3>
      <div ref="trendChartRef" class="chart-container" />
    </section>

    <!-- 手办销售明细：按产品聚合 -->
    <section class="table-section">
      <div class="table-header">
        <h3>手办销售明细（按产品聚合）</h3>
        <span class="table-subtitle" v-if="!loading">
          共 {{ productRows.length }} 个手办
        </span>
        <span class="table-subtitle" v-if="loading">数据加载中...</span>
      </div>
      <table class="report-table">
        <thead>
          <tr>
            <th>手办名称</th>
            <th>IP</th>
            <th>品类</th>
            <th>比例</th>
            <th>销量（件）</th>
            <th>销售额（¥）</th>
            <th>平均单价（¥）</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="!loading && productRows.length === 0">
            <td colspan="7" class="empty-cell">
              暂无数据
            </td>
          </tr>
          <tr v-for="item in productRows" :key="item.productName">
            <td>{{ item.productName }}</td>
            <td>{{ item.ip }}</td>
            <td>{{ item.category }}</td>
            <td>{{ item.scale }}</td>
            <td>{{ item.quantity }}</td>
            <td>{{ item.revenue.toFixed(2) }}</td>
            <td>{{ item.avgPrice.toFixed(2) }}</td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, reactive, ref, watch } from 'vue'
import * as echarts from 'echarts'
import axios from 'axios'

type PresetValue = 'today' | 'yesterday' | '7d'

interface DatePreset {
  label: string
  value: PresetValue
}

interface DailySummary {
  orderCount: number
  revenue: number
  avgOrderValue: number
}

interface ProductRow {
  productName: string
  ip: string
  category: string
  scale: string
  quantity: number
  revenue: number
  avgPrice: number
}

interface Trend7D {
  dates: string[]
  orders: number[]
  revenues: number[]
}

interface DailyReportApiResp {
  code: number
  data: {
    summary: DailySummary
    products: ProductRow[]
    trend7d: Trend7D
  }
}

const today = new Date()
const selectedDate = ref<string>(today.toISOString().slice(0, 10))

const datePresets: DatePreset[] = [
  { label: '今天', value: 'today' },
  { label: '昨天', value: 'yesterday' },
  { label: '近 7 天', value: '7d' },
]

const activePreset = ref<PresetValue>('today')

const summary = reactive<DailySummary>({
  orderCount: 0,
  revenue: 0,
  avgOrderValue: 0,
})

const productRows = reactive<ProductRow[]>([])
const trend7d = ref<Trend7D | null>(null)
const loading = ref(false)

const trendChartRef = ref<HTMLDivElement>()
let trendChartInstance: echarts.ECharts | null = null

const renderTrendChart = () => {
  if (!trendChartRef.value || !trend7d.value) return

  if (!trendChartInstance) {
    trendChartInstance = echarts.init(trendChartRef.value)
  }

  const { dates, orders, revenues } = trend7d.value

  const option: echarts.EChartsOption = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['订单数', '销售额'] },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: dates,
    },
    yAxis: [
      { type: 'value', name: '订单数' },
      { type: 'value', name: '销售额' },
    ],
    series: [
      {
        name: '订单数',
        type: 'line',
        smooth: true,
        data: orders,
      },
      {
        name: '销售额',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: revenues,
      },
    ],
  }

  trendChartInstance.setOption(option)
  trendChartInstance.resize()
}

const handleResize = () => {
  trendChartInstance?.resize()
}

const fetchDailyReport = async () => {
  loading.value = true
  try {
    const resp = await axios.get<DailyReportApiResp>('/api/report/daily', {
      params: {
        date: selectedDate.value,
      },
    })

    const data = resp.data.data
    summary.orderCount = data.summary.orderCount
    summary.revenue = data.summary.revenue
    summary.avgOrderValue = data.summary.avgOrderValue

    productRows.splice(0, productRows.length, ...data.products)
    trend7d.value = data.trend7d
    renderTrendChart()
  } catch (e) {
    console.error('加载日报表失败', e)
    summary.orderCount = 0
    summary.revenue = 0
    summary.avgOrderValue = 0
    productRows.splice(0, productRows.length)
    trend7d.value = null
  } finally {
    loading.value = false
  }
}

const handlePresetClick = (value: PresetValue) => {
  activePreset.value = value
  const d = new Date()
  if (value === 'today') {
    selectedDate.value = d.toISOString().slice(0, 10)
  } else if (value === 'yesterday') {
    d.setDate(d.getDate() - 1)
    selectedDate.value = d.toISOString().slice(0, 10)
  } else {
    // '近 7 天' 这里暂时不改日期，只刷新报表
  }
  fetchDailyReport()
}

onMounted(() => {
  fetchDailyReport()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  trendChartInstance?.dispose()
  trendChartInstance = null
})

watch(selectedDate, () => {
  // 手动改日期时，视为“自定义日期”
  fetchDailyReport()
})
</script>

<style scoped>
.page-wrapper {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.page-header h2 {
  margin: 0;
  font-size: 20px;
}

.filters {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.quick-range {
  display: flex;
  gap: 8px;
}

.btn {
  padding: 4px 10px;
  border-radius: 4px;
  border: 1px solid #ddd;
  background-color: #fff;
  cursor: pointer;
  font-size: 13px;
}

.btn.active {
  border-color: #1677ff;
  color: #1677ff;
}

.kpi-cards {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.kpi-card {
  padding: 12px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
}

.kpi-label {
  font-size: 13px;
  color: #64748b;
}

.kpi-value {
  margin-top: 6px;
  font-size: 20px;
  font-weight: 600;
}

.chart-section,
.table-section {
  padding: 12px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
}

.chart-section h3,
.table-section h3 {
  margin: 0 0 8px;
  font-size: 16px;
}

.chart-container {
  width: 100%;
  height: 320px;
}

.table-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 8px;
}

.table-subtitle {
  font-size: 12px;
  color: #94a3b8;
}

.report-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.report-table th,
.report-table td {
  border: 1px solid #e2e8f0;
  padding: 6px 8px;
  text-align: right;
}

.report-table th:first-child,
.report-table td:first-child {
  text-align: left;
}

.report-table thead {
  background: #f8fafc;
}

.empty-cell {
  text-align: center;
  color: #94a3b8;
}
</style>
