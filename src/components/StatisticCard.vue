<template>
  <div class="statistic-card">
    <div class="card-content">
      <div class="card-icon" :class="iconColor">
        <component :is="icon" />
      </div>
      <div class="card-info">
        <p class="card-label">{{ data.label }}</p>
        <p class="card-value">{{ data.value }}</p>
        <p class="card-growth">{{ data.growth }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps } from 'vue'
import type { Component } from 'vue'

// 定义组件接收的props类型
const props = defineProps<{
  data: {
    label: string
    value: number | string
    growth: string
  }
  icon: Component
  iconColor: 'blue-icon' | 'green-icon' | 'orange-icon'
}>()
</script>

<style scoped>
.statistic-card {
  height: 100%;
  background-color: #fff;
  border-radius: var(--radius-base);
  box-shadow: var(--shadow-base);
  padding: 15px;
}

.card-content {
  display: flex;
  align-items: center;
  padding: 15px 0;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
}

.blue-icon {
  background-color: #e8f3ff;
  color: var(--vt-c-primary);
}

.green-icon {
  background-color: #e6f7ef;
  color: var(--vt-c-success);
}

.orange-icon {
  background-color: #fff7e6;
  color: var(--vt-c-warning);
}

.card-info {
  flex: 1;
}

.card-label {
  font-size: 14px;
  color: var(--vt-c-text-secondary);
  margin-bottom: 4px;
}

.card-value {
  font-size: 28px;
  font-weight: 600;
  color: var(--vt-c-text-light);
  margin-bottom: 4px;
}

.card-growth {
  font-size: 12px;
  color: var(--vt-c-success);
}
</style>