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
              <span>总销量 (千件)</span>
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
      <!-- 左侧：按手办名称统计的销量折线图 -->
      <el-col :span="16">
        <el-card shadow="never">
          <template #header>
            <div class="flex justify-between items-center">
              <span class="font-bold">2025 各手办销量分布（件）</span>
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
        <el-table-column
          prop="productName"
          label="产品名称"
          min-width="200"
          show-overflow-tooltip
        />
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
import { useDashboardStore } from '@/stores/dashboard'
import * as echarts from 'echarts'

// Store
const store = useDashboardStore()

// Refs for Chart DOM
const lineChartRef = ref<HTMLElement | null>(null)
const pieChartRef = ref<HTMLElement | null>(null)
let lineChartInstance: echarts.ECharts | null = null
let pieChartInstance: echarts.ECharts | null = null

// Computed: 获取最新的 8 条订单（扁平后的订单行）
const latestOrders = computed(() => {
  return [...store.orderList].reverse().slice(0, 8)
})

// 工具：根据IP返回Tag颜色
const getIpTagType = (ip: string) => {
  if (ip.includes('曼波')) return ''
  if (ip.includes('耄耋')) return 'success'
  if (ip.includes('哈基米')) return 'warning'
  return 'info'
}

// 初始化图表
const initCharts = () => {
  if (lineChartRef.value && pieChartRef.value) {
    lineChartInstance = echarts.init(lineChartRef.value)
    pieChartInstance = echarts.init(pieChartRef.value)
    updateCharts()
  }
}

// 更新图表数据
const updateCharts = () => {
  if (!lineChartInstance || !pieChartInstance) return

  // ============================
  // 1. 折线图：按“手办名称”汇总销量
  // ============================
  // 假设 store.orderList 是 DashboardOrderRow[]：
  // { date, productName, ip, category, scale, quantity, revenue }
  const productMap = new Map<string, number>()

  store.orderList.forEach((row: any) => {
    const name = row.productName || '未知手办'
    const qty = Number(row.quantity) || 0
    const prev = productMap.get(name) || 0
    productMap.set(name, prev + qty)
  })

  const productNames = Array.from(productMap.keys())
  const quantities = Array.from(productMap.values())

  lineChartInstance.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        if (!params || !params.length) return ''
        const p = params[0]
        return `${p.axisValue}<br/>销量：${p.data} 千件`
      },
    },
    grid: { left: '3%', right: '3%', bottom: '20%', containLabel: true },
    xAxis: {
      type: 'category',
      data: productNames,
      axisLabel: {
        interval: 0, // 全部显示
        rotate: 45,  // 斜着写
        fontSize: 11,
      },
    },
    yAxis: {
      type: 'value',
      name: '销量（千件）',
    },
    series: [
      {
        name: '销量（千件）',
        type: 'line',
        smooth: true,
        data: quantities,
        areaStyle: { opacity: 0.3, color: '#409EFF' },
        itemStyle: { color: '#409EFF' },
      },
    ],
  })

  // ============================
  // 2. 饼图：IP 营收占比
  // ============================
  const pieData = store.revenueByIp
  pieChartInstance.setOption({
    tooltip: {
      trigger: 'item',
      confine: false,
      // 某些版本支持 appendToBody，可以减少被父级裁剪的情况
      // @ts-ignore
      appendToBody: true,
      formatter: (params: any) => {
        const value = Number(params.value) || 0
        return `${params.name}<br/>营收：¥${value.toLocaleString()}<br/>占比：${params.percent}%`
      },
    },
    legend: { bottom: '0%', left: 'center' },
    series: [
      {
        name: 'IP 营收',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: true,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2,
        },
        data: pieData,
        label: {
          show: true,
          position: 'outside',
          formatter: '{b}', // 只显示 IP 名
        },
        labelLine: {
          show: true,
          length: 10,
          length2: 8,
          smooth: true,
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 16,
            fontWeight: 'bold',
            formatter: '{b}\n{d}%',
          },
        },
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
  updateCharts()
}

// 生命周期
onMounted(async () => {
  await store.fetchDashboardData()
  nextTick(() => {
    initCharts()
    window.addEventListener('resize', handleResize)
  })
})

// 监听数据变化自动刷新图表
watch(
  () => [store.orderList, store.revenueByIp],
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

/* 图表容器固定高度 + 允许溢出（避免 label/tooltip 被截断） */
.chart-box {
  height: 350px;
  width: 100%;
  overflow: visible;
}

/* 避免 el-card 把 ECharts 的 tooltip / label 裁掉 */
:deep(.el-card__body) {
  overflow: visible;
}

.flex {
  display: flex;
}
.justify-between {
  justify-content: space-between;
}
.items-center {
  align-items: center;
}
.font-bold {
  font-weight: bold;
}
</style>
