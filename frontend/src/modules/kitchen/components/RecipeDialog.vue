<script setup lang="ts">
/**
 * 配方查看弹窗（详细设计 §4.2.3）
 *
 * - 点商品名打开
 * - 原料清单 × 订单数量已乘好
 * - 制作步骤按步骤号展示
 * - 制作中显示 recipe_snapshot，待制作显示最新配方
 */
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { FlaskConical, ChefHat, ListOrdered, Soup } from 'lucide-vue-next'
import type { Order, RecipeSnapshot } from '@/shared/types/models'
import { useKitchenStore } from '../store'

const props = defineProps<{
  modelValue: boolean
  order: Order | null
}>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const kitchen = useKitchenStore()
const recipe = ref<RecipeSnapshot | null>(null)
const loading = ref(false)

watch(
  () => [props.modelValue, props.order?.id] as const,
  async ([visible, orderId]) => {
    if (!visible || !orderId || !props.order) {
      recipe.value = null
      return
    }
    loading.value = true
    try {
      recipe.value = await kitchen.getRecipe(props.order.menu_item.id, props.order.recipe_snapshot_id)
    } catch (e) {
      ElMessage.error('配方加载失败')
      console.error(e)
    } finally {
      loading.value = false
    }
  },
  { immediate: true },
)

/** 原料用量 × 订单数量 */
function scaledAmount(amount: number): string {
  const v = amount * (props.order?.quantity ?? 1)
  // 整数显示整数，小数保留 2 位（去尾零）
  return Number.isInteger(v) ? String(v) : v.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')
}
</script>

<template>
  <ElDialog
    :model-value="modelValue"
    direction="rtl"
    size="640px"
    :show-close="true"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #header>
      <div class="dialog-header">
        <FlaskConical :size="22" />
        <div>
          <h3>
            {{ order?.menu_item.name }}
            <span v-if="order?.menu_item.spec" class="dialog-title-spec">（{{ order.menu_item.spec }}）</span>
            配方
          </h3>
          <p v-if="recipe" class="dialog-sub">
            版本 v{{ recipe.version }}
            <span v-if="order?.recipe_snapshot_id" class="snapshot-tag">快照</span>
            <span v-else class="latest-tag">最新</span>
            · × {{ order?.quantity }} 数量已乘好
          </p>
        </div>
      </div>
    </template>

    <div v-loading="loading" class="recipe-body">
      <template v-if="recipe">
        <!-- 过敏原提醒（前置）-->
        <div v-if="recipe.allergens?.length" class="allergy-banner">
          <Soup :size="16" />
          <span>过敏原：{{ recipe.allergens.join('、') }}</span>
        </div>

        <!-- 原料清单 -->
        <section class="recipe-section">
          <header class="section-title">
            <ChefHat :size="18" />
            <span>原料清单</span>
          </header>
          <ul class="ingredient-list">
            <li v-for="(item, idx) in recipe.ingredients" :key="idx" class="ingredient-item">
              <span class="ingredient-name">{{ item.ingredient_name }}</span>
              <span class="ingredient-amount tnum">
                {{ scaledAmount(item.amount) }} {{ item.unit }}
              </span>
            </li>
          </ul>
        </section>

        <!-- 制作步骤 -->
        <section class="recipe-section">
          <header class="section-title">
            <ListOrdered :size="18" />
            <span>制作步骤</span>
          </header>
          <ol class="step-list">
            <li v-for="step in recipe.steps" :key="step.order" class="step-item">
              <span class="step-no tnum">{{ step.order }}</span>
              <div class="step-text">
                <p>{{ step.text }}</p>
                <p v-if="step.duration_min" class="step-duration">
                  <ChefHat :size="12" />
                  约 {{ step.duration_min }} 分钟
                </p>
              </div>
            </li>
          </ol>
        </section>
      </template>
    </div>

    <template #footer>
      <button class="dialog-close" @click="emit('update:modelValue', false)">关闭</button>
    </template>
  </ElDialog>
</template>

<style scoped>
.dialog-header {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  color: var(--brand-700);
}

.dialog-header h3 {
  margin: 0;
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--fg-primary);
}

.dialog-title-spec {
  color: var(--fg-secondary);
  font-weight: 400;
  font-size: var(--text-base);
}

.dialog-sub {
  margin: 2px 0 0;
  color: var(--fg-tertiary);
  font-size: var(--text-sm);
  display: flex;
  align-items: center;
  gap: var(--space-2);
}

.snapshot-tag,
.latest-tag {
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  font-size: var(--text-xs);
  font-weight: 600;
}

.snapshot-tag {
  background: var(--status-ready-delivery-bg);
  color: var(--status-ready-delivery-fg);
}

.latest-tag {
  background: var(--status-ready-pickup-bg);
  color: var(--status-ready-pickup-fg);
}

.recipe-body {
  min-height: 240px;
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  padding: 0 var(--space-5) var(--space-3);
}

.allergy-banner {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--danger-bg);
  color: var(--danger-fg);
  border-radius: var(--radius-md);
  border-left: 4px solid var(--danger);
  font-size: var(--text-sm);
  font-weight: 600;
}

.recipe-section {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.section-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--brand-700);
  padding-bottom: var(--space-2);
  border-bottom: 2px solid var(--brand-100);
}

.ingredient-list {
  list-style: none;
  margin: 0;
  padding: 0;
  background: var(--bg-muted);
  border-radius: var(--radius-md);
  overflow: hidden;
}

.ingredient-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  border-bottom: 1px solid var(--border-soft);
  font-size: var(--text-base);
}

.ingredient-item:last-child {
  border-bottom: none;
}

.ingredient-name {
  color: var(--fg-primary);
  font-weight: 500;
}

.ingredient-amount {
  color: var(--brand-700);
  font-weight: 700;
  font-size: var(--text-lg);
}

.step-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.step-item {
  display: flex;
  gap: var(--space-3);
  align-items: flex-start;
}

.step-no {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: var(--radius-pill);
  background: linear-gradient(135deg, var(--brand-400), var(--brand-600));
  color: var(--fg-on-brand);
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: var(--text-base);
}

.step-text {
  flex: 1;
  padding-top: 4px;
}

.step-text p {
  margin: 0;
  color: var(--fg-primary);
  font-size: var(--text-base);
  line-height: 1.5;
}

.step-duration {
  margin-top: 2px !important;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--fg-tertiary);
  font-size: var(--text-xs);
}

.dialog-close {
  height: 48px;
  padding: 0 var(--space-6);
  background: var(--brand-600);
  color: var(--fg-on-brand);
  border: none;
  border-radius: var(--radius-sm);
  font-size: var(--text-base);
  font-weight: 600;
  letter-spacing: 0.1em;
  padding-left: calc(var(--space-6) + 0.1em);
}

.dialog-close:hover {
  background: var(--brand-700);
}

.dialog-close:active {
  transform: scale(0.97);
}
</style>
