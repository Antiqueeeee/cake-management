<script setup lang="ts">
/**
 * 顶部栏（详细设计 §4.2.2）
 *
 * - 店名 + 当前日期 + 实时时钟
 * - 提示音开关 / 设置 / Wake Lock 开关
 * - display_name（操作人来源）
 * - 退出登录
 */
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  Volume2,
  VolumeX,
  Settings,
  Sun,
  LogOut,
} from 'lucide-vue-next'
import { useAuthStore, useKitchenStore } from '../store'
import { useKitchenSettings } from '../composables/useKitchenSettings'
import { formatClock, formatDate } from '@/shared/utils/format'
import { useEventBus } from './eventBus'

const auth = useAuthStore()
const kitchen = useKitchenStore()
const router = useRouter()
const settings = useKitchenSettings()
const bus = useEventBus()

const now = ref(new Date())
let timer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  timer = setInterval(() => (now.value = new Date()), 1000)
})
onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const pendingCount = computed(() =>
  kitchen.orders.filter((o) => o.status === 'PENDING').length,
)

async function onLogout() {
  await auth.logout()
  kitchen.stopNewOrderWatch()
  router.replace('/kitchen/login')
}

function toggleSound() {
  settings.soundEnabled = !settings.soundEnabled
  ElMessage({
    message: settings.soundEnabled ? '已开启提示音' : '已关闭提示音',
    type: 'info',
    duration: 1500,
  })
}

function openSettings() {
  bus.openSettings()
}
</script>

<template>
  <header class="app-header">
    <div class="header-left">
      <div class="brand">
        <div class="brand-mark">
          <Sun :size="22" />
        </div>
        <div class="brand-text">
          <h1 class="brand-title">小蛋糕店 · 后厨屏</h1>
          <p class="brand-sub">{{ formatDate(now) }}</p>
        </div>
      </div>
    </div>

    <div class="header-center">
      <div class="clock tnum">{{ formatClock(now) }}</div>
    </div>

    <div class="header-right">
      <div v-if="pendingCount > 0" class="pending-badge">
        <span class="pulse-dot" aria-hidden="true" />
        待制作 {{ pendingCount }}
      </div>

      <button
        class="icon-btn"
        :class="{ active: settings.soundEnabled, inactive: !settings.soundEnabled }"
        :aria-label="settings.soundEnabled ? '关闭提示音' : '开启提示音'"
        :aria-pressed="settings.soundEnabled"
        @click="toggleSound"
      >
        <Volume2 v-if="settings.soundEnabled" :size="22" />
        <VolumeX v-else :size="22" />
      </button>

      <button
        class="icon-btn"
        aria-label="打开设置"
        @click="openSettings"
      >
        <Settings :size="22" />
      </button>

      <div class="user-block">
        <div class="user-info">
          <span class="user-name">{{ auth.user?.display_name }}</span>
          <span class="user-role">后厨</span>
        </div>
        <button class="icon-btn logout-btn" aria-label="退出登录" @click="onLogout">
          <LogOut :size="20" />
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
.app-header {
  flex-shrink: 0;
  height: 76px;
  background: linear-gradient(180deg, var(--bg-card) 0%, var(--bg-page) 100%);
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  padding: 0 var(--space-5);
  gap: var(--space-5);
  box-shadow: 0 1px 4px rgba(124, 45, 18, 0.05);
  position: relative;
  z-index: var(--z-header);
}

.header-left {
  flex: 1;
}

.brand {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.brand-mark {
  width: 44px;
  height: 44px;
  border-radius: var(--radius-md);
  background: linear-gradient(135deg, var(--brand-400), var(--brand-600));
  color: var(--fg-on-brand);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 8px rgba(234, 88, 12, 0.25);
}

.brand-title {
  margin: 0;
  font-size: var(--text-lg);
  font-weight: 700;
  color: var(--fg-primary);
}

.brand-sub {
  margin: 0;
  font-size: var(--text-sm);
  color: var(--fg-secondary);
}

.header-center {
  flex: 0 0 auto;
}

.clock {
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--brand-700);
  letter-spacing: 0.04em;
  background: var(--brand-100);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-md);
  font-variant-numeric: tabular-nums;
}

.header-right {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-3);
}

.pending-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--status-pending-bg);
  color: var(--status-pending-fg);
  border-radius: var(--radius-pill);
  font-size: var(--text-sm);
  font-weight: 600;
}

.pulse-dot {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-pill);
  background: var(--status-pending);
  box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7);
  animation: dot-pulse 1.6s var(--ease-in-out) infinite;
}

@keyframes dot-pulse {
  0% {
    box-shadow: 0 0 0 0 rgba(245, 158, 11, 0.7);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(245, 158, 11, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(245, 158, 11, 0);
  }
}

.icon-btn {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  background: var(--bg-card);
  color: var(--fg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    background var(--dur-fast) var(--ease-out),
    color var(--dur-fast) var(--ease-out),
    border-color var(--dur-fast);
}

.icon-btn:hover {
  background: var(--bg-muted);
  color: var(--fg-primary);
}

.icon-btn.active {
  background: var(--brand-100);
  color: var(--brand-700);
  border-color: var(--brand-300);
}

.icon-btn.inactive {
  background: var(--bg-muted);
  color: var(--fg-tertiary);
}

.user-block {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding-left: var(--space-2);
  border-left: 1px solid var(--border);
}

.user-info {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

.user-name {
  font-size: var(--text-base);
  font-weight: 600;
  color: var(--fg-primary);
  line-height: 1.2;
}

.user-role {
  font-size: var(--text-xs);
  color: var(--fg-tertiary);
}

.logout-btn:hover {
  background: var(--danger-bg);
  color: var(--danger);
  border-color: var(--danger-border);
}
</style>
