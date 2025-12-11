<!-- src/views/ProductAdd.vue -->
<template>
  <div class="page-container">
    <el-card class="box-card" v-loading="loadingConfig">
      <template #header>
        <div class="card-header">
          <span>✨ 新增手办入库</span>
          <el-button link type="primary" @click="$router.back()">返回列表</el-button>
        </div>
      </template>

      <el-form ref="formRef" :model="form" :rules="rules" label-width="100px" size="large">
        <!-- 1. 手办名称 -->
        <el-form-item label="手办名称" prop="name">
          <el-input v-model="form.name" placeholder="例如：曼波·舞台Ver." />
        </el-form-item>

        <!-- 2. 所属 IP (动态渲染 Mock 里的数据) -->
        <el-form-item label="所属 IP" prop="ip">
          <el-select v-model="form.ip" placeholder="请选择 IP 系列" style="width: 100%">
            <!-- 遍历 options.ipList -->
            <el-option v-for="item in options.ipList" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>

        <div class="form-row">
          <!-- 3. 品类 (动态渲染 Mock 里的数据) -->
          <el-form-item label="产品品类" prop="category" style="flex: 1; margin-right: 20px">
            <el-select v-model="form.category" placeholder="选择材质">
              <!-- 遍历 options.categoryList -->
              <el-option
                v-for="item in options.categoryList"
                :key="item"
                :label="item"
                :value="item"
              />
            </el-select>
          </el-form-item>

          <!-- 4. 比例 (动态渲染 Mock 里的数据) -->
          <el-form-item label="比例规格" prop="scale" style="flex: 1">
            <el-radio-group v-model="form.scale">
              <el-radio-button v-for="s in options.scaleList" :key="s" :value="s" :label="s">
                {{ s }}
              </el-radio-button>
            </el-radio-group>
          </el-form-item>
        </div>

        <el-form-item label="预售价(元)" prop="price">
          <el-input-number v-model="form.price" :min="0" :step="100" />
        </el-form-item>

        <el-form-item label="入库数量" prop="stock">
          <el-input-number v-model="form.stock" :min="1" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="onSubmit" :loading="submitting">立即发布</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue'
import axios from 'axios'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()
const formRef = ref(null)
const loadingConfig = ref(false) // 加载下拉选项的 loading
const submitting = ref(false) // 提交按钮的 loading

// 1. 定义存储下拉选项的变量
const options = reactive({
  ipList: [], // 等待从 Mock 获取 ['曼波', '耄耋'...]
  categoryList: [], // 等待从 Mock 获取 ['PVC', 'GK'...]
  scaleList: [],
})

// 表单数据
const form = reactive({
  name: '',
  ip: '',
  category: '',
  scale: '',
  price: 599,
  stock: 50,
})

const rules = {
  name: [{ required: true, message: '必填', trigger: 'blur' }],
  ip: [{ required: true, message: '必选', trigger: 'change' }],
  category: [{ required: true, message: '必选', trigger: 'change' }],
}

// 2. 核心逻辑：去后端(Mock)拿字典数据
const fetchConfig = async () => {
  loadingConfig.value = true
  try {
    const res = await axios.get('/api/config/options')
    // 将 Mock 返回的数组填入本地变量
    // 注意：axios 返回的数据结构是 res.data，mock 的数据结构在里面
    // 如果你的 mock 直接返回对象，可能是 res.data.data，视具体拦截情况而定
    // 这里假设 mock 返回的是 { code: 200, data: { ... } }
    const data = res.data.data || res.data

    options.ipList = data.ipList
    options.categoryList = data.categoryList
    options.scaleList = data.scaleList

    // 默认选中比例的第一个
    if (options.scaleList.length > 0) {
      form.scale = options.scaleList[0]
    }
  } catch (error) {
    ElMessage.error('无法加载配置项，请检查 Mock')
  } finally {
    loadingConfig.value = false
  }
}

// 提交逻辑
const onSubmit = async () => {
  if (!formRef.value) return
  await formRef.value.validate(async (valid) => {
    if (valid) {
      submitting.value = true
      try {
        await axios.post('/api/inventory/add', form)
        setTimeout(() => {
          ElMessage.success('添加成功')
          router.push('/products')
        }, 500)
      } finally {
        submitting.value = false
      }
    }
  })
}

const resetForm = () => formRef.value.resetFields()

// 3. 页面加载完毕后，立即调用
onMounted(() => {
  fetchConfig()
})
</script>

<style scoped>
.page-container {
  padding: 20px;
  display: flex;
  justify-content: center;
}
.box-card {
  width: 100%;
  max-width: 800px;
}
.form-row {
  display: flex;
  gap: 20px;
}
</style>
