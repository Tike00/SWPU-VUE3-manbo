// src/mock/index.ts
import Mock from 'mockjs'

// ======================= 基础字典 & 产品身份信息 =======================

export const ipList = ['曼波', '耄耋', '哈基米文化', '原创角色']
export const categoryList = ['PVC景品', 'GK树脂', '盒蛋盲盒', '桌面摆件', '周边配件']
export const scaleList = ['1/7', '1/6', '1/4', 'Q版', '无比例']

export const figureNameList = [
  '曼波系列 诗歌剧·曼波 1/7 PVC手办',
  '曼波系列 Q版曼波 景品手办',
  '曼波系列 曼波·舞台Ver. GK雕像',
  '耄耋系列 圆头耄耋 桌面摆件',
  '耄耋系列 耄耋·南北绿豆 联名场景手办',
  '耄耋系列 耄耋·沙发躺平款 1/4 手办',
  '哈基米文化 哈基猫 蜂蜜水限定 GK雕像',
  '哈基米文化 哈基米世界 城市夜景 diorama',
  '哈基米文化 哈基基米 双人组 盒蛋套装',
  '曼波 × 哈基米 曼波哈基米 联动款桌面宠物',
  '曼波 × 耄耋 曼波耄耋 联名场景手办',
  '原创角色 AI 桌宠 曼波哈基米 电子宠物公仔',
]

// 只存“身份信息”，不锁死价格
export const dataList = figureNameList.map((name, index) => ({
  id: 1001 + index,
  name,
  ip: ipList[index % ipList.length],
  category: categoryList[index % categoryList.length],
  scale: scaleList[index % scaleList.length],
  status: true,
}))

// ======================= Config & 产品列表 =======================

Mock.mock('/api/config/options', 'get', {
  code: 200,
  msg: 'success',
  data: { ipList, categoryList, scaleList },
})

Mock.mock('/api/products', 'get', () => {
  const dynamicList = dataList.map((item) => {
    return {
      ...item,
      price: Mock.Random.integer(199, 5000),
      stock: Mock.Random.integer(0, 100),
    }
  })

  return {
    code: 200,
    msg: '获取成功',
    data: dynamicList,
  }
})

Mock.mock('/api/inventory/add', 'post', (options: { body?: string }) => {
  const body = options.body ? JSON.parse(options.body) : {}

  const newItem = {
    id: dataList.length + 1001,
    name: body.name,
    ip: body.ip,
    category: body.category,
    scale: body.scale || '无比例',
    status: true,
  }

  dataList.unshift(newItem)

  return {
    code: 200,
    msg: '添加成功',
    data: { ...newItem, price: Mock.Random.integer(199, 5000) },
  }
})

// 保留原来的简单图表（如不需要可删）
Mock.mock('/api/figure/orders', 'get', {
  code: 200,
  'list|7': ['@integer(10, 100)'],
})

// ======================= 订单管理：列表 / 详情 / 状态 =======================

export interface MockOrderItem {
  id: string
  productName: string
  ip: string
  category: string
  scale: string
  price: number
  quantity: number
  subtotal: number
}

export interface MockOrder {
  id: number
  orderNo: string
  customerName: string
  phone: string
  address: string
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled'
  payMethod: 'alipay' | 'wechat' | 'card' | 'cash'
  createdAt: string
  remark: string
  totalAmount: number
  items: MockOrderItem[]
}

interface MockRequestOptions {
  url: string
  type: string
  body?: string
}

// 生成一批订单
let orderList: MockOrder[] = Mock.mock({
  'list|40-80': [
    {
      'id|+1': 1,
      orderNo: '@guid()',
      customerName: '@cname()',
      phone: /^1[3-9]\d{9}$/,
      address: '@city(true) @county() 详细地址@integer(1,200)号',
      'status|1': ['pending', 'paid', 'shipped', 'completed', 'cancelled'],
      'payMethod|1': ['alipay', 'wechat', 'card', 'cash'],
      createdAt: '@datetime("2025-MM-dd HH:mm:ss")',
      remark: '@csentence(6, 18)',
      items: [
        {
          id: '@id',
          'productName|1': figureNameList,
          'ip|1': ipList,
          'category|1': categoryList,
          'scale|1': scaleList,
          'price|99-1999': 1,
          'quantity|1-3': 1,
          subtotal: 0,
        },
        {
          id: '@id',
          'productName|1': figureNameList,
          'ip|1': ipList,
          'category|1': categoryList,
          'scale|1': scaleList,
          'price|99-1999': 1,
          'quantity|1-3': 1,
          subtotal: 0,
        },
      ],
      totalAmount: 0,
    },
  ],
}).list

