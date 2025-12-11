<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import { ElMessage, ElNotification } from "element-plus";
import axios from "axios";
import {
  Box,
  Loading,
  DocumentAdd,
  Refresh,
  Goods,
  TrendCharts,
  Histogram
} from "@element-plus/icons-vue";

interface Product {
  id: number;
  name: string;
}

interface InventoryRecord {
  id?: number;
  productName: string;
  quantity: number;
  remark: string;
  createdAt?: string;
}

const loading = ref(false);
const submitting = ref(false);
const productList = ref<Product[]>([]);
const revenueData = ref<any[]>([]);
const inventoryRecords = ref<InventoryRecord[]>([]);

// 加载初始数据
const loadInitialData = () => {
  const saved = localStorage.getItem('inventory_records');
  if (saved) {
    inventoryRecords.value = JSON.parse(saved);
  }
};

const form = ref<InventoryRecord>({
  productName: "",
  quantity: 1,
  remark: ""
});

// 计算选中产品的信息
const selectedProduct = computed(() => {
  return productList.value.find(p => p.name === form.value.productName);
});

// 计算库存统计
const inventoryStats = computed(() => {
  const stats: Record<string, { total: number, count: number }> = {};

  inventoryRecords.value.forEach(record => {
    if (!stats[record.productName]) {
      stats[record.productName] = { total: 0, count: 0 };
    }
    stats[record.productName].total += record.quantity;
    stats[record.productName].count += 1;
  });

  return stats;
});

// 验证表单
const validateForm = () => {
  if (!form.value.productName.trim()) {
    ElMessage.warning("请选择产品");
    return false;
  }
  if (form.value.quantity <= 0) {
    ElMessage.warning("请输入有效的数量");
    return false;
  }
  if (form.value.quantity > 9999) {
    ElMessage.warning("单次入库数量不能超过9999");
    return false;
  }
  return true;
};

// 加载产品列表
const loadProducts = async () => {
  loading.value = true;
  try {
    const res = await axios.get("/api/products");
    productList.value = res.data;
  } catch (error) {
    console.error("加载产品列表失败:", error);
    ElMessage.error("加载产品列表失败");
    // 使用Mock数据作为fallback
    productList.value = [
      { id: 1, name: "苹果手机" },
      { id: 2, name: "耳机套装" },
      { id: 3, name: "蓝牙音箱" },
      { id: 4, name: "智能手表" },
      { id: 5, name: "运动水杯" }
    ];
  } finally {
    loading.value = false;
  }
};

// 加载收入数据
const loadRevenueData = async () => {
  try {
    const res = await axios.get("/api/revenue");
    revenueData.value = res.data;
  } catch (error) {
    console.error("加载收入数据失败:", error);
  }
};

// 提交库存新增
const submit = async () => {
  if (!validateForm()) return;

  submitting.value = true;

  try {
    // 调用Mock API
    const response = await axios.post("/api/inventory/add", {
      productName: form.value.productName,
      quantity: form.value.quantity,
      remark: form.value.remark
    });

    if (response.data.code === 200) {
      // 添加到本地记录
      const newRecord: InventoryRecord = {
        id: Date.now(),
        productName: form.value.productName,
        quantity: form.value.quantity,
        remark: form.value.remark,
        createdAt: new Date().toISOString()
      };

      inventoryRecords.value.unshift(newRecord);

      // 保存到localStorage
      localStorage.setItem('inventory_records', JSON.stringify(inventoryRecords.value));

      // 显示成功通知
      ElNotification({
        title: '库存新增成功',
        message: `${form.value.productName} 成功入库 ${form.value.quantity} 件`,
        type: 'success',
        duration: 3000,
        position: 'top-right',
        customClass: 'success-notification'
      });

      // 重置表单
      resetForm();

      // 显示操作反馈
      showOperationFeedback();

    } else {
      throw new Error(response.data.message || '提交失败');
    }

  } catch (error: any) {
    console.error("提交失败:", error);

    ElNotification({
      title: '操作失败',
      message: error.message || '网络错误，请稍后重试',
      type: 'error',
      duration: 3000,
      position: 'top-right'
    });

  } finally {
    submitting.value = false;
  }
};

