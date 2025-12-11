<template>
  <div class="page">
    <el-card class="card" v-loading="loading">
      <div class="header">
        <div class="title-block">
          <h2>订单详情</h2>
          <span class="subtitle">
            {{ order ? `订单号：${order.orderNo}` : '请选择一条订单查看详情' }}
          </span>
        </div>

        <div v-if="order" class="actions">
          <el-button @click="goBack">返回列表</el-button>
          <el-button
            v-if="order.status === 'pending'"
            type="primary"
            @click="updateStatus('paid')"
          >
            标记为已支付
          </el-button>
          <el-button
            v-else-if="order.status === 'paid'"
            type="primary"
            @click="updateStatus('shipped')"
          >
            标记为已发货
          </el-button>
          <el-button
            v-else-if="order.status === 'shipped'"
            type="success"
            @click="updateStatus('completed')"
          >
            标记为已完成
          </el-button>
        </div>
      </div>

      <el-empty
        v-if="!order && !loading"
        description="暂无订单数据，请从订单列表进入"
      />

      <template v-else-if="order">
        <!-- 基本信息 -->
        <el-descriptions
          title="基本信息"
          :column="2"
          border
          size="small"
          class="desc-block"
        >
          <el-descriptions-item label="订单号">
            {{ order.orderNo }}
          </el-descriptions-item>
          <el-descriptions-item label="下单时间">
            {{ order.createdAt }}
          </el-descriptions-item>
          <el-descriptions-item label="客户姓名">
            {{ order.customerName }}
          </el-descriptions-item>
          <el-descriptions-item label="手机号">
            {{ order.phone }}
          </el-descriptions-item>
          <el-descriptions-item label="收货地址" :span="2">
            {{ order.address }}
          </el-descriptions-item>
          <el-descriptions-item label="订单金额">
            {{ order.totalAmount.toFixed(2) }} 元
          </el-descriptions-item>
          <el-descriptions-item label="支付方式">
            {{ payMethodText(order.payMethod) }}
          </el-descriptions-item>
          <el-descriptions-item label="当前状态">
            <el-tag :type="statusTagType(order.status)">
              {{ statusText(order.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">
            {{ order.remark || '-' }}
          </el-descriptions-item>
        </el-descriptions>

        <!-- 商品明细 -->
        <div class="section-title">商品明细</div>
        <el-table :data="order.items" stripe style="width: 100%">
          <el-table-column prop="productName" label="商品名称" min-width="220" />
          <el-table-column prop="ip" label="IP" width="120" />
          <el-table-column prop="category" label="类别" width="120" />
          <el-table-column prop="scale" label="比例" width="80" />
          <el-table-column prop="price" label="单价(元)" width="120" />
          <el-table-column prop="quantity" label="数量" width="80" />
          <el-table-column prop="subtotal" label="小计(元)" width="120" />
        </el-table>
      </template>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import axios from 'axios'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { Order, OrderStatus } from '@/types/order'

const route = useRoute()
const router = useRouter()

const loading = ref(false)
const order = ref<Order | null>(null)

const orderId = computed(() => route.query.id as string | undefined)

const fetchDetail = async () => {
  if (!orderId.value) {
    order.value = null
    return
  }
  loading.value = true
  try {
    // ✅ 手动把 id 拼到 URL 上，配合当前 Mock.parseQuery 的写法
    const res = await axios.get(`/api/orders/detail?id=${orderId.value}`)

    if (res.data.code === 200) {
      order.value = res.data.data
    } else {
      order.value = null
      ElMessage.error(res.data.message || '订单不存在')
    }
  } catch (e) {
    ElMessage.error('获取订单详情失败')
  } finally {
    loading.value = false
  }
}

const statusText = (status: OrderStatus): string => {
  switch (status) {
    case 'pending':
      return '待支付'
    case 'paid':
      return '已支付'
    case 'shipped':
      return '已发货'
    case 'completed':
      return '已完成'
    case 'cancelled':
      return '已取消'
    default:
      return status
  }
}

const statusTagType = (status: OrderStatus): 'info' | 'success' | 'warning' | 'danger' => {
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
      return 'info'
  }
}

const payMethodText = (m: Order['payMethod']) => {
  switch (m) {
    case 'alipay':
      return '支付宝'
    case 'wechat':
      return '微信支付'
    case 'card':
      return '银行卡'
    case 'cash':
      return '现金'
    case 'bank':
      return '对公转账'
    default:
      return m
  }
}

const updateStatus = async (status: OrderStatus) => {
  if (!order.value) return
  loading.value = true
  try {
    const res = await axios.post('/api/orders/updateStatus', {
      id: order.value.id,
      status,
    })
    if (res.data.code === 200) {
      order.value.status = status
      ElMessage.success('订单状态已更新')
    } else {
      ElMessage.error(res.data.message || '更新失败')
    }
  } catch (e) {
    ElMessage.error('更新订单状态失败')
  } finally {
    loading.value = false
  }
}

const goBack = () => {
  router.push({ name: 'orderlist' })
}

onMounted(fetchDetail)

watch(
  () => route.query.id,
  () => {
    fetchDetail()
  },
)
</script>

<style scoped>
.page {
  padding: 20px;
}

.card {
  width: 100%;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.title-block h2 {
  margin: 0;
}

.subtitle {
  font-size: 12px;
  color: #909399;
}

.actions {
  display: flex;
  gap: 8px;
}

.desc-block {
  margin-bottom: 16px;
}

.section-title {
  font-weight: 600;
  margin: 12px 0;
}
</style>

