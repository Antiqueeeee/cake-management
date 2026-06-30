<script setup lang="ts">
/**
 * 看板列（详细设计 §4.2.2）
 *
 * - 列头：状态色色块 + 状态名 + 订单数
 * - 列内：订单卡片按取货时间升序，垂直滚动
 * - 空状态：友好提示「暂无 XX 订单」
 */
import { computed } from 'vue'
import type { Order } from '@/shared/types/models'
import { STATUS_META, type OrderStatus } from '@/shared/constants/orderStatus'
import type { AvailableAction } from '@/shared/constants/orderAction'
import OrderCard from './OrderCard.vue'

const props = defineProps<{
  status: OrderStatus
  orders: Order[]
  newOrderIds: Set<number>
}>()

const emit = defineEmits<{
  (e: 'viewRecipe', order: Order): void
  (e: 'primaryAction', order: Order, action: AvailableAction): void
}>()

const meta = computed(() => STATUS_META[props.status])
const sortedOrders = computed(() =>
  [...props.orders].sort((a, b) => new Date(a.pickup_at).getTime() - new Date(b.pickup_at).getTime()),
)
</script>

<template>
  <section
    class="board-column"
    :style="{
      '--col-color': meta.color,
      '--col-bg': meta.bgColor,
      '--col-fg': meta.fgColor,
      '--col-border': meta.borderColor,
    }"
  >
    <header class="col-header">
      <span class="col-dot" aria-hidden="true" />
      <h2 class="col-title">{{ meta.label }}</h2>
      <span class="col-count tnum">{{ sortedOrders.length }}</span>
    </header>

    <div class="col-body">
      <TransitionGroup name="card-list" v-if="sortedOrders.length > 0">
        <OrderCard
          v-for="order in sortedOrders"
          :key="order.id"
          :order="order"
          :is-new="newOrderIds.has(order.id)"
          @viewRecipe="emit('viewRecipe', $event)"
          @primaryAction="(a, b) => emit('primaryAction', a, b)"
        />
      </TransitionGroup>
      <div v-else class="col-empty">
        <span>暂无{{ meta.label }}订单</span>
      </div>
    </div>
  </section>
</template>

<style scoped>
.board-column {
  display: flex;
  flex-direction: column;
  min-height: 0;
  height: 100%;
  background: var(--col-bg);
  border-top: 4px solid var(--col-color);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.col-header {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.7), rgba(255, 255, 255, 0.4));
  border-bottom: 1px solid var(--col-border);
}

.col-dot {
  width: 12px;
  height: 12px;
  border-radius: var(--radius-pill);
  background: var(--col-color);
  box-shadow: 0 0 0 3px color-mix(in srgb, var(--col-color) 25%, transparent);
}

.col-title {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--col-fg);
  flex: 1;
}

.col-count {
  font-size: var(--text-base);
  font-weight: 700;
  color: var(--col-fg);
  background: var(--bg-card);
  padding: 2px var(--space-3);
  border-radius: var(--radius-pill);
  min-width: 36px;
  text-align: center;
  box-shadow: var(--shadow-card);
}

.col-body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--space-3);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  min-height: 0;
}

.col-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--fg-tertiary);
  font-size: var(--text-base);
  opacity: 0.6;
  text-align: center;
  padding: var(--space-6);
}

/* 列内卡片增删动画 */
.card-list-enter-active,
.card-list-leave-active {
  transition:
    transform var(--dur-base) var(--ease-in-out),
    opacity var(--dur-base) var(--ease-out);
}

.card-list-enter-from {
  opacity: 0;
  transform: translateY(-12px) scale(0.95);
}

.card-list-leave-to {
  opacity: 0;
  transform: scale(0.9);
}

.card-list-leave-active {
  position: absolute;
  width: calc(100% - var(--space-3) * 2);
}

.card-list-move {
  transition: transform var(--dur-base) var(--ease-in-out);
}
</style>
