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
    id: 'kiwi-maru',
    label: 'Kiwi Maru · 猕猴桃圆',
    stack:
      '"Kiwi Maru", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
  },
  {
    id: 'yuji-syuku',
    label: 'Yuji Syuku · 隶感毛笔',
    stack:
      '"Yuji Syuku", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", serif',
  },
  {
    id: 'yuji-mai',
    label: 'Yuji Mai · 软笔马克',
    stack:
      '"Yuji Mai", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", serif',
  },
  {
    id: 'mochiy-pop-p-one',
    label: 'Mochiy Pop P · 粗扁海报',
    stack:
      '"Mochiy Pop P One", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
  },
  {
    id: 'potta-one',
    label: 'Potta One · 膨胀圆角',
    stack:
      '"Potta One", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
  },
  {
    id: 'train-one',
    label: 'Train One · 宽匾招牌',
    stack:
      '"Train One", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
  },
  {
    id: 'rocknroll-one',
    label: 'RocknRoll One · 横笔波普',
    stack:
      '"RocknRoll One", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
  },
  {
    id: 'dela-gothic-one',
    label: 'Dela Gothic · 极粗竖长',
    stack:
      '"Dela Gothic One", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
  },
  {
    id: 'dotgothic16',
    label: 'DotGothic16 · 点阵复古',
    stack:
      '"DotGothic16", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
  },
  {
    id: 'kaisei-decol',
    label: 'Kaisei Decol · 装饰明朝',
    stack:
      '"Kaisei Decol", "Songti SC", "Noto Serif SC", "STSong", serif',
  },
  {
    id: 'shippori-antique-b1',
    label: 'Shippori Antique · 古拙明朝',
    stack:
      '"Shippori Antique B1", "Songti SC", "Noto Serif SC", "STSong", serif',
  },
  {
    id: 'sawarabi-mincho',
    label: 'Sawarabi Mincho · 纤细明朝',
    stack:
      '"Sawarabi Mincho", "Songti SC", "Noto Serif SC", "STSong", serif',
  },
  {
    id: 'sawarabi-gothic',
    label: 'Sawarabi Gothic · 纤细黑体',
    stack:
      '"Sawarabi Gothic", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
  },
  {
    id: 'new-tegomin',
    label: 'New Tegomin · 墨线明朝',
    stack:
      '"New Tegomin", "Songti SC", "Noto Serif SC", "STSong", serif',
  },
  {
    id: 'biz-udp-mincho',
    label: 'BIZ UDP 明朝 · 印刷宋体',
    stack:
      '"BIZ UDPMincho", "Songti SC", "Noto Serif SC", "STSong", serif',
  },
  {
    id: 'biz-udp-gothic',
    label: 'BIZ UDP 哥特 · 印刷黑体',
    stack:
      '"BIZ UDPGothic", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
  },
  {
    id: 'kosugi',
    label: 'Kosugi · 清爽黑体',
    stack:
      '"Kosugi", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif',
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
