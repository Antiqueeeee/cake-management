<script setup lang="ts">
/**
 * 订单卡片（详细设计 §4.2.2 + 设计系统 §7.1）
 *
 * 信息层级（自上而下）：
 * 1. 顶部 6px 状态色条
 * 2. 订单号 + 取货时间（紧急/超时橙色）
 * 3. 商品 + 规格 + 数量（点商品名打开配方）
 * 4. 取货方式 / 配送地址
 * 5. 订单备注高亮（过敏等关键词：红底白字 + ⚠）
 * 6. 客户档案备注（建议层，黄色背景）
 * 7. 主操作按钮（≥56px，状态色填）
 *
 * 状态切换：点按钮即时调 API，成功后卡片横向滑入下一列（由父组件 FLIP 处理）
 */
import { computed } from 'vue'
import { MapPin, Clock, AlertTriangle, StickyNote, ChevronRight } from 'lucide-vue-next'
import type { Order } from '@/shared/types/models'
import { STATUS_META, PAYMENT_METHOD_LABEL } from '@/shared/constants/orderStatus'
import { getAvailableActions, type AvailableAction } from '@/shared/constants/orderAction'
import { getHighestNoteLevel } from '@/shared/constants/noteKeywords'
import { formatPickupTime, isUrgent } from '@/shared/utils/format'

const props = defineProps<{
  order: Order
  isNew?: boolean
}>()

const emit = defineEmits<{
  (e: 'viewRecipe', order: Order): void
  (e: 'primaryAction', order: Order, action: AvailableAction): void
}>()

const statusMeta = computed(() => STATUS_META[props.order.status])
const noteLevel = computed(() => getHighestNoteLevel(props.order.customer_notes))

const hasAllergyInOrderNote = computed(() => {
  if (!props.order.order_note) return false
  return /过敏|忌口|不能吃|不吃/.test(props.order.order_note)
})

const urgent = computed(() => isUrgent(props.order.pickup_at, props.order.status))

const pickupTimeText = computed(() => formatPickupTime(props.order.pickup_at))

const availableActions = computed(() => getAvailableActions(props.order.status))

/** 按钮标签按 payment_status 动态切换 */
const primaryAction = computed<AvailableAction | null>(() => {
  const list = availableActions.value
  if (list.length === 0) return null
  const action = list[0]
  // 客户到店取货：根据支付状态切换按钮标签
  if (action.action === 'CLOSE_PICKUP') {
    if (props.order.payment_status === 'UNPAID') {
      return { ...action, label: '收款并交付' }
    }
    return { ...action, label: '确认交付' }
  }
  if (action.action === 'CLOSE_DELIVERY') {
    if (props.order.payment_status === 'UNPAID') {
      return { ...action, label: '送达并收款' }
    }
    return { ...action, label: '确认送达' }
  }
  return action
})

function onButtonClick() {
  if (primaryAction.value) {
    emit('primaryAction', props.order, primaryAction.value)
  }
}

function onProductClick() {
  emit('viewRecipe', props.order)
}
</script>

<template>
  <article
    class="order-card"
    :class="{
      'is-new': isNew,
      [`level-${noteLevel}`]: noteLevel !== 'normal',
    }"
    :style="{
      '--card-status-color': statusMeta.color,
      '--card-status-bg': statusMeta.bgColor,
      '--card-status-fg': statusMeta.fgColor,
      '--card-status-border': statusMeta.borderColor,
    }"
  >
    <!-- 顶部状态色条 -->
    <div class="status-bar" aria-hidden="true" />

    <!-- 头部：订单号 + 取货时间 -->
    <header class="card-header">
      <span class="order-no tnum">{{ order.order_no }}</span>
      <span class="pickup-time tnum" :class="{ urgent }">
        <Clock :size="16" />
        {{ pickupTimeText }}
      </span>
    </header>

    <!-- 商品 + 数量（点商品名打开配方）-->
    <button class="product-row" @click="onProductClick">
      <span class="product-name">
        {{ order.menu_item.name }}
        <span v-if="order.menu_item.spec" class="product-spec">（{{ order.menu_item.spec }}）</span>
      </span>
      <span class="product-qty tnum">× {{ order.quantity }}</span>
      <ChevronRight :size="16" class="product-arrow" />
    </button>

    <!-- 取货方式 / 配送地址 -->
    <div class="pickup-row">
      <MapPin :size="14" />
      <template v-if="order.pickup_method === 'PICKUP'">
        <span class="pickup-method-tag pickup">自取</span>
      </template>
      <template v-else>
        <span class="pickup-method-tag delivery">配送</span>
        <span class="delivery-addr">{{ order.delivery_address }}</span>
      </template>
    </div>

    <!-- 支付状态条（仅 PAID 显示，UNPAID 不强调）-->
    <div v-if="order.payment_status === 'PAID'" class="paid-tag">
      已付 · {{ PAYMENT_METHOD_LABEL[order.payment_method!] }}
    </div>

    <!-- 订单备注（含过敏关键词时红底）-->
    <div
      v-if="order.order_note"
      class="note-row"
      :class="{ allergy: hasAllergyInOrderNote }"
    >
      <AlertTriangle v-if="hasAllergyInOrderNote" :size="14" />
      <StickyNote v-else :size="14" />
      <span>{{ order.order_note }}</span>
    </div>

    <!-- 客户档案备注（建议层；过敏关键词高亮）-->
    <div
      v-for="cn in order.customer_notes"
      :key="cn.id"
      class="customer-note-row"
      :class="{
        allergy: /过敏|忌口|不能吃|不吃/.test(cn.content),
      }"
    >
      <AlertTriangle v-if="/过敏|忌口|不能吃|不吃/.test(cn.content)" :size="13" />
      <span>{{ cn.content }}</span>
    </div>

    <!-- 主操作按钮 -->
    <button
      v-if="primaryAction"
      class="primary-btn"
      :class="[`btn-${primaryAction.variant || 'primary'}`]"
      @click="onButtonClick"
    >
      {{ primaryAction.label }}
    </button>
    <div v-else class="no-action-hint">订单已终结</div>
  </article>