// 显示操作反馈
const showOperationFeedback = () => {
  // 可以添加一些视觉反馈
  const submitBtn = document.querySelector('.submit-btn');
  if (submitBtn) {
    submitBtn.classList.add('success-pulse');
    setTimeout(() => {
      submitBtn.classList.remove('success-pulse');
    }, 1000);
  }
};

// 重置表单
const resetForm = () => {
  form.value = {
    productName: "",
    quantity: 1,
    remark: ""
  };
};

// 删除记录
const deleteRecord = (index: number) => {
  ElMessageBox.confirm(
      '确定要删除这条入库记录吗？',
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
        customClass: 'delete-confirm-dialog'
      }
  ).then(() => {
    inventoryRecords.value.splice(index, 1);
    localStorage.setItem('inventory_records', JSON.stringify(inventoryRecords.value));
    ElMessage.success('记录删除成功');
  }).catch(() => {
    // 用户取消删除
  });
};

// 快速填充表单
const quickFill = (productName: string, quantity: number = 10) => {
  form.value.productName = productName;
  form.value.quantity = quantity;
  ElMessage.info(`已快速填充: ${productName} x ${quantity}`);
};

// 初始化数据
onMounted(() => {
  loadInitialData();
  loadProducts();
  loadRevenueData();
});
</script>

