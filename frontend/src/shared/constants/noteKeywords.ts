/**
 * 备注关键词列表（详细设计 §4.1.10、§4.2.2 共享）
 *
 * 设计要点：
 * - 纯前端按 content 派生高亮，不入库（customer_note 表无 priority 字段，对齐 §1.2.4）
 * - 机器人接单流程同样按这些关键词识别并强制提示店员
 * - 维护在本文件，前后端共享（后端在文档约束下另行实现）
 */

/** 过敏 / 忌口类：卡片头部红色横条 + ⚠ 图标，最高优先级 */
export const ALLERGY_KEYWORDS: readonly string[] = [
  '过敏',
  '忌口',
  '不能吃',
  '不吃',
  '不要放',
  '不要加',
  '糖尿病',
  '孕妇',
  '宝宝',
  '婴儿',
  '小孩',
  ' gluten',
] as const

/** 加急类：卡片角标黄色提醒 */
export const URGENT_KEYWORDS: readonly string[] = ['加急', '急', '尽快', '马上', 'ASAP'] as const

export type NoteHighlightLevel = 'allergy' | 'urgent' | 'normal'

/**
 * 判定备注的高亮级别
 * 多个关键词命中时按「过敏 > 加急 > 普通」优先级
 */
export function getNoteHighlight(content: string): NoteHighlightLevel {
  if (!content) return 'normal'
  if (ALLERGY_KEYWORDS.some((kw) => content.includes(kw))) return 'allergy'
  if (URGENT_KEYWORDS.some((kw) => content.includes(kw))) return 'urgent'
  return 'normal'
}

/** 取订单所有备注里最高级别，用于卡片头部红条是否显示 */
export function getHighestNoteLevel(notes: { content: string }[]): NoteHighlightLevel {
  if (notes.length === 0) return 'normal'
  const levels = notes.map((n) => getNoteHighlight(n.content))
  if (levels.includes('allergy')) return 'allergy'
  if (levels.includes('urgent')) return 'urgent'
  return 'normal'
}
