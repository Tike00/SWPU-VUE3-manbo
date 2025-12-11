<script setup lang="ts">
import { ref, onMounted, computed, reactive } from "vue";
import { ElMessage, ElMessageBox, ElNotification } from "element-plus";
import axios from "axios";
import { 
  Box,
  Loading,
  DocumentAdd,
  Refresh,
  Goods,
  TrendCharts,
  Histogram,
  Collection,
  ScaleToOriginal,
  PriceTag
} from "@element-plus/icons-vue";

interface Product {
  id: number;
  name: string;
  ip: string;
  category: string;
  scale: string;
  status: boolean;
  price?: number;
  stock?: number;
}

interface ConfigOptions {
  ipList: string[];
  categoryList: string[];
  scaleList: string[];
}

interface InventoryRecord {
  id?: number;
  productName: string;
  productId: number;
  ip: string;
  category: string;
  scale: string;
  quantity: number;
  price?: number;
  remark: string;
  createdAt?: string;
}

// 响应式数据
const loading = ref(false);
const submitting = ref(false);
const productList = ref<Product[]>([]);
const configOptions = ref<ConfigOptions>({
  ipList: [],
  categoryList: [],
  scaleList: []
});

const inventoryRecords = ref<InventoryRecord[]>([]);
const filterForm = reactive({
  ip: '',
  category: '',
  keyword: ''
});

// 表单数据
const form = reactive({
  productId: '',
  productName: '',
  ip: '',
  category: '',
  scale: '无比例',
  quantity: 1,
  remark: "",
  price: 0,
  stock: 0
});

// 计算属性
const filteredProducts = computed(() => {
  let filtered = productList.value;
  
  if (filterForm.ip) {
    filtered = filtered.filter(p => p.ip === filterForm.ip);
  }
  
  if (filterForm.category) {
    filtered = filtered.filter(p => p.category === filterForm.category);
  }
  
  if (filterForm.keyword) {
    const keyword = filterForm.keyword.toLowerCase();
    filtered = filtered.filter(p => 
      p.name.toLowerCase().includes(keyword) ||
      p.ip.toLowerCase().includes(keyword)
    );
  }
  
  return filtered;
});

const selectedProduct = computed(() => {
  if (form.productId) {
    return productList.value.find(p => p.id === Number(form.productId));
  }
  if (form.productName) {
    return productList.value.find(p => p.name === form.productName);
  }
  return null;
});

const inventoryStats = computed(() => {
  const stats: Record<string, { 
    total: number, 
    count: number,
    categories: Record<string, number>,
    scales: Record<string, number>
  }> = {};
  
  inventoryRecords.value.forEach(record => {
    const product = productList.value.find(p => p.id === record.productId);
    const ip = product?.ip || record.ip || '未知IP';
    
    if (!stats[ip]) {
      stats[ip] = { 
        total: 0, 
        count: 0,
        categories: {},
        scales: {}
      };
    }
    
    stats[ip].total += record.quantity;
    stats[ip].count += 1;
    
    // 统计品类分布
    const category = record.category || '未分类';
    stats[ip].categories[category] = (stats[ip].categories[category] || 0) + record.quantity;
    
    // 统计比例分布
    const scale = record.scale || '无比例';
    stats[ip].scales[scale] = (stats[ip].scales[scale] || 0) + record.quantity;
  });
  
  return stats;
});

// 加载配置选项
const loadConfigOptions = async () => {
  try {
    const res = await axios.get("/api/config/options");
    configOptions.value = res.data.data;
  } catch (error) {
    console.error("加载配置失败:", error);
  }
};

// 加载产品列表
const loadProducts = async () => {
  loading.value = true;
  try {
    const res = await axios.get("/api/products");
    productList.value = res.data.data;
  } catch (error) {
    console.error("加载产品列表失败:", error);
    ElMessage.error("加载产品列表失败");
  } finally {
    loading.value = false;
  }
};

