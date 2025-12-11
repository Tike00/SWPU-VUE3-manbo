// src/mock/product.ts
import Mock from 'mockjs'

/**
 * 和页面中定义保持一致的类型
 */
interface Product {
  id: number
  name: string
  ip: string
  category: string
  scale: string
  status: boolean
  price?: number
  stock?: number
}

interface ConfigOptions {
  ipList: string[]
  categoryList: string[]
  scaleList: string[]
}

interface MockRequestOptions {
  url: string
  type: string
  body?: string
}

/**
 * 1. 基础字典（和你现在的一模一样）
 */
const ipList = ['曼波', '耄耋', '哈基米文化', '原创角色']
const categoryList = ['PVC景品', 'GK树脂', '盒蛋盲盒', '桌面摆件', '周边配件']
const scaleList = ['1/7', '1/6', '1/4', 'Q版', '无比例']

/**
 * 2. 初始产品身份列表（不锁死价格，只存“身份信息”）
 */
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

// 只存身份信息的“产品底表”
const productIdentityList: Product[] = figureNameList.map((name, index) => ({
  id: 1001 + index,
  name,
  ip: ipList[index % ipList.length],
  category: categoryList[index % categoryList.length],
  scale: scaleList[index % scaleList.length],
  status: true,
  // price / stock 不在这里固定，每次 /api/products 再动态生成
}))

/**
 * 3. /api/config/options
 *    InventoryAdd.vue 用来渲染下拉选项
 */
Mock.mock('/api/config/options', 'get', (): { code: number; msg: string; data: ConfigOptions } => {
  return {
    code: 200,
    msg: 'success',
    data: {
      ipList,
      categoryList,
      scaleList,
    },
  }
})

/**
 * 4. /api/products
 *    InventoryAdd.vue 的 loadProducts 调用这里：
 *    - 用于展示右侧推荐产品列表
 *    - 用于 el-select 的选择项
 *    每次请求都给 productIdentityList 临时生成随机 price / stock
 */
Mock.mock('/api/products', 'get', () => {
  const dynamicList: Product[] = productIdentityList.map((item) => {
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

/**
 * 5. /api/inventory/add
 *    InventoryAdd.vue 在 submit 时调用：
 *
 *    await axios.post("/api/inventory/add", {
 *      name: form.productName,
 *      ip: form.ip,
 *      category: form.category,
 *      scale: form.scale
 *    });
 *
 *    前端其实没有用返回值，只是当成“告诉后端有个新产品被录入了”。
 *    我们这里：
 *      - 把新的身份信息写入 productIdentityList
 *      - 返回一个带随机 price 的新产品对象，便于以后其它页面复用
 */
Mock.mock('/api/inventory/add', 'post', (options: MockRequestOptions) => {
  const body = options.body ? JSON.parse(options.body) : {}

  const newId = productIdentityList.length
    ? productIdentityList[0].id + 1
    : 1001

  const newIdentity: Product = {
    id: newId,
    name: body.name,
    ip: body.ip,
    category: body.category,
    scale: body.scale || '无比例',
    status: true,
  }

  // 插入到“身份表”最前面，后续 /api/products 时就会带出来
  productIdentityList.unshift(newIdentity)

  // 返回一个带随机价格的结果，方便你以后在别的页面用
  const responseData: Product = {
    ...newIdentity,
    price: Mock.Random.integer(199, 5000),
    stock: Mock.Random.integer(0, 100),
  }

  return {
    code: 200,
    msg: '添加成功',
    data: responseData,
  }
})
