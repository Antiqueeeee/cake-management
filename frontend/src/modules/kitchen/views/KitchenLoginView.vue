<script setup lang="ts">
/**
 * 后厨屏登录页 /kitchen/login（详细设计 §4.2.1）
 *
 * - 6 位 PIN 码：自动 focus 第一格、输完跳下一格、输满自动提交
 * - 删除键回跳、整段粘贴自动分发
 * - PIN 错 5 次锁 10 分钟：后端返回 429，前端展示「请在 X 分钟后再试」（mock 用固定提示）
 * - client_type=kitchen（隐藏字段），session 7 天
 * - 登录后跳 /kitchen/board
 * - 同步解锁音频自动播放（点屏幕满足浏览器策略）
 */
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ShieldCheck, Loader2 } from 'lucide-vue-next'
import { useAuthStore } from '../store'
import { ApiException, ErrorCode } from '@/shared/types/api'
import { unlockAudio } from '../composables/useNotification'
import { startAutoNewOrder } from '../service'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const PIN_LENGTH = 6
const digits = ref<string[]>(Array(PIN_LENGTH).fill(''))
const inputRefs = ref<HTMLInputElement[]>([])
const errorMessage = ref('')
const shaking = ref(false)
const submitting = ref(false)

const lockedUntil = ref<Date | null>(null)
const lockTick = ref(0)
let lockTimer: ReturnType<typeof setInterval> | null = null
let shakeTimer: ReturnType<typeof setTimeout> | null = null

onMounted(() => {
  nextTick(() => inputRefs.value[0]?.focus())
})

onUnmounted(() => {
  if (lockTimer) clearInterval(lockTimer)
  if (shakeTimer) clearTimeout(shakeTimer)
})

function currentFilled(): number {
  return digits.value.filter((d) => d !== '').length
}

function focusAt(i: number) {
  nextTick(() => inputRefs.value[i]?.focus())
}

function onInput(i: number, e: Event) {
  const raw = (e.target as HTMLInputElement).value
  // 取最后一位有效数字（避免浏览器自动补全）
  const last = raw.replace(/\D/g, '').slice(-1)
  digits.value[i] = last
  errorMessage.value = ''
  if (last) {
    if (i < PIN_LENGTH - 1) {
      focusAt(i + 1)
    } else {
      // 输满自动提交
      submit()
    }
  }
}

function onKeydown(i: number, e: KeyboardEvent) {
  if (e.key === 'Backspace' && !digits.value[i] && i > 0) {
    e.preventDefault()
    digits.value[i - 1] = ''
    focusAt(i - 1)
  } else if (e.key === 'ArrowLeft' && i > 0) {
    e.preventDefault()
    focusAt(i - 1)
  } else if (e.key === 'ArrowRight' && i < PIN_LENGTH - 1) {
    e.preventDefault()
    focusAt(i + 1)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    submit()
  }
}

function onPaste(e: ClipboardEvent) {
  e.preventDefault()
  const text = e.clipboardData?.getData('text') || ''
  const nums = text.replace(/\D/g, '').slice(0, PIN_LENGTH).split('')
  for (let i = 0; i < PIN_LENGTH; i++) {
    digits.value[i] = nums[i] || ''
  }
  const filled = currentFilled()
  if (filled === PIN_LENGTH) {
    submit()
  } else {
    focusAt(filled)
  }
}

function shakeAndClear() {
  shaking.value = true
  if (shakeTimer) clearTimeout(shakeTimer)
  shakeTimer = setTimeout(() => (shaking.value = false), 400)
  digits.value = Array(PIN_LENGTH).fill('')
  focusAt(0)
}

function lockMinutes(): number {
  if (!lockedUntil.value) return 0
  // 每秒触发响应式更新
  void lockTick.value
  const ms = lockedUntil.value.getTime() - Date.now()
  return Math.max(0, Math.ceil(ms / 60000))
}

async function submit() {
  if (submitting.value) return
  if (lockedUntil.value && lockedUntil.value.getTime() > Date.now()) {
    errorMessage.value = `账号已锁定，请 ${lockMinutes()} 分钟后再试`
    return
  }
  const pin = digits.value.join('')
  if (pin.length !== PIN_LENGTH) {
    errorMessage.value = '请输入完整 6 位 PIN 码'
    focusAt(pin.length)
    return
  }
  // 解锁音频：本次手势将解锁后厨屏后续的提示音播放（浏览器自动播放策略）
  unlockAudio()
  submitting.value = true
  errorMessage.value = ''
  try {
    await auth.login(pin)
    // 启动新单自动推送（mock）
    startAutoNewOrder()
    const redirect = (route.query.redirect as string) || '/kitchen/board'
    router.replace(redirect)
  } catch (e) {
    if (e instanceof ApiException) {
      if (e.code === ErrorCode.RATE_LIMITED || e.code === ErrorCode.AUTH_LOCKED) {
        const minutes = (e.details?.minutes as number) || 10
        lockedUntil.value = new Date(Date.now() + minutes * 60000)
        errorMessage.value = `PIN 错误次数过多，请 ${minutes} 分钟后再试`
        if (!lockTimer) {
          lockTimer = setInterval(() => {
            lockTick.value++
            if (lockMinutes() === 0) {
              if (lockTimer) clearInterval(lockTimer)
              lockTimer = null
              lockedUntil.value = null
              errorMessage.value = ''
            }
          }, 1000)
        }
      } else {
        errorMessage.value = e.message
        shakeAndClear()
      }
    } else {
      errorMessage.value = '登录失败，请重试'
      shakeAndClear()
    }
  } finally {
    submitting.value = false
  }
}

