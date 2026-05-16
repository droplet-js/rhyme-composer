/** Webfont + 系统字体预设，用于 {@link SongPage} 内文字块。均为中文（简体）可用的显示字体。 */

export const FONT_PRESETS = [
  {
    id: 'songti',
    label: '宋体 · 系统经典',
    stack:
      '"Songti SC", "STSong", "Noto Serif SC", "Source Han Serif SC", serif',
  },
  {
    id: 'noto-sans-sc',
    label: '思源黑体 · 清晰现代',
    stack: '"Noto Sans SC", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
  },
  {
    id: 'noto-serif-sc',
    label: '思源宋体 · 阅读正文',
    stack: '"Noto Serif SC", "Songti SC", "STSong", "Source Han Serif SC", serif',
  },
  {
    id: 'zcool-kuaile',
    label: '站酷快乐体 · 卡通标题',
    stack: '"ZCOOL KuaiLe", "PingFang SC", "Hiragino Sans GB", sans-serif',
  },
  {
    id: 'zcool-huangyou',
    label: '站酷黄油体 · 圆润粗字',
    stack:
      '"ZCOOL QingKe HuangYou", "PingFang SC", "Hiragino Sans GB", sans-serif',
  },
  {
    id: 'zcool-xiaowei',
    label: '站酷小薇体 · 轻盈手写',
    stack: '"ZCOOL XiaoWei", "PingFang SC", "Hiragino Sans GB", serif',
  },
  {
    id: 'wdxl-lubrifont-sc',
    label: '润滑体 · 综艺圆厚',
    stack: '"WDXL Lubrifont SC", "PingFang SC", "Hiragino Sans GB", sans-serif',
  },
  {
    id: 'lxgw-wenkai-tc',
    label: '霞鹜文楷 · 温润楷书',
    stack: '"LXGW WenKai TC", "Kaiti SC", "STKaiti", serif',
  },
  {
    id: 'ma-shan-zheng',
    label: '马善政毛笔楷书',
    stack: '"Ma Shan Zheng", "Kaiti SC", "STKaiti", serif',
  },
  {
    id: 'liu-jian-mao-cao',
    label: '刘建毛草 · 奔放毛笔',
    stack: '"Liu Jian Mao Cao", "Kaiti SC", "STKaiti", cursive',
  },
  {
    id: 'zhi-mang-xing',
    label: '志莽行 · 硬笔手写',
    stack: '"Zhi Mang Xing", "Kaiti SC", "STKaiti", serif',
  },
  {
    id: 'long-cang',
    label: '龙仓行书 · 流畅手写',
    stack: '"Long Cang", "Kaiti SC", "STKaiti", serif',
  },
] as const

export type FontPresetId = (typeof FONT_PRESETS)[number]['id']

const PRESET_IDS = new Set<string>(FONT_PRESETS.map((p) => p.id))

const DEFAULT_ID: FontPresetId = 'songti'

const STACK_BY_ID = Object.fromEntries(
  FONT_PRESETS.map((p) => [p.id, p.stack]),
) as Record<FontPresetId, string>

/** 持久化/导入时：未知或已下线 id 回退为默认，避免下拉框与渲染不一致。 */
export function normalizeFontPresetId(id: string | undefined): FontPresetId {
  if (id && PRESET_IDS.has(id)) return id as FontPresetId
  return DEFAULT_ID
}

export function fontStackForPreset(id: string | undefined): string {
  if (id && id in STACK_BY_ID) return STACK_BY_ID[id as FontPresetId]
  return STACK_BY_ID[DEFAULT_ID]
}

export function defaultFontPresetId(): FontPresetId {
  return DEFAULT_ID
}
