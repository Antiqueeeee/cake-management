/**
 * 订单状态机动作
 * 单一可信源：详细设计 §2.3 转换规则表（8 个 ORDER_ACTION）、§2.4 状态约束矩阵
 *
 * 后厨屏可见的动作：START_COOKING、FINISH、MARK_DISPATCHED（第二期）、CLOSE_PICKUP、CLOSE_DELIVERY
 * 不可见但需理解：CREATE / UPDATE / CANCEL（admin 与机器人主入口）
 */

export const OrderAction = {
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  START_COOKING: 'START_COOKING',
  FINISH: 'FINISH',
  MARK_DISPATCHED: 'MARK_DISPATCHED',
  CLOSE_PICKUP: 'CLOSE_PICKUP',
  CLOSE_DELIVERY: 'CLOSE_DELIVERY',
  CANCEL: 'CANCEL',
} as const

export type OrderAction = (typeof OrderAction)[keyof typeof OrderAction]

/**
 * 状态约束矩阵（详细设计 §2.4）
 * 给定订单当前状态 + 取货方式，列出后厨屏可执行的动作。
 *
 * 第一期简化口径（需求文档 §13.4 取舍 6）：
 * - 不实现 MARK_DISPATCHED，「待配送 → 配送中」不可达
 * - 待配送卡片直接出「已完成配送」按钮（CLOSE_DELIVERY），不经过 DELIVERING
 */
export interface AvailableAction {
  action: OrderAction
  label: string
  /** 主操作按钮填色；缺省用状态色 */
  variant?: 'primary' | 'success' | 'warning' | 'info'
  /** 弹窗类型：决定点击按钮后打开哪个 dialog */
  dialog?: 'recipe' | 'pickup-close' | 'delivery-close' | 'none'
}

/**
 * 返回某订单当前状态对应的后厨屏可执行动作
 * 实现参照详细设计 §4.1.4 按钮组按状态分支
 */
export function getAvailableActions(status: string): AvailableAction[] {
  switch (status) {
    case 'PENDING':
      return [
        {
          action: OrderAction.START_COOKING,
          label: '开始制作',
          variant: 'primary',
          dialog: 'none',
        },
      ]
    case 'COOKING':
      return [
        {
          action: OrderAction.FINISH,
          label: '完工',
          variant: 'success',
          dialog: 'none',
        },
      ]
    case 'READY_FOR_PICKUP':
      // 实际按钮标签需按 payment_status 动态切换，由组件二次处理
      return [
        {
          action: OrderAction.CLOSE_PICKUP,
          label: '客户已取',
          variant: 'success',
          dialog: 'pickup-close',
        },
      ]
    case 'READY_FOR_DELIVERY':
      return [
        {
          action: OrderAction.CLOSE_DELIVERY,
          label: '已完成配送',
          variant: 'success',
          dialog: 'delivery-close',
        },
      ]
    case 'DELIVERING':
      // 第一期不可达，留兜底
      return [
        {
          action: OrderAction.CLOSE_DELIVERY,
          label: '已完成配送',
          variant: 'success',
          dialog: 'delivery-close',
        },
      ]
    default:
      // COMPLETED / CANCELLED：终态无动作
      return []
  }
}
