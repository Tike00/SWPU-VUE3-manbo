<template>
  <div class="dashboard-container" v-loading="store.loading">
    <!-- 1. 顶部数据卡片 -->
    <el-row :gutter="20" class="mb-4">
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <template #header>
            <div class="card-header">
              <span>总营收 (2025)</span>
              <el-tag type="success">Yearly</el-tag>
            </div>
          </template>
          <div class="card-value">¥ {{ store.totalRevenue.toLocaleString() }}</div>
          <div class="card-footer">Mock 数据实时统计</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <template #header>
            <div class="card-header">
              <span>总销量 (件)</span>
              <el-tag type="warning">Sold</el-tag>
            </div>
          </template>
          <div class="card-value">{{ store.totalQuantity.toLocaleString() }}</div>
          <div class="card-footer">含预售与现货</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <template #header>
            <div class="card-header">
              <span>总订单数</span>
              <el-tag type="info">Orders</el-tag>
            </div>
          </template>
          <div class="card-value">{{ store.orderList.length }}</div>
          <div class="card-footer">来自全渠道</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover" class="stat-card">
          <template #header>
            <div class="card-header">
              <span>核心 IP</span>
              <el-tag color="#626aef" effect="dark">HOT</el-tag>
            </div>
          </template>
          <div class="card-value">曼波 & 哈基米</div>
          <div class="card-footer">联名款热度最高</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 2. 中间图表区域 -->
    <el-row :gutter="20" class="mb-4">
      <!-- 左侧：销售趋势折线图 -->
      <el-col :span="16">
        <el-card shadow="never">
          <template #header>
            <div class="flex justify-between items-center">
              <span class="font-bold">2025 销售额趋势 (日)</span>
              <el-button size="small" circle icon="Refresh" @click="refreshData" />
            </div>
          </template>
          <div ref="lineChartRef" class="chart-box"></div>
        </el-card>
      </el-col>

      <!-- 右侧：IP 营收占比饼图 -->
      <el-col :span="8">
        <el-card shadow="never">
          <template #header>
            <span class="font-bold">IP 营收占比</span>
          </template>
          <div ref="pieChartRef" class="chart-box"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 3. 底部：最新订单表格 -->
    <el-card shadow="never">
      <template #header>
        <span class="font-bold">最新手办订单明细</span>
      </template>
      <el-table :data="latestOrders" style="width: 100%" stripe>
        <el-table-column prop="date" label="日期" width="120" sortable />
        <el-table-column prop="productName" label="产品名称" min-width="200" show-overflow-tooltip />
        <el-table-column prop="ip" label="所属IP" width="120">
          <template #default="{ row }">
            <el-tag :type="getIpTagType(row.ip)">{{ row.ip }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="品类" width="120" />
        <el-table-column prop="scale" label="比例" width="80" align="center" />
        <el-table-column prop="quantity" label="数量" width="80" align="center" />
        <el-table-column prop="revenue" label="金额" width="120" align="right">
          <template #default="{ row }">
            <span style="color: #f56c6c; font-weight: bold;">¥{{ row.revenue }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed, watch, nextTick } from 'vue'
import { useDashboardStore } from '@/stores/dashboard' // 引用上面定义的 store
import * as echarts from 'echarts'

// Store
const store = useDashboardStore()

// Refs for Chart DOM
const lineChartRef = ref<HTMLElement | null>(null)
const pieChartRef = ref<HTMLElement | null>(null)
let lineChartInstance: echarts.ECharts | null = null
let pieChartInstance: echarts.ECharts | null = null

// Computed: 获取最新的 8 条订单
const latestOrders = computed(() => {
  // 浅拷贝并倒序，取前8
  return [...store.orderList].reverse().slice(0, 8)
})

// 工具：根据IP返回Tag颜色
const getIpTagType = (ip: string) => {
  if (ip.includes('曼波')) return ''
  if (ip.includes('耄耋')) return 'success'
  if (ip.includes('哈基米')) return 'warning'
  return 'info'
}

// ECharts 初始化逻辑
const initCharts = () => {
  if (lineChartRef.value && pieChartRef.value) {
    // 1. Line Chart
    lineChartInstance = echarts.init(lineChartRef.value)
    // 2. Pie Chart
    pieChartInstance = echarts.init(pieChartRef.value)
    
    updateCharts()
  }
}

// ECharts 数据更新逻辑
const updateCharts = () => {
  if (!lineChartInstance || !pieChartInstance) return

  // 设置 Line Chart
  const trend = store.trendData
  lineChartInstance.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', boundaryGap: false, data: trend.dates },
    yAxis: { type: 'value' },
    series: [
      {
        name: '销售额',
        type: 'line',
        smooth: true,
        data: trend.values,
        areaStyle: { opacity: 0.3, color: '#409EFF' },
        itemStyle: { color: '#409EFF' },
      },
    ],
  })

  // 设置 Pie Chart
  const pieData = store.revenueByIp
  pieChartInstance.setOption({
    tooltip: { trigger: 'item' },
    legend: { bottom: '0%', left: 'center' },
    series: [
      {
        name: 'IP 营收',
        type: 'pie',
        radius: ['40%', '70%'], // 环形图
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        data: pieData,
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
      },
    ],
  })
}

// 响应式监听窗口变化
const handleResize = () => {
  lineChartInstance?.resize()
  pieChartInstance?.resize()
}

// 刷新数据
const refreshData = async () => {
  await store.fetchDashboardData()
}

// 生命周期
onMounted(async () => {
  // 1. 获取数据
  await store.fetchDashboardData()
  // 2. 初始化图表
  nextTick(() => {
    initCharts()
    window.addEventListener('resize', handleResize)
  })
})

// 监听数据变化自动刷新图表 (如果 mock 重新请求导致 store 变化)
watch(
  () => [store.revenueList, store.orderList],
  () => {
    updateCharts()
  }
)
</script>

<style scoped>
.dashboard-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.mb-4 {
  margin-bottom: 20px;
}

/* 卡片样式 */
.stat-card {
  height: 100%;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-value {
  font-size: 28px;
  font-weight: bold;
  margin: 10px 0;
  color: #303133;
}
.card-footer {
  font-size: 12px;
  color: #909399;
}

/* 图表容器固定高度 */
.chart-box {
  height: 350px;
  width: 100%;
}

.flex { display: flex; }
.justify-between { justify-content: space-between; }
.items-center { align-items: center; }
.font-bold { font-weight: bold; }
</style>
