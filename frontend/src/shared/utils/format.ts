/**
 * 格式化工具
 */

/** 紧急：取货时间距今 < 30 分钟且未到 READY_FOR_* 状态 */
export function isUrgent(pickupAtIso: string, status: string): boolean {
  if (status === 'READY_FOR_PICKUP' || status === 'READY_FOR_DELIVERY' || status === 'DELIVERING') {
    return false
  }
  const dt = new Date(pickupAtIso).getTime() - Date.now()
  return dt > 0 && dt < 30 * 60 * 1000
}

/** 取货时间显示：今天显示 HH:MM、明天显示「明日 HH:MM」、超时显示「已超时 N 分钟」 */
export function formatPickupTime(pickupAtIso: string): string {
  const d = new Date(pickupAtIso)
  const now = new Date()
  const diffMs = d.getTime() - now.getTime()
  if (diffMs < 0) {
    const minutes = Math.floor(-diffMs / 60000)
    if (minutes < 60) return `超时 ${minutes} 分`
    return `超时 ${Math.floor(minutes / 60)} 小时`
  }
  const sameDay = d.toDateString() === now.toDateString()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  const isTomorrow = d.toDateString() === tomorrow.toDateString()
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  if (sameDay) return `${hh}:${mm}`
  if (isTomorrow) return `明日 ${hh}:${mm}`
  const M = String(d.getMonth() + 1).padStart(2, '0')
  const D = String(d.getDate()).padStart(2, '0')
  return `${M}/${D} ${hh}:${mm}`
}

/** 当前时间 HH:MM:SS */
export function formatClock(d: Date = new Date()): string {
  const h = String(d.getHours()).padStart(2, '0')
  const m = String(d.getMinutes()).padStart(2, '0')
  const s = String(d.getSeconds()).padStart(2, '0')
  return `${h}:${m}:${s}`
}

/** 当前日期 YYYY-MM-DD 周X */
export function formatDate(d: Date = new Date()): string {
  const Y = d.getFullYear()
  const M = String(d.getMonth() + 1).padStart(2, '0')
  const D = String(d.getDate()).padStart(2, '0')
  const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()]
  return `${Y}-${M}-${D} 周${week}`
}

/** 价格 ¥XX */
export function formatPrice(yuan: number): string {
  return `¥${yuan}`
}

/** 手机号 138****1234 */
export function maskPhone(phone: string): string {
  if (!phone) return ''
  if (phone.length === 11) {
    return phone.slice(0, 3) + '****' + phone.slice(-4)
  }
  // 已脱敏的直接返回
  return phone
}
