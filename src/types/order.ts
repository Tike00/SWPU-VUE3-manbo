// src/types/order.ts

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled'

export type PayMethod = 'alipay' | 'wechat' | 'card' | 'cash' | 'bank'

export interface OrderItem {
  id: string
  productName: string
  ip: string
  category: string
  scale: string
  price: number      // 单价
  quantity: number   // 数量
  subtotal: number   // 小计
}

export interface Order {
  id: string | number
  orderNo: string
  customerName: string
  phone: string
  address: string
  status: OrderStatus
  payMethod: PayMethod
  createdAt: string      // 下单时间：2025-01-01 12:00:00
  remark?: string
  totalAmount: number
  items: OrderItem[]
}
