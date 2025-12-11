<template>
  <div class="page">
    <el-card class="card">
      <div class="header">
        <div class="title-block">
          <h2>订单列表</h2>
          <span class="subtitle">查看并管理手办订单信息</span>
        </div>

        <el-form :inline="true" :model="searchForm" class="filter-form">
          <el-form-item label="关键词">
            <el-input
              v-model="searchForm.keyword"
              placeholder="订单号 / 客户名 / 电话"
              clearable
              style="width: 220px"
            />
          </el-form-item>

          <el-form-item label="状态">
            <el-select
              v-model="searchForm.status"
              placeholder="全部"
              clearable
              style="width: 140px"
            >
              <el-option label="待支付" value="pending" />
              <el-option label="已支付" value="paid" />
              <el-option label="已发货" value="shipped" />
              <el-option label="已完成" value="completed" />
              <el-option label="已取消" value="cancelled" />
            </el-select>
          </el-form-item>

          <el-form-item label="下单日期">
            <el-date-picker
              v-model="searchForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="handleSearch">查询</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <el-table
        :data="orderList"
        stripe
        style="width: 100%"
        v-loading="loading"
        highlight-current-row
      >
        <el-table-column type="index" label="#" width="60" />
        <el-table-column prop="orderNo" label="订单号" min-width="220" />
        <el-table-column prop="customerName" label="客户姓名" min-width="120" />
        <el-table-column prop="phone" label="手机号" min-width="140" />
        <el-table-column prop="totalAmount" label="订单金额(元)" min-width="120">
          <template #default="{ row }">
            {{ row.totalAmount.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="payMethod" label="支付方式" min-width="100">
          <template #default="{ row }">
            {{ payMethodText(row.payMethod) }}
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="下单时间" min-width="180" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="statusTagType(row.status)">
              {{ statusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="goDetail(row)">
              详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          background
          layout="total, prev, pager, next, jumper"
          :total="total"
          v-model:current-page="page"
          v-model:page-size="pageSize"
          @current-change="fetchData"
          @size-change="fetchData"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import type { Order, OrderStatus } from '@/types/order'

const router = useRouter()

interface SearchForm {
  keyword: string
  status: OrderStatus | ''
  dateRange: string[]
}

const searchForm = reactive<SearchForm>({
  keyword: '',
  status: '',
  dateRange: [],
})

const loading = ref(false)
const orderList = ref<Order[]>([])
const page = ref(1)
const pageSize = ref(10)
const total = ref(0)

const fetchData = async () => {
  loading.value = true
  try {
    const res = await axios.get('/api/orders', {
      params: {
        page: page.value,
        pageSize: pageSize.value,
        keyword: searchForm.keyword || undefined,
        status: searchForm.status || undefined,
        startDate: searchForm.dateRange?.[0],
        endDate: searchForm.dateRange?.[1],
      },
    })

    const { list, total: t } = res.data.data
    orderList.value = list
    total.value = t
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  page.value = 1
  fetchData()
}

const handleReset = () => {
  searchForm.keyword = ''
  searchForm.status = ''
  searchForm.dateRange = []
  page.value = 1
  fetchData()
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

const goDetail = (row: Order) => {
  router.push({
    name: 'orderdetail',
    query: { id: String(row.id) },
  })
}

onMounted(() => {
  fetchData()
})
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

.filter-form {
  display: flex;
  align-items: center;
  gap: 12px;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>
