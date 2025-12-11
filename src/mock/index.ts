// src/mock/index.js
import Mock from 'mockjs'

// 1. --- 基础字典 ---
const ipList = ['曼波', '耄耋', '哈基米文化', '原创角色']
const categoryList = ['PVC景品', 'GK树脂', '盒蛋盲盒', '桌面摆件', '周边配件']
const scaleList = ['1/7', '1/6', '1/4', 'Q版', '无比例']

// 2. --- 初始名字列表 ---
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

// 🔥🔥🔥 核心：只存“身份信息”，不锁死价格 🔥🔥🔥
// 这个数组记录了当前有哪些手办，以及它们属于哪个系列
const dataList = figureNameList.map((name, index) => ({
  id: 1001 + index,
  name: name,
  ip: ipList[index % ipList.length],
  category: categoryList[index % categoryList.length],
  scale: scaleList[index % scaleList.length],
  status: true,
  // 注意：这里我不存 price，因为 price 每次都要变
}))

// --- 接口 1：配置项 ---
Mock.mock('/api/config/options', 'get', {
  code: 200,
  msg: 'success',
  data: { ipList, categoryList, scaleList },
})

// --- 接口 2：获取列表 (实时随机价格) ---
Mock.mock('/api/products', 'get', () => {
  // 🔥 关键操作：遍历内存里的列表，给每一项临时生成一个随机价格
  // 这样既保留了你新增的数据，又让价格每次刷新都不一样
  const dynamicList = dataList.map((item) => {
    return {
      ...item, // 保留 ID, Name, IP, Category
      price: Mock.Random.integer(199, 5000), // 🎲 每次请求都重新随机
      stock: Mock.Random.integer(0, 100), // 🎲 库存也跟着变
    }
  })

  return {
    code: 200,
    msg: '获取成功',
    data: dynamicList,
  }
})

// --- 接口 3：新增产品 ---
Mock.mock('/api/inventory/add', 'post', (options) => {
  const body = JSON.parse(options.body)

  // 1. 只把“身份信息”存入内存数组
  const newItem = {
    id: dataList.length + 1001,
    name: body.name,
    ip: body.ip, // ✅ 保留你选的 IP
    category: body.category, // ✅ 保留你选的品类
    scale: body.scale || '无比例',
    status: true,
  }

  // 2. 插入到最前面
  dataList.unshift(newItem)

  // 3. 返回给前端时，随便给个价格让它不报错
  return {
    code: 200,
    msg: '添加成功',
    data: { ...newItem, price: Mock.Random.integer(199, 5000) },
  }
})

// --- 接口 4：图表 ---
Mock.mock('/api/figure/orders', 'get', {
  code: 200,
  'list|7': ['@integer(10, 100)'],
})

console.log('%c Mock Ready: 列表已保留新增项，且价格实时刷新', 'color: #f56c6c; font-weight: bold')
// ======================= 订单管理：列表 / 详情 / 状态更新 =======================

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

// 生成一批模拟订单数据（用你上面的 ipList / categoryList / figureNameList）
let orderList: MockOrder[] = Mock.mock({
  'list|30-60': [
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

// 计算每个订单的 subtotal 和 totalAmount
orderList = orderList.map((order) => {
  order.items = order.items.map((item) => ({
    ...item,
    subtotal: item.price * item.quantity,
  }))
  order.totalAmount = order.items.reduce((sum, item) => sum + item.subtotal, 0)
  return order
})

// 简单的查询参数解析工具
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

// 列表接口：支持分页 + 状态筛选 + 关键词 + 时间区间
Mock.mock(/\/api\/orders(\?.*)?$/, 'get', (options: any) => {
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

// 详情接口：通过 id 精确查找
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

// 状态更新接口
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
