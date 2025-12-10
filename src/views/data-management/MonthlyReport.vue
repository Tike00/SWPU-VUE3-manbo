<!-- src/views/data-management/MonthlyReport.vue -->
<template>
  <div class="page">
    <el-card>
      <div class="header">
        <div class="title-block">
          <h2>月报表</h2>
          <span class="subtitle">按月份统计手办销售情况</span>
        </div>
        <el-date-picker
          v-model="selectedMonth"
          type="month"
          value-format="YYYY-MM"
          placeholder="选择月份"
          style="width: 200px"
        />
      </div>

      <el-divider />

      <div class="summary-row" v-if="monthlyRows.length">
        <div class="summary-item">
          <div class="summary-label">总订单量（件）</div>
          <div class="summary-value">{{ totalQuantity }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">总销售额（元）</div>
          <div class="summary-value">{{ totalRevenue.toFixed(2) }}</div>
        </div>
      </div>

      <el-table :data="monthlyByProduct" stripe>
        <el-table-column prop="productName" label="产品" min-width="220" />
        <el-table-column prop="totalQuantity" label="总数量" width="120" />
        <el-table-column prop="totalRevenue" label="总销售额(元)" width="150" />
      </el-table>

      <el-empty v-if="!monthlyByProduct.length" description="当前月份暂无数据" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import type { FigureOrder } from '@/types/report'

interface MonthlyProductRow {
  productName: string
  totalQuantity: number
  totalRevenue: number
}

const allOrders = ref<FigureOrder[]>([])
const selectedMonth = ref<string>('')

// 加载数据
onMounted(async () => {
  const res = await axios.get<FigureOrder[]>('/api/figure/orders')
  allOrders.value = res.data
  if (allOrders.value.length > 0) {
    selectedMonth.value = allOrders.value[0]!.date.slice(0, 7) // YYYY-MM
  }
})

// 当前月的明细
const monthlyRows = computed<FigureOrder[]>(() =>
  allOrders.value.filter((item) => item.date.slice(0, 7) === selectedMonth.value),
)

// 当前月汇总：总数量、总金额
const totalQuantity = computed<number>(() =>
  monthlyRows.value.reduce((sum, item) => sum + item.quantity, 0),
)

const totalRevenue = computed<number>(() =>
  monthlyRows.value.reduce((sum, item) => sum + item.revenue, 0),
)

// 按产品汇总
const monthlyByProduct = computed<MonthlyProductRow[]>(() => {
  const map = new Map<string, MonthlyProductRow>()

  monthlyRows.value.forEach((item) => {
    const existing = map.get(item.productName) ?? {
      productName: item.productName,
      totalQuantity: 0,
      totalRevenue: 0,
    }

    existing.totalQuantity += item.quantity
    existing.totalRevenue += item.revenue
    map.set(item.productName, existing)
  })

  return Array.from(map.values())
})
</script>

<style scoped>
.page {
  padding: 20px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.title-block h2 {
  margin: 0;
}
.subtitle {
  font-size: 12px;
  color: #909399;
}
.summary-row {
  display: flex;
  margin-bottom: 16px;
}
.summary-item {
  flex: 1;
  text-align: center;
}
.summary-label {
  font-size: 12px;
  color: #909399;
}
.summary-value {
  font-size: 18px;
  font-weight: 600;
  margin-top: 4px;
}
</style>
