<script setup lang="ts">
/**
 * 设备共享调度平台 —— 第一个页面
 *
 * 这个文件用到的 Vue3 概念只有 9 个，逐个对应下面的注释标记：
 *  ① script setup      ② ref()      ③ computed()
 *  ④ {{ }} 插值        ⑤ v-for      ⑥ v-if
 *  ⑦ :class 动态类     ⑧ @click 事件 ⑨ v-model 双向绑定
 *
 * 第 3 周引入 Element Plus 后，这些手写卡片会被 el-card / el-table 替换，
 * 但下面这块业务逻辑一行都不用改。
 */

import { computed, ref } from 'vue'
import DeviceCard from '@/components/DeviceCard.vue'
import BookingItem from '@/components/BookingItem.vue'
import { devices as mockDevices, bookings as mockBookings, currentUser } from '@/mock'
import { DEVICE_STATUS_TEXT, ROLE_TEXT } from '@/types'
import type { Booking, Device, DeviceStatus, TimeRange } from '@/types'
import { findConflicts, formatRange, getTransitionError, validateTimeRange } from '@/utils/booking'

// ============ ② ref()：声明响应式数据，改它页面自动刷新 ============

/** 设备列表（真实项目里从接口拿） */
const devices = ref<Device[]>(mockDevices)
/** 所有预约单 */
const bookings = ref<Booking[]>(mockBookings)
/** 当前选中的设备 id */
const selectedDeviceId = ref<string>('d002')
/** 状态筛选，'' 表示全部 */
const filterStatus = ref<DeviceStatus | ''>('')

/** 预约草稿：日期 + 开始小时 + 持续时长 */
const draftDate = ref('2026-11-03')
const draftStartHour = ref(10)
const draftDuration = ref(2)

// ============ ③ computed()：由别的数据推导出来，会自动缓存 ============

/** 筛选后的设备列表 */
const filteredDevices = computed(() => {
  if (filterStatus.value === '') return devices.value
  return devices.value.filter((d) => d.status === filterStatus.value)
})

/** 当前选中的设备对象 */
const selectedDevice = computed(
  () => devices.value.find((d) => d.id === selectedDeviceId.value) ?? null
)

/** 选中设备的预约单（排除已驳回/已归还的，它们不占用时段） */
const bookingsOfSelected = computed(() =>
  bookings.value.filter(
    (b) =>
      b.deviceId === selectedDeviceId.value &&
      b.status !== 'rejected' &&
      b.status !== 'returned'
  )
)

/** 草稿时段，拼成 TimeRange 结构 */
const draftRange = computed<TimeRange>(() => {
  const pad = (n: number) => String(n).padStart(2, '0')
  const start = `${draftDate.value}T${pad(draftStartHour.value)}:00:00`
  const end = `${draftDate.value}T${pad(draftStartHour.value + draftDuration.value)}:00:00`
  return { startTime: start, endTime: end }
})

/**
 * 冲突检测结果 —— 这是本页的核心，也是整个项目的技术亮点。
 *
 * 它复用的就是 src/utils/booking.ts 里那两个纯函数，
 * 和框架无关，将来搬到 Node 服务端一行不用改。
 */
const draftCheck = computed(() => {
  const device = selectedDevice.value
  if (!device) return null

  // 先查时段本身是否合法（结束晚于开始、不超单日上限）
  const rangeError = validateTimeRange(draftRange.value, device.maxHoursPerDay)
  // 再查与已有预约是否重叠
  const conflicts = findConflicts(draftRange.value, bookingsOfSelected.value)

  return {
    rangeError,
    conflicts,
    canSubmit: rangeError === null && conflicts.length === 0,
  }
})

// ============ ⑧ 事件处理 ============

function selectDevice(id: string) {
  selectedDeviceId.value = id
}

function setFilter(status: DeviceStatus | '') {
  filterStatus.value = status
}

/**
 * 取消预约。
 *
 * 注意这里没有直接改状态，而是先调 getTransitionError 问一句"这个流转允许吗"。
 * 这就是状态机在真实代码里的作用 —— 它不是一个画在图上的框，
 * 而是一个每次修改状态前都要过的检查。
 */
function cancelBooking(id: string) {
  const target = bookings.value.find((b) => b.id === id)
  if (!target) return
  if (getTransitionError(target.status, 'rejected')) return
  target.status = 'rejected'
}

const statusOptions: { label: string; value: DeviceStatus | '' }[] = [
  { label: '全部', value: '' },
  { label: DEVICE_STATUS_TEXT.idle, value: 'idle' },
  { label: DEVICE_STATUS_TEXT.in_use, value: 'in_use' },
  { label: DEVICE_STATUS_TEXT.maintenance, value: 'maintenance' },
]
</script>

