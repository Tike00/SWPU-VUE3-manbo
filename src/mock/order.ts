// src/mock/order.ts
import Mock from 'mockjs'
import { orderList, MockOrder } from './base'
import { MockRequestOptions, parseQuery } from './utils'

// 拷一份引用，可变数组
let innerOrderList: MockOrder[] = orderList

// 列表：分页 + 状态 + 关键词 + 时间区间
Mock.mock(/\/api\/orders(\?.*)?$/, 'get', (options: MockRequestOptions) => {
  const params = parseQuery(options.url || '')

  const page = Number(params.page || 1)
  const pageSize = Number(params.pageSize || 10)
  const keyword = (params.keyword || '').trim()
  const status = (params.status || '').trim()
  const startDate = params.startDate
  const endDate = params.endDate

  let filtered = innerOrderList.slice()

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

// 详情
Mock.mock(/\/api\/orders\/detail(\?.*)?$/, 'get', (options: MockRequestOptions) => {
  const params = parseQuery(options.url || '')
  const id = params.id
  const order = innerOrderList.find((o) => String(o.id) === String(id))

  if (!order) {
    return {
      code: 404,
      message: '订单不存在',
    }
  }

  return {
    code: 200,
    data: order,
  }
})

// 状态更新
Mock.mock('/api/orders/updateStatus', 'post', (options: MockRequestOptions) => {
  const body = options.body ? JSON.parse(options.body) : {}
  const { id, status } = body as { id: number; status: MockOrder['status'] }
  const order = innerOrderList.find((o) => String(o.id) === String(id))

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
