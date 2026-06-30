/**
 * Kitchen 业务 Pinia store
 *
 * 双入口共享同一 service 层：原型期连 mock、后端 ready 后切 http（VITE_USE_MOCK=false）
 * service 切换在 ./service.ts 中完成
 */
import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Order, RecipeSnapshot, User } from '@/shared/types/models'
import { ApiException } from '@/shared/types/api'
import { OrderAction } from '@/shared/constants/orderAction'
import { PaymentMethod } from '@/shared/constants/orderStatus'
import { kitchenService as service, subscribeNewOrder } from './service'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)

  async function fetchMe() {
    loading.value = true
    try {
      user.value = await service.me()
    } finally {
      loading.value = false
    }
  }

  async function login(pin: string) {
    loading.value = true
    try {
      user.value = await service.login(pin, 'kitchen')
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    await service.logout()
    user.value = null
  }

  return { user, loading, fetchMe, login, logout }
})

export const useKitchenStore = defineStore('kitchen', () => {
  const orders = ref<Order[]>([])
  const loading = ref(false)
  /** 新到的订单 id 集合：用于卡片高亮 30 秒 */
  const recentNewOrderIds = ref<Set<number>>(new Set())

  let unsubscribe: (() => void) | null = null

  async function fetchTodayOrders() {
    loading.value = true
    try {
      orders.value = await service.listTodayOrders()
    } finally {
      loading.value = false
    }
  }

  /** 启动新单订阅（在登录后调用一次） */
  function startNewOrderWatch() {
    if (unsubscribe) return
    unsubscribe = subscribeNewOrder((order) => {
      // 防重复
      if (orders.value.some((o) => o.id === order.id)) return
      orders.value.unshift(order)
      recentNewOrderIds.value.add(order.id)
      // 30 秒后从「新单」集合中移除（高亮停止，但订单仍在）
      setTimeout(() => {
        recentNewOrderIds.value.delete(order.id)
        // 触发响应式更新
        recentNewOrderIds.value = new Set(recentNewOrderIds.value)
      }, 30_000)
      recentNewOrderIds.value = new Set(recentNewOrderIds.value)
    })
  }

  function stopNewOrderWatch() {
    if (unsubscribe) {
      unsubscribe()
      unsubscribe = null
    }
  }

  function isNewOrder(orderId: number): boolean {
    return recentNewOrderIds.value.has(orderId)
  }

  /** 标记订单已查看（点击查看详情时调用，移除高亮） */
  function markViewed(orderId: number) {
    if (recentNewOrderIds.value.delete(orderId)) {
      recentNewOrderIds.value = new Set(recentNewOrderIds.value)
    }
  }

  async function startCooking(orderId: number): Promise<Order> {
    try {
      const updated = await service.action(orderId, OrderAction.START_COOKING)
      patchOrder(updated)
      return updated
    } catch (e) {
      throw normalizeError(e)
    }
  }

  async function finish(orderId: number): Promise<Order> {
    try {
      const updated = await service.action(orderId, OrderAction.FINISH)
      patchOrder(updated)
      return updated
    } catch (e) {
      throw normalizeError(e)
    }
  }

  async function closePickup(orderId: number, paymentMethod?: PaymentMethod): Promise<Order> {
    try {
      const updated = await service.action(orderId, OrderAction.CLOSE_PICKUP, {
        payment_method: paymentMethod,
      })
      patchOrder(updated)
      return updated
    } catch (e) {
      throw normalizeError(e)
    }
  }

  async function closeDelivery(orderId: number, paymentMethod?: PaymentMethod): Promise<Order> {
    try {
      const updated = await service.action(orderId, OrderAction.CLOSE_DELIVERY, {
        payment_method: paymentMethod,
      })
      patchOrder(updated)
      return updated
    } catch (e) {
      throw normalizeError(e)
    }
  }

  async function getRecipe(menuItemId: number, snapshotId?: number): Promise<RecipeSnapshot> {
    return service.getRecipe(menuItemId, snapshotId)
  }

  function patchOrder(updated: Order) {
    const idx = orders.value.findIndex((o) => o.id === updated.id)
    if (idx >= 0) {
      orders.value[idx] = updated
    } else {
      orders.value.unshift(updated)
    }
  }

  function normalizeError(e: unknown): ApiException {
    if (e instanceof ApiException) return e
    if (e && typeof e === 'object' && 'code' in e) {
      const err = e as { code: string; message: string; httpStatus?: number }
      return new ApiException(err.code, err.message, undefined, err.httpStatus)
    }
    return new ApiException('INTERNAL_ERROR', '未知错误', undefined)
  }

  return {
    orders,
    loading,
    recentNewOrderIds,
    fetchTodayOrders,
    startNewOrderWatch,
    stopNewOrderWatch,
    isNewOrder,
    markViewed,
    startCooking,
    finish,
    closePickup,
    closeDelivery,
    getRecipe,
  }
})
