/**
 * 订单状态机
 * 单一可信源：详细设计 §2.1 状态定义、§2.3 转换规则表、§2.4 状态约束矩阵
 *
 * 第一期 7 个状态（2 个终态不进后厨屏看板，仅在订单详情可见）
 */

/** 订单状态枚举（与后端 order.status 字段 1:1 对应） */
export const OrderStatus = {
  /** 待制作：订单入库后等待后厨安排 */
  PENDING: 'PENDING',
  /** 制作中：后厨已选「现做」，正在按配方制作 */
  COOKING: 'COOKING',
  /** 待取：自取单蛋糕就绪，等客户到店 */
  READY_FOR_PICKUP: 'READY_FOR_PICKUP',
  /** 待配送：配送单蛋糕就绪，等安排配送 */
  READY_FOR_DELIVERY: 'READY_FOR_DELIVERY',
  /** 配送中：已交配送员；第一期不可达（§2.3.5 不实现 MARK_DISPATCHED） */
  DELIVERING: 'DELIVERING',
  /** 已完成：终态 */
  COMPLETED: 'COMPLETED',
  /** 已取消：终态 */
  CANCELLED: 'CANCELLED',
} as const

export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus]

/** 后厨屏看板五列对应的状态（详细设计 §4.2.2） */
export const BOARD_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.COOKING,
  OrderStatus.READY_FOR_PICKUP,
  OrderStatus.READY_FOR_DELIVERY,
  OrderStatus.DELIVERING,
]

/** 终态：不在看板显示 */
export const TERMINAL_STATUSES: OrderStatus[] = [OrderStatus.COMPLETED, OrderStatus.CANCELLED]

export interface StatusMeta {
  label: string
  shortLabel: string
  color: string
  bgColor: string
  fgColor: string
  borderColor: string
}

/** 状态色映射：与 tokens.css 中 --status-* 一一对应 */
export const STATUS_META: Record<OrderStatus, StatusMeta> = {
  PENDING: {
    label: '待制作',
    shortLabel: '待制',
    color: 'var(--status-pending)',
    bgColor: 'var(--status-pending-bg)',
    fgColor: 'var(--status-pending-fg)',
    borderColor: 'var(--status-pending-border)',
  },
  COOKING: {
    label: '制作中',
    shortLabel: '制作',
    color: 'var(--status-cooking)',
    bgColor: 'var(--status-cooking-bg)',
    fgColor: 'var(--status-cooking-fg)',
    borderColor: 'var(--status-cooking-border)',
  },
  READY_FOR_PICKUP: {
    label: '待取',
    shortLabel: '待取',
    color: 'var(--status-ready-pickup)',
    bgColor: 'var(--status-ready-pickup-bg)',
    fgColor: 'var(--status-ready-pickup-fg)',
    borderColor: 'var(--status-ready-pickup-border)',
  },
  READY_FOR_DELIVERY: {
    label: '待配送',
    shortLabel: '待配',
    color: 'var(--status-ready-delivery)',
    bgColor: 'var(--status-ready-delivery-bg)',
    fgColor: 'var(--status-ready-delivery-fg)',
    borderColor: 'var(--status-ready-delivery-border)',
  },
  DELIVERING: {
    label: '配送中',
    shortLabel: '配送',
    color: 'var(--status-delivering)',
    bgColor: 'var(--status-delivering-bg)',
    fgColor: 'var(--status-delivering-fg)',
    borderColor: 'var(--status-delivering-border)',
  },
  COMPLETED: {
    label: '已完成',
    shortLabel: '完成',
    color: 'var(--fg-tertiary)',
    bgColor: 'var(--bg-muted)',
    fgColor: 'var(--fg-secondary)',
    borderColor: 'var(--border-strong)',
  },
  CANCELLED: {
    label: '已取消',
    shortLabel: '取消',
    color: 'var(--danger)',
    bgColor: 'var(--danger-bg)',
    fgColor: 'var(--danger-fg)',
    borderColor: 'var(--danger-border)',
  },
}

/** 取货方式 */
export const PickupMethod = {
  PICKUP: 'PICKUP',
  DELIVERY: 'DELIVERY',
} as const

export type PickupMethod = (typeof PickupMethod)[keyof typeof PickupMethod]

export const PICKUP_METHOD_LABEL: Record<PickupMethod, string> = {
  PICKUP: '自取',
  DELIVERY: '配送',
}

/** 支付状态 */
export const PaymentStatus = {
  UNPAID: 'UNPAID',
  PAID: 'PAID',
} as const

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus]

/** 支付方式（支付状态为 PAID 时必填）*/
export const PaymentMethod = {
  WECHAT: 'WECHAT',
  CASH: 'CASH',
  ALIPAY: 'ALIPAY',
  OTHER: 'OTHER',
} as const

export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod]

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  WECHAT: '微信转账',
  CASH: '现金',
  ALIPAY: '支付宝',
  OTHER: '其他',
}
