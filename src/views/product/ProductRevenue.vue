<template>
  <div class="p-6 space-y-6">

    <!-- 标题 -->
    <h2 class="text-2xl font-bold">产品销售额统计</h2>

    <!-- 刷新按钮 -->
    <el-button type="primary" @click="loadData" :loading="loading">
      刷新销售数据
    </el-button>

    <!-- 柱状图 -->
    <div class="bg-white rounded-2xl shadow p-6">
      <h3 class="text-lg font-semibold mb-4">销售额柱状图</h3>
      <div ref="barRef" style="width: 100%; height: 360px"></div>
    </div>

    <!-- 饼状图 -->
    <div class="bg-white rounded-2xl shadow p-6">
      <h3 class="text-lg font-semibold mb-4">销售占比饼状图</h3>
      <div ref="pieRef" style="width: 100%; height: 360px"></div>
    </div>

  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from "vue";
import axios from "axios";
import * as echarts from "echarts";

const barRef = ref<HTMLElement | null>(null);
const pieRef = ref<HTMLElement | null>(null);
let barChart: echarts.ECharts | null = null;
let pieChart: echarts.ECharts | null = null;

const loading = ref(false);
const productList = ref<any[]>([]);

// ------------------ 加载数据：读取你 mock 的 /api/products ------------------
const loadData = async () => {
  loading.value = true;
  try {
    const res = await axios.get("/api/products");
    if (res.data?.code === 200) {
      productList.value = res.data.data;

      await nextTick();
      renderBarChart();
      renderPieChart();
    }
  } finally {
    loading.value = false;
  }
};

// ------------------ 柱状图 ------------------
const renderBarChart = () => {
  if (!barRef.value) return;

  barChart = echarts.init(barRef.value);
  barChart.setOption({
    tooltip: {
      trigger: "axis",
    },
    xAxis: {
      type: "category",
      data: productList.value.map((item) => item.name),
      axisLabel: { interval: 0, rotate: 30 }, // 名称可能较长
    },
    yAxis: {
      type: "value",
      name: "销售额（元）",
    },
    series: [
      {
        name: "销售额",
        type: "bar",
        data: productList.value.map((item) => item.price),
        barWidth: "55%",
      },
    ],
  });
};

// ------------------ 饼状图 ------------------
const renderPieChart = () => {
  if (!pieRef.value) return;

  pieChart = echarts.init(pieRef.value);
  pieChart.setOption({
    tooltip: { trigger: "item" },
    legend: { bottom: 0 },
    series: [
      {
        name: "销售占比",
        type: "pie",
        radius: "70%",
        data: productList.value.map((item) => ({
          name: item.name,
          value: item.price,
        })),
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowOffsetX: 0 },
        },
      },
    ],
  });
};

// 页面挂载时加载一次
onMounted(() => {
  loadData();

  // 自适应窗口变化
  window.addEventListener("resize", () => {
    barChart?.resize();
    pieChart?.resize();
  });
});
</script>

<style scoped>
/* Tailwind 已经覆盖大部分 UI 样式，这里可以不用写 */
</style>