<template>
  <div class="inventory-add-page">
    <!-- 页面标题区域 -->
    <div class="page-header">
      <div class="header-main">
        <div class="title-section">
          <el-icon class="header-icon">
            <Box />
          </el-icon>
          <h1 class="page-title">库存管理系统</h1>
        </div>
        <p class="page-subtitle">产品入库管理 · 实时库存追踪</p>
      </div>

      <!-- 统计卡片 -->
      <div class="stats-cards">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon class="stat-icon total">
              <Goods />
            </el-icon>
            <div class="stat-info">
              <div class="stat-label">总入库产品</div>
              <div class="stat-value">{{ Object.keys(inventoryStats).length }}</div>
            </div>
          </div>
        </el-card>

        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon class="stat-icon records">
              <DocumentAdd />
            </el-icon>
            <div class="stat-info">
              <div class="stat-label">总入库记录</div>
              <div class="stat-value">{{ inventoryRecords.length }}</div>
            </div>
          </div>
        </el-card>

        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon class="stat-icon revenue">
              <TrendCharts />
            </el-icon>
            <div class="stat-info">
              <div class="stat-label">今日收入</div>
              <div class="stat-value">¥{{ revenueData.reduce((sum, item) => sum + item.revenue, 0).toLocaleString() }}</div>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <div class="content-wrapper">
      <!-- 左侧：入库表单 -->
      <div class="form-section">
        <el-card shadow="hover" class="form-card" :class="{ 'card-loading': loading }">
          <template #header>
            <div class="card-header">
              <el-icon class="card-icon">
                <DocumentAdd />
              </el-icon>
              <span class="card-title">新增入库单</span>
              <el-tag v-if="selectedProduct" type="success" size="small" class="product-tag">
                {{ selectedProduct.name }}
              </el-tag>
            </div>
          </template>

          <!-- 快速填充提示 -->
          <div v-if="!loading" class="quick-fill-hint">
            <el-icon><Loading /></el-icon>
            <span>提示：点击下方产品可快速填充表单</span>
          </div>

          <!-- 表单内容 -->
          <el-form
              :model="form"
              label-width="100px"
              size="large"
              :disabled="loading || submitting"
              class="inventory-form"
          >
            <!-- 产品选择 -->
            <el-form-item label="入库产品" class="form-item">
              <el-select
                  v-model="form.productName"
                  placeholder="选择或搜索产品"
                  filterable
                  clearable
                  :loading="loading"
                  style="width: 100%"
                  class="product-select"
              >
                <el-option-group
                    v-for="product in productList"
                    :key="product.id"
                    :label="product.name"
                    :value="product.name"
                >
                  <div class="product-option" @click="quickFill(product.name)">
                    <span class="product-name">{{ product.name }}</span>
                    <el-tag
                        v-if="inventoryStats[product.name]"
                        size="small"
                        :type="inventoryStats[product.name].total > 100 ? 'success' : 'info'"
                    >
                      已入库: {{ inventoryStats[product.name]?.total || 0 }}
                    </el-tag>
                  </div>
                </el-option-group>
              </el-select>

              <!-- 热门产品快速选择 -->
              <div v-if="!loading" class="quick-products">
                <span class="quick-label">热门产品：</span>
                <el-button
                    v-for="product in productList.slice(0, 5)"
                    :key="product.id"
                    size="small"
                    @click="quickFill(product.name)"
                    class="quick-btn"
                >
                  {{ product.name }}
                </el-button>
              </div>
            </el-form-item>

            <!-- 数量输入 -->
            <el-form-item label="入库数量" class="form-item">
              <div class="quantity-control">
                <el-input-number
                    v-model="form.quantity"
                    :min="1"
                    :max="9999"
                    :step="10"
                    controls-position="right"
                    placeholder="输入数量"
                    class="quantity-input"
                />
                <div class="quantity-presets">
                  <el-button
                      v-for="num in [10, 50, 100, 500]"
                      :key="num"
                      size="small"
                      @click="form.quantity = num"
                      :type="form.quantity === num ? 'primary' : ''"
                      class="preset-btn"
                  >
                    +{{ num }}
                  </el-button>
                </div>
              </div>

              <div v-if="form.productName" class="stock-info">
                <el-icon><Goods /></el-icon>
                <span class="info-text">
                  {{ form.productName }} 当前总入库量:
                  <strong>{{ inventoryStats[form.productName]?.total || 0 }}</strong> 件
                </span>
              </div>
            </el-form-item>

            <!-- 备注输入 -->
            <el-form-item label="入库备注" class="form-item">
              <el-input
                  v-model="form.remark"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入入库备注信息（如：供应商、批次号等）"
                  maxlength="200"
                  show-word-limit
                  resize="none"
                  class="remark-input"
              />
            </el-form-item>

            <!-- 表单操作 -->
            <el-form-item class="form-actions">
              <el-button
                  type="primary"
                  :loading="submitting"
                  @click="submit"
                  class="submit-btn"
                  :icon="DocumentAdd"
                  :disabled="!form.productName || form.quantity <= 0"
              >
                {{ submitting ? '提交中...' : '确认入库' }}
              </el-button>

              <el-button
                  @click="resetForm"
                  class="reset-btn"
                  :icon="Refresh"
                  :disabled="submitting"
              >
                重置表单
              </el-button>
            </el-form-item>
          </el-form>

          <!-- Mock数据提示 -->
          <div class="mock-notice">
            <el-icon><Histogram /></el-icon>
            <span>当前使用Mock数据，提交后将保存到本地存储</span>
          </div>
        </el-card>
      </div>

      <!-- 右侧：入库记录 -->
      <div class="records-section">
        <el-card shadow="hover" class="records-card">
          <template #header>
            <div class="records-header">
              <el-icon class="records-icon">
                <DocumentAdd />
              </el-icon>
              <span class="records-title">最近入库记录</span>
              <el-button
                  v-if="inventoryRecords.length > 0"
                  type="text"
                  @click="inventoryRecords = []"
                  class="clear-btn"
              >
                清空记录
              </el-button>
            </div>
          </template>

          <!-- 空状态 -->
          <div v-if="inventoryRecords.length === 0" class="empty-records">
            <el-icon class="empty-icon">
              <Box />
            </el-icon>
            <p>暂无入库记录</p>
            <p class="empty-tip">提交入库单后，记录将显示在这里</p>
          </div>

          <!-- 记录列表 -->
          <div v-else class="records-list">
            <div
                v-for="(record, index) in inventoryRecords.slice(0, 8)"
                :key="record.id || index"
                class="record-item"
                :class="{ 'new-record': index === 0 && record.createdAt }"
            >
              <div class="record-main">
                <div class="record-product">
                  <el-icon class="product-icon"><Goods /></el-icon>
                  <span class="product-name">{{ record.productName }}</span>
                  <el-tag size="small" type="success" class="quantity-tag">
                    +{{ record.quantity }}
                  </el-tag>
                </div>
                <div class="record-meta">
                  <span class="record-time" v-if="record.createdAt">
                    {{ new Date(record.createdAt).toLocaleString() }}
                  </span>
                  <span class="record-remark" v-if="record.remark">
                    {{ record.remark }}
                  </span>
                </div>
              </div>
              <el-button
                  type="text"
                  @click="deleteRecord(index)"
                  class="delete-btn"
                  :icon="Close"
              />
            </div>
          </div>

          <!-- 查看更多 -->
          <div v-if="inventoryRecords.length > 8" class="view-more">
            <el-button type="text" class="more-btn">
              查看更多记录 ({{ inventoryRecords.length - 8 }})
            </el-button>
          </div>
        </el-card>

        <!-- 库存统计 -->
        <el-card shadow="hover" class="stats-card" v-if="Object.keys(inventoryStats).length > 0">
          <template #header>
            <div class="stats-header">
              <el-icon class="stats-icon">
                <TrendCharts />
              </el-icon>
              <span class="stats-title">库存统计</span>
            </div>
          </template>

          <div class="stats-list">
            <div
                v-for="(stat, productName) in inventoryStats"
                :key="productName"
                class="stat-item"
            >
              <div class="stat-product">
                <span class="stat-name">{{ productName }}</span>
                <span class="stat-count">{{ stat.count }} 次入库</span>
              </div>
              <div class="stat-bar">
                <div
                    class="bar-fill"
                    :style="{ width: Math.min(stat.total / 1000 * 100, 100) + '%' }"
                ></div>
                <span class="stat-total">{{ stat.total }} 件</span>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.inventory-add-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  padding: 20px;
}

