<script setup lang="ts">
/**
 * Kitchen App 根组件
 * - 路由出口
 * - OfflineBanner（断网降级提示，全局）
 * - SettingsDrawer（提示音/Wake Lock/高亮时长/断网提示开关）
 */
import { onMounted } from 'vue'
import { RouterView } from 'vue-router'
import OfflineBanner from './components/OfflineBanner.vue'
import SettingsDrawer from './components/SettingsDrawer.vue'
import { provideEventBus } from './components/eventBus'
import { useKitchenSettings } from './composables/useKitchenSettings'
import { useWakeLock } from './composables/useWakeLock'

const bus = provideEventBus()
const settings = useKitchenSettings()
const wakeLock = useWakeLock()

onMounted(() => {
  // 平板常亮
  if (settings.wakeLockEnabled) {
    wakeLock.request()
  }
})
</script>

<template>
  <div class="kitchen-root">
    <OfflineBanner />
    <RouterView />
    <SettingsDrawer
      :model-value="bus.state.settingsOpen"
      @update:model-value="(v) => (v ? bus.openSettings() : bus.closeSettings())"
    />
  </div>
</template>

<style scoped>
.kitchen-root {
  height: 100dvh;
  width: 100vw;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  background: var(--bg-page);
}
</style>
