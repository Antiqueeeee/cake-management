<script setup lang="ts">
/**
 * 后厨屏看板主页 /kitchen/board（详细设计 §4.2.2）
 *
 * 组成：
 * - AppHeader：店名 / 时钟 / 待制作数 / 提示音 / 设置 / 用户
 * - 五列看板：PENDING / COOKING / READY_FOR_PICKUP / READY_FOR_DELIVERY / DELIVERING
 * - 三个弹窗：RecipeDialog / PickupCloseDialog / DeliveryCloseDialog
 *
 * 数据流：
 * - 进入页面拉取今日订单 + 启动新单订阅
 * - 新单到达 → store 自动追加 → 提示音 + 卡片高亮 30 秒
 * - 卡片主操作：分状态直接调 API 或弹窗确认后再调
 * - 离开页面 / 登出 → 停订阅
 */
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import AppHeader from '../components/AppHeader.vue'
import OrderColumn from '../components/OrderColumn.vue'
import RecipeDialog from '../components/RecipeDialog.vue'
import PickupCloseDialog from '../components/PickupCloseDialog.vue'
import DeliveryCloseDialog from '../components/DeliveryCloseDialog.vue'
import { useKitchenStore } from '../store'
import { playNotification } from '../composables/useNotification'
import { BOARD_STATUSES } from '@/shared/constants/orderStatus'
import { OrderAction, type AvailableAction } from '@/shared/constants/orderAction'
import type { Order } from '@/shared/types/models'
import { ApiException } from '@/shared/types/api'

const kitchen = useKitchenStore()

/* ============ 弹窗状态 ============ */
const recipeOpen = ref(false)
const recipeOrder = ref<Order | null>(null)

const pickupOpen = ref(false)
const pickupOrder = ref<Order | null>(null)

const deliveryOpen = ref(false)
const deliveryOrder = ref<Order | null>(null)

/* ============ 数据加载与新单订阅 ============ */
onMounted(async () => {
  try {
    await kitchen.fetchTodayOrders()
  } catch (e) {
    ElMessage.error('订单加载失败，请刷新重试')
    console.error(e)
  }
  // 启动新单订阅；store 内部已防重复
  kitchen.startNewOrderWatch()
})

onUnmounted(() => {
  kitchen.stopNewOrderWatch()
})

/* ============ 按列分组 ============ */
const ordersByStatus = computed(() => {
  const map: Record<string, Order[]> = {}
  for (const s of BOARD_STATUSES) map[s] = []
  for (const o of kitchen.orders) {
    if (map[o.status]) map[o.status].push(o)
  }
  return map
})

/* ============ 事件处理 ============ */
function onViewRecipe(order: Order) {
  recipeOrder.value = order
  recipeOpen.value = true
  kitchen.markViewed(order.id)
}

/**
 * 卡片主操作：
 * - START_COOKING / FINISH：直接调 API，无需弹窗
 * - CLOSE_PICKUP：弹 PickupCloseDialog（按 payment_status 决定是否收款）
 * - CLOSE_DELIVERY：弹 DeliveryCloseDialog（同上）
 */
async function onPrimaryAction(order: Order, action: AvailableAction) {
  if (action.action === OrderAction.START_COOKING) {
    await runDirectAction(order.id, () => kitchen.startCooking(order.id), '已开始制作')
    return
  }
  if (action.action === OrderAction.FINISH) {
    await runDirectAction(order.id, () => kitchen.finish(order.id), '已完工，等客户取 / 配送')
    return
  }
  if (action.dialog === 'pickup-close') {
    pickupOrder.value = order
    pickupOpen.value = true
    return
  }
  if (action.dialog === 'delivery-close') {
    deliveryOrder.value = order
    deliveryOpen.value = true
    return
  }
}

async function runDirectAction(
  orderId: number,
  fn: () => Promise<Order>,
  successMsg: string,
) {
  try {
    await fn()
    ElMessage.success({ message: successMsg, duration: 1500 })
    kitchen.markViewed(orderId)
  } catch (e) {
    const msg = e instanceof ApiException ? e.message : '操作失败'
    ElMessage.error(msg)
  }
}

/* 新单到达 → 播提示音；watch recentNewOrderIds 集合大小增长时触发 */
const knownNewIds = ref<Set<number>>(new Set())
watch(
  () => kitchen.recentNewOrderIds,
  (set) => {
    for (const id of set) {
      if (!knownNewIds.value.has(id)) {
        knownNewIds.value.add(id)
        playNotification()
      }
    }
    // 清理已移除的 id，避免集合无限增长
    if (knownNewIds.value.size > 200) {
      knownNewIds.value = new Set(set)
    }
  },
  { deep: true },
)
</script>

<template>
  <div class="board-page">
    <AppHeader />

    <main class="board-main">
      <div class="board-grid">
        <OrderColumn
          v-for="status in BOARD_STATUSES"
          :key="status"
          :status="status"
          :orders="ordersByStatus[status]"
          :new-order-ids="kitchen.recentNewOrderIds"
          @viewRecipe="onViewRecipe"
          @primaryAction="onPrimaryAction"
        />
      </div>

      <div v-if="kitchen.loading && kitchen.orders.length === 0" class="board-loading">
        正在加载今日订单…
      </div>
    </main>

    <!-- 配方查看 -->
    <RecipeDialog v-model="recipeOpen" :order="recipeOrder" />

    <!-- 客户到店取货 -->
    <PickupCloseDialog v-model="pickupOpen" :order="pickupOrder" />

    <!-- 配送订单送达关闭 -->
    <DeliveryCloseDialog v-model="deliveryOpen" :order="deliveryOrder" />
  </div>
</template>

<style scoped>
.board-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
  background: var(--bg-page);
}

.board-main {
  flex: 1;
  min-height: 0;
  padding: var(--space-3);
  overflow: hidden;
  position: relative;
}

.board-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(280px, 1fr));
  gap: var(--space-3);
  height: 100%;
  min-height: 0;
}

/* 中等屏：5 列仍同屏，但每列最小宽度收紧 */
@media (max-width: 1280px) {
  .board-grid {
    grid-template-columns: repeat(5, minmax(240px, 1fr));
    gap: var(--space-2);
  }
}

/* 窄屏（<1024px）：横向滚动兜底，避免列被压扁不可读 */
@media (max-width: 1024px) {
  .board-main {
    overflow-x: auto;
    overflow-y: hidden;
  }
  .board-grid {
    grid-template-columns: repeat(5, 300px);
    width: max-content;
    min-width: 100%;
  }
}

.board-loading {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--fg-secondary);
  font-size: var(--text-lg);
  background: color-mix(in srgb, var(--bg-page) 80%, transparent);
  pointer-events: none;
}
</style>
