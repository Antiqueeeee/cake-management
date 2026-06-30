/**
 * Wake Lock（技术方案 §8.7 平板保障）
 *
 * - 防止平板自动息屏导致 WebSocket 断开
 * - 失焦 / 可见性切换 / 唤醒后自动重新申请
 * - 不支持 Wake Lock API 的浏览器静默降级（不阻塞业务）
 */
import { onMounted, onUnmounted } from 'vue'

/**
 * 模块级 sentinel：全局只有一份 wake lock。
 * App.vue（启动时常亮申请）和 SettingsDrawer（用户切换开关）共享同一引用，
 * 这是预期行为——用户视角「常亮」是一个全局开关，不应按组件分别持有。
 */
let sentinel: WakeLockSentinel | null = null

async function requestInternal() {
  try {
    if (!('wakeLock' in navigator)) return
    if (sentinel && !sentinel.released) return
    sentinel = await navigator.wakeLock.request('screen')
    sentinel.addEventListener('release', () => {
      sentinel = null
    })
  } catch {
    // 用户拒绝、电量低等情况：静默失败
  }
}

async function releaseInternal() {
  try {
    if (sentinel && !sentinel.released) {
      await sentinel.release()
      sentinel = null
    }
  } catch {
    // 静默
  }
}

function onVisibilityChange() {
  if (document.visibilityState === 'visible') {
    requestInternal()
  }
}

export function useWakeLock() {
  onMounted(() => {
    document.addEventListener('visibilitychange', onVisibilityChange)
  })

  onUnmounted(() => {
    document.removeEventListener('visibilitychange', onVisibilityChange)
  })

  return {
    request: requestInternal,
    release: releaseInternal,
  }
}

// 类型补丁：旧 TS lib 可能无 WakeLock
type WakeLockSentinel = {
  released: boolean
  addEventListener: (type: 'release', listener: () => void) => void
  release: () => Promise<void>
}
