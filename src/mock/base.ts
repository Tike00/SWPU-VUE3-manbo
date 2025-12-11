// src/mock/base.ts
import Mock from 'mockjs'

// --- 基础字典 ---
export const ipList = ['曼波', '耄耋', '哈基米文化', '原创角色']
export const categoryList = ['PVC景品', 'GK树脂', '盒蛋盲盒', '桌面摆件', '周边配件']
export const scaleList = ['1/7', '1/6', '1/4', 'Q版', '无比例']

// --- 初始名字列表 ---
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

// 产品身份信息（不含价格）
export interface ProductIdentity {
  id: number
  name: string
  ip: string
  category: string
  scale: string
  status: boolean
}

export const dataList: ProductIdentity[] = figureNameList.map((name, index) => ({
  id: 1001 + index,
  name,
  ip: ipList[index % ipList.length],
  category: categoryList[index % categoryList.length],
  scale: scaleList[index % scaleList.length],
  status: true,
}))

// --- 订单基础结构 ---
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

// 生成一批模拟订单
export let orderList: MockOrder[] = Mock.mock({
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

// 计算 subtotal & totalAmount
orderList = orderList.map((order) => {
  order.items = order.items.map((item) => ({
    ...item,
    subtotal: item.price * item.quantity,
  }))
  order.totalAmount = order.items.reduce((sum, item) => sum + item.subtotal, 0)
  return order
})
