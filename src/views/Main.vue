<template>
  <el-row class="tac" :gutter="0">
    <el-col :span="3.5" class="menu-col">
      <el-menu
        active-text-color="#ffd04b"
        background-color="#545c64"
        class="el-menu-vertical-demo"
        default-active="1"
        text-color="#fff"
        @open="handleOpen"
        @close="handleClose"

        >
        <el-menu-item index="1">
          <el-icon><HomeFilled /></el-icon>
          <span>
            <router-link to="/main/home">首页</router-link>
          </span>
        </el-menu-item>
        

        <el-sub-menu index="2">
          <template #title>
            <el-icon><DataLine /></el-icon>
            <span>数据管理  </span>
          </template>
          <el-menu-item index="2-1">
            <router-link to="/main/dailyreport">日报表</router-link>
          </el-menu-item>
          <el-menu-item index="2-2">
            <router-link to="/main/monthlyreport">月报表</router-link>
          </el-menu-item>
          <el-menu-item index="2-3">
            <router-link to="/main/quarterlyreport">季度报表</router-link>
          </el-menu-item>
          <el-menu-item index="2-4">
            <router-link to="/main/annualreport">年度报表</router-link>
          </el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="3">
          <template #title>
            <el-icon><Files /></el-icon>
            <span>产品管理</span>
          </template>
          <el-menu-item index="3-1">
            <router-link to="/main/productlist">产品列表</router-link>
          </el-menu-item>
          <el-menu-item index="3-2">
            <router-link to="/main/productadd">品类新增</router-link>
          </el-menu-item>
          <el-menu-item index="3-3">
            <router-link to="/main/inventoryadd">添加库存</router-link>
          </el-menu-item>
          <el-menu-item index="3-4">
            <router-link to="/main/productrevenue">产品营收</router-link>
          </el-menu-item>          
        </el-sub-menu>
        
        <el-sub-menu index="4">
          <template #title>
            <el-icon><GoodsFilled /></el-icon>
            <span>订单管理</span>
          </template>
          <el-menu-item index="4-1">
            <router-link to="/main/orderlist">订单列表</router-link>
          </el-menu-item>
          <el-menu-item index="4-2">
            <router-link to="/main/orderdetail">订单详情</router-link>
          </el-menu-item>       
        </el-sub-menu>
        <el-menu-item index="5">
          <el-icon><UserFilled /></el-icon>
          <span>
            <router-link to="/main/profile">个人中心</router-link>
          </span>
        </el-menu-item>
        <el-menu-item index="6">
          <el-icon><SwitchButton /></el-icon>
          <span><router-link to="/">退出</router-link></span>
        </el-menu-item>

        <el-menu-item index="7">
          <el-icon><Position /></el-icon>
          <span><router-link to="/main/test00">测试</router-link></span>
        </el-menu-item>
      
      </el-menu>
    </el-col>
    <div class="main-content">
      <router-view /> 
    </div>
  </el-row>
</template>
<script lang="ts">
import { defineComponent,ref } from "vue"



export default defineComponent({
  name: "main",
  setup () {
    const handleOpen = (key: string, keyPath: string[]) => {
    console.log(key, keyPath)
  }
    const handleClose = (key: string, keyPath: string[]) => {
    console.log(key, keyPath)
  }
    
  return {
    handleOpen,
    handleClose,
  }
  }
})


</script>
<style>
/* 修改原有的.el-menu-vertical-demo样式 */
.el-menu-vertical-demo:not(.el-menu--collapse) {
  width: 200px;
  height: 100vh; /* 固定高度为视口高度 */
  overflow-y: auto; /* 内容超出时显示垂直滚动条 */
  box-sizing: border-box; /* 确保padding不影响总高度计算 */
}
/* 新增固定菜单样式 */
.menu-col {
  position: fixed; /* 固定定位 */
  top: 0;
  left: 0;
  height: 100vh; /* 占满整个视口高度 */
  z-index: 10; /* 确保在内容上方 */
}
/* 调整主内容区位置，避免被菜单遮挡 */
.main-content {
  margin-left: 200px; /* 与菜单宽度一致 */
  flex: 1;
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}
/* 优化滚动条样式（可选） */
.el-menu-vertical-demo::-webkit-scrollbar {
  width: 6px;
}
/* 在Main.vue的style中添加以下样式 */
.el-menu-vertical-demo {
  /* 确保父菜单高度正确计算 */
  display: flex;
  flex-direction: column;
}

/* 子菜单容器样式 */
.el-sub-menu .el-sub-menu__content {
  /* 子菜单内容区域占满剩余高度 */
  height: calc(100% - 40px); /* 40px为父菜单项高度，可根据实际调整 */
  overflow-y: auto; /* 子菜单内容超出时滚动 */
}

/* 优化子菜单滚动条 */
.el-sub-menu__content::-webkit-scrollbar {
  width: 6px;
}
/* 确保子菜单项高度一致 */
.el-menu-item {
  height: 50px !important; /* 统一菜单项高度 */
  line-height: 50px !important;
}
.el-menu-vertical-demo::-webkit-scrollbar-thumb {
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.el-menu-vertical-demo::-webkit-scrollbar-track {
  background-color: transparent;
}

/* 统一链接样式 */
.el-menu a {
  color: inherit; /* 继承父元素颜色 */
  text-decoration: none;
  transition: var(--transition-base);
}

.el-menu a:hover {
  color: var(--vt-c-primary); /*  hover时使用主色 */
}

#app {
  border: none !important;
}

/* 主内容区布局优化 */
.el-row.tac {
  display: flex;
  min-height: 100vh;
}

.el-row.tac > div:not(.el-col) {
  flex: 1;
  padding: 20px;
  background-color: #f5f7fa;
}
</style>

