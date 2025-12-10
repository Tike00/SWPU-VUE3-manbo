import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'login',
      component: Login,
    },
    {
      path: '/main',
      name: 'mian',
      component: () => import('../views/Main.vue'),
      children: [
        {
          path: '/main/home',
          name: 'home',
          component: () => import('../views/home/Home.vue'),
        },
        {
          path: '/main/profile',
          name: 'profile',
          component: () => import('../views/profile/Profile.vue'),
        },
        {
          path: '/main/dailyreport',
          name: 'dailyreport',
          component: () => import('../views/data-management/DailyReport.vue'),
        },
        {
          path: '/main/monthlyreport',
          name: 'monthlyreport',
          component: () => import('../views/data-management/MonthlyReport.vue'),
        },
        {
          path: '/main/quarterlyreport',
          name: 'quarterlyreport',
          component: () => import('../views/data-management/QuarterlyReport.vue'),
        },
        {
          path: '/main/annualreport',
          name: 'annualreport',
          component: () => import('../views/data-management/AnnualReport.vue'),
        },
        {
          path: '/main/productlist',
          name: 'productlist',
          component: () => import('../views/product/ProductList.vue'),
        },
        {
          path: '/main/productadd',
          name: 'productadd',
          component: () => import('../views/product/ProductAdd.vue'),
        },
        {
          path: '/main/productrevenue',
          name: 'productrevenue',
          component: () => import('../views/product/ProductRevenue.vue'),
        },
        {
          path: '/main/inventoryadd',
          name: 'inventoryadd',
          component: () => import('../views/product/InventoryAdd.vue'),
        },
        {
          path: '/main/orderdetail',
          name: 'orderdetail',
          component: () => import('../views/order/OrderDetail.vue'),
        },
        {
          path: '/main/orderlist',
          name: 'orderlist',
          component: () => import('../views/order/OrderList.vue'),
        },
      ]
    },
  ],
})

export default router
