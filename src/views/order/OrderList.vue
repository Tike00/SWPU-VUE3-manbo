<!-- src/views/order/OrderList.vue -->
<template>
  <div class="order-list-page">
    <!-- 顶部筛选区域 -->
    <el-card shadow="never" class="filter-card">
      <div class="filter-row">
        <el-input
          v-model="queryForm.keyword"
          placeholder="搜索订单号 / 客户姓名 / 手机号"
          clearable
          class="filter-item"
          @keyup.enter.native="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
        </el-input>

        <el-select
          v-model="queryForm.status"
          placeholder="订单状态"
          clearable
          class="filter-item"
        >
          <el-option label="待支付" value="pending" />
          <el-option label="已支付" value="paid" />
          <el-option label="已发货" value="shipped" />
          <el-option label="已完成" value="completed" />
          <el-option label="已取消" value="cancelled" />
        </el-select>

        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="YYYY-MM-DD"
          class="filter-item"
        />

        <div class="filter-actions">
          <el-button type="primary" @click="handleSearch">
            查询
          </el-button>
          <el-button @click="resetFilters">
            重置
          </el-button>
        </div>
      </div>
    </el-card>

    <!-- 订单列表 -->
    <el-card shadow="never" class="table-card">
      <template #header>
        <div class="table-header">
          <span class="title">订单列表</span>
          <span class="sub-title">共 {{ total }} 条</span>
        </div>
      </template>

      <el-table
        :data="list"
        v-loading="loading"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="70" align="center" />
        <el-table-column prop="orderNo" label="订单号" min-width="220" show-overflow-tooltip />
        <el-table-column prop="customerName" label="客户姓名" width="120" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="address" label="收货地址" min-width="260" show-overflow-tooltip />

        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)" size="small">
              {{ statusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="payMethod" label="支付方式" width="100" align="center">
          <template #default="{ row }">
            <el-tag size="small" type="info">{{ payMethodLabel(row.payMethod) }}</el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="createdAt" label="下单时间" width="180" />

        <el-table-column prop="totalAmount" label="订单金额" width="120" align="right">
          <template #default="{ row }">
            <span class="amount">¥ {{ row.totalAmount.toLocaleString() }}</span>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="goDetail(row)">
              详情
            </el-button>
            <el-dropdown
              trigger="click"
              @command="(cmd) => handleStatusChange(row, cmd)"
            >
              <el-button size="small">
                修改状态
                <el-icon class="el-icon--right"><ArrowDown /></el-icon>
              </el-button>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="pending">待支付</el-dropdown-item>
                  <el-dropdown-item command="paid">已支付</el-dropdown-item>
                  <el-dropdown-item command="shipped">已发货</el-dropdown-item>
                  <el-dropdown-item command="completed">已完成</el-dropdown-item>
                  <el-dropdown-item command="cancelled">已取消</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          background
          layout="total, prev, pager, next, jumper"
          :total="total"
          :page-size="queryForm.pageSize"
          :current-page="queryForm.page"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, ArrowDown } from '@element-plus/icons-vue'
import axios from 'axios'

// 类型与 mock 中的 MockOrder 对齐（只取列表需要的字段）
type OrderStatus = 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled'
type PayMethod = 'alipay' | 'wechat' | 'card' | 'cash'

interface OrderListItem {
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
}

interface OrderListResp {
  code: number
  data: {
    list: OrderListItem[]
    total: number
  }
}

const router = useRouter()

const loading = ref(false)
const list = ref<OrderListItem[]>([])
const total = ref(0)

const queryForm = reactive({
  page: 1,
  pageSize: 10,
  keyword: '',
  status: '',
  startDate: '',
  endDate: '',
})

const dateRange = ref<[string, string] | ''>('')

// 状态显示文本
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

// 状态 Tag 颜色
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

// 支付方式显示文本
const payMethodLabel = (pm: PayMethod): string => {
  const map: Record<PayMethod, string> = {
    alipay: '支付宝',
    wechat: '微信',
    card: '银行卡',
    cash: '现金',
  }
  return map[pm] || pm
}

// 加载列表
const fetchList = async () => {
  loading.value = true
  try {
    if (Array.isArray(dateRange.value) && dateRange.value.length === 2) {
      queryForm.startDate = dateRange.value[0]
      queryForm.endDate = dateRange.value[1]
    } else {
      queryForm.startDate = ''
      queryForm.endDate = ''
    }

    const resp = await axios.get<OrderListResp>('/api/orders', {
      params: {
        page: queryForm.page,
        pageSize: queryForm.pageSize,
        keyword: queryForm.keyword || undefined,
        status: queryForm.status || undefined,
        startDate: queryForm.startDate || undefined,
        endDate: queryForm.endDate || undefined,
      },
    })

    if (resp.data.code === 200) {
      list.value = resp.data.data.list
      total.value = resp.data.data.total
    } else {
      ElMessage.error('加载订单列表失败')
    }
  } catch (error) {
    console.error('加载订单列表失败', error)
    ElMessage.error('加载订单列表失败')
  } finally {
    loading.value = false
  }
}

// 查询按钮
const handleSearch = () => {
  queryForm.page = 1
  fetchList()
}

// 重置
const resetFilters = () => {
  queryForm.keyword = ''
  queryForm.status = ''
  queryForm.page = 1
  dateRange.value = ''
  fetchList()
}

// 分页
const handlePageChange = (page: number) => {
  queryForm.page = page
  fetchList()
}

// 跳转详情页
const goDetail = (row: OrderListItem) => {
  router.push({
    name: 'orderdetail',
    query: { id: row.id.toString() },
  })
}

// 修改订单状态
const handleStatusChange = (row: OrderListItem, newStatus: string) => {
  if (!['pending', 'paid', 'shipped', 'completed', 'cancelled'].includes(newStatus)) return

  ElMessageBox.confirm(
    `确定将订单【${row.orderNo}】状态修改为【${statusLabel(newStatus as OrderStatus)}】吗？`,
    '修改订单状态',
    {
      type: 'warning',
      confirmButtonText: '确认',
      cancelButtonText: '取消',
    },
  )
    .then(async () => {
      try {
        const resp = await axios.post('/api/orders/updateStatus', {
          id: row.id,
          status: newStatus,
        })

        if (resp.data.code === 200) {
          ElMessage.success('订单状态更新成功（Mock）')
          fetchList()
        } else {
          ElMessage.error(resp.data.message || '状态更新失败')
        }
      } catch (error) {
        console.error('更新订单状态失败', error)
        ElMessage.error('状态更新失败')
      }
    })
    .catch(() => {
      // 用户取消
    })
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped lang="scss">
.order-list-page {
  padding: 20px;
  background: #f5f7fa;
}

.filter-card {
  margin-bottom: 16px;
}

.filter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.filter-item {
  min-width: 220px;
  flex: 1;
}

.filter-actions {
  display: flex;
  gap: 8px;
}

.table-card {
  .table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title {
      font-weight: 600;
    }

    .sub-title {
      font-size: 12px;
      color: #909399;
    }
  }
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

.amount {
  color: #f56c6c;
  font-weight: 600;
}
</style>
