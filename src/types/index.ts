/**
 * 设备共享调度平台 —— 全局类型定义
 *
 * 这些类型不是语法练习：第 3 周它们会直接变成 MySQL 表结构。
 * 「类型定义即数据库设计」
 */

// ============ 枚举替代：字面量联合类型 ============

/** 设备状态 */
export type DeviceStatus = 'idle' | 'in_use' | 'maintenance' | 'retired'

/** 预约单状态（状态机的节点） */
export type BookingStatus =
  | 'pending' // 待审批
  | 'approved' // 已通过
  | 'borrowed' // 已借出
  | 'returned' // 已归还
  | 'overdue' // 逾期
  | 'rejected' // 已驳回

/** 用户角色（RBAC 权限模型） */
export type UserRole = 'student' | 'teacher' | 'admin'

/** 时间区间，时段冲突检测的入参结构 */
export interface TimeRange {
  startTime: string
  endTime: string
}

// ============ 实体类型 ============

export interface Device {
  id: string
  name: string
  /** 设备编号，全局唯一，用于扫码识别 */
  serialNo: string
  category: string
  location: string
  status: DeviceStatus
  /** 每日可预约的最大时长（小时），用于限制长时间占用 */
  maxHoursPerDay: number
  createdAt: string
}

export interface User {
  id: string
  name: string
  studentNo: string
  role: UserRole
  phone: string
}

export interface Booking {
  id: string
  deviceId: string
  userId: string
  /** ISO 时间字符串，例如 2026-11-03T09:00:00 */
  startTime: string
  endTime: string
  status: BookingStatus
  /** 申请理由 */
  reason: string
  /** 审批人 id，学生直接预约通过后为 null */
  approverId: string | null
  /** 审批意见，驳回时必填 */
  approveRemark: string | null
  createdAt: string
}

// ============ 接口通信的统一结构 ============

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

export interface PageResult<T> {
  list: T[]
  total: number
  page: number
  pageSize: number
}

// ============ DTO：从实体类型派生，避免手写重复字段 ============

/** 新增预约时，id / 状态 / 审批信息由服务端生成，前端不许传 */
export type CreateBookingDto = Omit<
  Booking,
  'id' | 'status' | 'approverId' | 'approveRemark' | 'createdAt'
>

/** 更新预约时，所有字段可选（PATCH 语义） */
export type UpdateBookingDto = Partial<Pick<Booking, 'startTime' | 'endTime' | 'reason'>>

/** 审批动作：只允许改状态和意见，不允许偷偷改时间段 */
export type ApproveDto = Pick<Booking, 'status'> & { remark: string }

/** 列表页只需要几个字段，别把整张表的数据传给前端 */
export type DeviceBrief = Pick<Device, 'id' | 'name' | 'serialNo' | 'status' | 'location'>

// ============ 字典映射（Record 保证穷尽，漏一个就编译报错） ============

export const DEVICE_STATUS_TEXT: Record<DeviceStatus, string> = {
  idle: '空闲',
  in_use: '使用中',
  maintenance: '维修中',
  retired: '已报废',
}

export const BOOKING_STATUS_TEXT: Record<BookingStatus, string> = {
  pending: '待审批',
  approved: '已通过',
  borrowed: '已借出',
  returned: '已归还',
  overdue: '逾期',
  rejected: '已驳回',
}

export const ROLE_TEXT: Record<UserRole, string> = {
  student: '学生',
  teacher: '教师',
  admin: '管理员',
}

/** 列表页筛选用的状态标签类型，决定了 Badge 的颜色 */
export type StatusTagType = 'success' | 'warning' | 'danger' | 'info'

export const BOOKING_STATUS_TAG: Record<BookingStatus, StatusTagType> = {
  pending: 'warning',
  approved: 'success',
  borrowed: 'info',
  returned: 'info',
  overdue: 'danger',
  rejected: 'danger',
}