<template>
  <div class="page">
    <header class="header">
      <div>
        <h1>设备共享调度平台</h1>
        <p class="sub">时段冲突并发控制 · 审批状态机 · RBAC 权限</p>
      </div>
      <div class="user">
        <span class="name">{{ currentUser.name }}</span>
        <span class="role">{{ ROLE_TEXT[currentUser.role] }}</span>
      </div>
    </header>

    <section class="panel">
      <div class="filters">
        <button
          v-for="opt in statusOptions"
          :key="opt.value"
          class="chip"
          :class="{ active: filterStatus === opt.value }"
          @click="setFilter(opt.value)"
        >
          {{ opt.label }}
        </button>
      </div>

      <div class="grid">
        <DeviceCard
          v-for="d in filteredDevices"
          :key="d.id"
          :device="d"
          :selected="d.id === selectedDeviceId"
          @select="selectDevice"
        />
      </div>
    </section>

    <section v-if="selectedDevice" class="panel">
      <h2>{{ selectedDevice.name }} 的预约记录</h2>

      <div v-if="bookingsOfSelected.length > 0" class="timeline">
        <BookingItem
          v-for="b in bookingsOfSelected"
          :key="b.id"
          :booking="b"
          @cancel="cancelBooking"
        />
      </div>
      <p v-else class="empty">该设备暂无生效中的预约</p>

      <div class="draft">
        <h3>模拟一次新预约（实时冲突检测）</h3>
        <div class="draft-form">
          <label>
            开始时间
            <select v-model="draftStartHour">
              <option v-for="h in 11" :key="h" :value="h + 7">{{ h + 7 }}:00</option>
            </select>
          </label>
          <label>
            时长
            <select v-model="draftDuration">
              <option :value="1">1 小时</option>
              <option :value="2">2 小时</option>
              <option :value="3">3 小时</option>
              <option :value="4">4 小时</option>
            </select>
          </label>
        </div>

        <div v-if="draftCheck" class="result" :class="draftCheck.canSubmit ? 'ok' : 'no'">
          <template v-if="draftCheck.rangeError">
            ✗ {{ draftCheck.rangeError }}
          </template>
          <template v-else-if="draftCheck.conflicts.length > 0">
            ✗ 与以下 {{ draftCheck.conflicts.length }} 条预约时段冲突：
            <span v-for="c in draftCheck.conflicts" :key="c.id">{{ formatRange(c) }}</span>
          </template>
          <template v-else>
            ✓ 时段可用，可提交预约
          </template>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
* {
  box-sizing: border-box;
}
.page {
  max-width: 1080px;
  margin: 0 auto;
  padding: 24px 20px 60px;
  font-family: system-ui, -apple-system, 'Microsoft YaHei', sans-serif;
  color: #1f2329;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid #e5e6eb;
}
h1 {
  margin: 0;
  font-size: 22px;
}
.sub {
  margin: 4px 0 0;
  font-size: 13px;
  color: #86909c;
}
.user {
  display: flex;
  align-items: center;
  gap: 8px;
}
.user .name {
  font-weight: 600;
}
.user .role {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
  background: #e8f3ff;
  color: #1664ff;
}
.panel {
  margin-top: 24px;
}
h2 {
  font-size: 16px;
  margin: 0 0 12px;
}
h3 {
  font-size: 14px;
  margin: 0 0 10px;
}
.filters {
  display: flex;
  gap: 8px;
  margin-bottom: 14px;
}
.chip {
  padding: 5px 14px;
  border: 1px solid #e5e6eb;
  background: #fff;
  border-radius: 14px;
  cursor: pointer;
  font-size: 13px;
  color: #4e5969;
}
.chip.active {
  background: #1664ff;
  border-color: #1664ff;
  color: #fff;
}
.grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 12px;
}
.timeline {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.empty {
  font-size: 13px;
  color: #86909c;
}
.draft {
  margin-top: 20px;
  padding: 16px;
  border: 1px dashed #e5e6eb;
  border-radius: 8px;
}
.draft-form {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #4e5969;
}
.draft-form label {
  display: flex;
  align-items: center;
  gap: 6px;
}
select {
  padding: 4px 8px;
  border: 1px solid #e5e6eb;
  border-radius: 4px;
  font-size: 13px;
}
.result {
  margin-top: 12px;
  padding: 10px 12px;
  border-radius: 6px;
  font-size: 13px;
}
.result.ok {
  background: #e8ffea;
  color: #00b42a;
}
.result.no {
  background: #ffece8;
  color: #f53f3f;
}
</style>