// 计算 subtotal / totalAmount
orderList = orderList.map((order) => {
  order.items = order.items.map((item) => ({
    ...item,
    subtotal: item.price * item.quantity,
  }))
  order.totalAmount = order.items.reduce((sum, item) => sum + item.subtotal, 0)
  return order
})

// 简单的查询参数解析
const parseQuery = (url: string) => {
  const queryIndex = url.indexOf('?')
  if (queryIndex === -1) return {}
  const search = url.slice(queryIndex)
  const u = new URL(search, 'http://dummy.base')
  const params: Record<string, string> = {}
  u.searchParams.forEach((v, k) => {
    params[k] = v
  })
  return params
}

// 列表接口：分页 + 状态 + 关键词 + 时间区间
Mock.mock(/\/api\/orders(\?.*)?$/, 'get', (options: MockRequestOptions) => {
  const params = parseQuery(options.url || '')

  const page = Number(params.page || 1)
  const pageSize = Number(params.pageSize || 10)
  const keyword = (params.keyword || '').trim()
  const status = (params.status || '').trim()
  const startDate = params.startDate
  const endDate = params.endDate

  let filtered = orderList.slice()

  if (keyword) {
    filtered = filtered.filter((o) => {
      return (
        o.orderNo.includes(keyword) ||
        o.customerName.includes(keyword) ||
        o.phone.includes(keyword)
      )
    })
  }

  if (status) {
    filtered = filtered.filter((o) => o.status === status)
  }

  if (startDate && endDate) {
    filtered = filtered.filter((o) => {
      const d = o.createdAt.slice(0, 10)
      return d >= startDate && d <= endDate
    })
  }

  const total = filtered.length
  const start = (page - 1) * pageSize
  const end = start + pageSize
  const list = filtered.slice(start, end)

  return {
    code: 200,
    data: {
      list,
      total,
    },
  }
})

Mock.mock(/\/api\/orders\/detail(\?.*)?$/, 'get', (options: MockRequestOptions) => {
  console.log('[mock detail] options.url =', options.url)

  const params = parseQuery(options.url || '')
  console.log('[mock detail] parsed params =', params)

  const idStr = params.id
  const idNum = Number(idStr)
  console.log('[mock detail] idStr =', idStr, 'idNum =', idNum)

  // 看看当前 orderList 里到底有哪些 id
  console.log(
    '[mock detail] orderList ids sample =',
    orderList.slice(0, 10).map((o) => o.id),
  )

  if (!idStr || Number.isNaN(idNum)) {
    return {
      code: 404,
      message: `订单不存在（没有有效 id）`,
    }
  }

  const order = orderList.find((o) => o.id === idNum)

  if (!order) {
    return {
      code: 404,
      message: `订单不存在（id=${idNum}）`,
    }
  }

  return {
    code: 200,
    data: order,
  }
})

Mock.mock('/api/orders/updateStatus', 'post', (options: MockRequestOptions) => {
  const body = options.body ? JSON.parse(options.body) : {}
  const { id, status } = body
  const order = orderList.find((o) => String(o.id) === String(id))

  if (!order) {
    return {
      code: 404,
      message: '订单不存在',
    }
  }

  order.status = status

  return {
    code: 200,
    message: '订单状态已更新（Mock）',
    data: order,
  }
})

// ======================= 报表专用 Mock =======================

interface DailySummary {
  orderCount: number
  revenue: number
  avgOrderValue: number
}

interface ProductStatsRow {
  productName: string
  ip: string
  category: string
  scale: string
  quantity: number
  revenue: number
  avgPrice: number
}

interface Trend7D {
  dates: string[]
  orders: number[]
  revenues: number[]
}

