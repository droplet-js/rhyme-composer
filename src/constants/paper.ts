/** ISO A4 split along long edge: two pages per portrait A4, or side‑by‑side on landscape A4. */
export const HALF_A4_MM = {
  width: 148.5,
  height: 210,
} as const

/** ISO A4 portrait — one logical page per PDF page in「普通 PDF」导出。 */
export const A4_PORTRAIT_MM = {
  width: 210,
  height: 297,
} as const

export const A4_LANDSCAPE_MM = {
  width: 297,
  height: 210,
} as const

/** Preview width (px); height derived from aspect ratio. */
export const PAGE_PREVIEW_WIDTH_PX = 420

const HALF_PAGE_W_BY_H = 148.5 / 210

/** Pixel height matching half‑A4 aspect ratio at preview width. */
export function pagePreviewHeightPx(): number {
  return Math.round(PAGE_PREVIEW_WIDTH_PX / HALF_PAGE_W_BY_H)
}
