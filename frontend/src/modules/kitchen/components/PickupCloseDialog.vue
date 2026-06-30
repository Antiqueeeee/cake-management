<script setup lang="ts">
/**
 * 客户到店取货弹窗（详细设计 §4.2.4，对应 §2.3.6 CLOSE_PICKUP）
 *
 * 按订单 payment_status 分两种 UI：
 * - UNPAID：「收款并交付」合并按钮，需选择支付方式
 *   - 同事务：状态切 COMPLETED + 支付状态切 PAID + 记录收款时间与方式
 * - PAID：「确认交付」单按钮，仅状态切换，支付状态保持不变（禁止二次收款）
 */
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import {
  ShoppingBag,
  AlertTriangle,
  Banknote,
  Check,
  Loader2,
} from 'lucide-vue-next'
import type { Order } from '@/shared/types/models'
import { PaymentMethod, PaymentStatus, PAYMENT_METHOD_LABEL } from '@/shared/constants/orderStatus'
import { getHighestNoteLevel } from '@/shared/constants/noteKeywords'
import { ApiException } from '@/shared/types/api'
import { useKitchenStore } from '../store'
import { formatPrice } from '@/shared/utils/format'

const props = defineProps<{
  modelValue: boolean
  order: Order | null
}>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const kitchen = useKitchenStore()
const selectedPayment = ref<PaymentMethod>(PaymentMethod.CASH)
const submitting = ref(false)

const isUnpaid = computed(() => props.order?.payment_status === PaymentStatus.UNPAID)
const notesAllergy = computed(
  () => props.order && getHighestNoteLevel(props.order.customer_notes) === 'allergy',
)

watch(
  () => props.modelValue,
  (v) => {
    if (v) selectedPayment.value = PaymentMethod.CASH
  },
)

const paymentOptions: { value: PaymentMethod; icon: typeof Banknote; label: string }[] = [
  { value: PaymentMethod.CASH, icon: Banknote, label: PAYMENT_METHOD_LABEL[PaymentMethod.CASH] },
  { value: PaymentMethod.WECHAT, icon: Check, label: PAYMENT_METHOD_LABEL[PaymentMethod.WECHAT] },
  { value: PaymentMethod.ALIPAY, icon: Check, label: PAYMENT_METHOD_LABEL[PaymentMethod.ALIPAY] },
]

async function onConfirm() {
  if (!props.order) return
  submitting.value = true
  try {
    const params = isUnpaid.value ? { payment_method: selectedPayment.value } : undefined
    await kitchen.closePickup(props.order.id, params?.payment_method)
    ElMessage.success({
      message: isUnpaid.value ? '已收款并交付' : '已交付',
      duration: 1800,
    })
    emit('update:modelValue', false)
  } catch (e) {
    const msg = e instanceof ApiException ? e.message : '操作失败'
    ElMessage.error(msg)
  } finally {
    submitting.value = false
  }
}

function close() {
  emit('update:modelValue', false)
}
</script>

<template>
  <ElDialog
    :model-value="modelValue"
    direction="rtl"
    size="480px"
    :show-close="true"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #header>
      <div class="dialog-header">
        <ShoppingBag :size="22" />
        <div>
          <h3>客户到店取货</h3>
          <p class="dialog-sub">订单 <span class="tnum">{{ order?.order_no }}</span></p>
        </div>
      </div>
    </template>

    <div class="pickup-body">
      <!-- 商品信息 -->
      <div class="product-block">
        <div class="product-info">
          <span class="product-name">{{ order?.menu_item.name }}</span>
          <span class="product-qty tnum">× {{ order?.quantity }}</span>
        </div>
        <div class="product-price tnum">{{ formatPrice(order?.total_price ?? 0) }}</div>
      </div>

      <!-- 备注提醒 -->
      <div v-if="order?.customer_notes.length" class="notes-block">
        <AlertTriangle v-if="notesAllergy" :size="14" />
        <span>{{ order.customer_notes.map(n => n.content).join('；') }}</span>
      </div>

      <!-- 分支：未付订单 -->
      <div v-if="isUnpaid" class="pay-branch">
        <div class="amount-row">
          <span>应收金额</span>
          <span class="amount-value tnum">{{ formatPrice(order?.total_price ?? 0) }}</span>
        </div>

        <div class="pay-method">
          <p class="pay-method-title">支付方式</p>
          <div class="pay-options">
            <button
              v-for="opt in paymentOptions"
              :key="opt.value"
              class="pay-option"
              :class="{ active: selectedPayment === opt.value }"
              :aria-pressed="selectedPayment === opt.value"
              @click="selectedPayment = opt.value"
            >
              <component :is="opt.icon" :size="18" />
              <span>{{ opt.label }}</span>
            </button>
          </div>
        </div>

        <div class="confirm-hint">
          <Check :size="14" />
          <span>点「收款并交付」后：状态 → 已完成、支付状态 → 已付、记录收款时间</span>
        </div>
      </div>

      <!-- 分支：已付订单 -->
      <div v-else class="paid-branch">
        <div class="paid-status">
          <Check :size="32" />
          <div>
            <p class="paid-amount">客户已付 <span class="tnum">{{ formatPrice(order?.total_price ?? 0) }}</span></p>
            <p class="paid-method">{{ PAYMENT_METHOD_LABEL[order?.payment_method!] }}</p>
          </div>
        </div>

        <div class="confirm-hint warn">
          <AlertTriangle :size="14" />
          <span>仅确认交付，不会再收款</span>
        </div>
      </div>
    </div>

    <template #footer>
      <button class="cancel-btn" :disabled="submitting" @click="close">取消</button>
      <button class="confirm-btn" :disabled="submitting" @click="onConfirm">
        <Loader2 v-if="submitting" :size="18" class="spin" />
        <span>{{ isUnpaid ? '确认收款并交付' : '确认交付' }}</span>
      </button>
    </template>
  </ElDialog>
