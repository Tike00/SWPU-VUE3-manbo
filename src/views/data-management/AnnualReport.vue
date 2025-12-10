<!-- src/views/data-management/AnnualReport.vue -->
<template>
  <div class="page">
    <el-card class="card">
      <!-- 顶部：标题 + 年份输入 -->
      <div class="header">
        <div class="title-block">
          <h2>年度报表</h2>
          <span class="subtitle">按年份 & 月份汇总手办销售情况</span>
        </div>
        <el-input v-model="selectedYear" placeholder="输入年份，例如：2025" style="width: 200px" />
      </div>

      <el-divider />

      <!-- 中部：年度汇总统计 -->
      <div class="summary-row" v-if="yearRows.length">
        <div class="summary-item">
          <div class="summary-label">年度总订单量（件）</div>
          <div class="summary-value">{{ totalQuantity }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">年度总销售额（元）</div>
          <div class="summary-value">{{ totalRevenue.toFixed(2) }}</div>
        </div>
      </div>

      <!-- 主体内容：左表格 + 右侧 IP 汇总表格 -->
      <div class="content-row">
        <!-- 左侧：按月份汇总 -->
        <div class="main-table">
          <h3 class="block-title">按月份汇总</h3>
          <el-table :data="yearSummaryByMonth" stripe style="width: 100%">
            <el-table-column prop="month" label="月份" min-width="120" />
            <el-table-column prop="totalQuantity" label="总数量" min-width="120" />
            <el-table-column prop="totalRevenue" label="总销售额(元)" min-width="150" />
          </el-table>

          <el-empty
            v-if="!yearSummaryByMonth.length"
            description="当前年份暂无月份数据"
            :image-size="80"
          />
        </div>

        <!-- 右侧：按 IP 维度汇总 -->
        <div class="side-panel">
          <h3 class="block-title">按 IP 汇总</h3>
          <el-table
            :data="ipSummary"
            size="small"
            stripe
            style="width: 100%"
            v-if="ipSummary.length"
          >
            <el-table-column prop="ip" label="IP" min-width="120" />
            <el-table-column prop="totalQuantity" label="总数量" min-width="100" />
            <el-table-column prop="totalRevenue" label="总销售额(元)" min-width="120" />
          </el-table>

          <el-empty v-else description="当前年份暂无 IP 数据" :image-size="80" />
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import type { FigureOrder } from '@/types/report'

interface YearMonthRow {
  month: string // YYYY-MM
  totalQuantity: number
  totalRevenue: number
}

interface IpSummaryRow {
  ip: string
  totalQuantity: number
  totalRevenue: number
}

const allOrders = ref<FigureOrder[]>([])
const selectedYear = ref<string>('2025')

onMounted(async () => {
  const res = await axios.get<FigureOrder[]>('/api/figure/orders')
  const data = res.data ?? []

  allOrders.value = data

  const first = data[0]
  if (first) {
    selectedYear.value = first.date.slice(0, 4)
  } else {
    selectedYear.value = '2025'
  }
})

// 当前年份所有明细
const yearRows = computed<FigureOrder[]>(() =>
  allOrders.value.filter((item) => item.date.slice(0, 4) === selectedYear.value),
)

// 年度汇总
const totalQuantity = computed<number>(() =>
  yearRows.value.reduce((sum, item) => sum + item.quantity, 0),
)
const totalRevenue = computed<number>(() =>
  yearRows.value.reduce((sum, item) => sum + item.revenue, 0),
)

// 按月份汇总
const yearSummaryByMonth = computed<YearMonthRow[]>(() => {
  const map = new Map<string, YearMonthRow>()

  yearRows.value.forEach((item) => {
    const month = item.date.slice(0, 7) // YYYY-MM
    const existing = map.get(month) ?? {
      month,
      totalQuantity: 0,
      totalRevenue: 0,
    }

    existing.totalQuantity += item.quantity
    existing.totalRevenue += item.revenue
    map.set(month, existing)
  })

  // 按月份排序
  return Array.from(map.values()).sort((a, b) => (a.month > b.month ? 1 : -1))
})

// 按 IP 维度汇总（用于右侧表格）
const ipSummary = computed<IpSummaryRow[]>(() => {
  const map = new Map<string, IpSummaryRow>()

  yearRows.value.forEach((item) => {
    const key = item.ip
    const existing = map.get(key) ?? {
      ip: key,
      totalQuantity: 0,
      totalRevenue: 0,
    }

    existing.totalQuantity += item.quantity
    existing.totalRevenue += item.revenue
    map.set(key, existing)
  })

  return Array.from(map.values())
})
</script>

<style scoped>
.page {
  padding: 20px;
}

/* 让卡片本身尽量铺满父容器 */
.card {
  width: 100%;
  box-sizing: border-box;
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

/* 顶部 summary */
.summary-row {
  display: flex;
  margin-bottom: 16px;
  gap: 16px;
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

/* 主体左右布局 */
.content-row {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  margin-top: 8px;
}

/* 左侧主表格区域（占大头） */
.main-table {
  flex: 2;
}

/* 右侧修饰 / 汇总区域（占较小部分） */
.side-panel {
  flex: 1;
}

.block-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: #606266;
}
</style>
