export type PageBackground = {
  /** Solid fill behind optional image */
  color: string
  /** Optional: pasted / uploaded image (data URL recommended for导出) */
  imageDataUrl?: string
  imageFit: 'cover' | 'contain' | 'center'
}

export type TextBlock = {
  id: string
  text: string
  /** 儿童 / 艺术字体预设（见 {@link FONT_PRESETS}） */
  fontPresetId: string
  /** Position as % of page box (0–100) */
  xPct: number
  yPct: number
  widthPct: number
  /** Font size in px at preview width (export uses same DOM, scales with scale) */
  fontSize: number
  lineHeight: number
  color: string
  textAlign: 'left' | 'center' | 'right'
  fontWeight: number
}

export type SongPage = {
  id: string
  /** 侧栏与编辑区显示的页面名（不参与画布内容，可自由起名） */
  pageName: string
  background: PageBackground
  /** 可为空（纯背景、插图或留白页） */
  blocks: TextBlock[]
  /** 是否在画布底部显示 {@link pageNumberDisplay}（默认关闭） */
  showPageNumber: boolean
  /**
   * 画布底部显示的页码文案，与页面在书中的顺序无关（如 3、Ⅲ、附录 2）。
   * 仅在 showPageNumber 为 true 且本字段去掉首尾空格后非空时渲染。
   */
  pageNumberDisplay: string
}

export type SongBook = {
  title: string
  pages: SongPage[]
}
