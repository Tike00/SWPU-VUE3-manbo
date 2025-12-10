<template>
  <div class="home-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">学生管理系统 - 首页</h1>
      <p class="login-info">
        欢迎回来，{{ username }} | 上次登录时间：{{ lastLoginTime }}
      </p>
    </div>

    <!-- 统计卡片区域（用 StatisticCard 循环渲染，替代硬编码） -->
    <div class="statistic-card-group">
      <StatisticCard
        v-for="(card, index) in statisticCards"
        :key="index"
        :data="card.data"
        :icon="card.icon"
        :iconColor="card.iconColor"
      />
    </div>

    <!-- 图表可视化区（保留原有功能，优化布局一致性） -->
    <div class="chart-group">
      <div class="chart-col">
        <div class="chart-card">
          <h2 class="chart-title">各年级学生分布</h2>
          <div class="chart-container" ref="gradePieRef"></div>
        </div>
      </div>
      <div class="chart-col">
        <div class="chart-card">
          <h2 class="chart-title">近6个月学生新增趋势</h2>
          <div class="chart-container" ref="studentTrendRef"></div>
        </div>
      </div>
    </div>

    <!-- 快捷入口区（保留原有功能） -->
    <div class="shortcut-area">
      <h2 class="area-title">快捷操作</h2>
      <div class="shortcut-group">
        <div class="shortcut-col" v-for="(item, index) in shortcutList" :key="index">
          <div class="shortcut-item" @click="handleShortcutClick(item.path)">
            <div class="shortcut-icon">
              <el-icon class="shortcut-icon">
                <component :is="item.icon" />
              </el-icon>
            </div>
            <p class="shortcut-name">{{ item.name }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 近期动态区（保留原有功能） -->
    <div class="dynamic-area">
      <h2 class="area-title">近期动态</h2>
      <div class="dynamic-card">
        <div class="dynamic-list">
          <div class="dynamic-item" v-for="(item, index) in dynamicList" :key="index">
            <div class="dynamic-content">
              <div class="dynamic-icon">
                <Clock />
              </div>
              <span class="dynamic-time">{{ item.time }}</span>
              <span class="dynamic-desc">{{ item.desc }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, type Component } from 'vue'
import { useRouter } from 'vue-router'
// 图标导入
import { UserFilled, Notebook, Bell, Clock, Plus, Search, Edit } from '@element-plus/icons-vue'
// ECharts 导入
import * as echarts from 'echarts'
import type { ECharts, EChartsOption } from 'echarts'
// 导入 StatisticCard 组件（核心复用组件）
import StatisticCard from '@/components/StatisticCard.vue'

// -------------------------- TypeScript 类型定义（结构化类型约束）--------------------------
type StatisticCardItem = {
  data: {
    label: string
    value: number | string
    growth: string
  }
  icon: Component
  iconColor: 'blue-icon' | 'green-icon' | 'orange-icon'
}

type ShortcutItem = {
  name: string
  icon: Component
  path: string
}

type DynamicItem = {
  time: string
  desc: string
}

type GradeDistributionItem = {
  name: string
  value: number
}

type StudentTrendItem = {
  month: string
  count: number
}

// -------------------------- 响应式数据（结构化管理，减少冗余）--------------------------
const router = useRouter()

// 基础信息
const username = ref<string>('管理员')
const lastLoginTime = ref<string>('2025-12-08 09:30:25')

// 统计卡片数据（集中管理，新增/修改只需操作数组）
const statisticCards = ref<StatisticCardItem[]>([
  {
    data: {
      label: '当前学生总数',
      value: 246,
      growth: '环比增长 +3.2%'
    },
    icon: UserFilled,
    iconColor: 'blue-icon'
  },
  {
    data: {
      label: '当前课程总数',
      value: 32,
      growth: '已排课 28 门'
    },
    icon: Notebook,
    iconColor: 'green-icon'
  },
  {
    data: {
      label: '待处理事项',
      value: 12,
      growth: '含 8 条未录入成绩'
    },
    icon: Bell,
    iconColor: 'orange-icon'
  }
])

// 快捷入口数据
const shortcutList = ref<ShortcutItem[]>([
  { name: '学生列表', icon: Search, path: '/student-list' },
  { name: '添加学生', icon: Plus, path: '/student-add' },
  { name: '课程列表', icon: Notebook, path: '/course-list' },
  { name: '成绩录入', icon: Edit, path: '/score-input' }
])

// 近期动态数据
const dynamicList = ref<DynamicItem[]>([
  { time: '2025-12-08 10:15', desc: '系统自动备份了学生数据' },
  { time: '2025-12-07 16:42', desc: '管理员添加了课程《数据结构》' },
  { time: '2025-12-07 14:20', desc: '年级1班新增3名学生' },
  { time: '2025-12-06 09:50', desc: '数学课程成绩录入完成（共45人）' },
  { time: '2025-12-06 08:30', desc: '系统参数更新：新增成绩导出功能' }
])

// 图表数据
const gradeDistribution = ref<GradeDistributionItem[]>([
  { name: '一年级', value: 62 },
  { name: '二年级', value: 58 },
  { name: '三年级', value: 53 },
  { name: '四年级', value: 47 },
  { name: '五年级', value: 26 }
])

const studentTrend = ref<StudentTrendItem[]>([
  { month: '7月', count: 18 },
  { month: '8月', count: 25 },
  { month: '9月', count: 32 },
  { month: '10月', count: 21 },
  { month: '11月', count: 16 },
  { month: '12月', count: 23 }
])

// -------------------------- 图表相关逻辑（保留原有功能，优化代码结构）--------------------------
const gradePieRef = ref<HTMLDivElement | null>(null)
const studentTrendRef = ref<HTMLDivElement | null>(null)
let gradePieChart: ECharts | null = null
let studentTrendChart: ECharts | null = null

// 图表初始化（提取为独立方法，便于维护）
const initCharts = () => {
  disposeCharts() // 初始化前销毁旧实例

  // 年级分布饼图
  if (gradePieRef.value) {
    gradePieChart = echarts.init(gradePieRef.value)
    gradePieChart.setOption(getGradePieOption())
  }

  // 学生新增趋势线图
  if (studentTrendRef.value) {
    studentTrendChart = echarts.init(studentTrendRef.value)
    studentTrendChart.setOption(getStudentTrendOption())
  }
}

// 饼图配置（分离配置项，代码更清晰）
const getGradePieOption = (): EChartsOption => ({
  color: ['#165DFF', '#36CFFB', '#00B42A', '#FF7D00', '#F53F3F'],
  tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)', textStyle: { fontSize: 12 } },
  legend: { orient: 'vertical', left: 'right', textStyle: { fontSize: 12, color: '#4E5969' } },
  series: [{
    name: '学生分布',
    type: 'pie',
    radius: ['40%', '70%'],
    center: ['30%', '50%'],
    avoidLabelOverlap: false,
    label: { show: false },
    emphasis: { label: { show: true, fontSize: 14, fontWeight: 600 } },
    labelLine: { show: false },
    data: gradeDistribution.value
  }]
})

