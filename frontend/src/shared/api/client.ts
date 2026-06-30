/**
 * HTTP 客户端
 * 单一可信源：详细设计 §4.3.1
 *
 * - session cookie 浏览器自动管理，前端不读不写 token（避免 XSS）
 * - 401 拦截器统一跳登录页
 * - 错误统一抛 ApiException，调用方按 code 处理
 */
import axios, { type AxiosInstance } from 'axios'
import { ApiException, ErrorCode } from '@/shared/types/api'

let onUnauthorized: () => void = () => {}

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler
}

export const httpClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  withCredentials: true,
  timeout: 10000,
})

httpClient.interceptors.response.use(
  (res) => {
    // 后端统一格式 { data, error: null }
    if (res.data && typeof res.data === 'object' && 'error' in res.data) {
      if (res.data.error) {
        const { code, message, details } = res.data.error
        throw new ApiException(code, message, details, res.status)
      }
      return res.data.data
    }
    return res.data
  },
  (err) => {
    if (err.response?.status === 401) {
      onUnauthorized()
    }
    const body = err.response?.data?.error
    if (body) {
      throw new ApiException(body.code, body.message, body.details, err.response.status)
    }
    if (err.response?.status === 429) {
      throw new ApiException(ErrorCode.RATE_LIMITED, '请求过于频繁，请稍后再试', undefined, 429)
    }
    throw new ApiException(
      ErrorCode.INTERNAL_ERROR,
      err.message || '网络异常，请检查网络连接',
      undefined,
      err.response?.status,
    )
  },
)