function onOverlayClick() {
  // 用户点屏幕：解锁音频自动播放（首次手势满足浏览器策略）
  unlockAudio()
  focusAt(currentFilled())
}
</script>

<template>
  <div class="login-page" @click="onOverlayClick">
    <div class="login-card">
      <header class="login-header">
        <div class="brand-icon">
          <ShieldCheck :size="40" />
        </div>
        <h1 class="login-title">小蛋糕店后厨屏</h1>
        <p class="login-subtitle">输入 6 位 PIN 码开始接单</p>
      </header>

      <div
        class="pin-row"
        :class="{ 'is-shaking': shaking, 'is-error': !!errorMessage }"
        @click.stop
      >
        <input
          v-for="(_, i) in digits"
          :key="i"
          :ref="(el) => { if (el) inputRefs[i] = el as HTMLInputElement }"
          v-model="digits[i]"
          type="password"
          inputmode="numeric"
          pattern="[0-9]*"
          autocomplete="off"
          maxlength="1"
          :aria-label="`PIN 码第 ${i + 1} 位`"
          class="pin-cell tnum"
          :class="{ filled: digits[i] !== '' }"
          @input="onInput(i, $event)"
          @keydown="onKeydown(i, $event)"
          @paste="onPaste($event)"
        />
      </div>

      <transition name="fade">
        <p v-if="errorMessage" class="error-message">
          {{ errorMessage }}
        </p>
      </transition>

      <button
        class="submit-btn"
        :disabled="submitting || (lockedUntil !== null && lockMinutes() > 0)"
        @click.stop="submit"
      >
        <Loader2 v-if="submitting" :size="22" class="spin" />
        <span>{{ submitting ? '登录中…' : '登 录' }}</span>
      </button>

      <footer class="login-footer">
        <p class="hint">原型演示 PIN：<span class="tnum demo-pin">123456</span></p>
        <p class="hint hint-secondary">session 有效期 7 天 · 平板单人使用</p>
      </footer>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-6);
  background:
    radial-gradient(1200px 600px at 50% -10%, var(--brand-100) 0%, transparent 60%),
    radial-gradient(800px 400px at 90% 90%, var(--status-ready-pickup-bg) 0%, transparent 55%),
    var(--bg-page);
}

.login-card {
  width: 100%;
  max-width: 520px;
  background: var(--bg-card);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-modal);
  padding: var(--space-7) var(--space-6);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-5);
}

.login-header {
  text-align: center;
}

.brand-icon {
  width: 80px;
  height: 80px;
  margin: 0 auto var(--space-3);
  border-radius: var(--radius-pill);
  background: linear-gradient(135deg, var(--brand-500), var(--brand-700));
  color: var(--fg-on-brand);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8px 16px rgba(234, 88, 12, 0.3);
}

.login-title {
  margin: 0;
  font-size: var(--text-2xl);
  font-weight: 700;
  color: var(--fg-primary);
  letter-spacing: 0.02em;
}

.login-subtitle {
  margin: var(--space-2) 0 0;
  color: var(--fg-secondary);
  font-size: var(--text-base);
}

.pin-row {
  display: flex;
  gap: var(--space-2);
  justify-content: center;
}

.pin-row.is-shaking {
  animation: shake-error 0.4s var(--ease-in-out);
}

.pin-cell {
  width: 64px;
  height: 72px;
  text-align: center;
  font-size: var(--text-3xl);
  font-weight: 600;
  color: var(--brand-700);
  background: var(--bg-muted);
  border: 2px solid var(--border-strong);
  border-radius: var(--radius-md);
  outline: none;
  transition:
    border-color var(--dur-fast) var(--ease-out),
    background var(--dur-fast) var(--ease-out),
    box-shadow var(--dur-fast) var(--ease-out),
    transform var(--dur-fast) var(--ease-out);
}

.pin-cell:focus {
  border-color: var(--brand-500);
  background: var(--bg-card);
  box-shadow: 0 0 0 4px rgba(249, 115, 22, 0.18);
}

.pin-cell.filled {
  background: var(--bg-card);
  border-color: var(--brand-300);
}

.pin-row.is-error .pin-cell {
  border-color: var(--danger);
}

.error-message {
  margin: 0;
  padding: var(--space-2) var(--space-3);
  background: var(--danger-bg);
  color: var(--danger-fg);
  border-radius: var(--radius-sm);
  font-size: var(--text-sm);
  text-align: center;
  max-width: 100%;
}

.submit-btn {
  width: 100%;
  height: 64px;
  background: linear-gradient(135deg, var(--brand-500), var(--brand-700));
  color: var(--fg-on-brand);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--text-xl);
  font-weight: 600;
  letter-spacing: 0.5em;
  padding-left: 0.5em;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  box-shadow: 0 6px 14px rgba(234, 88, 12, 0.25);
  transition:
    transform var(--dur-fast) var(--ease-out),
    box-shadow var(--dur-fast) var(--ease-out),
    opacity var(--dur-fast) var(--ease-out);
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(234, 88, 12, 0.32);
}

.submit-btn:active:not(:disabled) {
  transform: translateY(0);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.login-footer {
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: var(--space-1);
}

.hint {
  margin: 0;
  color: var(--fg-tertiary);
  font-size: var(--text-sm);
}

.hint-secondary {
  font-size: var(--text-xs);
}

.demo-pin {
  color: var(--brand-700);
  font-weight: 600;
  background: var(--brand-100);
  padding: 2px 8px;
  border-radius: var(--radius-sm);
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--dur-fast) var(--ease-out);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
