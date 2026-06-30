<script setup lang="ts">
/**
 * 设置面板（技术方案 §8.13）
 *
 * 持久化在 localStorage（后厨屏单人使用，固定平板）
 * - 提示音开关
 * - 提示音音量（0-100）
 * - Wake Lock 开关（屏幕常亮）
 * - 高亮持续时间（10-120 秒，默认 30）
 * - 断网降级提示开关
 */
import { ref } from 'vue'
import {
  Volume2,
  Sun,
  Highlighter,
  TriangleAlert,
  WifiOff,
  X,
} from 'lucide-vue-next'
import { useKitchenSettings } from '../composables/useKitchenSettings'
import { useWakeLock } from '../composables/useWakeLock'
import { previewNotification } from '../composables/useNotification'

defineProps<{
  modelValue: boolean
}>()
const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

const settings = useKitchenSettings()
const wakeLock = useWakeLock()

/** 横幅预览：8 秒后自动消失，仅用于在设置面板内确认开关效果 */
const previewBanner = ref(false)
let previewTimer: ReturnType<typeof setTimeout> | null = null

function close() {
  emit('update:modelValue', false)
}

function onWakeLockChange(v: string | number | boolean) {
  settings.wakeLockEnabled = Boolean(v)
  if (v) {
    wakeLock.request()
  } else {
    wakeLock.release()
  }
}

function onTestSound() {
  previewNotification()
}

function onTestOffline() {
  previewBanner.value = true
  if (previewTimer) clearTimeout(previewTimer)
  previewTimer = setTimeout(() => {
    previewBanner.value = false
  }, 8000)
}

function dismissPreview() {
  previewBanner.value = false
  if (previewTimer) clearTimeout(previewTimer)
}
</script>

<template>
  <ElDrawer
    :model-value="modelValue"
    direction="rtl"
    size="420px"
    :with-header="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="settings-panel">
      <header class="panel-header">
        <h2>后厨屏设置</h2>
        <p>设置仅保存在本机平板，更换平板需重新设置</p>
      </header>

      <section class="setting-group">
        <div class="group-title">
          <Volume2 :size="18" />
          <span>提示音</span>
        </div>
        <div class="setting-item">
          <div class="setting-label">
            <span>启用提示音</span>
            <span class="setting-hint">新订单到达时播放短促「叮」</span>
          </div>
          <ElSwitch v-model="settings.soundEnabled" size="large" />
        </div>
        <div class="setting-item column">
          <div class="setting-label">
            <span>音量</span>
            <span class="setting-hint tnum">{{ settings.soundVolume }}%</span>
          </div>
          <ElSlider v-model="settings.soundVolume" :min="0" :max="100" :step="5" :show-tooltip="false" />
          <button class="test-btn" @click="onTestSound">试听</button>
        </div>
      </section>

      <section class="setting-group">
        <div class="group-title">
          <Sun :size="18" />
          <span>屏幕</span>
        </div>
        <div class="setting-item">
          <div class="setting-label">
            <span>屏幕常亮（防息屏）</span>
            <span class="setting-hint">使用 Wake Lock API，平板不会自动锁屏</span>
          </div>
          <ElSwitch :model-value="settings.wakeLockEnabled" size="large" @update:model-value="onWakeLockChange" />
        </div>
      </section>

      <section class="setting-group">
        <div class="group-title">
          <Highlighter :size="18" />
          <span>新订单高亮</span>
        </div>
        <div class="setting-item column">
          <div class="setting-label">
            <span>高亮持续时间</span>
            <span class="setting-hint tnum">{{ settings.highlightSeconds }} 秒</span>
          </div>
          <ElSlider v-model="settings.highlightSeconds" :min="10" :max="120" :step="5" :show-tooltip="false" :marks="{ 10: '10s', 30: '30s', 60: '60s', 120: '120s' }" />
          <p class="setting-tip">过短可能错过；过长干扰后续订单视觉</p>
        </div>
      </section>

      <section class="setting-group">
        <div class="group-title">
          <TriangleAlert :size="18" />
          <span>断网提示</span>
        </div>
        <div class="setting-item">
          <div class="setting-label">
            <span>断网时显示红色横幅</span>
            <span class="setting-hint">不建议关闭——关闭后断网期间无任何感知</span>
          </div>
          <ElSwitch v-model="settings.offlineBannerEnabled" size="large" />
        </div>
        <button class="test-btn full" @click="onTestOffline">预览横幅效果（8 秒后自动消失）</button>
      </section>

      <footer class="panel-footer">
        <button class="close-btn" @click="close">完成</button>
      </footer>
    </div>

    <!-- 设置面板内的横幅预览（独立实例，8 秒后自动消失）-->
    <transition name="banner-fade">
      <div v-if="previewBanner" class="offline-banner-preview" role="alert">
        <WifiOff :size="20" />
        <div class="banner-text">
          <strong>网络异常 · WebSocket 已断开，正在重连…</strong>
          <span>请人工留意微信群接单消息，状态变更通过群内同步</span>
        </div>
        <button class="banner-close" aria-label="关闭横幅" @click="dismissPreview">
          <X :size="18" />
        </button>
      </div>
    </transition>
  </ElDrawer>
