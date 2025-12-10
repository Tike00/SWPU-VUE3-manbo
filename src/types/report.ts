// src/types/report.ts

// 单条订单明细：用于 /api/figure/orders
export interface FigureOrder {
  id: string
  date: string // 格式：YYYY-MM-DD
  productName: string
  ip: string // 曼波 / 耄耋 / 哈基米文化 / 原创角色
  category: string // PVC景品 / GK树脂 / 盒蛋盲盒 ...
  scale: string // 1/7 / 1/4 / Q版 ...
  quantity: number // 销量（件）
  revenue: number // 销售额（元）
}

// 产品营收：用于 /api/revenue
export interface ProductRevenue {
  productName: string
  ip: string
  category: string
  scale: string
  quantity: number
  revenue: number
  profitRate: number // 毛利率（百分比）
}

// 产品基础信息：用于 /api/products
export interface ProductItem {
  id: number
  name: string
  ip: string
  category: string
  scale: string
  price: number
}
