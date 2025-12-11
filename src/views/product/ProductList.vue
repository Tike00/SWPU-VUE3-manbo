<!-- src/views/ProductList.vue -->
<template>
  <div class="page-container">
    <div class="header">
      <h2>🧸 曼波 & 哈基米 手办库存管理</h2>
      <el-button type="primary" @click="fetchData">🔄 刷新列表</el-button>
    </div>

    <!-- 表格区域 -->
    <el-table :data="tableData" style="width: 100%" border v-loading="loading" stripe>
      <el-table-column prop="id" label="ID" width="60" align="center" />

      <el-table-column prop="name" label="手办名称" min-width="200" show-overflow-tooltip>
        <template #default="{ row }">
          <span style="font-weight: bold; color: #303133">{{ row.name }}</span>
        </template>
      </el-table-column>

      <!-- IP 列：使用不同颜色的 Tag 区分 -->
      <el-table-column prop="ip" label="所属 IP" width="120" align="center">
        <template #default="{ row }">
          <el-tag :type="getIpTagType(row.ip)" effect="light" round>
            {{ row.ip }}
          </el-tag>
        </template>
      </el-table-column>

      <!-- 品类列 -->
      <el-table-column prop="category" label="品类" width="120" align="center">
        <template #default="{ row }">
          <el-tag type="info" effect="plain">{{ row.category }}</el-tag>
        </template>
      </el-table-column>

      <!-- 比例列 -->
      <el-table-column prop="scale" label="比例" width="80" align="center">
        <template #default="{ row }">
          <span style="color: #606266; font-family: monospace">{{ row.scale }}</span>
        </template>
      </el-table-column>

      <el-table-column prop="price" label="单价" width="120" sortable align="right">
        <template #default="{ row }">
          <span style="color: #f56c6c; font-weight: bold">¥ {{ row.price }}</span>
        </template>
      </el-table-column>

      <el-table-column label="数据洞察" width="150" align="center">
        <template #default="scope">
          <el-button
            size="small"
            type="primary"
            plain
            icon="TrendCharts"
            @click="showAnalysis(scope.row)"
          >
            销量分析
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 图表弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="currentProduct ? `📊 ${currentProduct.name} - 销售趋势` : '销售分析'"
      width="700px"
      @opened="initChart"
      destroy-on-close
    >
      <div v-loading="chartLoading" style="min-height: 350px">
        <div ref="chartRef" style="width: 100%; height: 350px"></div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import axios from 'axios'
import * as echarts from 'echarts'
// 如果你想用 Element Plus 的图标，记得在 main.js 注册或这里引入，没有也没关系，只是不显示图标

const tableData = ref([])
const loading = ref(false)
const dialogVisible = ref(false)
const chartLoading = ref(false)
const chartRef = ref(null)
const currentProduct = ref(null) // 当前选中的产品

// 1. 获取产品列表 (对应 Mock 的 /api/products)
const fetchData = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/products')
    // 注意：你的 Mock 代码直接返回了数组，所以这里直接取 res.data
    // 如果 Axios 拦截器没处理，可能需要 res.data
    // 假设你的 Axios 拦截器只返回了 response body
    tableData.value = Array.isArray(res.data) ? res.data : res.data.data || []

    console.log('手办数据加载成功:', tableData.value)
  } catch (error) {
    console.error('获取列表失败:', error)
  } finally {
    loading.value = false
  }
}

// 2. 根据 IP 返回不同的 Tag 颜色
const getIpTagType = (ip) => {
  const map = {
    曼波: 'danger', // 红色
    耄耋: 'success', // 绿色
    哈基米文化: 'warning', // 橙色
    原创角色: '', // 蓝色(默认)
  }
  return map[ip] || 'info'
}

// 3. 打开分析弹窗
const showAnalysis = async (row) => {
  currentProduct.value = row
  dialogVisible.value = true
  // 这里我们将在弹窗打开后的 hook (initChart) 里去请求订单数据
}

// 4. 初始化图表
const initChart = async () => {
  chartLoading.value = true
  await nextTick() // 等待 DOM 生成

  // 模拟：去后端获取这个产品的详细订单数据
  // 真实场景：const res = await axios.get(`/api/figure/orders?name=${currentProduct.value.name}`)
  // 这里为了演示，我们从你的 Mock /api/figure/orders 取点数据来模拟
  let trendData = []
  let xLabels = []

  try {
    // 调用 Mock 的订单接口
    const res = await axios.get('/api/figure/orders')
    const allOrders = res.data.list || res.data // 根据你的 Mock 结构调整

    // 简单的数据清洗：找出名字匹配的，或者随机取最近7天的数据模拟趋势
    // 由于 Mock 的日期是随机的，为了图表好看，我们这里模拟生成近7天的走势
    xLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    trendData = xLabels.map(() => Math.floor(Math.random() * 50) + 10) // 随机生成 10-60 的销量
  } catch (e) {
    console.error(e)
    trendData = [10, 20, 15, 30, 40, 20, 50] // 兜底数据
  } finally {
    chartLoading.value = false
  }

  // 开始绘图
  const myChart = echarts.init(chartRef.value)

  const option = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xLabels,
    },
    yAxis: { type: 'value', name: '销量 (件)' },
    series: [
      {
        name: '日销量',
        type: 'line',
        smooth: true, // 平滑曲线
        data: trendData,
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(64, 158, 255, 0.5)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.01)' },
          ]),
        },
        itemStyle: { color: '#409EFF' },
      },
    ],
  }
  myChart.setOption(option)
}

onMounted(() => {
  fetchData()
})
</script>

<style scoped>
.page-container {
  padding: 24px;
  background-color: #fff;
  border-radius: 8px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
</style>
