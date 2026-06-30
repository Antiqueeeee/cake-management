/**
 * 提示音播放（技术方案 §8.9 决策）
 *
 * - 用预置 mp3 短促「叮」声，不读商品名、不读数量、不读取货时间
 * - 浏览器自动播放策略：首次用户交互后才允许播放
 *   → 登录时引导「点一下屏幕开始接单」触发首次触摸
 * - 音量随 useKitchenSettings 实时调整
 */
import { useKitchenSettings } from './useKitchenSettings'

let audio: HTMLAudioElement | null = null

function ensureAudio(): HTMLAudioElement | null {
  if (audio) return audio
  try {
    audio = new Audio('/sounds/notification.mp3')
    audio.preload = 'auto'
    return audio
  } catch {
    return null
  }
}

/**
 * 播放新订单提示音
 * 失败（自动播放限制、文件缺失）静默降级——屏幕高亮仍是兜底
 */
export function playNotification(): void {
  const settings = useKitchenSettings()
  if (!settings.soundEnabled) return
  const a = ensureAudio()
  if (!a) return
  try {
    a.volume = Math.max(0, Math.min(1, settings.soundVolume / 100))
    a.currentTime = 0
    const promise = a.play()
    if (promise && typeof promise.catch === 'function') {
      promise.catch(() => {
        // 自动播放被阻止：屏幕高亮已兜底
      })
    }
  } catch {
    // 静默
  }
}

/**
 * 测试提示音（设置面板用，绕过 soundEnabled）
 */
export function previewNotification(): void {
  const a = ensureAudio()
  if (!a) return
  try {
    const settings = useKitchenSettings()
    a.volume = Math.max(0, Math.min(1, settings.soundVolume / 100))
    a.currentTime = 0
    a.play().catch(() => {})
  } catch {
    // 静默
  }
}

/**
 * 解锁音频自动播放（首次用户交互时调用）
 * 浏览器策略要求 audio.play() 必须在用户手势同步上下文里被调用过一次
 */
export function unlockAudio(): void {
  const a = ensureAudio()
  if (!a) return
  try {
    a.muted = true
    a.play()
      .then(() => {
        a.muted = false
        a.pause()
        a.currentTime = 0
      })
      .catch(() => {
        a.muted = false
      })
  } catch {
    // 静默
  }
}
