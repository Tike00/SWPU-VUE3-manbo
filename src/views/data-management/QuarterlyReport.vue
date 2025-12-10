<!-- src/views/data-management/QuarterlyReport.vue -->
<template>
  <div class="page">
    <el-card>
      <div class="header">
        <div class="title-block">
          <h2>季度报表</h2>
          <span class="subtitle">按季度统计手办销售情况</span>
        </div>
        <el-select v-model="selectedQuarter" placeholder="选择季度" style="width: 200px">
          <el-option label="第一季度 (Q1)" value="Q1" />
          <el-option label="第二季度 (Q2)" value="Q2" />
          <el-option label="第三季度 (Q3)" value="Q3" />
          <el-option label="第四季度 (Q4)" value="Q4" />
        </el-select>
      </div>

      <el-divider />

      <div class="summary-row" v-if="quarterRows.length">
        <div class="summary-item">
          <div class="summary-label">总订单量（件）</div>
          <div class="summary-value">{{ totalQuantity }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">总销售额（元）</div>
          <div class="summary-value">{{ totalRevenue.toFixed(2) }}</div>
        </div>
      </div>

      <el-table :data="quarterByProduct" stripe>
        <el-table-column prop="productName" label="产品" min-width="220" />
        <el-table-column prop="totalQuantity" label="总数量" width="120" />
        <el-table-column prop="totalRevenue" label="总销售额(元)" width="150" />
      </el-table>

      <el-empty v-if="!quarterByProduct.length" description="当前季度暂无数据" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import type { FigureOrder } from '@/types/report'

interface QuarterProductRow {
  productName: string
  totalQuantity: number
  totalRevenue: number
}

const allOrders = ref<FigureOrder[]>([])
const selectedQuarter = ref<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q1')

onMounted(async () => {
  const res = await axios.get<FigureOrder[]>('/api/figure/orders')
  allOrders.value = res.data
})

// 月份 → 季度
function getQuarter(date: string): 'Q1' | 'Q2' | 'Q3' | 'Q4' {
  const m = Number(date.slice(5, 7))
  if (m <= 3) return 'Q1'
  if (m <= 6) return 'Q2'
  if (m <= 9) return 'Q3'
  return 'Q4'
}

// 当前季度明细
const quarterRows = computed<FigureOrder[]>(() =>
  allOrders.value.filter((item) => getQuarter(item.date) === selectedQuarter.value),
)

// 汇总
const totalQuantity = computed<number>(() =>
  quarterRows.value.reduce((sum, item) => sum + item.quantity, 0),
)
const totalRevenue = computed<number>(() =>
  quarterRows.value.reduce((sum, item) => sum + item.revenue, 0),
)

// 按产品汇总
const quarterByProduct = computed<QuarterProductRow[]>(() => {
  const map = new Map<string, QuarterProductRow>()

  quarterRows.value.forEach((item) => {
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