/* 页面标题区域 */
.page-header {
  margin-bottom: 30px;
  animation: slideDown 0.5s ease-out;
}

.header-main {
  margin-bottom: 24px;
}

.title-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.header-icon {
  color: #409eff;
  background: rgba(64, 158, 255, 0.1);
  padding: 12px;
  border-radius: 12px;
  font-size: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
  background: linear-gradient(45deg, #409eff, #67c23a);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.page-subtitle {
  font-size: 14px;
  color: #8c8c8c;
  margin: 0;
  letter-spacing: 1px;
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
  margin-top: 24px;
}

.stat-card {
  border-radius: 12px;
  border: none;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
  }
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  font-size: 28px;
  padding: 12px;
  border-radius: 10px;

  &.total {
    color: #409eff;
    background: rgba(64, 158, 255, 0.1);
  }

  &.records {
    color: #67c23a;
    background: rgba(103, 194, 58, 0.1);
  }

  &.revenue {
    color: #e6a23c;
    background: rgba(230, 162, 60, 0.1);
  }
}

.stat-info {
  .stat-label {
    font-size: 13px;
    color: #8c8c8c;
    margin-bottom: 4px;
  }

  .stat-value {
    font-size: 24px;
    font-weight: 700;
    color: #2c3e50;
  }
}

/* 主要内容区域 */
.content-wrapper {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;

  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
}

/* 表单区域 */
.form-card {
  border-radius: 16px;
  border: none;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1) !important;
  }
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.card-icon {
  color: #409eff;
  font-size: 20px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  flex: 1;
}

.product-tag {
  margin-left: auto;
}

/* 快速填充提示 */
.quick-fill-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: #f0f9ff;
  border-radius: 8px;
  margin-bottom: 20px;
  color: #409eff;
  font-size: 13px;

  .el-icon {
    animation: bounce 2s infinite;
  }
}

/* 表单样式 */
.inventory-form {
  .form-item {
    margin-bottom: 24px;
  }
}

.product-select {
  :deep(.el-input__wrapper) {
    border-radius: 10px;
    transition: all 0.3s;

    &:hover {
      border-color: #409eff;
    }
  }
}

.product-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.2s;

  &:hover {
    background: #f5f7fa;
  }

  .product-name {
    font-weight: 500;
  }
}

/* 快速产品选择 */
.quick-products {
  margin-top: 12px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}

.quick-label {
  font-size: 13px;
  color: #8c8c8c;
}

.quick-btn {
  transition: all 0.2s;

  &:hover {
    transform: translateY(-2px);
  }
}

/* 数量控制 */
.quantity-control {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quantity-input {
  :deep(.el-input__inner) {
    height: 44px;
    font-size: 16px;
    font-weight: 500;
  }
}

.quantity-presets {
  display: flex;
  gap: 8px;
}

.preset-btn {
  flex: 1;
  transition: all 0.2s;
}

.stock-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 8px 12px;
  background: #f8f9fa;
  border-radius: 8px;
  font-size: 13px;

  .info-text {
    color: #606266;

    strong {
      color: #67c23a;
      font-weight: 600;
    }
  }
}

/* 备注输入 */
.remark-input {
  :deep(.el-textarea__inner) {
    border-radius: 10px;
    border: 1px solid #dcdfe6;
    transition: all 0.3s;
    padding: 12px;

    &:focus {
      border-color: #409eff;
      box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
    }
  }
}