</template>

<style scoped>
.settings-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: var(--space-5) var(--space-5) var(--space-4);
  background: var(--bg-page);
  gap: var(--space-5);
  overflow-y: auto;
}

.panel-header h2 {
  margin: 0;
  font-size: var(--text-xl);
  font-weight: 700;
  color: var(--fg-primary);
}

.panel-header p {
  margin: var(--space-1) 0 0;
  color: var(--fg-tertiary);
  font-size: var(--text-xs);
}

.setting-group {
  background: var(--bg-card);
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  border: 1px solid var(--border-soft);
}

.group-title {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  color: var(--brand-700);
  font-size: var(--text-base);
  font-weight: 600;
  padding-bottom: var(--space-2);
  border-bottom: 1px solid var(--border-soft);
}

.setting-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-3);
  min-height: 48px;
}

.setting-item.column {
  flex-direction: column;
  align-items: stretch;
  gap: var(--space-2);
}

.setting-label {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.setting-label > span:first-child {
  font-size: var(--text-base);
  color: var(--fg-primary);
  font-weight: 500;
}

.setting-hint {
  color: var(--fg-tertiary);
  font-size: var(--text-xs);
}

.setting-tip {
  margin: 0;
  color: var(--fg-tertiary);
  font-size: var(--text-xs);
}

.test-btn {
  align-self: flex-start;
  padding: var(--space-2) var(--space-4);
  background: var(--brand-100);
  color: var(--brand-700);
  border: 1px solid var(--brand-300);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  font-weight: 500;
  min-height: 40px;
  transition:
    background var(--dur-fast),
    transform var(--dur-fast);
}

.test-btn:hover {
  background: var(--brand-200);
}

.test-btn:active {
  transform: scale(0.97);
}

.test-btn.full {
  align-self: stretch;
  background: var(--danger-bg);
  color: var(--danger-fg);
  border-color: var(--danger-border);
}

.panel-footer {
  margin-top: auto;
  padding-top: var(--space-4);
}

.close-btn {
  width: 100%;
  height: 56px;
  background: var(--brand-600);
  color: var(--fg-on-brand);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-lg);
  font-weight: 600;
  letter-spacing: 0.08em;
  padding-left: 0.08em;
}

.close-btn:hover {
  background: var(--brand-700);
}

.close-btn:active {
  transform: scale(0.98);
}

/* 横幅预览（与 OfflineBanner 视觉一致，但仅渲染在 drawer 内） */
.offline-banner-preview {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  gap: var(--space-3);
  padding: var(--space-3) var(--space-4);
  background: linear-gradient(90deg, var(--danger), var(--danger-dark));
  color: white;
  z-index: var(--z-banner);
}

.offline-banner-preview .banner-text {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.offline-banner-preview .banner-text strong {
  font-size: var(--text-sm);
  font-weight: 600;
}

.offline-banner-preview .banner-text span {
  font-size: var(--text-xs);
  opacity: 0.9;
}

.offline-banner-preview .banner-close {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  background: transparent;
  border: none;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.offline-banner-preview .banner-close:hover {
  background: rgba(255, 255, 255, 0.15);
}

.banner-fade-enter-active,
.banner-fade-leave-active {
  transition:
    transform var(--dur-base) var(--ease-out),
    opacity var(--dur-base);
}

.banner-fade-enter-from,
.banner-fade-leave-to {
  transform: translateY(-100%);
  opacity: 0;
}
</style>
