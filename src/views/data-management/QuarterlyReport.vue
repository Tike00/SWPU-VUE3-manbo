<template>
  <div class="page-wrapper">
    <header class="page-header">
      <h2>销售季报表</h2>
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
      <div class="kpi-card" v-for="item in quarters" :key="item.quarter">
        <div class="kpi-label">Q{{ item.quarter }} 销售额（¥）</div>
        <div class="kpi-value">{{ item.revenue.toFixed(2) }}</div>
        <div class="kpi-sub">
          订单数：{{ item.orderCount }}
        </div>
      </div>
    </section>

    <section class="chart-section">
      <h3>季度销售额趋势</h3>
      <div ref="quarterRevenueRef" class="chart-container" />
    </section>

    <section class="chart-section">
      <h3>季度订单数对比</h3>
      <div ref="quarterOrderRef" class="chart-container" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, ref, watch } from 'vue'
import * as echarts from 'echarts'
import axios from 'axios'

interface QuarterRecord {
  quarter: number
  orderCount: number
  revenue: number
}

interface QuarterlyReportApiResp {
  code: number
  data: {
    quarters: QuarterRecord[]
  }
}

const currentYear = new Date().getFullYear()
const yearOptions = [currentYear - 1, currentYear, currentYear + 1]
const selectedYear = ref(currentYear)

const quarters = ref<QuarterRecord[]>([])

const quarterRevenueRef = ref<HTMLDivElement>()
const quarterOrderRef = ref<HTMLDivElement>()
let quarterRevenueChart: echarts.ECharts | null = null
let quarterOrderChart: echarts.ECharts | null = null

const renderQuarterRevenueChart = () => {
  if (!quarterRevenueRef.value || quarters.value.length === 0) return
  if (!quarterRevenueChart) {
    quarterRevenueChart = echarts.init(quarterRevenueRef.value)
  }
  const xAxis = quarters.value.map((q) => `Q${q.quarter}`)
  const revenues = quarters.value.map((q) => Number(q.revenue.toFixed(2)))

  const option: echarts.EChartsOption = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: xAxis },
    yAxis: { type: 'value', name: '销售额' },
    series: [
      {
        name: '销售额',
        type: 'line',
        smooth: true,
        data: revenues,
      },
    ],
  }
  quarterRevenueChart.setOption(option)
  quarterRevenueChart.resize()
}

const renderQuarterOrderChart = () => {
  if (!quarterOrderRef.value || quarters.value.length === 0) return
  if (!quarterOrderChart) {
    quarterOrderChart = echarts.init(quarterOrderRef.value)
  }

  const xAxis = quarters.value.map((q) => `Q${q.quarter}`)
  const orders = quarters.value.map((q) => q.orderCount)

  const option: echarts.EChartsOption = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: xAxis },
    yAxis: { type: 'value', name: '订单数' },
    series: [
      {
        name: '订单数',
        type: 'bar',
        data: orders,
      },
    ],
  }
  quarterOrderChart.setOption(option)
  quarterOrderChart.resize()
}

const renderAllCharts = () => {
  renderQuarterRevenueChart()
  renderQuarterOrderChart()
}

const handleResize = () => {
  quarterRevenueChart?.resize()
  quarterOrderChart?.resize()
}

const fetchQuarterlyReport = async () => {
  try {
    const resp = await axios.get<QuarterlyReportApiResp>('/api/report/quarterly', {
      params: { year: selectedYear.value },
    })
    quarters.value = resp.data.data.quarters
    renderAllCharts()
  } catch (e) {
    console.error('加载季报失败', e)
  }
}

onMounted(() => {
  fetchQuarterlyReport()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  quarterRevenueChart?.dispose()
  quarterOrderChart?.dispose()
  quarterRevenueChart = null
  quarterOrderChart = null
})

watch(selectedYear, () => {
  fetchQuarterlyReport()
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
  grid-template-columns: repeat(4, minmax(0, 1fr));
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
  font-size: 18px;
  font-weight: 600;
}
.kpi-sub {
  margin-top: 4px;
  font-size: 12px;
  color: #94a3b8;
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
