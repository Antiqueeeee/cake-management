/**
 * 跨组件事件总线（简易 provide/inject 实现）
 * 用于设置面板的全局开关：任意组件 emit 'open-settings'，SettingsDrawer 监听
 */
import { reactive, inject, provide, readonly } from 'vue'

interface KitchenEventState {
  settingsOpen: boolean
}

const KEY = Symbol('kitchen-event-bus')

export function provideEventBus() {
  const state = reactive<KitchenEventState>({ settingsOpen: false })
  const api = {
    state: readonly(state),
    openSettings() {
      state.settingsOpen = true
    },
    closeSettings() {
      state.settingsOpen = false
    },
  }
  provide(KEY, api)
  return api
}

export function useEventBus() {
  const api = inject(KEY) as ReturnType<typeof provideEventBus> | undefined
  if (!api) {
    // 兜底：返回 no-op，避免 App 之外用时报错（实际不会发生）
    return {
      state: readonly(reactive({ settingsOpen: false })),
      openSettings: () => {},
      closeSettings: () => {},
    }
  }
  return api
}
