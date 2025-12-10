import type { Component } from "vue"

// src/types/index.ts
export interface ShortcutItem {
  name: string
  icon: Component
  path: string
}

export interface DynamicItem {
  time: string
  desc: string
}

export interface GradeDistributionItem {
  name: string
  value: number
}

export interface StudentTrendItem {
  month: string
  count: number
}