/* 表单操作按钮 */
.form-actions {
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #f0f0f0;

  .submit-btn {
    flex: 1;
    height: 48px;
    font-size: 16px;
    font-weight: 600;
    background: linear-gradient(45deg, #409eff, #66b1ff);
    border: none;
    transition: all 0.3s;

    &:not(:disabled):hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(64, 158, 255, 0.4);
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }
  }

  .reset-btn {
    height: 48px;
    padding: 0 24px;
    background: #f0f2f5;
    border-color: #dcdfe6;
    color: #606266;

    &:hover {
      background: #e4e7ed;
      border-color: #c0c4cc;
    }

    &:disabled {
      opacity: 0.6;
    }
  }
}

/* Mock数据提示 */
.mock-notice {
  margin-top: 20px;
  padding: 12px 16px;
  background: #f0f9ff;
  border-radius: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #409eff;
  font-size: 13px;
  border-left: 4px solid #409eff;
}

/* 记录区域 */
.records-card,
.stats-card {
  border-radius: 16px;
  border: none;
  margin-bottom: 24px;
}

.records-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.records-icon {
  color: #67c23a;
  font-size: 20px;
}

.records-title {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  flex: 1;
}

.clear-btn {
  color: #f56c6c;
  font-size: 13px;
}

/* 空状态 */
.empty-records {
  text-align: center;
  padding: 40px 20px;
  color: #8c8c8c;

  .empty-icon {
    font-size: 48px;
    color: #dcdfe6;
    margin-bottom: 16px;
  }

  p {
    margin: 0;
    font-size: 14px;
  }

  .empty-tip {
    font-size: 12px;
    color: #b0b0b0;
    margin-top: 8px;
  }
}

/* 记录列表 */
.records-list {
  .record-item {
    padding: 16px;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    transition: background 0.2s;

    &:hover {
      background: #fafafa;
    }

    &:last-child {
      border-bottom: none;
    }

    &.new-record {
      background: rgba(64, 158, 255, 0.05);
      border-left: 4px solid #409eff;
    }
  }
}

.record-main {
  flex: 1;
}

.record-product {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.product-icon {
  color: #409eff;
  font-size: 16px;
}

.product-name {
  font-weight: 500;
  color: #2c3e50;
}

.quantity-tag {
  font-weight: 600;
  margin-left: 8px;
}

.record-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.record-time {
  font-size: 12px;
  color: #8c8c8c;
}

.record-remark {
  font-size: 13px;
  color: #606266;
  background: #f8f9fa;
  padding: 4px 8px;
  border-radius: 4px;
  display: inline-block;
  max-width: 200px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete-btn {
  color: #f56c6c;
  opacity: 0;
  transition: opacity 0.2s;

  .record-item:hover & {
    opacity: 1;
  }
}

/* 查看更多 */
.view-more {
  text-align: center;
  padding: 16px;
  border-top: 1px solid #f0f0f0;
}

.more-btn {
  color: #409eff;
  font-size: 13px;
}

/* 统计卡片 */
.stats-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stats-icon {
  color: #e6a23c;
  font-size: 20px;
}

.stats-title {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  flex: 1;
}

.stats-list {
  .stat-item {
    margin-bottom: 16px;
    &:last-child {
      margin-bottom: 0;
    }
  }
}

.stat-product {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.stat-name {
  font-weight: 500;
  color: #2c3e50;
}

.stat-count {
  font-size: 12px;
  color: #8c8c8c;
}

.stat-bar {
  height: 24px;
  background: #f0f0f0;
  border-radius: 12px;
  position: relative;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #67c23a, #a0d911);
  border-radius: 12px;
  transition: width 1s ease;
}

.stat-total {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  font-weight: 600;
  color: #2c3e50;
}

/* 成功动画 */
.success-pulse {
  animation: successPulse 1s ease;
}

@keyframes successPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .inventory-add-page {
    padding: 12px;
  }

  .page-title {
    font-size: 22px;
  }

  .stats-cards {
    grid-template-columns: 1fr;
  }

  .content-wrapper {
    gap: 16px;
  }

  .form-actions {
    flex-direction: column;

    .el-button {
      width: 100%;
      margin-left: 0 !important;
    }
  }

  .quantity-presets {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
