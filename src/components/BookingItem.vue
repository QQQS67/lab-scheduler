<script setup lang="ts">
/**
 * 预约条目组件 —— 第二个子组件范例
 *
 * 相比 DeviceCard.vue，这里多了一个新概念：
 *  ⑫ v-if 的第二种用法：控制某个元素出不出现（这里控制"取消"按钮）
 *
 * props 和 emit 的概念和 DeviceCard 完全一样，只是数据类型换成了 Booking。
 */

import { BOOKING_STATUS_TAG, BOOKING_STATUS_TEXT } from '@/types'
import type { Booking } from '@/types'
import { formatRange } from '@/utils/booking'

defineProps<{
  booking: Booking
}>()

const emit = defineEmits<{
  cancel: [id: string]
}>()

/**
 * 只有"待审批"和"已通过"的预约能取消。
 * 已经借出、归还、驳回的都不行 —— 这就是状态机在 UI 上的体现。
 */
function canCancel(status: Booking['status']): boolean {
  return status === 'pending' || status === 'approved'
}
</script>

<template>
  <div class="tl-item">
    <span class="badge" :class="'tag-' + BOOKING_STATUS_TAG[booking.status]">
      {{ BOOKING_STATUS_TEXT[booking.status] }}
    </span>
    <span class="tl-time">{{ formatRange(booking) }}</span>
    <span class="tl-reason">{{ booking.reason }}</span>

    <button v-if="canCancel(booking.status)" class="cancel" @click="emit('cancel', booking.id)">
      取消
    </button>
  </div>
</template>

<style scoped>
.tl-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #f7f8fa;
  border-radius: 6px;
  font-size: 13px;
}
.badge {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  white-space: nowrap;
}
.tag-success {
  background: #e8ffea;
  color: #00b42a;
}
.tag-warning {
  background: #fff3e8;
  color: #ff7d00;
}
.tag-danger {
  background: #ffece8;
  color: #f53f3f;
}
.tag-info {
  background: #f2f3f5;
  color: #4e5969;
}
.tl-time {
  font-variant-numeric: tabular-nums;
  color: #1f2329;
}
.tl-reason {
  color: #86909c;
  flex: 1;
}
.cancel {
  padding: 3px 10px;
  font-size: 12px;
  border: 1px solid #f53f3f;
  background: #fff;
  color: #f53f3f;
  border-radius: 4px;
  cursor: pointer;
}
.cancel:hover {
  background: #ffece8;
}
</style>
