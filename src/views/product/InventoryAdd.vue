<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { ElMessage } from "element-plus";
import axios from "axios";
import {
  Box,
  Loading,
  DocumentAdd,
  Refresh
} from "@element-plus/icons-vue";

interface Product {
  id: string;
  name: string;
  stock?: number;
  category?: string;
}

const loading = ref(false);
const submitting = ref(false);
const productList = ref<Product[]>([]);

const form = ref({
  productId: "",
  quantity: 0,
  remark: ""
});

// 计算选中产品的信息
const selectedProduct = computed(() => {
  return productList.value.find(p => p.id === form.value.productId);
});

// 验证表单
const validateForm = () => {
  if (!form.value.productId) {
    ElMessage.warning("请选择产品");
    return false;
  }
  if (form.value.quantity <= 0) {
    ElMessage.warning("请输入有效的数量");
    return false;
  }
  return true;
};

const loadProducts = async () => {
  loading.value = true;
  try {
    const res = await axios.get("/api/products");
    productList.value = res.data;
  } catch (error) {
    ElMessage.error("加载产品列表失败");
  } finally {
    loading.value = false;
  }
};

const submit = async () => {
  if (!validateForm()) return;

  submitting.value = true;
  try {
    await axios.post("/api/inventory/add", form.value);
    ElMessage.success({
      message: "库存新增成功",
      type: "success",
      duration: 2000,
      showClose: true
    });

    // 清空表单
    resetForm();

    // 模拟成功后刷新产品列表
    setTimeout(() => {
      loadProducts();
    }, 500);

  } catch (error) {
    ElMessage.error("提交失败，请稍后重试");
  } finally {
    submitting.value = false;
  }
};

const resetForm = () => {
  form.value = { productId: "", quantity: 0, remark: "" };
};

onMounted(() => {
  loadProducts();
});
</script>

<template>
  <div class="page">
    <div class="page-content">
      <!-- 页面标题区域 -->
      <div class="page-header">
        <div class="header-content">
          <div class="title-section">
            <el-icon class="header-icon" :size="28">
              <Box />
            </el-icon>
            <h1 class="page-title">库存管理</h1>
          </div>
          <p class="page-subtitle">新增产品库存记录</p>
        </div>
      </div>

      <!-- 表单卡片 -->
      <div class="card-container">
        <el-card shadow="hover" class="form-card" :class="{ 'card-loading': loading }">
          <!-- 卡片标题 -->
          <template #header>
            <div class="card-header">
              <el-icon class="card-icon">
                <DocumentAdd />
              </el-icon>
              <span class="card-title">新增库存</span>
              <el-tag v-if="selectedProduct" type="success" size="small" class="stock-tag">
                当前库存: {{ selectedProduct.stock || 0 }}
              </el-tag>
            </div>
          </template>

          <!-- 加载状态 -->
          <div v-if="loading" class="loading-overlay">
            <el-icon class="loading-icon" :size="40">
              <Loading />
            </el-icon>
            <p>正在加载产品数据...</p>
          </div>

          <!-- 表单内容 -->
          <el-form
            :model="form"
            label-width="100px"
            size="large"
            :disabled="loading"
            class="animated-form"
          >
            <!-- 产品选择 -->
            <el-form-item label="产品选择" class="form-item-animated">
              <el-select
                v-model="form.productId"
                placeholder="请选择产品"
                filterable
                clearable
                :loading="loading"
                style="width: 100%"
                class="select-with-icon"
              >
                <template #prefix>
                  <el-icon><Box /></el-icon>
                </template>
                <el-option-group
                  v-for="group in productList.reduce((groups, item) => {
                    const category = item.category || '未分类';
                    if (!groups[category]) groups[category] = [];
                    groups[category].push(item);
                    return groups;
                  }, {})"
                  :key="Object.keys(group)[0]"
                  :label="Object.keys(group)[0]"
                >
                  <el-option
                    v-for="item in group[Object.keys(group)[0]]"
                    :key="item.id"
                    :label="item.name"
                    :value="item.id"
                    class="product-option"
                  >
                    <div class="product-option-content">
                      <span class="product-name">{{ item.name }}</span>
                      <el-tag v-if="item.stock !== undefined" size="small" class="stock-indicator">
                        {{ item.stock }} 件
                      </el-tag>
                    </div>
                  </el-option>
                </el-option-group>
              </el-select>
              <div v-if="selectedProduct" class="product-info">
                <span class="info-text">已选择: {{ selectedProduct.name }}</span>
                <span v-if="selectedProduct.category" class="info-tag">
                  {{ selectedProduct.category }}
                </span>
              </div>
            </el-form-item>

            <!-- 数量输入 -->
            <el-form-item label="入库数量" class="form-item-animated">
              <div class="quantity-input-group">
                <el-input-number
                  v-model="form.quantity"
                  :min="1"
                  :max="9999"
                  controls-position="right"
                  placeholder="请输入数量"
                  class="quantity-input"
                />
                <span class="quantity-hint">单位：件</span>
              </div>
              <div v-if="selectedProduct && form.quantity > 0" class="stock-preview">
                新增后库存:
                <span class="stock-value">
                  {{ (selectedProduct.stock || 0) + form.quantity }} 件
                </span>
              </div>
            </el-form-item>

            <!-- 备注输入 -->
            <el-form-item label="备注说明" class="form-item-animated">
              <el-input
                v-model="form.remark"
                type="textarea"
                :rows="3"
                placeholder="请输入入库备注（可选）"
                maxlength="200"
                show-word-limit
                resize="none"
                class="remark-textarea"
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
              >
                {{ submitting ? '提交中...' : '确认入库' }}
              </el-button>

              <el-button
                @click="resetForm"
                class="reset-btn"
                :icon="Refresh"
              >
                重置表单
              </el-button>

              <el-button
                type="info"
                @click="loadProducts"
                :loading="loading"
                plain
                class="refresh-btn"
              >
                刷新列表
              </el-button>
            </el-form-item>
          </el-form>

          <!-- 表单提示 -->
          <div class="form-tips">
            <el-icon class="tip-icon"><Loading /></el-icon>
            <span class="tip-text">提交后系统将自动更新库存记录</span>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
  padding: 0;
  margin: 0;
}

