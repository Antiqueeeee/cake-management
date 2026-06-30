/**
 * Kitchen service 入口
 *
 * 单一可信源：详细设计 §4.3.1
 * - 原型期：VITE_USE_MOCK=true 走 mock
 * - 后端 ready：VITE_USE_MOCK=false 走真实 HTTP
 *
 * 后端 ready 后用 openapi-typescript 生成 TS 类型，签名不变
 */
import type { Order, RecipeSnapshot, User } from '@/shared/types/models'
import { OrderAction } from '@/shared/constants/orderAction'
import { PaymentMethod } from '@/shared/constants/orderStatus'
import { httpClient } from '@/shared/api/client'
import { mockService, subscribeNewOrder, startAutoNewOrder, stopAutoNewOrder } from '@/shared/api/mock'

export interface KitchenService {
  login(pin: string, client_type: 'admin' | 'kitchen'): Promise<User>
  logout(): Promise<void>
  me(): Promise<User | null>
  listTodayOrders(): Promise<Order[]>
  getRecipe(menuItemId: number, snapshotId?: number): Promise<RecipeSnapshot>
  action(
    orderId: number,
    action: OrderAction,
    params?: { payment_method?: PaymentMethod },
  ): Promise<Order>
}

const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

export const kitchenService: KitchenService = USE_MOCK ? mockService : httpService()

function httpService(): KitchenService {
  return {
    async login(pin, client_type) {
      return httpClient.post('/auth/login', { pin, client_type })
    },
    async logout() {
      await httpClient.post('/auth/logout')
    },
    async me() {
      return httpClient.get('/auth/me')
    },
    async listTodayOrders() {
      return httpClient.get('/kitchen/today')
    },
    async getRecipe(menuItemId, snapshotId) {
      const query = snapshotId ? { snapshot: snapshotId } : {}
      return httpClient.get(`/menu/${menuItemId}/recipe`, { params: query })
    },
    async action(orderId, action, params) {
      return httpClient.post(`/orders/${orderId}/actions`, { action, ...params })
    },
  }
}

export { subscribeNewOrder, startAutoNewOrder, stopAutoNewOrder }
