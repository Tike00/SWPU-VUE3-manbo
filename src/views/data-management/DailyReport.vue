<!-- src/views/data-management/DailyReport.vue -->
<template>
  <div class="page">
    <el-card>
      <div class="header">
        <div class="title-block">
          <h2>日报表</h2>
          <span class="subtitle">按日期查看手办销售情况</span>
        </div>
        <el-date-picker
          v-model="selectedDate"
          type="date"
          placeholder="选择日期"
          value-format="YYYY-MM-DD"
          style="width: 200px"
        />
      </div>

      <el-divider />

      <!-- 汇总区 -->
      <div class="summary-row" v-if="dailyData.length">
        <div class="summary-item">
          <div class="summary-label">总订单量（件）</div>
          <div class="summary-value">{{ totalQuantity }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">总销售额（元）</div>
          <div class="summary-value">{{ totalRevenue.toFixed(2) }}</div>
        </div>
        <div class="summary-item">
          <div class="summary-label">平均单价（元 / 件）</div>
          <div class="summary-value">
            {{ averagePrice.toFixed(2) }}
          </div>
        </div>
      </div>

      <el-table :data="dailyData" style="width: 100%" stripe>
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column prop="productName" label="产品" min-width="220" />
        <el-table-column prop="ip" label="IP" width="120" />
        <el-table-column prop="category" label="类别" width="120" />
        <el-table-column prop="scale" label="比例" width="80" />
        <el-table-column prop="quantity" label="数量" width="100" />
        <el-table-column prop="revenue" label="销售额(元)" width="130" />
      </el-table>

      <el-empty v-if="!dailyData.length" description="当前日期暂无数据" />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axios from 'axios'
import type { FigureOrder } from '@/types/report'

const selectedDate = ref<string>('')
const allOrders = ref<FigureOrder[]>([])

onMounted(async () => {
  const res = await axios.get<FigureOrder[]>('/api/figure/orders')
  allOrders.value = res.data

  // 默认设置为第一条数据的日期
  if (allOrders.value.length > 0) {
    selectedDate.value = allOrders.value[0]!.date
  }
})

// 当天数据
const dailyData = computed<FigureOrder[]>(() =>
  allOrders.value.filter((item) => item.date === selectedDate.value),
)

// 汇总：总数量
const totalQuantity = computed<number>(() =>
  dailyData.value.reduce((sum, item) => sum + item.quantity, 0),
)

// 汇总：总销售额
const totalRevenue = computed<number>(() =>
  dailyData.value.reduce((sum, item) => sum + item.revenue, 0),
)

// 平均单价
const averagePrice = computed<number>(() =>
  totalQuantity.value ? totalRevenue.value / totalQuantity.value : 0,
)
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