// 按订单聚合产品维度销售数据
const buildProductStatsFromOrders = (orders: MockOrder[]): ProductStatsRow[] => {
  const map = new Map<string, ProductStatsRow>()

  orders.forEach((order) => {
    order.items.forEach((item) => {
      const key = item.productName
      const revenue = item.subtotal ?? item.price * item.quantity
      const existed = map.get(key)
      if (existed) {
        existed.quantity += item.quantity
        existed.revenue += revenue
        existed.avgPrice = existed.revenue / existed.quantity
      } else {
        map.set(key, {
          productName: item.productName,
          ip: item.ip,
          category: item.category,
          scale: item.scale,
          quantity: item.quantity,
          revenue,
          avgPrice: revenue / item.quantity,
        })
      }
    })
  })

  return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue)
}

const buildDailySummaryFromOrders = (orders: MockOrder[]): DailySummary => {
  const orderCount = orders.length
  const revenue = orders.reduce((sum, o) => sum + o.totalAmount, 0)
  const avgOrderValue = orderCount > 0 ? revenue / orderCount : 0
  return { orderCount, revenue, avgOrderValue }
}

// 近 7 天趋势（这里用随机数据，结构稳定）
const buildTrend7D = (): Trend7D => {
  const dates: string[] = []
  const orders: number[] = []
  const revenues: number[] = []

  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const label = `${d.getMonth() + 1}-${String(d.getDate()).padStart(2, '0')}`
    dates.push(label)
    const orderCount = Mock.Random.integer(10, 120)
    const revenue = Mock.Random.integer(3000, 30000)
    orders.push(orderCount)
    revenues.push(revenue)
  }

  return { dates, orders, revenues }
}

// --- 日报：摘要 + 产品明细 + 近 7 天趋势 ---
// GET /api/report/daily?date=2025-12-11
Mock.mock(/\/api\/report\/daily(\?.*)?$/, 'get', (_: MockRequestOptions) => {
  // 为了让前端始终有数据看，这里不按日期过滤，直接用全部订单聚合
  const orders = orderList

  const summary = buildDailySummaryFromOrders(orders)
  const products = buildProductStatsFromOrders(orders)
  const trend7d = buildTrend7D()

  return {
    code: 200,
    data: {
      summary,
      products,
      trend7d,
    },
  }
})

// --- 月报：按日聚合趋势 ---
// GET /api/report/monthly?year=2025&month=12
Mock.mock(/\/api\/report\/monthly(\?.*)?$/, 'get', (options: MockRequestOptions) => {
  const params = parseQuery(options.url || '')
  const year = Number(params.year || '2025')
  const month = Number(params.month || '12')
  const daysInMonth = new Date(year, month, 0).getDate()

  const days: number[] = []
  const orders: number[] = []
  const revenues: number[] = []

  for (let d = 1; d <= daysInMonth; d++) {
    days.push(d)
    orders.push(Mock.Random.integer(5, 100))
    revenues.push(Mock.Random.integer(2000, 50000))
  }

  const totalOrders = orders.reduce((s, v) => s + v, 0)
  const totalRevenue = revenues.reduce((s, v) => s + v, 0)
  const avgDailyRevenue = totalRevenue / daysInMonth

  return {
    code: 200,
    data: {
      summary: {
        orderCount: totalOrders,
        revenue: totalRevenue,
        avgDailyRevenue,
      },
      days,
      orders,
      revenues,
    },
  }
})

// --- 季报：四个季度聚合 ---
// GET /api/report/quarterly?year=2025
Mock.mock(/\/api\/report\/quarterly(\?.*)?$/, 'get', (_: MockRequestOptions) => {
  const quarters = [1, 2, 3, 4].map((q) => ({
    quarter: q,
    orderCount: Mock.Random.integer(80, 500),
    revenue: Mock.Random.integer(50000, 300000),
  }))

  return {
    code: 200,
    data: {
      quarters,
    },
  }
})

