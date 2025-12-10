<script setup lang="ts">
import { ref, onMounted } from "vue";
import { ElMessage } from "element-plus";
import * as echarts from "echarts";
import axios from "axios";

const loading = ref(false);
const dateRange = ref("");
const revenueData = ref<any[]>([]);

// 柱状图
const barChartRef = ref<HTMLDivElement | null>(null);
let barChart: echarts.ECharts | null = null;

// 饼状图
const pieChartRef = ref<HTMLDivElement | null>(null);
let pieChart: echarts.ECharts | null = null;

const fetchData = async () => {
  loading.value = true;
  try {
    const res = await axios.get("/api/revenue");
    revenueData.value = res.data || [];
    renderBarChart();
    renderPieChart();
  } catch {
    ElMessage.error("获取收入数据失败");
  }
  loading.value = false;
};

// 渲染柱状图
const renderBarChart = () => {
  if (!barChartRef.value) return;

  if (!barChart) {
    barChart = echarts.init(barChartRef.value);
    window.addEventListener("resize", () => barChart?.resize());
  }

  barChart.setOption({
    title: { text: "产品收入柱状图（Mock）", left: "center" },
    tooltip: { trigger: "axis" },
    grid: { left: "5%", right: "5%", bottom: "10%" },
    xAxis: {
      type: "category",
      data: revenueData.value.map((i) => i.productName),
      axisLabel: { rotate: 20 }
    },
    yAxis: { type: "value" },
    series: [
      {
        name: "收入 (¥)",
        type: "bar",
        barWidth: "45%",
        data: revenueData.value.map((i) => i.revenue),
      },
    ],
  });
};

// 渲染饼状图
const renderPieChart = () => {
  if (!pieChartRef.value) return;

  if (!pieChart) {
    pieChart = echarts.init(pieChartRef.value);
    window.addEventListener("resize", () => pieChart?.resize());
  }

  pieChart.setOption({
    title: {
      text: "收入占比（Mock）",
      left: "center"
    },
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c} 元 ({d}%)"
    },
    legend: {
      bottom: "2%"
    },
    series: [
      {
        name: "收入占比",
        type: "pie",
        radius: ["35%", "65%"],
        center: ["50%", "50%"],
        avoidLabelOverlap: false,
        data: revenueData.value.map((i) => ({
          name: i.productName,
          value: i.revenue
        })),
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowColor: "rgba(0,0,0,0.3)" }
        }
      }
    ]
  });
};

onMounted(fetchData);
</script>

<template>
  <div class="page">
    <!-- 筛选区卡片 -->
    <el-card shadow="hover" class="card">
      <template #header>
        <div class="card-header">📊 数据筛选</div>
      </template>

      <el-row :gutter="20" align="middle">
        <el-col :span="10">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 100%"
          />
        </el-col>
        <el-col :span="4">
          <el-button type="primary" :loading="loading" @click="fetchData" style="width: 100%">
            查询
          </el-button>
        </el-col>
      </el-row>
    </el-card>

    <!-- 柱状图卡片 -->
    <el-card shadow="hover" class="card mt">
      <template #header>
        <div class="card-header">📈 产品收入柱状图</div>
      </template>
      <div ref="barChartRef" class="chart"></div>
    </el-card>

    <!-- 饼状图卡片（新增） -->
    <el-card shadow="hover" class="card mt">
      <template #header>
        <div class="card-header">🧁 产品收入占比饼状图</div>
      </template>
      <div ref="pieChartRef" class="chart"></div>
    </el-card>

    <!-- 表格卡片 -->
    <el-card shadow="hover" class="card mt">
      <template #header>
        <div class="card-header">📄 收入详细数据</div>
      </template>

      <el-table :data="revenueData" border stripe>
        <el-table-column prop="productName" label="产品名称" width="200" />
        <el-table-column prop="quantity" label="销量" width="120" />
        <el-table-column prop="revenue" label="销售收入（¥）" />
      </el-table>
    </el-card>
  </div>
</template>

<style scoped>
.page {
  padding: 24px;
  background: #f5f6fa;
  min-height: 100vh;
}

.card {
  border-radius: 12px;
}

.card-header {
  font-size: 16px;
  font-weight: 600;
}

.mt {
  margin-top: 24px;
}

.chart {
  width: 100%;
  height: 380px;
}
</style>
