/**
 * 后厨屏本地设置（技术方案 §8.13）
 *
 * - 提示音开关 + 音量
 * - Wake Lock 开关
 * - 高亮持续时间（默认 30 秒，可调 10-120 秒）
 * - 断网降级提示开关
 *
 * 持久化：localStorage（后厨屏单人使用、固定平板）
 */
import { reactive, watch } from 'vue'

const STORAGE_KEY = 'kitchen_settings_v1'

interface KitchenSettings {
  /** 提示音开关 */
  soundEnabled: boolean
  /** 提示音音量 0-100 */
  soundVolume: number
  /** 屏幕常亮（Wake Lock）*/
  wakeLockEnabled: boolean
  /** 新订单高亮持续时间（秒） */
  highlightSeconds: number
  /** 断网降级横幅开关 */
  offlineBannerEnabled: boolean
}

const DEFAULT: KitchenSettings = {
  soundEnabled: true,
  soundVolume: 70,
  wakeLockEnabled: true,
  highlightSeconds: 30,
  offlineBannerEnabled: true,
}

function load(): KitchenSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT }
    return { ...DEFAULT, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT }
  }
}

const state = reactive<KitchenSettings>(load())

watch(
  state,
  (val) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
    } catch {
      // 隐私模式 / 容量超限时静默失败
    }
  },
  { deep: true },
)

export function useKitchenSettings() {
  return state
}

export type { KitchenSettings }
