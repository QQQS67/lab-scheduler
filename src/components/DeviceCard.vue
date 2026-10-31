<script setup lang="ts">
/**
 * 设备卡片组件 —— 从 App.vue 里拆出来的第一个子组件
 *
 * 这个文件引入两个新概念：
 *  ⑩ defineProps()：声明父组件传进来的数据（只读，不要直接改）
 *  ⑪ defineEmits()：声明要抛给父组件的事件
 *
 * 为什么要拆：App.vue 已经 300 行，所有逻辑堆在一起。
 * 拆分的判断标准不是"行数多"，而是"这段 UI 有自己的数据和行为"。
 * 设备卡片有独立的样式和点击行为，就该独立。
 */

import { DEVICE_STATUS_TEXT } from '@/types'
import type { Device } from '@/types'

// 声明入参。注意：这里不写 const props = ，因为模板里可以直接用 device / selected
defineProps<{
  device: Device
  selected: boolean
}>()

// 声明事件。写法是 Vue 3.3+ 的类型化语法：事件名: [参数类型...]
const emit = defineEmits<{
  select: [id: string]
}>()
</script>

<template>
  <div class="card" :class="{ selected }" @click="emit('select', device.id)">
    <div class="card-head">
      <span class="card-name">{{ device.name }}</span>
      <span class="badge" :class="'s-' + device.status">
        {{ DEVICE_STATUS_TEXT[device.status] }}
      </span>
    </div>
    <div class="card-meta">
      <span>{{ device.serialNo }}</span>
      <span>{{ device.location }}</span>
    </div>
    <div class="card-meta">
      <span>单次上限 {{ device.maxHoursPerDay }}h</span>
    </div>
  </div>
</template>

<style scoped>
.card {
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  padding: 14px;
  cursor: pointer;
  background: #fff;
  transition: border-color 0.15s;
}
.card:hover {
  border-color: #94bfff;
}
.card.selected {
  border-color: #1664ff;
  box-shadow: 0 0 0 2px rgba(22, 100, 255, 0.1);
}
.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.card-name {
  font-weight: 600;
  font-size: 15px;
}
.card-meta {
  display: flex;
  gap: 10px;
  font-size: 12px;
  color: #86909c;
  margin-top: 6px;
}
.badge {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
}
.s-idle {
  background: #e8ffea;
  color: #00b42a;
}
.s-in_use {
  background: #e8f3ff;
  color: #1664ff;
}
.s-maintenance {
  background: #fff3e8;
  color: #ff7d00;
}
</style>