// --- 年报：按月聚合 ---
// GET /api/report/annual?year=2025
Mock.mock(/\/api\/report\/annual(\?.*)?$/, 'get', (_: MockRequestOptions) => {
  const months: number[] = []
  const orders: number[] = []
  const revenues: number[] = []

  for (let m = 1; m <= 12; m++) {
    months.push(m)
    orders.push(Mock.Random.integer(80, 500))
    revenues.push(Mock.Random.integer(50000, 300000))
  }

  const totalOrders = orders.reduce((s, v) => s + v, 0)
  const totalRevenue = revenues.reduce((s, v) => s + v, 0)
  const avgMonthlyRevenue = totalRevenue / 12

  return {
    code: 200,
    data: {
      summary: {
        orderCount: totalOrders,
        revenue: totalRevenue,
        avgMonthlyRevenue,
      },
      months,
      orders,
      revenues,
    },
  }
})

// ======================= 首页 Dashboard Mock =======================

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

interface DashboardOverviewResp {
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

// 1. 总营收 / 总件数 / 总订单（直接用上面的 orderList）
const buildDashboardTotalsFromOrders = (orders: MockOrder[]) => {
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0)

  const totalQuantity = orders.reduce((sum, o) => {
    return sum + o.items.reduce((s, item) => s + item.quantity, 0)
  }, 0)

  const totalOrders = orders.length

  return { totalRevenue, totalQuantity, totalOrders }
}

// 2. 近 7 天趋势：按 createdAt 日期聚合 totalAmount
const buildDashboardTrendDataFromOrders = (orders: MockOrder[]): DashboardTrendData => {
  const map = new Map<string, number>()

  // 准备近 7 天 key
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().slice(0, 10) // yyyy-MM-dd
    map.set(dateStr, 0)
  }

  // 聚合订单金额
  orders.forEach((order) => {
    const day = order.createdAt.slice(0, 10)
    if (map.has(day)) {
      map.set(day, (map.get(day) || 0) + order.totalAmount)
    }
  })

  const dates: string[] = []
  const values: number[] = []

  Array.from(map.entries())
    .sort(([d1], [d2]) => (d1 > d2 ? 1 : -1))
    .forEach(([d, v]) => {
      dates.push(d.slice(5)) // 显示 MM-dd
      values.push(v)
    })

  return { dates, values }
}

// 3. IP 营收占比：从订单明细 items 聚合
const buildRevenueByIpFromOrders = (orders: MockOrder[]): RevenueByIp[] => {
  const map = new Map<string, number>()

  orders.forEach((order) => {
    order.items.forEach((item) => {
      const ip = item.ip || '未知IP'
      const revenue = item.subtotal ?? item.price * item.quantity
      map.set(ip, (map.get(ip) || 0) + revenue)
    })
  })

  return Array.from(map.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
}

// 4. 首页表格用：扁平化订单 items
const buildDashboardOrderRowsFromOrders = (orders: MockOrder[]): DashboardOrderRow[] => {
  const rows: DashboardOrderRow[] = []

  orders.forEach((order) => {
    const date = order.createdAt.slice(0, 10)
    order.items.forEach((item) => {
      const revenue = item.subtotal ?? item.price * item.quantity
      rows.push({
        date,
        productName: item.productName,
        ip: item.ip,
        category: item.category,
        scale: item.scale,
        quantity: item.quantity,
        revenue,
      })
    })
  })

  // 按日期倒序，取前 50 条左右即可
  return rows
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 50)
}

// 5. 注册首页接口（Home.vue / dashboard store 调用的就是这个）
Mock.mock(/\/api\/dashboard\/overview(\?.*)?$/, 'get', (): DashboardOverviewResp => {
  // 直接复用上面订单 Mock 生成的 orderList
  const totals = buildDashboardTotalsFromOrders(orderList)
  const trendData = buildDashboardTrendDataFromOrders(orderList)
  const revenueByIp = buildRevenueByIpFromOrders(orderList)
  const rows = buildDashboardOrderRowsFromOrders(orderList)

  return {
    code: 200,
    data: {
      totalRevenue: totals.totalRevenue,
      totalQuantity: totals.totalQuantity,
      totalOrders: totals.totalOrders,
      trendData,
      revenueByIp,
      orderList: rows,
    },
  }
})
console.log(
  '%c Mock Ready: 列表 / 报表 Mock 已加载',
  'color: #f56c6c; font-weight: bold',
)
