<template>
  <div class="page-wrapper">
    <header class="page-header">
      <h2>销售年报表</h2>
      <div class="filters">
        <label>
          年份：
          <select v-model="selectedYear">
            <option v-for="year in yearOptions" :key="year" :value="year">
              {{ year }}
            </option>
          </select>
        </label>
      </div>
    </header>

    <section class="kpi-cards">
      <div class="kpi-card">
        <div class="kpi-label">年度总订单数</div>
        <div class="kpi-value">{{ summary.orderCount }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">年度总销售额（¥）</div>
        <div class="kpi-value">{{ summary.revenue.toFixed(2) }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">月均销售额（¥）</div>
        <div class="kpi-value">{{ summary.avgMonthlyRevenue.toFixed(2) }}</div>
      </div>
    </section>

    <section class="chart-section">
      <h3>月度销售额趋势</h3>
      <div ref="monthRevenueRef" class="chart-container" />
    </section>

    <section class="chart-section">
      <h3>月度订单数对比</h3>
      <div ref="monthOrderRef" class="chart-container" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, reactive, ref, watch } from 'vue'
import * as echarts from 'echarts'
import axios from 'axios'

interface AnnualSummary {
  orderCount: number
  revenue: number
  avgMonthlyRevenue: number
}

interface AnnualReportApiResp {
  code: number
  data: {
    summary: AnnualSummary
    months: number[]
    orders: number[]
    revenues: number[]
  }
}

const currentYear = new Date().getFullYear()
const yearOptions = [currentYear - 1, currentYear, currentYear + 1]
const selectedYear = ref(currentYear)

const summary = reactive<AnnualSummary>({
  orderCount: 0,
  revenue: 0,
  avgMonthlyRevenue: 0,
})

const months = ref<number[]>([])
const orders = ref<number[]>([])
const revenues = ref<number[]>([])

const monthRevenueRef = ref<HTMLDivElement>()
const monthOrderRef = ref<HTMLDivElement>()
let monthRevenueChart: echarts.ECharts | null = null
let monthOrderChart: echarts.ECharts | null = null

const renderMonthRevenueChart = () => {
  if (!monthRevenueRef.value || months.value.length === 0) return
  if (!monthRevenueChart) {
    monthRevenueChart = echarts.init(monthRevenueRef.value)
  }
  const xAxis = months.value.map((m) => `${m}月`)
  const option: echarts.EChartsOption = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: xAxis },
    yAxis: { type: 'value', name: '销售额' },
    series: [
      {
        name: '销售额',
        type: 'line',
        smooth: true,
        data: revenues.value,
      },
    ],
  }
  monthRevenueChart.setOption(option)
  monthRevenueChart.resize()
}

const renderMonthOrderChart = () => {
  if (!monthOrderRef.value || months.value.length === 0) return
  if (!monthOrderChart) {
    monthOrderChart = echarts.init(monthOrderRef.value)
  }
  const xAxis = months.value.map((m) => `${m}月`)
  const option: echarts.EChartsOption = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: xAxis },
    yAxis: { type: 'value', name: '订单数' },
    series: [
      {
        name: '订单数',
        type: 'bar',
        data: orders.value,
      },
    ],
  }
  monthOrderChart.setOption(option)
  monthOrderChart.resize()
}

const renderAllCharts = () => {
  renderMonthRevenueChart()
  renderMonthOrderChart()
}

const handleResize = () => {
  monthRevenueChart?.resize()
  monthOrderChart?.resize()
}

const fetchAnnualReport = async () => {
  try {
    const resp = await axios.get<AnnualReportApiResp>('/api/report/annual', {
      params: { year: selectedYear.value },
    })
    const data = resp.data.data
    summary.orderCount = data.summary.orderCount
    summary.revenue = data.summary.revenue
    summary.avgMonthlyRevenue = data.summary.avgMonthlyRevenue
    months.value = data.months
    orders.value = data.orders
    revenues.value = data.revenues
    renderAllCharts()
  } catch (e) {
    console.error('加载年报失败', e)
  }
}

onMounted(() => {
  fetchAnnualReport()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  monthRevenueChart?.dispose()
  monthOrderChart?.dispose()
  monthRevenueChart = null
  monthOrderChart = null
})

watch(selectedYear, () => {
  fetchAnnualReport()
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
  gap: 12px;
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
.chart-section {
  padding: 12px;
  border-radius: 8px;
  background: #fff;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
}
.chart-section h3 {
  margin: 0 0 8px;
  font-size: 16px;
}
.chart-container {
  width: 100%;
  height: 320px;
}
</style>
