// src/stores/dashboard.ts
import { defineStore } from 'pinia'
import axios from 'axios'

/**
 * 和 Mock 里 /api/dashboard/overview 返回的数据结构对齐
 */

interface DashboardTrendData {
  dates: string[]
  values: number[]
}

interface RevenueByIp {
  name: string   // IP 名称
  value: number  // 该 IP 的营收
}

interface DashboardOrderRow {
  date: string
  productName: string
  ip: string
  category: string
  scale: string
  quantity: number
  revenue: number
}

interface DashboardOverviewApiResp {
  code: number
  data: {
    totalRevenue: number
    totalQuantity: number
    totalOrders: number
    trendData: DashboardTrendData
    revenueByIp: RevenueByIp[]
    orderList: DashboardOrderRow[]
  }
}

/**
 * 首页 Dashboard Store
 * Home.vue 里通过 useDashboardStore() 使用
 */
export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    loading: false as boolean,

    // 顶部 KPI
    totalRevenue: 0 as number,
    totalQuantity: 0 as number,
    totalOrders: 0 as number,

    // 折线图数据
    trendData: {
      dates: [] as string[],
      values: [] as number[],
    } as DashboardTrendData,

    // IP 饼图数据
    revenueByIp: [] as RevenueByIp[],

    // 底部订单明细表
    orderList: [] as DashboardOrderRow[],
  }),

  getters: {
    /**
     * 给 Home.vue 里的 watch 使用：
     * watch(() => [store.revenueList, store.orderList], () => { updateCharts() })
     */
    revenueList: (state) => state.trendData.values,
  },

  actions: {
    /**
     * 从 Mock 接口获取首页数据
     * 对应 src/mock/index.ts 里的：
     * Mock.mock(/\/api\/dashboard\/overview(\?.*)?$/, 'get', ...)
     */
    async fetchDashboardData() {
      this.loading = true
      try {
        const resp = await axios.get<DashboardOverviewApiResp>('/api/dashboard/overview')
        const { data } = resp.data

        // 顶部 KPI
        this.totalRevenue = data.totalRevenue
        this.totalQuantity = data.totalQuantity
        this.totalOrders = data.totalOrders

        // 图表数据
        this.trendData = data.trendData
        this.revenueByIp = data.revenueByIp

        // 底部订单明细
        this.orderList = data.orderList
      } catch (error) {
        // 这里你也可以用 ElMessage 做提示
        console.error('获取 Dashboard 数据失败:', error)
      } finally {
        this.loading = false
      }
    },
  },
})
