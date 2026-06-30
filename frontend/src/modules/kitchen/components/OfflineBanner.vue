<script setup lang="ts">
/**
 * 断网降级横幅（技术方案 §8.7）
 *
 * - WebSocket 连续重试超 5 次未成功时显示
 * - 固定顶部红色横幅，提示后厨人工留意微信群接单消息
 * - 设置面板可关闭（不建议）
 * - 实际场景下由 useWebSocket 控制显示，原型期默认隐藏
 */
import { ref, onMounted, onUnmounted } from 'vue'
import { WifiOff, X } from 'lucide-vue-next'
import { useKitchenSettings } from '../composables/useKitchenSettings'

const settings = useKitchenSettings()

// 原型期：5 秒后短暂模拟一次断网横幅以演示效果
// 真实场景由 useWebSocket 控制
const visible = ref(false)
let demoTimer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  if (!settings.offlineBannerEnabled) return
  // 不演示，让用户在设置面板手动触发开关时看到效果
})

onUnmounted(() => {
  if (demoTimer) clearTimeout(demoTimer)
})

/** 外部可调用：手动触发横幅显示（用于演示与设置面板测试） */
defineExpose({
  showDemo() {
    if (!settings.offlineBannerEnabled) return
    visible.value = true
    if (demoTimer) clearTimeout(demoTimer)
    demoTimer = setTimeout(() => {
      visible.value = false
    }, 8000)
  },
  hide() {
    visible.value = false
  },
})

function dismiss() {
  visible.value = false
}
</script>

<template>
  <transition name="banner">
    <div v-if="visible && settings.offlineBannerEnabled" class="offline-banner" role="alert">
      <WifiOff :size="20" />
      <div class="banner-text">
        <strong>网络异常 · WebSocket 已断开，正在重连…</strong>
        <span>请人工留意微信群接单消息，状态变更通过群内同步</span>
      </div>
      <button class="banner-close" aria-label="关闭横幅" @click="dismiss">
        <X :size="18" />
      </button>
    </div>
  </transition>
</template>

<style scoped>
.offline-banner {
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-5);
  background: linear-gradient(90deg, var(--danger), #B91C1C);
  color: white;
  font-size: var(--text-base);
  position: relative;
  z-index: var(--z-banner);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.banner-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.banner-text strong {
  font-size: var(--text-base);
  font-weight: 600;
}

.banner-text span {
  font-size: var(--text-sm);
  opacity: 0.9;
}

.banner-close {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-sm);
  background: transparent;
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.banner-close:hover {
  background: rgba(255, 255, 255, 0.15);
}

.banner-enter-active,
.banner-leave-active {
  transition:
    transform var(--dur-base) var(--ease-out),
    opacity var(--dur-base);
  overflow: hidden;
}

.banner-enter-from,
.banner-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