// 加载本地库存记录
const loadInventoryRecords = () => {
  const saved = localStorage.getItem('figure_inventory_records');
  if (saved) {
    try {
      inventoryRecords.value = JSON.parse(saved);
    } catch (error) {
      console.error("加载库存记录失败:", error);
      inventoryRecords.value = [];
    }
  }
};

// 表单验证
const validateForm = (): boolean => {
  if (!form.productId && !form.productName.trim()) {
    ElMessage.warning("请选择或输入手办产品");
    return false;
  }
  
  if (form.quantity <= 0) {
    ElMessage.warning("入库数量必须大于0");
    return false;
  }
  
  if (form.quantity > 9999) {
    ElMessage.warning("单次入库数量不能超过9999");
    return false;
  }
  
  if (!form.ip && !form.productId) {
    ElMessage.warning("请选择IP系列");
    return false;
  }
  
  if (!form.category && !form.productId) {
    ElMessage.warning("请选择品类");
    return false;
  }
  
  return true;
};

// 选择产品时的处理
const handleProductSelect = (product: Product) => {
  form.productId = product.id.toString();
  form.productName = product.name;
  form.ip = product.ip;
  form.category = product.category;
  form.scale = product.scale;
  form.price = product.price || 0;
  form.stock = product.stock || 0;
  
  ElMessage.success(`已选择: ${product.name}`);
};