// 线图配置（分离配置项）
const getStudentTrendOption = (): EChartsOption => ({
  color: ['#165DFF'],
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, textStyle: { fontSize: 12 } },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: {
    type: 'category',
    data: studentTrend.value.map(item => item.month),
    axisLabel: { color: '#4E5969', fontSize: 12 },
    axisLine: { lineStyle: { color: '#E5E6EB' } }
  },
  yAxis: {
    type: 'value',
    name: '新增学生数',
    nameTextStyle: { color: '#4E5969', fontSize: 12 },
    axisLabel: { color: '#4E5969', fontSize: 12 },
    axisLine: { lineStyle: { color: '#E5E6EB' } },
    splitLine: { lineStyle: { color: '#F0F2F5' } }
  },
  series: [{
    name: '新增学生',
    type: 'line',
    smooth: true,
    symbol: 'circle',
    symbolSize: 6,
    lineStyle: { width: 3 },
    itemStyle: { color: '#165DFF', borderColor: '#fff', borderWidth: 2 },
    areaStyle: {
      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: 'rgba(22, 93, 255, 0.3)' },
        { offset: 1, color: 'rgba(22, 93, 255, 0)' }
      ])
    },
    data: studentTrend.value.map(item => item.count)
  }]
})

// 图表销毁（避免内存泄漏）
const disposeCharts = () => {
  gradePieChart?.dispose()
  studentTrendChart?.dispose()
  gradePieChart = null
  studentTrendChart = null
}

