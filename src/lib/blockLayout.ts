import type { TextBlock } from '../types/book'

/** 拖拽吸附：与页面宽/高的百分比差小于此值时对齐。 */
export const SNAP_THRESHOLD_PCT = 2.2

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

/** 按字号与行数估算块高度占页面高度的比例（用于对齐与吸附）。 */
export function estimateBlockHeightPct(
  block: TextBlock,
  pageHeightPx: number,
): number {
  if (pageHeightPx < 1) return 8
  const lines = Math.max(1, block.text.split('\n').length)
  const raw = ((lines * block.fontSize * block.lineHeight) / pageHeightPx) * 100
  return Math.max(4, Math.min(88, raw))
}

export function maxTopPctForBlock(
  block: TextBlock,
  pageHeightPx: number,
): number {
  const h = estimateBlockHeightPct(block, pageHeightPx)
  return Math.min(95, Math.max(0, 100 - h))
}

export type LayoutAlignKind =
  | 'left'
  | 'right'
  | 'h-center'
  | 'top'
  | 'bottom'
  | 'v-center'

export function applyLayoutAlign(
  block: TextBlock,
  kind: LayoutAlignKind,
  pageHeightPx: number,
): { xPct: number; yPct: number } {
  const w = block.widthPct
  const hEst = estimateBlockHeightPct(block, pageHeightPx)
  const maxY = maxTopPctForBlock(block, pageHeightPx)
  let xPct = block.xPct
  let yPct = block.yPct
  switch (kind) {
    case 'left':
      xPct = 0
      break
    case 'right':
      xPct = Math.max(0, 100 - w)
      break
    case 'h-center':
      xPct = clamp(50 - w / 2, 0, Math.max(0, 100 - w))
      break
    case 'top':
      yPct = 0
      break
    case 'bottom':
      yPct = maxY
      break
    case 'v-center':
      yPct = clamp(50 - hEst / 2, 0, maxY)
      break
  }
  return { xPct, yPct }
}

/** 将 `current` 与参照块 `reference` 的边或中心对齐（几何盒模型，基于估算高度）。 */
export type BlockPairAlignKind =
  | 'left-left'
  | 'right-right'
  | 'center-h'
  | 'top-top'
  | 'bottom-bottom'
  | 'center-v'

export function alignBlockRelativeToBlock(
  current: TextBlock,
  reference: TextBlock,
  kind: BlockPairAlignKind,
  pageHeightPx: number,
): { xPct: number; yPct: number } {
  const wA = current.widthPct
  const wB = reference.widthPct
  const hA = estimateBlockHeightPct(current, pageHeightPx)
  const hB = estimateBlockHeightPct(reference, pageHeightPx)
  const xB = reference.xPct
  const yB = reference.yPct
  const maxYA = maxTopPctForBlock(current, pageHeightPx)

  let x = current.xPct
  let y = current.yPct

  switch (kind) {
    case 'left-left':
      x = xB
      break
    case 'right-right':
      x = xB + wB - wA
      break
    case 'center-h':
      x = xB + wB / 2 - wA / 2
      break
    case 'top-top':
      y = yB
      break
    case 'bottom-bottom':
      y = yB + hB - hA
      break
    case 'center-v':
      y = yB + hB / 2 - hA / 2
      break
  }

  x = clamp(x, 0, Math.max(0, 100 - wA))
  y = clamp(y, 0, maxYA)
  return { xPct: x, yPct: y }
}

export function resolvePairReferenceBlock(
  blocks: TextBlock[],
  currentId: string,
  preferredRefId: string | null,
): TextBlock | null {
  const others = blocks.filter((b) => b.id !== currentId)
  if (others.length === 0) return null
  if (preferredRefId) {
    const hit = others.find((b) => b.id === preferredRefId)
    if (hit) return hit
  }
  return others[0] ?? null
}
