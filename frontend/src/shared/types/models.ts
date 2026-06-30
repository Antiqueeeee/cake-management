/**
 * 订单实体（对齐详细设计 §1.2.5 order 表）
 */
import type { OrderStatus, PaymentStatus, PaymentMethod, PickupMethod } from '@/shared/constants/orderStatus'

export interface CustomerBrief {
  id: number
  /** 显示名：通常用备注名或 wxid 末段 */
  display_name: string
  wxid: string
}

export interface MenuItemBrief {
  id: number
  name: string
  /** 单位描述：8寸/6寸/磅 等 */
  spec?: string
  price: number
}

export interface OrderNote {
  id: number
  content: string
  /** ALLERGY（机器人识别）/ MANUAL（店员手填） */
  source: 'ALLERGY' | 'MANUAL'
}

export interface Order {
  /** 内部自增 id（跨年消歧义） */
  id: number
  /** 对外展示编号「月日-流水」 */
  order_no: string
  /** 下单日期 YYYY-MM-DD */
  order_date: string
  status: OrderStatus

  customer: CustomerBrief
  menu_item: MenuItemBrief
  quantity: number

  pickup_method: PickupMethod
  /** ISO 时间字符串 */
  pickup_at: string
  /** 本次联系电话 */
  contact_phone: string
  /** 配送地址（仅配送单）*/
  delivery_address?: string
  /** 订单备注：本次特殊要求 */
  order_note?: string

  payment_status: PaymentStatus
  payment_method?: PaymentMethod
  payment_paid_at?: string

  total_price: number
  /** 进入 COOKING 时锁定的配方快照 id（详细设计 §1.2.3） */
  recipe_snapshot_id?: number
  /** 客户档案备注（后厨屏建议层展示） */
  customer_notes: OrderNote[]

  created_at: string
}

/** 配方快照（详细设计 §1.2.3 recipe_snapshot）*/
export interface RecipeIngredientItem {
  ingredient_name: string
  /** 单次用量 */
  amount: number
  unit: string
}

export interface RecipeStep {
  order: number
  text: string
  /** 可选耗时（分钟） */
  duration_min?: number
}

export interface RecipeSnapshot {
  id: number
  menu_item_name: string
  /** 配方版本号 */
  version: number
  /** 原料清单（单份用量，前端展示时按订单数量 × ） */
  ingredients: RecipeIngredientItem[]
  steps: RecipeStep[]
  /** 过敏原 */
  allergens?: string[]
  /** 损耗率 */
  loss_rate?: number
}

/** 用户（详细设计 §1.2.7 user 表） */
export interface User {
  id: number
  display_name: string
  /** 角色：店主 / 店员 / 后厨 */
  role: 'OWNER' | 'STAFF' | 'KITCHEN'
}
