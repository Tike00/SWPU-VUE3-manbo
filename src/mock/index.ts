// src/mock/figureMock.ts
import Mock from 'mockjs'

// --- IP / 品牌 / 分类列表 ---
const ipList = ['曼波', '耄耋', '哈基米文化', '原创角色']
const categoryList = ['PVC景品', 'GK树脂', '盒蛋盲盒', '桌面摆件', '周边配件']

// --- 固定的“手办产品名称列表”（可以按需继续加） ---
const figureNameList = [
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

// -------- 1）产品收入统计（手办版） --------
// 用于“产品营收”页面等，偏整体统计，不带日期
Mock.mock('/api/revenue', 'get', () => {
  return Mock.mock({
    'list|6-10': [
      {
        'productName|1': figureNameList, // 产品名称（手办名）
        'ip|1': ipList, // 所属 IP：曼波 / 耄耋 / 哈基米文化 / 原创
        'category|1': categoryList, // 品类：PVC景品 / GK树脂等
        'scale|1': ['1/7', '1/6', '1/4', 'Q版'],
        'quantity|50-500': 1, // 销量（件）
        'revenue|5000-80000': 1, // 销售额（元）
        'profitRate|35-65': 1, // 毛利率（%）
      },
    ],
  }).list
})

// -------- 2）报表用的“原始订单明细”（带日期） --------
// 日报 / 月报 / 季报 / 年报，都建议从这里取数据，再在前端做汇总
Mock.mock('/api/figure/orders', 'get', () => {
  return Mock.mock({
    'list|80-120': [
      {
        id: '@id',
        // 随机一个日期，格式 yyyy-MM-dd，你后面可以在前端按日 / 月 / 季度分组
        date: '@date("2025-MM-dd")',
        'productName|1': figureNameList,
        'ip|1': ipList,
        'category|1': categoryList,
        'scale|1': ['1/7', '1/6', '1/4', 'Q版'],
        'quantity|1-80': 1,
        'revenue|100-3000': 1,
      },
    ],
  }).list
})

// -------- 3）产品列表（配合“产品列表 / 添加库存”等页面） --------
Mock.mock('/api/products', 'get', () => {
  // 这里不用 Mock.mock，直接 map 出一份固定的列表就行
  return figureNameList.map((name, index) => ({
    id: index + 1,
    name, // 产品名称
    ip: ipList[index % ipList.length], // 简单轮流分配 IP
    category: categoryList[index % categoryList.length],
    scale: ['1/7', '1/6', '1/4', 'Q版'][index % 4],
    price: Mock.Random.integer(199, 2999), // 随机一个单价
  }))
})

// -------- 4）新增库存接口（文案改成手办相关） --------
Mock.mock('/api/inventory/add', 'post', () => {
  return {
    code: 200,
    message: '手办库存新增成功（Mock）',
  }
})

console.log(
  '%c 手办 Mock 数据已启动（曼波 / 耄耋 / 哈基米文化版）',
  'color: #42b983; font-weight: bold;',
)
// -------- 5）订单管理：列表 / 详情 / 状态更新 --------

// 生成一批模拟订单数据
interface MockOrderItem {
  id: string
  productName: string
  ip: string
  category: string
  scale: string
  price: number
  quantity: number
  subtotal: number
}

interface MockOrder {
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

// 用 Mock 生成订单列表
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
          'scale|1': ['1/7', '1/6', '1/4', 'Q版'],
          'price|99-1999': 1,
          'quantity|1-3': 1,
          subtotal: 0,
        },
        {
          id: '@id',
          'productName|1': figureNameList,
          'ip|1': ipList,
          'category|1': categoryList,
          'scale|1': ['1/7', '1/6', '1/4', 'Q版'],
          'price|99-1999': 1,
          'quantity|1-3': 1,
          subtotal: 0,
        },
      ],
      totalAmount: 0,
    },
  ],
}).list

// 补充小计和总金额
orderList = orderList.map((order) => {
  order.items = order.items.map((item) => ({
    ...item,
    subtotal: item.price * item.quantity,
  }))
  order.totalAmount = order.items.reduce((sum, item) => sum + item.subtotal, 0)
  return order
})

// 工具函数：解析 URL 查询参数
const parseQuery = (url: string) => {
  const queryIndex = url.indexOf('?')
  if (queryIndex === -1) return {}
  const search = url.slice(queryIndex)
  const u = new URL(search, 'http://dummy.base') // 基础域名随便写
  const params: Record<string, string> = {}
  u.searchParams.forEach((v, k) => {
    params[k] = v
  })
  return params
}

// 列表接口：支持分页 + 状态筛选 + 关键词 + 下单日期范围
Mock.mock(/\/api\/orders(\?.*)?$/, 'get', (options: any) => {
  const params = parseQuery(options.url || '')

  const page = Number(params.page || 1)
  const pageSize = Number(params.pageSize || 10)
  const keyword = (params.keyword || '').trim()
  const status = (params.status || '').trim()
  const startDate = params.startDate
  const endDate = params.endDate

  // 过滤
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
      const d = o.createdAt.slice(0, 10) // 只比较日期部分
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

// 详情接口：通过 id 查询
Mock.mock('/api/orders/detail', 'get', (options: any) => {
  const params = parseQuery(options.url || '')
  const id = params.id
  const order = orderList.find((o) => String(o.id) === String(id))

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

// 更新状态接口
Mock.mock('/api/orders/updateStatus', 'post', (options: any) => {
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
