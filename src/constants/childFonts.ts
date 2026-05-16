/** Webfont + 系统字体预设，用于 {@link SongPage} 内文字块。 */

export const FONT_PRESETS = [
  {
    id: 'songti',
    label: '宋体 · 经典正文',
    stack:
      '"Songti SC", "STSong", "Noto Serif SC", "Source Han Serif SC", serif',
  },
  {
    id: 'zcool-kuaile',
    label: '站酷快乐体 · 卡通',
    stack: '"ZCOOL KuaiLe", "PingFang SC", "Hiragino Sans GB", sans-serif',
  },
  {
    id: 'zcool-huangyou',
    label: '黄油体 · 圆润粗字',
    stack:
      '"ZCOOL QingKe HuangYou", "PingFang SC", "Hiragino Sans GB", sans-serif',
  },
  {
    id: 'zcool-xiaowei',
    label: '站酷小薇 · 轻盈手写',
    stack: '"ZCOOL XiaoWei", "PingFang SC", "Hiragino Sans GB", serif',
  },
  {
    id: 'zen-maru-gothic',
    label: 'Zen Maru Gothic · 日系圆柔',
    stack: '"Zen Maru Gothic", "PingFang SC", "Hiragino Sans GB", sans-serif',
  },
  {
    id: 'ma-shan-zheng',
    label: '马善政楷书 · 毛笔感',
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
    label: '龙仓 · 行书',
    stack: '"Long Cang", "Kaiti SC", "STKaiti", serif',
  },
  {
    id: 'yuji-boku',
    label: 'Yuji Boku · 童稚俏皮',
    stack: '"Yuji Boku", "PingFang SC", "Hiragino Sans GB", serif',
  },
  {
    id: 'hachi-maru-pop',
    label: 'Hachi Maru Pop · 泡泡圆体',
    stack: '"Hachi Maru Pop", "PingFang SC", "Hiragino Sans GB", sans-serif',
  },
  {
    id: 'kosugi-maru',
    label: 'Kosugi Maru · 日系圆体',
    stack: '"Kosugi Maru", "PingFang SC", "Hiragino Sans GB", sans-serif',
  },
  {
    id: 'stick',
    label: 'Stick · 竖条趣味',
    stack: '"Stick", "PingFang SC", "Hiragino Sans GB", sans-serif',
  },
  {
    id: 'fredoka',
    label: 'Fredoka · 圆角英文',
    stack: '"Fredoka", "PingFang SC", "Hiragino Sans GB", sans-serif',
  },
  {
    id: 'nunito',
    label: 'Nunito · 亲和圆角',
    stack: '"Nunito", "PingFang SC", "Hiragino Sans GB", sans-serif',
  },
  {
    id: 'comfortaa',
    label: 'Comfortaa · 几何圆润',
    stack: '"Comfortaa", "PingFang SC", "Hiragino Sans GB", sans-serif',
  },
  {
    id: 'baloo2',
    label: 'Baloo 2 · 印度童趣',
    stack: '"Baloo 2", "PingFang SC", "Hiragino Sans GB", sans-serif',
  },
  {
    id: 'chewy',
    label: 'Chewy · 软糖趣味',
    stack: '"Chewy", "PingFang SC", "Hiragino Sans GB", sans-serif',
  },
  {
    id: 'bubblegum-sans',
    label: 'Bubblegum · 泡泡糖',
    stack: '"Bubblegum Sans", "PingFang SC", "Hiragino Sans GB", sans-serif',
  },
  {
    id: 'patrick-hand',
    label: 'Patrick Hand · 手帐体',
    stack: '"Patrick Hand", "PingFang SC", "Hiragino Sans GB", cursive',
  },
  {
    id: 'amatic-sc',
    label: 'Amatic SC · 窄条艺术',
    stack: '"Amatic SC", "PingFang SC", "Hiragino Sans GB", sans-serif',
  },
  {
    id: 'luckiest-guy',
    label: 'Luckiest Guy · 美式漫画',
    stack: '"Luckiest Guy", "PingFang SC", "Hiragino Sans GB", cursive',
  },
] as const

export type FontPresetId = (typeof FONT_PRESETS)[number]['id']

const DEFAULT_ID: FontPresetId = 'songti'

const STACK_BY_ID = Object.fromEntries(
  FONT_PRESETS.map((p) => [p.id, p.stack]),
) as Record<FontPresetId, string>

export function fontStackForPreset(id: string | undefined): string {
  if (id && id in STACK_BY_ID) return STACK_BY_ID[id as FontPresetId]
  return STACK_BY_ID[DEFAULT_ID]
}

export function defaultFontPresetId(): FontPresetId {
  return DEFAULT_ID
}