</template>

<style scoped>
.dialog-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--status-ready-pickup);
}

.dialog-header h3 {
  margin: 0;
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--fg-primary);
}

.dialog-sub {
  margin: 2px 0 0;
  color: var(--fg-tertiary);
  font-size: var(--text-sm);
}

.pickup-body {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  padding: 0 var(--space-5) var(--space-3);
}

.product-block {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  background: var(--bg-muted);
  border-radius: var(--radius-md);
}

.product-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.product-name {
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--fg-primary);
}

.product-qty {
  font-size: var(--text-sm);
  color: var(--fg-secondary);
}

.product-price {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--brand-700);
}

.notes-block {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: var(--space-2) var(--space-3);
  background: var(--danger-bg);
  color: var(--danger-fg);
  border-radius: var(--radius-sm);
  border-left: 4px solid var(--danger);
  font-size: var(--text-sm);
  font-weight: 600;
}

.pay-branch,
.paid-branch {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.amount-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  background: var(--status-ready-pickup-bg);
  border-radius: var(--radius-md);
  color: var(--status-ready-pickup-fg);
}

.amount-value {
  font-size: var(--text-2xl);
  font-weight: 700;
}

.pay-method-title {
  margin: 0 0 var(--space-2);
  font-size: var(--text-sm);
  color: var(--fg-secondary);
}

.pay-options {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-2);
}

.pay-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: var(--space-3) var(--space-2);
  background: var(--bg-card);
  border: 2px solid var(--border-strong);
  border-radius: var(--radius-md);
  color: var(--fg-secondary);
  font-size: var(--text-sm);
  font-weight: 500;
  min-height: 72px;
  transition:
    border-color var(--dur-fast),
    background var(--dur-fast),
    color var(--dur-fast),
    transform var(--dur-fast);
}

.pay-option:hover {
  border-color: var(--brand-300);
  background: var(--brand-50);
}

.pay-option.active {
  border-color: var(--brand-500);
  background: var(--brand-100);
  color: var(--brand-700);
  transform: scale(1.02);
}

.confirm-hint {
  display: flex;
  align-items: flex-start;
  gap: 6px;
  padding: var(--space-2) var(--space-3);
  background: var(--status-ready-pickup-bg);
  color: var(--status-ready-pickup-fg);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
}

.confirm-hint.warn {
  background: var(--status-pending-bg);
  color: var(--status-pending-fg);
}

.paid-status {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-4);
  background: var(--status-ready-pickup-bg);
  color: var(--status-ready-pickup);
  border-radius: var(--radius-md);
}

.paid-amount {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: 600;
  color: var(--status-ready-pickup-fg);
}

.paid-method {
  margin: 2px 0 0;
  font-size: var(--text-sm);
  color: var(--status-ready-pickup-fg);
  opacity: 0.7;
}

.cancel-btn {
  height: 48px;
  padding: 0 var(--space-5);
  background: var(--bg-card);
  color: var(--fg-secondary);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  font-size: var(--text-base);
  font-weight: 500;
}

.cancel-btn:hover {
  background: var(--bg-muted);
}

.confirm-btn {
  height: 48px;
  padding: 0 var(--space-6);
  background: var(--status-ready-pickup);
  color: var(--fg-on-brand);
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--text-base);
  font-weight: 600;
  letter-spacing: 0.05em;
  padding-left: calc(var(--space-6) + 0.05em);
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
}

.confirm-btn:hover {
  filter: brightness(0.95);
}

.confirm-btn:active {
  transform: scale(0.97);
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
