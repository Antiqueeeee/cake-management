<script setup lang="ts">
/**
 * 断网降级横幅（技术方案 §8.7）
 *
 * - WebSocket 连续重试超 5 次未成功时显示
 * - 固定顶部红色横幅，提示后厨人工留意微信群接单消息
 * - 设置面板可关闭（不建议）
 * - 实际场景下由 useWebSocket 控制显示，原型期默认隐藏
 *
 * 注：设置面板内的横幅预览（SettingsDrawer.vue）是 drawer 内的小尺寸独立实例，
 * 与本组件定位不同（屏幕顶部全宽 vs drawer 内紧凑展示），分别维护合理。
 */
import { ref } from 'vue'
import { WifiOff, X } from 'lucide-vue-next'
import { useKitchenSettings } from '../composables/useKitchenSettings'

const settings = useKitchenSettings()

// 原型期：visible 由未来的 useWebSocket 接入后控制；当前默认隐藏
const visible = ref(false)

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
  background: linear-gradient(90deg, var(--danger), var(--danger-dark));
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