// 提交库存新增
const submit = async () => {
  if (!validateForm()) return;
  
  submitting.value = true;
  
  try {
    // 1. 先确定产品信息
    let productInfo = selectedProduct.value;
    
    // 2. 如果是新产品（手动输入），先添加到产品列表
    if (!productInfo && form.productName) {
      const newProduct = {
        id: Date.now(),
        name: form.productName,
        ip: form.ip,
        category: form.category,
        scale: form.scale,
        status: true,
        price: form.price || Mock.Random.integer(199, 5000),
        stock: form.stock
      };
      
      // 添加到本地产品列表（模拟新增产品）
      productList.value.unshift(newProduct);
      productInfo = newProduct;
      
      // 调用Mock API添加产品
      await axios.post("/api/inventory/add", {
        name: form.productName,
        ip: form.ip,
        category: form.category,
        scale: form.scale
      });
    }
    
    // 3. 创建库存记录
    const newRecord: InventoryRecord = {
      id: Date.now(),
      productId: productInfo?.id || Number(form.productId) || Date.now(),
      productName: form.productName,
      ip: form.ip,
      category: form.category,
      scale: form.scale,
      quantity: form.quantity,
      price: productInfo?.price,
      remark: form.remark,
      createdAt: new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    };
    
    // 4. 保存记录
    inventoryRecords.value.unshift(newRecord);
    localStorage.setItem('figure_inventory_records', JSON.stringify(inventoryRecords.value));
    
    // 5. 显示成功通知
    ElNotification({
      title: '入库成功',
      message: `${form.productName} 成功入库 ${form.quantity} 件`,
      type: 'success',
      duration: 3000,
      position: 'top-right',
      customClass: 'success-notification'
    });
    
    // 6. 重置表单
    resetForm();
    
    // 7. 显示动画反馈
    showSuccessAnimation();
    
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

// 显示成功动画
const showSuccessAnimation = () => {
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
  Object.assign(form, {
    productId: '',
    productName: '',
    ip: '',
    category: '',
    scale: '无比例',
    quantity: 1,
    remark: "",
    price: 0,
    stock: 0
  });
  filterForm.keyword = '';
};

// 删除记录
const deleteRecord = (index: number) => {
  ElMessageBox.confirm(
    '确定要删除这条入库记录吗？删除后无法恢复',
    '删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning',
      customClass: 'delete-confirm-dialog',
      center: true
    }
  ).then(() => {
    inventoryRecords.value.splice(index, 1);
    localStorage.setItem('figure_inventory_records', JSON.stringify(inventoryRecords.value));
    ElMessage.success('记录删除成功');
  }).catch(() => {
    // 用户取消
  });
};

// 清除所有记录
const clearAllRecords = () => {
  ElMessageBox.confirm(
    '确定要清空所有入库记录吗？此操作不可恢复',
    '清空确认',
    {
      confirmButtonText: '确定清空',
      cancelButtonText: '取消',
      type: 'error',
      center: true
    }
  ).then(() => {
    inventoryRecords.value = [];
    localStorage.removeItem('figure_inventory_records');
    ElMessage.success('所有记录已清空');
  }).catch(() => {
    // 用户取消
  });
};

// 快速填充常用信息
const quickFill = (product: Product) => {
  handleProductSelect(product);
  form.quantity = 1;
  
  ElMessage.info(`已快速选择: ${product.name}`);
};

// 重置筛选
const resetFilter = () => {
  filterForm.ip = '';
  filterForm.category = '';
  filterForm.keyword = '';
};

// 导出记录
const exportRecords = () => {
  const dataStr = JSON.stringify(inventoryRecords.value, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  const exportFileDefaultName = `手办入库记录_${new Date().toLocaleDateString()}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
  
  ElMessage.success('记录导出成功');
};

// 初始化数据
onMounted(() => {
  loadConfigOptions();
  loadProducts();
  loadInventoryRecords();
});
</script>

<template>
  <div class="figure-inventory-page">
    <!-- 页面标题区域 -->
    <div class="page-header">
      <div class="header-main">
        <div class="title-section">
          <el-icon class="header-icon">
            <Collection />
          </el-icon>
          <h1 class="page-title">手办库存管理系统</h1>
        </div>
        <p class="page-subtitle">手办入库管理 · IP库存追踪 · 实时数据统计</p>
      </div>
      
      <!-- 统计卡片 -->
      <div class="stats-cards">
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon class="stat-icon total">
              <Goods />
            </el-icon>
            <div class="stat-info">
              <div class="stat-label">总IP系列</div>
              <div class="stat-value">{{ configOptions.ipList.length }}</div>
            </div>
          </div>
        </el-card>
        
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon class="stat-icon records">
              <DocumentAdd />
            </el-icon>
            <div class="stat-info">
              <div class="stat-label">入库记录数</div>
              <div class="stat-value">{{ inventoryRecords.length }}</div>
            </div>
          </div>
        </el-card>
        
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon class="stat-icon brands">
              <PriceTag />
            </el-icon>
            <div class="stat-info">
              <div class="stat-label">活跃产品数</div>
              <div class="stat-value">{{ productList.filter(p => p.status).length }}</div>
            </div>
          </div>
        </el-card>
        
        <el-card shadow="hover" class="stat-card">
          <div class="stat-content">
            <el-icon class="stat-icon scales">
              <ScaleToOriginal />
            </el-icon>
            <div class="stat-info">
              <div class="stat-label">比例类型</div>
              <div class="stat-value">{{ configOptions.scaleList.length }}</div>
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
              <span class="card-title">新增手办入库</span>
              <el-tag v-if="selectedProduct" type="success" size="small" class="product-tag">
                {{ selectedProduct.ip }} · {{ selectedProduct.category }}
              </el-tag>
            </div>
          </template>

          <!-- 产品筛选器 -->
          <div class="product-filter">
            <el-input
              v-model="filterForm.keyword"
              placeholder="搜索手办名称或IP..."
              clearable
              size="large"
              class="filter-input"
              @input="loadProducts"
            >
              <template #prefix>
                <el-icon><Loading /></el-icon>
              </template>
            </el-input>
            
            <div class="filter-tags">
              <el-select
                v-model="filterForm.ip"
                placeholder="筛选IP系列"
                clearable
                size="small"
                class="filter-select"
                @change="loadProducts"
              >
                <el-option
                  v-for="ip in configOptions.ipList"
                  :key="ip"
                  :label="ip"
                  :value="ip"
                />
              </el-select>
              
              <el-select
                v-model="filterForm.category"
                placeholder="筛选品类"
                clearable
                size="small"
                class="filter-select"
                @change="loadProducts"
              >
                <el-option
                  v-for="category in configOptions.categoryList"
                  :key="category"
                  :label="category"
                  :value="category"
                />
              </el-select>
              
              <el-button
                type="text"
                @click="resetFilter"
                size="small"
                class="reset-filter-btn"
              >
                重置筛选
              </el-button>
            </div>
          </div>

          <!-- 产品列表 -->
          <div class="product-list-container">
            <div v-if="loading" class="loading-products">
              <el-icon class="loading-icon"><Loading /></el-icon>
              <p>正在加载手办列表...</p>
            </div>
            
            <div v-else-if="filteredProducts.length === 0" class="empty-products">
              <el-icon class="empty-icon"><Box /></el-icon>
              <p>暂无手办数据</p>
              <p class="empty-tip">请检查筛选条件或添加新手办</p>
            </div>
            
            <div v-else class="product-grid">
              <div
                v-for="product in filteredProducts.slice(0, 8)"
                :key="product.id"
                class="product-card"
                :class="{ 'selected': product.id === Number(form.productId) }"
                @click="quickFill(product)"
              >
                <div class="product-header">
                  <div class="product-name" :title="product.name">
                    {{ product.name }}
                  </div>
                  <el-tag
                    size="small"
                    :type="product.price && product.price > 2000 ? 'warning' : 'success'"
                    class="price-tag"
                  >
                    ¥{{ product.price?.toLocaleString() || '--' }}
                  </el-tag>
                </div>
                
                <div class="product-meta">
                  <el-tag size="small" type="info" class="meta-tag">
                    {{ product.ip }}
                  </el-tag>
                  <el-tag size="small" class="meta-tag">
                    {{ product.category }}
                  </el-tag>
                  <el-tag size="small" type="info" class="meta-tag">
                    {{ product.scale }}
                  </el-tag>
                </div>
                
                <div class="product-footer">
                  <span class="stock-info">
                    库存: {{ product.stock || 0 }} 件
                  </span>
                  <el-button
                    type="primary"
                    size="small"
                    @click.stop="handleProductSelect(product)"
                    class="select-btn"
                  >
                    选择入库
                  </el-button>
                </div>
              </div>
            </div>
          </div>

          <!-- 入库表单 -->
          <div class="inventory-form-wrapper">
            <el-form 
              :model="form" 
              label-width="100px" 
              size="large"
              :disabled="loading || submitting"
              class="inventory-form"
            >
              <!-- 产品基本信息 -->
              <el-form-item label="手办产品" class="form-item" required>
                <div class="product-selection">
                  <el-select
                    v-model="form.productId"
                    placeholder="选择手办或手动输入"
                    filterable
                    clearable
                    allow-create
                    remote
                    :remote-method="loadProducts"
                    :loading="loading"
                    style="width: 100%"
                    @change="handleProductSelect(selectedProduct!)"
                  >
                    <el-option
                      v-for="product in filteredProducts"
                      :key="product.id"
                      :label="product.name"
                      :value="product.id.toString()"
                    >
                      <div class="product-option">
                        <span class="option-name">{{ product.name }}</span>
                        <div class="option-tags">
                          <span class="option-tag">{{ product.ip }}</span>
                          <span class="option-tag">{{ product.category }}</span>
                          <span class="option-tag">{{ product.scale }}</span>
                        </div>
                      </div>
                    </el-option>
                  </el-select>
                  
                  <!-- 手动输入模式 -->
                  <div v-if="!form.productId" class="manual-input-section">
                    <div class="manual-input-row">
                      <el-input
                        v-model="form.productName"
                        placeholder="输入手办名称"
                        clearable
                        class="manual-input"
                      />
                    </div>
                    
                    <div class="manual-input-row">
                      <el-select
                        v-model="form.ip"
                        placeholder="选择IP系列"
                        clearable
                        class="manual-select"
                      >
                        <el-option
                          v-for="ip in configOptions.ipList"
                          :key="ip"
                          :label="ip"
                          :value="ip"
                        />
                      </el-select>
                      
                      <el-select
                        v-model="form.category"
                        placeholder="选择品类"
                        clearable
                        class="manual-select"
                      >
                        <el-option
                          v-for="category in configOptions.categoryList"
                          :key="category"
                          :label="category"
                          :value="category"
                        />
                      </el-select>
                      
                      <el-select
                        v-model="form.scale"
                        placeholder="选择比例"
                        clearable
                        class="manual-select"
                      >
                        <el-option
                          v-for="scale in configOptions.scaleList"
                          :key="scale"
                          :label="scale"
                          :value="scale"
                        />
                      </el-select>
                    </div>
                  </div>
                </div>
                
                <!-- 已选产品信息 -->
                <div v-if="selectedProduct || form.productName" class="selected-product-info">
                  <el-card shadow="never" class="info-card">
                    <div class="info-content">
                      <div class="info-main">
                        <strong>{{ form.productName }}</strong>
                        <div class="info-tags">
                          <el-tag size="small">{{ form.ip }}</el-tag>
                          <el-tag size="small" type="success">{{ form.category }}</el-tag>
                          <el-tag size="small" type="info">{{ form.scale }}</el-tag>
                        </div>
                      </div>
                      <div class="info-price" v-if="selectedProduct?.price">
                        参考价格: ¥{{ selectedProduct.price.toLocaleString() }}
                      </div>
                    </div>
                  </el-card>
                </div>
              </el-form-item>

              <!-- 数量输入 -->
              <el-form-item label="入库数量" class="form-item" required>
                <div class="quantity-control">
                  <el-input-number
                    v-model="form.quantity"
                    :min="1"
                    :max="9999"
                    :step="1"
                    controls-position="right"
                    placeholder="输入数量"
                    class="quantity-input"
                  />
                  <div class="quantity-presets">
                    <el-button
                      v-for="num in [1, 5, 10, 50, 100]"
                      :key="num"
                      size="small"
                      @click="form.quantity = num"
                      :type="form.quantity === num ? 'primary' : ''"
                      class="preset-btn"
                    >
                      {{ num }} 件
                    </el-button>
                  </div>
                </div>
                
                <div v-if="selectedProduct" class="stock-preview">
                  <el-icon><Goods /></el-icon>
                  <span>
                    当前库存: <strong>{{ selectedProduct.stock || 0 }}</strong> 件
                    → 入库后: <strong class="total-stock">{{ (selectedProduct.stock || 0) + form.quantity }}</strong> 件
                  </span>
                </div>
              </el-form-item>

              <!-- 备注输入 -->
              <el-form-item label="入库备注" class="form-item">
                <el-input
                  v-model="form.remark"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入入库备注信息（如：版本、批次、供应商、到货状态等）"
                  maxlength="500"
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
                  :disabled="(!form.productId && !form.productName) || form.quantity <= 0"
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
          </div>

          <!-- Mock数据提示 -->
          <div class="mock-notice">
            <el-icon><Histogram /></el-icon>
            <span>基于Mock数据的本地化库存管理系统</span>
          </div>
        </el-card>
      </div>

      <!-- 右侧：入库记录和统计 -->
      <div class="records-section">
        <!-- 入库记录 -->
        <el-card shadow="hover" class="records-card">
          <template #header>
            <div class="records-header">
              <el-icon class="records-icon">
                <DocumentAdd />
              </el-icon>
              <span class="records-title">最近入库记录</span>
              <div class="header-actions">
                <el-button
                  type="primary"
                  size="small"
                  @click="exportRecords"
                  plain
                >
                  导出记录
                </el-button>
                <el-button
                  v-if="inventoryRecords.length > 0"
                  type="danger"
                  size="small"
                  @click="clearAllRecords"
                  plain
                >
                  清空记录
                </el-button>
              </div>
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
              v-for="(record, index) in inventoryRecords.slice(0, 10)" 
              :key="record.id || index"
              class="record-item"
              :class="{ 'new-record': index === 0 }"
            >
              <div class="record-main">
                <div class="record-header">
                  <span class="record-product">{{ record.productName }}</span>
                  <el-tag size="small" type="success" class="quantity-tag">
                    +{{ record.quantity }}
                  </el-tag>
                </div>
                <div class="record-meta">
                  <div class="meta-tags">
                    <el-tag size="small" type="info">{{ record.ip }}</el-tag>
                    <el-tag size="small">{{ record.category }}</el-tag>
                    <el-tag size="small" type="info">{{ record.scale }}</el-tag>
                  </div>
                  <div class="record-time">{{ record.createdAt }}</div>
                  <div v-if="record.remark" class="record-remark">
                    备注: {{ record.remark }}
                  </div>
                </div>
              </div>
              <el-button
                type="text"
                @click="deleteRecord(index)"
                class="delete-btn"
              >
                删除
              </el-button>
            </div>
          </div>
          
          <!-- 查看更多 -->
          <div v-if="inventoryRecords.length > 10" class="view-more">
            <el-button type="text" class="more-btn">
              查看更多记录 ({{ inventoryRecords.length - 10 }})
            </el-button>
          </div>
        </el-card>

        <!-- IP库存统计 -->
        <el-card shadow="hover" class="stats-card" v-if="Object.keys(inventoryStats).length > 0">
          <template #header>
            <div class="stats-header">
              <el-icon class="stats-icon">
                <TrendCharts />
              </el-icon>
              <span class="stats-title">IP库存统计</span>
            </div>
          </template>
          
          <div class="stats-list">
            <div 
              v-for="(stat, ip) in inventoryStats" 
              :key="ip"
              class="stat-item"
            >
              <div class="stat-header">
                <span class="stat-ip">{{ ip }}</span>
                <span class="stat-total">{{ stat.total }} 件</span>
              </div>
              
              <!-- 品类分布 -->
              <div class="stat-categories">
                <div 
                  v-for="(count, category) in stat.categories" 
                  :key="category"
                  class="category-item"
                >
                  <span class="category-label">{{ category }}</span>
                  <div class="category-bar">
                    <div 
                      class="bar-fill" 
                      :style="{ width: Math.min(count / stat.total * 100, 100) + '%' }"
                    ></div>
                    <span class="category-count">{{ count }}</span>
                  </div>
                </div>
              </div>
              
              <!-- 比例分布 -->
              <div class="stat-scales" v-if="Object.keys(stat.scales).length > 0">
                <el-tag
                  v-for="(count, scale) in stat.scales"
                  :key="scale"
                  size="small"
                  type="info"
                  class="scale-tag"
                >
                  {{ scale }}: {{ count }}
                </el-tag>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.figure-inventory-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f0f2f5 0%, #e4e7ed 100%);
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
  color: #ff6b6b;
  background: rgba(255, 107, 107, 0.1);
  padding: 12px;
  border-radius: 12px;
  font-size: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin: 0;
  background: linear-gradient(45deg, #ff6b6b, #f0b86e);
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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
  margin-top: 24px;
}

.stat-card {
  border-radius: 12px;
  border: none;
  transition: all 0.3s ease;
  background: white;
  
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
    color: #ff6b6b;
    background: rgba(255, 107, 107, 0.1);
  }
  
  &.records {
    color: #47b881;
    background: rgba(71, 184, 129, 0.1);
  }
  
  &.brands {
    color: #f0b86e;
    background: rgba(240, 184, 110, 0.1);
  }
  
  &.scales {
    color: #6c63ff;
    background: rgba(108, 99, 255, 0.1);
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
  grid-template-columns: 1fr 400px;
  gap: 24px;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
}

/* 表单区域 */
.form-card {
  border-radius: 16px;
  border: none;
  background: white;
  position: relative;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-bottom: 16px;
  border-bottom: 1px solid #f0f0f0;
}

.card-icon {
  color: #ff6b6b;
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
  font-weight: 500;
}

/* 产品筛选器 */
.product-filter {
  margin-bottom: 20px;
}

.filter-input {
  margin-bottom: 12px;
  
  :deep(.el-input__wrapper) {
    border-radius: 10px;
    border: 1px solid #e0e0e0;
    
    &:hover {
      border-color: #ff6b6b;
    }
  }
}

.filter-tags {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-select {
  flex: 1;
  min-width: 120px;
}

.reset-filter-btn {
  color: #ff6b6b;
  font-weight: 500;
}

/* 产品列表容器 */
.product-list-container {
  margin-bottom: 24px;
}

.loading-products {
  text-align: center;
  padding: 40px;
  color: #8c8c8c;
  
  .loading-icon {
    font-size: 40px;
    margin-bottom: 16px;
    animation: spin 1.5s linear infinite;
    color: #ff6b6b;
  }
}

.empty-products {
  text-align: center;
  padding: 40px;
  color: #8c8c8c;
  
  .empty-icon {
    font-size: 48px;
    color: #dcdfe6;
    margin-bottom: 16px;
  }
  
  .empty-tip {
    font-size: 12px;
    color: #b0b0b0;
    margin-top: 8px;
  }
}

/* 产品网格 */
.product-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.product-card {
  padding: 16px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  background: white;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
    border-color: #ff6b6b;
  }
  
  &.selected {
    border-color: #ff6b6b;
    background: rgba(255, 107, 107, 0.05);
    box-shadow: 0 4px 12px rgba(255, 107, 107, 0.15);
  }
}

.product-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.product-name {
  font-weight: 600;
  color: #2c3e50;
  font-size: 14px;
  line-height: 1.4;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.price-tag {
  margin-left: 8px;
  flex-shrink: 0;
  font-weight: 600;
}

.product-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.meta-tag {
  font-size: 11px;
  height: 20px;
}

.product-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stock-info {
  font-size: 12px;
  color: #8c8c8c;
}

.select-btn {
  padding: 4px 12px;
  font-size: 12px;
}

/* 入库表单 */
.inventory-form-wrapper {
  border-top: 1px solid #f0f0f0;
  padding-top: 24px;
}

.inventory-form {
  .form-item {
    margin-bottom: 24px;
  }
}

/* 产品选择区域 */
.product-selection {
  .manual-input-section {
    margin-top: 16px;
    padding: 16px;
    background: #f8f9fa;
    border-radius: 8px;
  }
  
  .manual-input-row {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
    margin-bottom: 12px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  .manual-input {
    width: 100%;
  }
  
  .manual-select {
    flex: 1;
  }
}

.product-option {
  .option-name {
    font-weight: 500;
    margin-bottom: 4px;
    display: block;
  }
  
  .option-tags {
    display: flex;
    gap: 6px;
  }
  
  .option-tag {
    font-size: 11px;
    color: #8c8c8c;
    background: #f0f0f0;
    padding: 2px 6px;
    border-radius: 4px;
  }
}

.selected-product-info {
  margin-top: 12px;
  
  .info-card {
    border: 1px solid #e8f4ff;
    background: #f0f9ff;
  }
  
  .info-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .info-main {
    flex: 1;
    
    strong {
      display: block;
      margin-bottom: 8px;
      color: #2c3e50;
    }
  }
  
  .info-tags {
    display: flex;
    gap: 6px;
  }
  
  .info-price {
    color: #ff6b6b;
    font-weight: 600;
    font-size: 14px;
  }
}

/* 数量控制 */
.quantity-control {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.quantity-input {
  width: 100%;
  
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

.stock-preview {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding: 10px 12px;
  background: #f8f9fa;
  border-radius: 8px;
  font-size: 13px;
  color: #606266;
  
  strong {
    color: #47b881;
    font-weight: 600;
  }
  
  .total-stock {
    color: #ff6b6b;
  }
}

/* 备注输入 */
.remark-input {
  :deep(.el-textarea__inner) {
    border-radius: 10px;
    border: 1px solid #dcdfe6;
    transition: all 0.3s;
    padding: 12px;
    font-size: 14px;
    
    &:focus {
      border-color: #ff6b6b;
      box-shadow: 0 0 0 3px rgba(255, 107, 107, 0.1);
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
    background: linear-gradient(45deg, #ff6b6b, #ff8e8e);
    border: none;
    transition: all 0.3s;
    
    &:not(:disabled):hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(255, 107, 107, 0.4);
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
.records-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.records-card,
.stats-card {
  border-radius: 16px;
  border: none;
  background: white;
}

.records-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.records-icon {
  color: #47b881;
  font-size: 20px;
}

.records-title {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
  flex: 1;
}

.header-actions {
  display: flex;
  gap: 8px;
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
  
  .empty-tip {
    font-size: 12px;
    color: #b0b0b0;
    margin-top: 8px;
  }
}

/* 记录列表 */
.records-list {
  max-height: 400px;
  overflow-y: auto;
  
  .record-item {
    padding: 16px;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    transition: background 0.2s;
    
    &:hover {
      background: #fafafa;
    }
    
    &:last-child {
      border-bottom: none;
    }
    
    &.new-record {
      background: rgba(255, 107, 107, 0.05);
      border-left: 4px solid #ff6b6b;
    }
  }
}

.record-main {
  flex: 1;
}

.record-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.record-product {
  font-weight: 500;
  color: #2c3e50;
  font-size: 14px;
}

.quantity-tag {
  font-weight: 600;
}

.record-meta {
  .meta-tags {
    display: flex;
    gap: 6px;
    margin-bottom: 6px;
    
    .el-tag {
      height: 22px;
      font-size: 11px;
    }
  }
  
  .record-time {
    font-size: 12px;
    color: #8c8c8c;
    margin-bottom: 4px;
  }
  
  .record-remark {
    font-size: 13px;
    color: #606266;
    background: #f8f9fa;
    padding: 4px 8px;
    border-radius: 4px;
    display: inline-block;
    max-width: 100%;
    word-break: break-all;
  }
}

.delete-btn {
  color: #f56c6c;
  opacity: 0;
  transition: opacity 0.2s;
  padding: 0;
  height: auto;
  
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
  color: #ff6b6b;
  font-size: 13px;
}

/* IP库存统计 */
.stats-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.stats-icon {
  color: #f0b86e;
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
    margin-bottom: 20px;
    padding-bottom: 16px;
    border-bottom: 1px solid #f0f0f0;
    
    &:last-child {
      margin-bottom: 0;
      padding-bottom: 0;
      border-bottom: none;
    }
  }
}

.stat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.stat-ip {
  font-weight: 600;
  color: #2c3e50;
  font-size: 15px;
}

.stat-total {
  color: #ff6b6b;
  font-weight: 600;
  font-size: 14px;
}

.stat-categories {
  .category-item {
    margin-bottom: 8px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
}

.category-label {
  display: block;
  font-size: 12px;
  color: #606266;
  margin-bottom: 4px;
}

.category-bar {
  height: 20px;
  background: #f0f0f0;
  border-radius: 10px;
  position: relative;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #47b881, #a0d911);
  border-radius: 10px;
  transition: width 1s ease;
}

.category-count {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  font-weight: 600;
  color: #2c3e50;
}

.stat-scales {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.scale-tag {
  font-size: 11px;
  height: 20px;
}

/* 动画效果 */
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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

.success-pulse {
  animation: successPulse 1s ease;
}

@keyframes successPulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .figure-inventory-page {
    padding: 12px;
  }
  
  .page-title {
    font-size: 22px;
  }
  
  .stats-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .content-wrapper {
    gap: 16px;
  }
  
  .product-grid {
    grid-template-columns: 1fr;
  }
  
  .form-actions {
    flex-direction: column;
    
    .el-button {
      width: 100%;
      margin-left: 0 !important;
    }
  }
  
  .records-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
    
    .header-actions {
      width: 100%;
      justify-content: flex-end;
    }
  }
  
  .info-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
</style>
