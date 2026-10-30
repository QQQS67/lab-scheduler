/**
 * 预约业务规则 —— 纯 TypeScript，不含任何框架代码
 *
 * 这两块逻辑（时段冲突 + 状态机）是本项目简历上最值钱的部分，
 * 因为它们是「业务难点」，而不是「CRUD 堆砌」。
 *
 * 后面接了后端之后，同一份逻辑要原样在服务端再校验一次：
 * 前端校验只是为了交互体验，后端校验才是安全边界。
 */

import type { Booking, BookingStatus, TimeRange, UserRole } from '@/types'

// ============ 一、时段冲突检测 ============

/**
 * 判断两个时间区间是否重叠。
 *
 * 半开区间 [start, end)：结束时刻可以立刻被下一个预约占用。
 * 例：A 是 9:00–10:00，B 是 10:00–11:00 —— 不冲突。
 *      A 是 9:00–10:00，B 是 9:30–10:30 —— 冲突。
 *
 * 重叠的唯一条件：aStart < bEnd && bStart < aEnd
 * 这个式子能同时覆盖「部分重叠、包含、被包含」三种情况，不需要分别判断。
 */
export function isOverlapping(a: TimeRange, b: TimeRange): boolean {
  const aStart = Date.parse(a.startTime)
  const aEnd = Date.parse(a.endTime)
  const bStart = Date.parse(b.startTime)
  const bEnd = Date.parse(b.endTime)
  return aStart < bEnd && bStart < aEnd
}

/**
 * 在已有预约里找出与目标时段冲突的那些。
 *
 * 注意两点业务约束：
 * 1. 已驳回和已归还的预约不占用时段，必须排除，否则用户会被自己取消过的单卡住
 * 2. 修改自己的预约时，要把自己那条排除掉（excludeId）
 */
export function findConflicts(
  target: TimeRange,
  existing: Booking[],
  excludeId?: string
): Booking[] {
  return existing.filter((item) => {
    if (item.id === excludeId) return false
    if (item.status === 'rejected' || item.status === 'returned') return false
    return isOverlapping(target, item)
  })
}

/** 校验时间段本身是否合法（结束晚于开始，且不超过单日上限） */
export function validateTimeRange(
  range: TimeRange,
  maxHoursPerDay: number
): string | null {
  const start = Date.parse(range.startTime)
  const end = Date.parse(range.endTime)
  if (Number.isNaN(start) || Number.isNaN(end)) return '时间格式不正确'
  if (end <= start) return '结束时间必须晚于开始时间'
  const hours = (end - start) / 3_600_000
  if (hours > maxHoursPerDay) {
    return `单次预约不得超过 ${maxHoursPerDay} 小时`
  }
  return null
}

// ============ 二、状态机 ============

/**
 * 允许的流转路径。
 *
 * 用 Record<BookingStatus, BookingStatus[]> 的好处：
 * 将来新增一个状态时，这里会直接编译报错提醒你补齐，不会静默漏掉。
 */
export const ALLOWED_TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  pending: ['approved', 'rejected'],
  approved: ['borrowed', 'rejected'],
  borrowed: ['returned', 'overdue'],
  returned: [],
  overdue: ['returned'],
  rejected: [],
}

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return ALLOWED_TRANSITIONS[from].includes(to)
}

/** 流转失败时给出人话原因，直接可以拿去 ElMessage 展示 */
export function getTransitionError(from: BookingStatus, to: BookingStatus): string | null {
  if (from === to) return `预约已处于「${to}」状态`
  if (!canTransition(from, to)) {
    return `不允许从「${from}」变更为「${to}」`
  }
  return null
}

/**
 * 用 never 做穷尽检查：
 * 如果哪天 BookingStatus 新增了一个状态而这里没处理，编译直接报错。
 * 这就是你笔记里那个 'Type "xxx" is not assignable to type "never"' 的真实用途。
 */
export function isActiveStatus(status: BookingStatus): boolean {
  switch (status) {
    case 'pending':
    case 'approved':
    case 'borrowed':
    case 'overdue':
      return true
    case 'returned':
    case 'rejected':
      return false
    default: {
      const exhaustive: never = status
      return exhaustive
    }
  }
}

// ============ 三、权限（RBAC） ============

/** 各角色能审批的目标：学生只能审批别人的，教师和管理员审批全部 */
export function canApprove(role: UserRole, booking: Booking, currentUserId: string): boolean {
  if (role === 'admin' || role === 'teacher') return true
  if (role === 'student') return booking.userId !== currentUserId
  return false
}

/** 是否需要审批：教师/管理员的预约直接通过，学生需要审批 */
export function shouldSkipApproval(role: UserRole): boolean {
  return role === 'teacher' || role === 'admin'
}