</template>

<style scoped>
.order-card {
  position: relative;
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: var(--space-4);
  padding-top: calc(var(--space-4) + 2px);
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  transition:
    transform var(--dur-base) var(--ease-in-out),
    box-shadow var(--dur-base) var(--ease-out);
  border: 1px solid var(--border-soft);
}

.order-card.is-new {
  animation: pulse-new-order 1.6s var(--ease-in-out) infinite;
  z-index: var(--z-card);
}

.status-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 6px;
  background: var(--card-status-color);
  border-top-left-radius: var(--radius-lg);
  border-top-right-radius: var(--radius-lg);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}

.order-no {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--fg-primary);
  letter-spacing: 0.02em;
}

.pickup-time {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--fg-secondary);
  background: var(--bg-muted);
  padding: 2px var(--space-2);
  border-radius: var(--radius-pill);
}

.pickup-time.urgent {
  color: var(--danger-fg);
  background: var(--danger-bg);
  animation: pulse-new-order 1.6s var(--ease-in-out) infinite;
}

.product-row {
  all: unset;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2);
  margin: 0 calc(var(--space-2) * -1);
  border-radius: var(--radius-sm);
  transition: background var(--dur-fast) var(--ease-out);
}

.product-row:hover {
  background: var(--bg-muted);
}

.product-row:active {
  background: var(--brand-100);
}

.product-name {
  flex: 1;
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--fg-primary);
}

.product-spec {
  color: var(--fg-secondary);
  font-weight: 400;
}

.product-qty {
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--brand-700);
}

.product-arrow {
  color: var(--fg-tertiary);
}

.pickup-row {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--fg-secondary);
  font-size: var(--text-sm);
}

.pickup-method-tag {
  display: inline-block;
  padding: 1px 8px;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 600;
}

.pickup-method-tag.pickup {
  color: var(--brand-700);
  background: var(--brand-100);
}

.pickup-method-tag.delivery {
  color: var(--status-delivering-fg);
  background: var(--status-delivering-bg);
}

.delivery-addr {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.paid-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-xs);
  color: var(--status-ready-pickup-fg);
  background: var(--status-ready-pickup-bg);
  padding: 2px 8px;
  border-radius: var(--radius-pill);
  align-self: flex-start;
}

.note-row {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: var(--space-2);
  border-radius: var(--radius-sm);
  background: var(--bg-muted);
  color: var(--fg-secondary);
  font-size: var(--text-sm);
  line-height: 1.4;
}

.note-row.allergy {
  background: var(--danger-bg);
  color: var(--danger-fg);
  font-weight: 600;
  border-left: 4px solid var(--danger);
}

.customer-note-row {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--text-xs);
  color: var(--fg-tertiary);
  padding: 2px var(--space-2);
  background: var(--bg-muted);
  border-radius: var(--radius-sm);
}

.customer-note-row.allergy {
  color: var(--danger-fg);
  background: var(--danger-bg);
  font-weight: 600;
}

.primary-btn {
  width: 100%;
  height: 56px;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--fg-on-brand);
  letter-spacing: 0.08em;
  transition:
    transform var(--dur-fast) var(--ease-out),
    filter var(--dur-fast) var(--ease-out),
    opacity var(--dur-fast);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.primary-btn:active {
  transform: scale(0.97);
}

.primary-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--brand-600);
}
.btn-primary:hover {
  background: var(--brand-700);
}

.btn-success {
  background: var(--status-ready-pickup);
}
.btn-success:hover {
  filter: brightness(0.95);
}

.btn-warning {
  background: var(--status-pending);
}
.btn-warning:hover {
  filter: brightness(0.95);
}

.btn-info {
  background: var(--status-delivering);
}
.btn-info:hover {
  filter: brightness(0.95);
}

.no-action-hint {
  text-align: center;
  padding: var(--space-3);
  color: var(--fg-tertiary);
  font-size: var(--text-sm);
  background: var(--bg-muted);
  border-radius: var(--radius-md);
}
</style>
