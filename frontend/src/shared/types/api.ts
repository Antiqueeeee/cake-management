/**
 * 后端统一响应格式（技术方案 §5.4）
 */

export interface ApiSuccess<T> {
  data: T
  error: null
}

export interface ApiError {
  data: null
  error: {
    code: string
    message: string
    details?: Record<string, unknown>
  }
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

/** 错误码（详细设计 §3.6） */
export const ErrorCode = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  RATE_LIMITED: 'RATE_LIMITED',
  AUTH_LOCKED: 'AUTH_LOCKED',
  ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
  ORDER_STATUS_CONFLICT: 'ORDER_STATUS_CONFLICT',
  MENU_NOT_AVAILABLE: 'MENU_NOT_AVAILABLE',
  INGREDIENT_SHORTAGE: 'INGREDIENT_SHORTAGE',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]

export class ApiException extends Error {
  code: string
  details?: Record<string, unknown>
  httpStatus?: number

  constructor(code: string, message: string, details?: Record<string, unknown>, httpStatus?: number) {
    super(message)
    this.code = code
    this.details = details
    this.httpStatus = httpStatus
    this.name = 'ApiException'
  }
}
