<!-- src/views/order/OrderDetail.vue -->
<template>
  <div class="order-detail-page" v-loading="loading">
    <el-page-header @back="goBack" content="订单详情" class="mb-16" />

    <el-card shadow="never" class="mb-16">
      <template #header>
        <div class="card-header">
          <div>
            <span class="order-no">订单号：{{ order?.orderNo }}</span>
            <el-tag
              v-if="order"
              :type="statusTagType(order.status)"
              size="small"
              class="status-tag"
            >
              {{ statusLabel(order.status) }}
            </el-tag>
          </div>
          <div class="created-at" v-if="order">
            下单时间：{{ order.createdAt }}
          </div>
        </div>
      </template>

      <el-descriptions
        v-if="order"
        :column="3"
        border
        size="small"
      >
        <el-descriptions-item label="客户姓名">
          {{ order.customerName }}
        </el-descriptions-item>
        <el-descriptions-item label="手机号">
          {{ order.phone }}
        </el-descriptions-item>
        <el-descriptions-item label="支付方式">
          {{ payMethodLabel(order.payMethod) }}
        </el-descriptions-item>

        <el-descriptions-item label="收货地址" :span="3">
          {{ order.address }}
        </el-descriptions-item>

        <el-descriptions-item label="备注" :span="3">
          {{ order.remark || '—' }}
        </el-descriptions-item>
      </el-descriptions>

      <div v-else class="empty-tip">
        暂无订单数据
      </div>
    </el-card>

    <!-- 商品明细 -->
    <el-card shadow="never" class="mb-16">
      <template #header>
        <div class="card-header">
          <span>商品明细</span>
        </div>
      </template>

      <el-table
        v-if="order"
        :data="order.items"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="productName" label="商品名称" min-width="260" show-overflow-tooltip />
        <el-table-column prop="ip" label="IP" width="120" />
        <el-table-column prop="category" label="品类" width="120" />
        <el-table-column prop="scale" label="比例" width="80" align="center" />
        <el-table-column prop="price" label="单价" width="100" align="right">
          <template #default="{ row }">
            ¥ {{ row.price.toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column prop="quantity" label="数量" width="80" align="center" />
        <el-table-column prop="subtotal" label="小计" width="120" align="right">
          <template #default="{ row }">
            <span class="amount">¥ {{ row.subtotal.toLocaleString() }}</span>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 底部操作与汇总 -->
    <el-card shadow="never">
      <div class="footer">
        <div class="left">
          <el-button
            v-for="s in statusOptions"
            :key="s.value"
            size="small"
            :type="order?.status === s.value ? 'primary' : 'default'"
            @click="changeStatus(s.value)"
          >
            {{ s.label }}
          </el-button>
        </div>

        <div class="right" v-if="order">
          <div class="total-line">
            <span>订单金额：</span>
            <span class="amount-lg">¥ {{ order.totalAmount.toLocaleString() }}</span>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'

// 类型与 MockOrder 对齐
type OrderStatus = 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled'
type PayMethod = 'alipay' | 'wechat' | 'card' | 'cash'

interface OrderItem {
  id: string
  productName: string
  ip: string
  category: string
  scale: string
  price: number
  quantity: number
  subtotal: number
}

interface OrderDetail {
  id: number
  orderNo: string
  customerName: string
  phone: string
  address: string
  status: OrderStatus
  payMethod: PayMethod
  createdAt: string
  remark: string
  totalAmount: number
  items: OrderItem[]
}

interface OrderDetailResp {
  code: number
  data?: OrderDetail
  message?: string
}

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const order = ref<OrderDetail | null>(null)

const id = computed(() => route.query.id as string | undefined)

const statusOptions = [
  { value: 'pending', label: '待支付' },
  { value: 'paid', label: '已支付' },
  { value: 'shipped', label: '已发货' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
]

// 返回
const goBack = () => {
  router.back()
}

const statusLabel = (status: OrderStatus): string => {
  const map: Record<OrderStatus, string> = {
    pending: '待支付',
    paid: '已支付',
    shipped: '已发货',
    completed: '已完成',
    cancelled: '已取消',
  }
  return map[status] || status
}

const statusTagType = (status: OrderStatus) => {
  switch (status) {
    case 'pending':
      return 'warning'
    case 'paid':
      return 'success'
    case 'shipped':
      return 'info'
    case 'completed':
      return 'success'
    case 'cancelled':
      return 'danger'
    default:
      return ''
  }
}

const payMethodLabel = (pm: PayMethod) => {
  const map: Record<PayMethod, string> = {
    alipay: '支付宝',
    wechat: '微信',
    card: '银行卡',
    cash: '现金',
  }
  return map[pm] || pm
}

// 加载详情
const fetchDetail = async () => {
  if (!id.value) {
    ElMessage.error('缺少订单 ID')
    return
  }

  loading.value = true
  try {
    const resp = await axios.get<OrderDetailResp>('/api/orders/detail', {
      params: { id: id.value },
    })

    if (resp.data.code === 200 && resp.data.data) {
      order.value = resp.data.data
    } else {
      ElMessage.error(resp.data.message || '订单不存在')
    }
  } catch (error) {
    console.error('加载订单详情失败', error)
    ElMessage.error('加载订单详情失败')
  } finally {
    loading.value = false
  }
}

// 修改订单状态（复用 /api/orders/updateStatus）
const changeStatus = async (newStatus: string) => {
  if (!order.value) return
  if (order.value.status === newStatus) return

  try {
    const resp = await axios.post('/api/orders/updateStatus', {
      id: order.value.id,
      status: newStatus,
    })

    if (resp.data.code === 200) {
      ElMessage.success('订单状态更新成功（Mock）')
      // 本地刷新
      order.value.status = newStatus as OrderStatus
    } else {
      ElMessage.error(resp.data.message || '订单状态更新失败')
    }
  } catch (error) {
    console.error('更新状态失败', error)
    ElMessage.error('订单状态更新失败')
  }
}

onMounted(() => {
  fetchDetail()
})
</script>

<style scoped lang="scss">
.order-detail-page {
  padding: 20px;
  background: #f5f7fa;
}

.mb-16 {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .order-no {
    font-weight: 600;
    margin-right: 8px;
  }

  .status-tag {
    vertical-align: middle;
  }

  .created-at {
    font-size: 12px;
    color: #909399;
  }
}

.empty-tip {
  padding: 20px;
  text-align: center;
  color: #909399;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.left {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.right {
  .total-line {
    font-size: 14px;
    span:first-child {
      color: #606266;
      margin-right: 8px;
    }
  }

  .amount-lg {
    color: #f56c6c;
    font-size: 20px;
    font-weight: 700;
  }
}

.amount {
  color: #f56c6c;
  font-weight: 600;
}
</style>
