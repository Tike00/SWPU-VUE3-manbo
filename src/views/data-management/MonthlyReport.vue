<template>
  <div class="page-wrapper">
    <header class="page-header">
      <h2>销售月报表</h2>
      <div class="filters">
        <label>
          年份：
          <select v-model="selectedYear">
            <option v-for="year in yearOptions" :key="year" :value="year">
              {{ year }}
            </option>
          </select>
        </label>
        <label>
          月份：
          <select v-model="selectedMonth">
            <option v-for="m in 12" :key="m" :value="m">
              {{ m }} 月
            </option>
          </select>
        </label>
      </div>
    </header>

    <section class="kpi-cards">
      <div class="kpi-card">
        <div class="kpi-label">总订单数</div>
        <div class="kpi-value">{{ summary.orderCount }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">总销售额（¥）</div>
        <div class="kpi-value">{{ summary.revenue.toFixed(2) }}</div>
      </div>
      <div class="kpi-card">
        <div class="kpi-label">日均销售额（¥）</div>
        <div class="kpi-value">{{ summary.avgDailyRevenue.toFixed(2) }}</div>
      </div>
    </section>

    <section class="chart-section">
      <h3>本月每日销售额</h3>
      <div ref="dailyRevenueRef" class="chart-container" />
    </section>

    <section class="chart-section">
      <h3>本月每日订单数</h3>
      <div ref="dailyOrderRef" class="chart-container" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { onMounted, onBeforeUnmount, reactive, ref, watch } from 'vue'
import * as echarts from 'echarts'
import axios from 'axios'

interface MonthlySummary {
  orderCount: number
  revenue: number
  avgDailyRevenue: number
}

interface MonthlyReportApiResp {
  code: number
  data: {
    summary: MonthlySummary
    days: number[]
    orders: number[]
    revenues: number[]
  }
}

const currentYear = new Date().getFullYear()
const yearOptions = [currentYear - 1, currentYear, currentYear + 1]
const selectedYear = ref(currentYear)
const selectedMonth = ref(new Date().getMonth() + 1)

const summary = reactive<MonthlySummary>({
  orderCount: 0,
  revenue: 0,
  avgDailyRevenue: 0,
})

const days = ref<number[]>([])
const orders = ref<number[]>([])
const revenues = ref<number[]>([])

const dailyRevenueRef = ref<HTMLDivElement>()
const dailyOrderRef = ref<HTMLDivElement>()
let dailyRevenueChart: echarts.ECharts | null = null
let dailyOrderChart: echarts.ECharts | null = null

const renderDailyRevenueChart = () => {
  if (!dailyRevenueRef.value || days.value.length === 0) return
  if (!dailyRevenueChart) {
    dailyRevenueChart = echarts.init(dailyRevenueRef.value)
  }
  const option: echarts.EChartsOption = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: days.value },
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
  dailyRevenueChart.setOption(option)
  dailyRevenueChart.resize()
}

const renderDailyOrderChart = () => {
  if (!dailyOrderRef.value || days.value.length === 0) return
  if (!dailyOrderChart) {
    dailyOrderChart = echarts.init(dailyOrderRef.value)
  }
  const option: echarts.EChartsOption = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: days.value },
    yAxis: { type: 'value', name: '订单数' },
    series: [
      {
        name: '订单数',
        type: 'bar',
        data: orders.value,
      },
    ],
  }
  dailyOrderChart.setOption(option)
  dailyOrderChart.resize()
}

const renderAllCharts = () => {
  renderDailyRevenueChart()
  renderDailyOrderChart()
}

const handleResize = () => {
  dailyRevenueChart?.resize()
  dailyOrderChart?.resize()
}

const fetchMonthlyReport = async () => {
  try {
    const resp = await axios.get<MonthlyReportApiResp>('/api/report/monthly', {
      params: {
        year: selectedYear.value,
        month: selectedMonth.value,
      },
    })
    const data = resp.data.data
    summary.orderCount = data.summary.orderCount
    summary.revenue = data.summary.revenue
    summary.avgDailyRevenue = data.summary.avgDailyRevenue
    days.value = data.days
    orders.value = data.orders
    revenues.value = data.revenues
    renderAllCharts()
  } catch (e) {
    console.error('加载月报失败', e)
  }
}

onMounted(() => {
  fetchMonthlyReport()
  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  dailyRevenueChart?.dispose()
  dailyOrderChart?.dispose()
  dailyRevenueChart = null
  dailyOrderChart = null
})

watch([selectedYear, selectedMonth], () => {
  fetchMonthlyReport()
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