// -------------------------- 生命周期与方法 --------------------------
onMounted(() => {
  initCharts()
  window.addEventListener('resize', () => {
    gradePieChart?.resize()
    studentTrendChart?.resize()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', () => {})
  disposeCharts()
})

// 快捷入口跳转
const handleShortcutClick = (path: string) => {
  router.push(path)
}
</script>

<style scoped lang="scss">
// 基础变量（与 StatisticCard 保持一致）
:root {
  --vt-c-primary: #165DFF;
  --vt-c-success: #00B42A;
  --vt-c-warning: #FF7D00;
  --vt-c-text-light: #1D2129;
  --vt-c-text-secondary: #86909C;
  --radius-base: 6px;
  --transition-base: all 0.3s ease;
  --shadow-base: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.home-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

// 页面标题
.page-header {
  margin-bottom: 30px;
  .page-title {
    font-size: 24px;
    font-weight: 600;
    color: var(--vt-c-text-light);
    margin-bottom: 8px;
  }
  .login-info {
    font-size: 14px;
    color: var(--vt-c-text-secondary);
    margin: 0;
  }
}

// 统计卡片区域（优化布局，与 StatisticCard 样式适配）
.statistic-card-group {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  flex-wrap: wrap; // 响应式换行
  // 每个卡片占比自适应，最小宽度保证小屏体验
  > div {
    flex: 1;
    min-width: 250px;
  }
}

// 图表区域（保持原有功能，优化布局一致性）
.chart-group {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  flex-wrap: wrap;
  .chart-col {
    flex: 1;
    min-width: 300px;
  }
  .chart-card {
    height: 100%;
    background-color: #fff;
    border-radius: var(--radius-base);
    box-shadow: var(--shadow-base);
    padding: 20px;
    .chart-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--vt-c-text-light);
      margin-bottom: 16px;
      margin-top: 0;
    }
    .chart-container {
      width: 100%;
      height: 300px;
    }
  }
}

// 快捷入口区（保留原有样式，优化细节）
.shortcut-area {
  margin-bottom: 30px;
  .area-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--vt-c-text-light);
    margin-bottom: 16px;
    margin-top: 0;
  }
  .shortcut-group {
    display: flex;
    gap: 30px;
    flex-wrap: wrap;
    .shortcut-col {
      flex: 1;
      min-width: 120px;
    }
    .shortcut-item {
      background-color: #fff;
      border-radius: var(--radius-base);
      padding: 20px 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      cursor: pointer;
      transition: var(--transition-base);
      box-shadow: var(--shadow-base);
      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
      }
      .shortcut-icon {
        font-size: 32px;
        color: var(--vt-c-primary);
        margin-bottom: 12px;
      }
      .shortcut-name {
        font-size: 14px;
        color: var(--vt-c-text-light);
        margin: 0;
      }
    }
  }
}

// 近期动态区（保留原有样式，优化细节）
.dynamic-area {
  .area-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--vt-c-text-light);
    margin-bottom: 16px;
    margin-top: 0;
  }
  .dynamic-card {
    background-color: #fff;
    padding: 16px;
    border-radius: var(--radius-base);
    box-shadow: var(--shadow-base);
  }
  .dynamic-list {
    width: 100%;
  }
  .dynamic-item {
    .dynamic-content {
      display: flex;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f0f2f5;
      &:last-child {
        border-bottom: none;
      }
      .dynamic-icon {
        color: var(--vt-c-text-secondary);
        margin-right: 8px;
        font-size: 14px;
      }
      .dynamic-time {
        font-size: 12px;
        color: var(--vt-c-text-secondary);
        width: 120px;
      }
      .dynamic-desc {
        color: #4e5969;
        flex: 1;
      }
    }
  }
}
</style>