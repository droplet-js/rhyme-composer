/** Webfont + 系统字体预设。中文优先；圆体 / 日文明朝等 Web 字库可能缺少数生僻字，由栈内黑体补足。 */

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
    id: 'hachi-maru-pop',
    label: '泡泡圆体 · Hachi Maru',
    stack:
      '"Hachi Maru Pop", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
  },
  {
    id: 'zen-maru-gothic',
    label: 'Zen Maru · 日系柔圆',
    stack:
      '"Zen Maru Gothic", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
  },
  {
    id: 'kosugi-maru',
    label: 'Kosugi Maru · 圆角黑体',
    stack:
      '"Kosugi Maru", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
  },
  {
    id: 'yuji-boku',
    label: 'Yuji Boku · 马克童趣',
    stack:
      '"Yuji Boku", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", serif',
  },
  {
    id: 'mochiy-pop-one',
    label: 'Mochiy Pop · 海报扁字',
    stack:
      '"Mochiy Pop One", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
  },
  {
    id: 'stick',
    label: 'Stick · 竖线趣味',
    stack:
      '"Stick", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
  },
  {
    id: 'reggae-one',
    label: 'Reggae One · 复古综艺',
    stack:
      '"Reggae One", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
  },
  {
    id: 'shippori-mincho-b1',
    label: 'Shippori Mincho · 明朝纸质',
    stack:
      '"Shippori Mincho B1", "Songti SC", "Noto Serif SC", "STSong", serif',
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
