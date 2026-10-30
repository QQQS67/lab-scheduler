/**
 * Mock 数据 —— 在第 5–6 周后端写好后，这一整个文件会被真实接口替换掉。
 *
 * 先用 mock 的意义：让你在做前端时不阻塞在接口上，
 * 同时倒逼你先把「前端需要什么字段」想清楚，这反过来就是接口设计。
 */

import type { Booking, Device, User } from '@/types'
import { BOOKING_STATUS_TEXT, DEVICE_STATUS_TEXT } from '@/types'

/** 当前登录用户，模拟已登录状态 */
export const currentUser: User = {
  id: 'u001',
  name: '张三',
  studentNo: '2024030101',
  role: 'student',
  phone: '13800001111',
}

export const devices: Device[] = [
  {
    id: 'd001',
    name: '数字示波器',
    serialNo: 'SN-OSC-001',
    category: '电子测量',
    location: '实验楼 A302',
    status: 'idle',
    maxHoursPerDay: 4,
    createdAt: '2026-09-01T08:00:00',
  },
  {
    id: 'd002',
    name: '信号发生器',
    serialNo: 'SN-SIG-002',
    category: '电子测量',
    location: '实验楼 A302',
    status: 'in_use',
    maxHoursPerDay: 6,
    createdAt: '2026-09-01T08:00:00',
  },
  {
    id: 'd003',
    name: '恒温磁力搅拌器',
    serialNo: 'SN-MAG-003',
    category: '化学仪器',
    location: '实验楼 B105',
    status: 'idle',
    maxHoursPerDay: 8,
    createdAt: '2026-09-12T08:00:00',
  },
  {
    id: 'd004',
    name: '离心机',
    serialNo: 'SN-CEN-004',
    category: '化学仪器',
    location: '实验楼 B105',
    status: 'maintenance',
    maxHoursPerDay: 3,
    createdAt: '2026-08-20T08:00:00',
  },
  {
    id: 'd005',
    name: '电子天平',
    serialNo: 'SN-BAL-005',
    category: '精密称量',
    location: '实验楼 A201',
    status: 'idle',
    maxHoursPerDay: 2,
    createdAt: '2026-09-15T08:00:00',
  },
]

export const bookings: Booking[] = [
  {
    id: 'b001',
    deviceId: 'd002',
    userId: 'u002',
    startTime: '2026-11-03T09:00:00',
    endTime: '2026-11-03T12:00:00',
    status: 'approved',
    reason: '课程设计：信号采集实验',
    approverId: 'u003',
    approveRemark: '同意',
    createdAt: '2026-10-28T10:00:00',
  },
  {
    id: 'b002',
    deviceId: 'd001',
    userId: 'u001',
    startTime: '2026-11-03T14:00:00',
    endTime: '2026-11-03T16:00:00',
    status: 'pending',
    reason: '毕业设计前期验证',
    approverId: null,
    approveRemark: null,
    createdAt: '2026-10-29T15:30:00',
  },
  {
    id: 'b003',
    deviceId: 'd003',
    userId: 'u002',
    startTime: '2026-11-04T08:00:00',
    endTime: '2026-11-04T18:00:00',
    status: 'borrowed',
    reason: '样品恒温反应',
    approverId: 'u003',
    approveRemark: '注意温度设定',
    createdAt: '2026-10-27T09:00:00',
  },
]

/** 方便调试时在控制台查看文案映射是否完整 */
export const dictionaries = { BOOKING_STATUS_TEXT, DEVICE_STATUS_TEXT }