.page-content {
  max-width: 800px;
  margin: 0 auto;
  padding: 30px 20px;
}

/* 页面标题样式 */
.page-header {
  margin-bottom: 30px;
  animation: slideDown 0.5s ease-out;
}

.header-content {
  text-align: center;
}

.title-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-bottom: 8px;
}

.header-icon {
  color: #409eff;
  background: rgba(64, 158, 255, 0.1);
  padding: 10px;
  border-radius: 50%;
  animation: pulse 2s infinite;
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

/* 卡片容器 */
.card-container {
  animation: fadeInUp 0.6s ease-out;
}

.form-card {
  border-radius: 16px;
  border: none;
  overflow: hidden;
  transition: all 0.3s ease;
  position: relative;

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.1) !important;
  }
}

.card-loading {
  opacity: 0.7;
}

/* 卡片标题 */
.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 0;
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

.stock-tag {
  margin-left: auto;
  font-weight: 500;
}

/* 加载状态 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.95);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 16px;

  .loading-icon {
    color: #409eff;
    animation: spin 1.5s linear infinite;
    margin-bottom: 15px;
  }

  p {
    color: #606266;
    font-size: 14px;
  }
}

/* 表单动画 */
.animated-form {
  position: relative;
}

.form-item-animated {
  opacity: 0;
  transform: translateX(-20px);
  animation: slideIn 0.5s ease forwards;

  &:nth-child(1) { animation-delay: 0.1s; }
  &:nth-child(2) { animation-delay: 0.2s; }
  &:nth-child(3) { animation-delay: 0.3s; }
}

/* 产品选择优化 */
.select-with-icon {
  :deep(.el-input__wrapper) {
    padding-left: 40px;
  }

  :deep(.el-input__prefix) {
    left: 12px;
    display: flex;
    align-items: center;
  }
}

.product-option-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 0;
}

.product-name {
  font-weight: 500;
}

.stock-indicator {
  font-size: 11px;
  padding: 0 6px;
  height: 20px;
}

.product-info {
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 13px;

  .info-text {
    color: #67c23a;
    font-weight: 500;
  }

  .info-tag {
    background: #e8f4ff;
    color: #409eff;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 12px;
  }
}

/* 数量输入优化 */
.quantity-input-group {
  display: flex;
  align-items: center;
  gap: 15px;

  .quantity-input {
    flex: 1;

    :deep(.el-input__inner) {
      text-align: left;
      padding-left: 15px;
    }
  }

  .quantity-hint {
    color: #909399;
    font-size: 13px;
    min-width: 60px;
  }
}

.stock-preview {
  margin-top: 8px;
  font-size: 13px;
  color: #606266;

  .stock-value {
    color: #67c23a;
    font-weight: 600;
    margin-left: 5px;
  }
}

/* 备注输入框 */
.remark-textarea {
  :deep(.el-textarea__inner) {
    border-radius: 8px;
    transition: all 0.3s;

    &:focus {
      border-color: #409eff;
      box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.1);
    }
  }
}

/* 表单操作按钮 */
.form-actions {
  margin-top: 30px;
  display: flex;
  gap: 12px;

  .submit-btn {
    flex: 1;
    height: 44px;
    font-weight: 600;
    font-size: 16px;
    background: linear-gradient(45deg, #409eff, #66b1ff);
    border: none;
    transition: all 0.3s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(64, 158, 255, 0.4);
    }
  }

  .reset-btn {
    background: #f0f2f5;
    border-color: #dcdfe6;
    color: #606266;

    &:hover {
      background: #e4e7ed;
      border-color: #c0c4cc;
    }
  }

  .refresh-btn {
    border-color: #909399;
    color: #909399;
  }
}

/* 表单提示 */
.form-tips {
  margin-top: 25px;
  padding: 12px 16px;
  background: #f0f9ff;
  border-radius: 8px;
  border-left: 4px solid #409eff;
  display: flex;
  align-items: center;
  gap: 10px;
  animation: fadeIn 0.5s ease 1s both;

  .tip-icon {
    color: #409eff;
    animation: bounce 2s infinite;
  }

  .tip-text {
    color: #606266;
    font-size: 13px;
  }
}

/* 动画定义 */
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

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideIn {
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .page-content {
    padding: 20px 15px;
  }

  .page-title {
    font-size: 24px;
  }

  .form-card {
    border-radius: 12px;
  }

  .form-actions {
    flex-direction: column;

    .el-button {
      width: 100%;
      margin-left: 0 !important;
    }
  }

  .quantity-input-group {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;

    .quantity-hint {
      text-align: right;
    }
  }
}

/* 深色模式支持 */
@media (prefers-color-scheme: dark) {
  .page {
    background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%);
  }

  .page-title {
    background: linear-gradient(45deg, #66b1ff, #85ce61);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .form-card {
    background: #2d2d2d;
    color: #fff;
  }

  .card-title {
    color: #fff;
  }
}
</style>
